import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

// ADR-024 Part B: tracks access requests the current browser has submitted,
// keyed by project ID. There is no backend endpoint for a requester to list
// or check the status of their own request (the list endpoint is admin-only,
// and there's no cross-project "mine" query) — this is a best-effort local
// record of "did I already ask," not a live status. It only ever reflects
// what this browser submitted; it says nothing about approval/rejection that
// may have happened since.

interface PendingAccessRequest {
    requestId: number;
    suggestedRole: string;
    submittedAt: string;
}

interface AccessRequestState {
    // project ID -> the last request submitted from this browser
    byProjectId: Record<number, PendingAccessRequest>;
    recordRequest: (projectId: number, requestId: number, suggestedRole: string) => void;
    clearRequest: (projectId: number) => void;
}

export const useAccessRequestStore = create<AccessRequestState>()(
    devtools(
        persist(
            (set) => ({
                byProjectId: {},
                recordRequest: (projectId, requestId, suggestedRole) =>
                    set((state) => ({
                        byProjectId: {
                            ...state.byProjectId,
                            [projectId]: { requestId, suggestedRole, submittedAt: new Date().toISOString() },
                        },
                    })),
                clearRequest: (projectId) =>
                    set((state) => {
                        const next = { ...state.byProjectId };
                        delete next[projectId];
                        return { byProjectId: next };
                    }),
            }),
            {
                name: 'keyorix-access-requests',
                partialize: (state) => ({ byProjectId: state.byProjectId }),
            }
        ),
        { name: 'access-request-store' }
    )
);
