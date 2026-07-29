import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '../../../test/test-utils';
import { RequestAccessModal } from '../RequestAccessModal';

const mutate = vi.fn();
const recordRequest = vi.fn();

vi.mock('../api', () => ({
    useCreateAccessRequest: () => ({ mutate, isPending: false }),
}));

vi.mock('../../../store', () => ({
    useAccessRequestStore: (selector: any) => selector({ recordRequest }),
}));

const onClose = vi.fn();

beforeEach(() => {
    mutate.mockClear();
    recordRequest.mockClear();
    onClose.mockClear();
});

describe('RequestAccessModal', () => {
    it('submits the suggested role and reason', () => {
        render(<RequestAccessModal isOpen projectId={3} onClose={onClose} />);

        fireEvent.change(screen.getByLabelText('Suggested role'), { target: { value: 'project_developer' } });
        fireEvent.change(screen.getByPlaceholderText(/joining the team/i), { target: { value: 'need write access' } });
        fireEvent.click(screen.getByRole('button', { name: /submit request/i }));

        expect(mutate).toHaveBeenCalledTimes(1);
        expect(mutate.mock.calls[0][0]).toEqual({ suggestedRole: 'project_developer', reason: 'need write access' });
    });

    it('records the request and closes on success', () => {
        mutate.mockImplementation((_vars, { onSuccess }) => {
            onSuccess({ id: 99, suggestedRole: 'project_viewer' });
        });

        render(<RequestAccessModal isOpen projectId={3} onClose={onClose} />);
        fireEvent.click(screen.getByRole('button', { name: /submit request/i }));

        expect(recordRequest).toHaveBeenCalledWith(3, 99, 'project_viewer');
        expect(onClose).toHaveBeenCalled();
    });

    it('shows the server error message on failure', () => {
        mutate.mockImplementation((_vars, { onError }) => {
            onError({ response: { data: { message: 'Request already pending' } } });
        });

        render(<RequestAccessModal isOpen projectId={3} onClose={onClose} />);
        fireEvent.click(screen.getByRole('button', { name: /submit request/i }));

        expect(screen.getByText('Request already pending')).toBeInTheDocument();
    });
});
