'use client';

import { useEffect } from 'react';
import { useSocket } from '@/lib/socket/use-socket';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export function useAdNotifications() {
  const { socket, isConnected, on } = useSocket();
  const router = useRouter();
  const { data: session } = useSession();

  useEffect(() => {
    if (!isConnected || !socket) return;

    // Handle ad approved notification
    const unsubApproved = on('ad:approved', (data) => {
      toast.success(data.message, {
        description: data.approvedPrice ? `Approved price: $${data.approvedPrice}` : undefined,
        action: {
          label: 'View Ad',
          onClick: () => router.push('/dashboard/provider/featured-ads')
        }
      });
    });

    // Handle ad rejected notification
    const unsubRejected = on('ad:rejected', (data) => {
      toast.error(data.message, {
        description: `Reason: ${data.reason}`,
        action: {
          label: 'View Ad',
          onClick: () => router.push('/dashboard/provider/featured-ads')
        }
      });
    });

    // Handle ad expiring notification
    const unsubExpiring = on('ad:expiring', (data) => {
      toast.warning(data.message, {
        description: `Renew your ad to keep it active`,
        action: {
          label: 'Renew Ad',
          onClick: () => router.push('/dashboard/provider/featured-ads')
        }
      });
    });

    // Handle ad milestone notification
    const unsubMilestone = on('ad:milestone', (data) => {
      toast.success(data.message, {
        description: `${data.impressions} impressions, ${data.clicks} clicks`,
        action: {
          label: 'View Analytics',
          onClick: () => router.push('/dashboard/provider/featured-ads/analytics')
        }
      });
    });

    // Handle new pending ad notification (for admins)
    const unsubNewPending = on('ad:new-pending', (data) => {
      if (session?.user?.role === 'admin') {
        toast.info(data.message, {
          description: `Proposed price: $${data.proposedPrice}`,
          action: {
            label: 'Review',
            onClick: () => router.push('/dashboard/admin/featured-ads')
          }
        });
      }
    });

    // Cleanup
    return () => {
      unsubApproved();
      unsubRejected();
      unsubExpiring();
      unsubMilestone();
      unsubNewPending();
    };
  }, [isConnected, socket, on, router, session]);
}