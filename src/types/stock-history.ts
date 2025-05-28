// src/types/stock-history.ts
import { StockMovementType, StockMovementReason } from '@/lib/db/models/stock-history';
import { PaginationData } from './user';

/**
 * Stock History Table Data Interface
 * Used for displaying stock history in tables
 */
export interface StockHistoryTableData {
  _id: string;
  productId: string;
  productName: string;
  productCode: string;
  warehouseId: string;
  warehouseName: string;
  warehouseCountry?: string;
  movementType: StockMovementType;
  reason: StockMovementReason;
  reasonDescription: string;
  quantity: number;
  previousStock: number;
  newStock: number;
  stockDifference: number;
  orderId?: string;
  orderCode?: string;
  transferId?: string;
  userId: string;
  userName: string;
  userRole: string;
  notes?: string;
  metadata?: {
    batchNumber?: string;
    expiryDate?: Date;
    supplier?: string;
    cost?: number;
    [key: string]: any;
  };
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Stock History Filters Interface
 */
export interface StockHistoryFilters {
  search?: string;
  warehouseId?: string;
  movementType?: StockMovementType;
  reason?: StockMovementReason;
  userId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  limit?: number;
}

/**
 * Stock History Response Interface
 */
export interface StockHistoryResponse {
  success: boolean;
  message?: string;
  stockHistory?: StockHistoryTableData[];
  pagination?: PaginationData;
}

/**
 * Stock Summary Interface
 */
export interface StockSummaryData {
  totalMovements: number;
  totalIncreases: number;
  totalDecreases: number;
  currentStock: number;
  lastMovementDate?: Date;
  lastRestockDate?: Date;
  warehouseBreakdown: {
    warehouseId: string;
    warehouseName: string;
    currentStock: number;
    totalMovements: number;
    lastMovementDate?: Date;
  }[];
}

/**
 * Create Stock Movement Interface
 */
export interface CreateStockMovementData {
  productId: string;
  warehouseId: string;
  movementType: StockMovementType;
  reason: StockMovementReason;
  quantity: number;
  notes?: string;
  metadata?: {
    batchNumber?: string;
    expiryDate?: Date;
    supplier?: string;
    cost?: number;
    [key: string]: any;
  };
}

/**
 * Stock Analytics Interface
 */
export interface StockAnalytics {
  dailyMovements: {
    date: string;
    increases: number;
    decreases: number;
    netChange: number;
  }[];
  reasonBreakdown: {
    reason: StockMovementReason;
    reasonDescription: string;
    count: number;
    totalQuantity: number;
  }[];
  warehouseAnalytics: {
    warehouseId: string;
    warehouseName: string;
    totalMovements: number;
    netChange: number;
    averageStock: number;
  }[];
}