import mongoose, { Schema, Document, Types } from 'mongoose';

export enum AdEventType {
  IMPRESSION = 'IMPRESSION',
  CLICK = 'CLICK',
  CONVERSION = 'CONVERSION'
}

export interface IAdAnalytics extends Document {
  adId: Types.ObjectId;
  eventType: AdEventType;
  userId?: Types.ObjectId;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  referrer?: string;
  placement?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

const AdAnalyticsSchema = new Schema<IAdAnalytics>(
  {
    adId: {
      type: Schema.Types.ObjectId,
      ref: 'FeaturedProviderAd',
      required: true,
      index: true
    },
    eventType: {
      type: String,
      enum: Object.values(AdEventType),
      required: true,
      index: true
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },
    sessionId: {
      type: String,
      index: true
    },
    ipAddress: {
      type: String
    },
    userAgent: {
      type: String
    },
    referrer: {
      type: String
    },
    placement: {
      type: String
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true
    },
    metadata: {
      type: Schema.Types.Mixed
    }
  },
  {
    timestamps: false // We use timestamp field instead
  }
);

// Compound indexes for efficient querying
AdAnalyticsSchema.index({ adId: 1, timestamp: -1 });
AdAnalyticsSchema.index({ adId: 1, eventType: 1, timestamp: -1 });
AdAnalyticsSchema.index({ timestamp: -1 });

// Static method to get analytics summary
AdAnalyticsSchema.statics.getAdSummary = async function(
  adId: string, 
  startDate?: Date, 
  endDate?: Date
) {
  const match: any = { adId: new mongoose.Types.ObjectId(adId) };
  
  if (startDate || endDate) {
    match.timestamp = {};
    if (startDate) match.timestamp.$gte = startDate;
    if (endDate) match.timestamp.$lte = endDate;
  }
  
  const result = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$eventType',
        count: { $sum: 1 },
        uniqueUsers: { $addToSet: '$userId' },
        uniqueSessions: { $addToSet: '$sessionId' }
      }
    },
    {
      $project: {
        eventType: '$_id',
        count: 1,
        uniqueUserCount: { $size: '$uniqueUsers' },
        uniqueSessionCount: { $size: '$uniqueSessions' }
      }
    }
  ]);
  
  const summary = {
    impressions: 0,
    clicks: 0,
    conversions: 0,
    uniqueUsers: 0,
    uniqueSessions: 0,
    ctr: 0,
    conversionRate: 0
  };
  
  result.forEach(item => {
    switch (item.eventType) {
      case AdEventType.IMPRESSION:
        summary.impressions = item.count;
        summary.uniqueUsers = Math.max(summary.uniqueUsers, item.uniqueUserCount);
        summary.uniqueSessions = Math.max(summary.uniqueSessions, item.uniqueSessionCount);
        break;
      case AdEventType.CLICK:
        summary.clicks = item.count;
        break;
      case AdEventType.CONVERSION:
        summary.conversions = item.count;
        break;
    }
  });
  
  // Calculate rates
  if (summary.impressions > 0) {
    summary.ctr = (summary.clicks / summary.impressions) * 100;
    summary.conversionRate = (summary.conversions / summary.impressions) * 100;
  }
  
  return summary;
};

// Static method to get daily analytics
AdAnalyticsSchema.statics.getDailyAnalytics = async function(
  adId?: string,
  startDate: Date,
  endDate: Date
) {
  const match: any = {
    timestamp: { $gte: startDate, $lte: endDate }
  };
  
  if (adId) {
    match.adId = new mongoose.Types.ObjectId(adId);
  }
  
  const result = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
          eventType: '$eventType'
        },
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: '$_id.date',
        impressions: {
          $sum: {
            $cond: [{ $eq: ['$_id.eventType', AdEventType.IMPRESSION] }, '$count', 0]
          }
        },
        clicks: {
          $sum: {
            $cond: [{ $eq: ['$_id.eventType', AdEventType.CLICK] }, '$count', 0]
          }
        },
        conversions: {
          $sum: {
            $cond: [{ $eq: ['$_id.eventType', AdEventType.CONVERSION] }, '$count', 0]
          }
        }
      }
    },
    { $sort: { _id: 1 } }
  ]);
  
  return result.map(item => ({
    date: item._id,
    impressions: item.impressions,
    clicks: item.clicks,
    conversions: item.conversions,
    ctr: item.impressions > 0 ? (item.clicks / item.impressions) * 100 : 0
  }));
};

const AdAnalytics = mongoose.models.AdAnalytics || mongoose.model<IAdAnalytics>('AdAnalytics', AdAnalyticsSchema);

export default AdAnalytics;