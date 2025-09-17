import { useTranslations } from 'next-intl';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { UserRole } from '@/lib/db/models/user';

interface UserRoleSelectProps {
  value: UserRole | '';
  onValueChange: (value: UserRole) => void;
  disabled?: boolean;
  placeholder?: string;
}

/**
 * User Role Select Component
 * Provides a dropdown for selecting user roles with appropriate styling
 */
export function UserRoleSelect({ 
  value, 
  onValueChange, 
  disabled = false, 
  placeholder 
}: UserRoleSelectProps) {
  const t = useTranslations();
  
  const getRoleConfig = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return {
          label: t('users.roles.admin'),
          description: t('users.roles.descriptions.admin'),
          color: 'bg-purple-100 text-purple-800'
        };
      case UserRole.MODERATOR:
        return {
          label: t('users.roles.moderator'),
          description: t('users.roles.descriptions.moderator'),
          color: 'bg-blue-100 text-blue-800'
        };
      case UserRole.SELLER:
        return {
          label: t('users.roles.seller'),
          description: t('users.roles.descriptions.seller'),
          color: 'bg-green-100 text-green-800'
        };
      case UserRole.PROVIDER:
        return {
          label: t('users.roles.provider'),
          description: t('users.roles.descriptions.provider'),
          color: 'bg-orange-100 text-orange-800'
        };
      case UserRole.DELIVERY:
        return {
          label: t('users.roles.delivery'),
          description: t('users.roles.descriptions.delivery'),
          color: 'bg-cyan-100 text-cyan-800'
        };
      case UserRole.SUPPORT:
        return {
          label: t('users.roles.support'),
          description: t('users.roles.descriptions.support'),
          color: 'bg-pink-100 text-pink-800'
        };
      case UserRole.CALL_CENTER:
        return {
          label: t('users.roles.call_center'),
          description: t('users.roles.descriptions.call_center'),
          color: 'bg-indigo-100 text-indigo-800'
        };
      default:
        return {
          label: 'Unknown',
          description: 'Unknown role',
          color: 'bg-gray-100 text-gray-800'
        };
    }
  };

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder || t('users.placeholders.selectRole')}>
          {value && (
            <div className="flex items-center gap-2">
              <Badge className={getRoleConfig(value).color}>
                {getRoleConfig(value).label}
              </Badge>
            </div>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {Object.values(UserRole).map((role) => {
          const config = getRoleConfig(role);
          return (
            <SelectItem key={role} value={role} className="py-3">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <Badge className={config.color}>
                    {config.label}
                  </Badge>
                </div>
                <span className="text-xs text-muted-foreground">
                  {config.description}
                </span>
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}

/**
 * User Role Badge Component
 * Displays the user role as a styled badge
 */
interface UserRoleBadgeProps {
  role: UserRole;
  className?: string;
}

export function UserRoleBadge({ role, className }: UserRoleBadgeProps) {
  const t = useTranslations();
  const config = getRoleConfig(role, t);

  return (
    <Badge className={`${config.color} ${className || ''}`}>
      {config.label}
    </Badge>
  );
}

function getRoleConfig(role: UserRole, t: any) {
  switch (role) {
    case UserRole.ADMIN:
      return {
        label: t('users.roles.admin'),
        color: 'bg-purple-100 text-purple-800 hover:bg-purple-200'
      };
    case UserRole.MODERATOR:
      return {
        label: t('users.roles.moderator'),
        color: 'bg-blue-100 text-blue-800 hover:bg-blue-200'
      };
    case UserRole.SELLER:
      return {
        label: t('users.roles.seller'),
        color: 'bg-green-100 text-green-800 hover:bg-green-200'
      };
    case UserRole.PROVIDER:
      return {
        label: t('users.roles.provider'),
        color: 'bg-orange-100 text-orange-800 hover:bg-orange-200'
      };
    case UserRole.DELIVERY:
      return {
        label: t('users.roles.delivery'),
        color: 'bg-cyan-100 text-cyan-800 hover:bg-cyan-200'
      };
    case UserRole.SUPPORT:
      return {
        label: t('users.roles.support'),
        color: 'bg-pink-100 text-pink-800 hover:bg-pink-200'
      };
    case UserRole.CALL_CENTER:
      return {
        label: t('users.roles.call_center'),
        color: 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200'
      };
    default:
      return {
        label: 'Unknown',
        color: 'bg-gray-100 text-gray-800 hover:bg-gray-200'
      };
  }
}