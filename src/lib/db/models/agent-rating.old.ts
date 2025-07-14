import mongoose, { Document, Schema } from 'mongoose';

export interface IAgentRating extends Document {
  // Rating Details
  agentId: mongoose.Types.ObjectId;
  adminId: mongoose.Types.ObjectId;
  
  // Rating Period
  periodStart: Date;
  periodEnd: Date;
  periodType: 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';
  
  // Admin Boost (0-100%)
  adminBoostPercentage: number;   // Admin can boost rating by 0-100%
  adminBoostReason?: string;      // Reason for boost
  
  // Auto-calculated scores based on performance
  performanceScore: number;       // Auto-calculated from metrics
  finalScore: number;             // Performance score + admin boost
  
  // Performance Metrics (auto-calculated from orders)
  totalCallsHandled: number;
  successfulCalls: number;
  confirmedOrders: number;
  deliveredOrders: number;
  avgCallDuration: number;        // in seconds
  callSuccessRate: number;        // percentage
  orderConfirmationRate: number;  // percentage
  deliveryRate: number;           // percentage of confirmed that got delivered
  
  // Qualitative Feedback
  strengths: string[];
  areasForImprovement: string[];
  actionPlan: string;
  additionalComments: string;
  
  // Goals & Targets
  goalsAchieved: string[];
  goalsSet: string[];
  
  // Recognition
  performanceLevel: 'NEEDS_IMPROVEMENT' | 'SATISFACTORY' | 'GOOD' | 'EXCELLENT' | 'OUTSTANDING';
  eligibleForBonus: boolean;
  bonusAmount?: number;
  
  // Status
  status: 'DRAFT' | 'SUBMITTED' | 'ACKNOWLEDGED';
  acknowledgedAt?: Date;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const AgentRatingSchema = new Schema<IAgentRating>({
  agentId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  adminId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  
  // Rating Period
  periodStart: {
    type: Date,
    required: true,
  },
  periodEnd: {
    type: Date,
    required: true,
  },
  periodType: {
    type: String,
    enum: ['WEEKLY', 'MONTHLY', 'QUARTERLY', 'ANNUAL'],
    required: true,
  },
  
  // Admin Boost
  adminBoostPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  adminBoostReason: {
    type: String,
    maxlength: 500,
  },
  
  // Calculated Scores
  performanceScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  },
  finalScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  },
  
  // Performance Metrics
  totalCallsHandled: {
    type: Number,
    default: 0,
  },
  successfulCalls: {
    type: Number,
    default: 0,
  },
  confirmedOrders: {
    type: Number,
    default: 0,
  },
  deliveredOrders: {
    type: Number,
    default: 0,
  },
  avgCallDuration: {
    type: Number,
    default: 0,
  },
  callSuccessRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  orderConfirmationRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  deliveryRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  
  // Qualitative Feedback
  strengths: [{
    type: String,
  }],
  areasForImprovement: [{
    type: String,
  }],
  actionPlan: {
    type: String,
    maxlength: 2000,
  },
  additionalComments: {
    type: String,
    maxlength: 2000,
  },
  
  // Goals & Targets
  goalsAchieved: [{
    type: String,
  }],
  goalsSet: [{
    type: String,
  }],
  
  // Recognition
  performanceLevel: {
    type: String,
    enum: ['NEEDS_IMPROVEMENT', 'SATISFACTORY', 'GOOD', 'EXCELLENT', 'OUTSTANDING'],
    required: true,
  },
  eligibleForBonus: {
    type: Boolean,
    default: false,
  },
  bonusAmount: {
    type: Number,
    min: 0,
  },
  
  // Status
  status: {
    type: String,
    enum: ['DRAFT', 'SUBMITTED', 'ACKNOWLEDGED'],
    default: 'DRAFT',
  },
  acknowledgedAt: Date,
}, {
  timestamps: true,
});

// Indexes
AgentRatingSchema.index({ agentId: 1, periodStart: 1, periodEnd: 1 }, { unique: true });
AgentRatingSchema.index({ adminId: 1 });
AgentRatingSchema.index({ status: 1 });
AgentRatingSchema.index({ periodType: 1 });
AgentRatingSchema.index({ performanceLevel: 1 });
AgentRatingSchema.index({ createdAt: -1 });

// Calculate scores before saving
AgentRatingSchema.pre('save', function(next) {
  // Calculate performance score based on metrics
  let score = 0;
  let factors = 0;
  
  // Call success rate (0-100% -> 0-5 score)
  if (this.totalCallsHandled > 0) {
    score += (this.callSuccessRate / 100) * 5;
    factors++;
  }
  
  // Order confirmation rate (0-100% -> 0-5 score)
  if (this.confirmedOrders > 0 || this.totalCallsHandled > 0) {
    score += (this.orderConfirmationRate / 100) * 5;
    factors++;
  }
  
  // Delivery rate (0-100% -> 0-5 score)
  if (this.confirmedOrders > 0) {
    score += (this.deliveryRate / 100) * 5;
    factors++;
  }
  
  // Base performance score
  this.performanceScore = factors > 0 ? score / factors : 0;
  
  // Apply admin boost
  const boostMultiplier = 1 + (this.adminBoostPercentage / 100);
  this.finalScore = Math.min(5, this.performanceScore * boostMultiplier);
  
  // Determine performance level based on final score
  if (this.finalScore >= 4.5) {
    this.performanceLevel = 'OUTSTANDING';
  } else if (this.finalScore >= 4) {
    this.performanceLevel = 'EXCELLENT';
  } else if (this.finalScore >= 3.5) {
    this.performanceLevel = 'GOOD';
  } else if (this.finalScore >= 2.5) {
    this.performanceLevel = 'SATISFACTORY';
  } else {
    this.performanceLevel = 'NEEDS_IMPROVEMENT';
  }
  
  // Auto-set bonus eligibility
  this.eligibleForBonus = this.finalScore >= 4;
  
  next();
});

const AgentRating = mongoose.models.AgentRating || mongoose.model<IAgentRating>('AgentRating', AgentRatingSchema);

export default AgentRating;