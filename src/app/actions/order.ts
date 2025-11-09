// src/app/actions/order.ts
"use server";

import mongoose, { Mongoose } from 'mongoose';
import { cookies } from 'next/headers';
import { UserRole, UserStatus } from '@/lib/db/models/user';
import { OrderStatus } from '@/lib/db/models/order';
import Order from '@/lib/db/models/order';
import Warehouse from '@/lib/db/models/warehouse';
import User from '@/lib/db/models/user';
import Product from '@/lib/db/models/product';
import { OrderFilters, OrderInput, OrderResponse, OrderTableData } from '@/types/order';
import { withDbConnection } from '@/lib/db/db-connect';
import { getCurrentUser } from './auth';
import OrderStatusHistory from '@/lib/db/models/order-status-history';
import { ProductOption } from '@/types/expedition-form';
import Expedition from '@/lib/db/models/expedition';
import { ExpeditionStatus } from '../dashboard/_constant/expedition';
import { revalidatePath } from 'next/cache';
import { checkDuplicatesForNewOrder } from '@/lib/duplicate-detection/duplicate-checker';
import DuplicateDetectionSettings from '@/lib/db/models/duplicate-settings';
import { ApplyDiscountRequest, DiscountResponse } from '@/types/discount';
import { getAccessToken } from './cookie';
import { createStockMovement } from './stock-history';
import { StockMovementReason, StockMovementType } from '@/lib/db/models/stock-history';

// Add this function to src/app/actions/order.ts

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
    products.forEach((p: any) => {
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
      callCenterCommission: order.callCenterCommission,
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
 * Get orders by rider ID with role-based filtering
 */
export const getOrdersByRiderId = withDbConnection(async (
  riderId: string,
  statusFilter?: string[]
) => {
  try {
    // Get the current user
    const user = await getCurrentUser();
    if (!user) {
      return {
        success: false,
        message: 'Unauthorized',
        orders: []
      };
    }

    // Build query based on user role
    const allowedStatuses = statusFilter?.length
      ? statusFilter
      : ['assigned_to_delivery', 'accepted_by_delivery', 'delivered'];

    const query: Record<string, any> = {
      'deliveryTracking.deliveryGuyId': riderId,
      status: { $in: allowedStatuses }
    };

    // If user is a seller, only show their orders
    if (user.role === UserRole.SELLER) {
      query.sellerId = user._id;
    }

    // Find orders with basic details needed for tracking
    const orders = await Order.find(query)
      .select({
        _id: 1,
        orderId: 1,
        status: 1,
        totalPrice: 1,
        'customer.name': 1,
        'customer.shippingAddress': 1,
        'customer.location': 1,
        'deliveryTracking.deliveryGuyId': 1,
        'deliveryTracking.currentLocation': 1
      })
      .lean();

    // Transform orders to match the tracking map format
    const transformedOrders = orders.map((order: any) => ({
      _id: order._id.toString(),
      orderId: order.orderId,
      customer: {
        name: order.customer.name,
        address: order.customer.shippingAddress,
        coordinates: order.customer.location ? {
          latitude: order.customer.location.latitude,
          longitude: order.customer.location.longitude
        } : undefined
      },
      status: order.status,
      totalAmount: order.totalPrice
    }));

    return {
      success: true,
      orders: transformedOrders
    };
  } catch (error: any) {
    console.error('Error fetching orders by rider ID:', error);
    return {
      success: false,
      message: error.message || 'Failed to fetch orders',
      orders: []
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

    // Apply phase filter if provided (overrides status filter)
    if (filters.phase) {
      if (filters.phase === 'confirmation') {
        // Confirmation phase statuses - order confirmation and customer contact phase
        query.status = {
          $in: [
            OrderStatus.PENDING,
            OrderStatus.CONFIRMED,
            OrderStatus.CANCELLED,
            OrderStatus.BUSY,
            OrderStatus.UNREACHABLE,
            OrderStatus.UNREACHED,
            OrderStatus.NO_ANSWER,
            OrderStatus.ASKING_FOR_DISCOUNT,
            OrderStatus.NOT_READY,
            OrderStatus.MISTAKEN_ORDER,
            OrderStatus.OUT_OF_DELIVERY_ZONE,
            OrderStatus.WRONG_NUMBER,
            OrderStatus.DOUBLE,
            OrderStatus.EXPIRED
          ]
        };
      } else if (filters.phase === 'shipping') {
        // Shipping phase statuses - order fulfillment and delivery phase
        query.status = {
          $in: [
            OrderStatus.IN_PREPARATION,
            OrderStatus.AWAITING_DISPATCH,
            OrderStatus.SHIPPED,
            OrderStatus.ASSIGNED_TO_DELIVERY,
            OrderStatus.ACCEPTED_BY_DELIVERY,
            OrderStatus.IN_TRANSIT,
            OrderStatus.OUT_FOR_DELIVERY,
            OrderStatus.DELIVERED,
            OrderStatus.PAID,
            OrderStatus.DELIVERY_FAILED,
            OrderStatus.CANCELLED_AT_DELIVERY,
            OrderStatus.RETURN_IN_PROGRESS,
            OrderStatus.RETURNED,
            OrderStatus.PROCESSED,
            OrderStatus.REFUND_IN_PROGRESS,
            OrderStatus.REFUNDED,
            OrderStatus.ALREADY_RECEIVED
          ]
        };
      }
    }

    // Apply call status filter if provided
    if (filters.callStatus) {
      if (user.role === UserRole.CALL_CENTER) {
        // Enhanced call status filtering for call center agents
        if (filters.callStatus === 'answered') {
          query.status = 'confirmed';
        } else if (filters.callStatus === 'unreached') {
          query.status = 'unreached';
        } else if (filters.callStatus === 'busy') {
          query['callAttempts.status'] = 'busy';
        } else if (filters.callStatus === 'invalid') {
          query.status = 'wrong_number';
        }
      } else {
        // Standard call status filtering for other roles
        query.lastCallStatus = filters.callStatus;
      }
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

    // For call center agents: show only their assigned orders
    if (user.role === UserRole.CALL_CENTER) {
      query.assignedAgent = user._id

      // Clean up expired locks first
      await Order.updateMany(
        { lockExpiry: { $lte: new Date() } },
        {
          $unset: {
            lockedBy: 1,
            lockedAt: 1,
            lockExpiry: 1
          }
        }
      );
    }

    // Execute query with pagination
    const orders: any[] = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Count total results for pagination
    const total = await Order.countDocuments(query);

    // Get unique warehouseIds, sellerIds, productIds, assignedAgentIds, and assignedRiderIds for populating names
    const warehouseIds = [...new Set(orders.map(o => o.warehouseId))];
    const sellerIds = [...new Set(orders.map(o => o.sellerId))];
    const productIds = orders.flatMap(o => o.products.map((p: any) => p.productId));
    const statusChangedByIds = orders
      .map(o => o.statusChangedBy)
      .filter(Boolean)
      .filter((id, index, arr) => arr.indexOf(id) === index);
    const assignedAgentIds = orders
      .map(o => o.assignedAgent)
      .filter(Boolean)
      .filter((id, index, arr) => arr.indexOf(id) === index);
    const assignedRiderIds = orders
      .map(o => o.deliveryTracking?.deliveryGuyId)
      .filter(Boolean)
      .filter((id, index, arr) => arr.indexOf(id) === index);

    // Fetch related data in parallel
    const [warehouses, sellers, products, statusChangedByUsers, assignedAgents, assignedRiders] = await Promise.all([
      Warehouse.find({ _id: { $in: warehouseIds } }).lean(),
      User.find({ _id: { $in: sellerIds } }).lean(),
      Product.find({ _id: { $in: productIds } }, { name: 1, code: 1 }).lean(),
      User.find({ _id: { $in: statusChangedByIds } }, { name: 1, role: 1 }).lean(),
      User.find({ _id: { $in: assignedAgentIds } }, { name: 1, email: 1 }).lean(),
      User.find({ _id: { $in: assignedRiderIds } }, { name: 1, email: 1 }).lean()
    ]);

    // Create lookup maps for efficient access
    const warehouseMap = new Map();
    warehouses.forEach((w: any) => {
      warehouseMap.set(w._id.toString(), w);
    });

    const sellerMap = new Map();
    sellers.forEach((s: any) => {
      sellerMap.set(s._id.toString(), s);
    });

    const productMap = new Map();
    products.forEach((p: any) => {
      productMap.set(p._id.toString(), p);
    });

    const statusChangedByMap = new Map();
    statusChangedByUsers.forEach((u: any) => {
      statusChangedByMap.set(u._id.toString(), u);
    });

    const assignedAgentMap = new Map();
    assignedAgents.forEach((agent: any) => {
      assignedAgentMap.set(agent._id.toString(), agent);
    });

    const assignedRiderMap = new Map();
    assignedRiders.forEach((rider: any) => {
      assignedRiderMap.set(rider._id.toString(), rider);
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

      // Get assigned agent data
      const assignedAgentData = order.assignedAgent
        ? assignedAgentMap.get(order.assignedAgent.toString())
        : null;

      // Get assigned rider data
      const assignedRiderData = order.deliveryTracking?.deliveryGuyId
        ? assignedRiderMap.get(order.deliveryTracking.deliveryGuyId.toString())
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
        assignedAgent: assignedAgentData?.name,
        deliveryTracking: order?.deliveryTracking,
        isDeliveryRequired: order.isDeliveryRequired || false,
        assignedRider: assignedRiderData ? {
          name: assignedRiderData.name,
          email: assignedRiderData.email,
        } : undefined,
        // Include call center commission tracking
        callCenterCommission: order.callCenterCommission,
        // Include discount tracking fields
        priceAdjustments: order.priceAdjustments || [],
        finalTotalPrice: order.finalTotalPrice,
        totalDiscountAmount: order.totalDiscountAmount || 0,
        // Include lock information for call center agents
        ...(user.role === UserRole.CALL_CENTER && {
          lockedBy: order.lockedBy ? assignedAgentMap.get(order.lockedBy.toString())?.name : undefined,
          lockExpiry: order.lockExpiry,
        }),
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

/**
 * Get warehouses available to the current user
 * For sellers: only warehouses they are assigned to or available to all
 * For admins: all warehouses
 */
export const getWarehousesForOrder = withDbConnection(async () => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, message: "Unauthorized", warehouses: [] };
    }

    let warehouses;

    if (user.role === UserRole.ADMIN) {
      // Admin can see all warehouses
      warehouses = await Warehouse.find({ isActive: true })
        .select('name country currency')
        .sort({ country: 1, name: 1 })
        .lean();
    } else {
      // Sellers can only see warehouses they are assigned to or available to all
      warehouses = await Warehouse.find({
        isActive: true,
        $or: [
          { isAvailableToAll: true },
          { assignedSellers: new mongoose.Types.ObjectId(user._id) }
        ]
      })
        .select('name country currency')
        .sort({ country: 1, name: 1 })
        .lean();
    }

    return {
      success: true,
      warehouses: warehouses.map((warehouse: any) => ({
        _id: warehouse._id.toString(),
        name: warehouse.name,
        country: warehouse.country,
        currency: warehouse.currency,
      }))
    };
  } catch (error: any) {
    console.error("Error fetching warehouses for order:", error);
    return { success: false, message: error.message || "Failed to fetch warehouses", warehouses: [] };
  }
});

/**
 * Get products available in a specific warehouse with their expedition pricing
 */
export const getProductsForOrder = withDbConnection(async (warehouseId: string) => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error("Unauthorized");
    }

    // Validate warehouse access for sellers
    if (user.role !== UserRole.ADMIN) {
      const warehouse = await Warehouse.findOne({
        _id: warehouseId,
        isActive: true,
        $or: [
          { isAvailableToAll: true },
          { assignedSellers: new mongoose.Types.ObjectId(user._id) }
        ]
      });

      if (!warehouse) {
        throw new Error("Warehouse not accessible");
      }
    }

    // Get products in the warehouse
    const products = await Product.find({
      'warehouses.warehouseId': warehouseId,
      sellerId: user?.role === UserRole.SELLER ? user._id : null,
      status: { $ne: 'inactive' }
    })
      .select('name code description price warehouses status')
      .populate('sellerId', 'name')
      .lean();

    // For each product, get available expeditions with pricing
    const productsWithExpeditions: ProductOption[] = await Promise.all(
      products.map(async (product: any) => {
        // Get warehouse-specific stock
        const warehouseStock = product.warehouses.find(
          (w: any) => w.warehouseId.toString() === warehouseId
        );
        const totalStock = warehouseStock?.stock || 0;

        // Get expeditions for this product and warehouse
        const expeditions = await Expedition.find({
          warehouseId: warehouseId,
          'products.productId': product._id,
          status: ExpeditionStatus.DELIVERED,
        })
          .select('expeditionCode transportMode expeditionDate products status')
          .sort({ expeditionDate: -1 })
          .lean();

        const availableExpeditions = expeditions.map((expedition: any) => {
          const productInExpedition = expedition.products.find(
            (p: any) => p.productId.toString() === product._id?.toString()
          );

          return {
            _id: expedition._id.toString(),
            expeditionCode: expedition.expeditionCode,
            unitPrice: productInExpedition?.unitPrice || 0,
            status: expedition.status,
            expeditionDate: expedition.expeditionDate,
            transportMode: expedition.transportMode,
          };
        });

        return {
          _id: product._id.toString(),
          name: product.name,
          code: product.code,
          description: product.description,
          price: product.price || 0,
          totalStock,
          availableExpeditions,
        };
      })
    );

    return productsWithExpeditions;
  } catch (error: any) {
    console.error("Error fetching products for order:", error);
    throw new Error(error.message || "Failed to fetch products");
  }
});



/**
 * Create a new order
 */
export const createOrder = withDbConnection(async (orderData: any) => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return {
        success: false,
        message: "Unauthorized",
      };
    }

    // Validate warehouse access for sellers
    if (user.role !== UserRole.ADMIN) {
      const warehouse = await Warehouse.findOne({
        _id: orderData.warehouseId,
        isActive: true,
        $or: [
          { isAvailableToAll: true },
          { assignedSellers: new mongoose.Types.ObjectId(user._id) }
        ]
      });

      if (!warehouse) {
        return {
          success: false,
          message: "Warehouse not accessible",
        };
      }
    }

    // Validate products and expeditions
    const productIds = orderData.products.map((p: any) => p.productId);
    const expeditionIds = orderData.products.map((p: any) => p.expeditionId);

    // Check if all products exist and have stock
    const products = await Product.find({
      _id: { $in: productIds },
      'warehouses.warehouseId': orderData.warehouseId,
    }).lean();

    if (products.length !== productIds.length) {
      return {
        success: false,
        message: "One or more products not found in the selected warehouse",
      };
    }

    // Check if all expeditions exist and are approved
    const expeditions = await Expedition.find({
      _id: { $in: expeditionIds },
      warehouseId: orderData.warehouseId,
      status: ExpeditionStatus.DELIVERED,
    }).lean();

    if (expeditions.length !== expeditionIds.length) {
      return {
        success: false,
        message: "One or more expeditions not found or not approved",
      };
    }

    // Validate expedition pricing matches
    const expeditionMap = new Map();
    expeditions.forEach((exp: any) => {
      expeditionMap.set(exp._id.toString(), exp);
    });

    for (const orderProduct of orderData.products) {
      const expedition = expeditionMap.get(orderProduct.expeditionId);
      const expeditionProduct = expedition.products.find(
        (p: any) => p.productId.toString() === orderProduct.productId
      );

      if (!expeditionProduct) {
        return {
          success: false,
          message: `Product ${orderProduct.productId} not found in expedition ${expedition.expeditionCode}`,
        };
      }

      if (expeditionProduct.unitPrice !== orderProduct.unitPrice) {
        return {
          success: false,
          message: `Price mismatch for product ${orderProduct.productId}. Expected: ${expeditionProduct.unitPrice}, Got: ${orderProduct.unitPrice}`,
        };
      }
    }

    // Parse phone numbers from string (separated by |)
    const phoneNumbers = typeof orderData.customer.phoneNumbers === 'string'
      ? orderData.customer.phoneNumbers.split('|').map((p: string) => p.trim()).filter(Boolean)
      : orderData.customer.phoneNumbers;

    // Detect potential double orders using rule-based detection
    const duplicateDetectionResult = await checkDuplicatesForNewOrder({
      customer: {
        name: orderData.customer.name,
        phoneNumbers,
        shippingAddress: orderData.customer.shippingAddress,
      },
      products: orderData.products.map((p: any) => ({
        productId: p.productId,
        quantity: p.quantity,
        unitPrice: p.unitPrice,
      })),
      totalPrice: orderData.products.reduce(
        (total: number, product: any) => total + (product.unitPrice * product.quantity),
        0
      ),
      warehouseId: orderData.warehouseId,
      sellerId: user._id,
    });

    // Get warehouse and seller information
    const [warehouse, seller] = await Promise.all([
      Warehouse.findById(orderData.warehouseId).select('name').lean(),
      User.findById(user._id).select('name').lean(),
    ]);

    // Prepare order products with enhanced data
    const orderProducts = await Promise.all(
      orderData.products.map(async (orderProduct: any) => {
        const product = products.find((p: any) => p._id.toString() === orderProduct.productId);
        return {
          productId: orderProduct.productId,
          quantity: orderProduct.quantity,
          unitPrice: orderProduct.unitPrice,
          expeditionId: orderProduct.expeditionId,
        };
      })
    );

    // Calculate total price before creating the order
    const totalPrice = orderProducts.reduce(
      (total, product) => total + (product.unitPrice * product.quantity),
      0
    );

    // Create the order with totalPrice included

    const REALTIME_SERVER_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

    const jwtToken = await getAccessToken();
    if (!jwtToken) {
      throw new Error("Configuration Error")
    }

    const orderPayload = {
      customer: {
        name: orderData.customer.name,
        phoneNumbers,
        shippingAddress: orderData.customer.shippingAddress,
      },
      warehouseId: orderData.warehouseId,
      sellerId: user._id,
      products: orderProducts,
      totalPrice, // Add the calculated total price here
      status: duplicateDetectionResult?.isDuplicate ? OrderStatus.DOUBLE : OrderStatus.PENDING,
      statusChangedAt: new Date(),
      isDouble: duplicateDetectionResult.isDuplicate,
      doubleOrderReferences: duplicateDetectionResult.duplicateOrders.map(duplicate => ({
        orderId: duplicate.orderId,
        orderNumber: duplicate.orderNumber,
        matchedRule: duplicate.matchedRule,
        detectedAt: new Date(),
      })),
      orderDate: new Date(),
    }

    const response = await fetch(`${REALTIME_SERVER_URL}/api/orders/add`, {
      method: 'POST',
      headers: {
        "authorization": `Bearer ${jwtToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderPayload)
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || 'Real-time server failed to create order');
    }

    revalidatePath("/dashboard/seller/orders");
    revalidatePath("/dashboard/admin/orders");

    return {
      success: true,
      message: "Order created successfully",
      orderId: result?.orderId,
      isDouble: duplicateDetectionResult.isDuplicate,
      doubleOrderCount: duplicateDetectionResult.duplicateOrders.length,
    };
  } catch (error: any) {
    console.error("Error creating order:", error);
    return {
      success: false,
      message: error.message || "Failed to create order",
    };
  }
});

/**
 * Create multiple orders in bulk
 */
export const createBulkOrder = withDbConnection(async (ordersData: any[], warehouseId: string) => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return {
        success: false,
        message: "Unauthorized",
        results: []
      };
    }

    // Validate warehouse access for sellers
    if (user.role !== UserRole.ADMIN) {
      const warehouse = await Warehouse.findOne({
        _id: warehouseId,
        isActive: true,
        $or: [
          { isAvailableToAll: true },
          { assignedSellers: new mongoose.Types.ObjectId(user._id) }
        ]
      });

      if (!warehouse) {
        return {
          success: false,
          message: "Warehouse not accessible",
          results: []
        };
      }
    }

    const results: any[] = [];
    const validOrderPayloads: any[] = [];
    let errorCount = 0;

    // First pass: Process and validate all orders, collect valid payloads
    for (const orderData of ordersData) {
      try {
        // Get the first available expedition for each product
        const orderProducts = [];
        let hasError = false;
        let errorMessage = '';

        for (const product of orderData.products) {
          // Find the product and its expeditions
          const productDoc = await Product.findOne({
            code: product.id,
            'warehouses.warehouseId': warehouseId,
          }).lean() as any;

          if (!productDoc) {
            hasError = true;
            errorMessage = `Product ${product.id} not found in selected warehouse`;
            break;
          }

          // Find approved expeditions for this product
          const expeditions = await Expedition.find({
            warehouseId: warehouseId,
            'products.productId': productDoc._id,
            status: ExpeditionStatus.APPROVED,
          }).lean();

          if (!expeditions || expeditions.length === 0) {
            hasError = true;
            errorMessage = `Product ${product.id} has no approved expeditions`;
            break;
          }

          // Use the first available expedition
          const expedition = expeditions[0] as any;
          const expeditionProduct = expedition.products.find(
            (p: any) => p.productId.toString() === productDoc._id.toString()
          );

          if (!expeditionProduct) {
            hasError = true;
            errorMessage = `Product ${product.id} not found in expedition products`;
            break;
          }

          orderProducts.push({
            productId: (productDoc._id as any).toString(),
            quantity: product.quantity,
            unitPrice: expeditionProduct.unitPrice,
            expeditionId: (expedition._id as any).toString(),
          });
        }

        if (hasError) {
          results.push({
            orderId: orderData.orderId,
            success: false,
            message: errorMessage
          });
          errorCount++;
          continue;
        }

        // Parse phone numbers
        const phoneNumbers = typeof orderData.customer.phone === 'string'
          ? orderData.customer.phone.split('|').map((p: string) => p.trim()).filter(Boolean)
          : [orderData.customer.phone];

        // Calculate total price
        const totalPrice = orderProducts.reduce(
          (total, product) => total + (product.unitPrice * product.quantity),
          0
        );

        // Detect potential double orders
        const duplicateDetectionResult = await checkDuplicatesForNewOrder({
          customer: {
            name: orderData.customer.name,
            phoneNumbers,
            shippingAddress: orderData.customer.address,
          },
          products: orderProducts.map((p: any) => ({
            productId: p.productId,
            quantity: p.quantity,
            unitPrice: p.unitPrice,
          })),
          totalPrice,
          warehouseId,
          sellerId: user._id,
        });

        // Prepare order payload
        const orderPayload = {
          originalOrderId: orderData.orderId, // Keep track of original ID for results
          customer: {
            name: orderData.customer.name,
            phoneNumbers,
            shippingAddress: orderData.customer.address,
          },
          warehouseId: warehouseId,
          sellerId: user._id,
          products: orderProducts,
          totalPrice,
          status: duplicateDetectionResult?.isDuplicate ? OrderStatus.DOUBLE : OrderStatus.PENDING,
          statusChangedAt: new Date(),
          isDouble: duplicateDetectionResult.isDuplicate,
          doubleOrderReferences: duplicateDetectionResult.duplicateOrders.map(duplicate => ({
            orderId: duplicate.orderId,
            orderNumber: duplicate.orderNumber,
            matchedRule: duplicate.matchedRule,
            detectedAt: new Date(),
          })),
          orderDate: new Date(orderData.date),
          duplicateInfo: {
            isDuplicate: duplicateDetectionResult.isDuplicate,
            duplicateCount: duplicateDetectionResult.duplicateOrders.length
          }
        };

        validOrderPayloads.push(orderPayload);

      } catch (error: any) {
        console.error(`Error processing order ${orderData.orderId}:`, error);
        results.push({
          orderId: orderData.orderId,
          success: false,
          message: error.message || "Failed to process order"
        });
        errorCount++;
      }
    }

    let successCount = 0;

    // Second pass: Make single API call for all valid orders
    if (validOrderPayloads.length > 0) {
      try {

        const jwtToken = await getAccessToken();
        if (!jwtToken) {
          throw new Error("Configuration Error")
        }

        const REALTIME_SERVER_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';


        // Make single bulk API call
        const response = await fetch(`${REALTIME_SERVER_URL}/api/orders/add-bulk`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            "authorization": `Bearer ${jwtToken}`,
          },
          body: JSON.stringify({ orders: validOrderPayloads })
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const bulkResult = await response.json();

        if (!bulkResult.success) {
          throw new Error(bulkResult.message || 'Real-time server failed to create bulk orders');
        }

        // Process bulk results based on your controller response structure
        if (bulkResult.data && bulkResult.data.orders && Array.isArray(bulkResult.data.orders)) {
          successCount = bulkResult.data.successfulOrders || bulkResult.data.orders.length;
          const failedOrdersFromAPI = bulkResult.data.failedOrders || 0;

          // Map successful orders
          bulkResult.data.orders.forEach((createdOrder: any, index: number) => {
            const originalPayload = validOrderPayloads[index];
            results.push({
              orderId: originalPayload?.originalOrderId || `order-${index + 1}`,
              success: true,
              message: "Order created successfully",
              newOrderId: createdOrder.orderId || createdOrder.orderNumber,
              isDouble: originalPayload?.duplicateInfo?.isDuplicate || false,
              doubleOrderCount: originalPayload?.duplicateInfo?.duplicateCount || 0,
            });
          });

          // Handle any failed orders reported by the API
          if (failedOrdersFromAPI > 0) {
            const failedStartIndex = bulkResult.data.orders.length;
            for (let i = 0; i < failedOrdersFromAPI; i++) {
              const failedPayload = validOrderPayloads[failedStartIndex + i];
              if (failedPayload) {
                results.push({
                  orderId: failedPayload.originalOrderId,
                  success: false,
                  message: "Failed to create order during bulk processing"
                });
                errorCount++;
              }
            }
          }

        } else {
          // Fallback if bulk result doesn't have expected structure
          successCount = validOrderPayloads.length;
          validOrderPayloads.forEach(payload => {
            results.push({
              orderId: payload.originalOrderId,
              success: true,
              message: "Order created successfully",
              isDouble: payload.duplicateInfo.isDuplicate,
              doubleOrderCount: payload.duplicateInfo.duplicateCount,
            });
          });
        }

      } catch (error: any) {
        console.error("Error in bulk API call:", error);
        // Mark all valid orders as failed
        validOrderPayloads.forEach(payload => {
          results.push({
            orderId: payload.originalOrderId,
            success: false,
            message: error.message || "Failed to create order in bulk API call"
          });
          errorCount++;
        });
      }
    }

    revalidatePath("/dashboard/seller/orders");
    revalidatePath("/dashboard/admin/orders");

    return {
      success: true,
      message: `Bulk import completed: ${successCount} successful, ${errorCount} failed`,
      results,
      successCount,
      errorCount,
      totalCount: ordersData.length
    };

  } catch (error: any) {
    console.error("Error in bulk order creation:", error);
    return {
      success: false,
      message: error.message || "Failed to create bulk orders",
      results: []
    };
  }
});

/**
 * Get order by ID with full details
 */
export const getOrderByIdAdd = withDbConnection(async (orderId: string) => {
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

    // Get related data
    const [warehouse, seller, products, statusChangedByUser] = await Promise.all([
      Warehouse.findById(order.warehouseId, { name: 1, country: 1, currency: 1 }).lean() as any,
      User.findById(order.sellerId, { name: 1, email: 1, businessName: 1 }).lean() as any,
      Product.find(
        { _id: { $in: order.products.map((p: any) => p.productId) } },
        { name: 1, code: 1 }
      ).lean() as any,
      order.statusChangedBy
        ? User.findById(order.statusChangedBy, { name: 1, role: 1 }).lean()
        : null as any,
    ]);

    // Create product map
    const productMap = new Map();
    products.forEach((p: any) => {
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
 * Update order status (Admin/Moderator/Call Center only)
 */
export const updateOrderStatus = withDbConnection(async (
  orderId: string,
  newStatus: OrderStatus,
  comment?: string,
  discountData?: {
    discounts: Array<{
      productId: string;
      originalPrice: number;
      newPrice: number;
      discountAmount: number;
      reason: string;
      notes?: string;
    }>;
    totalDiscount: number;
    finalTotal: number;
  },
  shouldUpdateStock: boolean = true
) => {
  try {
    // Get the current user
    const user = await getCurrentUser();
    if (!user) {
      return {
        success: false,
        message: 'Unauthorized',
      };
    }

    // Check if user has permission to update status
    if (user.role !== UserRole.ADMIN && user.role !== UserRole.MODERATOR && user.role !== UserRole.CALL_CENTER) {
      return {
        success: false,
        message: 'Only admins, moderators, and call center agents can update order status',
      };
    }

    // Find the order
    const order = await Order.findById(orderId);
    if (!order) {
      return {
        success: false,
        message: 'Order not found',
      };
    }

    // Store previous status for status history
    const previousStatus = order.status;

    // Process discount data if provided
    if (discountData && discountData.discounts.length > 0) {
      let totalDiscountAmount = 0;
      const priceAdjustments = [];

      // Process discount data for each product
      for (const discount of discountData.discounts) {
        const orderProduct = order.products.find(
          (p: any) => p.productId.toString() === discount.productId
        );

        if (!orderProduct) {
          return {
            success: false,
            message: `Product ${discount.productId} not found in order`,
          };
        }

        // Validate discount
        if (discount.newPrice < 0 || discount.newPrice >= discount.originalPrice) {
          return {
            success: false,
            message: 'Invalid discount amount',
          };
        }

        const discountAmount = discount.originalPrice - discount.newPrice;
        const discountPercentage = (discountAmount / discount.originalPrice) * 100;

        // Update product price
        orderProduct.unitPrice = discount.newPrice;

        // Create price adjustment record
        priceAdjustments.push({
          productId: discount.productId,
          originalPrice: discount.originalPrice,
          adjustedPrice: discount.newPrice,
          discountAmount: discountAmount,
          discountPercentage: discountPercentage,
          reason: discount.reason,
          appliedBy: user._id,
          appliedAt: new Date(),
          notes: discount.notes || '',
        });

        totalDiscountAmount += discountAmount * orderProduct.quantity;
      }

      // Update order with discount information
      order.priceAdjustments = [...(order.priceAdjustments || []), ...priceAdjustments];
      order.totalDiscountAmount = (order.totalDiscountAmount || 0) + totalDiscountAmount;
      order.finalTotalPrice = discountData.finalTotal;
      order.totalPrice = discountData.finalTotal;
    }

    // Update order status
    order.status = newStatus;
    order.statusComment = comment || '';
    order.statusChangedBy = user._id;
    order.statusChangedAt = new Date();

    await order.save();

    // Create status history entry
    let statusComment = comment || '';
    if (discountData && discountData.discounts.length > 0) {
      const discountSummary = `Applied discounts: ${discountData.totalDiscount.toFixed(2)} total discount. ${statusComment}`.trim();
      statusComment = discountSummary;
    }

    await OrderStatusHistory.create({
      orderId: order._id,
      previousStatus,
      currentStatus: newStatus,
      changedBy: user._id,
      changedByRole: user.role,
      changeDate: new Date(),
      comment: statusComment,
      automaticChange: false,
    });

    // Handle stock adjustment based on order status
    const products = order.products
    
    if (!products || products.length === 0) {
      revalidatePath('/dashboard/admin/orders');
      revalidatePath('/dashboard/seller/orders');
      return {
        success: true,
        message: 'Order status updated successfully',
      };
    }

    // Determine stock movement type and reason based on status
    let movementType: StockMovementType | null = null;
    let movementReason: StockMovementReason | null = null;
    let movementNote = '';

    switch (newStatus) {
      case OrderStatus.CONFIRMED:
        movementType = StockMovementType.DECREASE;
        movementReason = StockMovementReason.ORDER_CONFIRMED;
        movementNote = `Stock reduced due to order confirmation ${order?.orderId}`;
        break;
      
      case OrderStatus.DELIVERY_FAILED:
        movementType = StockMovementType.INCREASE;
        movementReason = StockMovementReason.DELIVERY_FAILED;
        movementNote = `Stock returned due to delivery failure ${order?.orderId}`;
        break;
      
      case OrderStatus.REFUNDED:
        movementType = StockMovementType.INCREASE;
        movementReason = StockMovementReason.RETURN_FROM_CUSTOMER;
        movementNote = `Stock returned due to refund ${order?.orderId}`;
        break;
      
      case OrderStatus.UNREACHED:
        movementType = StockMovementType.INCREASE;
        movementReason = StockMovementReason.CUSTOMER_UNREACHED;
        movementNote = `Stock returned due to unreachable customer ${order?.orderId}`;
        break;
      
      case OrderStatus.CANCELLED:
        movementType = StockMovementType.INCREASE;
        movementReason = StockMovementReason.RETURN_FROM_CUSTOMER;
        movementNote = `Stock returned due to order cancellation ${order?.orderId}`;
        break;
      
      // No stock movement needed for other statuses
      default:
        movementType = null;
        break;
    }

    // Only process stock movement for statuses that require it and when instructed
    if (movementType && movementReason && shouldUpdateStock) {
      for (const product of products){
          try {
              const result = await createStockMovement({
                productId: product?.productId,
                warehouseId: order?.warehouseId,
                movementType: movementType,
                quantity: product?.quantity,
                reason: movementReason,
                notes: movementNote,
                metadata:{
                  orderId,
                  orderNumber: order?.orderId,
                  statusChange: `Changed to ${newStatus}`,
                  changeDate: new Date().toISOString()
                }
              });

              console.log('Stock movement result:', result);
          } catch (error:any) {
             console.log('Stock movement error:', error.message);
          }
      }
    } else {
      console.log('No stock movement required for status:', newStatus);
    }

    // Revalidate the orders page
    revalidatePath('/dashboard/admin/orders');
    revalidatePath('/dashboard/seller/orders');

    return {
      success: true,
      message: 'Order status updated successfully',
    };
  } catch (error: any) {
    console.error('Error updating order status:', error);
    return {
      success: false,
      message: error.message || 'Failed to update order status',
    };
  }
});

/**
 * Get duplicate orders and their detection settings for comparison
 */
export const getDuplicateOrdersDetails = withDbConnection(async (
  orderIds: string[],
  sellerId: string
) => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return {
        success: false,
        message: 'Unauthorized',
      };
    }

    // Validate that the user can access these orders
    if (user.role === UserRole.SELLER && user._id !== sellerId) {
      return {
        success: false,
        message: 'Access denied',
      };
    }

    // Fetch the duplicate orders with populated product data
    const duplicateOrders = await Order.find({
      _id: { $in: orderIds }
    })
      .populate('products.productId', 'name code')
      .populate('warehouseId', 'name country currency')
      .lean();

    // Fetch duplicate detection settings for the seller
    const duplicateSettings = await DuplicateDetectionSettings.findOne({
      sellerId: sellerId
    }).lean();

    // Transform the orders to include product names
    const enhancedOrders = duplicateOrders.map((order: any) => ({
      ...order,
      _id: order._id.toString(),
      products: order.products.map((product: any) => ({
        ...product,
        productId: product.productId._id.toString(),
        productName: product.productId.name,
        productCode: product.productId.code,
      })),
      warehouseId: order.warehouseId._id.toString(),
      warehouseName: order.warehouseId.name,
    }));

    return {
      success: true,
      duplicateOrders: JSON.parse(JSON.stringify(enhancedOrders)),
      duplicateSettings: duplicateSettings ? JSON.parse(JSON.stringify(duplicateSettings)) : null,
    };
  } catch (error: any) {
    console.error('Error fetching duplicate orders:', error);
    return {
      success: false,
      message: error.message || 'Failed to fetch duplicate orders',
    };
  }
});

/**
 * Apply discount to order products (Call Center agents only)
 */
export const applyDiscountToOrder = withDbConnection(async (
  request: ApplyDiscountRequest
): Promise<DiscountResponse> => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return {
        success: false,
        message: 'Unauthorized',
      };
    }

    // Only call center agents can apply discounts
    if (user.role !== UserRole.CALL_CENTER) {
      return {
        success: false,
        message: 'Only call center agents can apply discounts',
      };
    }

    // Find the order
    const order = await Order.findById(request.orderId);
    if (!order) {
      return {
        success: false,
        message: 'Order not found',
      };
    }

    // Validate that order is in a state where discounts can be applied
    if (order.status === OrderStatus.CONFIRMED || order.status === OrderStatus.CANCELLED) {
      return {
        success: false,
        message: `Cannot apply discounts to ${order.status} orders`,
      };
    }

    let totalOriginalPrice = 0;
    let totalDiscountAmount = 0;
    const priceAdjustments = [];

    // Process each discount
    for (const discount of request.discounts) {
      // Find the product in the order
      const orderProduct = order.products.find(
        (p: any) => p.productId.toString() === discount.productId
      );

      if (!orderProduct) {
        return {
          success: false,
          message: `Product ${discount.productId} not found in order`,
        };
      }

      // Validate discount amount
      if (discount.newPrice < 0) {
        return {
          success: false,
          message: 'Discounted price cannot be negative',
        };
      }

      if (discount.newPrice >= discount.originalPrice) {
        return {
          success: false,
          message: 'Discounted price must be less than original price',
        };
      }

      const discountAmount = discount.originalPrice - discount.newPrice;
      const discountPercentage = (discountAmount / discount.originalPrice) * 100;

      // Update the product price in the order
      orderProduct.unitPrice = discount.newPrice;

      // Track the price adjustment
      priceAdjustments.push({
        productId: discount.productId,
        originalPrice: discount.originalPrice,
        adjustedPrice: discount.newPrice,
        discountAmount: discountAmount,
        discountPercentage: discountPercentage,
        reason: discount.reason,
        appliedBy: user._id,
        appliedAt: new Date(),
        notes: discount.notes || '',
      });

      totalOriginalPrice += discount.originalPrice * orderProduct.quantity;
      totalDiscountAmount += discountAmount * orderProduct.quantity;
    }

    // Calculate new total price
    const newTotalPrice = order.products.reduce(
      (total: number, product: any) => total + (product.unitPrice * product.quantity),
      0
    );

    // Update order with price adjustments
    order.priceAdjustments = [...(order.priceAdjustments || []), ...priceAdjustments];
    order.finalTotalPrice = newTotalPrice;
    order.totalDiscountAmount = (order.totalDiscountAmount || 0) + totalDiscountAmount;
    order.totalPrice = newTotalPrice; // Update the main total price as well

    await order.save();

    // Create status history entry for discount application
    await OrderStatusHistory.create({
      orderId: order._id,
      previousStatus: order.status,
      currentStatus: order.status, // Status doesn't change, just tracking the discount
      changedBy: user._id,
      changedByRole: user.role,
      changeDate: new Date(),
      comment: `Discount applied: ${totalDiscountAmount.toFixed(2)} total discount`,
      automaticChange: false,
    });

    revalidatePath('/dashboard/call_center/orders');
    revalidatePath('/dashboard/admin/orders');

    return {
      success: true,
      message: 'Discount applied successfully',
      totalOriginalPrice,
      totalFinalPrice: newTotalPrice,
      totalDiscountAmount,
    };
  } catch (error: any) {
    console.error('Error applying discount:', error);
    return {
      success: false,
      message: error.message || 'Failed to apply discount',
    };
  }
});