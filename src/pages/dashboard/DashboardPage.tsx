import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    KeyIcon,
    ShareIcon,
    EyeIcon,
    ClockIcon,
    TrendingUpIcon,
    ShieldCheckIcon,
    UserGroupIcon,
    ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { apiService } from '../../services/api';
import { queryKeys } from '../../lib/queryClient';
import { useAuthStore } from '../../store/authStore';
import { usePreferencesStore } from '../../store/preferencesStore';
import { DashboardStats, ActivityItem } from '../../types';
import { Loading } from '../../components/ui/Loading';
import { Alert } from '../../components/ui/Alert';
import { Button } from '../../components/ui/Button';

interface StatCardProps {
    title: string;
    value: number | string;
    icon: React.ComponentType<{ className?: string }>;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    color: 'blue' | 'green' | 'purple' | 'orange' | 'red';
    onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, trend, color, onClick }) => {
    const colorClasses = {
        blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
        green: 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400',
        purple: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
        orange: 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400',
        red: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400',
    };

    return (
        <div
            className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''
                }`}
            onClick={onClick}
        >
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {title}
                    </p>
                    <p className="text-3xl font-semibold text-gray-900 dark:text-white mt-2">
                        {typeof value === 'number' ? value.toLocaleString() : value}
                    </p>
                    {trend && (
                        <div className="flex items-center mt-2">
                            <TrendingUpIcon
                                className={`h-4 w-4 mr-1 ${trend.isPositive ? 'text-green-500' : 'text-red-500 transform rotate-180'
                                    }`}
                            />
                            <span className={`text-sm font-medium ${trend.isPositive ? 'text-green-600' : 'text-red-600'
                                }`}>
                                {Math.abs(trend.value)}%
                            </span>
                            <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">
                                vs last month
                            </span>
                        </div>
                    )}
                </div>
                <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
                    <Icon className="h-6 w-6" />
                </div>
            </div>
        </div>
    );
};

interface ActivityItemProps {
    activity: ActivityItem;
}

const ActivityItemComponent: React.FC<ActivityItemProps> = ({ activity }) => {
    const { getFormattedDate, getFormattedTime } = usePreferencesStore();

    const getActivityIcon = (type: ActivityItem['type']) => {
        switch (type) {
            case 'created':
                return <KeyIcon className="h-5 w-5 text-green-500" />;
            case 'updated':
                return <KeyIcon className="h-5 w-5 text-blue-500" />;
            case 'shared':
                return <ShareIcon className="h-5 w-5 text-purple-500" />;
            case 'accessed':
                return <EyeIcon className="h-5 w-5 text-orange-500" />;
            default:
                return <ClockIcon className="h-5 w-5 text-gray-500" />;
        }
    };

    const getActivityColor = (type: ActivityItem['type']) => {
        switch (type) {
            case 'created':
                return 'border-green-200 dark:border-green-800';
            case 'updated':
                return 'border-blue-200 dark:border-blue-800';
            case 'shared':
                return 'border-purple-200 dark:border-purple-800';
            case 'accessed':
                return 'border-orange-200 dark:border-orange-800';
            default:
                return 'border-gray-200 dark:border-gray-700';
        }
    };

    const getActivityText = (activity: ActivityItem) => {
        switch (activity.type) {
            case 'created':
                return `created secret "${activity.secretName}"`;
            case 'updated':
                return `updated secret "${activity.secretName}"`;
            case 'shared':
                return `shared secret "${activity.secretName}"`;
            case 'accessed':
                return `accessed secret "${activity.secretName}"`;
            default:
                return `performed action on "${activity.secretName}"`;
        }
    };

    return (
        <div className={`flex items-start space-x-3 p-4 border-l-4 ${getActivityColor(activity.type)} bg-gray-50 dark:bg-gray-700/50 rounded-r-lg`}>
            <div className="flex-shrink-0 mt-1">
                {getActivityIcon(activity.type)}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900 dark:text-white">
                    <span className="font-medium">{activity.actor}</span>{' '}
                    {getActivityText(activity)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {getFormattedDate(activity.timestamp)} at {getFormattedTime(activity.timestamp)}
                </p>
            </div>
        </div>
    );
};

export const DashboardPage: React.FC = () => {
    const { user } = useAuthStore();

    // Fetch dashboard statistics
    const { data: stats, isLoading: statsLoading, error: statsError } = useQuery({
        queryKey: queryKeys.dashboard.stats(),
        queryFn: () => apiService.dashboard.getStats(),
        staleTime: 2 * 60 * 1000, // 2 minutes
    });

    // Fetch recent activity
    const { data: activityData, isLoading: activityLoading } = useQuery({
        queryKey: queryKeys.dashboard.activity({ pageSize: 10 }),
        queryFn: () => apiService.dashboard.getActivity({ pageSize: 10 }),
        staleTime: 1 * 60 * 1000, // 1 minute
    });

    // Mock system health data (would come from API in real app)
    const systemHealth = {
        status: 'healthy' as const,
        uptime: '99.9%',
        responseTime: '45ms',
        activeUsers: 127,
    };

    const handleNavigateToSecrets = () => {
        // Navigation would be handled by router
        console.log('Navigate to secrets');
    };

    const handleNavigateToSharing = () => {
        // Navigation would be handled by router
        console.log('Navigate to sharing');
    };

    if (statsError) {
        return (
            <div className="p-6">
                <Alert
                    type="error"
                    title="Failed to load dashboard"
                    message="There was an error loading the dashboard data. Please try again."
                />
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Welcome Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                        Welcome back, {user?.username || 'User'}!
                    </h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Here's what's happening with your secrets today.
                    </p>
                </div>
                <div className="flex items-center space-x-3">
                    <Button
                        variant="outline"
                        onClick={handleNavigateToSecrets}
                    >
                        <KeyIcon className="h-4 w-4 mr-2" />
                        Manage Secrets
                    </Button>
                    <Button
                        onClick={handleNavigateToSharing}
                    >
                        <ShareIcon className="h-4 w-4 mr-2" />
                        Share Secret
                    </Button>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statsLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                            <Loading />
                        </div>
                    ))
                ) : (
                    <>
                        <StatCard
                            title="Total Secrets"
                            value={stats?.totalSecrets || 0}
                            icon={KeyIcon}
                            color="blue"
                            trend={{ value: 12, isPositive: true }}
                            onClick={handleNavigateToSecrets}
                        />
                        <StatCard
                            title="Shared Secrets"
                            value={stats?.sharedSecrets || 0}
                            icon={ShareIcon}
                            color="green"
                            trend={{ value: 8, isPositive: true }}
                            onClick={handleNavigateToSharing}
                        />
                        <StatCard
                            title="Shared with Me"
                            value={stats?.secretsSharedWithMe || 0}
                            icon={UserGroupIcon}
                            color="purple"
                            trend={{ value: 3, isPositive: false }}
                        />
                        <StatCard
                            title="System Health"
                            value={systemHealth.uptime}
                            icon={ShieldCheckIcon}
                            color="green"
                        />
                    </>
                )}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Activity */}
                <div className="lg:col-span-2">
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                                    Recent Activity
                                </h2>
                                <Button variant="ghost" size="sm">
                                    View All
                                </Button>
                            </div>
                        </div>
                        <div className="p-6">
                            {activityLoading ? (
                                <Loading />
                            ) : activityData?.data.length === 0 ? (
                                <div className="text-center py-8">
                                    <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                    <p className="text-gray-500 dark:text-gray-400">
                                        No recent activity to display.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {activityData?.data.slice(0, 5).map((activity) => (
                                        <ActivityItemComponent key={activity.id} activity={activity} />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* System Status & Quick Actions */}
                <div className="space-y-6">
                    {/* System Status */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                            <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                                System Status
                            </h2>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600 dark:text-gray-400">Status</span>
                                <div className="flex items-center">
                                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                                    <span className="text-sm font-medium text-green-600 dark:text-green-400 capitalize">
                                        {systemHealth.status}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600 dark:text-gray-400">Uptime</span>
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                    {systemHealth.uptime}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600 dark:text-gray-400">Response Time</span>
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                    {systemHealth.responseTime}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600 dark:text-gray-400">Active Users</span>
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                    {systemHealth.activeUsers}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                            <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                                Quick Actions
                            </h2>
                        </div>
                        <div className="p-6 space-y-3">
                            <Button
                                variant="outline"
                                className="w-full justify-start"
                                onClick={handleNavigateToSecrets}
                            >
                                <KeyIcon className="h-4 w-4 mr-3" />
                                Create New Secret
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full justify-start"
                                onClick={handleNavigateToSharing}
                            >
                                <ShareIcon className="h-4 w-4 mr-3" />
                                Share Existing Secret
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full justify-start"
                            >
                                <EyeIcon className="h-4 w-4 mr-3" />
                                View Audit Logs
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full justify-start"
                            >
                                <ShieldCheckIcon className="h-4 w-4 mr-3" />
                                Security Settings
                            </Button>
                        </div>
                    </div>

                    {/* Security Alerts */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                            <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                                Security Alerts
                            </h2>
                        </div>
                        <div className="p-6">
                            <div className="flex items-start space-x-3">
                                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                        Password Expiry Warning
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        3 secrets have passwords expiring within 30 days
                                    </p>
                                    <Button variant="ghost" size="sm" className="mt-2 p-0 h-auto text-xs">
                                        Review Secrets
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Usage Analytics Preview */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                            Usage Analytics
                        </h2>
                        <Button variant="ghost" size="sm">
                            View Detailed Analytics
                        </Button>
                    </div>
                </div>
                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="text-center">
                            <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                                {stats?.totalSecrets || 0}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                Total Secrets
                            </div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                                {Math.round(((stats?.sharedSecrets || 0) / Math.max(stats?.totalSecrets || 1, 1)) * 100)}%
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                Sharing Rate
                            </div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                                {activityData?.data.length || 0}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                Recent Activities
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};