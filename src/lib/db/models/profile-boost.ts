import mongoose, { Document, Schema } from 'mongoose';

/**
 * Profile boost status enum
 */
export enum ProfileBoostStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

/**
 * Profile boost interface for provider ads/boosting
 */
export interface IProfileBoost extends Document {
  userId: mongoose.Types.ObjectId;
  tokensPerClick: number;
  totalTokensBudget: number;
  tokensSpent: number;
  clicksReceived: number;
  impressions: number;
  status: ProfileBoostStatus;
  startDate: Date;
  endDate?: Date;
  isAutoRenew: boolean;
  targetAudience?: {
    countries?: string[];
    serviceTypes?: string[];
  };
  createdAt: Date;
  updatedAt: Date;

  // Methods
  recordClick: () => Promise<boolean>;
  recordImpression: () => Promise<void>;
  pauseBoost: () => Promise<void>;
  resumeBoost: () => Promise<void>;
  getRemainingBudget: () => number;
  getClickThroughRate: () => number;
}

/**
 * Profile boost click record for tracking clicks and preventing fraud
 */
export interface IProfileBoostClick extends Document {
  profileBoostId: mongoose.Types.ObjectId;
  clickerUserId?: mongoose.Types.ObjectId;
  ipAddress: string;
  userAgent: string;
  tokensCharged: number;
  createdAt: Date;
}

/**
 * Profile boost schema
 */
const ProfileBoostSchema = new Schema<IProfileBoost>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    tokensPerClick: {
      type: Number,
      required: [true, 'Tokens per click is required'],
      min: [1, 'Tokens per click must be at least 1'],
      max: [100, 'Tokens per click cannot exceed 100'],
    },
    totalTokensBudget: {
      type: Number,
      required: [true, 'Total tokens budget is required'],
      min: [1, 'Budget must be at least 1 token'],
    },
    tokensSpent: {
      type: Number,
      default: 0,
      min: 0,
    },
    clicksReceived: {
      type: Number,
      default: 0,
      min: 0,
    },
    impressions: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: Object.values(ProfileBoostStatus),
      default: ProfileBoostStatus.ACTIVE,
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
      default: Date.now,
    },
    endDate: {
      type: Date,
    },
    isAutoRenew: {
      type: Boolean,
      default: false,
    },
    targetAudience: {
      countries: [String],
      serviceTypes: [String],
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Profile boost click schema
 */
const ProfileBoostClickSchema = new Schema<IProfileBoostClick>(
  {
    profileBoostId: {
      type: Schema.Types.ObjectId,
      ref: 'ProfileBoost',
      required: [true, 'Profile boost ID is required'],
    },
    clickerUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    ipAddress: {
      type: String,
      required: [true, 'IP address is required'],
    },
    userAgent: {
      type: String,
      required: [true, 'User agent is required'],
    },
    tokensCharged: {
      type: Number,
      required: [true, 'Tokens charged is required'],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
ProfileBoostSchema.index({ userId: 1, status: 1 });
ProfileBoostSchema.index({ status: 1, startDate: 1 });
ProfileBoostSchema.index({ 'targetAudience.countries': 1 }, { sparse: true });
ProfileBoostSchema.index({ 'targetAudience.serviceTypes': 1 }, { sparse: true });

ProfileBoostClickSchema.index({ profileBoostId: 1, createdAt: -1 });
ProfileBoostClickSchema.index({ ipAddress: 1, createdAt: -1 });
ProfileBoostClickSchema.index({ clickerUserId: 1 }, { sparse: true });

/**
 * Record a click on boosted profile
 */
ProfileBoostSchema.methods.recordClick = async function (): Promise<boolean> {
  if (this.status !== ProfileBoostStatus.ACTIVE) {
    return false;
  }
  
  const remainingBudget = this.totalTokensBudget - this.tokensSpent;
  if (remainingBudget < this.tokensPerClick) {
    // Mark as completed if budget exhausted
    this.status = ProfileBoostStatus.COMPLETED;
    this.endDate = new Date();
    await this.save();
    return false;
  }
  
  // Update stats
  this.tokensSpent += this.tokensPerClick;
  this.clicksReceived += 1;
  
  // Check if budget is now exhausted
  if (this.tokensSpent >= this.totalTokensBudget) {
    this.status = ProfileBoostStatus.COMPLETED;
    this.endDate = new Date();
  }
  
  await this.save();
  return true;
};

/**
 * Record an impression (profile shown in search results)
 */
ProfileBoostSchema.methods.recordImpression = async function (): Promise<void> {
  if (this.status === ProfileBoostStatus.ACTIVE) {
    this.impressions += 1;
    await this.save();
  }
};

/**
 * Pause boost campaign
 */
ProfileBoostSchema.methods.pauseBoost = async function (): Promise<void> {
  if (this.status === ProfileBoostStatus.ACTIVE) {
    this.status = ProfileBoostStatus.PAUSED;
    await this.save();
  }
};

/**
 * Resume boost campaign
 */
ProfileBoostSchema.methods.resumeBoost = async function (): Promise<void> {
  if (this.status === ProfileBoostStatus.PAUSED) {
    this.status = ProfileBoostStatus.ACTIVE;
    await this.save();
  }
};

/**
 * Get remaining budget
 */
ProfileBoostSchema.methods.getRemainingBudget = function (): number {
  return Math.max(0, this.totalTokensBudget - this.tokensSpent);
};

/**
 * Calculate click-through rate
 */
ProfileBoostSchema.methods.getClickThroughRate = function (): number {
  if (this.impressions === 0) return 0;
  return (this.clicksReceived / this.impressions) * 100;
};

const ProfileBoost = mongoose.models?.ProfileBoost || mongoose.model<IProfileBoost>('ProfileBoost', ProfileBoostSchema);
const ProfileBoostClick = mongoose.models?.ProfileBoostClick || mongoose.model<IProfileBoostClick>('ProfileBoostClick', ProfileBoostClickSchema);

export { ProfileBoostClick };
export default ProfileBoost;