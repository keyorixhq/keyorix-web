import React, { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    MagnifyingGlassIcon,
    PlusIcon,
    FunnelIcon,
    ArrowsUpDownIcon,
    EyeIcon,
    PencilIcon,
    TrashIcon,
    ShareIcon,
    DocumentDuplicateIcon,
    XMarkIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    TagIcon
} from '@heroicons/react/24/outline';
import { apiService } from '../../services/api';
import { queryKeys } from '../../lib/queryClient';
import { useUIStore } from '../../store/uiStore';
import { usePreferencesStore } from '../../store/preferencesStore';
import { Secret, SecretFilters, PaginationState, SecretType } from '../../types';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Dropdown } from '../../components/ui/Dropdown';
import { Loading } from '../../components/ui/Loading';
import { Alert } from '../../components/ui/Alert';

const ITEMS_PER_PAGE = 20;

const SECRET_TYPES: { value: SecretType | 'all'; label: string }[] = [
    { value: 'all', label: 'All Types' },
    { value: 'text', label: 'Text' },
    { value: 'password', label: 'Password' },
    { value: 'api_key', label: 'API Key' },
    { value: 'certificate', label: 'Certificate' },
    { value: 'json', label: 'JSON' },
];

const SORT_OPTIONS = [
    { value: 'name_asc', label: 'Name (A-Z)' },
    { value: 'name_desc', label: 'Name (Z-A)' },
    { value: 'modified_desc', label: 'Recently Modified' },
    { value: 'modified_asc', label: 'Oldest Modified' },
    { value: 'type_asc', label: 'Type (A-Z)' },
    { value: 'type_desc', label: 'Type (Z-A)' },
    { value: 'created_desc', label: 'Recently Created' },
    { value: 'created_asc', label: 'Oldest Created' },
];

const PAGE_SIZE_OPTIONS = [
    { value: 10, label: '10 per page' },
    { value: 20, label: '20 per page' },
    { value: 50, label: '50 per page' },
    { value: 100, label: '100 per page' },
];

export const SecretsListPage: React.FC = () => {
    const { openModal, selectedItems, toggleSelectedItem, clearSelectedItems, bulkActionMode, setBulkActionMode } = useUIStore();
    const { getFormattedDate } = usePreferencesStore();

    // State for filters and pagination
    const [filters, setFilters] = useState<SecretFilters>({
        search: '',
        type: 'all',
        namespace: '',
        zone: '',
        environment: '',
        tags: [],
    });

    const [pagination, setPagination] = useState<PaginationState>({
        page: 1,
        pageSize: ITEMS_PER_PAGE,
        total: 0,
        totalPages: 0,
    });

    const [sortBy, setSortBy] = useState('modified_desc');
    const [tagInput, setTagInput] = useState('');
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

    // Fetch secrets with filters and pagination
    const { data, isLoading, error, refetch, isFetching } = useQuery({
        queryKey: queryKeys.secrets.list({
            ...filters,
            page: pagination.page,
            pageSize: pagination.pageSize,
            sortBy
        }),
        queryFn: () => apiService.secrets.list({
            page: pagination.page,
            pageSize: pagination.pageSize,
            search: filters.search || undefined,
            type: filters.type !== 'all' ? filters.type : undefined,
            namespace: filters.namespace || undefined,
            zone: filters.zone || undefined,
            environment: filters.environment || undefined,
            tags: filters.tags.length > 0 ? filters.tags : undefined,
        }),
        keepPreviousData: true,
    });

    // Update pagination when data changes
    React.useEffect(() => {
        if (data) {
            setPagination(prev => ({
                ...prev,
                total: data.total,
                totalPages: data.totalPages,
            }));
        }
    }, [data]);

    // Memoized filtered and sorted secrets
    const secrets = useMemo(() => {
        if (!data?.data) return [];

        let result = [...data.data];

        // Apply client-side sorting if needed
        const [sortField, sortDirection] = sortBy.split('_');
        result.sort((a, b) => {
            let aValue: any, bValue: any;

            switch (sortField) {
                case 'name':
                    aValue = a.name.toLowerCase();
                    bValue = b.name.toLowerCase();
                    break;
                case 'modified':
                    aValue = new Date(a.lastModified);
                    bValue = new Date(b.lastModified);
                    break;
                case 'type':
                    aValue = a.type;
                    bValue = b.type;
                    break;
                default:
                    return 0;
            }

            if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });

        return result;
    }, [data?.data, sortBy]);

    // Handle filter changes
    const handleFilterChange = useCallback((key: keyof SecretFilters, value: any) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
    }, []);

    // Handle search with debouncing
    const [searchInput, setSearchInput] = useState(filters.search);
    React.useEffect(() => {
        const timer = setTimeout(() => {
            handleFilterChange('search', searchInput);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchInput, handleFilterChange]);

    // Handle tag management
    const handleAddTag = useCallback((tag: string) => {
        if (tag.trim() && !filters.tags.includes(tag.trim())) {
            handleFilterChange('tags', [...filters.tags, tag.trim()]);
        }
        setTagInput('');
    }, [filters.tags, handleFilterChange]);

    const handleRemoveTag = useCallback((tagToRemove: string) => {
        handleFilterChange('tags', filters.tags.filter(tag => tag !== tagToRemove));
    }, [filters.tags, handleFilterChange]);

    const handleTagInputKeyPress = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && tagInput.trim()) {
            e.preventDefault();
            handleAddTag(tagInput);
        }
    }, [tagInput, handleAddTag]);

    // Handle pagination
    const handlePageChange = useCallback((page: number) => {
        setPagination(prev => ({ ...prev, page }));
    }, []);

    const handlePageSizeChange = useCallback((pageSize: number) => {
        setPagination(prev => ({ ...prev, pageSize, page: 1 }));
    }, []);

    // Clear all filters
    const handleClearFilters = useCallback(() => {
        setFilters({
            search: '',
            type: 'all',
            namespace: '',
            zone: '',
            environment: '',
            tags: [],
        });
        setSearchInput('');
        setTagInput('');
        setPagination(prev => ({ ...prev, page: 1 }));
    }, []);

    // Check if any filters are active
    const hasActiveFilters = useMemo(() => {
        return filters.search ||
            filters.type !== 'all' ||
            filters.namespace ||
            filters.zone ||
            filters.environment ||
            filters.tags.length > 0;
    }, [filters]);

    // Handle bulk actions
    const handleBulkDelete = () => {
        if (selectedItems.size === 0) return;
        openModal('bulk-delete-secrets', { secretIds: Array.from(selectedItems) });
    };

    const handleBulkShare = () => {
        if (selectedItems.size === 0) return;
        openModal('bulk-share-secrets', { secretIds: Array.from(selectedItems) });
    };

    // Handle individual secret actions
    const handleViewSecret = (secret: Secret) => {
        openModal('view-secret', { secret });
    };

    const handleEditSecret = (secret: Secret) => {
        openModal('edit-secret', { secret });
    };

    const handleDeleteSecret = (secret: Secret) => {
        openModal('delete-secret', { secret });
    };

    const handleShareSecret = (secret: Secret) => {
        openModal('share-secret', { secret });
    };

    const handleDuplicateSecret = (secret: Secret) => {
        openModal('duplicate-secret', { secret });
    };

    if (error) {
        return (
            <div className="p-6">
                <Alert
                    type="error"
                    title="Failed to load secrets"
                    message="There was an error loading your secrets. Please try again."
                    action={
                        <Button variant="outline" size="sm" onClick={() => refetch()}>
                            Retry
                        </Button>
                    }
                />
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                        Secrets
                    </h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Manage your secrets and access controls
                    </p>
                </div>
                <div className="flex items-center space-x-3">
                    {bulkActionMode && (
                        <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                {selectedItems.size} selected
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleBulkShare}
                                disabled={selectedItems.size === 0}
                            >
                                <ShareIcon className="h-4 w-4 mr-1" />
                                Share
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleBulkDelete}
                                disabled={selectedItems.size === 0}
                                className="text-red-600 hover:text-red-700"
                            >
                                <TrashIcon className="h-4 w-4 mr-1" />
                                Delete
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setBulkActionMode(false);
                                    clearSelectedItems();
                                }}
                            >
                                Cancel
                            </Button>
                        </div>
                    )}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setBulkActionMode(!bulkActionMode)}
                    >
                        Select
                    </Button>
                    <Button
                        onClick={() => openModal('create-secret')}
                        className="flex items-center"
                    >
                        <PlusIcon className="h-4 w-4 mr-2" />
                        New Secret
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <div className="space-y-4">
                    {/* Primary Filters Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                        {/* Search */}
                        <div className="lg:col-span-2">
                            <Input
                                type="text"
                                placeholder="Search by name, type, or tags..."
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                icon={MagnifyingGlassIcon}
                            />
                        </div>

                        {/* Type Filter */}
                        <div>
                            <Dropdown
                                value={filters.type}
                                onChange={(value) => handleFilterChange('type', value)}
                                options={SECRET_TYPES}
                                placeholder="Type"
                            />
                        </div>

                        {/* Sort */}
                        <div>
                            <Dropdown
                                value={sortBy}
                                onChange={setSortBy}
                                options={SORT_OPTIONS}
                                placeholder="Sort by"
                                icon={ArrowsUpDownIcon}
                            />
                        </div>

                        {/* Page Size */}
                        <div>
                            <Dropdown
                                value={pagination.pageSize}
                                onChange={handlePageSizeChange}
                                options={PAGE_SIZE_OPTIONS}
                                placeholder="Page size"
                            />
                        </div>

                        {/* Advanced Filters Toggle */}
                        <div>
                            <Button
                                variant="outline"
                                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                                className="w-full"
                            >
                                <FunnelIcon className="h-4 w-4 mr-2" />
                                {showAdvancedFilters ? 'Hide' : 'More'} Filters
                            </Button>
                        </div>
                    </div>

                    {/* Advanced Filters */}
                    {showAdvancedFilters && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                            {/* Namespace Filter */}
                            <div>
                                <Input
                                    type="text"
                                    placeholder="Namespace"
                                    value={filters.namespace}
                                    onChange={(e) => handleFilterChange('namespace', e.target.value)}
                                />
                            </div>

                            {/* Zone Filter */}
                            <div>
                                <Input
                                    type="text"
                                    placeholder="Zone"
                                    value={filters.zone}
                                    onChange={(e) => handleFilterChange('zone', e.target.value)}
                                />
                            </div>

                            {/* Environment Filter */}
                            <div>
                                <Input
                                    type="text"
                                    placeholder="Environment"
                                    value={filters.environment}
                                    onChange={(e) => handleFilterChange('environment', e.target.value)}
                                />
                            </div>
                        </div>
                    )}

                    {/* Tags Filter */}
                    <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                            <TagIcon className="h-4 w-4 text-gray-500" />
                            <Input
                                type="text"
                                placeholder="Add tag filter (press Enter)"
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyPress={handleTagInputKeyPress}
                                className="flex-1"
                            />
                        </div>

                        {/* Active Tags */}
                        {filters.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {filters.tags.map((tag) => (
                                    <span
                                        key={tag}
                                        className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                    >
                                        {tag}
                                        <button
                                            onClick={() => handleRemoveTag(tag)}
                                            className="ml-1 hover:text-blue-600 dark:hover:text-blue-300"
                                        >
                                            <XMarkIcon className="h-3 w-3" />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Active Filters Summary */}
                    {hasActiveFilters && (
                        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                            <div className="flex items-center space-x-2 flex-wrap">
                                <span className="text-sm text-gray-500 dark:text-gray-400">Active filters:</span>
                                {filters.search && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                        Search: {filters.search}
                                    </span>
                                )}
                                {filters.type !== 'all' && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                        Type: {filters.type}
                                    </span>
                                )}
                                {filters.namespace && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                                        Namespace: {filters.namespace}
                                    </span>
                                )}
                                {filters.zone && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                                        Zone: {filters.zone}
                                    </span>
                                )}
                                {filters.environment && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                                        Environment: {filters.environment}
                                    </span>
                                )}
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleClearFilters}
                                className="text-xs"
                            >
                                Clear all
                            </Button>
                        </div>
                    )}

                    {/* Loading indicator for filters */}
                    {isFetching && (
                        <div className="flex items-center justify-center py-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                            <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">Updating results...</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Secrets List */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                {isLoading ? (
                    <div className="p-8">
                        <Loading />
                    </div>
                ) : secrets.length === 0 ? (
                    <div className="p-8 text-center">
                        <div className="text-gray-400 dark:text-gray-500 mb-4">
                            <FunnelIcon className="h-12 w-12 mx-auto" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                            No secrets found
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-4">
                            {filters.search || filters.type !== 'all' || filters.namespace || filters.zone
                                ? 'Try adjusting your filters or search terms.'
                                : 'Get started by creating your first secret.'}
                        </p>
                        {!filters.search && filters.type === 'all' && !filters.namespace && !filters.zone && (
                            <Button onClick={() => openModal('create-secret')}>
                                <PlusIcon className="h-4 w-4 mr-2" />
                                Create Secret
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-900">
                                <tr>
                                    {bulkActionMode && (
                                        <th className="px-6 py-3 text-left">
                                            <input
                                                type="checkbox"
                                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                checked={secrets.length > 0 && secrets.every(s => selectedItems.has(s.id))}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        secrets.forEach(s => toggleSelectedItem(s.id));
                                                    } else {
                                                        clearSelectedItems();
                                                    }
                                                }}
                                            />
                                        </th>
                                    )}
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Name
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Type
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Location
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Sharing
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Modified
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {secrets.map((secret) => (
                                    <tr key={secret.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                        {bulkActionMode && (
                                            <td className="px-6 py-4">
                                                <input
                                                    type="checkbox"
                                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                    checked={selectedItems.has(secret.id)}
                                                    onChange={() => toggleSelectedItem(secret.id)}
                                                />
                                            </td>
                                        )}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                        {secret.name}
                                                    </div>
                                                    {secret.tags.length > 0 && (
                                                        <div className="flex items-center space-x-1 mt-1">
                                                            {secret.tags.slice(0, 3).map((tag) => (
                                                                <span
                                                                    key={tag}
                                                                    className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                                                                >
                                                                    {tag}
                                                                </span>
                                                            ))}
                                                            {secret.tags.length > 3 && (
                                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                                    +{secret.tags.length - 3} more
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                                {secret.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            <div>
                                                <div>{secret.namespace}</div>
                                                <div className="text-xs">{secret.zone} / {secret.environment}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            {secret.isShared ? (
                                                <div className="flex items-center">
                                                    <ShareIcon className="h-4 w-4 mr-1 text-green-500" />
                                                    <span>{secret.shareCount} shares</span>
                                                </div>
                                            ) : (
                                                <span>Private</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            <div>
                                                <div>{getFormattedDate(secret.lastModified)}</div>
                                                <div className="text-xs">by {secret.owner}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end space-x-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleViewSecret(secret)}
                                                    title="View secret"
                                                >
                                                    <EyeIcon className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleEditSecret(secret)}
                                                    title="Edit secret"
                                                >
                                                    <PencilIcon className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleShareSecret(secret)}
                                                    title="Share secret"
                                                >
                                                    <ShareIcon className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDuplicateSecret(secret)}
                                                    title="Duplicate secret"
                                                >
                                                    <DocumentDuplicateIcon className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDeleteSecret(secret)}
                                                    title="Delete secret"
                                                    className="text-red-600 hover:text-red-700"
                                                >
                                                    <TrashIcon className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Enhanced Pagination */}
                        {pagination.totalPages > 1 && (
                            <div className="bg-white dark:bg-gray-800 px-4 py-3 border-t border-gray-200 dark:border-gray-700 sm:px-6">
                                <div className="flex items-center justify-between">
                                    {/* Mobile pagination */}
                                    <div className="flex-1 flex justify-between sm:hidden">
                                        <Button
                                            variant="outline"
                                            onClick={() => handlePageChange(pagination.page - 1)}
                                            disabled={pagination.page === 1}
                                            size="sm"
                                        >
                                            <ChevronLeftIcon className="h-4 w-4 mr-1" />
                                            Previous
                                        </Button>
                                        <span className="text-sm text-gray-700 dark:text-gray-300 flex items-center">
                                            Page {pagination.page} of {pagination.totalPages}
                                        </span>
                                        <Button
                                            variant="outline"
                                            onClick={() => handlePageChange(pagination.page + 1)}
                                            disabled={pagination.page === pagination.totalPages}
                                            size="sm"
                                        >
                                            Next
                                            <ChevronRightIcon className="h-4 w-4 ml-1" />
                                        </Button>
                                    </div>

                                    {/* Desktop pagination */}
                                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                        <div className="flex items-center space-x-4">
                                            <p className="text-sm text-gray-700 dark:text-gray-300">
                                                Showing{' '}
                                                <span className="font-medium">
                                                    {(pagination.page - 1) * pagination.pageSize + 1}
                                                </span>{' '}
                                                to{' '}
                                                <span className="font-medium">
                                                    {Math.min(pagination.page * pagination.pageSize, pagination.total)}
                                                </span>{' '}
                                                of{' '}
                                                <span className="font-medium">{pagination.total}</span> results
                                            </p>
                                        </div>

                                        <div className="flex items-center space-x-2">
                                            {/* First page */}
                                            <Button
                                                variant="outline"
                                                onClick={() => handlePageChange(1)}
                                                disabled={pagination.page === 1}
                                                size="sm"
                                                className="rounded-l-md"
                                            >
                                                <ChevronLeftIcon className="h-4 w-4" />
                                                <ChevronLeftIcon className="h-4 w-4 -ml-1" />
                                            </Button>

                                            {/* Previous page */}
                                            <Button
                                                variant="outline"
                                                onClick={() => handlePageChange(pagination.page - 1)}
                                                disabled={pagination.page === 1}
                                                size="sm"
                                            >
                                                <ChevronLeftIcon className="h-4 w-4" />
                                            </Button>

                                            {/* Page numbers */}
                                            <div className="flex items-center space-x-1">
                                                {(() => {
                                                    const pages = [];
                                                    const startPage = Math.max(1, pagination.page - 2);
                                                    const endPage = Math.min(pagination.totalPages, pagination.page + 2);

                                                    if (startPage > 1) {
                                                        pages.push(
                                                            <Button
                                                                key={1}
                                                                variant={1 === pagination.page ? "default" : "outline"}
                                                                onClick={() => handlePageChange(1)}
                                                                size="sm"
                                                                className="min-w-[2.5rem]"
                                                            >
                                                                1
                                                            </Button>
                                                        );
                                                        if (startPage > 2) {
                                                            pages.push(
                                                                <span key="ellipsis1" className="px-2 text-gray-500">
                                                                    ...
                                                                </span>
                                                            );
                                                        }
                                                    }

                                                    for (let i = startPage; i <= endPage; i++) {
                                                        pages.push(
                                                            <Button
                                                                key={i}
                                                                variant={i === pagination.page ? "default" : "outline"}
                                                                onClick={() => handlePageChange(i)}
                                                                size="sm"
                                                                className="min-w-[2.5rem]"
                                                            >
                                                                {i}
                                                            </Button>
                                                        );
                                                    }

                                                    if (endPage < pagination.totalPages) {
                                                        if (endPage < pagination.totalPages - 1) {
                                                            pages.push(
                                                                <span key="ellipsis2" className="px-2 text-gray-500">
                                                                    ...
                                                                </span>
                                                            );
                                                        }
                                                        pages.push(
                                                            <Button
                                                                key={pagination.totalPages}
                                                                variant={pagination.totalPages === pagination.page ? "default" : "outline"}
                                                                onClick={() => handlePageChange(pagination.totalPages)}
                                                                size="sm"
                                                                className="min-w-[2.5rem]"
                                                            >
                                                                {pagination.totalPages}
                                                            </Button>
                                                        );
                                                    }

                                                    return pages;
                                                })()}
                                            </div>

                                            {/* Next page */}
                                            <Button
                                                variant="outline"
                                                onClick={() => handlePageChange(pagination.page + 1)}
                                                disabled={pagination.page === pagination.totalPages}
                                                size="sm"
                                            >
                                                <ChevronRightIcon className="h-4 w-4" />
                                            </Button>

                                            {/* Last page */}
                                            <Button
                                                variant="outline"
                                                onClick={() => handlePageChange(pagination.totalPages)}
                                                disabled={pagination.page === pagination.totalPages}
                                                size="sm"
                                                className="rounded-r-md"
                                            >
                                                <ChevronRightIcon className="h-4 w-4" />
                                                <ChevronRightIcon className="h-4 w-4 -ml-1" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};