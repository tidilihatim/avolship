import mongoose, { Document, Schema } from 'mongoose';

/**
 * Individual delivery record interface
 */
export interface IDeliveryRecord {
  orderId: string;
  warehouseId: mongoose.Types.ObjectId;
  deliveryDate: Date;
  distance: number; // in kilometers
  deliveryFee: number;
  commission: number;
  deliveryNotes?: string;
}

/**
 * Delivery statistics interface
 */
export interface IDeliveryStats extends Document {
  deliveryGuyId: mongoose.Types.ObjectId;
  totalDeliveries: number;
  totalEarnings: number;
  totalDistance: number;
  deliveryHistory: IDeliveryRecord[];
  lastUpdated: Date;
  
  // Methods
  addDeliveryRecord: (deliveryRecord: IDeliveryRecord) => Promise<void>;
  getDeliveryHistory: (startDate?: Date, endDate?: Date) => IDeliveryRecord[];
  getTodayDeliveries: () => number;
  getTodayEarnings: () => number;
  getDeliveriesCount: (date?: Date) => number;
}

/**
 * Static methods interface
 */
export interface IDeliveryStatsModel extends mongoose.Model<IDeliveryStats> {
  getOrCreateStats: (deliveryGuyId: mongoose.Types.ObjectId) => Promise<IDeliveryStats>;
  getPaginatedDeliveryHistory: (
    deliveryGuyId: mongoose.Types.ObjectId,
    startDate?: Date,
    endDate?: Date,
    limit?: number,
    offset?: number
  ) => Promise<{
    deliveries: IDeliveryRecord[];
    total: number;
    hasMore: boolean;
  }>;
}

/**
 * Mongoose schema for DeliveryStats model
 */
const DeliveryStatsSchema = new Schema<IDeliveryStats>(
  {
    deliveryGuyId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // Each delivery guy has only one stats document
    },
    totalDeliveries: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalEarnings: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalDistance: {
      type: Number,
      default: 0,
      min: 0,
    },
    deliveryHistory: [{
      orderId: {
        type: String,
        required: true,
      },
      warehouseId: {
        type: Schema.Types.ObjectId,
        ref: 'Warehouse',
        required: true,
      },
      deliveryDate: {
        type: Date,
        required: true,
        default: Date.now,
      },
      distance: {
        type: Number,
        required: true,
        min: 0,
      },
      deliveryFee: {
        type: Number,
        required: true,
        min: 0,
      },
      commission: {
        type: Number,
        required: true,
        min: 0,
      },
      deliveryNotes: {
        type: String,
      },
    }],
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for better performance
DeliveryStatsSchema.index({ deliveryGuyId: 1 });
DeliveryStatsSchema.index({ 'deliveryHistory.deliveryDate': -1 });
DeliveryStatsSchema.index({ 'deliveryHistory.orderId': 1 });
DeliveryStatsSchema.index({ 'deliveryHistory.warehouseId': 1 });

/**
 * Add a delivery record to the delivery history
 * @param deliveryRecord - The delivery record to add
 */
DeliveryStatsSchema.methods.addDeliveryRecord = async function (deliveryRecord: IDeliveryRecord): Promise<void> {
  // Add to delivery history
  this.deliveryHistory.push(deliveryRecord);
  
  // Keep only last 1000 delivery records to prevent unlimited growth
  if (this.deliveryHistory.length > 1000) {
    this.deliveryHistory = this.deliveryHistory.slice(-1000);
  }
  
  // Update totals
  this.totalDeliveries += 1;
  this.totalEarnings += (deliveryRecord.deliveryFee + deliveryRecord.commission);
  this.totalDistance += deliveryRecord.distance;
  this.lastUpdated = new Date();
  
  await this.save();
};

/**
 * Get delivery history within a date range
 * @param startDate - Start date (optional)
 * @param endDate - End date (optional)
 * @returns Array of delivery records
 */
DeliveryStatsSchema.methods.getDeliveryHistory = function (
  startDate?: Date,
  endDate?: Date
): IDeliveryRecord[] {
  let history = this.deliveryHistory || [];
  
  if (startDate || endDate) {
    history = history.filter((record: IDeliveryRecord) => {
      const recordDate = new Date(record.deliveryDate);
      
      if (startDate && recordDate < startDate) return false;
      if (endDate && recordDate > endDate) return false;
      
      return true;
    });
  }
  
  return history.sort((a: IDeliveryRecord, b: IDeliveryRecord) => 
    new Date(b.deliveryDate).getTime() - new Date(a.deliveryDate).getTime()
  );
};

/**
 * Get today's delivery count
 * @returns Number of deliveries today
 */
DeliveryStatsSchema.methods.getTodayDeliveries = function (): number {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  
  return (this.deliveryHistory || []).filter((record: IDeliveryRecord) => {
    const recordDate = new Date(record.deliveryDate);
    return recordDate.toISOString().split('T')[0] === todayStr;
  }).length;
};

/**
 * Get today's total earnings (fees + commissions)
 * @returns Total earnings for today
 */
DeliveryStatsSchema.methods.getTodayEarnings = function (): number {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  
  return (this.deliveryHistory || [])
    .filter((record: IDeliveryRecord) => {
      const recordDate = new Date(record.deliveryDate);
      return recordDate.toISOString().split('T')[0] === todayStr;
    })
    .reduce((total: number, record: IDeliveryRecord) => {
      return total + record.deliveryFee + record.commission;
    }, 0);
};

/**
 * Get deliveries count for a specific date or today
 * @param date - Date to check (defaults to today)
 * @returns Number of deliveries for the date
 */
DeliveryStatsSchema.methods.getDeliveriesCount = function (date?: Date): number {
  const targetDate = date || new Date();
  const dateStr = targetDate.toISOString().split('T')[0];
  
  return (this.deliveryHistory || []).filter((record: IDeliveryRecord) => {
    const recordDate = new Date(record.deliveryDate);
    return recordDate.toISOString().split('T')[0] === dateStr;
  }).length;
};

/**
 * Static method to get or create delivery stats for a delivery guy
 * @param deliveryGuyId - ID of the delivery guy
 * @returns DeliveryStats document
 */
DeliveryStatsSchema.statics.getOrCreateStats = async function(deliveryGuyId: mongoose.Types.ObjectId) {
  let stats = await this.findOne({ deliveryGuyId });
  
  if (!stats) {
    stats = new this({
      deliveryGuyId,
      totalDeliveries: 0,
      totalEarnings: 0,
      totalDistance: 0,
      deliveryHistory: []
    });
    await stats.save();
  }
  
  return stats;
};

/**
 * Static method to get paginated delivery history using MongoDB aggregation
 * @param deliveryGuyId - ID of the delivery guy
 * @param startDate - Start date filter (optional)
 * @param endDate - End date filter (optional)
 * @param limit - Number of records to return (default: 20)
 * @param offset - Number of records to skip (default: 0)
 * @returns Paginated delivery history with total count
 */
DeliveryStatsSchema.statics.getPaginatedDeliveryHistory = async function(
  deliveryGuyId: mongoose.Types.ObjectId,
  startDate?: Date,
  endDate?: Date,
  limit: number = 20,
  offset: number = 0
) {
  const matchStage: any = { deliveryGuyId };
  
  // Build the date filter for deliveryHistory array elements
  const dateFilter: any = {};
  if (startDate) {
    dateFilter.$gte = startDate;
  }
  if (endDate) {
    dateFilter.$lte = endDate;
  }
  
  const pipeline: any[] = [
    { $match: matchStage },
    { $unwind: '$deliveryHistory' },
  ];
  
  // Add date filter if provided
  if (startDate || endDate) {
    pipeline.push({
      $match: {
        'deliveryHistory.deliveryDate': dateFilter
      }
    });
  }
  
  // Sort by delivery date (newest first)
  pipeline.push({
    $sort: { 'deliveryHistory.deliveryDate': -1 }
  });
  
  // Create two pipelines: one for count, one for data
  const countPipeline = [...pipeline, { $count: 'total' }];
  const dataPipeline = [
    ...pipeline,
    { $skip: offset },
    { $limit: limit },
    {
      $replaceRoot: { newRoot: '$deliveryHistory' }
    }
  ];
  
  // Execute both pipelines
  const [countResult, deliveries] = await Promise.all([
    this.aggregate(countPipeline),
    this.aggregate(dataPipeline)
  ]);
  
  const total = countResult[0]?.total || 0;
  const hasMore = offset + limit < total;
  
  return {
    deliveries: deliveries as IDeliveryRecord[],
    total,
    hasMore
  };
};

// Create the model
const DeliveryStats = (mongoose.models?.DeliveryStats || mongoose.model<IDeliveryStats, IDeliveryStatsModel>('DeliveryStats', DeliveryStatsSchema)) as IDeliveryStatsModel;

export default DeliveryStats;