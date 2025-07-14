import mongoose, { Document, Schema } from 'mongoose';

export interface IProviderRating extends Document {
  // Rating Details
  providerId: mongoose.Types.ObjectId;
  sellerId: mongoose.Types.ObjectId;
  sourcingRequestId: mongoose.Types.ObjectId;
  
  // Rating Scores (1-5)
  qualityScore: number;           // Quality of sourced products
  communicationScore: number;     // Response time and clarity
  reliabilityScore: number;       // Meeting deadlines and promises
  pricingScore: number;          // Fair and competitive pricing
  overallScore: number;          // Calculated average
  
  // Feedback
  review: string;
  wouldRecommend: boolean;
  
  // Specific Metrics
  deliveredOnTime: boolean;
  productQualityMet: boolean;
  pricingAsAgreed: boolean;
  packagingQuality: 'POOR' | 'FAIR' | 'GOOD' | 'EXCELLENT';
  
  // Tags for easy filtering
  tags: string[];
  
  // Status
  status: 'ACTIVE' | 'HIDDEN' | 'DISPUTED';
  disputeReason?: string;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const ProviderRatingSchema = new Schema<IProviderRating>({
  providerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  sellerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  sourcingRequestId: {
    type: Schema.Types.ObjectId,
    ref: 'SourcingRequest',
    required: true,
  },
  
  // Rating Scores
  qualityScore: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  communicationScore: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  reliabilityScore: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  pricingScore: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  overallScore: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  
  // Feedback
  review: {
    type: String,
    required: true,
    maxlength: 1000,
  },
  wouldRecommend: {
    type: Boolean,
    required: true,
  },
  
  // Specific Metrics
  deliveredOnTime: {
    type: Boolean,
    required: true,
  },
  productQualityMet: {
    type: Boolean,
    required: true,
  },
  pricingAsAgreed: {
    type: Boolean,
    required: true,
  },
  packagingQuality: {
    type: String,
    enum: ['POOR', 'FAIR', 'GOOD', 'EXCELLENT'],
    required: true,
  },
  
  // Tags
  tags: [{
    type: String,
  }],
  
  // Status
  status: {
    type: String,
    enum: ['ACTIVE', 'HIDDEN', 'DISPUTED'],
    default: 'ACTIVE',
  },
  disputeReason: String,
}, {
  timestamps: true,
});

// Indexes
ProviderRatingSchema.index({ providerId: 1, status: 1 });
ProviderRatingSchema.index({ sellerId: 1 });
ProviderRatingSchema.index({ sourcingRequestId: 1 }, { unique: true }); // One rating per sourcing request
ProviderRatingSchema.index({ overallScore: -1 });
ProviderRatingSchema.index({ createdAt: -1 });

// Calculate overall score before saving
ProviderRatingSchema.pre('save', function(next) {
  this.overallScore = (
    this.qualityScore + 
    this.communicationScore + 
    this.reliabilityScore + 
    this.pricingScore
  ) / 4;
  next();
});

// Virtual for score percentage
ProviderRatingSchema.virtual('scorePercentage').get(function() {
  return (this.overallScore / 5) * 100;
});

const ProviderRating = mongoose.models.ProviderRating || mongoose.model<IProviderRating>('ProviderRating', ProviderRatingSchema);

export default ProviderRating;