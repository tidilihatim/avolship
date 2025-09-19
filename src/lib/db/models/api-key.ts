import mongoose, { Document, Schema } from 'mongoose';
import crypto from 'crypto';

export enum ApiKeyStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  REVOKED = 'revoked',
}

export interface IApiKey extends Document {
  sellerId: mongoose.Types.ObjectId;
  name: string;
  keyId: string; // Public identifier
  hashedKey: string; // Hashed API key
  hashedSecret: string; // Hashed API secret
  status: ApiKeyStatus;
  lastUsed?: Date;
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;

  // Methods
  validateKey: (apiKey: string) => Promise<boolean>;
  validateSecret: (apiSecret: string) => Promise<boolean>;
  incrementUsage: () => Promise<void>;
}

export interface IApiKeyModel extends mongoose.Model<IApiKey> {
  createApiKey: (sellerId: mongoose.Types.ObjectId, name: string) => Promise<{
    apiKey: IApiKey;
    credentials: { keyId: string; apiKey: string; apiSecret: string };
  }>;
  validateCredentials: (keyId: string, apiKey: string, apiSecret: string) => Promise<IApiKey | null>;
}

const ApiKeySchema = new Schema<IApiKey>(
  {
    sellerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    keyId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    hashedKey: {
      type: String,
      required: true,
    },
    hashedSecret: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(ApiKeyStatus),
      default: ApiKeyStatus.ACTIVE,
      index: true,
    },
    lastUsed: {
      type: Date,
    },
    usageCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries
ApiKeySchema.index({ sellerId: 1, status: 1 });
ApiKeySchema.index({ keyId: 1, status: 1 });

// Helper functions (not attached to schema)
const generateKeyPair = (): { keyId: string; apiKey: string; apiSecret: string } => {
  const keyId = `ak_${crypto.randomBytes(16).toString('hex')}`;
  const apiKey = `sk_${crypto.randomBytes(32).toString('hex')}`;
  const apiSecret = crypto.randomBytes(32).toString('hex');

  return {
    keyId,
    apiKey,
    apiSecret,
  };
};

// Static method to create new API key
ApiKeySchema.statics.createApiKey = async function(sellerId: mongoose.Types.ObjectId, name: string) {
  const { keyId, apiKey, apiSecret } = generateKeyPair();

  // Hash the key and secret for storage
  const hashedKey = crypto.createHash('sha256').update(apiKey).digest('hex');
  const hashedSecret = crypto.createHash('sha256').update(apiSecret).digest('hex');

  const newApiKey = await this.create({
    sellerId,
    name,
    keyId,
    hashedKey,
    hashedSecret,
    status: ApiKeyStatus.ACTIVE,
  });

  // Return the plain key and secret (only time they're exposed)
  return {
    apiKey: newApiKey,
    credentials: {
      keyId,
      apiKey,
      apiSecret,
    }
  };
};

// Instance method to validate API key
ApiKeySchema.methods.validateKey = async function(apiKey: string): Promise<boolean> {
  const hashedInput = crypto.createHash('sha256').update(apiKey).digest('hex');
  return hashedInput === this.hashedKey;
};

// Instance method to validate API secret
ApiKeySchema.methods.validateSecret = async function(apiSecret: string): Promise<boolean> {
  const hashedInput = crypto.createHash('sha256').update(apiSecret).digest('hex');
  return hashedInput === this.hashedSecret;
};

// Instance method to increment usage
ApiKeySchema.methods.incrementUsage = async function(): Promise<void> {
  this.usageCount += 1;
  this.lastUsed = new Date();
  await this.save();
};

// Static method to find by keyId and validate credentials
ApiKeySchema.statics.validateCredentials = async function(keyId: string, apiKey: string, apiSecret: string) {
  const apiKeyDoc = await this.findOne({
    keyId,
    status: ApiKeyStatus.ACTIVE
  }).populate('sellerId', 'name email status');

  if (!apiKeyDoc) {
    return null;
  }

  const isKeyValid = await apiKeyDoc.validateKey(apiKey);
  const isSecretValid = await apiKeyDoc.validateSecret(apiSecret);

  if (isKeyValid && isSecretValid) {
    return apiKeyDoc;
  }

  return null;
};

const ApiKey = (mongoose.models?.ApiKey || mongoose.model<IApiKey, IApiKeyModel>('ApiKey', ApiKeySchema)) as IApiKeyModel;

export default ApiKey;