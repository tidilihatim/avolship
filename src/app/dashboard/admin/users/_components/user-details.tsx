'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Edit, ArrowLeft, User, MapPin, Shield, Building2, Calendar, Mail, Phone, Globe } from 'lucide-react';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

import { UserRole, UserStatus } from '@/lib/db/models/user';
import { updateUserStatus } from '@/app/actions/user';

interface UserDetailsProps {
  user: any;
}

/**
 * UserDetails Component
 * Displays detailed information about a user
 */
export default function UserDetails({ user }: UserDetailsProps) {
  const t = useTranslations();
  const router = useRouter();

  // Get role configuration
  const getRoleConfig = (role: UserRole) => {
    const roleConfigs = {
      [UserRole.ADMIN]: { label: t('users.roles.admin'), description: t('users.roles.descriptions.admin'), className: 'bg-purple-50 text-purple-700 hover:bg-purple-50 border-purple-200' },
      [UserRole.MODERATOR]: { label: t('users.roles.moderator'), description: t('users.roles.descriptions.moderator'), className: 'bg-blue-50 text-blue-700 hover:bg-blue-50 border-blue-200' },
      [UserRole.SELLER]: { label: t('users.roles.seller'), description: t('users.roles.descriptions.seller'), className: 'bg-green-50 text-green-700 hover:bg-green-50 border-green-200' },
      [UserRole.PROVIDER]: { label: t('users.roles.provider'), description: t('users.roles.descriptions.provider'), className: 'bg-orange-50 text-orange-700 hover:bg-orange-50 border-orange-200' },
      [UserRole.DELIVERY]: { label: t('users.roles.delivery'), description: t('users.roles.descriptions.delivery'), className: 'bg-cyan-50 text-cyan-700 hover:bg-cyan-50 border-cyan-200' },
      [UserRole.SUPPORT]: { label: t('users.roles.support'), description: t('users.roles.descriptions.support'), className: 'bg-pink-50 text-pink-700 hover:bg-pink-50 border-pink-200' },
      [UserRole.CALL_CENTER]: { label: t('users.roles.call_center'), description: t('users.roles.descriptions.call_center'), className: 'bg-indigo-50 text-indigo-700 hover:bg-indigo-50 border-indigo-200' }
    };
    return roleConfigs[role] || { label: 'Unknown', description: 'Unknown role', className: 'bg-gray-50 text-gray-700 hover:bg-gray-50 border-gray-200' };
  };

  // Get status configuration
  const getStatusConfig = (status: UserStatus) => {
    const statusConfigs = {
      [UserStatus.APPROVED]: { label: t('users.statuses.approved'), className: 'bg-green-50 text-green-700 hover:bg-green-50 border-green-200' },
      [UserStatus.PENDING]: { label: t('users.statuses.pending'), className: 'bg-yellow-50 text-yellow-700 hover:bg-yellow-50 border-yellow-200' },
      [UserStatus.REJECTED]: { label: t('users.statuses.rejected'), className: 'bg-red-50 text-red-700 hover:bg-red-50 border-red-200' }
    };
    return statusConfigs[status] || { label: 'Unknown', className: 'bg-gray-50 text-gray-700 hover:bg-gray-50 border-gray-200' };
  };

  const roleConfig = getRoleConfig(user.role);
  const statusConfig = getStatusConfig(user.status);
  
  // Handle status update
  const handleStatusUpdate = async (newStatus: UserStatus) => {
    const result = await updateUserStatus(user._id, newStatus);
    
    if (result.success) {
      toast.success(t('users.userUpdated'));
      router.refresh();
    } else {
      toast.error(result.message || 'Failed to update status');
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push('/dashboard/admin/users')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-bold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <h1 className="text-2xl font-bold">{user.name}</h1>
          </div>
          <Badge variant="outline" className={statusConfig.className}>
            {statusConfig.label}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          {/* Status Quick Actions */}
          {user.status !== UserStatus.APPROVED && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStatusUpdate(UserStatus.APPROVED)}
              className="text-green-600 hover:text-green-700"
            >
              Approve
            </Button>
          )}
          {user.status !== UserStatus.REJECTED && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStatusUpdate(UserStatus.REJECTED)}
              className="text-red-600 hover:text-red-700"
            >
              Reject
            </Button>
          )}
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => router.push(`/dashboard/admin/users/${user._id}/edit`)}
          >
            <Edit className="h-4 w-4" />
            {t('common.edit')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-2">
              <User className="h-5 w-5 text-muted-foreground" />
              <CardTitle>{t('users.sections.basicInfo')}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t('users.fields.fullName')}
                </p>
                <p className="text-base font-medium">{user.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t('users.fields.emailAddress')}
                </p>
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <p className="text-base">{user.email}</p>
                </div>
              </div>
              {user.phone && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t('users.fields.phoneNumber')}
                  </p>
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <p className="text-base">{user.phone}</p>
                  </div>
                </div>
              )}
              <Separator />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t('users.fields.registrationDate')}
                </p>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <p className="text-base">
                    {format(new Date(user.createdAt), 'PPP')}
                  </p>
                </div>
              </div>
              {user.lastActive && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t('users.fields.lastActiveDate')}
                  </p>
                  <p className="text-base">
                    {format(new Date(user.lastActive), 'PPP p')}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Location Information */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-2">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Location & Contact</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t('users.fields.country')}
                </p>
                <div className="flex items-center space-x-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <p className="text-base">{user.country || '-'}</p>
                </div>
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Account ID
                </p>
                <p className="text-sm font-mono bg-muted px-2 py-1 rounded">
                  {user._id}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Role & Permissions */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-muted-foreground" />
              <CardTitle>{t('users.sections.rolePermissions')}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t('users.fields.role')}
                </p>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge variant="outline" className={roleConfig.className}>
                    {roleConfig.label}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {roleConfig.description}
                </p>
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t('users.fields.status')}
                </p>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge variant="outline" className={statusConfig.className}>
                    {statusConfig.label}
                  </Badge>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t('users.fields.twoFactorAuth')}
                </p>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge
                    variant="outline"
                    className={
                      user.twoFactorEnabled
                        ? 'bg-green-50 text-green-700 hover:bg-green-50 border-green-200'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-50 border-gray-200'
                    }
                  >
                    {user.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {user.twoFactorEnabled 
                    ? t('users.messages.twoFactorEnabled')
                    : t('users.messages.twoFactorDisabled')
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Business Information */}
        {(user.businessName || user.businessInfo || user.serviceType) && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-2">
                <Building2 className="h-5 w-5 text-muted-foreground" />
                <CardTitle>{t('users.sections.businessInfo')}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {user.businessName && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {t('users.fields.businessName')}
                    </p>
                    <p className="text-base font-medium">{user.businessName}</p>
                  </div>
                )}
                
                {user.serviceType && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        {t('users.fields.serviceType')}
                      </p>
                      <p className="text-base">{user.serviceType}</p>
                    </div>
                  </>
                )}
                
                {user.businessInfo && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        {t('users.fields.businessInfo')}
                      </p>
                      <p className="text-sm text-muted-foreground whitespace-pre-line bg-muted p-3 rounded-md">
                        {user.businessInfo}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}