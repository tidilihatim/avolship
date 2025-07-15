'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { withDbConnection } from '@/lib/db/db-connect';
import { getCurrentUser } from './auth';
import { UserRole } from '@/lib/db/models/user';
import SellerSettings, { DiscountSettings } from '@/lib/db/models/seller-settings';
import Warehouse from '@/lib/db/models/warehouse';
import mongoose from 'mongoose';

interface DiscountSettingInput {
  maxDiscountPercentage: number;
  maxDiscountAmount?: number;
  isEnabled: boolean;
}

interface ApiResponse {
  success: boolean;
  message: string;
  data?: any;
}

/**
 * Get selected warehouse from cookies
 */
const getSelectedWarehouse = async (): Promise<{ warehouseId: string | null; warehouse: any | null }> => {
  const cookiesStore = await cookies();
  const selectedWarehouseId = cookiesStore.get('selectedWarehouse')?.value;
  
  if (!selectedWarehouseId) {
    return { warehouseId: null, warehouse: null };
  }
  
  try {
    const warehouse = await Warehouse.findById(selectedWarehouseId).lean();
    return { warehouseId: selectedWarehouseId, warehouse };
  } catch (error) {
    return { warehouseId: null, warehouse: null };
  }
};

/**
 * Get seller's discount settings for the selected warehouse
 */
export const getSellerDiscountSettings = withDbConnection(async (): Promise<ApiResponse> => {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== UserRole.SELLER) {
      return { success: false, message: 'Unauthorized' };
    }

    const { warehouseId, warehouse } = await getSelectedWarehouse();
    
    if (!warehouseId || !warehouse) {
      return { success: false, message: 'No warehouse selected' };
    }

    const settings = await SellerSettings.findOne({ sellerId: user._id }).lean() as any;
    
    const discountSetting = settings?.discountSettings?.find(
      (s: DiscountSettings) => s.warehouseId.toString() === warehouseId
    );
    
    return {
      success: true,
      message: 'Settings retrieved successfully',
      data: {
        discountSetting: discountSetting || null,
        warehouse: {
          _id: warehouse._id,
          name: warehouse.name,
          currency: warehouse.currency,
          country: warehouse.country
        }
      }
    };
  } catch (error) {
    console.error('Error getting seller discount settings:', error);
    return { success: false, message: 'Failed to retrieve settings' };
  }
});

/**
 * Get selected warehouse info
 */
export const getSelectedWarehouseInfo = withDbConnection(async (): Promise<ApiResponse> => {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== UserRole.SELLER) {
      return { success: false, message: 'Unauthorized' };
    }

    const { warehouseId, warehouse } = await getSelectedWarehouse();
    
    if (!warehouseId || !warehouse) {
      return { success: false, message: 'No warehouse selected' };
    }

    // Verify seller has access to the warehouse
    const hasAccess = await Warehouse.findOne({
      _id: warehouseId,
      $or: [
        { isAvailableToAll: true },
        { assignedSellers: user._id }
      ],
      isActive: true
    }).lean();

    if (!hasAccess) {
      return { success: false, message: 'Access denied to selected warehouse' };
    }

    return {
      success: true,
      message: 'Warehouse info retrieved successfully',
      data: {
        _id: warehouse._id.toString(),
        name: warehouse.name,
        country: warehouse.country,
        currency: warehouse.currency,
      }
    };
  } catch (error) {
    console.error('Error getting selected warehouse info:', error);
    return { success: false, message: 'Failed to retrieve warehouse info' };
  }
});

/**
 * Update or create discount settings for the selected warehouse
 */
export const updateDiscountSettings = withDbConnection(async (
  settingInput: DiscountSettingInput
): Promise<ApiResponse> => {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== UserRole.SELLER) {
      return { success: false, message: 'Unauthorized' };
    }

    const { warehouseId, warehouse } = await getSelectedWarehouse();
    
    if (!warehouseId || !warehouse) {
      return { success: false, message: 'No warehouse selected' };
    }

    // Validate input
    if (settingInput.maxDiscountPercentage < 0 || settingInput.maxDiscountPercentage > 100) {
      return { success: false, message: 'Discount percentage must be between 0 and 100' };
    }

    if (settingInput.maxDiscountAmount && settingInput.maxDiscountAmount < 0) {
      return { success: false, message: 'Maximum discount amount cannot be negative' };
    }

    // Verify seller has access to the warehouse
    const hasAccess = await Warehouse.findOne({
      _id: warehouseId,
      $or: [
        { isAvailableToAll: true },
        { assignedSellers: user._id }
      ],
      isActive: true
    }).lean();

    if (!hasAccess) {
      return { success: false, message: 'Access denied to selected warehouse' };
    }

    // Find or create seller settings
    let settings = await SellerSettings.findOne({ sellerId: user._id });
    
    if (!settings) {
      settings = new SellerSettings({
        sellerId: user._id,
        discountSettings: []
      });
    }

    // Update or add discount setting
    const existingIndex = settings.discountSettings.findIndex(
      (s: DiscountSettings) => s.warehouseId.toString() === warehouseId
    );

    const newSetting: DiscountSettings = {
      warehouseId: new mongoose.Types.ObjectId(warehouseId),
      warehouseName: warehouse.name,
      maxDiscountPercentage: settingInput.maxDiscountPercentage,
      maxDiscountAmount: settingInput.maxDiscountAmount,
      currency: warehouse.currency,
      isEnabled: settingInput.isEnabled,
      updatedAt: new Date(),
    };

    if (existingIndex >= 0) {
      settings.discountSettings[existingIndex] = newSetting;
    } else {
      settings.discountSettings.push(newSetting);
    }

    await settings.save();

    revalidatePath('/dashboard/seller/settings');

    return {
      success: true,
      message: 'Discount settings updated successfully',
      data: newSetting
    };
  } catch (error) {
    console.error('Error updating discount settings:', error);
    return { success: false, message: 'Failed to update settings' };
  }
});

/**
 * Delete discount settings for the selected warehouse
 */
export const deleteDiscountSettings = withDbConnection(async (): Promise<ApiResponse> => {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== UserRole.SELLER) {
      return { success: false, message: 'Unauthorized' };
    }

    const { warehouseId } = await getSelectedWarehouse();
    
    if (!warehouseId) {
      return { success: false, message: 'No warehouse selected' };
    }

    const settings = await SellerSettings.findOne({ sellerId: user._id });
    
    if (!settings) {
      return { success: false, message: 'Settings not found' };
    }

    // Remove the discount setting
    settings.discountSettings = settings.discountSettings.filter(
      (s: DiscountSettings) => s.warehouseId.toString() !== warehouseId
    );

    await settings.save();

    revalidatePath('/dashboard/seller/settings');

    return {
      success: true,
      message: 'Discount settings deleted successfully'
    };
  } catch (error) {
    console.error('Error deleting discount settings:', error);
    return { success: false, message: 'Failed to delete settings' };
  }
});

/**
 * Toggle discount settings enabled/disabled for the selected warehouse
 */
export const toggleDiscountSettings = withDbConnection(async (
  isEnabled: boolean
): Promise<ApiResponse> => {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== UserRole.SELLER) {
      return { success: false, message: 'Unauthorized' };
    }

    const { warehouseId } = await getSelectedWarehouse();
    
    if (!warehouseId) {
      return { success: false, message: 'No warehouse selected' };
    }

    const settings = await SellerSettings.findOne({ sellerId: user._id });
    
    if (!settings) {
      return { success: false, message: 'Settings not found' };
    }

    // Find and update the setting
    const settingIndex = settings.discountSettings.findIndex(
      (s: DiscountSettings) => s.warehouseId.toString() === warehouseId
    );

    if (settingIndex === -1) {
      return { success: false, message: 'Discount setting not found' };
    }

    settings.discountSettings[settingIndex].isEnabled = isEnabled;
    settings.discountSettings[settingIndex].updatedAt = new Date();

    await settings.save();

    revalidatePath('/dashboard/seller/settings');

    return {
      success: true,
      message: `Discount settings ${isEnabled ? 'enabled' : 'disabled'} successfully`
    };
  } catch (error) {
    console.error('Error toggling discount settings:', error);
    return { success: false, message: 'Failed to update settings' };
  }
});

/**
 * Get discount limits for a specific warehouse (used by call center agents)
 */
export const getDiscountLimitsForWarehouse = withDbConnection(async (
  sellerId: string,
  warehouseId: string
): Promise<ApiResponse> => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, message: 'Unauthorized' };
    }

    // Only call center agents, admins, and moderators can check limits
    if (![UserRole.CALL_CENTER, UserRole.ADMIN, UserRole.MODERATOR].includes(user.role)) {
      return { success: false, message: 'Insufficient permissions' };
    }

    if (!sellerId || !warehouseId) {
      return { success: false, message: 'Seller ID and Warehouse ID are required' };
    }

    const settings = await SellerSettings.findOne({ 
      sellerId: new mongoose.Types.ObjectId(sellerId) 
    }).lean() as any;

    if (!settings) {
      return {
        success: true,
        message: 'No discount settings found',
        data: {
          hasLimits: false,
          maxDiscountPercentage: 100,
          maxDiscountAmount: undefined,
          isEnabled: false
        }
      };
    }

    const discountSetting = settings.discountSettings?.find(
      (s: DiscountSettings) => s.warehouseId.toString() === warehouseId
    );

    if (!discountSetting) {
      return {
        success: true,
        message: 'No discount settings for this warehouse',
        data: {
          hasLimits: false,
          maxDiscountPercentage: 100,
          maxDiscountAmount: undefined,
          isEnabled: false
        }
      };
    }

    return {
      success: true,
      message: 'Discount limits retrieved successfully',
      data: {
        hasLimits: true,
        maxDiscountPercentage: discountSetting.maxDiscountPercentage,
        maxDiscountAmount: discountSetting.maxDiscountAmount,
        isEnabled: discountSetting.isEnabled
      }
    };
  } catch (error) {
    console.error('Error getting discount limits:', error);
    return { success: false, message: 'Failed to retrieve discount limits' };
  }
});