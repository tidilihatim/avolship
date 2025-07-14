// src/lib/db/models/product.ts
import mongoose, { Document, Schema } from 'mongoose';


/**
 * Product status enum
 */
export enum ProductStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  OUT_OF_STOCK = 'out_of_stock',
}

/**
 * Warehouse inventory interface
 * Tracks stock across multiple warehouses
 */
export interface WarehouseInventory {
  warehouseId: mongoose.Types.ObjectId;
  stock: number;
}

/**
 * Cloudinary image interface
 * Stores both URL and public ID for easy management
 */
export interface CloudinaryImage {
  url: string;
  publicId: string;
}

/**
 * Product interface based on SRS requirements (Section 2.2)
 */
export interface IProduct extends Document {
  name: string;
  description: string;
  code: string; // Seller-generated unique code
  variantCode?: string;
  verificationLink?: string;
  warehouses: WarehouseInventory[]; // Multiple warehouses
  sellerId: mongoose.Types.ObjectId; // Link to seller user
  image?: CloudinaryImage; // Cloudinary image with public ID
  totalStock: number; // Calculated from warehouses
  status: ProductStatus;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mongoose schema for Product model
 * Implements requirements from section 2.2 (Product Management)
 */
const ProductSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'Product code is required'],
      trim: true,
      unique: true,
    },
    variantCode: {
      type: String,
      trim: true,
    },
    verificationLink: {
      type: String,
      trim: true,
    },
    warehouses: [
      {
        warehouseId: {
          type: Schema.Types.ObjectId,
          ref: 'Warehouse',
          required: [true, 'Warehouse ID is required'],
        },
        stock: {
          type: Number,
          default: 0,
          min: [0, 'Stock cannot be negative'],
        },
      },
    ],
    sellerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Seller is required'],
    },
    image: {
      url: {
        type: String,
        trim: true,
      },
      publicId: {
        type: String,
        trim: true,
      },
    },
    totalStock: {
      type: Number,
      default: 0,
      min: [0, 'Total stock cannot be negative'],
    },
    status: {
      type: String,
      enum: Object.values(ProductStatus),
      default: ProductStatus.ACTIVE,
    },
  },
  {
    timestamps: true, // Automatically add createdAt and updatedAt fields
  }
);

// Create unique compound index for product code and seller
ProductSchema.index({ code: 1, sellerId: 1 }, { unique: true });

// Additional performance indexes
ProductSchema.index({ sellerId: 1, status: 1 }); // Common query pattern
ProductSchema.index({ 'warehouses.warehouseId': 1 }); // For warehouse queries
ProductSchema.index({ status: 1, totalStock: 1 }); // For inventory queries
ProductSchema.index({ sellerId: 1, createdAt: -1 }); // For seller product lists
ProductSchema.index({ name: 'text', description: 'text', code: 'text' }); // Text search index

// Pre-save middleware to calculate total stock from warehouses
ProductSchema.pre('save', function (next) {
  // Calculate total stock across all warehouses
  if (this.warehouses && this.warehouses.length > 0) {
    this.totalStock = this.warehouses.reduce((total, warehouse) => total + warehouse.stock, 0);
  } else {
    this.totalStock = 0;
  }
  
  // Auto-update status to OUT_OF_STOCK if total stock is 0
  if (this.totalStock === 0 && this.status === ProductStatus.ACTIVE) {
    this.status = ProductStatus.OUT_OF_STOCK;
  }
  
  next();
});

// Create the model only if it doesn't already exist
const Product = mongoose.models?.Product || mongoose.model<IProduct>('Product', ProductSchema);

export default Product;