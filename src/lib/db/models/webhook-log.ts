import mongoose, { Document, Schema } from 'mongoose';

export enum WebhookStatus {
  SUCCESS = 'success',
  FAILED = 'failed',
  PROCESSING = 'processing',
  SIGNATURE_INVALID = 'signature_invalid',
  INTEGRATION_NOT_FOUND = 'integration_not_found',
  PRODUCT_NOT_FOUND = 'product_not_found',
  EXPEDITION_NOT_FOUND = 'expedition_not_found',
  INTEGRATION_PAUSED = 'integration_paused',
  ORDER_CREATION_FAILED = 'order_creation_failed'
}

export interface IWebhookLog extends Document {
  webhookId: string;
  platform: string;
  integrationId?: string;
  userId?: string;
  warehouseId?: string;
  
  requestUrl: string;
  headers: Record<string, any>;
  payload: Record<string, any>;
  
  status: WebhookStatus;
  processingTime: number;
  errorMessage?: string;
  errorStack?: string;
  
  orderData?: {
    externalOrderId?: string;
    internalOrderId?: string;
    customerName?: string;
    totalAmount?: number;
    currency?: string;
    productsCount?: number;
  };
  
  signatureValidation?: {
    provided: string;
    isValid: boolean;
    method?: string;
  };
  
  steps: Array<{
    step: string;
    status: 'success' | 'failed' | 'skipped';
    duration: number;
    details?: string;
    timestamp: Date;
  }>;
  
  responseStatus: number;
  responseBody: Record<string, any>;
  
  startedAt: Date;
  completedAt?: Date;
  expiresAt: Date;
}

const WebhookLogSchema = new Schema<IWebhookLog>({
  webhookId: { type: String, required: true, unique: true, index: true },
  platform: { type: String, required: true, index: true },
  integrationId: { type: String, index: true },
  userId: { type: String, index: true },
  warehouseId: { type: String, index: true },
  
  requestUrl: String,
  headers: Schema.Types.Mixed,
  payload: Schema.Types.Mixed,
  
  status: {
    type: String,
    enum: Object.values(WebhookStatus),
    required: true,
    index: true
  },
  processingTime: Number,
  errorMessage: String,
  errorStack: String,
  
  orderData: {
    externalOrderId: String,
    internalOrderId: String,
    customerName: String,
    totalAmount: Number,
    currency: String,
    productsCount: Number
  },
  
  signatureValidation: {
    provided: String,
    isValid: Boolean,
    method: String
  },
  
  steps: [{
    step: String,
    status: { type: String, enum: ['success', 'failed', 'skipped'] },
    duration: Number,
    details: String,
    timestamp: Date
  }],
  
  responseStatus: Number,
  responseBody: Schema.Types.Mixed,
  
  startedAt: { type: Date, required: true, index: true },
  completedAt: Date,
  expiresAt: { 
    type: Date, 
    required: true,
    index: { expireAfterSeconds: 0 } // MongoDB TTL index for automatic cleanup
  }
}, { timestamps: true });

WebhookLogSchema.index({ platform: 1, status: 1, startedAt: -1 });
WebhookLogSchema.index({ startedAt: -1 });

const WebhookLog = mongoose.models?.WebhookLog || mongoose.model<IWebhookLog>('WebhookLog', WebhookLogSchema);

export default WebhookLog;