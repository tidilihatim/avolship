'use server';

import { withDbConnection } from '@/lib/db/db-connect';
import { getCurrentUser } from './auth';
import { revalidatePath } from 'next/cache';
import { UserRole } from '@/lib/db/models/user';
import { OrderStatus } from '@/lib/db/models/order';
import User from '@/lib/db/models/user';
import Order from '@/lib/db/models/order';
import Product from '@/lib/db/models/product';
import Warehouse from '@/lib/db/models/warehouse';
import Expedition from '@/lib/db/models/expedition';
import Invoice from '@/lib/db/models/invoice';
import { InvoiceStatus } from '@/types/invoice';
import mongoose from 'mongoose';
import { sendNotification } from '@/lib/notifications/send-notification';
import { ExpeditionStatus } from '../dashboard/_constant/expedition';

interface InvoicePreviewData {
  sellerId: string;
  warehouseId: string;
  periodStart: string;
  periodEnd: string;
}

interface InvoiceGenerationData extends InvoicePreviewData {
  fees: {
    confirmationFee: number;
    serviceFee: number;
    warehouseFee: number;
    shippingFee: number;
    processingFee: number;
    expeditionFee: number;
  };
  notes?: string;
  terms?: string;
}

export const getSellerWarehouses = withDbConnection(async (sellerId: string) => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, message: 'Unauthorized' };
    }

    if (![UserRole.ADMIN, UserRole.MODERATOR].includes(user.role)) {
      return { success: false, message: 'Insufficient permissions' };
    }

    // Get warehouses available to the seller
    const warehouses = await Warehouse.find({
      $or: [
        { isAvailableToAll: true },
        { assignedSellers: new mongoose.Types.ObjectId(sellerId) }
      ],
      isActive: true
    }).select('name country currency').lean();

    // Serialize the data to avoid MongoDB object serialization issues
    const serializedWarehouses = warehouses.map(warehouse => ({
      _id: (warehouse._id as string)?.toString(),
      name: warehouse.name,
      country: warehouse.country,
      currency: warehouse.currency
    }));

    return { success: true, data: serializedWarehouses };
  } catch (error: any) {
    console.error('Error getting seller warehouses:', error);
    return { success: false, message: error.message || 'Failed to fetch warehouses' };
  }
});

export const generateInvoicePreview = withDbConnection(async (data: InvoicePreviewData) => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, message: 'Unauthorized' };
    }

    if (![UserRole.ADMIN, UserRole.MODERATOR].includes(user.role)) {
      return { success: false, message: 'Insufficient permissions' };
    }

    const { sellerId, warehouseId, periodStart, periodEnd } = data;

    // Validate inputs
    if (!sellerId || !warehouseId || !periodStart || !periodEnd) {
      return { success: false, message: 'Missing required fields' };
    }

    const startDate = new Date(periodStart);
    const endDate = new Date(periodEnd);

    if (startDate >= endDate) {
      return { success: false, message: 'Start date must be before end date' };
    }

    // Get seller info
    const seller = await User.findById(sellerId).select('name email businessName').lean();
    if (!seller) {
      return { success: false, message: 'Seller not found' };
    }

    // Get warehouse info
    const warehouse = await Warehouse.findById(warehouseId).select('name country currency').lean();
    if (!warehouse) {
      return { success: false, message: 'Warehouse not found' };
    }

    // Get orders within the period with status 'delivered'
    // First, get all orders that have already been invoiced to exclude them
    const invoicedOrderIds = await Invoice.distinct('orderIds', {
      sellerId: new mongoose.Types.ObjectId(sellerId),
      warehouseId: new mongoose.Types.ObjectId(warehouseId)
    });

    const orders = await Order.find({
      sellerId: new mongoose.Types.ObjectId(sellerId),
      warehouseId: new mongoose.Types.ObjectId(warehouseId),
      status: OrderStatus.DELIVERED,
      createdAt: { $gte: startDate, $lte: endDate },
      _id: { $nin: invoicedOrderIds } // Exclude already invoiced orders
    }).populate({
      path: 'products.productId',
      select: 'name code',
      model: Product
    }).lean();

    // Get expeditions within the period
    // First, get all expeditions that have already been invoiced to exclude them
    const invoicedExpeditionIds = await Invoice.distinct('expeditionIds', {
      sellerId: new mongoose.Types.ObjectId(sellerId),
      warehouseId: new mongoose.Types.ObjectId(warehouseId)
    });

    const expeditions = await Expedition.find({
      sellerId: new mongoose.Types.ObjectId(sellerId),
      warehouseId: new mongoose.Types.ObjectId(warehouseId),
      status: ExpeditionStatus.DELIVERED,
      expeditionDate: { $gte: startDate, $lte: endDate },
      _id: { $nin: invoicedExpeditionIds } // Exclude already invoiced expeditions
    }).lean();

    // Calculate totals
    const totalOrders = orders.length;
    const totalExpeditions = expeditions.length;
    
    let totalProducts = 0;
    let totalQuantity = 0;
    let totalSales = 0;

    // Use a Set to track unique products
    const uniqueProductIds = new Set();
    
    orders.forEach(order => {
      order.products.forEach((product:any) => {
        // Add unique product ID to set
        uniqueProductIds.add(product.productId.toString());
        totalQuantity += product.quantity;
        totalSales += product.unitPrice * product.quantity;
      });
    });
    
    // Count unique products
    totalProducts = uniqueProductIds.size;

    // Calculate unpaid expeditions for reference only (not added to invoice total)
    const unpaidExpeditions = expeditions.filter(exp => !exp.isPaid);
    const unpaidAmount = unpaidExpeditions.reduce((sum, exp) => sum + (exp.totalValue || 0), 0);

    // Serialize the data to avoid MongoDB object serialization issues
    const preview = {
      totalOrders,
      totalExpeditions,
      totalProducts,
      totalQuantity,
      totalSales,
      unpaidExpeditions: unpaidExpeditions.length,
      unpaidAmount,
      currency: (warehouse as any).currency,
      warehouseName: (warehouse as any).name,
      sellerName: (seller as any).name,
      sellerEmail: (seller as any).email,
      sellerBusinessName: (seller as any).businessName || null,
      warehouseCountry: (warehouse as any).country,
      periodStart: startDate.toISOString(),
      periodEnd: endDate.toISOString(),
      orderIds: orders.map(order => (order._id as mongoose.Types.ObjectId).toString()), // Include order IDs for tracking
      expeditionIds: expeditions.map(expedition => (expedition._id as mongoose.Types.ObjectId).toString()) // Include expedition IDs for tracking
    };

    // Get detailed product data
    const productData: any[] = [];
    const productSales: { [key: string]: { name: string; code: string; quantity: number; sales: number } } = {};
    
    orders.forEach(order => {
      order.products.forEach((product: any) => {
        const productKey = product.productId.toString();
        if (!productSales[productKey]) {
          productSales[productKey] = {
            name: product.productId.name || 'Unknown Product',
            code: product.productId.code || 'N/A',
            quantity: 0,
            sales: 0
          };
        }
        productSales[productKey].quantity += product.quantity;
        productSales[productKey].sales += product.unitPrice * product.quantity;
      });
    });
    
    // Convert to array
    Object.keys(productSales).forEach(productId => {
      productData.push({
        productId,
        ...productSales[productId]
      });
    });

    // Get detailed expedition data
    const expeditionData = expeditions.map(expedition => ({
      expeditionId: (expedition._id as mongoose.Types.ObjectId).toString(),
      expeditionCode: expedition.expeditionCode || 'N/A',
      expeditionDate: expedition.expeditionDate,
      totalValue: expedition.totalValue || 0,
      isPaid: expedition.isPaid || false,
      status: expedition.status || 'Unknown'
    }));

    return { success: true, data: { ...preview, productData, expeditionData } };
  } catch (error: any) {
    console.error('Error generating invoice preview:', error);
    return { success: false, message: error.message || 'Failed to generate preview' };
  }
});

export const generateInvoice = withDbConnection(async (data: InvoiceGenerationData) => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, message: 'Unauthorized' };
    }

    if (![UserRole.ADMIN, UserRole.MODERATOR].includes(user.role)) {
      return { success: false, message: 'Insufficient permissions' };
    }

    const { sellerId, warehouseId, periodStart, periodEnd, fees, notes, terms } = data;

    // First get the preview data to validate
    const previewResult = await generateInvoicePreview({
      sellerId,
      warehouseId,
      periodStart,
      periodEnd
    });

    if (!previewResult.success || !previewResult.data) {
      return previewResult;
    }

    const preview = previewResult.data;

    // Check if invoice already exists for this period
    // const existingInvoice = await Invoice.findOne({
    //   sellerId: new mongoose.Types.ObjectId(sellerId),
    //   warehouseId: new mongoose.Types.ObjectId(warehouseId),
    //   periodStart: new Date(periodStart),
    //   periodEnd: new Date(periodEnd)
    // }).lean();

    // if (existingInvoice) {
    //   return { success: false, message: 'Invoice already exists for this period' };
    // }

    // Calculate totals - fees are deducted from seller payment
    const totalFees = Object.values(fees).reduce((sum, fee) => sum + fee, 0);
    const netAmount = preview.totalSales - totalFees;

    // Create the invoice
    const invoice = new Invoice({
      sellerId: new mongoose.Types.ObjectId(sellerId),
      warehouseId: new mongoose.Types.ObjectId(warehouseId),
      periodStart: new Date(periodStart),
      periodEnd: new Date(periodEnd),
      status: InvoiceStatus.GENERATED,
      orderIds: preview.orderIds.map(id => new mongoose.Types.ObjectId(id)), // Store the specific order IDs
      expeditionIds: preview.expeditionIds.map(id => new mongoose.Types.ObjectId(id)), // Store the specific expedition IDs
      fees: {
        ...fees,
        totalFees
      },
      summary: {
        totalOrders: preview.totalOrders,
        totalExpeditions: preview.totalExpeditions,
        totalProducts: preview.totalProducts,
        totalQuantity: preview.totalQuantity,
        totalSales: preview.totalSales,
        totalFees,
        netAmount,
        totalTax: 0, // Can be calculated based on business rules
        finalAmount: netAmount,
        unpaidExpeditions: preview.unpaidExpeditions,
        unpaidAmount: preview.unpaidAmount
      },
      currency: preview.currency,
      notes,
      terms,
      generatedBy: user._id,
      generatedAt: new Date()
    });

    await invoice.save();

    // send notification
    await sendNotification({
      userId: sellerId,
      title: "New Invoice Generated",
      message: `A new invoice has been generated for the period ${new Date(periodStart).toLocaleDateString()} to ${new Date(periodEnd).toLocaleDateString()}`,
      type: "info" as any,
      actionLink: `/dashboard/admin/invoices/${invoice._id}`
    });

    // Revalidate relevant paths
    revalidatePath('/dashboard/admin/users');
    revalidatePath('/dashboard/admin/invoices');

    return { 
      success: true, 
      message: 'Invoice generated successfully', 
      data: { 
        invoiceId: invoice._id,
        invoiceNumber: invoice.invoiceNumber 
      } 
    };
  } catch (error: any) {
    console.error('Error generating invoice:', error);
    return { success: false, message: error.message || 'Failed to generate invoice' };
  }
});

interface InvoiceFilters {
  page: number;
  limit: number;
  search?: string;
  status?: string;
  seller?: string;
  startDate?: string;
  endDate?: string;
}

export const getInvoicesList = withDbConnection(async (filters: InvoiceFilters) => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, message: 'Unauthorized' };
    }

    if (![UserRole.ADMIN, UserRole.MODERATOR].includes(user.role)) {
      return { success: false, message: 'Insufficient permissions' };
    }

    const { page = 1, limit = 10, search, status, seller, startDate, endDate } = filters;
    const skip = (page - 1) * limit;
    const query: any = {};

    // Apply filters
    if (seller) {
      query.sellerId = new mongoose.Types.ObjectId(seller);
    }

    if (status) {
      query.status = status;
    }

    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else if (startDate) {
      query.createdAt = { $gte: new Date(startDate) };
    } else if (endDate) {
      query.createdAt = { $lte: new Date(endDate) };
    }

    // Search functionality
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { invoiceNumber: searchRegex },
        { 'sellerId.name': searchRegex },
        { 'sellerId.email': searchRegex },
        { 'sellerId.businessName': searchRegex }
      ];
    }

    const [invoices, total] = await Promise.all([
      Invoice.find(query)
        .populate('sellerId', 'name email businessName')
        .populate('warehouseId', 'name country currency')
        .populate('generatedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Invoice.countDocuments(query)
    ]);

    // Serialize the data to avoid MongoDB object serialization issues
    const serializedInvoices = invoices.map(invoice => ({
      _id: (invoice._id as string)?.toString(),
      invoiceNumber: invoice.invoiceNumber,
      status: invoice.status,
      currency: invoice.currency,
      createdAt: invoice.createdAt,
      generatedAt: invoice.generatedAt,
      periodStart: invoice.periodStart,
      periodEnd: invoice.periodEnd,
      summary: invoice.summary,
      sellerId: {
        _id: ((invoice as any).sellerId._id as string)?.toString(),
        name: (invoice as any).sellerId.name,
        email: (invoice as any).sellerId.email,
        businessName: (invoice as any).sellerId.businessName
      },
      warehouseId: {
        _id: ((invoice as any).warehouseId._id as string)?.toString(),
        name: (invoice as any).warehouseId.name,
        country: (invoice as any).warehouseId.country,
        currency: (invoice as any).warehouseId.currency
      },
      generatedBy: {
        _id: ((invoice as any).generatedBy._id as string)?.toString(),
        name: (invoice as any).generatedBy.name,
        email: (invoice as any).generatedBy.email
      }
    }));

    return {
      success: true,
      data: serializedInvoices,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  } catch (error: any) {
    console.error('Error getting invoices:', error);
    return { success: false, message: error.message || 'Failed to fetch invoices' };
  }
});

export const getInvoiceById = withDbConnection(async (invoiceId: string) => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, message: 'Unauthorized' };
    }

    if (![UserRole.ADMIN, UserRole.MODERATOR].includes(user.role)) {
      return { success: false, message: 'Insufficient permissions' };
    }

    const invoice = await Invoice.findById(invoiceId)
      .populate('sellerId', 'name email businessName phone country')
      .populate('warehouseId', 'name country currency address')
      .populate('generatedBy', 'name email')
      .lean();

    if (!invoice) {
      return { success: false, message: 'Invoice not found' };
    }

    // Get the actual orders and expeditions for this invoice
    const [orders, expeditions] = await Promise.all([
      Order.find({
        _id: { $in: (invoice as any).orderIds } // Only get orders that are specifically included in this invoice
      }).populate({
        path: 'products.productId',
        model: Product
      }),
      
      Expedition.find({
        _id: { $in: (invoice as any).expeditionIds } // Only get expeditions that are specifically included in this invoice
      }).lean()
    ]);

    return JSON.parse(JSON.stringify({
      success: true,
      data: {
        invoice,
        orders,
        expeditions
      }
    }));
  } catch (error: any) {
    console.error('Error getting invoice:', error);
    return { success: false, message: error.message || 'Failed to fetch invoice' };
  }
});

export const updateInvoiceStatus = withDbConnection(async (invoiceId: string, status: InvoiceStatus) => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, message: 'Unauthorized' };
    }

    if (![UserRole.ADMIN, UserRole.MODERATOR].includes(user.role)) {
      return { success: false, message: 'Insufficient permissions' };
    }

    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      return { success: false, message: 'Invoice not found' };
    }

    invoice.status = status;
    
    if (status === InvoiceStatus.PAID) {
      invoice.paidDate = new Date();
    }

    await invoice.save();

    revalidatePath('/dashboard/admin/invoices');

    return { success: true, message: 'Invoice status updated successfully' };
  } catch (error: any) {
    console.error('Error updating invoice status:', error);
    return { success: false, message: error.message || 'Failed to update invoice status' };
  }
});

// Seller-specific invoice actions
export const getSellerInvoicesList = withDbConnection(async (filters: InvoiceFilters) => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, message: 'Unauthorized' };
    }

    if (![UserRole.SELLER].includes(user.role)) {
      return { success: false, message: 'Insufficient permissions' };
    }

    const { page = 1, limit = 10, search, status, startDate, endDate } = filters;
    const skip = (page - 1) * limit;
    const query: any = {
      sellerId: new mongoose.Types.ObjectId(user._id) // Only fetch invoices for this seller
    };

    // Apply filters
    if (status) {
      query.status = status;
    }

    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else if (startDate) {
      query.createdAt = { $gte: new Date(startDate) };
    } else if (endDate) {
      query.createdAt = { $lte: new Date(endDate) };
    }

    // Search functionality
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { invoiceNumber: searchRegex }
      ];
    }

    const [invoices, total] = await Promise.all([
      Invoice.find(query)
        .populate('sellerId', 'name email businessName')
        .populate('warehouseId', 'name country currency')
        .populate('generatedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Invoice.countDocuments(query)
    ]);

    // Serialize the data to avoid MongoDB object serialization issues
    const serializedInvoices = invoices.map(invoice => ({
      _id: (invoice._id as string)?.toString(),
      invoiceNumber: invoice.invoiceNumber,
      status: invoice.status,
      currency: invoice.currency,
      createdAt: invoice.createdAt,
      generatedAt: invoice.generatedAt,
      periodStart: invoice.periodStart,
      periodEnd: invoice.periodEnd,
      summary: invoice.summary,
      sellerId: {
        _id: ((invoice as any).sellerId._id as string)?.toString(),
        name: (invoice as any).sellerId.name,
        email: (invoice as any).sellerId.email,
        businessName: (invoice as any).sellerId.businessName
      },
      warehouseId: {
        _id: ((invoice as any).warehouseId._id as string)?.toString(),
        name: (invoice as any).warehouseId.name,
        country: (invoice as any).warehouseId.country,
        currency: (invoice as any).warehouseId.currency
      },
      generatedBy: {
        _id: ((invoice as any).generatedBy._id as string)?.toString(),
        name: (invoice as any).generatedBy.name,
        email: (invoice as any).generatedBy.email
      }
    }));

    return {
      success: true,
      data: serializedInvoices,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  } catch (error: any) {
    console.error('Error getting seller invoices:', error);
    return { success: false, message: error.message || 'Failed to fetch invoices' };
  }
});

export const getSellerInvoiceById = withDbConnection(async (invoiceId: string) => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, message: 'Unauthorized' };
    }

    if (![UserRole.SELLER].includes(user.role)) {
      return { success: false, message: 'Insufficient permissions' };
    }

    const invoice = await Invoice.findOne({
      _id: invoiceId,
      sellerId: new mongoose.Types.ObjectId(user._id) // Only allow access to seller's own invoices
    })
      .populate('sellerId', 'name email businessName phone country')
      .populate('warehouseId', 'name country currency address')
      .populate('generatedBy', 'name email')
      .lean();

    if (!invoice) {
      return { success: false, message: 'Invoice not found' };
    }

    // Get the actual orders and expeditions for this invoice
    const [orders, expeditions] = await Promise.all([
      Order.find({
        _id: { $in: (invoice as any).orderIds } // Only get orders that are specifically included in this invoice
      }).populate({
        path: 'products.productId',
        model: Product
      }),
      
      Expedition.find({
        _id: { $in: (invoice as any).expeditionIds } // Only get expeditions that are specifically included in this invoice
      }).lean()
    ]);

    return JSON.parse(JSON.stringify({
      success: true,
      data: {
        invoice,
        orders,
        expeditions
      }
    }));
  } catch (error: any) {
    console.error('Error getting seller invoice:', error);
    return { success: false, message: error.message || 'Failed to fetch invoice' };
  }
});