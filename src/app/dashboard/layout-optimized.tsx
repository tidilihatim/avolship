import dynamic from 'next/dynamic';
import { LazyBoundary, LoadingFallback } from '@/lib/performance/react-optimizations';

// Lazy load heavy dashboard components
export const LazyOrdersPage = dynamic(
  () => import('./seller/orders/page'),
  {
    loading: () => <LoadingFallback />,
    ssr: true,
  }
);

export const LazyProductsPage = dynamic(
  () => import('./seller/products/page'),
  {
    loading: () => <LoadingFallback />,
    ssr: true,
  }
);

export const LazyWarehousePage = dynamic(
  () => import('./seller/warehouse/page'),
  {
    loading: () => <LoadingFallback />,
    ssr: true,
  }
);

export const LazyExpeditionsPage = dynamic(
  () => import('./seller/expeditions/page'),
  {
    loading: () => <LoadingFallback />,
    ssr: true,
  }
);

export const LazyCallCenterPage = dynamic(
  () => import('./call_center/orders/page'),
  {
    loading: () => <LoadingFallback />,
    ssr: true,
  }
);

export const LazyAdminUsersPage = dynamic(
  () => import('./admin/users/page'),
  {
    loading: () => <LoadingFallback />,
    ssr: true,
  }
);

export const LazyAdminWarehousePage = dynamic(
  () => import('./admin/warehouse/page'),
  {
    loading: () => <LoadingFallback />,
    ssr: true,
  }
);

// Export a wrapper component for lazy-loaded routes
export function LazyDashboardRoute({ 
  component, 
  ...props 
}: { 
  component: React.ComponentType<any>;
  [key: string]: any;
}) {
  const Component = component;
  
  return (
    <LazyBoundary>
      <Component {...props} />
    </LazyBoundary>
  );
}