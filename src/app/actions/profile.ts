'use server';

import { withDbConnection } from '@/lib/db/db-connect';
import { getCurrentUser } from './auth';
import { UserRole } from '@/lib/db/models/user';
import User from '@/lib/db/models/user';
import { revalidatePath } from 'next/cache';
import { getAccessToken } from './cookie';

export interface UpdateProfileData {
  name?: string;
  phone?: string;
  businessName?: string;
  businessInfo?: string;
  serviceType?: string;
  country?: string;
  maxDeliveryRadius?: number;
  isAvailableForDelivery?: boolean;
}

export interface ProfileImageUploadData {
  profileImage?: string;
  profileImageKey?: string;
}

export const getCurrentUserProfile = withDbConnection(async (): Promise<{
  success: boolean;
  message?: string;
  data?: any;
}> => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, message: 'User not found' };
    }

    // Convert to plain object and exclude sensitive fields
    const userObj = user.toObject ? user.toObject() : user;
    const { password, twoFactorSecret, passwordResetToken, ...userProfile } = userObj;

    return { success: true, data: userProfile };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to fetch user profile'
    };
  }
});

export const updateUserProfile = withDbConnection(async (profileData: UpdateProfileData): Promise<{
  success: boolean;
  message?: string;
}> => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, message: 'User not found' };
    }

    // Prevent admin profile updates
    if (user.role === UserRole.ADMIN) {
      return { success: false, message: 'Admin profiles cannot be updated through this interface' };
    }

    // Validate and sanitize input
    const updateData: any = {};

    if (profileData.name !== undefined) {
      if (!profileData.name.trim()) {
        return { success: false, message: 'Name cannot be empty' };
      }
      updateData.name = profileData.name.trim();
    }

    if (profileData.phone !== undefined) {
      updateData.phone = profileData.phone?.trim() || null;
    }

    if (profileData.businessName !== undefined) {
      updateData.businessName = profileData.businessName?.trim() || null;
    }

    if (profileData.businessInfo !== undefined) {
      updateData.businessInfo = profileData.businessInfo?.trim() || null;
    }

    if (profileData.serviceType !== undefined) {
      updateData.serviceType = profileData.serviceType?.trim() || null;
    }

    if (profileData.country !== undefined) {
      updateData.country = profileData.country?.trim() || null;
    }

    // Delivery-specific fields (only for delivery role)
    if (user.role === UserRole.DELIVERY) {
      if (profileData.maxDeliveryRadius !== undefined) {
        if (profileData.maxDeliveryRadius < 1 || profileData.maxDeliveryRadius > 100) {
          return { success: false, message: 'Delivery radius must be between 1 and 100 km' };
        }
        updateData.maxDeliveryRadius = profileData.maxDeliveryRadius;
      }

      if (profileData.isAvailableForDelivery !== undefined) {
        updateData.isAvailableForDelivery = profileData.isAvailableForDelivery;
      }
    }

    // Update user profile
    await User.findByIdAndUpdate(user._id, updateData, { new: true });

    revalidatePath('/dashboard/profile');
    return { success: true, message: 'Profile updated successfully' };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to update profile'
    };
  }
});

export const changePassword = withDbConnection(async (currentPassword: string, newPassword: string): Promise<{
  success: boolean;
  message?: string;
}> => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, message: 'User not found' };
    }

    // Prevent admin password updates
    if (user.role === UserRole.ADMIN) {
      return { success: false, message: 'Admin passwords cannot be updated through this interface' };
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return { success: false, message: 'Current password is incorrect' };
    }

    // Validate new password
    if (newPassword.length < 8) {
      return { success: false, message: 'New password must be at least 8 characters long' };
    }

    if (newPassword === currentPassword) {
      return { success: false, message: 'New password must be different from current password' };
    }

    // Update password (will be hashed by pre-save middleware)
    user.password = newPassword;
    await user.save();

    return { success: true, message: 'Password updated successfully' };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to update password'
    };
  }
});

export const uploadProfileImage = withDbConnection(async (formData: FormData): Promise<{
  success: boolean;
  message?: string;
  profileImageUrl?: string;
}> => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, message: 'User not found' };
    }

    const file = formData.get('profileImage') as File;
    if (!file) {
      return { success: false, message: 'No image file provided' };
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return { success: false, message: 'Invalid file type. Only image files are allowed.' };
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      return { success: false, message: 'File size too large. Maximum size is 5MB.' };
    }

    // Get access token
    const accessToken = await getAccessToken();
    if (!accessToken) {
      return { success: false, message: 'Authentication required' };
    }

    // Call backend API to upload image
    const uploadFormData = new FormData();
    uploadFormData.append('profileImage', file);

    const apiUrl = `${process.env.NEXT_PUBLIC_SOCKET_URL}/api/auth/profile/image`;
    console.log('Making request to:', apiUrl); // Debug log

    const response = await fetch(apiUrl, {
      method: 'PUT',
      body: uploadFormData,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    const responseText = await response.text();
    console.log('Response status:', response.status);
    console.log('Response text:', responseText); // Debug log

    let result;
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse response as JSON:', parseError);
      return { success: false, message: 'Invalid server response' };
    }

    if (!response.ok) {
      return { success: false, message: result.error || 'Failed to upload image' };
    }

    // Update user profile in local database
    await User.findByIdAndUpdate(user._id, {
      profileImage: result.profileImage,
    });

    revalidatePath('/dashboard/profile');
    return { 
      success: true, 
      message: 'Profile image updated successfully',
      profileImageUrl: result.profileImage 
    };
  } catch (error: any) {
    console.error('Upload error:', error);
    return {
      success: false,
      message: error.message || 'Failed to upload profile image'
    };
  }
});