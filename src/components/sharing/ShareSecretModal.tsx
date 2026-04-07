import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
    MagnifyingGlassIcon,
    UserIcon,
    UserGroupIcon,
    XMarkIcon,
    PlusIcon
} from '@heroicons/react/24/outline';
import { apiService } from '../../services/api';
import { queryKeys, invalidateQueries } from '../../lib/queryClient';
import { useForm } from '../../store/formStore';
import { Secret, ShareFormData, Recipient } from '../../types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Dropdown } from '../ui/Dropdown';
import { Modal } from '../ui/Modal';
import { Alert } from '../ui/Alert';
import { Loading } from '../ui/Loading';

interface ShareSecretModalProps {
    secret: Secret;
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

const PERMISSION_OPTIONS = [
    { value: 'read', label: 'Read Only', description: 'Can view the secret value' },
    { value: 'write', label: 'Read & Write', description: 'Can view and modify the secret' },
];

const FORM_ID = 'share-secret-form';

export const ShareSecretModal: React.FC<ShareSecretModalProps> = ({
    secret,
    isOpen,
    onClose,
    onSuccess
}) => {
    const queryClient = useQueryClient();
    const form = useForm(FORM_ID);

    // State for recipient search
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Recipient[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedRecipients, setSelectedRecipients] = useState<Recipient[]>([]);

    // Initialize form
    useEffect(() => {
        if (isOpen) {
            form.initialize({
                permission: 'read',
            });
        } else {
            form.destroy();
            setSelectedRecipients([]);
            setSearchQuery('');
            setSearchResults([]);
        }
    }, [isOpen, form]);

    // Search for users and groups
    const searchRecipients = async (query: string) => {
        if (query.length < 2) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        try {
            const [users, groups] = await Promise.all([
                apiService.users.search(query),
                apiService.groups.search(query),
            ]);

            const allRecipients = [...users, ...groups];
            setSearchResults(allRecipients);
        } catch (error) {
            console.error('Failed to search recipients:', error);
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    };

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            searchRecipients(searchQuery);
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Share mutation
    const shareMutation = useMutation({
        mutationFn: async (data: { recipients: Recipient[]; permission: 'read' | 'write' }) => {
            const sharePromises = data.recipients.map(recipient =>
                apiService.sharing.create({
                    secretId: secret.id,
                    recipientType: recipient.type,
                    recipientId: recipient.id,
                    permission: data.permission,
                })
            );

            return Promise.all(sharePromises);
        },
        onSuccess: () => {
            // Invalidate related queries
            invalidateQueries.secrets.detail(secret.id);
            invalidateQueries.sharing.all();

            onSuccess?.();
            onClose();
        },
    });

    // Handle recipient selection
    const handleSelectRecipient = (recipient: Recipient) => {
        if (!selectedRecipients.find(r => r.id === recipient.id && r.type === recipient.type)) {
            setSelectedRecipients(prev => [...prev, recipient]);
        }
        setSearchQuery('');
        setSearchResults([]);
    };

    // Handle recipient removal
    const handleRemoveRecipient = (recipient: Recipient) => {
        setSelectedRecipients(prev =>
            prev.filter(r => !(r.id === recipient.id && r.type === recipient.type))
        );
    };

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (selectedRecipients.length === 0) {
            form.setErrors({ recipients: 'Please select at least one recipient' });
            return;
        }

        const values = form.getValues();
        form.setSubmitting(true);

        try {
            await shareMutation.mutateAsync({
                recipients: selectedRecipients,
                permission: values.permission,
            });
        } catch (error) {
            // Error handling is done by the mutation
        } finally {
            form.setSubmitting(false);
        }
    };

    const values = form.getValues();
    const errors = form.getErrors();
    const isSubmitting = form.isSubmitting();

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Share "${secret.name}"`}
            size="lg"
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Error Alert */}
                {shareMutation.error && (
                    <Alert
                        type="error"
                        title="Failed to share secret"
                        message={shareMutation.error instanceof Error ? shareMutation.error.message : 'An unexpected error occurred'}
                    />
                )}

                {/* Secret Info */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                                <span className="text-blue-600 dark:text-blue-300 font-medium text-sm">
                                    {secret.type.charAt(0).toUpperCase()}
                                </span>
                            </div>
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                {secret.name}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {secret.namespace} / {secret.zone} / {secret.environment}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Permission Selection */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Permission Level
                    </label>
                    <Dropdown
                        value={values.permission || 'read'}
                        onChange={(value) => form.setValues({ permission: value })}
                        options={PERMISSION_OPTIONS}
                        error={errors.permission}
                    />
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {PERMISSION_OPTIONS.find(p => p.value === values.permission)?.description}
                    </p>
                </div>

                {/* Recipient Search */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Add Recipients
                    </label>
                    <div className="relative">
                        <Input
                            type="text"
                            placeholder="Search users or groups..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            icon={MagnifyingGlassIcon}
                            error={errors.recipients}
                        />

                        {/* Search Results */}
                        {searchResults.length > 0 && (
                            <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-60 overflow-auto">
                                {searchResults.map((recipient) => (
                                    <button
                                        key={`${recipient.type}-${recipient.id}`}
                                        type="button"
                                        onClick={() => handleSelectRecipient(recipient)}
                                        className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-3"
                                    >
                                        <div className="flex-shrink-0">
                                            {recipient.type === 'user' ? (
                                                <UserIcon className="h-5 w-5 text-gray-400" />
                                            ) : (
                                                <UserGroupIcon className="h-5 w-5 text-gray-400" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                {recipient.name}
                                            </div>
                                            {recipient.email && (
                                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                                    {recipient.email}
                                                </div>
                                            )}
                                            {recipient.memberCount && (
                                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                                    {recipient.memberCount} members
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-shrink-0">
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                                                {recipient.type}
                                            </span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Loading indicator */}
                        {isSearching && (
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                <Loading size="sm" />
                            </div>
                        )}
                    </div>
                </div>

                {/* Selected Recipients */}
                {selectedRecipients.length > 0 && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Selected Recipients ({selectedRecipients.length})
                        </label>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                            {selectedRecipients.map((recipient) => (
                                <div
                                    key={`${recipient.type}-${recipient.id}`}
                                    className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg"
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className="flex-shrink-0">
                                            {recipient.type === 'user' ? (
                                                <UserIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                            ) : (
                                                <UserGroupIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                            )}
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                {recipient.name}
                                            </div>
                                            {recipient.email && (
                                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                                    {recipient.email}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleRemoveRecipient(recipient)}
                                        className="text-red-600 hover:text-red-700"
                                    >
                                        <XMarkIcon className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        disabled={isSubmitting || selectedRecipients.length === 0}
                    >
                        {isSubmitting && <Loading size="sm" className="mr-2" />}
                        Share Secret
                    </Button>
                </div>
            </form>
        </Modal>
    );
};