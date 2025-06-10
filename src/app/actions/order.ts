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
    if(user.role === UserRole.CALL_CENTER){
      query.assignedAgent = user._id
    }
    
    // Execute query with pagination
    const orders: any[] = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Count total results for pagination
    const total = await Order.countDocuments(query);
    
    // Get unique warehouseIds, sellerIds, productIds, and assignedAgentIds for populating names
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
    
    // Fetch related data in parallel
    const [warehouses, sellers, products, statusChangedByUsers, assignedAgents] = await Promise.all([
      Warehouse.find({ _id: { $in: warehouseIds } }).lean(),
      User.find({ _id: { $in: sellerIds } }).lean(),
      Product.find({ _id: { $in: productIds } }, { name: 1, code: 1 }).lean(),
      User.find({ _id: { $in: statusChangedByIds } }, { name: 1, role: 1 }).lean(),
      User.find({ _id: { $in: assignedAgentIds } }, { name: 1, email: 1 }).lean()
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
    
    const assignedAgentMap = new Map();
    assignedAgents.forEach((agent:any) => {
      assignedAgentMap.set(agent._id.toString(), agent);
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
      products.map(async (product:any) => {
        // Get warehouse-specific stock
        const warehouseStock = product.warehouses.find(
          (w: any) => w.warehouseId.toString() === warehouseId
        );
        const totalStock = warehouseStock?.stock || 0;

        // Get expeditions for this product and warehouse
        const expeditions = await Expedition.find({
          warehouseId: warehouseId,
          'products.productId': product._id,
          status: ExpeditionStatus.APPROVED,
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
 * Detect potential double orders
 */
const detectDoubleOrders = withDbConnection(async (
  customerName: string,
  phoneNumbers: string[],
  productIds: string[],
  orderDate: Date,
  excludeOrderId?: string
) => {
  try {
    const potentialDoubles = await (Order as any).findPotentialDoubles(
      customerName,
      phoneNumbers,
      productIds.map(id => new mongoose.Types.ObjectId(id)),
      orderDate,
      excludeOrderId ? new mongoose.Types.ObjectId(excludeOrderId) : undefined
    );

    return potentialDoubles.map((order: any) => ({
      orderId: order._id.toString(),
      customerName: order.customer.name,
      orderDate: order.orderDate,
      similarity: {
        sameName: order.customer.name.toLowerCase() === customerName.toLowerCase(),
        samePhone: order.customer.phoneNumbers.some((phone: string) => 
          phoneNumbers.includes(phone)
        ),
        sameProduct: order.products.some((p: any) => 
          productIds.includes(p.productId.toString())
        ),
        orderDateDifference: Math.abs(
          new Date(orderDate).getTime() - new Date(order.orderDate).getTime()
        ) / (1000 * 60 * 60), // Hours difference
      },
    }));
  } catch (error: any) {
    console.error("Error detecting double orders:", error);
    return [];
  }
});

/**
 * Create order in real-time server for call center assignment
 * Only called in development mode
 */
export async function createOrderInRealtimeServer(orderData: any) {
  try {
    const REALTIME_SERVER_URL = process.env.REALTIME_SERVER_URL || 'http://localhost:5000';
    const API_KEY = process.env.REALTIME_API_KEY || 'your-api-key';

    // Prepare order data for real-time server API
    const orderPayload = {
      customer: {
        name: orderData.customer.name,
        phoneNumbers: orderData.customer.phoneNumbers,
        shippingAddress: orderData.customer.shippingAddress
      },
      warehouseId: orderData.warehouseId.toString(),
      sellerId: orderData.sellerId.toString(),
      products: orderData.products.map((product: any) => ({
        productId: product.productId.toString(),
        quantity: product.quantity,
        unitPrice: product.unitPrice,
        expeditionId: product.expeditionId.toString()
      })),
      totalPrice: orderData.totalPrice,
      // Don't set assignedAgentId - let the auto-assignment work
    };

    console.log('📤 Creating order in real-time server:', {
      customer: orderPayload.customer.name,
      totalPrice: orderPayload.totalPrice,
      productsCount: orderPayload.products.length
    });

    const response = await fetch(`${REALTIME_SERVER_URL}/api/orders/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY
      },
      body: JSON.stringify(orderPayload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Real-time server failed to create order');
    }

    console.log('✅ Real-time server created order:', result.data?.orderNumber || 'Unknown order number');
    
    return result;
  } catch (error) {
    console.error('❌ Error creating order in real-time server:', error);
    throw error;
  }
}

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
      status: ExpeditionStatus.APPROVED,
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

    // Detect potential double orders
    const doubleOrders = await detectDoubleOrders(
      orderData.customer.name,
      phoneNumbers,
      productIds,
      new Date()
    );

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
    const API_KEY = process.env.SOCKET_SERVER_API_SECRET_KEY || 'your-api-key';

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
      status: OrderStatus.PENDING,
      statusChangedAt: new Date(),
      isDouble: doubleOrders.length > 0,
      doubleOrderReferences: doubleOrders,
      orderDate: new Date(),
    }

    const response = await fetch(`${REALTIME_SERVER_URL}/api/orders/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY
      },
      body: JSON.stringify(orderPayload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Real-time server failed to create order');
    }

    console.log('✅ Real-time server created order:', result.data?.orderNumber || 'Unknown order number');

    
    revalidatePath("/dashboard/seller/orders");
    revalidatePath("/dashboard/admin/orders");

    return {
      success: true,
      message: "Order created successfully",
      orderId: result?.orderId ,
      isDouble: doubleOrders.length > 0,
      doubleOrderCount: doubleOrders.length,
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
 * Update order status (Admin/Moderator only)
 */
export const updateOrderStatus = withDbConnection(async (
  orderId: string,
  newStatus: OrderStatus,
  comment?: string
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

    // Update order status
    order.status = newStatus;
    order.statusComment = comment || '';
    order.statusChangedBy = user._id;
    order.statusChangedAt = new Date();

    await order.save();

    // Create status history entry
    await OrderStatusHistory.create({
      orderId: order._id,
      previousStatus,
      currentStatus: newStatus,
      changedBy: user._id,
      changedByRole: user.role,
      changeDate: new Date(),
      comment: comment || '',
      automaticChange: false,
    });

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