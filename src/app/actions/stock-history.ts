// src/app/actions/stock-history.ts
'use server';

import { revalidatePath } from 'next/cache';
import mongoose from 'mongoose';
import StockHistory, { StockMovementType, StockMovementReason } from '@/lib/db/models/stock-history';
import {connectToDatabase as connectDB} from '@/lib/db/mongoose'
import Product from '@/lib/db/models/product';
import User, { UserRole } from '@/lib/db/models/user';
import { getCurrentUser } from './auth';
import { 
  StockHistoryResponse, 
  StockHistoryFilters, 
  StockHistoryTableData,
  StockSummaryData,
  CreateStockMovementData,
  StockAnalytics
} from '@/types/stock-history';

/**
 * Get stock history for a specific product
 */
export async function getStockHistory(
  productId: string,
  page: number = 1,
  limit: number = 10,
  filters: StockHistoryFilters = {}
): Promise<StockHistoryResponse> {
  try {
    await connectDB();

    // Get current user and check permissions
    const user = await getCurrentUser();
    if (!user) {
      return {
        success: false,
        message: 'Unauthorized',
      };
    }

    // Verify product exists and user has access
    const product = await Product.findById(productId);
    if (!product) {
      return {
        success: false,
        message: 'Product not found',
      };
    }

    // Check if user has access to this product
    if (user.role === UserRole.SELLER && product.sellerId.toString() !== user._id.toString()) {
      return {
        success: false,
        message: 'Access denied',
      };
    }

    // Build query based on filters
    const query: Record<string, any> = {
      productId: new mongoose.Types.ObjectId(productId),
    };

    // Apply warehouse filter if provided
    if (filters.warehouseId) {
      query.warehouseId = new mongoose.Types.ObjectId(filters.warehouseId);
    }

    // Apply movement type filter
    if (filters.movementType) {
      query.movementType = filters.movementType;
    }

    // Apply reason filter
    if (filters.reason) {
      query.reason = filters.reason;
    }

    // Apply user filter (admin/moderator only)
    if (filters.userId && (user.role === UserRole.ADMIN || user.role === UserRole.MODERATOR)) {
      query.userId = new mongoose.Types.ObjectId(filters.userId);
    }

    // Apply date range filters
    if (filters.dateFrom || filters.dateTo) {
      query.createdAt = {};
      if (filters.dateFrom) {
        query.createdAt.$gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        query.createdAt.$lte = new Date(filters.dateTo);
      }
    }

    // Apply search filter
    if (filters.search) {
      const searchRegex = new RegExp(filters.search, 'i');
      query.$or = [
        { notes: searchRegex },
        { 'metadata.batchNumber': searchRegex },
        { 'metadata.supplier': searchRegex },
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute query with pagination
    const stockHistoryData = await StockHistory.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Count total results for pagination
    const total = await StockHistory.countDocuments(query);

    // Get unique IDs for population
    const warehouseIds = [...new Set(stockHistoryData.map(h => h.warehouseId))];
    const userIds = [...new Set(stockHistoryData.map(h => h.userId))];
    const orderIds = stockHistoryData.filter(h => h.orderId).map(h => h.orderId);

    // Fetch related data in parallel
    const [warehouses, users, orders] = await Promise.all([
      mongoose.model('Warehouse').find({ _id: { $in: warehouseIds } }).lean(),
      User.find({ _id: { $in: userIds } }).lean(),
      orderIds.length > 0 
        ? mongoose.model('Order').find({ _id: { $in: orderIds } }).lean()
        : []
    ]);

    // Create lookup maps
    const warehouseMap = new Map(warehouses.map((w: any) => [w._id.toString(), w]));
    const userMap = new Map(users.map((u:any) => [u._id?.toString(), u]));
    const orderMap = new Map(orders.map((o: any) => [o._id.toString(), o]));

    // Transform data for table display
    const stockHistory: StockHistoryTableData[] = stockHistoryData.map(history => {
      const warehouse = warehouseMap.get(history.warehouseId.toString());
      const historyUser = userMap.get(history.userId.toString());
      const order = history.orderId ? orderMap.get(history.orderId.toString()) : null;

      // Create StockHistory instance to use methods
      const stockHistoryDoc = new StockHistory(history);

      return {
        _id: history._id.toString(),
        productId: history.productId.toString(),
        productName: product.name,
        productCode: product.code,
        warehouseId: history.warehouseId.toString(),
        warehouseName: warehouse?.name || 'Unknown Warehouse',
        warehouseCountry: warehouse?.country,
        movementType: history.movementType,
        reason: history.reason,
        reasonDescription: stockHistoryDoc.getMovementDescription(),
        quantity: history.quantity,
        previousStock: history.previousStock,
        newStock: history.newStock,
        stockDifference: stockHistoryDoc.getStockDifference(),
        orderId: history.orderId?.toString(),
        orderCode: order?.code,
        transferId: history.transferId?.toString(),
        userId: history.userId.toString(),
        userName: historyUser?.name || 'Unknown User',
        userRole: historyUser?.role || 'unknown',
        notes: history.notes,
        metadata: history.metadata,
        createdAt: history.createdAt,
        updatedAt: history.updatedAt,
      };
    });

    // Calculate pagination data
    const totalPages = Math.ceil(total / limit);

    return {
      success: true,
      stockHistory,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  } catch (error: any) {
    console.error('Error fetching stock history:', error);
    return {
      success: false,
      message: error.message || 'Failed to fetch stock history',
    };
  }
}

/**
 * Get stock summary for a product
 */
export async function getStockSummary(productId: string): Promise<{
  success: boolean;
  message?: string;
  summary?: StockSummaryData;
}> {
  try {
    await connectDB();

    const user = await getCurrentUser();
    if (!user) {
      return { success: false, message: 'Unauthorized' };
    }

    // Verify product access
    const product = await Product.findById(productId);
    if (!product) {
      return { success: false, message: 'Product not found' };
    }

    if (user.role === UserRole.SELLER && product.sellerId.toString() !== user._id.toString()) {
      return { success: false, message: 'Access denied' };
    }

    // Aggregate stock movements
    const movements = await StockHistory.aggregate([
      { $match: { productId: new mongoose.Types.ObjectId(productId) } },
      {
        $group: {
          _id: null,
          totalMovements: { $sum: 1 },
          totalIncreases: {
            $sum: { $cond: [{ $eq: ['$movementType', 'increase'] }, 1, 0] }
          },
          totalDecreases: {
            $sum: { $cond: [{ $eq: ['$movementType', 'decrease'] }, 1, 0] }
          },
          lastMovementDate: { $max: '$createdAt' },
          lastRestockDate: {
            $max: {
              $cond: [
                { $eq: ['$reason', 'restock'] },
                '$createdAt',
                null
              ]
            }
          }
        }
      }
    ]);

    // Get warehouse breakdown
    const warehouseBreakdown = await StockHistory.aggregate([
      { $match: { productId: new mongoose.Types.ObjectId(productId) } },
      {
        $group: {
          _id: '$warehouseId',
          totalMovements: { $sum: 1 },
          lastMovementDate: { $max: '$createdAt' }
        }
      },
      {
        $lookup: {
          from: 'warehouses',
          localField: '_id',
          foreignField: '_id',
          as: 'warehouse'
        }
      }
    ]);

    const summary: StockSummaryData = {
      totalMovements: movements[0]?.totalMovements || 0,
      totalIncreases: movements[0]?.totalIncreases || 0,
      totalDecreases: movements[0]?.totalDecreases || 0,
      currentStock: product.totalStock,
      lastMovementDate: movements[0]?.lastMovementDate,
      lastRestockDate: movements[0]?.lastRestockDate,
      warehouseBreakdown: warehouseBreakdown.map(wb => ({
        warehouseId: wb._id.toString(),
        warehouseName: wb.warehouse[0]?.name || 'Unknown',
        currentStock: product.warehouses.find((w: any) => 
          w.warehouseId.toString() === wb._id.toString()
        )?.stock || 0,
        totalMovements: wb.totalMovements,
        lastMovementDate: wb.lastMovementDate,
      })),
    };

    return { success: true, summary };
  } catch (error: any) {
    console.error('Error fetching stock summary:', error);
    return { success: false, message: error.message };
  }
}

/**
 * Create a new stock movement (for manual adjustments)
 */
export async function createStockMovement(data: CreateStockMovementData): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    await connectDB();

    const user = await getCurrentUser();
    if (!user) {
      return { success: false, message: 'Unauthorized' };
    }

    // Get product and verify access
    const product = await Product.findById(data.productId);
    if (!product) {
      return { success: false, message: 'Product not found' };
    }

    if (user.role === UserRole.SELLER && product.sellerId.toString() !== user._id.toString()) {
      return { success: false, message: 'Access denied' };
    }

    // Find the warehouse in the product
    const warehouseIndex = product.warehouses.findIndex(
      (w: any) => w.warehouseId.toString() === data.warehouseId
    );

    if (warehouseIndex === -1) {
      return { success: false, message: 'Warehouse not found for this product' };
    }

    const previousStock = product.warehouses[warehouseIndex].stock;
    const newStock = data.movementType === StockMovementType.INCREASE 
      ? previousStock + data.quantity
      : previousStock - data.quantity;

    if (newStock < 0) {
      return { success: false, message: 'Insufficient stock for this operation' };
    }

    // Update product stock
    product.warehouses[warehouseIndex].stock = newStock;
    product.warehouses[warehouseIndex].lastUpdated = new Date();
    await product.save();

    // Record stock history
    await StockHistory.recordMovement(
      new mongoose.Types.ObjectId(data.productId),
      new mongoose.Types.ObjectId(data.warehouseId),
      data.movementType,
      data.reason,
      data.quantity,
      previousStock,
      newStock,
      user._id,
      {
        notes: data.notes,
        metadata: data.metadata,
      }
    );

    revalidatePath('/dashboard/seller/products');
    revalidatePath(`/dashboard/seller/products/stock-history/${data.productId}`);

    return { success: true, message: 'Stock movement recorded successfully' };
  } catch (error: any) {
    console.error('Error creating stock movement:', error);
    return { success: false, message: error.message || 'Failed to record stock movement' };
  }
}

/**
 * Get all warehouses for filters
 */
export async function getWarehousesForProduct(productId: string): Promise<{
  _id: string;
  name: string;
  country: string;
}[]> {
  try {
    await connectDB();

    const product = await Product.findById(productId).populate('warehouses.warehouseId');
    if (!product) return [];

    return product.warehouses.map((w: any) => ({
      _id: w.warehouseId._id.toString(),
      name: w.warehouseId.name,
      country: w.warehouseId.country,
    }));
  } catch (error) {
    console.error('Error fetching warehouses:', error);
    return [];
  }
}

/**
 * Get all users who have made stock movements (for admin filters)
 */
export async function getUsersForStockHistory(productId: string): Promise<{
  _id: string;
  name: string;
  role: string;
}[]> {
  try {
    await connectDB();

    const user = await getCurrentUser();
    if (!user || (user.role !== UserRole.ADMIN && user.role !== UserRole.MODERATOR)) {
      return [];
    }

    const userIds = await StockHistory.distinct('userId', {
      productId: new mongoose.Types.ObjectId(productId)
    });

    const users = await User.find({ _id: { $in: userIds } }).lean();

    return users.map((u:any) => ({
      _id: u._id.toString(),
      name: u.name,
      role: u.role,
    }));
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
}