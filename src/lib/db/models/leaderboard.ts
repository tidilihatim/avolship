import mongoose, { Document, Schema } from 'mongoose';
import { UserRole } from './user';

export enum LeaderboardType {
  PROVIDER = 'provider',
  SELLER = 'seller',
  CALL_CENTER_AGENT = 'call_center_agent',
}

export enum LeaderboardPeriod {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
  ALL_TIME = 'all_time',
}

export interface ProviderMetrics {
  totalDeliveries: number;
  successfulDeliveries: number;
  avgDeliveryTime: number; // in hours
  customerRating: number; // 1-5 scale
  totalRatingCount: number;
  onTimeDeliveryRate: number; // percentage
  cancellationRate: number; // percentage
  revenue: number;
  avgOrderValue: number;
}

export interface SellerMetrics {
  totalOrders: number;
  confirmedOrders: number;
  deliveredOrders: number;
  conversionRate: number; // percentage
  customerRating: number; // 1-5 scale
  totalRatingCount: number;
  revenue: number;
  avgOrderValue: number;
  returnRate: number; // percentage
}

export interface CallCenterAgentMetrics {
  totalCalls: number;
  successfulCalls: number;
  confirmedOrders: number;
  deliveredOrders: number;
  callSuccessRate: number; // percentage
  avgCallDuration: number; // in minutes
  orderConfirmationRate: number; // percentage
  customerSatisfactionScore: number; // 1-5 scale
  totalCustomerRatings: number;
  dailyTargetAchievement: number; // percentage
}

export interface ILeaderboard extends Document {
  userId: mongoose.Types.ObjectId;
  userRole: UserRole;
  leaderboardType: LeaderboardType;
  period: LeaderboardPeriod;
  periodStartDate: Date;
  periodEndDate: Date;
  
  // Metrics based on role
  providerMetrics?: ProviderMetrics;
  sellerMetrics?: SellerMetrics;
  callCenterAgentMetrics?: CallCenterAgentMetrics;
  
  // Ranking and scoring
  totalScore: number; // Calculated score for ranking
  rank: number; // Position in leaderboard
  previousRank?: number; // Previous period rank for comparison
  
  // Meta information
  lastUpdated: Date;
  isActive: boolean; // Whether this entry should be displayed
  
  createdAt: Date;
  updatedAt: Date;
}

const LeaderboardSchema = new Schema<ILeaderboard>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    userRole: {
      type: String,
      enum: Object.values(UserRole),
      required: [true, 'User role is required'],
      index: true,
    },
    leaderboardType: {
      type: String,
      enum: Object.values(LeaderboardType),
      required: [true, 'Leaderboard type is required'],
      index: true,
    },
    period: {
      type: String,
      enum: Object.values(LeaderboardPeriod),
      required: [true, 'Period is required'],
      index: true,
    },
    periodStartDate: {
      type: Date,
      required: [true, 'Period start date is required'],
      index: true,
    },
    periodEndDate: {
      type: Date,
      required: [true, 'Period end date is required'],
      index: true,
    },
    
    // Provider metrics
    providerMetrics: {
      totalDeliveries: {
        type: Number,
        default: 0,
        min: [0, 'Total deliveries cannot be negative'],
      },
      successfulDeliveries: {
        type: Number,
        default: 0,
        min: [0, 'Successful deliveries cannot be negative'],
      },
      avgDeliveryTime: {
        type: Number,
        default: 0,
        min: [0, 'Average delivery time cannot be negative'],
      },
      customerRating: {
        type: Number,
        default: 0,
        min: [0, 'Customer rating cannot be negative'],
        max: [5, 'Customer rating cannot exceed 5'],
      },
      totalRatingCount: {
        type: Number,
        default: 0,
        min: [0, 'Total rating count cannot be negative'],
      },
      onTimeDeliveryRate: {
        type: Number,
        default: 0,
        min: [0, 'On-time delivery rate cannot be negative'],
        max: [100, 'On-time delivery rate cannot exceed 100%'],
      },
      cancellationRate: {
        type: Number,
        default: 0,
        min: [0, 'Cancellation rate cannot be negative'],
        max: [100, 'Cancellation rate cannot exceed 100%'],
      },
      revenue: {
        type: Number,
        default: 0,
        min: [0, 'Revenue cannot be negative'],
      },
      avgOrderValue: {
        type: Number,
        default: 0,
        min: [0, 'Average order value cannot be negative'],
      },
    },
    
    // Seller metrics
    sellerMetrics: {
      totalOrders: {
        type: Number,
        default: 0,
        min: [0, 'Total orders cannot be negative'],
      },
      confirmedOrders: {
        type: Number,
        default: 0,
        min: [0, 'Confirmed orders cannot be negative'],
      },
      deliveredOrders: {
        type: Number,
        default: 0,
        min: [0, 'Delivered orders cannot be negative'],
      },
      conversionRate: {
        type: Number,
        default: 0,
        min: [0, 'Conversion rate cannot be negative'],
        max: [100, 'Conversion rate cannot exceed 100%'],
      },
      customerRating: {
        type: Number,
        default: 0,
        min: [0, 'Customer rating cannot be negative'],
        max: [5, 'Customer rating cannot exceed 5'],
      },
      totalRatingCount: {
        type: Number,
        default: 0,
        min: [0, 'Total rating count cannot be negative'],
      },
      revenue: {
        type: Number,
        default: 0,
        min: [0, 'Revenue cannot be negative'],
      },
      avgOrderValue: {
        type: Number,
        default: 0,
        min: [0, 'Average order value cannot be negative'],
      },
      returnRate: {
        type: Number,
        default: 0,
        min: [0, 'Return rate cannot be negative'],
        max: [100, 'Return rate cannot exceed 100%'],
      },
    },
    
    // Call center agent metrics
    callCenterAgentMetrics: {
      totalCalls: {
        type: Number,
        default: 0,
        min: [0, 'Total calls cannot be negative'],
      },
      successfulCalls: {
        type: Number,
        default: 0,
        min: [0, 'Successful calls cannot be negative'],
      },
      confirmedOrders: {
        type: Number,
        default: 0,
        min: [0, 'Confirmed orders cannot be negative'],
      },
      deliveredOrders: {
        type: Number,
        default: 0,
        min: [0, 'Delivered orders cannot be negative'],
      },
      callSuccessRate: {
        type: Number,
        default: 0,
        min: [0, 'Call success rate cannot be negative'],
        max: [100, 'Call success rate cannot exceed 100%'],
      },
      avgCallDuration: {
        type: Number,
        default: 0,
        min: [0, 'Average call duration cannot be negative'],
      },
      orderConfirmationRate: {
        type: Number,
        default: 0,
        min: [0, 'Order confirmation rate cannot be negative'],
        max: [100, 'Order confirmation rate cannot exceed 100%'],
      },
      customerSatisfactionScore: {
        type: Number,
        default: 0,
        min: [0, 'Customer satisfaction score cannot be negative'],
        max: [5, 'Customer satisfaction score cannot exceed 5'],
      },
      totalCustomerRatings: {
        type: Number,
        default: 0,
        min: [0, 'Total customer ratings cannot be negative'],
      },
      dailyTargetAchievement: {
        type: Number,
        default: 0,
        min: [0, 'Daily target achievement cannot be negative'],
      },
    },
    
    totalScore: {
      type: Number,
      default: 0,
      min: [0, 'Total score cannot be negative'],
      index: true,
    },
    rank: {
      type: Number,
      default: 0,
      min: [1, 'Rank must be at least 1'],
      index: true,
    },
    previousRank: {
      type: Number,
      min: [1, 'Previous rank must be at least 1'],
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
LeaderboardSchema.index({ 
  leaderboardType: 1, 
  period: 1, 
  periodStartDate: 1, 
  periodEndDate: 1,
  isActive: 1,
  totalScore: -1 
});

LeaderboardSchema.index({ 
  userId: 1, 
  leaderboardType: 1, 
  period: 1, 
  periodStartDate: 1 
});

LeaderboardSchema.index({ 
  userRole: 1, 
  leaderboardType: 1, 
  period: 1,
  isActive: 1,
  rank: 1 
});

// Text search index for user-related searches
LeaderboardSchema.index({ 
  userId: 1,
  lastUpdated: -1
});

const Leaderboard = mongoose.models?.Leaderboard || mongoose.model<ILeaderboard>('Leaderboard', LeaderboardSchema);

export default Leaderboard;