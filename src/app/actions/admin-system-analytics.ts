'use server';

import { withDbConnection } from '@/lib/db/db-connect';
import Order from '@/lib/db/models/order';
import OrderStatusHistory from '@/lib/db/models/order-status-history';
import Warehouse from '@/lib/db/models/warehouse';
import mongoose from 'mongoose';

/**
 * Get warehouses for analytics dropdown
 */
export const getWarehousesForSystemAnalytics = withDbConnection(
  async () => {
    try {
      const warehouses = await Warehouse.find({ isActive: true })
        .select('_id name currency country city')
        .sort({ name: 1 })
        .lean();

      return {
        success: true,
        data: warehouses,
      };
    } catch (error: any) {
      console.error('Error fetching warehouses:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch warehouses',
      };
    }
  }
);

/**
 * Get delayed orders (48h+ since confirmation but not delivered)
 */
export const getDelayedOrders = withDbConnection(
  async (warehouseId: string, page: number = 1, limit: number = 10) => {
    try {
      const now = new Date();
      const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

      // Find orders that are not yet delivered, delivery_failed, or refunded
      const ordersInProgress:any = await Order.find({
        warehouseId: new mongoose.Types.ObjectId(warehouseId),
        status: {
          $in: [
            'confirmed',
            'shipped',
            'assigned_to_delivery',
            'accepted_by_delivery',
            'in_transit',
            'out_for_delivery',
          ],
        },
      })
        .select('_id orderId status statusChangedAt customer sellerId')
        .populate('sellerId', 'businessName firstName lastName')
        .lean();

      // For each order, check when it was confirmed
      const delayedOrders: any[] = [];

      for (const order of ordersInProgress) {
        // Find the confirmation timestamp from order status history
        const confirmationHistory:any = await OrderStatusHistory.findOne({
          orderId: order._id,
          currentStatus: 'confirmed',
        })
          .sort({ changeDate: 1 }) // Get the first time it was confirmed
          .select('changeDate')
          .lean();

        if (confirmationHistory) {
          const confirmationTime = confirmationHistory.changeDate;

          // Check if confirmed more than 48 hours ago
          if (confirmationTime < fortyEightHoursAgo) {
            const hoursDelayed = Math.floor(
              (now.getTime() - confirmationTime.getTime()) / (1000 * 60 * 60)
            );

            delayedOrders.push({
              orderId: order.orderId,
              orderMongoId: order._id.toString(),
              status: order.status,
              customerName: (order as any).customer?.name || 'Unknown',
              sellerName:
                (order as any).sellerId?.businessName ||
                `${(order as any).sellerId?.firstName || ''} ${
                  (order as any).sellerId?.lastName || ''
                }`.trim() ||
                'Unknown',
              confirmedAt: confirmationTime,
              hoursDelayed,
            });
          }
        }
      }

      // Sort by hours delayed (most delayed first)
      delayedOrders.sort((a, b) => b.hoursDelayed - a.hoursDelayed);

      // Calculate pagination
      const totalCount = delayedOrders.length;
      const totalPages = Math.ceil(totalCount / limit);
      const skip = (page - 1) * limit;
      const paginatedData = delayedOrders.slice(skip, skip + limit);

      return {
        success: true,
        data: paginatedData,
        count: totalCount,
        page,
        limit,
        totalPages,
      };
    } catch (error: any) {
      console.error('Error fetching delayed orders:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch delayed orders',
      };
    }
  }
);

/**
 * Get high return sellers (>20% return rate)
 */
export const getHighReturnSellers = withDbConnection(
  async (warehouseId: string, page: number = 1, limit: number = 10) => {
    try {
      // Get all sellers in this warehouse with their order counts
      const sellers = await Order.aggregate([
        {
          $match: {
            warehouseId: new mongoose.Types.ObjectId(warehouseId),
          },
        },
        {
          $group: {
            _id: '$sellerId',
            totalOrders: { $sum: 1 },
            refundedOrders: {
              $sum: {
                $cond: [{ $eq: ['$status', 'refunded'] }, 1, 0],
              },
            },
          },
        },
        {
          $match: {
            totalOrders: { $gte: 5 }, // At least 5 orders to calculate meaningful percentage
          },
        },
      ]);

      // Calculate return rate and filter sellers with >20%
      const highReturnSellers: any[] = [];

      for (const seller of sellers) {
        const returnRate = (seller.refundedOrders / seller.totalOrders) * 100;

        if (returnRate > 20) {
          // Get seller details from User model
          const User = mongoose.model('User');
          const sellerDetails: any = await User.findById(seller._id)
            .select('businessName firstName lastName email')
            .lean();

          if (sellerDetails) {
            highReturnSellers.push({
              sellerId: seller._id.toString(),
              sellerName:
                sellerDetails.businessName ||
                `${sellerDetails.firstName || ''} ${sellerDetails.lastName || ''}`.trim() ||
                'Unknown',
              sellerEmail: sellerDetails.email || 'N/A',
              totalOrders: seller.totalOrders,
              refundedOrders: seller.refundedOrders,
              returnRate: Math.round(returnRate * 100) / 100, // Round to 2 decimals
            });
          }
        }
      }

      // Sort by return rate (highest first)
      highReturnSellers.sort((a, b) => b.returnRate - a.returnRate);

      // Calculate pagination
      const totalCount = highReturnSellers.length;
      const totalPages = Math.ceil(totalCount / limit);
      const skip = (page - 1) * limit;
      const paginatedData = highReturnSellers.slice(skip, skip + limit);

      return {
        success: true,
        data: paginatedData,
        count: totalCount,
        page,
        limit,
        totalPages,
      };
    } catch (error: any) {
      console.error('Error fetching high return sellers:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch high return sellers',
      };
    }
  }
);
