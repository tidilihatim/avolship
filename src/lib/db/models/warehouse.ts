import mongoose, { Document, Schema } from 'mongoose';

/**
 * Warehouse interface based on requirements
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
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mongoose schema for Warehouse model
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
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true, // Automatically add createdAt and updatedAt fields
  }
);

// Create the model only if it doesn't already exist
const Warehouse = mongoose.models?.Warehouse || mongoose.model<IWarehouse>('Warehouse', WarehouseSchema);

export default Warehouse;