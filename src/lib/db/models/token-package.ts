import mongoose, { Document, Schema } from 'mongoose';

/**
 * Token package status enum
 */
export enum TokenPackageStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ARCHIVED = 'archived',
}

/**
 * Token package interface for predefined token bundles
 */
export interface ITokenPackage extends Document {
  name: string;
  description?: string;
  tokenCount: number;
  priceUsd: number;
  stripePriceId?: string;
  status: TokenPackageStatus;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Token package schema
 */
const TokenPackageSchema = new Schema<ITokenPackage>(
  {
    name: {
      type: String,
      required: [true, 'Package name is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    tokenCount: {
      type: Number,
      required: [true, 'Token count is required'],
      min: [1, 'Token count must be at least 1'],
    },
    priceUsd: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    stripePriceId: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: Object.values(TokenPackageStatus),
      default: TokenPackageStatus.ACTIVE,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

TokenPackageSchema.index({ status: 1, sortOrder: 1 });

const TokenPackage = mongoose.models?.TokenPackage || mongoose.model<ITokenPackage>('TokenPackage', TokenPackageSchema);

export default TokenPackage;