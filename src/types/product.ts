// src/types/product.ts
import { PaginationData } from './user';
import { CloudinaryImage, ProductStatus, WarehouseInventory } from '@/lib/db/models/product';
import mongoose from 'mongoose';

/**
 * Warehouse data for display
 */
export interface WarehouseData {
  warehouseId: string;
  warehouseName: string;
  stock: number;
  country?: string;
}

/**
 * Product data interface for table display
 */
export interface ProductTableData {
  _id: string;
  name: string;
  code: string;
  variantCode?: string;
  description: string;
  warehouses: WarehouseData[];
  verificationLink: string;
  primaryWarehouseId?: string;
  primaryWarehouseName?: string;
  sellerId: string;
  sellerName?: string;
  image?: {
    url: string;
    publicId: string;
  };
  price?: number;
  totalStock: number;
  status: ProductStatus;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Product input interface for create/update operations
 */
export interface ProductInput {
  name: string;
  description: string;
  code: string;
  variantCode?: string;
  verificationLink?: string;
  warehouses: {
    warehouseId: string;
    stock: number;
  }[];
  sellerId?: string; // Optional as it can be set from session for sellers
  image?: {
    url: string;
    publicId: string;
  };
  price?: number;
  status?: ProductStatus;
}

/**
 * Product filters interface
 */
export interface ProductFilters {
  search?: string;
  status?: ProductStatus;
  warehouseId?: string;
  sellerId?: string;
  minStock?: number;
  maxStock?: number;
  page?: number;
  limit?: number;
}

/**
 * Server response for product operations
 */
export interface ProductResponse {
  success: boolean;
  message?: string;
  product?: ProductTableData;
  products?: ProductTableData[];
  pagination?: PaginationData;
  errors?: Record<string, string>;
}