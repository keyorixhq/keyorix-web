// Application constants

export const APP_CONFIG = {
    NAME: 'Keyorix',
    VERSION: '1.0.0',
    DESCRIPTION: 'Secure Secret Management System',
} as const;

export const API_ENDPOINTS = {
    AUTH: {
        LOGIN: '/api/auth/login',
        LOGOUT: '/api/auth/logout',
        REFRESH: '/api/auth/refresh',
        PROFILE: '/api/auth/profile',
    },
    SECRETS: {
        LIST: '/api/secrets',
        CREATE: '/api/secrets',
        GET: (id: number) => `/api/secrets/${id}`,
        UPDATE: (id: number) => `/api/secrets/${id}`,
        DELETE: (id: number) => `/api/secrets/${id}`,
        VERSIONS: (id: number) => `/api/secrets/${id}/versions`,
    },
    SHARING: {
        LIST: '/api/shares',
        CREATE: '/api/shares',
        GET: (id: number) => `/api/shares/${id}`,
        UPDATE: (id: number) => `/api/shares/${id}`,
        DELETE: (id: number) => `/api/shares/${id}`,
        SELF_REMOVE: (id: number) => `/api/shares/${id}/self-remove`,
    },
    USERS: {
        LIST: '/api/users',
        GET: (id: number) => `/api/users/${id}`,
        SEARCH: '/api/users/search',
    },
    GROUPS: {
        LIST: '/api/groups',
        GET: (id: number) => `/api/groups/${id}`,
        SEARCH: '/api/groups/search',
    },
    ADMIN: {
        STATS: '/api/admin/stats',
        USERS: '/api/admin/users',
        ROLES: '/api/admin/roles',
        AUDIT: '/api/admin/audit',
    },
} as const;

export const ROUTES = {
    HOME: '/',
    LOGIN: '/login',
    DASHBOARD: '/dashboard',
    SECRETS: '/secrets',
    SECRET_DETAIL: (id: number) => `/secrets/${id}`,
    CREATE_SECRET: '/secrets/new',
    EDIT_SECRET: (id: number) => `/secrets/${id}/edit`,
    SHARING: '/sharing',
    SHARED_WITH_ME: '/sharing/with-me',
    SHARED_BY_ME: '/sharing/by-me',
    PROFILE: '/profile',
    SETTINGS: '/settings',
    SECURITY: '/security',
    ADMIN: '/admin',
    ADMIN_USERS: '/admin/users',
    ADMIN_ROLES: '/admin/roles',
    ADMIN_SETTINGS: '/admin/settings',
} as const;

export const SECRET_TYPES = {
    TEXT: 'text',
    PASSWORD: 'password',
    API_KEY: 'api_key',
    CERTIFICATE: 'certificate',
    JSON: 'json',
} as const;

export const PERMISSIONS = {
    READ: 'read',
    WRITE: 'write',
} as const;

export const THEMES = {
    LIGHT: 'light',
    DARK: 'dark',
    SYSTEM: 'system',
} as const;

export const LANGUAGES = {
    EN: 'en',
    RU: 'ru',
    ES: 'es',
    FR: 'fr',
    DE: 'de',
} as const;

export const NOTIFICATION_TYPES = {
    SUCCESS: 'success',
    ERROR: 'error',
    WARNING: 'warning',
    INFO: 'info',
} as const;

export const ACTIVITY_TYPES = {
    CREATED: 'created',
    UPDATED: 'updated',
    SHARED: 'shared',
    ACCESSED: 'accessed',
    DELETED: 'deleted',
} as const;

export const DEFAULT_VALUES = {
    PAGE_SIZE: 20,
    SESSION_TIMEOUT: 3600000, // 1 hour in milliseconds
    CLIPBOARD_CLEAR_TIMEOUT: 30000, // 30 seconds
    DEBOUNCE_DELAY: 300, // milliseconds
    API_TIMEOUT: 30000, // 30 seconds
} as const;

export const VALIDATION_RULES = {
    PASSWORD: {
        MIN_LENGTH: 8,
        REQUIRE_UPPERCASE: true,
        REQUIRE_LOWERCASE: true,
        REQUIRE_NUMBERS: true,
        REQUIRE_SPECIAL_CHARS: true,
    },
    SECRET_NAME: {
        MIN_LENGTH: 1,
        MAX_LENGTH: 255,
        PATTERN: /^[a-zA-Z0-9_-]+$/,
    },
    EMAIL: {
        PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
} as const;