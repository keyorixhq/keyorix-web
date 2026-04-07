import React from 'react';
import { usePreferencesStore } from '../store/preferencesStore';

// Translation keys type for better type safety
export type TranslationKey =
    | 'common.save'
    | 'common.cancel'
    | 'common.delete'
    | 'common.edit'
    | 'common.create'
    | 'common.search'
    | 'common.loading'
    | 'common.error'
    | 'common.success'
    | 'common.warning'
    | 'common.info'
    | 'common.yes'
    | 'common.no'
    | 'common.close'
    | 'common.back'
    | 'common.next'
    | 'common.previous'
    | 'common.refresh'
    | 'common.export'
    | 'common.import'
    | 'common.copy'
    | 'common.share'
    | 'common.view'
    | 'common.settings'
    | 'common.profile'
    | 'common.logout'
    | 'common.login'
    | 'common.register'
    | 'common.password'
    | 'common.email'
    | 'common.username'
    | 'common.name'
    | 'common.type'
    | 'common.status'
    | 'common.actions'
    | 'common.date'
    | 'common.time'
    | 'common.created'
    | 'common.updated'
    | 'common.modified'
    | 'common.owner'
    | 'common.permissions'
    | 'common.tags'
    | 'common.metadata'
    | 'common.description'
    | 'common.value'
    | 'common.required'
    | 'common.optional'
    | 'common.all'
    | 'common.none'
    | 'common.select'
    | 'common.clear'
    | 'common.filter'
    | 'common.sort'
    | 'common.page'
    | 'common.of'
    | 'common.total'
    | 'common.results'
    | 'common.items'
    | 'common.showing'
    | 'common.to'
    | 'common.from'
    | 'secrets.title'
    | 'secrets.create'
    | 'secrets.edit'
    | 'secrets.delete'
    | 'secrets.share'
    | 'secrets.view'
    | 'secrets.list'
    | 'secrets.name'
    | 'secrets.value'
    | 'secrets.type'
    | 'secrets.namespace'
    | 'secrets.zone'
    | 'secrets.environment'
    | 'secrets.tags'
    | 'secrets.metadata'
    | 'secrets.created'
    | 'secrets.modified'
    | 'secrets.owner'
    | 'secrets.shared'
    | 'secrets.private'
    | 'secrets.reveal'
    | 'secrets.hide'
    | 'secrets.copy'
    | 'secrets.duplicate'
    | 'secrets.empty'
    | 'secrets.search_placeholder'
    | 'secrets.filter_by_type'
    | 'secrets.filter_by_namespace'
    | 'secrets.sort_by_name'
    | 'secrets.sort_by_date'
    | 'secrets.bulk_select'
    | 'secrets.bulk_delete'
    | 'secrets.bulk_share'
    | 'sharing.title'
    | 'sharing.share_with'
    | 'sharing.permissions'
    | 'sharing.read_only'
    | 'sharing.read_write'
    | 'sharing.recipient'
    | 'sharing.created_by'
    | 'sharing.created_at'
    | 'sharing.revoke'
    | 'sharing.self_remove'
    | 'sharing.history'
    | 'sharing.activity'
    | 'sharing.search_users'
    | 'sharing.search_groups'
    | 'sharing.no_shares'
    | 'sharing.shared_with_me'
    | 'sharing.my_shares'
    | 'dashboard.title'
    | 'dashboard.welcome'
    | 'dashboard.overview'
    | 'dashboard.statistics'
    | 'dashboard.recent_activity'
    | 'dashboard.quick_actions'
    | 'dashboard.system_health'
    | 'dashboard.total_secrets'
    | 'dashboard.shared_secrets'
    | 'dashboard.active_users'
    | 'dashboard.uptime'
    | 'dashboard.response_time'
    | 'profile.title'
    | 'profile.information'
    | 'profile.security'
    | 'profile.preferences'
    | 'profile.notifications'
    | 'profile.change_password'
    | 'profile.current_password'
    | 'profile.new_password'
    | 'profile.confirm_password'
    | 'profile.two_factor'
    | 'profile.language'
    | 'profile.timezone'
    | 'profile.theme'
    | 'profile.theme_light'
    | 'profile.theme_dark'
    | 'profile.theme_system'
    | 'profile.email_notifications'
    | 'profile.browser_notifications'
    | 'profile.security_alerts'
    | 'auth.login'
    | 'auth.logout'
    | 'auth.register'
    | 'auth.forgot_password'
    | 'auth.reset_password'
    | 'auth.remember_me'
    | 'auth.sign_in'
    | 'auth.sign_up'
    | 'auth.sign_out'
    | 'auth.email_required'
    | 'auth.password_required'
    | 'auth.invalid_credentials'
    | 'auth.session_expired'
    | 'auth.two_factor_required'
    | 'auth.verification_code'
    | 'errors.generic'
    | 'errors.network'
    | 'errors.unauthorized'
    | 'errors.forbidden'
    | 'errors.not_found'
    | 'errors.server_error'
    | 'errors.validation'
    | 'errors.required_field'
    | 'errors.invalid_email'
    | 'errors.password_too_short'
    | 'errors.passwords_dont_match'
    | 'success.saved'
    | 'success.created'
    | 'success.updated'
    | 'success.deleted'
    | 'success.shared'
    | 'success.copied'
    | 'success.exported'
    | 'success.imported'
    | 'accessibility.skip_to_content'
    | 'accessibility.main_navigation'
    | 'accessibility.search'
    | 'accessibility.menu'
    | 'accessibility.close_menu'
    | 'accessibility.open_menu'
    | 'accessibility.toggle_theme'
    | 'accessibility.user_menu'
    | 'accessibility.notifications'
    | 'accessibility.loading'
    | 'accessibility.error'
    | 'accessibility.success'
    | 'accessibility.warning'
    | 'accessibility.info'
    | 'accessibility.required_field'
    | 'accessibility.optional_field'
    | 'accessibility.show_password'
    | 'accessibility.hide_password'
    | 'accessibility.copy_to_clipboard'
    | 'accessibility.sort_ascending'
    | 'accessibility.sort_descending'
    | 'accessibility.filter_active'
    | 'accessibility.page_navigation'
    | 'accessibility.current_page'
    | 'accessibility.go_to_page'
    | 'accessibility.previous_page'
    | 'accessibility.next_page'
    | 'accessibility.first_page'
    | 'accessibility.last_page';

// Translation data structure
interface TranslationData {
    [key: string]: string | TranslationData;
}

// Default translations (English)
const defaultTranslations: TranslationData = {
    common: {
        save: 'Save',
        cancel: 'Cancel',
        delete: 'Delete',
        edit: 'Edit',
        create: 'Create',
        search: 'Search',
        loading: 'Loading...',
        error: 'Error',
        success: 'Success',
        warning: 'Warning',
        info: 'Information',
        yes: 'Yes',
        no: 'No',
        close: 'Close',
        back: 'Back',
        next: 'Next',
        previous: 'Previous',
        refresh: 'Refresh',
        export: 'Export',
        import: 'Import',
        copy: 'Copy',
        share: 'Share',
        view: 'View',
        settings: 'Settings',
        profile: 'Profile',
        logout: 'Logout',
        login: 'Login',
        register: 'Register',
        password: 'Password',
        email: 'Email',
        username: 'Username',
        name: 'Name',
        type: 'Type',
        status: 'Status',
        actions: 'Actions',
        date: 'Date',
        time: 'Time',
        created: 'Created',
        updated: 'Updated',
        modified: 'Modified',
        owner: 'Owner',
        permissions: 'Permissions',
        tags: 'Tags',
        metadata: 'Metadata',
        description: 'Description',
        value: 'Value',
        required: 'Required',
        optional: 'Optional',
        all: 'All',
        none: 'None',
        select: 'Select',
        clear: 'Clear',
        filter: 'Filter',
        sort: 'Sort',
        page: 'Page',
        of: 'of',
        total: 'Total',
        results: 'results',
        items: 'items',
        showing: 'Showing',
        to: 'to',
        from: 'from',
    },
    secrets: {
        title: 'Secrets',
        create: 'Create Secret',
        edit: 'Edit Secret',
        delete: 'Delete Secret',
        share: 'Share Secret',
        view: 'View Secret',
        list: 'Secret List',
        name: 'Secret Name',
        value: 'Secret Value',
        type: 'Secret Type',
        namespace: 'Namespace',
        zone: 'Zone',
        environment: 'Environment',
        tags: 'Tags',
        metadata: 'Metadata',
        created: 'Created',
        modified: 'Last Modified',
        owner: 'Owner',
        shared: 'Shared',
        private: 'Private',
        reveal: 'Reveal',
        hide: 'Hide',
        copy: 'Copy',
        duplicate: 'Duplicate',
        empty: 'No secrets found',
        search_placeholder: 'Search secrets...',
        filter_by_type: 'Filter by type',
        filter_by_namespace: 'Filter by namespace',
        sort_by_name: 'Sort by name',
        sort_by_date: 'Sort by date',
        bulk_select: 'Select multiple',
        bulk_delete: 'Delete selected',
        bulk_share: 'Share selected',
    },
    sharing: {
        title: 'Sharing',
        share_with: 'Share with',
        permissions: 'Permissions',
        read_only: 'Read Only',
        read_write: 'Read & Write',
        recipient: 'Recipient',
        created_by: 'Created by',
        created_at: 'Created at',
        revoke: 'Revoke Access',
        self_remove: 'Remove Myself',
        history: 'Sharing History',
        activity: 'Sharing Activity',
        search_users: 'Search users...',
        search_groups: 'Search groups...',
        no_shares: 'No shares found',
        shared_with_me: 'Shared with me',
        my_shares: 'My shares',
    },
    dashboard: {
        title: 'Dashboard',
        welcome: 'Welcome back',
        overview: 'Overview',
        statistics: 'Statistics',
        recent_activity: 'Recent Activity',
        quick_actions: 'Quick Actions',
        system_health: 'System Health',
        total_secrets: 'Total Secrets',
        shared_secrets: 'Shared Secrets',
        active_users: 'Active Users',
        uptime: 'Uptime',
        response_time: 'Response Time',
    },
    profile: {
        title: 'Profile',
        information: 'Profile Information',
        security: 'Security',
        preferences: 'Preferences',
        notifications: 'Notifications',
        change_password: 'Change Password',
        current_password: 'Current Password',
        new_password: 'New Password',
        confirm_password: 'Confirm Password',
        two_factor: 'Two-Factor Authentication',
        language: 'Language',
        timezone: 'Timezone',
        theme: 'Theme',
        theme_light: 'Light',
        theme_dark: 'Dark',
        theme_system: 'System',
        email_notifications: 'Email Notifications',
        browser_notifications: 'Browser Notifications',
        security_alerts: 'Security Alerts',
    },
    auth: {
        login: 'Login',
        logout: 'Logout',
        register: 'Register',
        forgot_password: 'Forgot Password',
        reset_password: 'Reset Password',
        remember_me: 'Remember me',
        sign_in: 'Sign In',
        sign_up: 'Sign Up',
        sign_out: 'Sign Out',
        email_required: 'Email is required',
        password_required: 'Password is required',
        invalid_credentials: 'Invalid email or password',
        session_expired: 'Your session has expired',
        two_factor_required: 'Two-factor authentication required',
        verification_code: 'Verification Code',
    },
    errors: {
        generic: 'An unexpected error occurred',
        network: 'Network error. Please check your connection.',
        unauthorized: 'You are not authorized to perform this action',
        forbidden: 'Access denied',
        not_found: 'The requested resource was not found',
        server_error: 'Server error. Please try again later.',
        validation: 'Please check your input and try again',
        required_field: 'This field is required',
        invalid_email: 'Please enter a valid email address',
        password_too_short: 'Password must be at least 8 characters',
        passwords_dont_match: 'Passwords do not match',
    },
    success: {
        saved: 'Changes saved successfully',
        created: 'Created successfully',
        updated: 'Updated successfully',
        deleted: 'Deleted successfully',
        shared: 'Shared successfully',
        copied: 'Copied to clipboard',
        exported: 'Exported successfully',
        imported: 'Imported successfully',
    },
    accessibility: {
        skip_to_content: 'Skip to main content',
        main_navigation: 'Main navigation',
        search: 'Search',
        menu: 'Menu',
        close_menu: 'Close menu',
        open_menu: 'Open menu',
        toggle_theme: 'Toggle theme',
        user_menu: 'User menu',
        notifications: 'Notifications',
        loading: 'Loading content',
        error: 'Error message',
        success: 'Success message',
        warning: 'Warning message',
        info: 'Information message',
        required_field: 'Required field',
        optional_field: 'Optional field',
        show_password: 'Show password',
        hide_password: 'Hide password',
        copy_to_clipboard: 'Copy to clipboard',
        sort_ascending: 'Sort ascending',
        sort_descending: 'Sort descending',
        filter_active: 'Filter is active',
        page_navigation: 'Page navigation',
        current_page: 'Current page',
        go_to_page: 'Go to page',
        previous_page: 'Previous page',
        next_page: 'Next page',
        first_page: 'First page',
        last_page: 'Last page',
    },
};

// Translation cache
const translationCache = new Map<string, TranslationData>();

// Load translations from backend
const loadTranslations = async (language: string): Promise<TranslationData> => {
    if (translationCache.has(language)) {
        return translationCache.get(language)!;
    }

    try {
        // In a real app, this would fetch from the API
        // For now, we'll use the existing locale files
        const response = await fetch(`/locales/${language}.json`);

        if (!response.ok) {
            throw new Error(`Failed to load translations for ${language}`);
        }

        const translations = await response.json();
        translationCache.set(language, translations);
        return translations;
    } catch (error) {
        console.warn(`Failed to load translations for ${language}, falling back to default`, error);
        translationCache.set(language, defaultTranslations);
        return defaultTranslations;
    }
};

// Get nested translation value
const getNestedValue = (obj: TranslationData, path: string): string => {
    const keys = path.split('.');
    let current: any = obj;

    for (const key of keys) {
        if (current && typeof current === 'object' && key in current) {
            current = current[key];
        } else {
            return path; // Return the key if translation not found
        }
    }

    return typeof current === 'string' ? current : path;
};

// Translation hook
export const useTranslation = () => {
    const { language } = usePreferencesStore();
    const [translations, setTranslations] = React.useState<TranslationData>(defaultTranslations);
    const [isLoading, setIsLoading] = React.useState(false);

    // Load translations when language changes
    React.useEffect(() => {
        const loadLanguageTranslations = async () => {
            setIsLoading(true);
            try {
                const newTranslations = await loadTranslations(language);
                setTranslations(newTranslations);
            } catch (error) {
                console.error('Failed to load translations:', error);
                setTranslations(defaultTranslations);
            } finally {
                setIsLoading(false);
            }
        };

        loadLanguageTranslations();
    }, [language]);

    // Translation function
    const t = React.useCallback((key: TranslationKey, params?: Record<string, string | number>): string => {
        let translation = getNestedValue(translations, key);

        // Replace parameters in translation
        if (params) {
            Object.entries(params).forEach(([paramKey, paramValue]) => {
                translation = translation.replace(new RegExp(`{{${paramKey}}}`, 'g'), String(paramValue));
            });
        }

        return translation;
    }, [translations]);

    // Pluralization function
    const tp = React.useCallback((key: TranslationKey, count: number, params?: Record<string, string | number>): string => {
        const pluralKey = count === 1 ? key : `${key}_plural` as TranslationKey;
        return t(pluralKey, { count, ...params });
    }, [t]);

    return {
        t,
        tp,
        language,
        isLoading,
        translations,
    };
};

// Translation component for JSX
interface TransProps {
    i18nKey: TranslationKey;
    params?: Record<string, string | number>;
    count?: number;
    children?: React.ReactNode;
}

export const Trans: React.FC<TransProps> = ({ i18nKey, params, count, children }) => {
    const { t, tp } = useTranslation();

    const translation = count !== undefined ? tp(i18nKey, count, params) : t(i18nKey, params);

    if (children) {
        // If children are provided, use them as fallback
        return <>{ translation || children
    } </>;
}

return <>{ translation } </>;
};

// Format date/time with current locale
export const useLocaleFormat = () => {
    const { language, timezone } = usePreferencesStore();

    const formatDate = React.useCallback((date: string | Date, options?: Intl.DateTimeFormatOptions) => {
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        return new Intl.DateTimeFormat(language, {
            timeZone: timezone,
            ...options,
        }).format(dateObj);
    }, [language, timezone]);

    const formatTime = React.useCallback((date: string | Date, options?: Intl.DateTimeFormatOptions) => {
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        return new Intl.DateTimeFormat(language, {
            timeZone: timezone,
            hour: '2-digit',
            minute: '2-digit',
            ...options,
        }).format(dateObj);
    }, [language, timezone]);

    const formatDateTime = React.useCallback((date: string | Date, options?: Intl.DateTimeFormatOptions) => {
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        return new Intl.DateTimeFormat(language, {
            timeZone: timezone,
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            ...options,
        }).format(dateObj);
    }, [language, timezone]);

    const formatNumber = React.useCallback((number: number, options?: Intl.NumberFormatOptions) => {
        return new Intl.NumberFormat(language, options).format(number);
    }, [language]);

    const formatCurrency = React.useCallback((amount: number, currency = 'USD', options?: Intl.NumberFormatOptions) => {
        return new Intl.NumberFormat(language, {
            style: 'currency',
            currency,
            ...options,
        }).format(amount);
    }, [language]);

    const formatRelativeTime = React.useCallback((date: string | Date) => {
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

        if (diffInSeconds < 60) {
            return 'just now';
        } else if (diffInSeconds < 3600) {
            const minutes = Math.floor(diffInSeconds / 60);
            return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        } else if (diffInSeconds < 86400) {
            const hours = Math.floor(diffInSeconds / 3600);
            return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        } else if (diffInSeconds < 2592000) {
            const days = Math.floor(diffInSeconds / 86400);
            return `${days} day${days > 1 ? 's' : ''} ago`;
        } else {
            return formatDate(dateObj, { year: 'numeric', month: 'short', day: 'numeric' });
        }
    }, [formatDate]);

    return {
        formatDate,
        formatTime,
        formatDateTime,
        formatNumber,
        formatCurrency,
        formatRelativeTime,
    };
};

// Preload translations for better performance
export const preloadTranslations = (languages: string[]) => {
    languages.forEach(language => {
        if (!translationCache.has(language)) {
            loadTranslations(language).catch(error => {
                console.warn(`Failed to preload translations for ${language}:`, error);
            });
        }
    });
};