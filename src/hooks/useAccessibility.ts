import React from 'react';
import { usePreferencesStore } from '../store/preferencesStore';
import { a } from 'vitest/dist/types-0373403c';

// Accessibility preferences
interface AccessibilityPreferences {
    reduceMotion: boolean;
    highContrast: boolean;
    largeText: boolean;
    screenReader: boolean;
    keyboardNavigation: boolean;
}

// Focus management hook
export const useFocusManagement = () => {
    const focusableElementsSelector = [
        'a[href]',
        'button:not([disabled])',
        'textarea:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        '[tabindex]:not([tabindex="-1"])',
        '[contenteditable="true"]',
    ].join(', ');

    const getFocusableElements = (container: HTMLElement): HTMLElement[] => {
        return Array.from(container.querySelectorAll(focusableElementsSelector));
    };

    const trapFocus = React.useCallback((container: HTMLElement) => {
        const focusableElements = getFocusableElements(container);
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key !== 'Tab') return;

            if (e.shiftKey) {
                // Shift + Tab
                if (document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement?.focus();
                }
            } else {
                // Tab
                if (document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement?.focus();
                }
            }
        };

        container.addEventListener('keydown', handleKeyDown);

        // Focus the first element
        firstElement?.focus();

        return () => {
            container.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    const restoreFocus = React.useCallback((element: HTMLElement | null) => {
        if (element && typeof element.focus === 'function') {
            // Use setTimeout to ensure the element is visible and focusable
            setTimeout(() => {
                element.focus();
            }, 0);
        }
    }, []);

    const moveFocusToNext = React.useCallback((currentElement: HTMLElement) => {
        const container = document.body;
        const focusableElements = getFocusableElements(container);
        const currentIndex = focusableElements.indexOf(currentElement);

        if (currentIndex !== -1 && currentIndex < focusableElements.length - 1) {
            focusableElements[currentIndex + 1].focus();
        }
    }, []);

    const moveFocusToPrevious = React.useCallback((currentElement: HTMLElement) => {
        const container = document.body;
        const focusableElements = getFocusableElements(container);
        const currentIndex = focusableElements.indexOf(currentElement);

        if (currentIndex > 0) {
            focusableElements[currentIndex - 1].focus();
        }
    }, []);

    return {
        trapFocus,
        restoreFocus,
        moveFocusToNext,
        moveFocusToPrevious,
        getFocusableElements,
    };
};

// Keyboard navigation hook
export const useKeyboardNavigation = () => {
    const { moveFocusToNext, moveFocusToPrevious } = useFocusManagement();

    const handleKeyboardNavigation = React.useCallback((e: KeyboardEvent) => {
        const target = e.target as HTMLElement;

        switch (e.key) {
            case 'ArrowDown':
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    moveFocusToNext(target);
                }
                break;
            case 'ArrowUp':
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    moveFocusToPrevious(target);
                }
                break;
            case 'Home':
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    const container = document.body;
                    const focusableElements = Array.from(
                        container.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')
                    ) as HTMLElement[];
                    focusableElements[0]?.focus();
                }
                break;
            case 'End':
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    const container = document.body;
                    const focusableElements = Array.from(
                        container.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')
                    ) as HTMLElement[];
                    focusableElements[focusableElements.length - 1]?.focus();
                }
                break;
        }
    }, [moveFocusToNext, moveFocusToPrevious]);

    React.useEffect(() => {
        document.addEventListener('keydown', handleKeyboardNavigation);
        return () => {
            document.removeEventListener('keydown', handleKeyboardNavigation);
        };
    }, [handleKeyboardNavigation]);
};

// Screen reader announcements
export const useScreenReader = () => {
    const announceRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        // Create announcement container if it doesn't exist
        if (!announceRef.current) {
            const announcer = document.createElement('div');
            announcer.setAttribute('aria-live', 'polite');
            announcer.setAttribute('aria-atomic', 'true');
            announcer.className = 'sr-only';
            announcer.style.cssText = `
        position: absolute !important;
        width: 1px !important;
        height: 1px !important;
        padding: 0 !important;
        margin: -1px !important;
        overflow: hidden !important;
        clip: rect(0, 0, 0, 0) !important;
        white-space: nowrap !important;
        border: 0 !important;
      `;
            document.body.appendChild(announcer);
            announceRef.current = announcer;
        }

        return () => {
            if (announceRef.current && announceRef.current.parentNode) {
                announceRef.current.parentNode.removeChild(announceRef.current);
            }
        };
    }, []);

    const announce = React.useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
        if (announceRef.current) {
            announceRef.current.setAttribute('aria-live', priority);
            announceRef.current.textContent = message;

            // Clear the message after a short delay to allow for re-announcements
            setTimeout(() => {
                if (announceRef.current) {
                    announceRef.current.textContent = '';
                }
            }, 1000);
        }
    }, []);

    const announceError = React.useCallback((message: string) => {
        announce(`Error: ${message}`, 'assertive');
    }, [announce]);

    const announceSuccess = React.useCallback((message: string) => {
        announce(`Success: ${message}`, 'polite');
    }, [announce]);

    const announceLoading = React.useCallback((message: string = 'Loading') => {
        announce(message, 'polite');
    }, [announce]);

    return {
        announce,
        announceError,
        announceSuccess,
        announceLoading,
    };
};

// Accessibility preferences hook
export const useAccessibilityPreferences = () => {
    const [preferences, setPreferences] = React.useState<AccessibilityPreferences>({
        reduceMotion: false,
        highContrast: false,
        largeText: false,
        screenReader: false,
        keyboardNavigation: true,
    });

    React.useEffect(() => {
        // Detect system preferences
        const mediaQueries = {
            reduceMotion: window.matchMedia('(prefers-reduced-motion: reduce)'),
            highContrast: window.matchMedia('(prefers-contrast: high)'),
            largeText: window.matchMedia('(prefers-reduced-data: reduce)'), // Approximation
        };

        const updatePreferences = () => {
            setPreferences(prev => ({
                ...prev,
                reduceMotion: mediaQueries.reduceMotion.matches,
                highContrast: mediaQueries.highContrast.matches,
                screenReader: !!navigator.userAgent.match(/NVDA|JAWS|VoiceOver|ORCA|Narrator/i),
            }));
        };

        // Initial check
        updatePreferences();

        // Listen for changes
        Object.values(mediaQueries).forEach(mq => {
            mq.addEventListener('change', updatePreferences);
        });

        return () => {
            Object.values(mediaQueries).forEach(mq => {
                mq.removeEventListener('change', updatePreferences);
            });
        };
    }, []);

    const updatePreference = React.useCallback((key: keyof AccessibilityPreferences, value: boolean) => {
        setPreferences(prev => ({ ...prev, [key]: value }));
    }, []);

    return {
        preferences,
        updatePreference,
    };
};

// Skip link hook
export const useSkipLink = () => {
    const skipLinkRef = React.useRef<HTMLAnchorElement>(null);

    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Show skip link on first Tab press
            if (e.key === 'Tab' && !e.shiftKey && skipLinkRef.current) {
                skipLinkRef.current.focus();
            }
        };

        document.addEventListener('keydown', handleKeyDown, { once: true });

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    const SkipLink: React.FC<{ href: string; children: React.ReactNode }> = ({ href, children }) => (
        <a
            ref= { skipLinkRef }
    href = { href }
    className = "sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded focus:shadow-lg"
    onFocus = {(e) => {
    e.currentTarget.classList.remove('sr-only');
}}
onBlur = {(e) => {
    e.currentTarget.classList.add('sr-only');
}}
        >
    { children }
    </a>
    );

return { SkipLink };
};

// ARIA attributes helper
export const useAriaAttributes = () => {
    const generateId = React.useCallback((prefix: string = 'aria') => {
        return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
    }, []);

    const getAriaProps = React.useCallback((options: {
        label?: string;
        labelledBy?: string;
        describedBy?: string;
        expanded?: boolean;
        selected?: boolean;
        checked?: boolean;
        disabled?: boolean;
        required?: boolean;
        invalid?: boolean;
        live?: 'polite' | 'assertive' | 'off';
        atomic?: boolean;
        busy?: boolean;
        hidden?: boolean;
        role?: string;
        level?: number;
        setSize?: number;
        posInSet?: number;
    }) => {
        const ariaProps: Record<string, any> = {};

        if (options.label) ariaProps['aria-label'] = options.label;
        if (options.labelledBy) ariaProps['aria-labelledby'] = options.labelledBy;
        if (options.describedBy) ariaProps['aria-describedby'] = options.describedBy;
        if (options.expanded !== undefined) ariaProps['aria-expanded'] = options.expanded;
        if (options.selected !== undefined) ariaProps['aria-selected'] = options.selected;
        if (options.checked !== undefined) ariaProps['aria-checked'] = options.checked;
        if (options.disabled !== undefined) ariaProps['aria-disabled'] = options.disabled;
        if (options.required !== undefined) ariaProps['aria-required'] = options.required;
        if (options.invalid !== undefined) ariaProps['aria-invalid'] = options.invalid;
        if (options.live) ariaProps['aria-live'] = options.live;
        if (options.atomic !== undefined) ariaProps['aria-atomic'] = options.atomic;
        if (options.busy !== undefined) ariaProps['aria-busy'] = options.busy;
        if (options.hidden !== undefined) ariaProps['aria-hidden'] = options.hidden;
        if (options.role) ariaProps['role'] = options.role;
        if (options.level) ariaProps['aria-level'] = options.level;
        if (options.setSize) ariaProps['aria-setsize'] = options.setSize;
        if (options.posInSet) ariaProps['aria-posinset'] = options.posInSet;

        return ariaProps;
    }, []);

    return {
        generateId,
        getAriaProps,
    };
};

// Color contrast utilities
export const useColorContrast = () => {
    const { preferences } = useAccessibilityPreferences();

    const getContrastRatio = React.useCallback((color1: string, color2: string): number => {
        // Simplified contrast ratio calculation
        // In a real implementation, you'd use a proper color contrast library
        const getLuminance = (color: string): number => {
            // This is a simplified version - use a proper color library in production
            const hex = color.replace('#', '');
            const r = parseInt(hex.substr(0, 2), 16) / 255;
            const g = parseInt(hex.substr(2, 2), 16) / 255;
            const b = parseInt(hex.substr(4, 2), 16) / 255;

            const [rs, gs, bs] = [r, g, b].map(c => {
                return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
            });

            return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
        };

        const l1 = getLuminance(color1);
        const l2 = getLuminance(color2);
        const lighter = Math.max(l1, l2);
        const darker = Math.min(l1, l2);

        return (lighter + 0.05) / (darker + 0.05);
    }, []);

    const meetsWCAGAA = React.useCallback((foreground: string, background: string): boolean => {
        return getContrastRatio(foreground, background) >= 4.5;
    }, [getContrastRatio]);

    const meetsWCAGAAA = React.useCallback((foreground: string, background: string): boolean => {
        return getContrastRatio(foreground, background) >= 7;
    }, [getContrastRatio]);

    const getAccessibleColors = React.useCallback(() => {
        if (preferences.highContrast) {
            return {
                primary: '#000000',
                secondary: '#ffffff',
                accent: '#0066cc',
                error: '#cc0000',
                success: '#006600',
                warning: '#cc6600',
            };
        }

        return {
            primary: '#1f2937',
            secondary: '#6b7280',
            accent: '#3b82f6',
            error: '#ef4444',
            success: '#10b981',
            warning: '#f59e0b',
        };
    }, [preferences.highContrast]);

    return {
        getContrastRatio,
        meetsWCAGAA,
        meetsWCAGAAA,
        getAccessibleColors,
    };
};

// Reduced motion hook
export const useReducedMotion = () => {
    const { preferences } = useAccessibilityPreferences();

    const shouldReduceMotion = preferences.reduceMotion;

    const getAnimationProps = React.useCallback((normalProps: any, reducedProps: any = {}) => {
        return shouldReduceMotion ? { ...normalProps, ...reducedProps } : normalProps;
    }, [shouldReduceMotion]);

    const getTransitionDuration = React.useCallback((normal: string, reduced: string = '0s') => {
        return shouldReduceMotion ? reduced : normal;
    }, [shouldReduceMotion]);

    return {
        shouldReduceMotion,
        getAnimationProps,
        getTransitionDuration,
    };
};