import mongoose, { Schema, Document, Types } from 'mongoose';

export enum AdStatus {
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  EXPIRED = 'EXPIRED'
}

export enum AdPriority {
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3,
  PREMIUM = 4
}

export enum AdPlacement {
  DASHBOARD_BANNER = 'DASHBOARD_BANNER',
  SEARCH_RESULTS = 'SEARCH_RESULTS',
  SIDEBAR = 'SIDEBAR',
  ALL = 'ALL'
}

export interface IFeaturedProviderAd extends Document {
  provider: Types.ObjectId;
  title: string;
  description: string;
  bannerImageUrl?: string;
  imageUrl?: string;
  ctaText: string;
  ctaLink?: string;
  status: AdStatus;
  priority: AdPriority;
  placement: AdPlacement[];
  startDate: Date;
  endDate: Date;
  durationDays: number;
  proposedPrice: number;
  approvedPrice?: number;
  paymentStatus: 'PENDING' | 'PAID' | 'REFUNDED';
  paymentMethod?: string;
  paymentNotes?: string;
  approvalNotes?: string;
  rejectionReason?: string;
  approvedBy?: Types.ObjectId;
  approvedAt?: Date;
  budget?: number;
  spentAmount: number;
  impressions: number;
  clicks: number;
  maxImpressions?: number;
  maxClicks?: number;
  targetCountries?: string[];
  targetCategories?: string[];
  createdBy: Types.ObjectId;
  lastModifiedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  isActive(): boolean;
  incrementImpression(): Promise<void>;
  incrementClick(): Promise<void>;
}

const FeaturedProviderAdSchema = new Schema<IFeaturedProviderAd>(
  {
    provider: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      maxlength: 100
    },
    description: {
      type: String,
      required: true,
      maxlength: 300
    },
    bannerImageUrl: {
      type: String
    },
    imageUrl: {
      type: String
    },
    ctaText: {
      type: String,
      required: true,
      default: 'Contact Provider',
      maxlength: 50
    },
    ctaLink: {
      type: String
    },
    status: {
      type: String,
      enum: Object.values(AdStatus),
      default: AdStatus.PENDING_APPROVAL,
      index: true
    },
    priority: {
      type: Number,
      enum: Object.values(AdPriority).filter(v => typeof v === 'number'),
      default: AdPriority.MEDIUM,
      index: true
    },
    placement: [{
      type: String,
      enum: Object.values(AdPlacement)
    }],
    startDate: {
      type: Date,
      required: true,
      index: true
    },
    endDate: {
      type: Date,
      required: true,
      index: true
    },
    durationDays: {
      type: Number,
      required: true,
      min: 1
    },
    proposedPrice: {
      type: Number,
      required: true,
      min: 0
    },
    approvedPrice: {
      type: Number,
      min: 0
    },
    paymentStatus: {
      type: String,
      enum: ['PENDING', 'PAID', 'REFUNDED'],
      default: 'PENDING'
    },
    paymentMethod: {
      type: String
    },
    paymentNotes: {
      type: String
    },
    approvalNotes: {
      type: String
    },
    rejectionReason: {
      type: String
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    approvedAt: {
      type: Date
    },
    budget: {
      type: Number,
      min: 0
    },
    spentAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    impressions: {
      type: Number,
      default: 0,
      min: 0
    },
    clicks: {
      type: Number,
      default: 0,
      min: 0
    },
    maxImpressions: {
      type: Number,
      min: 0
    },
    maxClicks: {
      type: Number,
      min: 0
    },
    targetCountries: [{
      type: String
    }],
    targetCategories: [{
      type: String
    }],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    lastModifiedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true
  }
);

// Indexes for efficient queries
FeaturedProviderAdSchema.index({ status: 1, priority: -1, startDate: 1, endDate: 1 });
FeaturedProviderAdSchema.index({ provider: 1, status: 1 });
FeaturedProviderAdSchema.index({ placement: 1, status: 1 });

// Methods
FeaturedProviderAdSchema.methods.isActive = function(): boolean {
  const now = new Date();
  return (
    this.status === AdStatus.ACTIVE &&
    this.paymentStatus === 'PAID' &&
    this.startDate <= now &&
    this.endDate >= now &&
    (!this.maxImpressions || this.impressions < this.maxImpressions) &&
    (!this.maxClicks || this.clicks < this.maxClicks) &&
    (!this.budget || this.spentAmount < this.budget)
  );
};

FeaturedProviderAdSchema.methods.incrementImpression = async function(): Promise<void> {
  this.impressions += 1;
  
  // Check if we've reached limits
  if (this.maxImpressions && this.impressions >= this.maxImpressions) {
    this.status = AdStatus.EXPIRED;
  }
  
  await this.save();
};

FeaturedProviderAdSchema.methods.incrementClick = async function(): Promise<void> {
  this.clicks += 1;
  
  // Add cost per click logic here if needed
  // this.spentAmount += this.costPerClick || 0;
  
  // Check if we've reached limits
  if (this.maxClicks && this.clicks >= this.maxClicks) {
    this.status = AdStatus.EXPIRED;
  }
  
  if (this.budget && this.spentAmount >= this.budget) {
    this.status = AdStatus.EXPIRED;
  }
  
  await this.save();
};

// Pre-save middleware to check and update status
FeaturedProviderAdSchema.pre('save', function(next) {
  const now = new Date();
  
  // Auto-expire ads that have passed their end date
  if (this.endDate < now && this.status === AdStatus.ACTIVE) {
    this.status = AdStatus.EXPIRED;
  }
  
  // Auto-activate pending ads that have reached their start date
  if (this.startDate <= now && this.status === AdStatus.PENDING && this.endDate > now) {
    this.status = AdStatus.ACTIVE;
  }
  
  next();
});

// Static method to get active ads
FeaturedProviderAdSchema.statics.getActiveAds = async function(placement?: AdPlacement, country?: string) {
  const now = new Date();
  const query: any = {
    status: AdStatus.ACTIVE,
    paymentStatus: 'PAID',
    startDate: { $lte: now },
    endDate: { $gte: now }
  };
  
  if (placement) {
    query.placement = { $in: [placement, AdPlacement.ALL] };
  }
  
  if (country) {
    query.$or = [
      { targetCountries: { $size: 0 } },
      { targetCountries: country }
    ];
  }
  
  return this.find(query)
    .populate('provider', 'businessName businessInfo serviceType profileImage')
    .sort({ priority: -1, createdAt: -1 })
    .lean();
};

const FeaturedProviderAd = mongoose.models.FeaturedProviderAd || mongoose.model<IFeaturedProviderAd>('FeaturedProviderAd', FeaturedProviderAdSchema);

export default FeaturedProviderAd;