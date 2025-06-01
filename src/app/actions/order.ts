// src/app/actions/order.ts
"use server";

import mongoose from 'mongoose';
import { cookies } from 'next/headers';
import { UserRole } from '@/lib/db/models/user';
import { OrderStatus } from '@/lib/db/models/order';
import Order from '@/lib/db/models/order';
import Warehouse from '@/lib/db/models/warehouse';
import User from '@/lib/db/models/user';
import Product from '@/lib/db/models/product';
import { OrderFilters, OrderResponse, OrderTableData } from '@/types/order';
import { withDbConnection } from '@/lib/db/db-connect';
import { getCurrentUser } from './auth';
import OrderStatusHistory from '@/lib/db/models/order-status-history';

// Add this function to src/app/actions/order.ts

/**
 * Get order by ID with full details
 */
/**
 * Get order by ID with full details
 */
export const getOrderById = withDbConnection(async (orderId: string) => {
  try {
    // Get the current user
    const user = await getCurrentUser();
    if (!user) {
      return {
        success: false,
        message: 'Unauthorized',
      };
    }

    // Build query based on user role
    const query: Record<string, any> = { _id: orderId };

    // If user is a seller, only allow access to their orders
    if (user.role === UserRole.SELLER) {
      query.sellerId = user._id;
    }

    // Find the order
    const order: any = await Order.findOne(query).lean();

    if (!order) {
      return {
        success: false,
        message: 'Order not found',
      };
    }

    // Get related data including status history
    const [warehouse, seller, products, statusChangedByUser, statusHistory] = await Promise.all([
      Warehouse.findById(order.warehouseId, { name: 1, country: 1, currency: 1 }).lean() as any,
      User.findById(order.sellerId, { name: 1, email: 1, businessName: 1 }).lean() as any,
      Product.find(
        { _id: { $in: order.products.map((p: any) => p.productId) } },
        { name: 1, code: 1 }
      ).lean() as any,
      order.statusChangedBy 
        ? User.findById(order.statusChangedBy, { name: 1, role: 1 }).lean()
        : null as any,
      // Import OrderStatusHistory model if not already imported
      OrderStatusHistory.find({ orderId: order._id }).populate('changedBy', 'name role').sort({ changeDate: 1 }).lean() as any,
      [] // Temporary empty array until OrderStatusHistory is properly imported
    ]);

    // Create product map
    const productMap = new Map();
    products.forEach((p:any) => {
      productMap.set(p._id.toString(), p);
    });

    // Enhance order with related data
    const enhancedOrder = {
      ...order,
      _id: order._id.toString(),
      warehouseName: warehouse?.name || 'Unknown Warehouse',
      warehouseCountry: warehouse?.country || 'Unknown',
      warehouseCurrency: warehouse?.currency || 'USD',
      sellerName: seller?.name || 'Unknown Seller',
      sellerInfo: seller ? {
        name: seller.name,
        email: seller.email,
        businessName: seller.businessName,
      } : null,
      products: order.products.map((product: any) => {
        const productData = productMap.get(product.productId.toString());
        return {
          ...product,
          productId: product.productId.toString(),
          productName: productData?.name || 'Unknown Product',
          productCode: productData?.code || 'Unknown Code',
          expeditionId: product.expeditionId?.toString(),
        };
      }),
      statusChangedBy: statusChangedByUser ? {
        _id: statusChangedByUser._id.toString(),
        name: statusChangedByUser.name,
        role: statusChangedByUser.role,
      } : null,
      callAttempts: order.callAttempts || [],
      doubleOrderReferences: order.doubleOrderReferences || [],
      statusHistory: statusHistory || [], // Add status history to the response
    };

    return {
      success: true,
      order: JSON.parse(JSON.stringify(enhancedOrder)),
    };
  } catch (error: any) {
    console.error('Error fetching order:', error);
    return {
      success: false,
      message: error.message || 'Failed to fetch order',
    };
  }
});

/**
 * Get all warehouses for filter dropdown
 */
export const getAllWarehouses = withDbConnection(async () => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return [];
    }

    let query: Record<string, any> = { isActive: true };

    // If user is seller, only get warehouses they have access to
    if (user.role === UserRole.SELLER) {
      query = {
        ...query,
        $or: [
          { isAvailableToAll: true },
          { assignedSellers: user._id }
        ]
      };
    }

    const warehouses = await Warehouse.find(query, {
      name: 1,
      country: 1,
      currency: 1
    }).lean();

    return warehouses.map((warehouse: any) => ({
      _id: warehouse._id.toString(),
      name: warehouse.name,
      country: warehouse.country,
      currency: warehouse.currency
    }));
  } catch (error) {
    console.error('Error fetching warehouses:', error);
    return [];
  }
});

/**
 * Get all sellers for filter dropdown (Admin/Moderator only)
 */
export const getAllSellers = withDbConnection(async () => {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== UserRole.ADMIN && user.role !== UserRole.MODERATOR)) {
      return [];
    }

    const sellers = await User.find(
      { 
        role: UserRole.SELLER,
        status: 'approved'
      },
      {
        name: 1,
        email: 1
      }
    ).lean();

    return sellers.map((seller: any) => ({
      _id: seller._id.toString(),
      name: seller.name,
      email: seller.email
    }));
  } catch (error) {
    console.error('Error fetching sellers:', error);
    return [];
  }
});

/**
 * Get orders with filtering and pagination
 */
export const getOrders = withDbConnection(async (
  page: number = 1,
  limit: number = 10,
  filters: OrderFilters = {}
): Promise<OrderResponse> => {
  try {
    // Get the current user
    const user = await getCurrentUser();
    if (!user) {
      return {
        success: false,
        message: 'Unauthorized',
      };
    }

    // Build query based on filters
    const query: Record<string, any> = {};

    // If user is a seller, only show their orders
    if (user.role === UserRole.SELLER) {
      query.sellerId = user._id;
    } else if (filters.sellerId) {
      query.sellerId = new mongoose.Types.ObjectId(filters.sellerId);
    }

    // Apply warehouse filter if provided
    const cookiesStore = await cookies();
    const selectedWarehouseId = cookiesStore.get('selectedWarehouse')?.value;

    if (filters.warehouseId) {
      query.warehouseId = new mongoose.Types.ObjectId(filters.warehouseId);
    } else if (selectedWarehouseId && user.role === UserRole.SELLER) {
      query.warehouseId = new mongoose.Types.ObjectId(selectedWarehouseId);
    }

    // Apply status filter if provided
    if (filters.status) {
      query.status = filters.status;
    }

    // Apply call status filter if provided
    if (filters.callStatus) {
      query.lastCallStatus = filters.callStatus;
    }

    // Apply double orders filter
    if (filters.showDoubleOnly) {
      query.isDouble = true;
    }

    // Apply date range filter if provided
    if (filters.dateFrom || filters.dateTo) {
      query.orderDate = {};
      
      if (filters.dateFrom) {
        query.orderDate.$gte = new Date(filters.dateFrom);
      }
      
      if (filters.dateTo) {
        const toDate = new Date(filters.dateTo);
        toDate.setHours(23, 59, 59, 999); // End of day
        query.orderDate.$lte = toDate;
      }
    }

    // Apply search filter if provided
    if (filters.search) {
      const searchRegex = new RegExp(filters.search, 'i');
      query.$or = [
        { orderId: searchRegex },
        { 'customer.name': searchRegex },
        { 'customer.phoneNumbers': searchRegex },
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Execute query with pagination
    const orders: any[] = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    
    // Count total results for pagination
    const total = await Order.countDocuments(query);
    
    // Get unique warehouseIds, sellerIds, and productIds for populating names
    const warehouseIds = [...new Set(orders.map(o => o.warehouseId))];
    const sellerIds = [...new Set(orders.map(o => o.sellerId))];
    const productIds = orders.flatMap(o => o.products.map((p: any) => p.productId));
    const statusChangedByIds = orders
      .map(o => o.statusChangedBy)
      .filter(Boolean)
      .filter((id, index, arr) => arr.indexOf(id) === index);
    
    // Fetch related data in parallel
    const [warehouses, sellers, products, statusChangedByUsers] = await Promise.all([
      Warehouse.find({ _id: { $in: warehouseIds } }).lean(),
      User.find({ _id: { $in: sellerIds } }).lean(),
      Product.find({ _id: { $in: productIds } }, { name: 1, code: 1 }).lean(),
      User.find({ _id: { $in: statusChangedByIds } }, { name: 1, role: 1 }).lean()
    ]);
    
    // Create lookup maps for efficient access
    const warehouseMap = new Map();
    warehouses.forEach((w:any) => {
      warehouseMap.set(w._id.toString(), w);
    });
    
    const sellerMap = new Map();
    sellers.forEach((s:any) => {
      sellerMap.set(s._id.toString(), s);
    });
    
    const productMap = new Map();
    products.forEach((p:any) => {
      productMap.set(p._id.toString(), p);
    });
    
    const statusChangedByMap = new Map();
    statusChangedByUsers.forEach((u:any) => {
      statusChangedByMap.set(u._id.toString(), u);
    });
    
    // Map orders to include warehouse, seller, and product names
    const ordersWithNames: OrderTableData[] = [];
    
    for (const order of orders) {
      const warehouseId = order.warehouseId.toString();
      const sellerId = order.sellerId.toString();
      
      // Get warehouse data
      const warehouseData = warehouseMap.get(warehouseId);
      
      // Get seller data
      const sellerData = sellerMap.get(sellerId);
      
      // Get status changed by user data
      const statusChangedByData = order.statusChangedBy 
        ? statusChangedByMap.get(order.statusChangedBy.toString())
        : null;
      
      // Map products with names
      const productsWithNames = order.products.map((product: any) => {
        const productData = productMap.get(product.productId.toString());
        return {
          productId: product.productId.toString(),
          productName: productData?.name || 'Unknown Product',
          productCode: productData?.code || 'Unknown Code',
          quantity: product.quantity,
          unitPrice: product.unitPrice,
        };
      });
      
      // Get last call status
      const lastCallStatus = order.callAttempts && order.callAttempts.length > 0
        ? order.callAttempts[order.callAttempts.length - 1].status
        : undefined;
      
      ordersWithNames.push({
        _id: order._id.toString(),
        orderId: order.orderId,
        customer: order.customer,
        warehouseId,
        warehouseName: warehouseData?.name || 'Unknown Warehouse',
        warehouseCountry: warehouseData?.country || 'Unknown',
        warehouseCurrency: warehouseData?.currency || 'USD',
        sellerId,
        sellerName: sellerData?.name || 'Unknown Seller',
        products: productsWithNames,
        totalPrice: order.totalPrice,
        status: order.status,
        statusComment: order.statusComment,
        statusChangedBy: statusChangedByData ? {
          _id: statusChangedByData._id.toString(),
          name: statusChangedByData.name,
          role: statusChangedByData.role,
        } : undefined,
        statusChangedAt: order.statusChangedAt,
        callAttempts: order.callAttempts || [],
        totalCallAttempts: order.totalCallAttempts || 0,
        lastCallAttempt: order.lastCallAttempt,
        lastCallStatus,
        isDouble: order.isDouble || false,
        doubleOrderReferences: order.doubleOrderReferences || [],
        orderDate: order.orderDate,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      });
    }
    
    // Calculate pagination data
    const totalPages = Math.ceil(total / limit);
    
    return {
      success: true,
      orders: JSON.parse(JSON.stringify(ordersWithNames)),
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  } catch (error: any) {
    console.error('Error fetching orders:', error);
    return {
      success: false,
      message: error.message || 'Failed to fetch orders',
    };
  }
});