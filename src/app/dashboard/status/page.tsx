import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { UserStatus } from '@/lib/db/models/user';

import { Badge } from '@/components/ui/badge';
import StatusApproved from './_components/status-approved';
import StatusRejected from './_components/status-rejected';
import StatusPending from './_components/status-pending';
import { getLoginUserStatus } from '@/app/actions/auth';

export const metadata: Metadata = {
    title: 'Account Status | AvolShip',
    description: 'Check your account approval status',
};

/**
 * Status page component
 * Shows different content based on user approval status
 */
export default async function StatusPage() {

    const t = await getTranslations('status');
    const status = await getLoginUserStatus();

    if(!status) throw new Error('User not found');
    
    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex flex-col items-center justify-center p-4">
            <div className="max-w-3xl w-full mx-auto">
                <div className="mb-8 text-center">
                    <div className="inline-block">
                        <Badge
                            variant={status === UserStatus.APPROVED ? "secondary" : status === UserStatus.REJECTED ? "destructive" : "default"}
                            className="px-3 py-1 text-sm font-medium mb-2"
                        >
                            {status === UserStatus.APPROVED
                                ? t('badge.approved')
                                : status === UserStatus.REJECTED
                                    ? t('badge.rejected')
                                    : t('badge.pending')
                            }
                        </Badge>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight mb-2">{t('title')}</h1>
                    <p className="text-muted-foreground max-w-lg mx-auto">
                        {status === UserStatus.APPROVED
                            ? t('subtitle.approved')
                            : status === UserStatus.REJECTED
                                ? t('subtitle.rejected')
                                : t('subtitle.pending')
                        }
                    </p>
                </div>

                {/* Show different component based on status */}
                {status === UserStatus.APPROVED && <StatusApproved />}
                {status === UserStatus.REJECTED && <StatusRejected />}
                {status === UserStatus.PENDING && <StatusPending />}
            </div>
        </div>
    );
}