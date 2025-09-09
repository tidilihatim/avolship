// src/lib/db/models/seller-settings.ts
import mongoose, { Document, Schema } from 'mongoose';

/**
 * Discount settings per warehouse
 */
export interface DiscountSettings {
  warehouseId: mongoose.Types.ObjectId;
  warehouseName: string; // Denormalized for easier querying
  maxDiscountPercentage: number; // Maximum discount percentage (0-100)
  maxDiscountAmount?: number; // Optional maximum discount amount in currency
  currency: string; // Currency for amount limits
  isEnabled: boolean;
  updatedAt: Date;
}

/**
 * Notification settings for the seller
 */
export interface NotificationSettings {
  inAppNotifications: boolean;
  emailNotifications: boolean;
  updatedAt: Date;
}

/**
 * Business settings for the seller
 */
export interface BusinessSettings {
  businessHours: {
    timezone: string;
    workingDays: string[]; // ['monday', 'tuesday', etc.]
    startTime: string; // '09:00'
    endTime: string; // '17:00'
  };
  autoResponseSettings: {
    enabled: boolean;
    message: string;
    responseTime: number; // in minutes
  };
  paymentTerms: {
    defaultPaymentMethod: string;
    paymentDueDays: number;
  };
  updatedAt: Date;
}

/**
 * Product settings for the seller
 */
export interface ProductSettings {
  defaultMarkup: number; // Default markup percentage
  lowStockThreshold: number; // Default low stock alert threshold
  autoReorderSettings: {
    enabled: boolean;
    threshold: number;
    reorderQuantity: number;
  };
  priceUpdateFrequency: 'manual' | 'daily' | 'weekly' | 'monthly';
  updatedAt: Date;
}

/**
 * Security settings for the seller
 */
export interface SecuritySettings {
  twoFactorAuth: {
    enabled: boolean;
    method: 'sms' | 'email' | 'authenticator';
  };
  sessionTimeout: number; // in minutes
  passwordChangeRequired: boolean;
  apiAccessSettings: {
    enabled: boolean;
    allowedIPs: string[];
    rateLimit: number;
  };
  updatedAt: Date;
}

/**
 * Main seller settings interface
 */
export interface ISellerSettings extends Document {
  sellerId: mongoose.Types.ObjectId;
  
  // Different setting categories
  discountSettings: DiscountSettings[];
  notificationSettings?: NotificationSettings;
  businessSettings?: BusinessSettings;
  productSettings?: ProductSettings;
  securitySettings?: SecuritySettings;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mongoose schema for SellerSettings model
 */
const SellerSettingsSchema = new Schema<ISellerSettings>(
  {
    sellerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Seller ID is required'],
      unique: true,
      index: true,
    },
    
    // Discount settings per warehouse
    discountSettings: [{
      warehouseId: {
        type: Schema.Types.ObjectId,
        ref: 'Warehouse',
        required: [true, 'Warehouse ID is required'],
      },
      maxDiscountPercentage: {
        type: Number,
        required: [true, 'Maximum discount percentage is required'],
        min: [0, 'Discount percentage cannot be negative'],
        max: [100, 'Discount percentage cannot exceed 100%'],
        default: 0,
      },
      maxDiscountAmount: {
        type: Number,
        min: [0, 'Maximum discount amount cannot be negative'],
      },
      isEnabled: {
        type: Boolean,
        default: true,
      },
      updatedAt: {
        type: Date,
        default: Date.now,
      },
    }],
    
    // Notification settings
    notificationSettings: {
      inAppNotifications: {
        type: Boolean,
        default: true,
      },
      emailNotifications: {
        type: Boolean,
        default: true,
      },
      updatedAt: {
        type: Date,
        default: Date.now,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better performance
SellerSettingsSchema.index({ sellerId: 1 });
SellerSettingsSchema.index({ 'discountSettings.warehouseId': 1 });

// Pre-save middleware to update nested timestamps
SellerSettingsSchema.pre('save', function (next) {
  const now = new Date();
  
  // Update discount settings timestamps if the array was modified
  if (this.isModified('discountSettings')) {
    this.discountSettings.forEach(setting => {
      setting.updatedAt = now;
    });
  }
  
  // Update other settings timestamps
  if (this.notificationSettings && this.isModified('notificationSettings')) {
    this.notificationSettings.updatedAt = now;
  }
  next();
});

// Method to get discount settings for a specific warehouse
SellerSettingsSchema.methods.getDiscountSettingsForWarehouse = function(warehouseId: string) {
  return this.discountSettings.find(
    (setting: DiscountSettings) => setting.warehouseId.toString() === warehouseId
  );
};

// Method to update discount settings for a specific warehouse
SellerSettingsSchema.methods.updateDiscountSettingsForWarehouse = function(
  warehouseId: string,
  updates: Partial<DiscountSettings>
) {
  const existingSettingIndex = this.discountSettings.findIndex(
    (setting: DiscountSettings) => setting.warehouseId.toString() === warehouseId
  );
  
  if (existingSettingIndex !== -1) {
    // Update existing setting
    this.discountSettings[existingSettingIndex] = {
      ...this.discountSettings[existingSettingIndex],
      ...updates,
      updatedAt: new Date(),
    };
  } else {
    // Add new setting
    this.discountSettings.push({
      warehouseId: new mongoose.Types.ObjectId(warehouseId),
      updatedAt: new Date(),
      ...updates,
    });
  }
};

// Create the model only if it doesn't already exist
const SellerSettings = mongoose.models?.SellerSettings || mongoose.model<ISellerSettings>('SellerSettings', SellerSettingsSchema);

export default SellerSettings;