'use server';

import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/config/auth';
import { withDbConnection } from '@/lib/db/db-connect';
import DuplicateDetectionSettings from '@/lib/db/models/duplicate-settings';
import User, { UserRole } from '@/lib/db/models/user';

interface ApiResponse {
  success: boolean;
  message: string;
  data?: any;
  errors?: any;
}

/**
 * Validate session and ensure user is a seller
 */
async function validateSellerSession(): Promise<{ success: boolean; message: string; userId?: string }> {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return {
      success: false,
      message: 'Authentication required'
    };
  }

  const user = await User.findById(session.user.id);
  
  if (!user) {
    return {
      success: false,
      message: 'User not found'
    };
  }

  if (user.role !== UserRole.SELLER) {
    return {
      success: false,
      message: 'Access denied. Only sellers can manage duplicate detection settings'
    };
  }

  return {
    success: true,
    message: 'Authorized',
    userId: user._id.toString()
  };
}

/**
 * Get duplicate detection settings for the current seller
 */
export const getDuplicateDetectionSettings = withDbConnection(async (): Promise<ApiResponse> => {
  try {
    const validation = await validateSellerSession();
    if (!validation.success) {
      return {
        success: false,
        message: validation.message
      };
    }

    let settings = await DuplicateDetectionSettings.findOne({ sellerId: validation.userId });

    // Create default settings if none exist
    if (!settings) {
      settings = (DuplicateDetectionSettings as any).createDefaultSettings(validation.userId!);
      await settings.save();
    }

    return {
      success: true,
      message: 'Settings retrieved successfully',
      data: JSON.parse(JSON.stringify(settings))
    };
  } catch (error) {
    console.error('Error fetching duplicate detection settings:', error);
    return {
      success: false,
      message: 'Failed to fetch settings'
    };
  }
});

/**
 * Update duplicate detection settings for the current seller
 */
export const updateDuplicateDetectionSettings = withDbConnection(async (
  settingsData: {
    isEnabled: boolean;
    defaultTimeWindow: {
      value: number;
      unit: string;
    };
    rules: any[];
  }
): Promise<ApiResponse> => {
  try {
    const validation = await validateSellerSession();
    if (!validation.success) {
      return {
        success: false,
        message: validation.message
      };
    }

    // Validate input data
    if (typeof settingsData.isEnabled !== 'boolean') {
      return {
        success: false,
        message: 'Invalid data: isEnabled must be a boolean'
      };
    }

    if (!settingsData.defaultTimeWindow?.value || settingsData.defaultTimeWindow.value < 1) {
      return {
        success: false,
        message: 'Invalid data: time window value must be at least 1'
      };
    }

    const settings = await DuplicateDetectionSettings.findOneAndUpdate(
      { sellerId: validation.userId },
      {
        isEnabled: settingsData.isEnabled,
        defaultTimeWindow: settingsData.defaultTimeWindow,
        rules: settingsData.rules
      },
      { 
        new: true, 
        upsert: true,
        runValidators: true 
      }
    );

    revalidatePath('/dashboard/seller/settings');

    return {
      success: true,
      message: 'Settings updated successfully',
      data: JSON.parse(JSON.stringify(settings))
    };
  } catch (error) {
    console.error('Error updating duplicate detection settings:', error);
    return {
      success: false,
      message: 'Failed to update settings'
    };
  }
});

/**
 * Add a new duplicate detection rule for the current seller
 */
export const addDuplicateDetectionRule = withDbConnection(async (
  rule: {
    name: string;
    conditions: Array<{ field: string; enabled: boolean }>;
    logicalOperator: string;
    timeWindow: { value: number; unit: string };
    isActive: boolean;
  }
): Promise<ApiResponse> => {
  try {
    const validation = await validateSellerSession();
    if (!validation.success) {
      return {
        success: false,
        message: validation.message
      };
    }

    // Validate rule data
    if (!rule.name?.trim()) {
      return {
        success: false,
        message: 'Rule name is required'
      };
    }

    if (!rule.conditions || rule.conditions.length === 0) {
      return {
        success: false,
        message: 'At least one condition is required'
      };
    }

    if (!rule.timeWindow?.value || rule.timeWindow.value < 1) {
      return {
        success: false,
        message: 'Time window value must be at least 1'
      };
    }

    let settings = await DuplicateDetectionSettings.findOne({ sellerId: validation.userId });
    
    if (!settings) {
      settings = (DuplicateDetectionSettings as any).createDefaultSettings(validation.userId!);
    }

    settings.rules.push(rule as any);
    await settings.save();

    revalidatePath('/dashboard/seller/settings');

    return {
      success: true,
      message: 'Rule added successfully',
      data: JSON.parse(JSON.stringify(settings))
    };
  } catch (error) {
    console.error('Error adding duplicate detection rule:', error);
    return {
      success: false,
      message: 'Failed to add rule'
    };
  }
});

/**
 * Update a specific duplicate detection rule for the current seller
 */
export const updateDuplicateDetectionRule = withDbConnection(async (
  ruleId: string,
  ruleData: {
    name?: string;
    conditions?: Array<{ field: string; enabled: boolean }>;
    logicalOperator?: string;
    timeWindow?: { value: number; unit: string };
    isActive?: boolean;
  }
): Promise<ApiResponse> => {
  try {
    const validation = await validateSellerSession();
    if (!validation.success) {
      return {
        success: false,
        message: validation.message
      };
    }

    if (!ruleId) {
      return {
        success: false,
        message: 'Rule ID is required'
      };
    }

    const settings = await DuplicateDetectionSettings.findOne({ sellerId: validation.userId });
    
    if (!settings) {
      return {
        success: false,
        message: 'Settings not found'
      };
    }

    const ruleIndex = settings.rules.findIndex((rule: any) => rule._id?.toString() === ruleId);
    
    if (ruleIndex === -1) {
      return {
        success: false,
        message: 'Rule not found'
      };
    }

    // Update the rule
    Object.assign(settings.rules[ruleIndex], ruleData);
    await settings.save();

    revalidatePath('/dashboard/seller/settings');

    return {
      success: true,
      message: 'Rule updated successfully',
      data: JSON.parse(JSON.stringify(settings))
    };
  } catch (error) {
    console.error('Error updating duplicate detection rule:', error);
    return {
      success: false,
      message: 'Failed to update rule'
    };
  }
});

/**
 * Delete a duplicate detection rule for the current seller
 */
export const deleteDuplicateDetectionRule = withDbConnection(async (
  ruleId: string
): Promise<ApiResponse> => {
  try {
    const validation = await validateSellerSession();
    if (!validation.success) {
      return {
        success: false,
        message: validation.message
      };
    }

    if (!ruleId) {
      return {
        success: false,
        message: 'Rule ID is required'
      };
    }

    const settings = await DuplicateDetectionSettings.findOne({ sellerId: validation.userId });
    
    if (!settings) {
      return {
        success: false,
        message: 'Settings not found'
      };
    }

    const initialLength = settings.rules.length;
    settings.rules = settings.rules.filter((rule: any) => rule._id?.toString() !== ruleId);
    
    if (settings.rules.length === initialLength) {
      return {
        success: false,
        message: 'Rule not found'
      };
    }

    await settings.save();

    revalidatePath('/dashboard/seller/settings');

    return {
      success: true,
      message: 'Rule deleted successfully',
      data: JSON.parse(JSON.stringify(settings))
    };
  } catch (error) {
    console.error('Error deleting duplicate detection rule:', error);
    return {
      success: false,
      message: 'Failed to delete rule'
    };
  }
});