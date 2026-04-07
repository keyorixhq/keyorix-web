import React from 'react';

// Performance monitoring utilities
export interface PerformanceMetrics {
    loadTime: number;
    renderTime: number;
    interactionTime: number;
    memoryUsage: number;
    bundleSize: number;
}

// Performance monitoring hook
export const usePerformanceMonitoring = () => {
    const [metrics, setMetrics] = React.useState<Partial<PerformanceMetrics>>({});

    React.useEffect(() => {
        // Measure initial load time
        const loadTime = performance.now();

        // Measure memory usage if available
        const memoryUsage = (performance as any).memory?.usedJSHeapSize || 0;

        setMetrics(prev => ({
            ...prev,
            loadTime,
            memoryUsage,
        }));

        // Report to analytics service (in real app)
        if (process.env.NODE_ENV === 'production') {
            // reportMetrics({ loadTime, memoryUsage });
        }
    }, []);

    const measureInteraction = React.useCallback((name: string, fn: () => void) => {
        const startTime = performance.now();
        fn();
        const endTime = performance.now();
        const interactionTime = endTime - startTime;

        setMetrics(prev => ({
            ...prev,
            interactionTime,
        }));

        // Report interaction timing
        if (process.env.NODE_ENV === 'production') {
            // reportInteraction(name, interactionTime);
        }
    }, []);

    return {
        metrics,
        measureInteraction,
    };
};

// Code splitting utilities
export const createLazyComponent = <T extends React.ComponentType<any>>(
    importFn: () => Promise<{ default: T }>,
    fallback?: React.ComponentType
) => {
    const LazyComponent = React.lazy(importFn);

    return React.forwardRef<any, React.ComponentProps<T>>((props, ref) => (
        <React.Suspense 
            fallback= {
            fallback? React.createElement(fallback) : 
                < div className = "flex items-center justify-center p-8" >
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" > </div>
    </div>
            }
        >
    <LazyComponent { ...props } ref = { ref } />
        </React.Suspense>
    ));
};

// Bundle analysis utilities
export const analyzeBundleSize = () => {
    if (typeof window !== 'undefined' && 'performance' in window) {
        const entries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
        const entry = entries[0];

        if (entry) {
            return {
                transferSize: entry.transferSize,
                encodedBodySize: entry.encodedBodySize,
                decodedBodySize: entry.decodedBodySize,
            };
        }
    }

    return null;
};

// Image optimization utilities
export const createOptimizedImage = (src: string, options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'avif' | 'jpeg' | 'png';
} = {}) => {
    const { width, height, quality = 80, format = 'webp' } = options;

    // In a real app, this would integrate with an image optimization service
    // For now, we'll return the original src with query parameters
    const params = new URLSearchParams();
    if (width) params.set('w', width.toString());
    if (height) params.set('h', height.toString());
    params.set('q', quality.toString());
    params.set('f', format);

    return `${src}?${params.toString()}`;
};

// Virtualization utilities for large lists
export const useVirtualization = <T>(
    items: T[],
    itemHeight: number,
    containerHeight: number
) => {
    const [scrollTop, setScrollTop] = React.useState(0);

    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
        startIndex + Math.ceil(containerHeight / itemHeight) + 1,
        items.length
    );

    const visibleItems = items.slice(startIndex, endIndex);
    const totalHeight = items.length * itemHeight;
    const offsetY = startIndex * itemHeight;

    return {
        visibleItems,
        totalHeight,
        offsetY,
        startIndex,
        endIndex,
        setScrollTop,
    };
};

// Debouncing utility
export const useDebounce = <T>(value: T, delay: number): T => {
    const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

    React.useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
};

// Throttling utility
export const useThrottle = <T extends (...args: any[]) => any>(
    callback: T,
    delay: number
): T => {
    const lastRun = React.useRef(Date.now());

    return React.useCallback(
        ((...args) => {
            if (Date.now() - lastRun.current >= delay) {
                callback(...args);
                lastRun.current = Date.now();
            }
        }) as T,
        [callback, delay]
    );
};

// Intersection Observer for lazy loading
export const useIntersectionObserver = (
    options: IntersectionObserverInit = {}
) => {
    const [isIntersecting, setIsIntersecting] = React.useState(false);
    const [entry, setEntry] = React.useState<IntersectionObserverEntry | null>(null);
    const elementRef = React.useRef<HTMLElement>(null);

    React.useEffect(() => {
        const element = elementRef.current;
        if (!element) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsIntersecting(entry.isIntersecting);
                setEntry(entry);
            },
            {
                threshold: 0.1,
                ...options,
            }
        );

        observer.observe(element);

        return () => {
            observer.unobserve(element);
        };
    }, [options]);

    return {
        elementRef,
        isIntersecting,
        entry,
    };
};

// Memory leak prevention
export const useMemoryLeakPrevention = () => {
    const timeoutsRef = React.useRef<Set<NodeJS.Timeout>>(new Set());
    const intervalsRef = React.useRef<Set<NodeJS.Timeout>>(new Set());
    const listenersRef = React.useRef<Map<EventTarget, Map<string, EventListener>>>(new Map());

    const setTimeout = React.useCallback((callback: () => void, delay: number) => {
        const timeoutId = globalThis.setTimeout(callback, delay);
        timeoutsRef.current.add(timeoutId);
        return timeoutId;
    }, []);

    const clearTimeout = React.useCallback((timeoutId: NodeJS.Timeout) => {
        globalThis.clearTimeout(timeoutId);
        timeoutsRef.current.delete(timeoutId);
    }, []);

    const setInterval = React.useCallback((callback: () => void, delay: number) => {
        const intervalId = globalThis.setInterval(callback, delay);
        intervalsRef.current.add(intervalId);
        return intervalId;
    }, []);

    const clearInterval = React.useCallback((intervalId: NodeJS.Timeout) => {
        globalThis.clearInterval(intervalId);
        intervalsRef.current.delete(intervalId);
    }, []);

    const addEventListener = React.useCallback((
        target: EventTarget,
        type: string,
        listener: EventListener,
        options?: boolean | AddEventListenerOptions
    ) => {
        target.addEventListener(type, listener, options);

        if (!listenersRef.current.has(target)) {
            listenersRef.current.set(target, new Map());
        }
        listenersRef.current.get(target)!.set(type, listener);
    }, []);

    const removeEventListener = React.useCallback((
        target: EventTarget,
        type: string,
        listener: EventListener,
        options?: boolean | EventListenerOptions
    ) => {
        target.removeEventListener(type, listener, options);

        const targetListeners = listenersRef.current.get(target);
        if (targetListeners) {
            targetListeners.delete(type);
            if (targetListeners.size === 0) {
                listenersRef.current.delete(target);
            }
        }
    }, []);

    // Cleanup on unmount
    React.useEffect(() => {
        return () => {
            // Clear all timeouts
            timeoutsRef.current.forEach(timeoutId => {
                globalThis.clearTimeout(timeoutId);
            });
            timeoutsRef.current.clear();

            // Clear all intervals
            intervalsRef.current.forEach(intervalId => {
                globalThis.clearInterval(intervalId);
            });
            intervalsRef.current.clear();

            // Remove all event listeners
            listenersRef.current.forEach((listeners, target) => {
                listeners.forEach((listener, type) => {
                    target.removeEventListener(type, listener);
                });
            });
            listenersRef.current.clear();
        };
    }, []);

    return {
        setTimeout,
        clearTimeout,
        setInterval,
        clearInterval,
        addEventListener,
        removeEventListener,
    };
};

// Resource preloading
export const preloadResource = (href: string, as: string, type?: string) => {
    if (typeof document === 'undefined') return;

    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = href;
    link.as = as;
    if (type) link.type = type;

    document.head.appendChild(link);

    return () => {
        if (link.parentNode) {
            link.parentNode.removeChild(link);
        }
    };
};

// Critical resource hints
export const addResourceHints = () => {
    if (typeof document === 'undefined') return;

    // DNS prefetch for external domains
    const dnsPrefetch = (domain: string) => {
        const link = document.createElement('link');
        link.rel = 'dns-prefetch';
        link.href = domain;
        document.head.appendChild(link);
    };

    // Preconnect for critical external resources
    const preconnect = (domain: string) => {
        const link = document.createElement('link');
        link.rel = 'preconnect';
        link.href = domain;
        document.head.appendChild(link);
    };

    // Add common resource hints
    dnsPrefetch('//fonts.googleapis.com');
    dnsPrefetch('//fonts.gstatic.com');
    preconnect('//api.example.com');

    return { dnsPrefetch, preconnect };
};

// Performance budget monitoring
export const usePerformanceBudget = (budgets: {
    loadTime?: number;
    bundleSize?: number;
    memoryUsage?: number;
}) => {
    const [violations, setViolations] = React.useState<string[]>([]);

    React.useEffect(() => {
        const checkBudgets = () => {
            const newViolations: string[] = [];

            // Check load time budget
            if (budgets.loadTime) {
                const loadTime = performance.now();
                if (loadTime > budgets.loadTime) {
                    newViolations.push(`Load time exceeded budget: ${loadTime.toFixed(2)}ms > ${budgets.loadTime}ms`);
                }
            }

            // Check bundle size budget
            if (budgets.bundleSize) {
                const bundleInfo = analyzeBundleSize();
                if (bundleInfo && bundleInfo.transferSize > budgets.bundleSize) {
                    newViolations.push(`Bundle size exceeded budget: ${bundleInfo.transferSize} > ${budgets.bundleSize}`);
                }
            }

            // Check memory usage budget
            if (budgets.memoryUsage && (performance as any).memory) {
                const memoryUsage = (performance as any).memory.usedJSHeapSize;
                if (memoryUsage > budgets.memoryUsage) {
                    newViolations.push(`Memory usage exceeded budget: ${memoryUsage} > ${budgets.memoryUsage}`);
                }
            }

            setViolations(newViolations);

            // Report violations in development
            if (process.env.NODE_ENV === 'development' && newViolations.length > 0) {
                console.warn('Performance budget violations:', newViolations);
            }
        };

        checkBudgets();

        // Check budgets periodically
        const interval = setInterval(checkBudgets, 10000); // Every 10 seconds

        return () => clearInterval(interval);
    }, [budgets]);

    return violations;
};