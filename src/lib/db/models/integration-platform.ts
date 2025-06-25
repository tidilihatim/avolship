import mongoose, { Document, Schema } from 'mongoose';

export interface IIntegrationPlatform extends Document {
  platformId: string; // 'youcan', 'shopify', 'woocommerce'
  name: string;
  description: string;
  iconPath: string;
  isActive: boolean; // Admin can enable/disable entire platform
  directIntegrationEnabled: boolean; // Admin can enable/disable direct integration
  googleSheetsEnabled: boolean; // Admin can enable/disable Google Sheets method
  isRecommended: boolean; // Admin can mark platform as recommended
  sortOrder: number; // For display ordering
  settings: {
    oauthClientId?: string;
    oauthClientSecret?: string;
    webhookUrl?: string;
    apiEndpoint?: string;
    supportedFeatures: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

const IntegrationPlatformSchema = new Schema<IIntegrationPlatform>({
  platformId: {
    type: String,
    required: true,
    unique: true,
    enum: ['youcan', 'shopify', 'woocommerce']
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  iconPath: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  directIntegrationEnabled: {
    type: Boolean,
    default: true
  },
  googleSheetsEnabled: {
    type: Boolean,
    default: true
  },
  isRecommended: {
    type: Boolean,
    default: false
  },
  sortOrder: {
    type: Number,
    default: 0
  },
  settings: {
    oauthClientId: String,
    oauthClientSecret: String,
    webhookUrl: String,
    apiEndpoint: String,
    supportedFeatures: [{
      type: String
    }]
  }
}, {
  timestamps: true
});

// Index for sorting and filtering
IntegrationPlatformSchema.index({ isActive: 1, sortOrder: 1 });

export default mongoose.models.IntegrationPlatform || 
  mongoose.model<IIntegrationPlatform>('IntegrationPlatform', IntegrationPlatformSchema);