import React from 'react';
import { useNavigate } from 'react-router-dom';
import { RequestAccessModal } from '../../features/invitations/RequestAccessModal';
import { useWithdrawAccessRequest } from '../../features/invitations/api';
import { useAccessRequestStore } from '../../store';
import { ROUTES } from '../../constants';

interface AccessRequestBannerProps {
    projectId: number;
}

// "project_developer" → "Developer"
const roleLabel = (role: string) => role.replace(/^project_/, '').replace(/^\w/, (c) => c.toUpperCase());

/**
 * ADR-024 Part B: shown on the project detail page in place of the generic
 * error when the current user lacks access (a 403 from useProject). There's
 * no backend endpoint for a requester to check their request's live status
 * (the list endpoint is admin-only), so "already requested" below reflects
 * only what this browser submitted — not whether it's since been approved,
 * rejected, or expired.
 */
export const AccessRequestBanner: React.FC<AccessRequestBannerProps> = ({ projectId }) => {
    const navigate = useNavigate();
    const [modalOpen, setModalOpen] = React.useState(false);
    const pending = useAccessRequestStore((s) => s.byProjectId[projectId]);
    const clearRequest = useAccessRequestStore((s) => s.clearRequest);
    const withdrawRequest = useWithdrawAccessRequest(projectId);

    const handleWithdraw = () => {
        if (!pending) return;
        withdrawRequest.mutate(pending.requestId, {
            onSuccess: () => clearRequest(projectId),
        });
    };

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <div
                className="rounded-lg px-4 py-4 text-sm"
                style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}
            >
                <p className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                    You don't have access to this project.
                </p>

                {pending ? (
                    <>
                        <p style={{ color: 'var(--text-muted)' }}>
                            You requested {roleLabel(pending.suggestedRole)} access on{' '}
                            {new Date(pending.submittedAt).toLocaleDateString()}. A project admin needs to approve it
                            before you can view this project.
                        </p>
                        {withdrawRequest.isError && (
                            <p className="mt-2" style={{ color: 'var(--error)' }}>
                                Failed to withdraw the request. Try again.
                            </p>
                        )}
                        <div className="flex items-center gap-3 mt-3">
                            <button
                                type="button"
                                onClick={handleWithdraw}
                                disabled={withdrawRequest.isPending}
                                className="px-3 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50"
                                style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
                            >
                                {withdrawRequest.isPending ? 'Withdrawing…' : 'Withdraw request'}
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate(ROUTES.PROJECTS)}
                                className="text-sm underline"
                                style={{ color: 'var(--text-secondary)' }}
                            >
                                Back to Projects
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <p style={{ color: 'var(--text-muted)' }}>
                            Ask a project admin to add you, or submit a request below.
                        </p>
                        <div className="flex items-center gap-3 mt-3">
                            <button
                                type="button"
                                onClick={() => setModalOpen(true)}
                                className="px-3 py-1.5 rounded-lg text-sm font-medium"
                                style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
                            >
                                Request access
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate(ROUTES.PROJECTS)}
                                className="text-sm underline"
                                style={{ color: 'var(--text-secondary)' }}
                            >
                                Back to Projects
                            </button>
                        </div>
                    </>
                )}
            </div>

            <RequestAccessModal isOpen={modalOpen} onClose={() => setModalOpen(false)} projectId={projectId} />
        </div>
    );
};
