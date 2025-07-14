import mongoose, { Document, Schema } from 'mongoose';

/**
 * Metric types for different time periods
 */
export enum MetricPeriod {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
}

/**
 * Support channel types
 */
export enum SupportChannel {
  CHAT = 'chat',
  TICKET = 'ticket',
  EMAIL = 'email',
  PHONE = 'phone',
}

/**
 * Agent performance metrics
 */
export interface IAgentPerformance {
  agentId: mongoose.Types.ObjectId;
  agentName: string;
  ticketsHandled: number;
  chatsHandled: number;
  averageResponseTime: number; // in seconds
  averageResolutionTime: number; // in minutes
  customerSatisfactionScore: number;
  satisfactionRatings: number;
  firstContactResolution: number;
  escalationRate: number;
  activeHours: number;
  totalCustomersHelped: number;
}

/**
 * Channel performance metrics
 */
export interface IChannelMetrics {
  channel: SupportChannel;
  totalContacts: number;
  resolvedContacts: number;
  averageHandlingTime: number; // in minutes
  customerSatisfactionScore: number;
  firstContactResolution: number;
  escalationCount: number;
  transferCount: number;
}

/**
 * Customer satisfaction breakdown
 */
export interface ISatisfactionBreakdown {
  veryUnsatisfied: number; // 1 star
  unsatisfied: number;     // 2 stars
  neutral: number;         // 3 stars
  satisfied: number;       // 4 stars
  verySatisfied: number;   // 5 stars
  totalRatings: number;
  averageRating: number;
}

/**
 * SLA performance metrics
 */
export interface ISLAMetrics {
  targetResponseTime: number; // in minutes
  actualAverageResponseTime: number;
  responseTimeMet: number; // percentage
  targetResolutionTime: number; // in minutes
  actualAverageResolutionTime: number;
  resolutionTimeMet: number; // percentage
  escalationsTotal: number;
  escalationRate: number; // percentage
}

/**
 * Ticket category breakdown
 */
export interface ICategoryMetrics {
  category: string;
  count: number;
  percentage: number;
  averageResolutionTime: number;
  satisfactionScore: number;
}

/**
 * Time-based activity metrics
 */
export interface IActivityMetrics {
  hour: number; // 0-23
  ticketsCreated: number;
  chatsStarted: number;
  totalContacts: number;
  agentsOnline: number;
  averageWaitTime: number;
}

/**
 * Support metrics interface for comprehensive analytics
 */
export interface ISupportMetrics extends Document {
  // Time Period
  period: MetricPeriod;
  dateStart: Date;
  dateEnd: Date;
  
  // Overall Statistics
  totalTickets: number;
  totalChats: number;
  totalContacts: number;
  
  // Resolution Metrics
  resolvedTickets: number;
  closedTickets: number;
  resolvedChats: number;
  resolutionRate: number; // percentage
  
  // Response Time Metrics
  averageFirstResponseTime: number; // in minutes
  averageResolutionTime: number; // in minutes
  medianResponseTime: number;
  medianResolutionTime: number;
  
  // Customer Satisfaction
  customerSatisfaction: ISatisfactionBreakdown;
  netPromoterScore?: number;
  
  // SLA Performance
  slaMetrics: ISLAMetrics;
  
  // Agent Performance
  agentPerformance: IAgentPerformance[];
  totalActiveAgents: number;
  averageAgentUtilization: number; // percentage
  
  // Channel Performance
  channelMetrics: IChannelMetrics[];
  
  // Category Breakdown
  categoryBreakdown: ICategoryMetrics[];
  
  // Time-based Analysis
  hourlyActivity: IActivityMetrics[];
  peakHours: number[]; // Array of peak activity hours
  
  // Customer Metrics
  newCustomers: number;
  returningCustomers: number;
  customerRetentionRate: number;
  
  // Business Impact
  revenueImpact?: number; // estimated revenue impact of support
  costPerContact: number;
  
  // Quality Metrics
  firstContactResolution: number; // percentage
  escalationRate: number; // percentage
  transferRate: number; // percentage
  reopenRate: number; // percentage
  
  // Workload Metrics
  backlogTickets: number;
  newTicketsCreated: number;
  ticketVelocity: number; // tickets resolved per day
  
  // Timestamps
  calculatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AgentPerformanceSchema = new Schema<IAgentPerformance>({
  agentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  agentName: { type: String, required: true },
  ticketsHandled: { type: Number, default: 0 },
  chatsHandled: { type: Number, default: 0 },
  averageResponseTime: { type: Number, default: 0 },
  averageResolutionTime: { type: Number, default: 0 },
  customerSatisfactionScore: { type: Number, default: 0 },
  satisfactionRatings: { type: Number, default: 0 },
  firstContactResolution: { type: Number, default: 0 },
  escalationRate: { type: Number, default: 0 },
  activeHours: { type: Number, default: 0 },
  totalCustomersHelped: { type: Number, default: 0 }
});

const ChannelMetricsSchema = new Schema<IChannelMetrics>({
  channel: { type: String, required: true, enum: Object.values(SupportChannel) },
  totalContacts: { type: Number, default: 0 },
  resolvedContacts: { type: Number, default: 0 },
  averageHandlingTime: { type: Number, default: 0 },
  customerSatisfactionScore: { type: Number, default: 0 },
  firstContactResolution: { type: Number, default: 0 },
  escalationCount: { type: Number, default: 0 },
  transferCount: { type: Number, default: 0 }
});

const SatisfactionBreakdownSchema = new Schema<ISatisfactionBreakdown>({
  veryUnsatisfied: { type: Number, default: 0 },
  unsatisfied: { type: Number, default: 0 },
  neutral: { type: Number, default: 0 },
  satisfied: { type: Number, default: 0 },
  verySatisfied: { type: Number, default: 0 },
  totalRatings: { type: Number, default: 0 },
  averageRating: { type: Number, default: 0 }
});

const SLAMetricsSchema = new Schema<ISLAMetrics>({
  targetResponseTime: { type: Number, required: true },
  actualAverageResponseTime: { type: Number, default: 0 },
  responseTimeMet: { type: Number, default: 0 },
  targetResolutionTime: { type: Number, required: true },
  actualAverageResolutionTime: { type: Number, default: 0 },
  resolutionTimeMet: { type: Number, default: 0 },
  escalationsTotal: { type: Number, default: 0 },
  escalationRate: { type: Number, default: 0 }
});

const CategoryMetricsSchema = new Schema<ICategoryMetrics>({
  category: { type: String, required: true },
  count: { type: Number, default: 0 },
  percentage: { type: Number, default: 0 },
  averageResolutionTime: { type: Number, default: 0 },
  satisfactionScore: { type: Number, default: 0 }
});

const ActivityMetricsSchema = new Schema<IActivityMetrics>({
  hour: { type: Number, required: true, min: 0, max: 23 },
  ticketsCreated: { type: Number, default: 0 },
  chatsStarted: { type: Number, default: 0 },
  totalContacts: { type: Number, default: 0 },
  agentsOnline: { type: Number, default: 0 },
  averageWaitTime: { type: Number, default: 0 }
});

const SupportMetricsSchema = new Schema<ISupportMetrics>(
  {
    period: {
      type: String,
      required: true,
      enum: Object.values(MetricPeriod),
    },
    dateStart: {
      type: Date,
      required: true,
    },
    dateEnd: {
      type: Date,
      required: true,
    },
    totalTickets: { type: Number, default: 0 },
    totalChats: { type: Number, default: 0 },
    totalContacts: { type: Number, default: 0 },
    resolvedTickets: { type: Number, default: 0 },
    closedTickets: { type: Number, default: 0 },
    resolvedChats: { type: Number, default: 0 },
    resolutionRate: { type: Number, default: 0 },
    averageFirstResponseTime: { type: Number, default: 0 },
    averageResolutionTime: { type: Number, default: 0 },
    medianResponseTime: { type: Number, default: 0 },
    medianResolutionTime: { type: Number, default: 0 },
    customerSatisfaction: {
      type: SatisfactionBreakdownSchema,
      default: () => ({})
    },
    netPromoterScore: { type: Number },
    slaMetrics: {
      type: SLAMetricsSchema,
      required: true
    },
    agentPerformance: [AgentPerformanceSchema],
    totalActiveAgents: { type: Number, default: 0 },
    averageAgentUtilization: { type: Number, default: 0 },
    channelMetrics: [ChannelMetricsSchema],
    categoryBreakdown: [CategoryMetricsSchema],
    hourlyActivity: [ActivityMetricsSchema],
    peakHours: [{ type: Number, min: 0, max: 23 }],
    newCustomers: { type: Number, default: 0 },
    returningCustomers: { type: Number, default: 0 },
    customerRetentionRate: { type: Number, default: 0 },
    revenueImpact: { type: Number },
    costPerContact: { type: Number, default: 0 },
    firstContactResolution: { type: Number, default: 0 },
    escalationRate: { type: Number, default: 0 },
    transferRate: { type: Number, default: 0 },
    reopenRate: { type: Number, default: 0 },
    backlogTickets: { type: Number, default: 0 },
    newTicketsCreated: { type: Number, default: 0 },
    ticketVelocity: { type: Number, default: 0 },
    calculatedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
SupportMetricsSchema.index({ period: 1, dateStart: 1, dateEnd: 1 }, { unique: true });
SupportMetricsSchema.index({ calculatedAt: -1 });
SupportMetricsSchema.index({ 'agentPerformance.agentId': 1 });

// Static method to calculate metrics for a given period
SupportMetricsSchema.statics.calculateMetrics = async function(
  period: MetricPeriod,
  dateStart: Date,
  dateEnd: Date
) {
  const SupportTicket = mongoose.model('SupportTicket');
  const SupportChatRoom = mongoose.model('SupportChatRoom');
  const SupportChatMessage = mongoose.model('SupportChatMessage');
  const User = mongoose.model('User');

  // Basic ticket metrics
  const [totalTickets, resolvedTickets, totalChats] = await Promise.all([
    SupportTicket.countDocuments({
      createdAt: { $gte: dateStart, $lte: dateEnd }
    }),
    SupportTicket.countDocuments({
      createdAt: { $gte: dateStart, $lte: dateEnd },
      status: { $in: ['resolved', 'closed'] }
    }),
    SupportChatRoom.countDocuments({
      createdAt: { $gte: dateStart, $lte: dateEnd }
    })
  ]);

  // Calculate resolution rate
  const resolutionRate = totalTickets > 0 ? (resolvedTickets / totalTickets) * 100 : 0;

  // Calculate average response and resolution times
  const responseTimeAgg = await SupportTicket.aggregate([
    {
      $match: {
        createdAt: { $gte: dateStart, $lte: dateEnd },
        'sla.firstResponseDuration': { $exists: true }
      }
    },
    {
      $group: {
        _id: null,
        avgResponseTime: { $avg: '$sla.firstResponseDuration' },
        medianResponseTime: { $median: '$sla.firstResponseDuration' }
      }
    }
  ]);

  const resolutionTimeAgg = await SupportTicket.aggregate([
    {
      $match: {
        createdAt: { $gte: dateStart, $lte: dateEnd },
        'sla.resolutionDuration': { $exists: true }
      }
    },
    {
      $group: {
        _id: null,
        avgResolutionTime: { $avg: '$sla.resolutionDuration' },
        medianResolutionTime: { $median: '$sla.resolutionDuration' }
      }
    }
  ]);

  // Customer satisfaction metrics
  const satisfactionAgg = await SupportTicket.aggregate([
    {
      $match: {
        createdAt: { $gte: dateStart, $lte: dateEnd },
        'customerFeedback.rating': { $exists: true }
      }
    },
    {
      $group: {
        _id: '$customerFeedback.rating',
        count: { $sum: 1 }
      }
    }
  ]);

  const satisfactionBreakdown: ISatisfactionBreakdown = {
    veryUnsatisfied: 0,
    unsatisfied: 0,
    neutral: 0,
    satisfied: 0,
    verySatisfied: 0,
    totalRatings: 0,
    averageRating: 0
  };

  let totalRating = 0;
  satisfactionAgg.forEach(item => {
    const rating = item._id;
    const count = item.count;
    satisfactionBreakdown.totalRatings += count;
    totalRating += rating * count;
    
    switch (rating) {
      case 1: satisfactionBreakdown.veryUnsatisfied = count; break;
      case 2: satisfactionBreakdown.unsatisfied = count; break;
      case 3: satisfactionBreakdown.neutral = count; break;
      case 4: satisfactionBreakdown.satisfied = count; break;
      case 5: satisfactionBreakdown.verySatisfied = count; break;
    }
  });

  if (satisfactionBreakdown.totalRatings > 0) {
    satisfactionBreakdown.averageRating = totalRating / satisfactionBreakdown.totalRatings;
  }

  // Create or update metrics record
  const metrics = {
    period,
    dateStart,
    dateEnd,
    totalTickets,
    totalChats,
    totalContacts: totalTickets + totalChats,
    resolvedTickets,
    resolutionRate,
    averageFirstResponseTime: responseTimeAgg[0]?.avgResponseTime || 0,
    averageResolutionTime: resolutionTimeAgg[0]?.avgResolutionTime || 0,
    medianResponseTime: responseTimeAgg[0]?.medianResponseTime || 0,
    medianResolutionTime: resolutionTimeAgg[0]?.medianResolutionTime || 0,
    customerSatisfaction: satisfactionBreakdown,
    slaMetrics: {
      targetResponseTime: 60, // 1 hour default
      actualAverageResponseTime: responseTimeAgg[0]?.avgResponseTime || 0,
      responseTimeMet: 0, // Calculate based on SLA targets
      targetResolutionTime: 1440, // 24 hours default
      actualAverageResolutionTime: resolutionTimeAgg[0]?.avgResolutionTime || 0,
      resolutionTimeMet: 0, // Calculate based on SLA targets
      escalationsTotal: 0,
      escalationRate: 0
    },
    calculatedAt: new Date()
  };

  return await this.findOneAndUpdate(
    { period, dateStart, dateEnd },
    metrics,
    { upsert: true, new: true }
  );
};

// Method to get trending metrics comparison
SupportMetricsSchema.statics.getTrending = async function(
  currentPeriod: { start: Date; end: Date },
  previousPeriod: { start: Date; end: Date }
) {
  const [current, previous] = await Promise.all([
    this.findOne({
      dateStart: currentPeriod.start,
      dateEnd: currentPeriod.end
    }),
    this.findOne({
      dateStart: previousPeriod.start,
      dateEnd: previousPeriod.end
    })
  ]);

  if (!current || !previous) {
    return null;
  }

  return {
    current,
    previous,
    trends: {
      totalTickets: this.calculateTrend(current.totalTickets, previous.totalTickets),
      resolutionRate: this.calculateTrend(current.resolutionRate, previous.resolutionRate),
      averageResponseTime: this.calculateTrend(current.averageFirstResponseTime, previous.averageFirstResponseTime),
      customerSatisfaction: this.calculateTrend(
        current.customerSatisfaction.averageRating,
        previous.customerSatisfaction.averageRating
      )
    }
  };
};

// Helper method to calculate trend percentage
SupportMetricsSchema.statics.calculateTrend = function(current: number, previous: number) {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
};

const SupportMetrics = mongoose.models?.SupportMetrics || mongoose.model<ISupportMetrics>('SupportMetrics', SupportMetricsSchema);

export default SupportMetrics;