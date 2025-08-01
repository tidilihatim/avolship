"use server";

import { withDbConnection } from '@/lib/db/db-connect';
import { getCurrentUser } from './auth';
import { UserRole } from '@/lib/db/models/user';
import Order, { OrderStatus } from '@/lib/db/models/order';
import mongoose from 'mongoose';

export interface CustomerFilters {
  search?: string;
  status?: 'all' | 'active' | 'pending' | 'unreached' | 'confirmed';
  dateFrom?: string;
  dateTo?: string;
  sortBy?: 'name' | 'lastContact' | 'orders' | 'totalValue';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

/**
 * Get customers with advanced filtering, search, and pagination
 */
export const getCustomers = withDbConnection(async (
  filters: CustomerFilters = {},
  pagination: PaginationParams = {}
) => {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== UserRole.CALL_CENTER) {
      return {
        success: false,
        message: 'Unauthorized access',
      };
    }

    const {
      search = '',
      status = 'all',
      dateFrom,
      dateTo,
      sortBy = 'lastContact',
      sortOrder = 'desc'
    } = filters;

    const {
      page = 1,
      limit = 10
    } = pagination;

    // Build match conditions for orders assigned to this agent
    const matchConditions: any = {
      assignedAgent: mongoose.Types.ObjectId.createFromHexString(user._id.toString())
    };

    // Add date range filter
    if (dateFrom || dateTo) {
      matchConditions.orderDate = {};
      if (dateFrom) matchConditions.orderDate.$gte = new Date(dateFrom);
      if (dateTo) matchConditions.orderDate.$lte = new Date(dateTo);
    }

    // Add status filter
    if (status !== 'all') {
      switch (status) {
        case 'active':
          matchConditions.status = { $in: [OrderStatus.PENDING, OrderStatus.CONFIRMED] };
          break;
        case 'pending':
          matchConditions.status = OrderStatus.PENDING;
          break;
        case 'unreached':
          matchConditions.status = OrderStatus.UNREACHED;
          break;
        case 'confirmed':
          matchConditions.status = OrderStatus.CONFIRMED;
          break;
      }
    }

    // Build aggregation pipeline
    const pipeline: any[] = [
      { $match: matchConditions },
      
      // Group by customer (phone number as primary identifier)
      {
        $group: {
          _id: {
            name: '$customer.name',
            phone: { $arrayElemAt: ['$customer.phoneNumbers', 0] },
            address: '$customer.shippingAddress'
          },
          totalOrders: { $sum: 1 },
          totalValue: { $sum: '$totalPrice' },
          lastOrderDate: { $max: '$orderDate' },
          lastContact: { $max: { $ifNull: ['$lastCallAttempt', '$orderDate'] } },
          statuses: { $push: '$status' },
          orderIds: { $push: '$_id' },
          callAttempts: { $sum: { $ifNull: ['$totalCallAttempts', 0] } }
        }
      },

      // Add computed fields
      {
        $addFields: {
          customerName: '$_id.name',
          primaryPhone: '$_id.phone',
          shippingAddress: '$_id.address',
          lastActivity: {
            $cond: {
              if: { $gt: ['$lastContact', '$lastOrderDate'] },
              then: '$lastContact',
              else: '$lastOrderDate'
            }
          },
          status: {
            $cond: {
              if: { $in: [OrderStatus.CONFIRMED, '$statuses'] },
              then: 'confirmed',
              else: {
                $cond: {
                  if: { $in: [OrderStatus.PENDING, '$statuses'] },
                  then: 'pending',
                  else: {
                    $cond: {
                      if: { $in: [OrderStatus.UNREACHED, '$statuses'] },
                      then: 'unreached',
                      else: 'other'
                    }
                  }
                }
              }
            }
          }
        }
      },

      // Apply search filter
      ...(search ? [{
        $match: {
          $or: [
            { customerName: { $regex: search, $options: 'i' } },
            { primaryPhone: { $regex: search, $options: 'i' } },
            { shippingAddress: { $regex: search, $options: 'i' } }
          ]
        }
      }] : []),

      // Sort
      {
        $sort: {
          [sortBy === 'name' ? 'customerName' : 
           sortBy === 'lastContact' ? 'lastActivity' :
           sortBy === 'orders' ? 'totalOrders' :
           sortBy === 'totalValue' ? 'totalValue' : 'lastActivity']: sortOrder === 'asc' ? 1 : -1
        }
      },

      // Add total count before pagination
      {
        $facet: {
          customers: [
            { $skip: (page - 1) * limit },
            { $limit: limit }
          ],
          totalCount: [
            { $count: 'count' }
          ]
        }
      }
    ];


    const [result] = await Order.aggregate(pipeline);
    const customers = result?.customers || [];
    const totalCount = result?.totalCount?.[0]?.count || 0;

    // Format customer data - ensure proper serialization
    const formattedCustomers = customers.map((customer: any) => ({
      id: customer._id?.toString() || '',
      name: customer.customerName || '',
      phone: customer.primaryPhone || '',
      address: customer.shippingAddress || '',
      totalOrders: customer.totalOrders || 0,
      totalValue: customer.totalValue || 0,
      lastContact: customer.lastContact ? new Date(customer.lastContact).toISOString() : null,
      lastOrderDate: customer.lastOrderDate ? new Date(customer.lastOrderDate).toISOString() : null,
      lastActivity: customer.lastActivity ? new Date(customer.lastActivity).toISOString() : null,
      status: customer.status || 'other',
      callAttempts: customer.callAttempts || 0,
      orderIds: customer.orderIds?.map((id: any) => id.toString()) || []
    }));

    return {
      success: true,
      data: {
        customers: formattedCustomers,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          totalCount,
          hasNextPage: page < Math.ceil(totalCount / limit),
          hasPrevPage: page > 1
        }
      }
    };

  } catch (error: any) {
    console.error('Error fetching customers:', error);
    return {
      success: false,
      message: error.message || 'Failed to fetch customers',
    };
  }
});

/**
 * Get customer details with order history
 */
export const getCustomerDetails = withDbConnection(async (customerPhone: string) => {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== UserRole.CALL_CENTER) {
      return {
        success: false,
        message: 'Unauthorized access',
      };
    }

    // Get all orders for this customer assigned to current agent
    const orders = await Order.find({
      assignedAgent: user._id,
      'customer.phoneNumbers': customerPhone
    })
    .populate('warehouseId', 'name currency')
    .populate('sellerId', 'name')
    .sort({ orderDate: -1 })
    .lean();

    if (orders.length === 0) {
      return {
        success: false,
        message: 'Customer not found or not assigned to you',
      };
    }

    // Get customer info from the most recent order
    const latestOrder = orders[0];
    const customer = {
      name: latestOrder.customer.name,
      phoneNumbers: latestOrder.customer.phoneNumbers,
      shippingAddress: latestOrder.customer.shippingAddress,
      location: latestOrder.customer.location
    };

    // Calculate statistics
    const stats = {
      totalOrders: orders.length,
      totalValue: orders.reduce((sum, order) => sum + order.totalPrice, 0),
      totalCallAttempts: orders.reduce((sum, order) => sum + (order.totalCallAttempts || 0), 0),
      confirmedOrders: orders.filter(order => order.status === OrderStatus.CONFIRMED).length,
      lastContact: orders.reduce((latest, order) => {
        if (order.lastCallAttempt && (!latest || order.lastCallAttempt > latest)) {
          return order.lastCallAttempt;
        }
        return latest;
      }, null as Date | null)
    };

    // Format order history
    const orderHistory = orders.map((order: any) => ({
      _id: order._id.toString(),
      orderId: order.orderId,
      orderDate: order.orderDate,
      status: order.status,
      totalPrice: order.totalPrice,
      totalCallAttempts: order.totalCallAttempts || 0,
      lastCallAttempt: order.lastCallAttempt,
      warehouseName: (order as any).warehouseId?.name || 'Unknown',
      sellerName: (order as any).sellerId?.name || 'Unknown',
      callAttempts: order.callAttempts || []
    }));

    return {
      success: true,
      data: {
        customer,
        stats,
        orders: orderHistory
      }
    };

  } catch (error: any) {
    console.error('Error fetching customer details:', error);
    return {
      success: false,
      message: error.message || 'Failed to fetch customer details',
    };
  }
});

/**
 * Search customers by phone, name, or order ID
 */
export const searchCustomers = withDbConnection(async (query: string, limit: number = 10) => {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== UserRole.CALL_CENTER) {
      return {
        success: false,
        message: 'Unauthorized access',
      };
    }

    const searchConditions = {
      assignedAgent: user._id,
      $or: [
        { 'customer.name': { $regex: query, $options: 'i' } },
        { 'customer.phoneNumbers': { $regex: query, $options: 'i' } },
        { orderId: { $regex: query, $options: 'i' } }
      ]
    };

    const orders = await Order.find(searchConditions)
      .select('customer orderId orderDate status totalPrice')
      .sort({ orderDate: -1 })
      .limit(limit)
      .lean();

    // Group by customer phone to avoid duplicates
    const customerMap = new Map();
    
    orders.forEach(order => {
      const phone = order.customer.phoneNumbers[0];
      if (!customerMap.has(phone)) {
        customerMap.set(phone, {
          name: order.customer.name,
          phone: phone,
          orderId: order.orderId,
          lastOrderDate: order.orderDate,
          status: order.status
        });
      }
    });

    const results = Array.from(customerMap.values());

    return {
      success: true,
      data: results
    };

  } catch (error: any) {
    console.error('Error searching customers:', error);
    return {
      success: false,
      message: error.message || 'Failed to search customers',
    };
  }
});