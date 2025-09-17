import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { UserStatus } from '@/lib/db/models/user';

interface UserStatusBadgeProps {
  status: UserStatus;
  className?: string;
}

/**
 * User Status Badge Component
 * Displays the user status with appropriate styling
 */
export function UserStatusBadge({ status, className }: UserStatusBadgeProps) {
  const t = useTranslations();
  
  const getStatusConfig = (status: UserStatus) => {
    switch (status) {
      case UserStatus.APPROVED:
        return {
          label: t('users.statuses.approved'),
          variant: 'default' as const,
          className: 'bg-green-100 text-green-800 hover:bg-green-200'
        };
      case UserStatus.PENDING:
        return {
          label: t('users.statuses.pending'),
          variant: 'secondary' as const,
          className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
        };
      case UserStatus.REJECTED:
        return {
          label: t('users.statuses.rejected'),
          variant: 'destructive' as const,
          className: 'bg-red-100 text-red-800 hover:bg-red-200'
        };
      default:
        return {
          label: 'Unknown',
          variant: 'outline' as const,
          className: 'bg-gray-100 text-gray-800 hover:bg-gray-200'
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <Badge 
      variant={config.variant} 
      className={`${config.className} ${className || ''}`}
    >
      {config.label}
    </Badge>
  );
}