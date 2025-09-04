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
import { Loader2, Save, Eye, EyeOff } from 'lucide-react';
import { updateUserProfile, changePassword } from '@/app/actions/profile';
import { UserRole } from '@/lib/db/models/user';
import { toast } from 'sonner';
import { COUNTRIES } from '@/constants/countries';

interface ProfileFormProps {
  user: any;
}

export function ProfileForm({ user }: ProfileFormProps) {
  const [isPending, startTransition] = useTransition();
  const [isPasswordPending, startPasswordTransition] = useTransition();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Profile form state
  const [formData, setFormData] = useState({
    name: user.name || '',
    phone: user.phone || '',
    businessName: user.businessName || '',
    businessInfo: user.businessInfo || '',
    serviceType: user.serviceType || '',
    country: user.country || '',
    maxDeliveryRadius: user.maxDeliveryRadius || 10,
    isAvailableForDelivery: user.isAvailableForDelivery ?? true
  });

  // Password form state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
        toast.success(result.message || 'Profile updated successfully');
      } else {
        toast.error(result.message || 'Failed to update profile');
      }
    });
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    
    startPasswordTransition(async () => {
      const result = await changePassword(passwordData.currentPassword, passwordData.newPassword);
      
      if (result.success) {
        toast.success(result.message || 'Password updated successfully');
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        toast.error(result.message || 'Failed to update password');
      }
    });
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePasswordChange = (field: string, value: string) => {
    setPasswordData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Basic Information Card */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>
            Update your personal information and contact details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter your full name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="Enter your phone number"
                  type="tel"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Select
                value={formData.country}
                onValueChange={(value) => handleInputChange('country', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your country" />
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

            <Button type="submit" disabled={isPending} className="w-full">
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Business Information Card (for relevant roles) */}
      {[UserRole.SELLER, UserRole.PROVIDER].includes(user.role) && (
        <Card>
          <CardHeader>
            <CardTitle>Business Information</CardTitle>
            <CardDescription>
              Update your business details and service information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="businessName">Business Name</Label>
                <Input
                  id="businessName"
                  value={formData.businessName}
                  onChange={(e) => handleInputChange('businessName', e.target.value)}
                  placeholder="Enter your business name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="businessInfo">Business Description</Label>
                <Textarea
                  id="businessInfo"
                  value={formData.businessInfo}
                  onChange={(e) => handleInputChange('businessInfo', e.target.value)}
                  placeholder="Describe your business and services"
                  rows={3}
                />
              </div>
              {user.role === UserRole.PROVIDER && (
                <div className="space-y-2">
                  <Label htmlFor="serviceType">Service Type</Label>
                  <Input
                    id="serviceType"
                    value={formData.serviceType}
                    onChange={(e) => handleInputChange('serviceType', e.target.value)}
                    placeholder="e.g., Logistics, Transportation, Warehousing"
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
            <CardTitle>Delivery Settings</CardTitle>
            <CardDescription>
              Configure your delivery preferences and availability
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="availability">Available for Deliveries</Label>
                  <p className="text-sm text-muted-foreground">
                    Toggle to accept or decline new delivery requests
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
                <Label htmlFor="radius">Maximum Delivery Radius (km)</Label>
                <Input
                  id="radius"
                  type="number"
                  min="1"
                  max="100"
                  value={formData.maxDeliveryRadius}
                  onChange={(e) => handleInputChange('maxDeliveryRadius', parseInt(e.target.value) || 10)}
                  placeholder="Enter delivery radius in kilometers"
                />
                <p className="text-xs text-muted-foreground">
                  You will only receive delivery requests within this radius
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Password Change Card */}
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>
            Update your account password for security
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? "text" : "password"}
                  value={passwordData.currentPassword}
                  onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                  placeholder="Enter current password"
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
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    value={passwordData.newPassword}
                    onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                    placeholder="Enter new password"
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
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={passwordData.confirmPassword}
                    onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                    placeholder="Confirm new password"
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
              Update Password
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}