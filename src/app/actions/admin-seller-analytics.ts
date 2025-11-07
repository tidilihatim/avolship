'use server';

import { withDbConnection } from '@/lib/db/db-connect';
import { getCurrentUser } from './auth';
import User, { UserRole } from '@/lib/db/models/user';
import Expedition from '@/lib/db/models/expedition';
import Warehouse from '@/lib/db/models/warehouse';
import Order from '@/lib/db/models/order';
import DebtInvoice from '@/lib/db/models/invoice';
import mongoose from 'mongoose';

/**
 * Get all active warehouses for seller analytics
 */
export const getWarehousesForAnalytics = withDbConnection(async () => {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== UserRole.ADMIN) {
      return {
        success: false,
        message: 'Unauthorized. Admin access required.',
      };
    }

    const warehouses = await Warehouse.find({ isActive: true })
      .select('_id name currency country city')
      .sort({ name: 1 })
      .lean();

    return {
      success: true,
      data: warehouses.map((warehouse: any) => ({
        _id: warehouse._id.toString(),
        name: warehouse.name,
        currency: warehouse.currency,
        country: warehouse.country,
        city: warehouse.city || '',
      })),
    };
  } catch (error: any) {
    console.error('Error fetching warehouses:', error);
    return {
      success: false,
      message: error.message || 'Failed to fetch warehouses',
    };
  }
});

/**
 * Get active sellers count (Daily/Monthly/Yearly)
 * Active seller = has at least 1 expedition in the period
 */
export const getActiveSellers = withDbConnection(
  async (
    warehouseId: string,
    startDate?: string,
    endDate?: string,
    period: 'daily' | 'monthly' | 'yearly' = 'monthly'
  ) => {
    try {
      const user = await getCurrentUser();

      if (!user || user.role !== UserRole.ADMIN) {
        return {
          success: false,
          message: 'Unauthorized. Admin access required.',
        };
      }

      // Warehouse selection is required
      if (!warehouseId) {
        return {
          success: false,
          message: 'Warehouse selection is required',
        };
      }

      // Build date filter
      let fromDate: Date;
      let toDate: Date;

      if (startDate && endDate) {
        fromDate = new Date(startDate);
        toDate = new Date(endDate);
      } else {
        // Default to last 12 months
        toDate = new Date();
        fromDate = new Date();
        fromDate.setMonth(fromDate.getMonth() - 12);
      }

      // Build query filter for expeditions in this warehouse
      const expeditionFilter: any = {
        warehouseId: new mongoose.Types.ObjectId(warehouseId),
        expeditionDate: {
          $gte: fromDate,
          $lte: toDate,
        },
      };

      // Get all expeditions
      const expeditions = await Expedition.find(expeditionFilter)
        .select('expeditionDate sellerId sellerName')
        .lean();

      // Group sellers by period
      const sellersPerPeriod: {
        [key: string]: Set<string>;
      } = {};

      // Track seller names
      const sellerNamesMap: {
        [key: string]: string;
      } = {};

      expeditions.forEach((expedition: any) => {
        if (expedition.expeditionDate && expedition.sellerId) {
          const expDate = new Date(expedition.expeditionDate);
          let key: string;

          switch (period) {
            case 'daily':
              key = `${expDate.getFullYear()}-${String(
                expDate.getMonth() + 1
              ).padStart(2, '0')}-${String(expDate.getDate()).padStart(2, '0')}`;
              break;
            case 'yearly':
              key = expDate.getFullYear().toString();
              break;
            case 'monthly':
            default:
              key = `${expDate.getFullYear()}-${String(
                expDate.getMonth() + 1
              ).padStart(2, '0')}`;
              break;
          }

          if (!sellersPerPeriod[key]) {
            sellersPerPeriod[key] = new Set();
          }

          const sellerIdStr = expedition.sellerId.toString();
          sellersPerPeriod[key].add(sellerIdStr);

          // Store seller name
          if (expedition.sellerName && !sellerNamesMap[sellerIdStr]) {
            sellerNamesMap[sellerIdStr] = expedition.sellerName;
          }
        }
      });

      // Generate all expected periods in the date range
      const allPeriods: string[] = [];
      const currentDate = new Date(fromDate);

      while (currentDate <= toDate) {
        let key: string;
        switch (period) {
          case 'daily':
            key = `${currentDate.getFullYear()}-${String(
              currentDate.getMonth() + 1
            ).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
            if (!allPeriods.includes(key)) {
              allPeriods.push(key);
            }
            currentDate.setDate(currentDate.getDate() + 1);
            break;
          case 'yearly':
            key = currentDate.getFullYear().toString();
            if (!allPeriods.includes(key)) {
              allPeriods.push(key);
            }
            currentDate.setFullYear(currentDate.getFullYear() + 1);
            break;
          case 'monthly':
          default:
            key = `${currentDate.getFullYear()}-${String(
              currentDate.getMonth() + 1
            ).padStart(2, '0')}`;
            if (!allPeriods.includes(key)) {
              allPeriods.push(key);
            }
            currentDate.setMonth(currentDate.getMonth() + 1);
            break;
        }
      }

      // Format data for chart with all periods
      const chartData = allPeriods.map((key) => {
        const sellers = sellersPerPeriod[key];
        const count = sellers ? sellers.size : 0;

        let label: string;
        switch (period) {
          case 'daily':
            const [dyear, dmonth, dday] = key.split('-');
            const dayDate = new Date(parseInt(dyear), parseInt(dmonth) - 1, parseInt(dday));
            label = dayDate.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            });
            break;
          case 'yearly':
            label = key;
            break;
          case 'monthly':
          default:
            const [year, month] = key.split('-');
            const monthDate = new Date(parseInt(year), parseInt(month) - 1);
            label = monthDate.toLocaleDateString('en-US', {
              month: 'short',
              year: 'numeric',
            });
            break;
        }

        return {
          period: label,
          count,
        };
      });

      // Get all unique sellers in the period
      const allSellers = Array.from(
        new Set(
          Object.values(sellersPerPeriod).flatMap((sellerSet) =>
            Array.from(sellerSet)
          )
        )
      ).map((sellerId) => ({
        sellerId,
        sellerName: sellerNamesMap[sellerId] || 'Unknown',
      }));

      return {
        success: true,
        data: chartData,
        sellers: allSellers,
      };
    } catch (error: any) {
      console.error('Error fetching active sellers:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch active sellers',
      };
    }
  }
);

/**
 * Get inactive sellers count (Daily/Monthly/Yearly)
 * Inactive seller = registered with warehouse but no expeditions in the period
 */
export const getInactiveSellers = withDbConnection(
  async (
    warehouseId: string,
    startDate?: string,
    endDate?: string,
    period: 'daily' | 'monthly' | 'yearly' = 'monthly'
  ) => {
    try {
      const user = await getCurrentUser();

      if (!user || user.role !== UserRole.ADMIN) {
        return {
          success: false,
          message: 'Unauthorized. Admin access required.',
        };
      }

      // Warehouse selection is required
      if (!warehouseId) {
        return {
          success: false,
          message: 'Warehouse selection is required',
        };
      }

      // Build date filter
      let fromDate: Date;
      let toDate: Date;

      if (startDate && endDate) {
        fromDate = new Date(startDate);
        toDate = new Date(endDate);
      } else {
        // Default to last 12 months
        toDate = new Date();
        fromDate = new Date();
        fromDate.setMonth(fromDate.getMonth() - 12);
      }

      // Get all sellers who have ever used this warehouse
      const allWarehouseExpeditions = await Expedition.find({
        warehouseId: new mongoose.Types.ObjectId(warehouseId),
      })
        .select('sellerId sellerName')
        .lean();

      // Build a map of all sellers who have ever used this warehouse
      const allSellersMap: { [key: string]: string } = {};
      allWarehouseExpeditions.forEach((exp: any) => {
        if (exp.sellerId && exp.sellerName) {
          allSellersMap[exp.sellerId.toString()] = exp.sellerName;
        }
      });

      const allSellerIds = Object.keys(allSellersMap);

      // Get expeditions within the selected date range
      const expeditionFilter: any = {
        warehouseId: new mongoose.Types.ObjectId(warehouseId),
        expeditionDate: {
          $gte: fromDate,
          $lte: toDate,
        },
      };

      const periodExpeditions = await Expedition.find(expeditionFilter)
        .select('expeditionDate sellerId')
        .lean();

      // Track active sellers per period
      const activeSellersPerPeriod: { [key: string]: Set<string> } = {};

      periodExpeditions.forEach((expedition: any) => {
        if (expedition.expeditionDate && expedition.sellerId) {
          const expDate = new Date(expedition.expeditionDate);
          let key: string;

          switch (period) {
            case 'daily':
              key = `${expDate.getFullYear()}-${String(
                expDate.getMonth() + 1
              ).padStart(2, '0')}-${String(expDate.getDate()).padStart(2, '0')}`;
              break;
            case 'yearly':
              key = expDate.getFullYear().toString();
              break;
            case 'monthly':
            default:
              key = `${expDate.getFullYear()}-${String(
                expDate.getMonth() + 1
              ).padStart(2, '0')}`;
              break;
          }

          if (!activeSellersPerPeriod[key]) {
            activeSellersPerPeriod[key] = new Set();
          }

          activeSellersPerPeriod[key].add(expedition.sellerId.toString());
        }
      });

      // Generate all expected periods in the date range
      const allPeriods: string[] = [];
      const currentDate = new Date(fromDate);

      while (currentDate <= toDate) {
        let key: string;
        switch (period) {
          case 'daily':
            key = `${currentDate.getFullYear()}-${String(
              currentDate.getMonth() + 1
            ).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
            if (!allPeriods.includes(key)) {
              allPeriods.push(key);
            }
            currentDate.setDate(currentDate.getDate() + 1);
            break;
          case 'yearly':
            key = currentDate.getFullYear().toString();
            if (!allPeriods.includes(key)) {
              allPeriods.push(key);
            }
            currentDate.setFullYear(currentDate.getFullYear() + 1);
            break;
          case 'monthly':
          default:
            key = `${currentDate.getFullYear()}-${String(
              currentDate.getMonth() + 1
            ).padStart(2, '0')}`;
            if (!allPeriods.includes(key)) {
              allPeriods.push(key);
            }
            currentDate.setMonth(currentDate.getMonth() + 1);
            break;
        }
      }

      // Calculate inactive sellers per period
      const chartData = allPeriods.map((key) => {
        const activeSellers = activeSellersPerPeriod[key] || new Set();
        const inactiveCount = allSellerIds.length - activeSellers.size;

        let label: string;
        switch (period) {
          case 'daily':
            const [dyear, dmonth, dday] = key.split('-');
            const dayDate = new Date(parseInt(dyear), parseInt(dmonth) - 1, parseInt(dday));
            label = dayDate.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            });
            break;
          case 'yearly':
            label = key;
            break;
          case 'monthly':
          default:
            const [year, month] = key.split('-');
            const monthDate = new Date(parseInt(year), parseInt(month) - 1);
            label = monthDate.toLocaleDateString('en-US', {
              month: 'short',
              year: 'numeric',
            });
            break;
        }

        return {
          period: label,
          count: inactiveCount,
        };
      });

      // Get list of sellers who were inactive during the entire period
      const activeInPeriod = new Set(
        Object.values(activeSellersPerPeriod).flatMap((sellerSet) =>
          Array.from(sellerSet)
        )
      );

      const inactiveSellers = allSellerIds
        .filter((sellerId) => !activeInPeriod.has(sellerId))
        .map((sellerId) => ({
          sellerId,
          sellerName: allSellersMap[sellerId] || 'Unknown',
        }));

      return {
        success: true,
        data: chartData,
        sellers: inactiveSellers,
      };
    } catch (error: any) {
      console.error('Error fetching inactive sellers:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch inactive sellers',
      };
    }
  }
);

/**
 * Get new sellers this week
 * New seller = seller who placed their first ever order with this warehouse this week
 */
export const getNewSellersThisWeek = withDbConnection(
  async (warehouseId: string) => {
    try {
      const user = await getCurrentUser();

      if (!user || user.role !== UserRole.ADMIN) {
        return {
          success: false,
          message: 'Unauthorized. Admin access required.',
        };
      }

      // Warehouse selection is required
      if (!warehouseId) {
        return {
          success: false,
          message: 'Warehouse selection is required',
        };
      }

      // Get this week's date range (Sunday to today)
      const now = new Date();
      const today = now.getDay();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(startOfWeek.getDate() - today);
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(now);
      endOfWeek.setHours(23, 59, 59, 999);

      // Get all orders for this warehouse this week
      const thisWeekOrders = await Order.find({
        warehouseId: new mongoose.Types.ObjectId(warehouseId),
        orderDate: {
          $gte: startOfWeek,
          $lte: endOfWeek,
        },
      })
        .select('sellerId orderDate')
        .sort({ orderDate: 1 })
        .lean();

      // Track unique sellers who placed orders this week
      const sellersThisWeek: { [key: string]: Date } = {};

      thisWeekOrders.forEach((order: any) => {
        if (order.sellerId) {
          const sellerId = order.sellerId.toString();
          if (!sellersThisWeek[sellerId]) {
            sellersThisWeek[sellerId] = new Date(order.orderDate);
          }
        }
      });

      const sellerIds = Object.keys(sellersThisWeek);

      // For each seller, check if they had any orders before this week
      const newSellers: Array<{ sellerId: string; sellerName: string }> = [];

      for (const sellerId of sellerIds) {
        const priorOrder = await Order.findOne({
          warehouseId: new mongoose.Types.ObjectId(warehouseId),
          sellerId: new mongoose.Types.ObjectId(sellerId),
          orderDate: { $lt: startOfWeek },
        });

        // If no prior order, this is a new seller
        if (!priorOrder) {
          // Get seller name from User model
          const seller:any = await User.findById(sellerId).select('name').lean();
          newSellers.push({
            sellerId,
            sellerName: seller?.name || 'Unknown',
          });
        }
      }

      return {
        success: true,
        count: newSellers.length,
        sellers: newSellers,
      };
    } catch (error: any) {
      console.error('Error fetching new sellers this week:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch new sellers this week',
      };
    }
  }
);

/**
 * Get orders per seller (Daily/Monthly/Yearly)
 * Can filter by specific seller or show all sellers
 */
export const getOrdersPerSeller = withDbConnection(
  async (
    warehouseId: string,
    startDate?: string,
    endDate?: string,
    period: 'daily' | 'monthly' | 'yearly' = 'monthly',
    sellerId?: string
  ) => {
    try {
      const user = await getCurrentUser();

      if (!user || user.role !== UserRole.ADMIN) {
        return {
          success: false,
          message: 'Unauthorized. Admin access required.',
        };
      }

      // Warehouse selection is required
      if (!warehouseId) {
        return {
          success: false,
          message: 'Warehouse selection is required',
        };
      }

      // Build date filter
      let fromDate: Date;
      let toDate: Date;

      if (startDate && endDate) {
        fromDate = new Date(startDate);
        toDate = new Date(endDate);
      } else {
        // Default to this year
        toDate = new Date();
        fromDate = new Date(toDate.getFullYear(), 0, 1);
      }

      // Build order filter
      const orderFilter: any = {
        warehouseId: new mongoose.Types.ObjectId(warehouseId),
        orderDate: {
          $gte: fromDate,
          $lte: toDate,
        },
      };

      // Add seller filter if specific seller is selected
      if (sellerId) {
        orderFilter.sellerId = new mongoose.Types.ObjectId(sellerId);
      }

      // Get orders
      const orders = await Order.find(orderFilter)
        .select('orderDate sellerId')
        .lean();

      // Group orders by period
      const ordersPerPeriod: { [key: string]: number } = {};

      orders.forEach((order: any) => {
        if (order.orderDate) {
          const orderDate = new Date(order.orderDate);
          let key: string;

          switch (period) {
            case 'daily':
              key = `${orderDate.getFullYear()}-${String(
                orderDate.getMonth() + 1
              ).padStart(2, '0')}-${String(orderDate.getDate()).padStart(2, '0')}`;
              break;
            case 'yearly':
              key = orderDate.getFullYear().toString();
              break;
            case 'monthly':
            default:
              key = `${orderDate.getFullYear()}-${String(
                orderDate.getMonth() + 1
              ).padStart(2, '0')}`;
              break;
          }

          ordersPerPeriod[key] = (ordersPerPeriod[key] || 0) + 1;
        }
      });

      // Generate all expected periods in the date range
      const allPeriods: string[] = [];
      const currentDate = new Date(fromDate);

      while (currentDate <= toDate) {
        let key: string;
        switch (period) {
          case 'daily':
            key = `${currentDate.getFullYear()}-${String(
              currentDate.getMonth() + 1
            ).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
            if (!allPeriods.includes(key)) {
              allPeriods.push(key);
            }
            currentDate.setDate(currentDate.getDate() + 1);
            break;
          case 'yearly':
            key = currentDate.getFullYear().toString();
            if (!allPeriods.includes(key)) {
              allPeriods.push(key);
            }
            currentDate.setFullYear(currentDate.getFullYear() + 1);
            break;
          case 'monthly':
          default:
            key = `${currentDate.getFullYear()}-${String(
              currentDate.getMonth() + 1
            ).padStart(2, '0')}`;
            if (!allPeriods.includes(key)) {
              allPeriods.push(key);
            }
            currentDate.setMonth(currentDate.getMonth() + 1);
            break;
        }
      }

      // Format data for chart
      const chartData = allPeriods.map((key) => {
        const count = ordersPerPeriod[key] || 0;

        let label: string;
        switch (period) {
          case 'daily':
            const [dyear, dmonth, dday] = key.split('-');
            const dayDate = new Date(parseInt(dyear), parseInt(dmonth) - 1, parseInt(dday));
            label = dayDate.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            });
            break;
          case 'yearly':
            label = key;
            break;
          case 'monthly':
          default:
            const [year, month] = key.split('-');
            const monthDate = new Date(parseInt(year), parseInt(month) - 1);
            label = monthDate.toLocaleDateString('en-US', {
              month: 'short',
              year: 'numeric',
            });
            break;
        }

        return {
          period: label,
          count,
        };
      });

      // Get all unique seller IDs who have orders in this warehouse
      const uniqueSellerIds = await Order.distinct('sellerId', {
        warehouseId: new mongoose.Types.ObjectId(warehouseId),
      });

      // Get seller details from User model
      const sellers = await User.find({
        _id: { $in: uniqueSellerIds },
      })
        .select('_id name')
        .sort({ name: 1 })
        .lean();

      const sellersFormatted = sellers.map((s: any) => ({
        sellerId: s._id.toString(),
        sellerName: s.name || 'Unknown',
      }));

      return {
        success: true,
        data: chartData,
        sellers: sellersFormatted,
        totalOrders: orders.length,
      };
    } catch (error: any) {
      console.error('Error fetching orders per seller:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch orders per seller',
      };
    }
  }
);

/**
 * Get seller confirmation rate (Daily/Monthly/Yearly)
 * Confirmation rate = (Confirmed orders / Total orders) * 100
 */
export const getSellerConfirmationRate = withDbConnection(
  async (
    warehouseId: string,
    startDate?: string,
    endDate?: string,
    period: 'daily' | 'monthly' | 'yearly' = 'monthly',
    sellerId?: string
  ) => {
    try {
      const user = await getCurrentUser();

      if (!user || user.role !== UserRole.ADMIN) {
        return {
          success: false,
          message: 'Unauthorized. Admin access required.',
        };
      }

      // Warehouse selection is required
      if (!warehouseId) {
        return {
          success: false,
          message: 'Warehouse selection is required',
        };
      }

      // Build date filter
      let fromDate: Date;
      let toDate: Date;

      if (startDate && endDate) {
        fromDate = new Date(startDate);
        toDate = new Date(endDate);
      } else {
        // Default to this year
        toDate = new Date();
        fromDate = new Date(toDate.getFullYear(), 0, 1);
      }

      // Build order filter
      const orderFilter: any = {
        warehouseId: new mongoose.Types.ObjectId(warehouseId),
        orderDate: {
          $gte: fromDate,
          $lte: toDate,
        },
      };

      // Add seller filter if specific seller is selected
      if (sellerId) {
        orderFilter.sellerId = new mongoose.Types.ObjectId(sellerId);
      }

      // Get all orders
      const allOrders = await Order.find(orderFilter)
        .select('orderDate status')
        .lean();

      // Get confirmed orders (including all statuses that come after successful confirmation)
      // Excluded: pending, cancelled, wrong_number, double, unreached, expired (these are not confirmed)
      const confirmedOrders = await Order.find({
        ...orderFilter,
        status: {
          $in: [
            'confirmed',
            'shipped',
            'assigned_to_delivery',
            'accepted_by_delivery',
            'in_transit',
            'out_for_delivery',
            'delivered',
            'delivery_failed', // Order was confirmed but delivery failed
            'refunded', // Order was confirmed but later refunded
          ]
        },
      })
        .select('orderDate')
        .lean();

      // Group orders by period
      const totalOrdersPerPeriod: { [key: string]: number } = {};
      const confirmedOrdersPerPeriod: { [key: string]: number } = {};

      // Count all orders per period
      allOrders.forEach((order: any) => {
        if (order.orderDate) {
          const orderDate = new Date(order.orderDate);
          let key: string;

          switch (period) {
            case 'daily':
              key = `${orderDate.getFullYear()}-${String(
                orderDate.getMonth() + 1
              ).padStart(2, '0')}-${String(orderDate.getDate()).padStart(2, '0')}`;
              break;
            case 'yearly':
              key = orderDate.getFullYear().toString();
              break;
            case 'monthly':
            default:
              key = `${orderDate.getFullYear()}-${String(
                orderDate.getMonth() + 1
              ).padStart(2, '0')}`;
              break;
          }

          totalOrdersPerPeriod[key] = (totalOrdersPerPeriod[key] || 0) + 1;
        }
      });

      // Count confirmed orders per period
      confirmedOrders.forEach((order: any) => {
        if (order.orderDate) {
          const orderDate = new Date(order.orderDate);
          let key: string;

          switch (period) {
            case 'daily':
              key = `${orderDate.getFullYear()}-${String(
                orderDate.getMonth() + 1
              ).padStart(2, '0')}-${String(orderDate.getDate()).padStart(2, '0')}`;
              break;
            case 'yearly':
              key = orderDate.getFullYear().toString();
              break;
            case 'monthly':
            default:
              key = `${orderDate.getFullYear()}-${String(
                orderDate.getMonth() + 1
              ).padStart(2, '0')}`;
              break;
          }

          confirmedOrdersPerPeriod[key] = (confirmedOrdersPerPeriod[key] || 0) + 1;
        }
      });

      // Generate all expected periods in the date range
      const allPeriods: string[] = [];
      const currentDate = new Date(fromDate);

      while (currentDate <= toDate) {
        let key: string;
        switch (period) {
          case 'daily':
            key = `${currentDate.getFullYear()}-${String(
              currentDate.getMonth() + 1
            ).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
            if (!allPeriods.includes(key)) {
              allPeriods.push(key);
            }
            currentDate.setDate(currentDate.getDate() + 1);
            break;
          case 'yearly':
            key = currentDate.getFullYear().toString();
            if (!allPeriods.includes(key)) {
              allPeriods.push(key);
            }
            currentDate.setFullYear(currentDate.getFullYear() + 1);
            break;
          case 'monthly':
          default:
            key = `${currentDate.getFullYear()}-${String(
              currentDate.getMonth() + 1
            ).padStart(2, '0')}`;
            if (!allPeriods.includes(key)) {
              allPeriods.push(key);
            }
            currentDate.setMonth(currentDate.getMonth() + 1);
            break;
        }
      }

      // Calculate confirmation rate per period
      const chartData = allPeriods.map((key) => {
        const total = totalOrdersPerPeriod[key] || 0;
        const confirmed = confirmedOrdersPerPeriod[key] || 0;
        const rate = total > 0 ? Math.round((confirmed / total) * 100) : null;

        let label: string;
        switch (period) {
          case 'daily':
            const [dyear, dmonth, dday] = key.split('-');
            const dayDate = new Date(parseInt(dyear), parseInt(dmonth) - 1, parseInt(dday));
            label = dayDate.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            });
            break;
          case 'yearly':
            label = key;
            break;
          case 'monthly':
          default:
            const [year, month] = key.split('-');
            const monthDate = new Date(parseInt(year), parseInt(month) - 1);
            label = monthDate.toLocaleDateString('en-US', {
              month: 'short',
              year: 'numeric',
            });
            break;
        }

        return {
          period: label,
          rate,
          total,
          confirmed,
        };
      });

      // Get all sellers who have orders in this warehouse
      const uniqueSellerIds = await Order.distinct('sellerId', {
        warehouseId: new mongoose.Types.ObjectId(warehouseId),
      });

      // Get seller details from User model
      const sellers = await User.find({
        _id: { $in: uniqueSellerIds },
      })
        .select('_id name')
        .sort({ name: 1 })
        .lean();

      const sellersFormatted = sellers.map((s: any) => ({
        sellerId: s._id.toString(),
        sellerName: s.name || 'Unknown',
      }));

      // Calculate overall rate
      const totalAll = allOrders.length;
      const confirmedAll = confirmedOrders.length;
      const overallRate = totalAll > 0 ? Math.round((confirmedAll / totalAll) * 100) : 0;

      return {
        success: true,
        data: chartData,
        sellers: sellersFormatted,
        overallRate,
        totalOrders: totalAll,
        confirmedOrders: confirmedAll,
      };
    } catch (error: any) {
      console.error('Error fetching seller confirmation rate:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch seller confirmation rate',
      };
    }
  }
);

/**
 * Get seller delivery rate (Daily/Monthly/Yearly)
 * Delivery rate = (Delivered orders / Total orders) * 100
 */
export const getSellerDeliveryRate = withDbConnection(
  async (
    warehouseId: string,
    startDate?: string,
    endDate?: string,
    period: 'daily' | 'monthly' | 'yearly' = 'monthly',
    sellerId?: string
  ) => {
    try {
      const user = await getCurrentUser();

      if (!user || user.role !== UserRole.ADMIN) {
        return {
          success: false,
          message: 'Unauthorized. Admin access required.',
        };
      }

      // Warehouse selection is required
      if (!warehouseId) {
        return {
          success: false,
          message: 'Warehouse selection is required',
        };
      }

      // Build date filter
      let fromDate: Date;
      let toDate: Date;

      if (startDate && endDate) {
        fromDate = new Date(startDate);
        toDate = new Date(endDate);
      } else {
        // Default to this year
        toDate = new Date();
        fromDate = new Date(toDate.getFullYear(), 0, 1);
      }

      // Build order filter
      const orderFilter: any = {
        warehouseId: new mongoose.Types.ObjectId(warehouseId),
        orderDate: {
          $gte: fromDate,
          $lte: toDate,
        },
      };

      // Add seller filter if specific seller is selected
      if (sellerId) {
        orderFilter.sellerId = new mongoose.Types.ObjectId(sellerId);
      }

      // Get all orders
      const allOrders = await Order.find(orderFilter)
        .select('orderDate status')
        .lean();

      // Get delivered orders
      const deliveredOrders = await Order.find({
        ...orderFilter,
        status: 'delivered',
      })
        .select('orderDate')
        .lean();

      // Group orders by period
      const totalOrdersPerPeriod: { [key: string]: number } = {};
      const deliveredOrdersPerPeriod: { [key: string]: number } = {};

      // Count all orders per period
      allOrders.forEach((order: any) => {
        if (order.orderDate) {
          const orderDate = new Date(order.orderDate);
          let key: string;

          switch (period) {
            case 'daily':
              key = `${orderDate.getFullYear()}-${String(
                orderDate.getMonth() + 1
              ).padStart(2, '0')}-${String(orderDate.getDate()).padStart(2, '0')}`;
              break;
            case 'yearly':
              key = orderDate.getFullYear().toString();
              break;
            case 'monthly':
            default:
              key = `${orderDate.getFullYear()}-${String(
                orderDate.getMonth() + 1
              ).padStart(2, '0')}`;
              break;
          }

          totalOrdersPerPeriod[key] = (totalOrdersPerPeriod[key] || 0) + 1;
        }
      });

      // Count delivered orders per period
      deliveredOrders.forEach((order: any) => {
        if (order.orderDate) {
          const orderDate = new Date(order.orderDate);
          let key: string;

          switch (period) {
            case 'daily':
              key = `${orderDate.getFullYear()}-${String(
                orderDate.getMonth() + 1
              ).padStart(2, '0')}-${String(orderDate.getDate()).padStart(2, '0')}`;
              break;
            case 'yearly':
              key = orderDate.getFullYear().toString();
              break;
            case 'monthly':
            default:
              key = `${orderDate.getFullYear()}-${String(
                orderDate.getMonth() + 1
              ).padStart(2, '0')}`;
              break;
          }

          deliveredOrdersPerPeriod[key] = (deliveredOrdersPerPeriod[key] || 0) + 1;
        }
      });

      // Generate all expected periods in the date range
      const allPeriods: string[] = [];
      const currentDate = new Date(fromDate);

      while (currentDate <= toDate) {
        let key: string;
        switch (period) {
          case 'daily':
            key = `${currentDate.getFullYear()}-${String(
              currentDate.getMonth() + 1
            ).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
            if (!allPeriods.includes(key)) {
              allPeriods.push(key);
            }
            currentDate.setDate(currentDate.getDate() + 1);
            break;
          case 'yearly':
            key = currentDate.getFullYear().toString();
            if (!allPeriods.includes(key)) {
              allPeriods.push(key);
            }
            currentDate.setFullYear(currentDate.getFullYear() + 1);
            break;
          case 'monthly':
          default:
            key = `${currentDate.getFullYear()}-${String(
              currentDate.getMonth() + 1
            ).padStart(2, '0')}`;
            if (!allPeriods.includes(key)) {
              allPeriods.push(key);
            }
            currentDate.setMonth(currentDate.getMonth() + 1);
            break;
        }
      }

      // Calculate delivery rate per period
      const chartData = allPeriods.map((key) => {
        const total = totalOrdersPerPeriod[key] || 0;
        const delivered = deliveredOrdersPerPeriod[key] || 0;
        const rate = total > 0 ? Math.round((delivered / total) * 100) : null;

        let label: string;
        switch (period) {
          case 'daily':
            const [dyear, dmonth, dday] = key.split('-');
            const dayDate = new Date(parseInt(dyear), parseInt(dmonth) - 1, parseInt(dday));
            label = dayDate.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            });
            break;
          case 'yearly':
            label = key;
            break;
          case 'monthly':
          default:
            const [year, month] = key.split('-');
            const monthDate = new Date(parseInt(year), parseInt(month) - 1);
            label = monthDate.toLocaleDateString('en-US', {
              month: 'short',
              year: 'numeric',
            });
            break;
        }

        return {
          period: label,
          rate,
          total,
          delivered,
        };
      });

      // Get all sellers who have orders in this warehouse
      const uniqueSellerIds = await Order.distinct('sellerId', {
        warehouseId: new mongoose.Types.ObjectId(warehouseId),
      });

      // Get seller details from User model
      const sellers = await User.find({
        _id: { $in: uniqueSellerIds },
      })
        .select('_id name')
        .sort({ name: 1 })
        .lean();

      const sellersFormatted = sellers.map((s: any) => ({
        sellerId: s._id.toString(),
        sellerName: s.name || 'Unknown',
      }));

      // Calculate overall rate
      const totalAll = allOrders.length;
      const deliveredAll = deliveredOrders.length;
      const overallRate = totalAll > 0 ? Math.round((deliveredAll / totalAll) * 100) : 0;

      return {
        success: true,
        data: chartData,
        sellers: sellersFormatted,
        overallRate,
        totalOrders: totalAll,
        deliveredOrders: deliveredAll,
      };
    } catch (error: any) {
      console.error('Error fetching seller delivery rate:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch seller delivery rate',
      };
    }
  }
);

/**
 * Get seller return rate (Daily/Monthly/Yearly)
 * Return rate = (Refunded orders / Total orders) * 100
 */
export const getSellerReturnRate = withDbConnection(
  async (
    warehouseId: string,
    startDate?: string,
    endDate?: string,
    period: 'daily' | 'monthly' | 'yearly' = 'monthly',
    sellerId?: string
  ) => {
    try {
      const user = await getCurrentUser();

      if (!user || user.role !== UserRole.ADMIN) {
        return {
          success: false,
          message: 'Unauthorized. Admin access required.',
        };
      }

      // Warehouse selection is required
      if (!warehouseId) {
        return {
          success: false,
          message: 'Warehouse selection is required',
        };
      }

      // Build date filter
      let fromDate: Date;
      let toDate: Date;

      if (startDate && endDate) {
        fromDate = new Date(startDate);
        toDate = new Date(endDate);
      } else {
        // Default to this year
        toDate = new Date();
        fromDate = new Date(toDate.getFullYear(), 0, 1);
      }

      // Build order filter
      const orderFilter: any = {
        warehouseId: new mongoose.Types.ObjectId(warehouseId),
        orderDate: {
          $gte: fromDate,
          $lte: toDate,
        },
      };

      // Add seller filter if specific seller is selected
      if (sellerId) {
        orderFilter.sellerId = new mongoose.Types.ObjectId(sellerId);
      }

      // Get all orders
      const allOrders = await Order.find(orderFilter)
        .select('orderDate status')
        .lean();

      // Get refunded/returned orders
      const returnedOrders = await Order.find({
        ...orderFilter,
        status: 'refunded',
      })
        .select('orderDate')
        .lean();

      // Group orders by period
      const totalOrdersPerPeriod: { [key: string]: number } = {};
      const returnedOrdersPerPeriod: { [key: string]: number } = {};

      // Count all orders per period
      allOrders.forEach((order: any) => {
        if (order.orderDate) {
          const orderDate = new Date(order.orderDate);
          let key: string;

          switch (period) {
            case 'daily':
              key = `${orderDate.getFullYear()}-${String(
                orderDate.getMonth() + 1
              ).padStart(2, '0')}-${String(orderDate.getDate()).padStart(2, '0')}`;
              break;
            case 'yearly':
              key = orderDate.getFullYear().toString();
              break;
            case 'monthly':
            default:
              key = `${orderDate.getFullYear()}-${String(
                orderDate.getMonth() + 1
              ).padStart(2, '0')}`;
              break;
          }

          totalOrdersPerPeriod[key] = (totalOrdersPerPeriod[key] || 0) + 1;
        }
      });

      // Count returned orders per period
      returnedOrders.forEach((order: any) => {
        if (order.orderDate) {
          const orderDate = new Date(order.orderDate);
          let key: string;

          switch (period) {
            case 'daily':
              key = `${orderDate.getFullYear()}-${String(
                orderDate.getMonth() + 1
              ).padStart(2, '0')}-${String(orderDate.getDate()).padStart(2, '0')}`;
              break;
            case 'yearly':
              key = orderDate.getFullYear().toString();
              break;
            case 'monthly':
            default:
              key = `${orderDate.getFullYear()}-${String(
                orderDate.getMonth() + 1
              ).padStart(2, '0')}`;
              break;
          }

          returnedOrdersPerPeriod[key] = (returnedOrdersPerPeriod[key] || 0) + 1;
        }
      });

      // Generate all expected periods in the date range
      const allPeriods: string[] = [];
      const currentDate = new Date(fromDate);

      while (currentDate <= toDate) {
        let key: string;
        switch (period) {
          case 'daily':
            key = `${currentDate.getFullYear()}-${String(
              currentDate.getMonth() + 1
            ).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
            if (!allPeriods.includes(key)) {
              allPeriods.push(key);
            }
            currentDate.setDate(currentDate.getDate() + 1);
            break;
          case 'yearly':
            key = currentDate.getFullYear().toString();
            if (!allPeriods.includes(key)) {
              allPeriods.push(key);
            }
            currentDate.setFullYear(currentDate.getFullYear() + 1);
            break;
          case 'monthly':
          default:
            key = `${currentDate.getFullYear()}-${String(
              currentDate.getMonth() + 1
            ).padStart(2, '0')}`;
            if (!allPeriods.includes(key)) {
              allPeriods.push(key);
            }
            currentDate.setMonth(currentDate.getMonth() + 1);
            break;
        }
      }

      // Calculate return rate per period
      const chartData = allPeriods.map((key) => {
        const total = totalOrdersPerPeriod[key] || 0;
        const returned = returnedOrdersPerPeriod[key] || 0;
        const rate = total > 0 ? Math.round((returned / total) * 100) : null;

        let label: string;
        switch (period) {
          case 'daily':
            const [dyear, dmonth, dday] = key.split('-');
            const dayDate = new Date(parseInt(dyear), parseInt(dmonth) - 1, parseInt(dday));
            label = dayDate.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            });
            break;
          case 'yearly':
            label = key;
            break;
          case 'monthly':
          default:
            const [year, month] = key.split('-');
            const monthDate = new Date(parseInt(year), parseInt(month) - 1);
            label = monthDate.toLocaleDateString('en-US', {
              month: 'short',
              year: 'numeric',
            });
            break;
        }

        return {
          period: label,
          rate,
          total,
          returned,
        };
      });

      // Get all sellers who have orders in this warehouse
      const uniqueSellerIds = await Order.distinct('sellerId', {
        warehouseId: new mongoose.Types.ObjectId(warehouseId),
      });

      // Get seller details from User model
      const sellers = await User.find({
        _id: { $in: uniqueSellerIds },
      })
        .select('_id name')
        .sort({ name: 1 })
        .lean();

      const sellersFormatted = sellers.map((s: any) => ({
        sellerId: s._id.toString(),
        sellerName: s.name || 'Unknown',
      }));

      // Calculate overall rate
      const totalAll = allOrders.length;
      const returnedAll = returnedOrders.length;
      const overallRate = totalAll > 0 ? Math.round((returnedAll / totalAll) * 100) : 0;

      return {
        success: true,
        data: chartData,
        sellers: sellersFormatted,
        overallRate,
        totalOrders: totalAll,
        returnedOrders: returnedAll,
      };
    } catch (error: any) {
      console.error('Error fetching seller return rate:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch seller return rate',
      };
    }
  }
);

/**
 * Get processed orders count (Daily/Monthly/Yearly)
 * Processed orders = Orders included in invoices
 */
export const getProcessedOrders = withDbConnection(
  async (
    warehouseId: string,
    startDate?: string,
    endDate?: string,
    period: 'daily' | 'monthly' | 'yearly' = 'monthly',
    sellerId?: string,
    invoiceStatus?: string
  ) => {
    try {
      const user = await getCurrentUser();

      if (!user || user.role !== UserRole.ADMIN) {
        return {
          success: false,
          message: 'Unauthorized. Admin access required.',
        };
      }

      // Warehouse selection is required
      if (!warehouseId) {
        return {
          success: false,
          message: 'Warehouse selection is required',
        };
      }

      // Build date filter
      let fromDate: Date;
      let toDate: Date;

      if (startDate && endDate) {
        fromDate = new Date(startDate);
        toDate = new Date(endDate);
      } else {
        // Default to this year
        toDate = new Date();
        fromDate = new Date(toDate.getFullYear(), 0, 1);
      }

      // Build invoice filter
      const invoiceFilter: any = {
        warehouseId: new mongoose.Types.ObjectId(warehouseId),
        periodStart: {
          $gte: fromDate,
          $lte: toDate,
        },
      };

      // Add seller filter if specific seller is selected
      if (sellerId) {
        invoiceFilter.sellerId = new mongoose.Types.ObjectId(sellerId);
      }

      // Add status filter if specific status is selected
      if (invoiceStatus && invoiceStatus !== 'all') {
        invoiceFilter.status = invoiceStatus;
      }

      // Get all invoices in the period
      const invoices = await DebtInvoice.find(invoiceFilter)
        .select('orderIds periodStart sellerId')
        .lean();

      // Track processed orders per period
      const processedOrdersPerPeriod: { [key: string]: Set<string> } = {};

      // Iterate through invoices and count orders by period
      invoices.forEach((invoice: any) => {
        if (invoice.orderIds && invoice.orderIds.length > 0 && invoice.periodStart) {
          const periodDate = new Date(invoice.periodStart);
          let key: string;

          switch (period) {
            case 'daily':
              key = `${periodDate.getFullYear()}-${String(
                periodDate.getMonth() + 1
              ).padStart(2, '0')}-${String(periodDate.getDate()).padStart(2, '0')}`;
              break;
            case 'yearly':
              key = periodDate.getFullYear().toString();
              break;
            case 'monthly':
            default:
              key = `${periodDate.getFullYear()}-${String(
                periodDate.getMonth() + 1
              ).padStart(2, '0')}`;
              break;
          }

          if (!processedOrdersPerPeriod[key]) {
            processedOrdersPerPeriod[key] = new Set();
          }

          // Add each order ID to the set (automatically handles duplicates)
          invoice.orderIds.forEach((orderId: any) => {
            processedOrdersPerPeriod[key].add(orderId.toString());
          });
        }
      });

      // Generate all expected periods in the date range
      const allPeriods: string[] = [];
      const currentDate = new Date(fromDate);

      while (currentDate <= toDate) {
        let key: string;
        switch (period) {
          case 'daily':
            key = `${currentDate.getFullYear()}-${String(
              currentDate.getMonth() + 1
            ).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
            if (!allPeriods.includes(key)) {
              allPeriods.push(key);
            }
            currentDate.setDate(currentDate.getDate() + 1);
            break;
          case 'yearly':
            key = currentDate.getFullYear().toString();
            if (!allPeriods.includes(key)) {
              allPeriods.push(key);
            }
            currentDate.setFullYear(currentDate.getFullYear() + 1);
            break;
          case 'monthly':
          default:
            key = `${currentDate.getFullYear()}-${String(
              currentDate.getMonth() + 1
            ).padStart(2, '0')}`;
            if (!allPeriods.includes(key)) {
              allPeriods.push(key);
            }
            currentDate.setMonth(currentDate.getMonth() + 1);
            break;
        }
      }

      // Format data for chart
      const chartData = allPeriods.map((key) => {
        const processedOrders = processedOrdersPerPeriod[key];
        const count = processedOrders ? processedOrders.size : 0;

        let label: string;
        switch (period) {
          case 'daily':
            const [dyear, dmonth, dday] = key.split('-');
            const dayDate = new Date(parseInt(dyear), parseInt(dmonth) - 1, parseInt(dday));
            label = dayDate.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            });
            break;
          case 'yearly':
            label = key;
            break;
          case 'monthly':
          default:
            const [year, month] = key.split('-');
            const monthDate = new Date(parseInt(year), parseInt(month) - 1);
            label = monthDate.toLocaleDateString('en-US', {
              month: 'short',
              year: 'numeric',
            });
            break;
        }

        return {
          period: label,
          count,
        };
      });

      // Get all sellers who have invoices in this warehouse
      const uniqueSellerIds = await DebtInvoice.distinct('sellerId', {
        warehouseId: new mongoose.Types.ObjectId(warehouseId),
      });

      // Get seller details from User model
      const sellers = await User.find({
        _id: { $in: uniqueSellerIds },
      })
        .select('_id name')
        .sort({ name: 1 })
        .lean();

      const sellersFormatted = sellers.map((s: any) => ({
        sellerId: s._id.toString(),
        sellerName: s.name || 'Unknown',
      }));

      // Calculate total processed orders (deduplicated)
      const totalProcessed = Array.from(
        new Set(
          invoices.flatMap((inv: any) =>
            inv.orderIds.map((id: any) => id.toString())
          )
        )
      ).length;

      return {
        success: true,
        data: chartData,
        sellers: sellersFormatted,
        totalProcessed,
      };
    } catch (error: any) {
      console.error('Error fetching processed orders:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch processed orders',
      };
    }
  }
);

/**
 * Get seller revenue (processed amount) (Daily/Monthly/Yearly)
 * Revenue = Net payment from invoices (total sales - all fees and deductions)
 */
export const getSellerRevenue = withDbConnection(
  async (
    warehouseId: string,
    startDate?: string,
    endDate?: string,
    period: 'daily' | 'monthly' | 'yearly' = 'monthly',
    sellerId?: string,
    invoiceStatus?: string
  ) => {
    try {
      const user = await getCurrentUser();

      if (!user || user.role !== UserRole.ADMIN) {
        return {
          success: false,
          message: 'Unauthorized. Admin access required.',
        };
      }

      // Warehouse selection is required
      if (!warehouseId) {
        return {
          success: false,
          message: 'Warehouse selection is required',
        };
      }

      // Build date filter
      let fromDate: Date;
      let toDate: Date;

      if (startDate && endDate) {
        fromDate = new Date(startDate);
        toDate = new Date(endDate);
      } else {
        // Default to this year
        toDate = new Date();
        fromDate = new Date(toDate.getFullYear(), 0, 1);
      }

      // Build invoice filter
      const invoiceFilter: any = {
        warehouseId: new mongoose.Types.ObjectId(warehouseId),
        periodStart: {
          $gte: fromDate,
          $lte: toDate,
        },
      };

      // Add seller filter if specific seller is selected
      if (sellerId) {
        invoiceFilter.sellerId = new mongoose.Types.ObjectId(sellerId);
      }

      // Add status filter if specific status is selected
      if (invoiceStatus && invoiceStatus !== 'all') {
        invoiceFilter.status = invoiceStatus;
      }

      // Get all invoices in the period
      const invoices = await DebtInvoice.find(invoiceFilter)
        .select('summary.netPayment summary.grossSales summary.totalDeductions periodStart sellerId currency')
        .lean();

      // Track revenue per period
      const revenuePerPeriod: { [key: string]: number } = {};

      // Iterate through invoices and sum revenue by period
      invoices.forEach((invoice: any) => {
        if (invoice.summary && invoice.periodStart) {
          const periodDate = new Date(invoice.periodStart);
          let key: string;

          switch (period) {
            case 'daily':
              key = `${periodDate.getFullYear()}-${String(
                periodDate.getMonth() + 1
              ).padStart(2, '0')}-${String(periodDate.getDate()).padStart(2, '0')}`;
              break;
            case 'yearly':
              key = periodDate.getFullYear().toString();
              break;
            case 'monthly':
            default:
              key = `${periodDate.getFullYear()}-${String(
                periodDate.getMonth() + 1
              ).padStart(2, '0')}`;
              break;
          }

          if (!revenuePerPeriod[key]) {
            revenuePerPeriod[key] = 0;
          }

          // Add net payment (revenue after all fees)
          revenuePerPeriod[key] += invoice.summary.netPayment || 0;
        }
      });

      // Generate all expected periods in the date range
      const allPeriods: string[] = [];
      const currentDate = new Date(fromDate);

      while (currentDate <= toDate) {
        let key: string;
        switch (period) {
          case 'daily':
            key = `${currentDate.getFullYear()}-${String(
              currentDate.getMonth() + 1
            ).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
            if (!allPeriods.includes(key)) {
              allPeriods.push(key);
            }
            currentDate.setDate(currentDate.getDate() + 1);
            break;
          case 'yearly':
            key = currentDate.getFullYear().toString();
            if (!allPeriods.includes(key)) {
              allPeriods.push(key);
            }
            currentDate.setFullYear(currentDate.getFullYear() + 1);
            break;
          case 'monthly':
          default:
            key = `${currentDate.getFullYear()}-${String(
              currentDate.getMonth() + 1
            ).padStart(2, '0')}`;
            if (!allPeriods.includes(key)) {
              allPeriods.push(key);
            }
            currentDate.setMonth(currentDate.getMonth() + 1);
            break;
        }
      }

      // Format data for chart
      const chartData = allPeriods.map((key) => {
        const revenue = revenuePerPeriod[key] || 0;

        let label: string;
        switch (period) {
          case 'daily':
            const [dyear, dmonth, dday] = key.split('-');
            const dayDate = new Date(parseInt(dyear), parseInt(dmonth) - 1, parseInt(dday));
            label = dayDate.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            });
            break;
          case 'yearly':
            label = key;
            break;
          case 'monthly':
          default:
            const [year, month] = key.split('-');
            const monthDate = new Date(parseInt(year), parseInt(month) - 1);
            label = monthDate.toLocaleDateString('en-US', {
              month: 'short',
              year: 'numeric',
            });
            break;
        }

        return {
          period: label,
          revenue: Math.round(revenue * 100) / 100, // Round to 2 decimal places
        };
      });

      // Get all sellers who have invoices in this warehouse
      const uniqueSellerIds = await DebtInvoice.distinct('sellerId', {
        warehouseId: new mongoose.Types.ObjectId(warehouseId),
      });

      // Get seller details from User model
      const sellers = await User.find({
        _id: { $in: uniqueSellerIds },
      })
        .select('_id name')
        .sort({ name: 1 })
        .lean();

      const sellersFormatted = sellers.map((s: any) => ({
        sellerId: s._id.toString(),
        sellerName: s.name || 'Unknown',
      }));

      // Calculate total revenue (sum of all net payments)
      const totalRevenue = invoices.reduce((sum: number, inv: any) => {
        return sum + (inv.summary?.netPayment || 0);
      }, 0);

      // Get currency from first invoice or default to warehouse currency
      const currency = invoices.length > 0 ? invoices[0].currency : 'USD';

      return {
        success: true,
        data: chartData,
        sellers: sellersFormatted,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        currency,
      };
    } catch (error: any) {
      console.error('Error fetching seller revenue:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch seller revenue',
      };
    }
  }
);

/**
 * Get refunded orders count (Daily/Monthly/Yearly)
 * Refunded orders = Orders with status 'refunded'
 */
export const getRefundedOrders = withDbConnection(
  async (
    warehouseId: string,
    startDate?: string,
    endDate?: string,
    period: 'daily' | 'monthly' | 'yearly' = 'monthly',
    sellerId?: string
  ) => {
    try {
      const user = await getCurrentUser();

      if (!user || user.role !== UserRole.ADMIN) {
        return {
          success: false,
          message: 'Unauthorized. Admin access required.',
        };
      }

      // Warehouse selection is required
      if (!warehouseId) {
        return {
          success: false,
          message: 'Warehouse selection is required',
        };
      }

      // Build date filter
      let fromDate: Date;
      let toDate: Date;

      if (startDate && endDate) {
        fromDate = new Date(startDate);
        toDate = new Date(endDate);
      } else {
        // Default to this year
        toDate = new Date();
        fromDate = new Date(toDate.getFullYear(), 0, 1);
      }

      // Build order filter for refunded orders
      const orderFilter: any = {
        warehouseId: new mongoose.Types.ObjectId(warehouseId),
        orderDate: {
          $gte: fromDate,
          $lte: toDate,
        },
        status: 'refunded',
      };

      // Add seller filter if specific seller is selected
      if (sellerId) {
        orderFilter.sellerId = new mongoose.Types.ObjectId(sellerId);
      }

      // Get refunded orders
      const refundedOrders = await Order.find(orderFilter)
        .select('orderDate sellerId')
        .lean();

      // Group orders by period
      const ordersPerPeriod: { [key: string]: number } = {};

      refundedOrders.forEach((order: any) => {
        if (order.orderDate) {
          const orderDate = new Date(order.orderDate);
          let key: string;

          switch (period) {
            case 'daily':
              key = `${orderDate.getFullYear()}-${String(
                orderDate.getMonth() + 1
              ).padStart(2, '0')}-${String(orderDate.getDate()).padStart(2, '0')}`;
              break;
            case 'yearly':
              key = orderDate.getFullYear().toString();
              break;
            case 'monthly':
            default:
              key = `${orderDate.getFullYear()}-${String(
                orderDate.getMonth() + 1
              ).padStart(2, '0')}`;
              break;
          }

          ordersPerPeriod[key] = (ordersPerPeriod[key] || 0) + 1;
        }
      });

      // Generate all expected periods in the date range
      const allPeriods: string[] = [];
      const currentDate = new Date(fromDate);

      while (currentDate <= toDate) {
        let key: string;
        switch (period) {
          case 'daily':
            key = `${currentDate.getFullYear()}-${String(
              currentDate.getMonth() + 1
            ).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
            if (!allPeriods.includes(key)) {
              allPeriods.push(key);
            }
            currentDate.setDate(currentDate.getDate() + 1);
            break;
          case 'yearly':
            key = currentDate.getFullYear().toString();
            if (!allPeriods.includes(key)) {
              allPeriods.push(key);
            }
            currentDate.setFullYear(currentDate.getFullYear() + 1);
            break;
          case 'monthly':
          default:
            key = `${currentDate.getFullYear()}-${String(
              currentDate.getMonth() + 1
            ).padStart(2, '0')}`;
            if (!allPeriods.includes(key)) {
              allPeriods.push(key);
            }
            currentDate.setMonth(currentDate.getMonth() + 1);
            break;
        }
      }

      // Format data for chart
      const chartData = allPeriods.map((key) => {
        const count = ordersPerPeriod[key] || 0;

        let label: string;
        switch (period) {
          case 'daily':
            const [dyear, dmonth, dday] = key.split('-');
            const dayDate = new Date(parseInt(dyear), parseInt(dmonth) - 1, parseInt(dday));
            label = dayDate.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            });
            break;
          case 'yearly':
            label = key;
            break;
          case 'monthly':
          default:
            const [year, month] = key.split('-');
            const monthDate = new Date(parseInt(year), parseInt(month) - 1);
            label = monthDate.toLocaleDateString('en-US', {
              month: 'short',
              year: 'numeric',
            });
            break;
        }

        return {
          period: label,
          count,
        };
      });

      // Get all unique seller IDs who have refunded orders in this warehouse
      const uniqueSellerIds = await Order.distinct('sellerId', {
        warehouseId: new mongoose.Types.ObjectId(warehouseId),
        status: 'refunded',
      });

      // Get seller details from User model
      const sellers = await User.find({
        _id: { $in: uniqueSellerIds },
      })
        .select('_id name')
        .sort({ name: 1 })
        .lean();

      const sellersFormatted = sellers.map((s: any) => ({
        sellerId: s._id.toString(),
        sellerName: s.name || 'Unknown',
      }));

      return {
        success: true,
        data: chartData,
        sellers: sellersFormatted,
        totalRefunded: refundedOrders.length,
      };
    } catch (error: any) {
      console.error('Error fetching refunded orders:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch refunded orders',
      };
    }
  }
);

/**
 * Get refund amount (monetary value) per seller over time
 */
export const getRefundAmount = withDbConnection(
  async (
    warehouseId: string,
    startDate?: string,
    endDate?: string,
    period: 'daily' | 'monthly' | 'yearly' = 'monthly',
    sellerId?: string
  ) => {
    try {
      // Default date range: this year
      const now = new Date();
      const fromDate = startDate ? new Date(startDate) : new Date(now.getFullYear(), 0, 1);
      const toDate = endDate ? new Date(endDate) : now;

      // Build invoice filter
      const invoiceFilter: any = {
        warehouseId: new mongoose.Types.ObjectId(warehouseId),
        createdAt: {
          $gte: fromDate,
          $lte: toDate,
        },
      };

      // Add seller filter if provided
      if (sellerId) {
        invoiceFilter.sellerId = new mongoose.Types.ObjectId(sellerId);
      }

      // Get all invoices with refund amounts
      const invoices = await DebtInvoice.find(invoiceFilter)
        .populate('sellerId', 'businessName firstName lastName')
        .sort({ createdAt: 1 })
        .lean();

      // Helper function to get period key
      const getPeriodKey = (date: Date): string => {
        const d = new Date(date);
        if (period === 'daily') {
          return d.toISOString().split('T')[0]; // YYYY-MM-DD
        } else if (period === 'monthly') {
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM
        } else {
          return `${d.getFullYear()}`; // YYYY
        }
      };

      // Generate all periods in the date range
      const allPeriods: string[] = [];
      const currentDate = new Date(fromDate);

      while (currentDate <= toDate) {
        allPeriods.push(getPeriodKey(currentDate));

        if (period === 'daily') {
          currentDate.setDate(currentDate.getDate() + 1);
        } else if (period === 'monthly') {
          currentDate.setMonth(currentDate.getMonth() + 1);
        } else {
          currentDate.setFullYear(currentDate.getFullYear() + 1);
        }
      }

      // Aggregate refund amounts per period
      const refundPerPeriod: { [key: string]: number } = {};

      invoices.forEach((invoice: any) => {
        const key = getPeriodKey(invoice.createdAt);
        if (!refundPerPeriod[key]) {
          refundPerPeriod[key] = 0;
        }
        refundPerPeriod[key] += invoice.summary?.totalRefundAmount || 0;
      });

      // Format data for chart with proper labels
      const chartData = allPeriods.map((key) => {
        const amount = refundPerPeriod[key] || 0;

        let label: string;
        switch (period) {
          case 'daily':
            const [dyear, dmonth, dday] = key.split('-');
            const dayDate = new Date(parseInt(dyear), parseInt(dmonth) - 1, parseInt(dday));
            label = dayDate.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            });
            break;
          case 'yearly':
            label = key;
            break;
          case 'monthly':
          default:
            const [year, month] = key.split('-');
            const monthDate = new Date(parseInt(year), parseInt(month) - 1);
            label = monthDate.toLocaleDateString('en-US', {
              month: 'short',
              year: 'numeric',
            });
            break;
        }

        return {
          period: label,
          amount: Math.round(amount * 100) / 100, // Round to 2 decimals
        };
      });

      // Get all unique seller IDs who have invoices in this warehouse
      const uniqueSellerIds = await DebtInvoice.distinct('sellerId', {
        warehouseId: new mongoose.Types.ObjectId(warehouseId),
      });

      // Get seller details from User model
      const sellers = await User.find({
        _id: { $in: uniqueSellerIds },
      })
        .select('_id businessName firstName lastName')
        .sort({ businessName: 1 })
        .lean();

      const sellersFormatted = sellers.map((s: any) => ({
        sellerId: s._id.toString(),
        sellerName: s.businessName || `${s.firstName || ''} ${s.lastName || ''}`.trim() || 'Unknown',
      }));

      // Calculate total refund amount
      const totalRefundAmount = invoices.reduce((sum, invoice: any) => {
        return sum + (invoice.summary?.totalRefundAmount || 0);
      }, 0);

      // Get currency from first invoice
      const currency = invoices.length > 0 ? invoices[0].currency : 'USD';

      return {
        success: true,
        data: chartData,
        sellers: sellersFormatted,
        totalRefundAmount: Math.round(totalRefundAmount * 100) / 100,
        currency,
      };
    } catch (error: any) {
      console.error('Error fetching refund amount:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch refund amount',
      };
    }
  }
);

/**
 * Get refund rate percentage per seller over time
 * Refund Rate = (Refunded Orders / Total Orders) × 100
 */
export const getRefundRate = withDbConnection(
  async (
    warehouseId: string,
    startDate?: string,
    endDate?: string,
    period: 'daily' | 'monthly' | 'yearly' = 'monthly',
    sellerId?: string
  ) => {
    try {
      // Default date range: this year
      const now = new Date();
      const fromDate = startDate ? new Date(startDate) : new Date(now.getFullYear(), 0, 1);
      const toDate = endDate ? new Date(endDate) : now;

      // Build order filter
      const orderFilter: any = {
        warehouseId: new mongoose.Types.ObjectId(warehouseId),
        orderDate: {
          $gte: fromDate,
          $lte: toDate,
        },
      };

      // Add seller filter if provided
      if (sellerId) {
        orderFilter.sellerId = new mongoose.Types.ObjectId(sellerId);
      }

      // Get all orders
      const allOrders = await Order.find(orderFilter).select('orderDate status').lean();

      // Get refunded orders
      const refundedOrders = allOrders.filter((order: any) => order.status === 'refunded');

      // Helper function to get period key
      const getPeriodKey = (date: Date): string => {
        const d = new Date(date);
        if (period === 'daily') {
          return d.toISOString().split('T')[0]; // YYYY-MM-DD
        } else if (period === 'monthly') {
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM
        } else {
          return `${d.getFullYear()}`; // YYYY
        }
      };

      // Generate all periods in the date range
      const allPeriods: string[] = [];
      const currentDate = new Date(fromDate);

      while (currentDate <= toDate) {
        allPeriods.push(getPeriodKey(currentDate));

        if (period === 'daily') {
          currentDate.setDate(currentDate.getDate() + 1);
        } else if (period === 'monthly') {
          currentDate.setMonth(currentDate.getMonth() + 1);
        } else {
          currentDate.setFullYear(currentDate.getFullYear() + 1);
        }
      }

      // Count total and refunded orders per period
      const totalPerPeriod: { [key: string]: number } = {};
      const refundedPerPeriod: { [key: string]: number } = {};

      allOrders.forEach((order: any) => {
        const key = getPeriodKey(order.orderDate);
        totalPerPeriod[key] = (totalPerPeriod[key] || 0) + 1;
      });

      refundedOrders.forEach((order: any) => {
        const key = getPeriodKey(order.orderDate);
        refundedPerPeriod[key] = (refundedPerPeriod[key] || 0) + 1;
      });

      // Format data for chart
      const chartData = allPeriods.map((key) => {
        const total = totalPerPeriod[key] || 0;
        const refunded = refundedPerPeriod[key] || 0;
        const rate = total > 0 ? (refunded / total) * 100 : 0;

        let label: string;
        switch (period) {
          case 'daily':
            const [dyear, dmonth, dday] = key.split('-');
            const dayDate = new Date(parseInt(dyear), parseInt(dmonth) - 1, parseInt(dday));
            label = dayDate.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            });
            break;
          case 'yearly':
            label = key;
            break;
          case 'monthly':
          default:
            const [year, month] = key.split('-');
            const monthDate = new Date(parseInt(year), parseInt(month) - 1);
            label = monthDate.toLocaleDateString('en-US', {
              month: 'short',
              year: 'numeric',
            });
            break;
        }

        return {
          period: label,
          rate: Math.round(rate * 100) / 100, // Round to 2 decimals
        };
      });

      // Calculate overall refund rate
      const totalOrders = allOrders.length;
      const totalRefunded = refundedOrders.length;
      const overallRate = totalOrders > 0 ? (totalRefunded / totalOrders) * 100 : 0;

      // Get all unique seller IDs who have orders in this warehouse
      const uniqueSellerIds = await Order.distinct('sellerId', {
        warehouseId: new mongoose.Types.ObjectId(warehouseId),
      });

      // Get seller details from User model
      const sellers = await User.find({
        _id: { $in: uniqueSellerIds },
      })
        .select('_id businessName firstName lastName')
        .sort({ businessName: 1 })
        .lean();

      const sellersFormatted = sellers.map((s: any) => ({
        sellerId: s._id.toString(),
        sellerName: s.businessName || `${s.firstName || ''} ${s.lastName || ''}`.trim() || 'Unknown',
      }));

      return {
        success: true,
        data: chartData,
        sellers: sellersFormatted,
        overallRate: Math.round(overallRate * 100) / 100,
        totalOrders,
        refundedOrders: totalRefunded,
      };
    } catch (error: any) {
      console.error('Error fetching refund rate:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch refund rate',
      };
    }
  }
);
