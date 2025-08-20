import mongoose, { Document, Schema, Model } from 'mongoose';

export interface DeliveryFeeRule {
  warehouseId: mongoose.Types.ObjectId;
  minDistance: number; // in km
  maxDistance: number; // in km
  fee: number; // delivery fee in warehouse currency
}

export interface CommissionRule {
  warehouseId: mongoose.Types.ObjectId;
  minDeliveries: number;
  commission: number; // commission amount in warehouse currency
}

export interface ShowLocationTracking {
  seller: boolean;
  call_center: boolean;
}

export interface IAppSettings extends Document {
  // Delivery Configuration
  deliveryFeeRules: DeliveryFeeRule[];
  commissionRules: CommissionRule[];
  
  // Delivery System Settings
  autoAssignDelivery: boolean; // Auto-assign orders to nearest delivery guy
  maxOrdersPerDeliveryGuy: number; // Maximum orders a delivery guy can have at once
  
  // Real-time Tracking Settings
  showLocationTracking: ShowLocationTracking;
  
  // Commission & Fee Settings
  enableCommissionSystem: boolean;
  enableDeliveryFees: boolean;
  defaultDeliveryFee: number; // Fallback delivery fee
  
  // Token System Settings
  enableTokenSystem: boolean; // Enable/disable token boost system
  
  // Admin Controls
  isActive: boolean;
  lastUpdatedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAppSettingsModel extends Model<IAppSettings> {
  getActiveSettings(): Promise<IAppSettings>;
  calculateDeliveryFee(distanceKm: number, warehouseId: mongoose.Types.ObjectId): Promise<number>;
  calculateCommission(deliveriesCount: number, warehouseId: mongoose.Types.ObjectId): Promise<number>;
}

const AppSettingsSchema = new Schema<IAppSettings>(
  {
    deliveryFeeRules: [{
      warehouseId: {
        type: Schema.Types.ObjectId,
        ref: 'Warehouse',
        required: true,
      },
      minDistance: {
        type: Number,
        required: true,
        min: 0,
      },
      maxDistance: {
        type: Number,
        required: true,
        min: 0,
      },
      fee: {
        type: Number,
        required: true,
        min: 0,
      },
    }],
    
    commissionRules: [{
      warehouseId: {
        type: Schema.Types.ObjectId,
        ref: 'Warehouse',
        required: true,
      },
      minDeliveries: {
        type: Number,
        required: true,
        min: 0,
      },
      commission: {
        type: Number,
        required: true,
        min: 0,
      },
    }],
    
    autoAssignDelivery: {
      type: Boolean,
      default: false,
    },
    
    maxOrdersPerDeliveryGuy: {
      type: Number,
      default: 10,
      min: 1,
    },
    
    showLocationTracking: {
      seller: {
        type: Boolean,
        default: true,
      },
      call_center: {
        type: Boolean,
        default: true,
      },
    },
    
    enableCommissionSystem: {
      type: Boolean,
      default: true,
    },
    
    enableDeliveryFees: {
      type: Boolean,
      default: true,
    },
    
    defaultDeliveryFee: {
      type: Number,
      default: 10000, // 10000 francs
      min: 0,
    },
    
    enableTokenSystem: {
      type: Boolean,
      default: false,
    },
    
    isActive: {
      type: Boolean,
      default: true,
    },
    
    lastUpdatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure there's only one settings document
AppSettingsSchema.index({ isActive: 1 }, { unique: true, partialFilterExpression: { isActive: true } });

// Compound indexes for better performance when querying rules by warehouse
AppSettingsSchema.index({ 'deliveryFeeRules.warehouseId': 1, isActive: 1 });
AppSettingsSchema.index({ 'commissionRules.warehouseId': 1, isActive: 1 });

// Static method to get active settings
AppSettingsSchema.statics.getActiveSettings = async function() {
  let settings = await this.findOne({ isActive: true });
  
  // Create default settings if none exist
  if (!settings) {
    // Get first warehouse to use as default, or create empty arrays if no warehouses
    const Warehouse = mongoose.model('Warehouse');
    const firstWarehouse = await Warehouse.findOne({ isActive: true });
    
    const defaultWarehouseId = firstWarehouse?._id || new mongoose.Types.ObjectId();
    
    settings = new this({
      deliveryFeeRules: firstWarehouse ? [
        { warehouseId: defaultWarehouseId, minDistance: 1, maxDistance: 2, fee: 10000 },
        { warehouseId: defaultWarehouseId, minDistance: 2, maxDistance: 4, fee: 15000 },
        { warehouseId: defaultWarehouseId, minDistance: 5, maxDistance: 8, fee: 20000 },
        { warehouseId: defaultWarehouseId, minDistance: 8, maxDistance: 15, fee: 25000 },
      ] : [],
      commissionRules: firstWarehouse ? [
        { warehouseId: defaultWarehouseId, minDeliveries: 5, commission: 10000 },
        { warehouseId: defaultWarehouseId, minDeliveries: 8, commission: 15000 },
        { warehouseId: defaultWarehouseId, minDeliveries: 12, commission: 20000 },
      ] : [],
      isActive: true,
      lastUpdatedBy: new mongoose.Types.ObjectId(), // Will be updated when admin saves
    });
    await settings.save();
  }
  
  return settings;
};

// Static method to calculate delivery fee based on distance and warehouse
AppSettingsSchema.statics.calculateDeliveryFee = async function(distanceKm: number, warehouseId: mongoose.Types.ObjectId) {
  const settings = await (this as any).getActiveSettings();

  if(!settings.enableDeliveryFees){
    return 0;
  }
  
  // Find rules for the specific warehouse
  const warehouseRules = settings.deliveryFeeRules.filter(
    (rule: DeliveryFeeRule) => rule.warehouseId.toString() === warehouseId.toString()
  );
  
  for (const rule of warehouseRules) {
    if (distanceKm >= rule.minDistance && distanceKm <= rule.maxDistance) {
      return rule.fee;
    }
  }
  
  return settings.defaultDeliveryFee;
};

// Static method to calculate commission based on deliveries count and warehouse
AppSettingsSchema.statics.calculateCommission = async function(deliveriesCount: number, warehouseId: mongoose.Types.ObjectId) {
  const settings = await (this as any).getActiveSettings();
  
  if (!settings.enableCommissionSystem) {
    return 0;
  }
  
  // Find rules for the specific warehouse
  const warehouseRules = settings.commissionRules.filter(
    (rule: CommissionRule) => rule.warehouseId.toString() === warehouseId.toString()
  );
  
  let totalCommission = 0;
  
  for (const rule of warehouseRules.sort((a: CommissionRule, b: CommissionRule) => a.minDeliveries - b.minDeliveries)) {
    if (deliveriesCount >= rule.minDeliveries) {
      totalCommission = rule.commission;
    }
  }
  
  return totalCommission;
};

const AppSettings = (mongoose.models?.AppSettings || mongoose.model<IAppSettings, IAppSettingsModel>('AppSettings', AppSettingsSchema)) as IAppSettingsModel;

export default AppSettings;