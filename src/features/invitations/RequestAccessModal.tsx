import React, { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { PROJECT_ROLES } from '../../services/projects';
import { useCreateAccessRequest } from './api';
import { useAccessRequestStore } from '../../store';

interface RequestAccessModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: number;
}

// "project_developer" → "Developer"
const roleLabel = (role: string) => role.replace(/^project_/, '').replace(/^\w/, (c) => c.toUpperCase());

/**
 * ADR-024 Part B: a user without project access asks for one. The role here
 * is only a suggestion — the project admin decides what's actually granted,
 * same escalation-safety reasoning as the invite flow (the requester never
 * picks their own permissions).
 */
export const RequestAccessModal: React.FC<RequestAccessModalProps> = ({ isOpen, onClose, projectId }) => {
    const [suggestedRole, setSuggestedRole] = useState<string>(PROJECT_ROLES[2]); // project_viewer
    const [reason, setReason] = useState('');
    const [error, setError] = useState('');
    const createRequest = useCreateAccessRequest(projectId);
    const recordRequest = useAccessRequestStore((s) => s.recordRequest);

    const reset = () => {
        setSuggestedRole(PROJECT_ROLES[2]);
        setReason('');
        setError('');
    };

    const handleClose = () => {
        if (createRequest.isPending) return;
        reset();
        onClose();
    };

    const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');
        createRequest.mutate(
            { suggestedRole, reason: reason.trim() },
            {
                onSuccess: (created) => {
                    recordRequest(projectId, created.id, created.suggestedRole);
                    reset();
                    onClose();
                },
                onError: (err: any) =>
                    setError(
                        err?.response?.data?.message ?? err?.response?.data?.error ?? 'Failed to submit request.'
                    ),
            }
        );
    };

    const inputStyle: React.CSSProperties = {
        backgroundColor: 'var(--bg-app)',
        border: '1px solid var(--border)',
        color: 'var(--text-primary)',
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Request access" size="sm">
            <form onSubmit={handleSubmit} className="space-y-4">
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    A project admin will review your request. The role below is a suggestion — the admin decides what
                    to grant.
                </p>

                {error && (
                    <div
                        className="rounded-lg px-3 py-2 text-sm"
                        style={{ backgroundColor: 'var(--error-subtle)', color: 'var(--error)' }}
                    >
                        {error}
                    </div>
                )}

                <div>
                    <label
                        htmlFor="request-access-role-select"
                        className="block text-xs font-medium mb-1"
                        style={{ color: 'var(--text-secondary)' }}
                    >
                        Suggested role
                    </label>
                    <select
                        id="request-access-role-select"
                        value={suggestedRole}
                        onChange={(e) => setSuggestedRole(e.target.value)}
                        className="w-full rounded-lg px-3 py-1.5 text-sm outline-hidden"
                        style={inputStyle}
                    >
                        {PROJECT_ROLES.map((r) => (
                            <option key={r} value={r}>
                                {roleLabel(r)}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label
                        htmlFor="request-access-reason-input"
                        className="block text-xs font-medium mb-1"
                        style={{ color: 'var(--text-secondary)' }}
                    >
                        Reason (optional)
                    </label>
                    <textarea
                        id="request-access-reason-input"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="e.g. I'm joining the team, need read-only access to debug a staging issue"
                        rows={3}
                        className="w-full rounded-lg px-3 py-1.5 text-sm outline-hidden resize-none"
                        style={inputStyle}
                    />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={createRequest.isPending}
                        className="px-3 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50"
                        style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={createRequest.isPending}
                        className="px-3 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50"
                        style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
                    >
                        {createRequest.isPending ? 'Submitting…' : 'Submit request'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};
