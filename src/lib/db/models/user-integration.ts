import mongoose, { Document, Schema } from 'mongoose';

export enum IntegrationMethod {
  DIRECT = 'direct',
  GOOGLE_SHEETS = 'google_sheets'
}

export enum IntegrationStatus {
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  ERROR = 'error',
  PENDING = 'pending'
}

export interface IUserIntegration extends Document {
  userId: string;
  warehouseId: string; // Reference to Warehouse model
  platformId: string; // Reference to IntegrationPlatform.platformId
  integrationMethod: IntegrationMethod;
  status: IntegrationStatus;
  connectionData: {
    // For direct integration
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: Date;
    storeId?: string;
    storeName?: string;
    storeUrl?: string;
    
    // For Google Sheets integration
    sheetId?: string;
    sheetUrl?: string;
    webhookId?: string;
    
    // Common
    lastError?: string;
    webhookSubscriptions?: {
      topic: string;
      id: string;
      createdAt: Date;
    }[];
  };
  isActive: boolean;
  lastSyncAt?: Date;
  syncStats: {
    totalOrdersSynced: number;
    lastOrderSyncedAt?: Date;
    syncErrors: number;
    lastSyncError?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserIntegrationSchema = new Schema<IUserIntegration>({
  userId: {
    type: String,
    required: true,
    index: true
  },
  warehouseId: {
    type: String,
    required: true,
    index: true
  },
  platformId: {
    type: String,
    required: true,
    enum: ['youcan', 'shopify', 'woocommerce']
  },
  integrationMethod: {
    type: String,
    required: true,
    enum: Object.values(IntegrationMethod)
  },
  status: {
    type: String,
    required: true,
    enum: Object.values(IntegrationStatus),
    default: IntegrationStatus.PENDING
  },
  connectionData: {
    // Direct integration fields
    accessToken: String,
    refreshToken: String,
    expiresAt: Date,
    storeId: String,
    storeName: String,
    storeUrl: String,
    
    // Google Sheets fields
    sheetId: String,
    sheetUrl: String,
    webhookId: String,
    
    // Common fields
    lastError: String,
    webhookSubscriptions: [{
      topic: String,
      id: String,
      createdAt: Date
    }]
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastSyncAt: Date,
  syncStats: {
    totalOrdersSynced: {
      type: Number,
      default: 0
    },
    lastOrderSyncedAt: Date,
    syncErrors: {
      type: Number,
      default: 0
    },
    lastSyncError: String
  }
}, {
  timestamps: true
});

// Compound index for user, warehouse and platform
UserIntegrationSchema.index({ userId: 1, warehouseId: 1, platformId: 1 });

// Index for status and sync monitoring
UserIntegrationSchema.index({ status: 1, isActive: 1 });

// Index for admin monitoring
UserIntegrationSchema.index({ platformId: 1, status: 1 });

// Index for warehouse-specific queries
UserIntegrationSchema.index({ warehouseId: 1, isActive: 1 });

export default mongoose.models.UserIntegration || 
  mongoose.model<IUserIntegration>('UserIntegration', UserIntegrationSchema);