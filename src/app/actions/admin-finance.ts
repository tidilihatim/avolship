'use server';

import { withDbConnection } from '@/lib/db/db-connect';
import { getCurrentUser } from './auth';
import { UserRole } from '@/lib/db/models/user';
import Order, { OrderStatus } from '@/lib/db/models/order';
import Warehouse from '@/lib/db/models/warehouse';
import Invoice from '@/lib/db/models/invoice';
import { InvoiceStatus } from '@/types/invoice';
import mongoose from 'mongoose';

/**
 * Get all active warehouses for finance operations
 */
export const getWarehouses = withDbConnection(async () => {
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
 * Get average order value (AOV) data (Daily/Monthly/Yearly)
 */
export const getAverageOrderValue = withDbConnection(
  async (
    warehouseId: string,
    startDate?: string,
    endDate?: string,
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
        // Default to last 30 days
        toDate = new Date();
        fromDate = new Date();
        fromDate.setDate(fromDate.getDate() - 30);
      }

      // Get warehouse details for currency
      const warehouse: any = await Warehouse.findById(warehouseId).select('currency').lean();

      if (!warehouse) {
        return {
          success: false,
          message: 'Warehouse not found',
        };
      }

      // Build query filter for delivered orders in this warehouse
      const orderFilter: any = {
        status: OrderStatus.DELIVERED,
        warehouseId: new mongoose.Types.ObjectId(warehouseId),
        orderDate: {
          $gte: fromDate,
          $lte: toDate,
        },
      };

      // Get delivered orders
      const deliveredOrders = await Order.find(orderFilter)
        .select('orderDate totalPrice')
        .lean();

      // Group data by period
      const groupedData: {
        [key: string]: { totalRevenue: number; orderCount: number };
      } = {};

      deliveredOrders.forEach((order: any) => {
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
            groupedData[key] = { totalRevenue: 0, orderCount: 0 };
          }

          groupedData[key].totalRevenue += order.totalPrice || 0;
          groupedData[key].orderCount++;
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
        const avgValue = data && data.orderCount > 0
          ? Math.round((data.totalRevenue / data.orderCount) * 100) / 100
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
          avgValue,
          orderCount: data ? data.orderCount : 0,
        };
      });

      return {
        success: true,
        data: chartData,
        currency: warehouse.currency,
      };
    } catch (error: any) {
      console.error('Error fetching average order value:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch average order value',
      };
    }
  }
);

/**
 * Get payouts to sellers data (Daily/Monthly/Yearly)
 * Calculates total amount paid out to merchants after fees from paid invoices
 */
export const getPayoutsToSellers = withDbConnection(
  async (
    warehouseId: string,
    startDate?: string,
    endDate?: string,
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
        // Default to last 30 days
        toDate = new Date();
        fromDate = new Date();
        fromDate.setDate(fromDate.getDate() - 30);
      }

      // Get warehouse details for currency
      const warehouse: any = await Warehouse.findById(warehouseId).select('currency').lean();

      if (!warehouse) {
        return {
          success: false,
          message: 'Warehouse not found',
        };
      }

      // Build query filter for paid invoices in this warehouse
      const invoiceFilter: any = {
        status: InvoiceStatus.PAID,
        warehouseId: new mongoose.Types.ObjectId(warehouseId),
        periodEnd: {
          $gte: fromDate,
          $lte: toDate,
        },
      };

      // Get paid invoices
      const paidInvoices = await Invoice.find(invoiceFilter)
        .select('periodEnd summary.netPayment')
        .lean();

      // Group data by period
      const groupedData: {
        [key: string]: number;
      } = {};

      paidInvoices.forEach((invoice: any) => {
        if (invoice.periodEnd && invoice.summary?.netPayment) {
          const invoiceDate = new Date(invoice.periodEnd);
          let key: string;

          switch (period) {
            case 'yearly':
              key = invoiceDate.getFullYear().toString();
              break;
            case 'monthly':
              key = `${invoiceDate.getFullYear()}-${String(
                invoiceDate.getMonth() + 1
              ).padStart(2, '0')}`;
              break;
            case 'daily':
            default:
              key = invoiceDate.toISOString().split('T')[0];
              break;
          }

          if (!groupedData[key]) {
            groupedData[key] = 0;
          }

          // Only add positive net payments (actual payouts, not debts)
          if (invoice.summary.netPayment > 0) {
            groupedData[key] += invoice.summary.netPayment;
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
        const amount = groupedData[key] || null;

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
          amount: amount ? Math.round(amount * 100) / 100 : null,
        };
      });

      return {
        success: true,
        data: chartData,
        currency: warehouse.currency,
      };
    } catch (error: any) {
      console.error('Error fetching payouts to sellers:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch payouts to sellers',
      };
    }
  }
);

/**
 * Get total COD collected data (Daily/Monthly/Yearly)
 */
export const getTotalCODCollected = withDbConnection(
  async (
    warehouseId: string,
    startDate?: string,
    endDate?: string,
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
        // Default to last 30 days
        toDate = new Date();
        fromDate = new Date();
        fromDate.setDate(fromDate.getDate() - 30);
      }

      // Get warehouse details for currency
      const warehouse: any = await Warehouse.findById(warehouseId).select('currency').lean();

      if (!warehouse) {
        return {
          success: false,
          message: 'Warehouse not found',
        };
      }

      // Build query filter for delivered orders in this warehouse
      const orderFilter: any = {
        status: OrderStatus.DELIVERED,
        warehouseId: new mongoose.Types.ObjectId(warehouseId),
        orderDate: {
          $gte: fromDate,
          $lte: toDate,
        },
      };

      // Get delivered orders
      const deliveredOrders = await Order.find(orderFilter)
        .select('orderDate totalPrice')
        .lean();

      // Group data by period
      const groupedData: {
        [key: string]: number;
      } = {};

      deliveredOrders.forEach((order: any) => {
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
            groupedData[key] = 0;
          }

          groupedData[key] += order.totalPrice || 0;
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
        const amount = groupedData[key] || null;

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
          amount: amount ? Math.round(amount * 100) / 100 : null,
        };
      });

      return {
        success: true,
        data: chartData,
        currency: warehouse.currency,
      };
    } catch (error: any) {
      console.error('Error fetching total COD collected:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch total COD collected',
      };
    }
  }
);
