import mongoose, { Document, Schema, Types } from 'mongoose';

/**
 * Warehouse interface based on requirements
 * Now includes seller assignment functionality
 */
export interface IWarehouse extends Document {
  name: string;
  country: string;
  city?: string;
  currency: string;
  address?: string;
  capacity?: number;
  capacityUnit?: string;
  currencyConversion?: {
    enabled: boolean;
    targetCurrency: string;
    rate: number;
    autoUpdate: boolean;
    lastUpdated?: Date;
  };
  // New fields for seller assignment
  isAvailableToAll: boolean; // If true, all sellers can use this warehouse
  assignedSellers: Types.ObjectId[]; // Specific sellers who can use this warehouse
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mongoose schema for Warehouse model
 * Updated to include seller assignment capabilities
 */
const WarehouseSchema = new Schema<IWarehouse>(
  {
    name: {
      type: String,
      required: [true, 'Warehouse name is required'],
      trim: true,
    },
    country: {
      type: String,
      required: [true, 'Country is required'],
      trim: true,
    },
    city: {
      type: String,
      trim: true,
    },
    currency: {
      type: String,
      required: [true, 'Currency is required'],
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    capacity: {
      type: Number,
      min: [0, 'Capacity cannot be negative'],
    },
    capacityUnit: {
      type: String,
      default: 'items',
      trim: true,
    },
    currencyConversion: {
      enabled: {
        type: Boolean,
        default: false,
      },
      targetCurrency: {
        type: String,
        default: 'USD',
      },
      rate: {
        type: Number,
        default: 1,
      },
      autoUpdate: {
        type: Boolean,
        default: false,
      },
      lastUpdated: {
        type: Date,
      },
    },
    // New fields for seller assignment
    isAvailableToAll: {
      type: Boolean,
      default: false,
      index: true, // Add index for better query performance
    },
    assignedSellers: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
      validate: {
        validator: async function(sellerId: Types.ObjectId) {
          // Ensure the referenced user exists and is a seller
          const User = mongoose.model('User');
          const user = await User.findById(sellerId);
          return user && user.role === 'seller';
        },
        message: 'Assigned user must be a valid seller',
      },
    }],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true, // Automatically add createdAt and updatedAt fields
  }
);

// Compound index for efficient queries when finding warehouses for a specific seller
WarehouseSchema.index({ isAvailableToAll: 1, assignedSellers: 1, isActive: 1 });

// Virtual field to get assigned sellers with their details (useful for population)
WarehouseSchema.virtual('sellerDetails', {
  ref: 'User',
  localField: 'assignedSellers',
  foreignField: '_id',
  justOne: false,
});

// Enable virtual fields in JSON responses
WarehouseSchema.set('toJSON', {
  virtuals: true,
});

// Create the model only if it doesn't already exist
const Warehouse = mongoose.models?.Warehouse || mongoose.model<IWarehouse>('Warehouse', WarehouseSchema);

export default Warehouse;