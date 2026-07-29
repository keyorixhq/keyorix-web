import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '../../../test/test-utils';
import { AccessRequestBanner } from '../AccessRequestBanner';

const mutate = vi.fn();
const clearRequest = vi.fn();
let byProjectId: Record<number, { requestId: number; suggestedRole: string; submittedAt: string }> = {};

vi.mock('../../../features/invitations/api', () => ({
    useWithdrawAccessRequest: () => ({ mutate, isPending: false, isError: false }),
}));

vi.mock('../../../features/invitations/RequestAccessModal', () => ({
    RequestAccessModal: ({ isOpen }: { isOpen: boolean }) => (isOpen ? <div>request-modal-open</div> : null),
}));

vi.mock('../../../store', () => ({
    useAccessRequestStore: (selector: any) => selector({ byProjectId, clearRequest }),
}));

beforeEach(() => {
    mutate.mockClear();
    clearRequest.mockClear();
    byProjectId = {};
});

describe('AccessRequestBanner', () => {
    it('shows a Request access button when no request has been submitted', () => {
        render(<AccessRequestBanner projectId={3} />);

        expect(screen.getByText("You don't have access to this project.")).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Request access' })).toBeInTheDocument();
    });

    it('opens the request dialog on click', () => {
        render(<AccessRequestBanner projectId={3} />);
        fireEvent.click(screen.getByRole('button', { name: 'Request access' }));
        expect(screen.getByText('request-modal-open')).toBeInTheDocument();
    });

    it('shows the already-requested state with a withdraw action', () => {
        byProjectId = { 3: { requestId: 42, suggestedRole: 'project_developer', submittedAt: '2026-07-01T00:00:00Z' } };

        render(<AccessRequestBanner projectId={3} />);

        expect(screen.getByText(/You requested Developer access on/)).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Request access' })).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: /withdraw request/i })).toBeInTheDocument();
    });

    it('withdraws and clears the local record on confirm', () => {
        byProjectId = { 3: { requestId: 42, suggestedRole: 'project_developer', submittedAt: '2026-07-01T00:00:00Z' } };
        mutate.mockImplementation((_id, { onSuccess }) => onSuccess());

        render(<AccessRequestBanner projectId={3} />);
        fireEvent.click(screen.getByRole('button', { name: /withdraw request/i }));

        expect(mutate).toHaveBeenCalledWith(42, expect.any(Object));
        expect(clearRequest).toHaveBeenCalledWith(3);
    });
});
