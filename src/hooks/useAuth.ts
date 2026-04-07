import { useEffect, useCallback } from 'react';
import { useAuthStore, shouldRefreshToken, isTokenExpired } from '../store/authStore';
import { getEnvConfig } from '../utils';
import { shouldRestoreSession } from '../utils/auth';

const config = getEnvConfig();

export const useAuth = () => {
    const {
        user,
        token,
        isAuthenticated,
        isLoading,
        error,
        login,
        logout,
        refreshToken,
        checkAuth,
        clearError,
        setError,
    } = useAuthStore();

    // Auto-refresh token when needed
    const handleTokenRefresh = useCallback(async () => {
        if (!isAuthenticated || !token) return;

        if (isTokenExpired()) {
            // Token is expired, logout user
            await logout();
            setError('Your session has expired. Please log in again.');
            return;
        }

        if (shouldRefreshToken()) {
            try {
                await refreshToken();
            } catch (error) {
                console.warn('Token refresh failed:', error);
                // Logout will be handled by the refreshToken function
            }
        }
    }, [isAuthenticated, token, logout, refreshToken, setError]);

    // Check authentication status on mount and set up refresh interval
    useEffect(() => {
        let refreshInterval: ReturnType<typeof setInterval>;

        const initAuth = async () => {
            if (isAuthenticated && token) {
                // Check if current session is still valid
                await handleTokenRefresh();

                // Set up periodic token refresh check
                refreshInterval = setInterval(handleTokenRefresh, 60000); // Check every minute
            } else if (shouldRestoreSession()) {
                // Try to restore session from stored data
                await checkAuth();
            } else {
                // No valid session to restore, ensure we're in logged out state
                await checkAuth();
            }
        };

        initAuth();

        return () => {
            if (refreshInterval) {
                clearInterval(refreshInterval);
            }
        };
    }, [isAuthenticated, token, handleTokenRefresh, checkAuth]);

    // Session timeout handling
    useEffect(() => {
        let timeoutId: ReturnType<typeof setTimeout>;

        if (isAuthenticated) {
            const handleSessionTimeout = () => {
                logout();
                setError('Your session has expired due to inactivity. Please log in again.');
            };

            const resetTimeout = () => {
                if (timeoutId) clearTimeout(timeoutId);
                timeoutId = setTimeout(handleSessionTimeout, config.SESSION_TIMEOUT);
            };

            // Reset timeout on user activity
            const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
            const resetTimeoutHandler = () => resetTimeout();

            events.forEach(event => {
                document.addEventListener(event, resetTimeoutHandler, true);
            });

            // Initial timeout setup
            resetTimeout();

            return () => {
                if (timeoutId) clearTimeout(timeoutId);
                events.forEach(event => {
                    document.removeEventListener(event, resetTimeoutHandler, true);
                });
            };
        }

        return () => { }; // Return empty cleanup function if not authenticated
    }, [isAuthenticated, logout, setError]);

    return {
        // State
        user,
        token,
        isAuthenticated,
        isLoading,
        error,

        // Actions
        login,
        logout,
        refreshToken,
        checkAuth,
        clearError,

        // Computed values
        isAdmin: user?.role === 'admin',
        permissions: user?.permissions || [],
        hasPermission: (permission: string) => user?.permissions?.includes(permission) || false,
    };
};