'use server';

import { withDbConnection } from '@/lib/db/db-connect';
import { getCurrentUser } from './auth';
import { UserRole } from '@/lib/db/models/user';
import User from '@/lib/db/models/user';
import Order, { OrderStatus } from '@/lib/db/models/order';
import mongoose from 'mongoose';

/**
 * Get all active delivery riders for the filter dropdown
 */
export const getDeliveryRiders = withDbConnection(async () => {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== UserRole.ADMIN) {
      return {
        success: false,
        message: 'Unauthorized. Admin access required.',
      };
    }

    const riders = await User.find({
      role: UserRole.DELIVERY,
      status: 'approved',
    })
      .select('_id name email country')
      .sort({ name: 1 })
      .lean();

    return {
      success: true,
      data: riders.map((rider:any) => ({
        _id: rider._id.toString(),
        name: rider.name,
        email: rider.email,
        country: rider.country || 'N/A',
      })),
    };
  } catch (error: any) {
    console.error('Error fetching delivery riders:', error);
    return {
      success: false,
      message: error.message || 'Failed to fetch delivery riders',
    };
  }
});

/**
 * Get active deliveries (orders out for delivery right now)
 */
export const getActiveDeliveries = withDbConnection(
  async (riderId?: string) => {
    try {
      const user = await getCurrentUser();

      if (!user || user.role !== UserRole.ADMIN) {
        return {
          success: false,
          message: 'Unauthorized. Admin access required.',
        };
      }

      // Build query filter - only show ACTIVE deliveries (no date filter)
      const deliveryFilter: any = {
        status: {
          $in: [
            OrderStatus.ASSIGNED_TO_DELIVERY,
            OrderStatus.ACCEPTED_BY_DELIVERY,
            OrderStatus.IN_TRANSIT,
            OrderStatus.OUT_FOR_DELIVERY,
          ],
        },
      };

      // Filter by rider if specified (only apply if rider is selected)
      if (riderId && riderId !== 'all') {
        deliveryFilter['deliveryTracking.deliveryGuyId'] = new mongoose.Types.ObjectId(riderId);
      }

      // Just count the active deliveries
      const count = await Order.countDocuments(deliveryFilter);

      return {
        success: true,
        count,
      };
    } catch (error: any) {
      console.error('Error fetching active deliveries:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch active deliveries',
      };
    }
  }
);

/**
 * Get successful deliveries percentage data
 */
export const getSuccessfulDeliveriesPercentage = withDbConnection(
  async (
    startDate?: string,
    endDate?: string,
    riderId?: string,
    period: 'daily' | 'monthly' | 'yearly' = 'daily'
  ) => {
    try {
      const user = await getCurrentUser();

      if (!user || user.role !== UserRole.ADMIN) {
        return {
          success: false,
          message: 'Unauthorized. Admin access required.',
        };
      }

      // Build date filter
      let fromDate: Date;
      let toDate: Date;

      if (startDate && endDate) {
        fromDate = new Date(startDate);
        toDate = new Date(endDate);
      } else {
        // Default to last 30 days
        toDate = new Date();
        fromDate = new Date();
        fromDate.setDate(fromDate.getDate() - 30);
      }

      // Build query filter for completed delivery attempts only (delivered or failed)
      const deliveryFilter: any = {
        status: {
          $in: [
            OrderStatus.DELIVERED,
            OrderStatus.DELIVERY_FAILED,
          ],
        },
        orderDate: {
          $gte: fromDate,
          $lte: toDate,
        },
      };

      // Filter by rider if specified
      if (riderId && riderId !== 'all') {
        deliveryFilter['deliveryTracking.deliveryGuyId'] = new mongoose.Types.ObjectId(riderId);
      }

      // Get completed delivery attempts only
      const completedDeliveryOrders = await Order.find(deliveryFilter)
        .select('orderDate status')
        .lean();

      // Group data by period
      const groupedData: {
        [key: string]: { total: number; successful: number };
      } = {};

      completedDeliveryOrders.forEach((order: any) => {
        if (order.orderDate) {
          const orderDate = new Date(order.orderDate);
          let key: string;

          switch (period) {
            case 'yearly':
              key = orderDate.getFullYear().toString();
              break;
            case 'monthly':
              key = `${orderDate.getFullYear()}-${String(
                orderDate.getMonth() + 1
              ).padStart(2, '0')}`;
              break;
            case 'daily':
            default:
              key = orderDate.toISOString().split('T')[0];
              break;
          }

          if (!groupedData[key]) {
            groupedData[key] = { total: 0, successful: 0 };
          }

          groupedData[key].total++;
          if (order.status === OrderStatus.DELIVERED) {
            groupedData[key].successful++;
          }
        }
      });

      // Generate all expected periods in the date range
      const allPeriods: string[] = [];
      const currentDate = new Date(fromDate);

      while (currentDate <= toDate) {
        let key: string;
        switch (period) {
          case 'yearly':
            key = currentDate.getFullYear().toString();
            if (!allPeriods.includes(key)) {
              allPeriods.push(key);
            }
            currentDate.setFullYear(currentDate.getFullYear() + 1);
            break;
          case 'monthly':
            key = `${currentDate.getFullYear()}-${String(
              currentDate.getMonth() + 1
            ).padStart(2, '0')}`;
            if (!allPeriods.includes(key)) {
              allPeriods.push(key);
            }
            currentDate.setMonth(currentDate.getMonth() + 1);
            break;
          case 'daily':
          default:
            key = currentDate.toISOString().split('T')[0];
            allPeriods.push(key);
            currentDate.setDate(currentDate.getDate() + 1);
            break;
        }
      }

      // Format data for chart with all periods
      const chartData = allPeriods.map((key) => {
        const data = groupedData[key];
        const percentage = data && data.total > 0
          ? Math.round((data.successful / data.total) * 100 * 10) / 10
          : null;

        let label: string;
        switch (period) {
          case 'yearly':
            label = key;
            break;
          case 'monthly':
            const [year, month] = key.split('-');
            const monthDate = new Date(parseInt(year), parseInt(month) - 1);
            label = monthDate.toLocaleDateString('en-US', {
              month: 'short',
              year: 'numeric',
            });
            break;
          case 'daily':
          default:
            const date = new Date(key);
            label = date.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            });
            break;
        }

        return {
          period: label,
          percentage,
          total: data ? data.total : 0,
          successful: data ? data.successful : 0,
        };
      });

      return {
        success: true,
        data: chartData,
      };
    } catch (error: any) {
      console.error('Error fetching successful deliveries percentage:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch successful deliveries percentage',
      };
    }
  }
);

/**
 * Get returns per zone data (failure percentage by geographic zone)
 */
export const getReturnsPerZone = withDbConnection(
  async (
    startDate?: string,
    endDate?: string,
    riderId?: string
  ) => {
    try {
      const user = await getCurrentUser();

      if (!user || user.role !== UserRole.ADMIN) {
        return {
          success: false,
          message: 'Unauthorized. Admin access required.',
        };
      }

      // Build date filter
      let fromDate: Date;
      let toDate: Date;

      if (startDate && endDate) {
        fromDate = new Date(startDate);
        toDate = new Date(endDate);
      } else {
        // Default to last 30 days
        toDate = new Date();
        fromDate = new Date();
        fromDate.setDate(fromDate.getDate() - 30);
      }

      // Build query filter for completed delivery attempts
      const deliveryFilter: any = {
        status: {
          $in: [
            OrderStatus.DELIVERED,
            OrderStatus.DELIVERY_FAILED,
          ],
        },
        orderDate: {
          $gte: fromDate,
          $lte: toDate,
        },
      };

      // Filter by rider if specified
      if (riderId && riderId !== 'all') {
        deliveryFilter['deliveryTracking.deliveryGuyId'] = new mongoose.Types.ObjectId(riderId);
      }

      // Get all completed deliveries (we'll filter by location in code)
      const allDeliveries = await Order.find(deliveryFilter)
        .select('customer.location deliveryAddress status')
        .lean();

      // Filter to only those with location data
      const deliveries = allDeliveries.filter((order: any) => {
        const hasCustomerLocation = order.customer?.location?.latitude && order.customer?.location?.longitude;
        const hasDeliveryAddress = order.deliveryAddress?.latitude && order.deliveryAddress?.longitude;
        return hasCustomerLocation || hasDeliveryAddress;
      });

      // Group by geographic zones (round to ~1km grid: 0.01 degree ≈ 1km)
      const zoneData: {
        [key: string]: {
          latitude: number;
          longitude: number;
          total: number;
          failed: number;
        };
      } = {};

      deliveries.forEach((order: any) => {
        // Try to get location from customer.location or deliveryAddress
        let latitude: number | undefined;
        let longitude: number | undefined;

        if (order.customer?.location?.latitude && order.customer?.location?.longitude) {
          latitude = order.customer.location.latitude;
          longitude = order.customer.location.longitude;
        } else if (order.deliveryAddress?.latitude && order.deliveryAddress?.longitude) {
          latitude = order.deliveryAddress.latitude;
          longitude = order.deliveryAddress.longitude;
        }

        if (latitude && longitude) {
          // Round to 2 decimal places for ~1km zones
          const lat = Math.round(latitude * 100) / 100;
          const lng = Math.round(longitude * 100) / 100;
          const key = `${lat},${lng}`;

          if (!zoneData[key]) {
            zoneData[key] = {
              latitude: lat,
              longitude: lng,
              total: 0,
              failed: 0,
            };
          }

          zoneData[key].total++;
          if (order.status === OrderStatus.DELIVERY_FAILED) {
            zoneData[key].failed++;
          }
        }
      });

      // Convert to array with failure percentage
      const zones = Object.values(zoneData).map((zone) => ({
        latitude: zone.latitude,
        longitude: zone.longitude,
        total: zone.total,
        failed: zone.failed,
        failurePercentage: Math.round((zone.failed / zone.total) * 100 * 10) / 10,
      }));

      return {
        success: true,
        data: zones,
      };
    } catch (error: any) {
      console.error('Error fetching returns per zone:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch returns per zone',
      };
    }
  }
);

/**
 * Get average delivery time data (from order confirmation to delivery)
 */
export const getAverageDeliveryTime = withDbConnection(
  async (
    startDate?: string,
    endDate?: string,
    riderId?: string,
    period: 'daily' | 'monthly' | 'yearly' = 'daily'
  ) => {
    try {
      const user = await getCurrentUser();

      if (!user || user.role !== UserRole.ADMIN) {
        return {
          success: false,
          message: 'Unauthorized. Admin access required.',
        };
      }

      // Build date filter
      let fromDate: Date;
      let toDate: Date;

      if (startDate && endDate) {
        fromDate = new Date(startDate);
        toDate = new Date(endDate);
      } else {
        // Default to last 30 days
        toDate = new Date();
        fromDate = new Date();
        fromDate.setDate(fromDate.getDate() - 30);
      }

      // Build query filter
      const deliveryFilter: any = {
        status: OrderStatus.DELIVERED,
        'deliveryTracking.actualDeliveryTime': {
          $gte: fromDate,
          $lte: toDate,
          $exists: true,
        },
      };

      // Filter by rider if specified
      if (riderId && riderId !== 'all') {
        deliveryFilter['deliveryTracking.deliveryGuyId'] = new mongoose.Types.ObjectId(riderId);
      }

      // Get delivered orders
      const deliveredOrders = await Order.find(deliveryFilter)
        .select('orderDate deliveryTracking.actualDeliveryTime')
        .lean();

      // Group data by period
      const groupedData: {
        [key: string]: { totalTime: number; count: number };
      } = {};

      deliveredOrders.forEach((order: any) => {
        if (
          order.orderDate &&
          order.deliveryTracking?.actualDeliveryTime
        ) {
          const orderTime = new Date(order.orderDate).getTime();
          const deliveryTime = new Date(
            order.deliveryTracking.actualDeliveryTime
          ).getTime();
          const timeInHours = (deliveryTime - orderTime) / (1000 * 60 * 60);

          const deliveryDate = new Date(order.deliveryTracking.actualDeliveryTime);
          let key: string;

          switch (period) {
            case 'yearly':
              key = deliveryDate.getFullYear().toString();
              break;
            case 'monthly':
              key = `${deliveryDate.getFullYear()}-${String(
                deliveryDate.getMonth() + 1
              ).padStart(2, '0')}`;
              break;
            case 'daily':
            default:
              key = deliveryDate.toISOString().split('T')[0];
              break;
          }

          if (!groupedData[key]) {
            groupedData[key] = { totalTime: 0, count: 0 };
          }

          groupedData[key].totalTime += timeInHours;
          groupedData[key].count++;
        }
      });

      // Generate all expected periods in the date range
      const allPeriods: string[] = [];
      const currentDate = new Date(fromDate);

      while (currentDate <= toDate) {
        let key: string;
        switch (period) {
          case 'yearly':
            key = currentDate.getFullYear().toString();
            if (!allPeriods.includes(key)) {
              allPeriods.push(key);
            }
            currentDate.setFullYear(currentDate.getFullYear() + 1);
            break;
          case 'monthly':
            key = `${currentDate.getFullYear()}-${String(
              currentDate.getMonth() + 1
            ).padStart(2, '0')}`;
            if (!allPeriods.includes(key)) {
              allPeriods.push(key);
            }
            currentDate.setMonth(currentDate.getMonth() + 1);
            break;
          case 'daily':
          default:
            key = currentDate.toISOString().split('T')[0];
            allPeriods.push(key);
            currentDate.setDate(currentDate.getDate() + 1);
            break;
        }
      }

      // Format data for chart with all periods
      const chartData = allPeriods.map((key) => {
        const data = groupedData[key];
        const avgHours = data ? data.totalTime / data.count : null;

        let label: string;
        switch (period) {
          case 'yearly':
            label = key;
            break;
          case 'monthly':
            const [year, month] = key.split('-');
            const monthDate = new Date(parseInt(year), parseInt(month) - 1);
            label = monthDate.toLocaleDateString('en-US', {
              month: 'short',
              year: 'numeric',
            });
            break;
          case 'daily':
          default:
            const date = new Date(key);
            label = date.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            });
            break;
        }

        return {
          period: label,
          avgTime: avgHours ? Math.round(avgHours * 10) / 10 : null,
          count: data ? data.count : 0,
        };
      });

      return {
        success: true,
        data: chartData,
      };
    } catch (error: any) {
      console.error('Error fetching average delivery time:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch average delivery time',
      };
    }
  }
);
