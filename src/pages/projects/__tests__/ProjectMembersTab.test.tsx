import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '../../../test/test-utils';
import { ProjectMembersTab } from '../ProjectMembersTab';
import type { ProjectMember } from '../../../services/projects';

const {
    addMemberMutate,
    updateRoleMutate,
    removeMemberMutate,
    useProjectMembersMock,
    useProjectMock,
    usersApiListMock,
} = vi.hoisted(() => ({
    addMemberMutate: vi.fn(),
    updateRoleMutate: vi.fn(),
    removeMemberMutate: vi.fn(),
    useProjectMembersMock: vi.fn(),
    useProjectMock: vi.fn(),
    usersApiListMock: vi.fn(),
}));

vi.mock('../../../features/projects/api', () => ({
    useProject: (...args: any[]) => useProjectMock(...args),
    useProjectMembers: (...args: any[]) => useProjectMembersMock(...args),
    useAddProjectMember: () => ({ mutate: addMemberMutate, isPending: false }),
    useUpdateProjectMemberRole: () => ({ mutate: updateRoleMutate, isPending: false }),
    useRemoveProjectMember: () => ({ mutate: removeMemberMutate, isPending: false }),
}));

vi.mock('../../../services/users', () => ({
    usersApi: { list: (...args: any[]) => usersApiListMock(...args) },
}));

// The invite flow is owned by features/invitations and covered by its own
// tests (Phase 1). Here we only verify this tab opens/closes it and passes
// the right project context — not the modal's internal form behavior.
vi.mock('../../../features/invitations/InviteToProjectModal', () => ({
    InviteToProjectModal: ({ isOpen, onClose, projectId, projectName }: any) =>
        isOpen ? (
            <div data-testid="invite-modal">
                <span>
                    Invite modal for {projectName} (project {projectId})
                </span>
                <button type="button" onClick={onClose}>
                    Close invite modal
                </button>
            </div>
        ) : null,
}));

vi.mock('../../../features/invitations/PendingOnboardingSection', () => ({
    PendingOnboardingSection: ({ projectId, users }: any) => (
        <div data-testid="pending-onboarding">
            onboarding for project {projectId}, {users?.length ?? 0} users
        </div>
    ),
}));

vi.mock('../../../features/invitations/PendingAccessRequestsSection', () => ({
    PendingAccessRequestsSection: ({ projectId, users }: any) => (
        <div data-testid="pending-access-requests">
            access requests for project {projectId}, {users?.length ?? 0} users
        </div>
    ),
}));

vi.mock('../../../features/invitations/ProjectInvitationsSection', () => ({
    ProjectInvitationsSection: ({ projectId }: any) => (
        <div data-testid="project-invitations">invitations for project {projectId}</div>
    ),
}));

vi.mock('../../../features/machine-identities', () => ({
    MachineIdentitiesSection: ({ projectId }: any) => (
        <div data-testid="machine-identities">machine identities for project {projectId}</div>
    ),
}));

const makeMember = (overrides: Partial<ProjectMember> = {}): ProjectMember => ({
    userId: 1,
    username: 'alice',
    displayName: 'Alice Anderson',
    email: 'alice@example.com',
    roleId: 10,
    roleName: 'project_developer',
    ...overrides,
});

const otherUser = {
    id: 5,
    username: 'bob',
    displayName: 'Bob Baker',
    email: 'bob@example.com',
    role: 'user',
    roles: [],
    permissions: [],
    preferences: {},
    lastLogin: '',
};

function mockMembers(members: ProjectMember[], overrides: Partial<{ isLoading: boolean }> = {}) {
    useProjectMembersMock.mockReturnValue({ data: members, isLoading: overrides.isLoading ?? false });
}

beforeEach(() => {
    addMemberMutate.mockReset();
    updateRoleMutate.mockReset();
    removeMemberMutate.mockReset();
    useProjectMembersMock.mockReset();
    useProjectMock.mockReset();
    usersApiListMock.mockReset();

    useProjectMock.mockReturnValue({ data: { id: 1, name: 'Payments API' } });
    usersApiListMock.mockResolvedValue({ data: [otherUser], total: 1, page: 1, pageSize: 200, totalPages: 1 });
    mockMembers([]);
});

describe('ProjectMembersTab', () => {
    describe('members list states', () => {
        it('shows skeleton placeholders while loading', () => {
            mockMembers([], { isLoading: true });
            const { container } = render(<ProjectMembersTab projectId={1} />);

            expect(container.querySelectorAll('.animate-pulse')).toHaveLength(3);
        });

        it('shows an empty state when there are no members', () => {
            mockMembers([]);
            render(<ProjectMembersTab projectId={1} />);

            expect(screen.getByText(/No members yet\. Add a user above/i)).toBeInTheDocument();
        });

        it('renders each member with their display name, email and role', () => {
            mockMembers([
                makeMember(),
                makeMember({
                    userId: 2,
                    username: 'carol',
                    displayName: '',
                    email: 'carol@example.com',
                    roleName: 'project_viewer',
                }),
            ]);
            render(<ProjectMembersTab projectId={1} />);

            expect(screen.getByText('Alice Anderson')).toBeInTheDocument();
            expect(screen.getByText('alice@example.com')).toBeInTheDocument();
            // Falls back to username when displayName is empty.
            expect(screen.getByText('carol')).toBeInTheDocument();

            // Scope each role select to its own row — the "Add member" role
            // select above the list also defaults to "Viewer" and would
            // otherwise collide with carol's row select.
            const aliceRow = screen.getByText('Alice Anderson').closest('li')!;
            expect(within(aliceRow).getByDisplayValue('Developer')).toBeInTheDocument();
            const carolRow = screen.getByText('carol').closest('li')!;
            expect(within(carolRow).getByDisplayValue('Viewer')).toBeInTheDocument();
        });

        // The members query itself has no isError handling — `data` just falls
        // back to `[]` via the destructuring default, so a failed fetch renders
        // the same "No members yet" copy as a project that genuinely has none.
        // Documented here rather than fixed per the coverage-only scope of this PR.
        it('BUG: silently shows the empty-members copy when the members query has no data (e.g. it errored)', () => {
            useProjectMembersMock.mockReturnValue({ data: undefined, isLoading: false });
            render(<ProjectMembersTab projectId={1} />);

            expect(screen.getByText(/No members yet\. Add a user above/i)).toBeInTheDocument();
        });
    });

    describe('effective permissions panel', () => {
        it('expands a member row to show granted and denied capabilities for their role', () => {
            mockMembers([makeMember({ roleName: 'project_viewer' })]);
            render(<ProjectMembersTab projectId={1} />);

            expect(screen.queryByText('Read secrets')).not.toBeInTheDocument();
            fireEvent.click(screen.getByRole('button', { name: /Expand Alice Anderson/i }));

            expect(screen.getByText('Viewer role', { exact: false })).toBeInTheDocument();
            expect(screen.getByText('Read secrets')).toBeInTheDocument();
            expect(screen.getByText('Manage members')).toBeInTheDocument();

            // Collapses again on a second click.
            fireEvent.click(screen.getByRole('button', { name: /Collapse Alice Anderson/i }));
            expect(screen.queryByText('Read secrets')).not.toBeInTheDocument();
        });
    });

    describe('role change', () => {
        it('calls updateRole.mutate with the new role when the select changes', () => {
            mockMembers([makeMember()]);
            render(<ProjectMembersTab projectId={1} />);

            fireEvent.change(screen.getByDisplayValue('Developer'), { target: { value: 'project_admin' } });

            expect(updateRoleMutate).toHaveBeenCalledWith({ userId: 1, role: 'project_admin' });
        });

        it('includes the current role as an extra option when it is outside the standard set', () => {
            mockMembers([makeMember({ roleName: 'legacy_owner' })]);
            render(<ProjectMembersTab projectId={1} />);

            expect(screen.getByDisplayValue('Legacy_owner')).toBeInTheDocument();
        });
    });

    describe('remove member', () => {
        // No window.confirm() guards this action in the source — clicking the
        // trash icon calls removeMember.mutate immediately. Documented here
        // (task brief expected a confirmation step) rather than fixed, per the
        // coverage-only scope of this PR.
        it('BUG: removes a member immediately with no confirmation prompt', () => {
            const confirmSpy = vi.spyOn(window, 'confirm');
            mockMembers([makeMember()]);
            render(<ProjectMembersTab projectId={1} />);

            fireEvent.click(screen.getByTitle('Remove from project'));

            expect(confirmSpy).not.toHaveBeenCalled();
            expect(removeMemberMutate).toHaveBeenCalledWith(1);
            confirmSpy.mockRestore();
        });

        // No last-owner / can't-remove-self protection exists anywhere in the
        // source — the current user (however "current user" would be
        // determined) can be removed from a project like any other member.
        it('has no last-owner or self-removal protection: an admin member can be removed too', () => {
            mockMembers([makeMember({ roleName: 'project_admin' })]);
            render(<ProjectMembersTab projectId={1} />);

            fireEvent.click(screen.getByTitle('Remove from project'));

            expect(removeMemberMutate).toHaveBeenCalledWith(1);
        });
    });

    describe('add member', () => {
        it('excludes existing members from the candidate dropdown', async () => {
            mockMembers([makeMember({ userId: 5 })]); // same id as otherUser
            render(<ProjectMembersTab projectId={1} />);

            await waitFor(() => expect(usersApiListMock).toHaveBeenCalled());
            expect(screen.queryByRole('option', { name: /Bob Baker/i })).not.toBeInTheDocument();
        });

        it('adds a candidate user with the selected role', async () => {
            mockMembers([]);
            render(<ProjectMembersTab projectId={1} />);

            const userSelect = await screen.findByDisplayValue('Select a user to add…');
            // Wait for the candidate option to actually be in the DOM before
            // selecting it — the users list resolves asynchronously.
            await screen.findByRole('option', { name: /Bob Baker/i });
            fireEvent.change(userSelect, { target: { value: '5' } });

            const roleSelect = screen.getByDisplayValue('Viewer');
            fireEvent.change(roleSelect, { target: { value: 'project_admin' } });

            fireEvent.click(screen.getByRole('button', { name: /^Add$/i }));

            expect(addMemberMutate).toHaveBeenCalledWith(
                { userId: 5, role: 'project_admin' },
                expect.objectContaining({ onSuccess: expect.any(Function), onError: expect.any(Function) })
            );
        });

        it('does nothing when Add is clicked with no user selected', () => {
            mockMembers([]);
            render(<ProjectMembersTab projectId={1} />);

            expect(screen.getByRole('button', { name: /^Add$/i })).toBeDisabled();
        });

        it('clears the selected user on a successful add', async () => {
            mockMembers([]);
            render(<ProjectMembersTab projectId={1} />);

            const userSelect = (await screen.findByDisplayValue('Select a user to add…')) as HTMLSelectElement;
            await screen.findByRole('option', { name: /Bob Baker/i });
            fireEvent.change(userSelect, { target: { value: '5' } });
            fireEvent.click(screen.getByRole('button', { name: /^Add$/i }));

            const onSuccess = addMemberMutate.mock.calls[0][1].onSuccess;
            onSuccess();

            await waitFor(() => expect(userSelect.value).toBe(''));
        });

        it('surfaces the API error message from a failed add', async () => {
            mockMembers([]);
            render(<ProjectMembersTab projectId={1} />);

            const userSelect = await screen.findByDisplayValue('Select a user to add…');
            await screen.findByRole('option', { name: /Bob Baker/i });
            fireEvent.change(userSelect, { target: { value: '5' } });
            fireEvent.click(screen.getByRole('button', { name: /^Add$/i }));

            const onError = addMemberMutate.mock.calls[0][1].onError;
            onError({ response: { data: { error: 'user already a member' } } });

            expect(await screen.findByText('user already a member')).toBeInTheDocument();
        });

        it('falls back to a generic message when the add error has no server message', async () => {
            mockMembers([]);
            render(<ProjectMembersTab projectId={1} />);

            const userSelect = await screen.findByDisplayValue('Select a user to add…');
            await screen.findByRole('option', { name: /Bob Baker/i });
            fireEvent.change(userSelect, { target: { value: '5' } });
            fireEvent.click(screen.getByRole('button', { name: /^Add$/i }));

            const onError = addMemberMutate.mock.calls[0][1].onError;
            onError({});

            expect(await screen.findByText('Failed to add member.')).toBeInTheDocument();
        });
    });

    describe('role permissions reference (legend)', () => {
        it('is collapsed by default and expands to list each role', () => {
            mockMembers([]);
            render(<ProjectMembersTab projectId={1} />);

            expect(screen.queryByText('No project-level permissions')).not.toBeInTheDocument();
            const legendRoot = screen.getByText('Role permissions reference').closest('div')!;
            fireEvent.click(screen.getByText('Role permissions reference'));

            // Scope to the legend panel — the "Add member" role select above it
            // also renders an <option>Admin</option> / <option>Auditor</option>.
            expect(within(legendRoot).getByText('Admin')).toBeInTheDocument();
            expect(within(legendRoot).getByText('Auditor')).toBeInTheDocument();
        });
    });

    describe('invite modal wiring', () => {
        it('is closed by default and opens when "Invite by email" is clicked', () => {
            mockMembers([]);
            render(<ProjectMembersTab projectId={1} />);

            expect(screen.queryByTestId('invite-modal')).not.toBeInTheDocument();
            fireEvent.click(screen.getByRole('button', { name: /Invite by email/i }));

            const modal = screen.getByTestId('invite-modal');
            expect(within(modal).getByText(/Invite modal for Payments API \(project 1\)/i)).toBeInTheDocument();
        });

        it('closes when the modal requests it', () => {
            mockMembers([]);
            render(<ProjectMembersTab projectId={1} />);

            fireEvent.click(screen.getByRole('button', { name: /Invite by email/i }));
            fireEvent.click(screen.getByRole('button', { name: /Close invite modal/i }));

            expect(screen.queryByTestId('invite-modal')).not.toBeInTheDocument();
        });

        it('falls back to a generic project name when the project has not loaded yet', () => {
            useProjectMock.mockReturnValue({ data: undefined });
            mockMembers([]);
            render(<ProjectMembersTab projectId={1} />);

            fireEvent.click(screen.getByRole('button', { name: /Invite by email/i }));
            expect(screen.getByText(/Invite modal for project \(project 1\)/i)).toBeInTheDocument();
        });
    });

    describe('membership-related child sections', () => {
        it('wires projectId (and users where applicable) into each child section', async () => {
            mockMembers([]);
            render(<ProjectMembersTab projectId={7} />);

            await waitFor(() => expect(usersApiListMock).toHaveBeenCalled());

            expect(screen.getByTestId('machine-identities')).toHaveTextContent('machine identities for project 7');
            expect(await screen.findByTestId('pending-onboarding')).toHaveTextContent(
                'onboarding for project 7, 1 users'
            );
            expect(screen.getByTestId('pending-access-requests')).toHaveTextContent(
                'access requests for project 7, 1 users'
            );
            expect(screen.getByTestId('project-invitations')).toHaveTextContent('invitations for project 7');
        });
    });
});
