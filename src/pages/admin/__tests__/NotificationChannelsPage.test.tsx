import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within, act } from '../../../test/test-utils';
import { NotificationChannelsPage } from '../NotificationChannelsPage';

const mocks = vi.hoisted(() => ({
    createMutate: vi.fn(),
    createReset: vi.fn(),
    updateMutate: vi.fn(),
    updateReset: vi.fn(),
    deleteMutate: vi.fn(),
    deleteReset: vi.fn(),
    setRetryPolicyMutate: vi.fn(),
}));

const state = vi.hoisted(() => ({
    channels: { data: undefined as any, isLoading: false, error: null as unknown },
    retryPolicy: { data: undefined as any, isLoading: false },
    createMutation: { isPending: false, isError: false },
    updateMutation: { isPending: false, isError: false },
    deleteMutation: { isPending: false, isError: false },
    setRetryPolicyMutation: { isPending: false, isError: false },
}));

vi.mock('../../../features/admin', () => ({
    useNotificationChannels: () => state.channels,
    useCreateNotificationChannel: () => ({
        mutate: mocks.createMutate,
        reset: mocks.createReset,
        ...state.createMutation,
    }),
    useUpdateNotificationChannel: () => ({
        mutate: mocks.updateMutate,
        reset: mocks.updateReset,
        ...state.updateMutation,
    }),
    useDeleteNotificationChannel: () => ({
        mutate: mocks.deleteMutate,
        reset: mocks.deleteReset,
        ...state.deleteMutation,
    }),
    useRetryPolicy: () => state.retryPolicy,
    useSetRetryPolicy: () => ({ mutate: mocks.setRetryPolicyMutate, ...state.setRetryPolicyMutation }),
}));

const webhookChannel = {
    id: 1,
    name: 'platform-alerts',
    type: 'webhook',
    enabled: true,
    url: 'https://hooks.example.com/platform',
    email: '',
    events: 'secret.rotated,anomaly.detected',
    created_by: 'admin',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
};

const emailChannel = {
    id: 2,
    name: 'security-digest',
    type: 'email',
    enabled: false,
    url: '',
    email: 'security@example.com',
    events: '',
    created_by: 'admin',
    created_at: '2026-01-02T00:00:00Z',
    updated_at: '2026-01-02T00:00:00Z',
};

function resetState() {
    state.channels = { data: undefined, isLoading: false, error: null };
    state.retryPolicy = { data: undefined, isLoading: false };
    state.createMutation = { isPending: false, isError: false };
    state.updateMutation = { isPending: false, isError: false };
    state.deleteMutation = { isPending: false, isError: false };
    state.setRetryPolicyMutation = { isPending: false, isError: false };
}

beforeEach(() => {
    vi.clearAllMocks();
    resetState();
});

describe('NotificationChannelsPage — channels list', () => {
    it('shows a loading spinner while channels are loading', () => {
        state.channels.isLoading = true;
        render(<NotificationChannelsPage />);
        expect(document.querySelector('.animate-spin')).toBeTruthy();
    });

    it('shows an error state when channels fail to load', () => {
        state.channels.error = new Error('boom');
        render(<NotificationChannelsPage />);
        expect(screen.getByText('Failed to load notification channels. Please try again.')).toBeInTheDocument();
    });

    it('shows an empty state when there are no channels', () => {
        state.channels.data = [];
        render(<NotificationChannelsPage />);
        expect(screen.getByText('No notification channels yet. Create one to get started.')).toBeInTheDocument();
    });

    it('renders channel rows with name, type, target, events, and status', () => {
        state.channels.data = [webhookChannel, emailChannel];
        render(<NotificationChannelsPage />);

        const rows = screen.getAllByRole('row');
        const webhookRow = within(rows[1]!);
        expect(webhookRow.getByText('platform-alerts')).toBeInTheDocument();
        expect(webhookRow.getByText('webhook')).toBeInTheDocument();
        expect(webhookRow.getByText('https://hooks.example.com/platform')).toBeInTheDocument();
        expect(webhookRow.getByText('secret.rotated')).toBeInTheDocument();
        expect(webhookRow.getByText('anomaly.detected')).toBeInTheDocument();
        expect(webhookRow.getByText('Enabled')).toBeInTheDocument();

        const emailRow = within(rows[2]!);
        expect(emailRow.getByText('security-digest')).toBeInTheDocument();
        expect(emailRow.getByText('security@example.com')).toBeInTheDocument();
        expect(emailRow.getByText('None')).toBeInTheDocument();
        expect(emailRow.getByText('Disabled')).toBeInTheDocument();
    });
});

describe('NotificationChannelsPage — create channel', () => {
    beforeEach(() => {
        state.channels.data = [webhookChannel];
    });

    it('disables Create until a name is entered, then submits a webhook payload', () => {
        render(<NotificationChannelsPage />);
        fireEvent.click(screen.getByRole('button', { name: /new channel/i }));

        const dialog = screen.getByRole('dialog');
        expect(within(dialog).getByRole('button', { name: 'Create' })).toBeDisabled();

        fireEvent.change(within(dialog).getByLabelText('Name'), { target: { value: 'new-channel' } });
        fireEvent.change(within(dialog).getByLabelText('Webhook URL'), {
            target: { value: 'https://hooks.example.com/new' },
        });
        fireEvent.click(within(dialog).getByLabelText('secret.rotated'));
        expect(within(dialog).getByRole('button', { name: 'Create' })).toBeEnabled();

        fireEvent.click(within(dialog).getByRole('button', { name: 'Create' }));
        expect(mocks.createMutate).toHaveBeenCalledWith(
            {
                name: 'new-channel',
                type: 'webhook',
                enabled: true,
                events: 'secret.rotated',
                url: 'https://hooks.example.com/new',
            },
            expect.objectContaining({ onSuccess: expect.any(Function) })
        );
    });

    it('switches to an email field and submits an email payload when type is Email', () => {
        render(<NotificationChannelsPage />);
        fireEvent.click(screen.getByRole('button', { name: /new channel/i }));

        const dialog = screen.getByRole('dialog');
        fireEvent.change(within(dialog).getByLabelText('Name'), { target: { value: 'digest' } });
        fireEvent.change(within(dialog).getByLabelText('Type'), { target: { value: 'email' } });
        expect(within(dialog).queryByLabelText('Webhook URL')).not.toBeInTheDocument();
        fireEvent.change(within(dialog).getByLabelText('Recipient email'), {
            target: { value: 'digest@example.com' },
        });

        fireEvent.click(within(dialog).getByRole('button', { name: 'Create' }));
        expect(mocks.createMutate).toHaveBeenCalledWith(
            { name: 'digest', type: 'email', enabled: true, events: '', email: 'digest@example.com' },
            expect.objectContaining({ onSuccess: expect.any(Function) })
        );
    });

    it('closes the modal on successful create', () => {
        render(<NotificationChannelsPage />);
        fireEvent.click(screen.getByRole('button', { name: /new channel/i }));
        fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'new-channel' } });
        fireEvent.click(screen.getByRole('button', { name: 'Create' }));

        const onSuccess = mocks.createMutate.mock.calls[0]![1].onSuccess;
        act(() => onSuccess());
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('shows an error message when create fails', () => {
        state.createMutation.isError = true;
        render(<NotificationChannelsPage />);
        fireEvent.click(screen.getByRole('button', { name: /new channel/i }));
        expect(screen.getByText('Failed to create channel. Please try again.')).toBeInTheDocument();
    });
});

describe('NotificationChannelsPage — edit channel', () => {
    beforeEach(() => {
        state.channels.data = [webhookChannel];
    });

    it('prefills the edit modal from the selected channel and submits changes', () => {
        render(<NotificationChannelsPage />);
        fireEvent.click(screen.getByTitle('Edit channel'));

        const dialog = screen.getByRole('dialog');
        expect(within(dialog).getByDisplayValue('platform-alerts')).toBeInTheDocument();
        expect(within(dialog).getByLabelText('secret.rotated')).toBeChecked();
        expect(within(dialog).getByLabelText('secret.expiring')).not.toBeChecked();

        fireEvent.change(within(dialog).getByLabelText('Name'), { target: { value: 'platform-alerts-v2' } });
        fireEvent.click(within(dialog).getByRole('button', { name: 'Save' }));

        expect(mocks.updateMutate).toHaveBeenCalledWith(
            {
                id: 1,
                body: {
                    name: 'platform-alerts-v2',
                    type: 'webhook',
                    enabled: true,
                    events: 'secret.rotated,anomaly.detected',
                    url: 'https://hooks.example.com/platform',
                },
            },
            expect.objectContaining({ onSuccess: expect.any(Function) })
        );
    });

    it('shows an error message when update fails', () => {
        state.updateMutation.isError = true;
        render(<NotificationChannelsPage />);
        fireEvent.click(screen.getByTitle('Edit channel'));
        expect(screen.getByText('Failed to update channel. Please try again.')).toBeInTheDocument();
    });
});

describe('NotificationChannelsPage — delete channel', () => {
    beforeEach(() => {
        state.channels.data = [webhookChannel];
    });

    it('confirms before deleting and calls the delete mutation', () => {
        render(<NotificationChannelsPage />);
        fireEvent.click(screen.getByTitle('Delete channel'));

        const dialog = screen.getByRole('dialog');
        expect(within(dialog).getByText(/Delete channel/)).toBeInTheDocument();
        expect(within(dialog).getByText('platform-alerts')).toBeInTheDocument();

        fireEvent.click(within(dialog).getByRole('button', { name: 'Delete' }));
        expect(mocks.deleteMutate).toHaveBeenCalledWith(
            1,
            expect.objectContaining({ onSuccess: expect.any(Function) })
        );
    });

    it('shows an error message when delete fails', () => {
        state.deleteMutation.isError = true;
        render(<NotificationChannelsPage />);
        fireEvent.click(screen.getByTitle('Delete channel'));
        expect(screen.getByText('Failed to delete channel. Please try again.')).toBeInTheDocument();
    });
});

describe('NotificationChannelsPage — retry policy', () => {
    beforeEach(() => {
        state.channels.data = [webhookChannel];
    });

    it('loads and saves the retry policy for the selected channel', () => {
        state.retryPolicy.data = { channel_id: 1, max_retries: 3, retry_backoff_ms: 1000 };
        render(<NotificationChannelsPage />);
        fireEvent.click(screen.getByTitle('Retry policy'));

        const dialog = screen.getByRole('dialog');
        expect(within(dialog).getByDisplayValue('3')).toBeInTheDocument();
        expect(within(dialog).getByDisplayValue('1000')).toBeInTheDocument();

        fireEvent.change(within(dialog).getByLabelText('Max retries'), { target: { value: '5' } });
        fireEvent.click(within(dialog).getByRole('button', { name: 'Save' }));

        expect(mocks.setRetryPolicyMutate).toHaveBeenCalledWith({
            id: 1,
            body: { max_retries: 5, retry_backoff_ms: 1000 },
        });
    });

    it('shows a loading spinner while the retry policy is loading', () => {
        state.retryPolicy.isLoading = true;
        render(<NotificationChannelsPage />);
        fireEvent.click(screen.getByTitle('Retry policy'));
        expect(document.querySelector('.animate-spin')).toBeTruthy();
    });
});
