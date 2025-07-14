import React, { memo, useMemo, useCallback, Suspense, lazy } from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Loading fallback component for lazy-loaded routes
 */
export const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

/**
 * HOC to add memoization to a component
 */
export function withMemo<P extends object>(
  Component: React.ComponentType<P>,
  propsAreEqual?: (prevProps: P, nextProps: P) => boolean
) {
  return memo(Component, propsAreEqual);
}

/**
 * Custom hook for memoized values with dependencies
 */
export function useMemoizedValue<T>(
  factory: () => T,
  deps: React.DependencyList,
  debugName?: string
): T {
  if (process.env.NODE_ENV === 'development' && debugName) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    React.useEffect(() => {
      console.log(`[useMemoizedValue] ${debugName} recalculated`);
    }, deps);
  }
  
  return useMemo(factory, deps);
}

/**
 * Custom hook for stable callbacks
 */
export function useStableCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList
): T {
  return useCallback(callback, deps);
}

/**
 * Debounced value hook
 */
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Intersection Observer hook for lazy loading
 */
export function useIntersectionObserver(
  ref: React.RefObject<Element>,
  options: IntersectionObserverInit = {}
): boolean {
  const [isIntersecting, setIntersecting] = React.useState(false);

  React.useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      setIntersecting(entry.isIntersecting);
    }, options);

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [ref, options]);

  return isIntersecting;
}

/**
 * Virtual list hook for rendering large lists
 */
export function useVirtualList<T>({
  items,
  itemHeight,
  containerHeight,
  overscan = 5,
}: {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}) {
  const [scrollTop, setScrollTop] = React.useState(0);

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  const visibleItems = items.slice(startIndex, endIndex + 1);
  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  return {
    visibleItems,
    totalHeight,
    offsetY,
    onScroll: (e: React.UIEvent<HTMLDivElement>) => {
      setScrollTop(e.currentTarget.scrollTop);
    },
  };
}

/**
 * Lazy load wrapper with error boundary
 */
export function LazyBoundary({
  children,
  fallback = <LoadingFallback />,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  return (
    <React.Suspense fallback={fallback}>
      <ErrorBoundary>{children}</ErrorBoundary>
    </React.Suspense>
  );
}

/**
 * Error boundary component
 */
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error boundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <h2 className="text-red-800 font-semibold">Something went wrong</h2>
          <p className="text-red-600 mt-2">{this.state.error?.message}</p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Create lazy-loaded route components
 */
export const createLazyRoute = (
  importFn: () => Promise<{ default: React.ComponentType<any> }>
) => {
  return lazy(importFn);
};

/**
 * Optimized image component with lazy loading
 */
export const OptimizedImage = memo(({
  src,
  alt,
  className,
  width,
  height,
  priority = false,
}: {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
}) => {
  const imgRef = React.useRef<HTMLImageElement>(null);
  const isVisible = useIntersectionObserver(imgRef, {
    threshold: 0.1,
    rootMargin: '50px',
  });

  const [isLoaded, setIsLoaded] = React.useState(false);
  const [error, setError] = React.useState(false);

  React.useEffect(() => {
    if (priority || isVisible) {
      const img = new Image();
      img.src = src;
      img.onload = () => setIsLoaded(true);
      img.onerror = () => setError(true);
    }
  }, [src, isVisible, priority]);

  if (error) {
    return (
      <div className={`bg-gray-200 ${className}`} style={{ width, height }}>
        <span className="text-gray-400">Failed to load image</span>
      </div>
    );
  }

  return (
    <div ref={imgRef} className={`relative ${className}`} style={{ width, height }}>
      {(!isLoaded || !isVisible) && !priority && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
      {(isVisible || priority) && (
        <img
          src={src}
          alt={alt}
          className={`${className} ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
          onLoad={() => setIsLoaded(true)}
          onError={() => setError(true)}
        />
      )}
    </div>
  );
});

OptimizedImage.displayName = 'OptimizedImage';

/**
 * Performance monitoring wrapper
 */
export function withPerformanceMonitoring<P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
) {
  return (props: P) => {
    React.useEffect(() => {
      if (process.env.NODE_ENV === 'development') {
        console.time(`${componentName} render`);
        return () => {
          console.timeEnd(`${componentName} render`);
        };
      }
    });

    return <Component {...props} />;
  };
}