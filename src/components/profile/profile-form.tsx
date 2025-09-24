'use client';

import { useState, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Save, Eye, EyeOff, Upload, User } from 'lucide-react';
import { updateUserProfile, changePassword, uploadProfileImage } from '@/app/actions/profile';
import { UserRole } from '@/lib/db/models/user';
import { toast } from 'sonner';
import { COUNTRIES } from '@/constants/countries';
import { useTranslations } from 'next-intl';

interface ProfileFormProps {
  user: any;
}

export function ProfileForm({ user }: ProfileFormProps) {
  const t = useTranslations('profile');
  const [isPending, startTransition] = useTransition();
  const [isPasswordPending, startPasswordTransition] = useTransition();
  const [isImageUploading, startImageTransition] = useTransition();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState(user.profileImage || null);

  // Profile form state
  const [formData, setFormData] = useState({
    name: user.name || '',
    phone: user.phone || '',
    businessName: user.businessName || '',
    businessInfo: user.businessInfo || '',
    serviceType: user.serviceType || '',
    country: user.country || '',
    maxDeliveryRadius: user.maxDeliveryRadius || 10,
    isAvailableForDelivery: user.isAvailableForDelivery ?? true,
    twoFactorEnabled: user.twoFactorEnabled ?? false
  });

  // Password form state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleProfileSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    e?.preventDefault();
    
    startTransition(async () => {
      // Filter out empty fields
      const filteredData = Object.fromEntries(
        Object.entries(formData).filter(([key, value]) => {
          if (typeof value === 'string') {
            return value.trim() !== '';
          }
          return value !== null && value !== undefined;
        })
      );

      const result = await updateUserProfile(filteredData);

      if (result.success) {
        toast.success(result.message || t('messages.profileUpdated'));
      } else {
        toast.error(result.message || t('messages.profileUpdateFailed'));
      }
    });
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error(t('messages.passwordMismatch'));
      return;
    }
    
    startPasswordTransition(async () => {
      const result = await changePassword(passwordData.currentPassword, passwordData.newPassword);

      if (result.success) {
        toast.success(result.message || t('messages.passwordUpdated'));
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        toast.error(result.message || t('messages.passwordUpdateFailed'));
      }
    });
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePasswordChange = (field: string, value: string) => {
    setPasswordData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    startImageTransition(async () => {
      const formData = new FormData();
      formData.append('profileImage', file);

      const result = await uploadProfileImage(formData);

      if (result.success) {
        setProfileImageUrl(result.profileImageUrl || null);
        toast.success(result.message || t('messages.imageUpdated'));
      } else {
        toast.error(result.message || t('messages.imageUploadFailed'));
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Global Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleProfileSubmit} disabled={isPending} className="min-w-[140px]">
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Save className="mr-2 h-4 w-4" />
          {t('saveChanges')}
        </Button>
      </div>

      <form onSubmit={handleProfileSubmit} className="space-y-6">

      {/* Profile Image Card */}
      <Card>
        <CardHeader>
          <CardTitle>{t('sections.profileImage.title')}</CardTitle>
          <CardDescription>
            {t('sections.profileImage.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 border-2 border-gray-200">
                {profileImageUrl ? (
                  <img
                    src={profileImageUrl}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="w-12 h-12 text-gray-400" />
                  </div>
                )}
              </div>
            </div>
            <div className="flex-1">
              <Label htmlFor="profileImage" className="cursor-pointer">
                <div className="flex items-center space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isImageUploading}
                    className="cursor-pointer"
                    asChild
                  >
                    <div>
                      {isImageUploading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="mr-2 h-4 w-4" />
                      )}
                      {isImageUploading ? t('sections.profileImage.uploading') : t('sections.profileImage.uploadButton')}
                    </div>
                  </Button>
                </div>
                <Input
                  id="profileImage"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={isImageUploading}
                />
              </Label>
              <p className="text-xs text-muted-foreground mt-2">
                {t('sections.profileImage.supportedFormats')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Basic Information Card */}
      <Card>
        <CardHeader>
          <CardTitle>{t('sections.basicInfo.title')}</CardTitle>
          <CardDescription>
            {t('sections.basicInfo.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t('sections.basicInfo.fullName')}</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder={t('sections.basicInfo.fullNamePlaceholder')}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">{t('sections.basicInfo.phoneNumber')}</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder={t('sections.basicInfo.phoneNumberPlaceholder')}
                  type="tel"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">{t('sections.basicInfo.country')}</Label>
              <Select
                value={formData.country}
                onValueChange={(value) => handleInputChange('country', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('sections.basicInfo.countryPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((country) => (
                    <SelectItem key={country.code} value={country.name}>
                      {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Business Information Card (for relevant roles) */}
      {[UserRole.SELLER, UserRole.PROVIDER].includes(user.role) && (
        <Card>
          <CardHeader>
            <CardTitle>{t('sections.businessInfo.title')}</CardTitle>
            <CardDescription>
              {t('sections.businessInfo.description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="businessName">{t('sections.businessInfo.businessName')}</Label>
                <Input
                  id="businessName"
                  value={formData.businessName}
                  onChange={(e) => handleInputChange('businessName', e.target.value)}
                  placeholder={t('sections.businessInfo.businessNamePlaceholder')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="businessInfo">{t('sections.businessInfo.businessDescription')}</Label>
                <Textarea
                  id="businessInfo"
                  value={formData.businessInfo}
                  onChange={(e) => handleInputChange('businessInfo', e.target.value)}
                  placeholder={t('sections.businessInfo.businessDescriptionPlaceholder')}
                  rows={3}
                />
              </div>
              {user.role === UserRole.PROVIDER && (
                <div className="space-y-2">
                  <Label htmlFor="serviceType">{t('sections.businessInfo.serviceType')}</Label>
                  <Input
                    id="serviceType"
                    value={formData.serviceType}
                    onChange={(e) => handleInputChange('serviceType', e.target.value)}
                    placeholder={t('sections.businessInfo.serviceTypePlaceholder')}
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delivery Settings Card (only for delivery role) */}
      {user.role === UserRole.DELIVERY && (
        <Card>
          <CardHeader>
            <CardTitle>{t('sections.deliverySettings.title')}</CardTitle>
            <CardDescription>
              {t('sections.deliverySettings.description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="availability">{t('sections.deliverySettings.availability')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t('sections.deliverySettings.availabilityDescription')}
                  </p>
                </div>
                <Switch
                  id="availability"
                  checked={formData.isAvailableForDelivery}
                  onCheckedChange={(checked) => handleInputChange('isAvailableForDelivery', checked)}
                />
              </div>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="radius">{t('sections.deliverySettings.maxRadius')}</Label>
                <Input
                  id="radius"
                  type="number"
                  min="1"
                  max="100"
                  value={formData.maxDeliveryRadius}
                  onChange={(e) => handleInputChange('maxDeliveryRadius', parseInt(e.target.value) || 10)}
                  placeholder={t('sections.deliverySettings.maxRadiusPlaceholder')}
                />
                <p className="text-xs text-muted-foreground">
                  {t('sections.deliverySettings.maxRadiusNote')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Security Settings Card */}
      {[UserRole.ADMIN, UserRole.SELLER, UserRole.PROVIDER].includes(user.role) && (
        <Card>
          <CardHeader>
            <CardTitle>{t('sections.security.title')}</CardTitle>
            <CardDescription>
              {t('sections.security.description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="twoFactorEnabled">{t('sections.security.twoFactorAuth')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t('sections.security.twoFactorAuthDescription')}
                  </p>
                </div>
                <Switch
                  id="twoFactorEnabled"
                  checked={formData.twoFactorEnabled}
                  onCheckedChange={(checked) => handleInputChange('twoFactorEnabled', checked)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

    </form>

      {/* Password Change Card */}
      {[UserRole.ADMIN, UserRole.SELLER, UserRole.PROVIDER].includes(user.role) && (
        <Card>
          <CardHeader>
            <CardTitle>{t('sections.password.title')}</CardTitle>
            <CardDescription>
              {t('sections.password.description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">{t('sections.password.currentPassword')}</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? "text" : "password"}
                    value={passwordData.currentPassword}
                    onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                    placeholder={t('sections.password.currentPasswordPlaceholder')}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">{t('sections.password.newPassword')}</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      value={passwordData.newPassword}
                      onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                      placeholder={t('sections.password.newPasswordPlaceholder')}
                      required
                      minLength={8}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">{t('sections.password.confirmPassword')}</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={passwordData.confirmPassword}
                      onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                      placeholder={t('sections.password.confirmPasswordPlaceholder')}
                      required
                      minLength={8}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>

              <Button type="submit" disabled={isPasswordPending} variant="destructive">
                {isPasswordPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('sections.password.updatePassword')}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}