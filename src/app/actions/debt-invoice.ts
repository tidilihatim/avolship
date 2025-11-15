'use server';

import { withDbConnection } from '@/lib/db/db-connect';
import { getCurrentUser } from './auth';
import { UserRole } from '@/app/dashboard/_constant/user';
import DebtInvoice from '@/lib/db/models/invoice';
import Expedition from '@/lib/db/models/expedition';
import Order from '@/lib/db/models/order';
import User from '@/lib/db/models/user';
import Warehouse from '@/lib/db/models/warehouse';
import { ExpeditionStatus } from '@/app/dashboard/_constant/expedition';
import { OrderStatus } from '@/lib/db/models/order';
import { InvoiceStatus } from '@/types/invoice';
import mongoose from 'mongoose';

// Helper function to get already invoiced order and expedition IDs for a seller
export const getAlreadyInvoicedItems = withDbConnection(async (sellerId: string) => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, message: 'Unauthorized' };
    }

    if (![UserRole.ADMIN, UserRole.MODERATOR].includes(user.role)) {
      return { success: false, message: 'Insufficient permissions' };
    }

    // Get all invoices for this seller (including paid and unpaid)
    const invoices = await DebtInvoice.find({
      sellerId: new mongoose.Types.ObjectId(sellerId)
    }).select('orderIds expeditionIds refundOrderIds includedPreviousDebts').lean();

    // Extract all already invoiced IDs
    const invoicedOrderIds = new Set<string>();
    const invoicedExpeditionIds = new Set<string>();
    const invoicedRefundOrderIds = new Set<string>();
    const invoicedDebtIds = new Set<string>();

    invoices.forEach(invoice => {
      invoice.orderIds?.forEach((id: any) => invoicedOrderIds.add(id.toString()));
      invoice.expeditionIds?.forEach((id: any) => invoicedExpeditionIds.add(id.toString()));
      invoice.refundOrderIds?.forEach((id: any) => invoicedRefundOrderIds.add(id.toString()));
      invoice.includedPreviousDebts?.forEach((debt: any) => invoicedDebtIds.add(debt.invoiceId));
    });

    return {
      success: true,
      data: {
        orderIds: Array.from(invoicedOrderIds),
        expeditionIds: Array.from(invoicedExpeditionIds),
        refundOrderIds: Array.from(invoicedRefundOrderIds),
        debtIds: Array.from(invoicedDebtIds)
      }
    };
  } catch (error: any) {
    console.error('Error getting already invoiced items:', error);
    return { success: false, message: error.message || 'Failed to fetch invoiced items' };
  }
});

export const getSellerUnpaidDebts = withDbConnection(async (sellerId: string, warehouseId?: string, invoicedDebtIds?: string[]) => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, message: 'Unauthorized' };
    }

    if (![UserRole.ADMIN, UserRole.MODERATOR].includes(user.role)) {
      return { success: false, message: 'Insufficient permissions' };
    }

    // Filter by warehouse if provided
    let query: any = {
      sellerId: new mongoose.Types.ObjectId(sellerId),
      status: { $in: [InvoiceStatus.GENERATED, InvoiceStatus.OVERDUE] },
      $expr: { $lt: ['$summary.netPayment', 0] } // Only debt invoices (negative net payment)
    };

    if (warehouseId) {
      query.warehouseId = new mongoose.Types.ObjectId(warehouseId);
    }

    const unpaidDebts = await DebtInvoice.find(query)
      .populate('warehouseId', 'name country currency')
      .lean();

    // Transform to the format expected by the UI
    const formattedDebts = unpaidDebts.map((invoice: any) => ({
      invoiceId: invoice._id.toString(),
      invoiceNumber: invoice.invoiceNumber,
      periodStart: invoice.periodStart.toISOString().split('T')[0],
      periodEnd: invoice.periodEnd.toISOString().split('T')[0],
      debtAmount: invoice.summary?.netPayment || 0, // This will be negative for debt (use nested field)
      currency: invoice.currency,
      createdAt: invoice.createdAt.toISOString().split('T')[0],
      status: invoice.status,
      warehouseId: (invoice.warehouseId as any)._id.toString(),
      warehouseName: (invoice.warehouseId as any).name,
      warehouseCurrency: (invoice.warehouseId as any).currency,
      isInvoiced: invoicedDebtIds ? invoicedDebtIds.includes(invoice._id.toString()) : false
    }));

    return { success: true, data: formattedDebts };
  } catch (error: any) {
    console.error('Error getting seller unpaid debts:', error);
    return { success: false, message: error.message || 'Failed to fetch unpaid debts' };
  }
});

export const getSellerTotalDebt = withDbConnection(async (sellerId: string) => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, message: 'Unauthorized' };
    }

    if (![UserRole.ADMIN, UserRole.MODERATOR].includes(user.role)) {
      return { success: false, message: 'Insufficient permissions' };
    }

    // Use the static method from our model
    const totalDebt = await (DebtInvoice as any)?.calculateSellerTotalDebt(sellerId);

    return { success: true, data: { totalDebt } };
  } catch (error: any) {
    console.error('Error calculating seller total debt:', error);
    return { success: false, message: error.message || 'Failed to calculate total debt' };
  }
});

// Get expeditions for a seller within date range
export const getSellerExpeditions = withDbConnection(async (sellerId: string, warehouseId: string, startDate: string, endDate: string) => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, message: 'Unauthorized' };
    }

    if (![UserRole.ADMIN, UserRole.MODERATOR].includes(user.role)) {
      return { success: false, message: 'Insufficient permissions' };
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Get expeditions for the seller within the date range that are delivered
    const expeditions = await Expedition.find({
      sellerId: new mongoose.Types.ObjectId(sellerId),
      warehouseId: new mongoose.Types.ObjectId(warehouseId),
      expeditionDate: { $gte: start, $lte: end },
      status: ExpeditionStatus.DELIVERED, // Only delivered expeditions can be invoiced
    }).populate('products.productId', 'name code').lean();

    // Format for the UI
    const formattedExpeditions = expeditions.map((exp:any) => ({
      expeditionId: exp._id.toString(),
      expeditionCode: exp.expeditionCode,
      weight: exp.weight,
      transportMode: exp.transportMode,
      fromCountry: exp.fromCountry,
      expeditionDate: exp.expeditionDate.toISOString().split('T')[0],
      products: exp.products.map((p: any) => ({
        productId: p.productId?._id?.toString() || p.productId?.toString() || p.productId,
        productName: p.productName,
        productCode: p.productCode,
        quantity: p.quantity,
      })),
      carrierInfo: exp.carrierInfo || { name: exp.providerName || 'Unknown' },
      status: exp.status,
    }));

    return { success: true, data: formattedExpeditions };
  } catch (error: any) {
    console.error('Error getting seller expeditions:', error);
    return { success: false, message: error.message || 'Failed to fetch expeditions' };
  }
});

// Get orders for a seller within date range (for sales calculation)
export const getSellerOrders = withDbConnection(async (sellerId: string, warehouseId: string, startDate: string, endDate: string) => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, message: 'Unauthorized' };
    }

    if (![UserRole.ADMIN, UserRole.MODERATOR].includes(user.role)) {
      return { success: false, message: 'Insufficient permissions' };
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Get orders for the seller within the date range
    const orders = await Order.find({
      sellerId: new mongoose.Types.ObjectId(sellerId),
      warehouseId: new mongoose.Types.ObjectId(warehouseId),
      createdAt: { $gte: start, $lte: end },
      status: { $in: [OrderStatus.DELIVERED, OrderStatus.REFUNDED] }, // Include both delivered and refunded
    }).populate('products.productId', 'name code').populate('customer', 'name phone').lean();

    // Separate delivered orders and refunded orders
    const deliveredOrders = orders.filter(order => order.status === OrderStatus.DELIVERED);
    const refundedOrders = orders.filter(order => order.status === OrderStatus.REFUNDED);

    // Format delivered orders (these contribute to sales)
    const formattedDeliveredOrders = deliveredOrders.map(order => ({
      _id: order._id?.toString() || order._id,
      orderId: order.orderId,
      orderDate: order.orderDate ? new Date(order.orderDate).toISOString() : new Date(order.createdAt).toISOString(),
      customerName: (order.customer as any)?.name || 'Unknown',
      customerPhone: (order.customer as any)?.phoneNumbers?.[0] || (order.customer as any)?.phone || 'Unknown',
      products: order.products.map((p: any) => ({
        productId: p.productId?._id?.toString() || p.productId?.toString() || p.productId,
        productName: p.productId?.name || p.productName || 'Unknown Product',
        quantity: p.quantity,
        unitPrice: p.unitPrice,
        totalPrice: p.unitPrice * p.quantity,
      })),
      totalAmount: order.finalTotalPrice || order.totalPrice || 0,
      totalDiscountAmount: order.totalDiscountAmount || 0,
      priceAdjustments: (order.priceAdjustments || []).map((adj: any) => ({
        productId: adj.productId?.toString() || adj.productId,
        originalPrice: adj.originalPrice,
        adjustedPrice: adj.adjustedPrice,
        discountAmount: adj.discountAmount,
        discountPercentage: adj.discountPercentage,
        reason: adj.reason,
        appliedBy: adj.appliedBy?.toString() || adj.appliedBy,
        appliedAt: adj.appliedAt ? new Date(adj.appliedAt).toISOString() : null,
        notes: adj.notes || null,
      })),
      status: order.status,
      statusComment: order.statusComment || null,
    }));

    // Format refunded orders (these reduce sales but we show original prices)
    const formattedRefundedOrders = refundedOrders.map(order => ({
      _id: order._id?.toString() || order._id,
      orderId: order.orderId,
      refundDate: order.updatedAt ? new Date(order.updatedAt).toISOString() : new Date().toISOString(),
      customerName: (order.customer as any)?.name || 'Unknown',
      customerPhone: (order.customer as any)?.phoneNumbers?.[0] || (order.customer as any)?.phone || 'Unknown',
      products: order.products.map((p: any) => ({
        productId: p.productId?._id?.toString() || p.productId?.toString() || p.productId,
        productName: p.productId?.name || p.productName || 'Unknown Product',
        quantity: p.quantity,
        unitPrice: p.unitPrice,
        totalPrice: p.unitPrice * p.quantity,
      })),
      originalAmount: order.finalTotalPrice || order.totalPrice || 0, // Show final price after discounts
      refundReason: order.refundReason || 'No reason provided',
      status: order.status,
      statusComment: order.statusComment || null, // This will show the refund reason from call center
    }));

    return {
      success: true,
      data: {
        deliveredOrders: formattedDeliveredOrders,
        refundedOrders: formattedRefundedOrders,
      }
    };
  } catch (error: any) {
    console.error('Error getting seller orders:', error);
    return { success: false, message: error.message || 'Failed to fetch orders' };
  }
});

// Generate debt-based invoice preview
export const generateDebtInvoicePreview = withDbConnection(async (data: any) => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, message: 'Unauthorized' };
    }

    if (![UserRole.ADMIN, UserRole.MODERATOR].includes(user.role)) {
      return { success: false, message: 'Insufficient permissions' };
    }

    const {
      sellerId,
      warehouseId,
      periodStart,
      periodEnd,
      customFees = [],
      manualExpeditions = [],
      manualOrders = [],
      selectedPreviousDebts = [],
      currencyConversion,
      paymentMethod
    } = data;

    // Basic validation
    if (!sellerId || !warehouseId || !periodStart || !periodEnd || !paymentMethod) {
      return { success: false, message: 'Missing required fields' };
    }

    const startDate = new Date(periodStart);
    const endDate = new Date(periodEnd);

    if (startDate >= endDate) {
      return { success: false, message: 'Start date must be before end date' };
    }

    // Get real orders and expeditions for the period, plus already invoiced items
    const [ordersResult, expeditionsResult, invoicedItemsResult] = await Promise.all([
      getSellerOrders(sellerId, warehouseId, periodStart, periodEnd),
      getSellerExpeditions(sellerId, warehouseId, periodStart, periodEnd),
      getAlreadyInvoicedItems(sellerId)
    ]);

    if (!ordersResult.success) {
      return { success: false, message: 'Failed to fetch orders: ' + ordersResult.message };
    }

    if (!expeditionsResult.success) {
      return { success: false, message: 'Failed to fetch expeditions: ' + expeditionsResult.message };
    }

    if (!invoicedItemsResult.success) {
      return { success: false, message: 'Failed to fetch invoiced items: ' + invoicedItemsResult.message };
    }

    const { deliveredOrders: allDeliveredOrders, refundedOrders: allRefundedOrders } = ordersResult.data!;
    const allExpeditions = expeditionsResult.data!;
    const invoicedItems = invoicedItemsResult.data!;

    // Use manual order selection if provided, otherwise filter out already invoiced items
    let deliveredOrders, refundedOrders;

    if (manualOrders.length > 0) {
      // Filter orders based on manual selection
      const selectedOrderIds = manualOrders.filter((order: any) => order.include).map((order: any) => order.orderId);
      deliveredOrders = allDeliveredOrders.filter((order: any) =>
        selectedOrderIds.includes(order._id?.toString() || order.id)
      );
      refundedOrders = allRefundedOrders.filter((order: any) =>
        selectedOrderIds.includes(order._id?.toString() || order.id)
      );
    } else {
      // Default behavior: filter out already invoiced items
      deliveredOrders = allDeliveredOrders.filter((order: any) =>
        !invoicedItems.orderIds.includes(order._id?.toString() || order.id)
      );
      refundedOrders = allRefundedOrders.filter((order: any) =>
        !invoicedItems.refundOrderIds.includes(order._id?.toString() || order.id)
      );
    }

    // Allow all expeditions to be available for admin selection (remove invoice restriction)
    const availableExpeditions = allExpeditions;

    // Calculate totals from real data
    const totalSales = deliveredOrders.reduce((sum: number, order: any) => sum + (order.totalAmount || 0), 0);
    const totalRefundAmount = refundedOrders.reduce((sum: number, order: any) => sum + (order.originalAmount || 0), 0);

    // Filter selected expeditions and calculate costs
    const selectedExpeditions = manualExpeditions.length > 0 ? manualExpeditions : [];
    const totalExpeditionCosts = selectedExpeditions.reduce((sum: number, exp: any) => sum + (exp.totalCost || 0), 0);

    // Calculate service fees from custom fees
    const totalCustomFees = customFees.reduce((sum: number, fee: any) => sum + fee.amount, 0);

    // Admin-configurable refund processing fee (per refund order)
    const refundProcessingFees = refundedOrders.length * (data.refundProcessingFee || 0);

    // Correct Logic - ONLY CHARGE FEES (NO SALES IN CALCULATION):
    // We only charge our fees to the seller:
    // - Expedition fees (weight × fee per KG)
    // - Service fees (refund fees, custom fees, etc.)
    // - Previous debt
    // Sales revenue is SELLER'S MONEY - we don't touch it

    // Get previous debt amounts by looking up the actual debt invoices
    let previousDebtAmount = 0;
    if (selectedPreviousDebts && selectedPreviousDebts.length > 0) {
      try {
        const previousDebtInvoices = await DebtInvoice.find({
          _id: { $in: selectedPreviousDebts.map((id:any) => new mongoose.Types.ObjectId(id)) },
          sellerId: new mongoose.Types.ObjectId(sellerId)
        }).select('summary.netPayment').lean();

        previousDebtAmount = previousDebtInvoices.reduce((sum, invoice) => {
          const debtAmount = Math.abs(invoice.summary.netPayment || 0);
          return sum + debtAmount;
        }, 0);
      } catch (error) {
        console.error('Error fetching previous debt amounts:', error);
        previousDebtAmount = 0;
      }
    }

    // Our expedition fees (weight × fee per KG)
    const expeditionFeesOwed = totalExpeditionCosts;

    // Our service fees (custom fees + refund fees + legacy fees)
    const legacyFees = Object.values(data.fees || {})
      .filter((fee): fee is number => typeof fee === 'number')
      .reduce((sum, fee) => sum + fee, 0);
    const serviceFees = totalCustomFees + refundProcessingFees + legacyFees;

    // Total amount seller owes us (fees + refund amounts + previous debt)
    const totalFeesOwed = expeditionFeesOwed + serviceFees + totalRefundAmount + previousDebtAmount;

    // Net Payment Logic:
    // If seller revenue > total fees = they are profitable (positive net payment)
    // If seller revenue < total fees = they are in debt (negative net payment)
    const netPayment = totalSales - totalFeesOwed;

    // Get real seller and warehouse data
    const seller = await User.findById(sellerId).select('name email businessName').lean();
    const warehouse = await Warehouse.findById(warehouseId).select('name country currency').lean();

    if (!seller || !warehouse) {
      return { success: false, message: 'Seller or warehouse not found' };
    }

    const realPreview = {
      sellerId,
      sellerName: (seller as any).name,
      sellerEmail: (seller as any).email,
      sellerBusinessName: (seller as any).businessName,
      warehouseId,
      warehouseName: (warehouse as any).name,
      warehouseCountry: (warehouse as any).country,
      currency: (warehouse as any).currency,
      periodStart,
      periodEnd,
      paymentMethod,

      // Real counts
      totalOrders: deliveredOrders.length,
      totalExpeditions: selectedExpeditions.length,
      totalProducts: deliveredOrders.reduce((sum: number, order: any) => sum + order.products.length, 0),
      totalQuantity: deliveredOrders.reduce((sum: number, order: any) =>
        sum + order.products.reduce((pSum: number, p: any) => pSum + p.quantity, 0), 0),
      totalRefunds: refundedOrders.length,

      // Real financial data
      totalSales,
      totalExpeditionCosts,
      totalRefundAmount,
      totalCustomFees,
      totalHiddenFees: refundProcessingFees,

      // Available expeditions for admin selection
      availableExpeditions,
      selectedExpeditions: await Promise.all(
        selectedExpeditions.map(async (manualExp: any) => {
          const expedition: any = availableExpeditions.find((exp: any) => exp.expeditionId === manualExp.expeditionId);
          return {
            id: manualExp.expeditionId,
            expeditionId: manualExp.expeditionId,
            expeditionCode: expedition?.expeditionCode || '',
            weight: expedition?.weight || 0,
            feePerKg: manualExp.feePerKg,
            totalCost: manualExp.totalCost,
            originCountry: expedition?.fromCountry || '',
            carrier: expedition?.carrierInfo?.name || expedition?.providerName || 'Unknown',
            transportMode: expedition?.transportMode || 'air',
            products: expedition?.products || [],
          };
        })
      ),

      // Previous debt
      selectedPreviousDebts,
      previousDebtAmount,

      // Correct model - ONLY FEES (NO SALES)
      expeditionFeesOwed, // Expedition fees (weight × fee per KG)
      serviceFees, // Service fees (refund, custom, etc.)
      totalFeesOwed, // Total amount seller owes us
      legacyFees, // Legacy fees (confirmation, warehouse, shipping, etc.)
      netPayment, // Net result: positive = seller profit, negative = seller debt

      // Sales info for display only (NOT in calculation)
      sellerSalesRevenue: totalSales, // For reference only
      sellerProfitability: netPayment > 0, // Is seller profitable?

      // Legacy fields for compatibility
      grossSales: totalSales,
      totalFees: totalFeesOwed,
      totalDeductions: totalFeesOwed,
      isDebt: netPayment < 0, // True if seller owes us money (negative net payment)
      salesCredits: 0, // No sales credits in calculation
      expeditionDebt: expeditionFeesOwed,
      ourExpeditionFees: expeditionFeesOwed,
      ourServiceFees: serviceFees,

      // Currency conversion
      currencyConversion: currencyConversion?.enabled ? currencyConversion : null,

      // Real data arrays
      orderData: deliveredOrders,
      expeditionData: availableExpeditions,
      refundData: refundedOrders
    };

    return { success: true, data: realPreview };
  } catch (error: any) {
    console.error('Error generating debt invoice preview:', error);
    return { success: false, message: error.message || 'Failed to generate preview' };
  }
});

// Create debt-based invoice
export const createDebtInvoice = withDbConnection(async (data: any) => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, message: 'Unauthorized' };
    }

    if (![UserRole.ADMIN, UserRole.MODERATOR].includes(user.role)) {
      return { success: false, message: 'Insufficient permissions' };
    }

    // First get the preview to validate and calculate
    const previewResult = await generateDebtInvoicePreview(data);
    if (!previewResult.success || !previewResult.data) {
      return previewResult;
    }

    const preview = previewResult.data;

    // Extract IDs from the preview data to track which items are being invoiced
    const orderIds = preview.orderData ? preview.orderData.map((order: any) => order._id || order.id).filter(Boolean) : [];
    const refundOrderIds = preview.refundData ? preview.refundData.map((order: any) => order._id || order.id).filter(Boolean) : [];
    const expeditionIds = data.manualExpeditions ? data.manualExpeditions.map((exp: any) => exp.expeditionId).filter(Boolean) : [];

    // Transform selected previous debts from IDs to full debt objects
    let includedPreviousDebts: any[] = [];
    if (data.selectedPreviousDebts && data.selectedPreviousDebts.length > 0) {
      try {
        const previousDebtInvoices = await DebtInvoice.find({
          _id: { $in: data.selectedPreviousDebts.map((id: string) => new mongoose.Types.ObjectId(id)) },
          sellerId: new mongoose.Types.ObjectId(data.sellerId)
        }).select('_id invoiceNumber summary.netPayment periodStart periodEnd').lean();

        includedPreviousDebts = previousDebtInvoices.map((invoice: any) => ({
          invoiceId: invoice._id.toString(),
          invoiceNumber: invoice.invoiceNumber,
          debtAmount: Math.abs(invoice.summary?.netPayment || 0),
          periodStart: invoice.periodStart,
          periodEnd: invoice.periodEnd,
        }));
      } catch (error) {
        console.error('Error fetching previous debt details:', error);
        // Continue with empty array if there's an error
        includedPreviousDebts = [];
      }
    }

    // Create the invoice using the model
    const invoice = new DebtInvoice({
      sellerId: data.sellerId,
      warehouseId: data.warehouseId,
      periodStart: new Date(data.periodStart),
      periodEnd: new Date(data.periodEnd),
      paymentMethod: data.paymentMethod,

      // Track which items are included in this invoice
      orderIds: orderIds.map((id: string) => new mongoose.Types.ObjectId(id)),
      expeditionIds: expeditionIds.map((id: string) => new mongoose.Types.ObjectId(id)),
      refundOrderIds: refundOrderIds.map((id: string) => new mongoose.Types.ObjectId(id)),

      // Include the calculated data
      manualExpeditions: data.manualExpeditions || [],
      includedPreviousDebts: includedPreviousDebts,

      fees: {
        // Legacy fees
        confirmationFee: data.fees?.confirmationFee || 0,
        serviceFee: data.fees?.serviceFee || 0,
        warehouseFee: data.fees?.warehouseFee || 0,
        shippingFee: data.fees?.shippingFee || 0,
        processingFee: data.fees?.processingFee || 0,
        expeditionFee: data.fees?.expeditionFee || 0,

        // Custom fees
        customFees: data.customFees || [],

        // Hidden fees
        refundProcessingFees: preview.totalHiddenFees,
      },

      summary: {
        totalOrders: preview.totalOrders,
        totalExpeditions: preview.totalExpeditions,
        totalProducts: preview.totalProducts,
        totalQuantity: preview.totalQuantity,
        totalRefunds: preview.totalRefunds,
        totalSales: preview.totalSales,
        totalExpeditionCosts: preview.totalExpeditionCosts,
        totalRefundAmount: preview.totalRefundAmount,
        totalCustomFees: preview.totalCustomFees,
        totalHiddenFees: preview.totalHiddenFees,
        previousDebtAmount: preview.previousDebtAmount,
        grossSales: preview.grossSales,
        totalDeductions: preview.totalDeductions,
        netPayment: preview.netPayment,
        isDebt: preview.isDebt,
      },

      currency: preview.currency,
      currencyConversion: data.currencyConversion?.enabled ? data.currencyConversion : undefined,
      notes: data.notes,
      terms: data.terms,
      generatedBy: user._id,
      status: InvoiceStatus.GENERATED,
    });

    await invoice.save();

    return {
      success: true,
      message: 'Debt-based invoice created successfully',
      data: {
        invoiceId: invoice._id,
        invoiceNumber: invoice.invoiceNumber,
      }
    };

  } catch (error: any) {
    console.error('Error creating debt invoice:', error);
    return { success: false, message: error.message || 'Failed to create invoice' };
  }
});

// Get debt invoice by ID with full details
export const getDebtInvoiceById = withDbConnection(async (invoiceId: string) => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, message: 'Unauthorized' };
    }

    if (![UserRole.ADMIN, UserRole.MODERATOR].includes(user.role)) {
      return { success: false, message: 'Insufficient permissions' };
    }

    // Get the debt invoice
    const invoice = await DebtInvoice.findById(invoiceId)
      .populate('sellerId', 'name email businessName phone country')
      .populate('warehouseId', 'name country currency address')
      .populate('generatedBy', 'name email')
      .lean();

    if (!invoice) {
      return { success: false, message: 'Invoice not found' };
    }

    // Get the actual orders, expeditions, and refunds for this invoice
    const [orders, expeditions, refundOrders] = await Promise.all([
      Order.find({
        _id: { $in: (invoice as any).orderIds }
      })
      .populate('products.productId', 'name price currency')
      .populate('customer', 'name phone')
      .lean(),

      Expedition.find({
        _id: { $in: (invoice as any).expeditionIds }
      })
      .populate('products.productId', 'name price currency')
      .populate('providerId', 'name')
      .lean(),

      Order.find({
        _id: { $in: (invoice as any).refundOrderIds }
      })
      .populate('products.productId', 'name price currency')
      .populate('customer', 'name phone')
      .lean()
    ]);

    // Serialize the data to avoid MongoDB object serialization issues
    return {
      success: true,
      data: JSON.parse(JSON.stringify({
        invoice,
        orders,
        expeditions,
        refundOrders
      }))
    };

  } catch (error: any) {
    console.error('Error getting debt invoice:', error);
    return { success: false, message: error.message || 'Failed to fetch invoice' };
  }
});

// Update debt invoice status
export const updateDebtInvoiceStatus = withDbConnection(async (invoiceId: string, status: InvoiceStatus) => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, message: 'Unauthorized' };
    }

    if (![UserRole.ADMIN, UserRole.MODERATOR].includes(user.role)) {
      return { success: false, message: 'Insufficient permissions' };
    }

    const invoice = await DebtInvoice.findById(invoiceId);
    if (!invoice) {
      return { success: false, message: 'Invoice not found' };
    }

    // Update invoice status
    invoice.status = status;

    if (status === InvoiceStatus.PAID) {
      invoice.paidDate = new Date();

      // Update all orders to PROCESSED status
      // 1. Update regular orders from orderIds array
      if (invoice.orderIds && invoice.orderIds.length > 0) {
        await Order.updateMany(
          { _id: { $in: invoice.orderIds } },
          { $set: { status: OrderStatus.PROCESSED } }
        );
      }

      // 2. Update manual orders that are included
      const includedManualOrderIds = invoice.manualOrders
        ?.filter((mo: any) => mo.include)
        .map((mo: any) => mo.orderId) || [];

      if (includedManualOrderIds.length > 0) {
        await Order.updateMany(
          { _id: { $in: includedManualOrderIds } },
          { $set: { status: OrderStatus.PROCESSED } }
        );
      }
    }

    await invoice.save();

    return { success: true, message: 'Invoice status updated successfully' };

  } catch (error: any) {
    console.error('Error updating debt invoice status:', error);
    return { success: false, message: error.message || 'Failed to update invoice status' };
  }
});

// Get debt-based invoices list with pagination for admin interface
export const getDebtInvoicesList = withDbConnection(async (filters: any) => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, message: 'Unauthorized' };
    }

    if (![UserRole.ADMIN, UserRole.MODERATOR].includes(user.role)) {
      return { success: false, message: 'Insufficient permissions' };
    }

    const { page = 1, limit = 10, search, status, seller, startDate, endDate } = filters;

    // Build filter object for the model method
    const queryFilters: any = {};

    if (seller) {
      queryFilters.sellerId = seller;
    }
    if (status) {
      queryFilters.status = status;
    }
    if (startDate && endDate) {
      queryFilters.startDate = startDate;
      queryFilters.endDate = endDate;
    }
    if (search) {
      queryFilters.search = search;
    }

    // Use the model's static method for pagination
    const result = await (DebtInvoice as any)?.getInvoicesWithPagination(queryFilters, page, limit);

    // Serialize the data for client consumption
    const serializedInvoices = result.invoices.map((invoice:any) => ({
      _id: invoice._id.toString(),
      invoiceNumber: invoice.invoiceNumber,
      sellerId: invoice.sellerId.toString(),
      sellerName: (invoice.sellerId as any)?.name || 'Unknown',
      sellerEmail: (invoice.sellerId as any)?.email || 'Unknown',
      sellerBusinessName: (invoice.sellerId as any)?.businessName || null,
      warehouseId: invoice.warehouseId.toString(),
      warehouseName: (invoice.warehouseId as any)?.name || 'Unknown',
      warehouseCountry: (invoice.warehouseId as any)?.country || 'Unknown',
      currency: invoice.currency,
      periodStart: invoice.periodStart.toISOString().split('T')[0],
      periodEnd: invoice.periodEnd.toISOString().split('T')[0],
      status: invoice.status,
      paymentMethod: invoice.paymentMethod,

      // Financial summary (with null checks)
      totalSales: invoice.summary?.totalSales || 0,
      totalFees: invoice.fees?.totalFees || 0,
      netPayment: invoice.summary?.netPayment || 0,
      isDebt: invoice.summary?.isDebt || false,
      totalOrders: invoice.summary?.totalOrders || 0,
      totalExpeditions: invoice.summary?.totalExpeditions || 0,

      // Generation info
      generatedBy: (invoice.generatedBy as any)?.name || 'Unknown',
      generatedAt: invoice.generatedAt.toISOString().split('T')[0],
      createdAt: invoice.createdAt.toISOString().split('T')[0],
      updatedAt: invoice.updatedAt.toISOString().split('T')[0],
    }));

    return {
      success: true,
      data: serializedInvoices,
      pagination: {
        total: result.total,
        totalPages: result.totalPages,
        page: page,
        limit: limit,
      }
    };

  } catch (error: any) {
    console.error('Error fetching debt invoices list:', error);
    return { success: false, message: error.message || 'Failed to fetch invoices' };
  }
});

// Get debt-based invoices list for seller (filtered to hide sensitive data)
export const getSellerDebtInvoicesList = withDbConnection(async (filters: any) => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, message: 'Unauthorized' };
    }

    if (![UserRole.SELLER].includes(user.role)) {
      return { success: false, message: 'Insufficient permissions' };
    }

    const { page = 1, limit = 10, search, status, startDate, endDate } = filters;

    // Build filter object for the model method (only show invoices for current seller)
    const queryFilters: any = {
      sellerId: user._id.toString() // Only show current seller's invoices
    };

    if (status) {
      queryFilters.status = status;
    }
    if (startDate && endDate) {
      queryFilters.startDate = startDate;
      queryFilters.endDate = endDate;
    }
    if (search) {
      queryFilters.search = search;
    }

    // Use the model's static method for pagination
    const result = await (DebtInvoice as any)?.getInvoicesWithPagination(queryFilters, page, limit) ;

    // Serialize the data for seller consumption (hide sensitive information)
    const serializedInvoices = result.invoices.map((invoice:any) => ({
      _id: invoice._id.toString(),
      invoiceNumber: invoice.invoiceNumber,
      currency: invoice.currency,
      periodStart: invoice.periodStart.toISOString().split('T')[0],
      periodEnd: invoice.periodEnd.toISOString().split('T')[0],
      status: invoice.status,
      paymentMethod: invoice.paymentMethod,

      // Warehouse info (sellers can see this)
      warehouseName: (invoice.warehouseId as any)?.name || 'Unknown',
      warehouseCountry: (invoice.warehouseId as any)?.country || 'Unknown',

      // Basic counts (sellers can see this)
      totalOrders: invoice.summary?.totalOrders || 0,
      totalExpeditions: invoice.summary?.totalExpeditions || 0,

      // Financial summary (SELLER VIEW - NO PROCESSING FEES OR PROFITABILITY)
      totalSales: invoice.summary?.totalSales || 0, // Their revenue
      totalExpeditionCosts: invoice.summary?.totalExpeditionCosts || 0, // Expedition costs they pay
      totalRefundAmount: invoice.summary?.totalRefundAmount || 0, // Refunds (reduces their revenue)
      netAmount: invoice.summary?.netPayment || 0, // Final amount (positive = they receive, negative = they owe)

      // DO NOT SHOW TO SELLER:
      // - totalHiddenFees (processing fees)
      // - isDebt/profitability status from our perspective
      // - Our fee calculations
      // - Previous debt details

      // Generation info
      generatedAt: invoice.generatedAt.toISOString().split('T')[0],
      createdAt: invoice.createdAt.toISOString().split('T')[0],

      // Additional notes if any
      notes: invoice.notes,
    }));

    return {
      success: true,
      data: serializedInvoices,
      pagination: {
        total: result.total,
        totalPages: result.totalPages,
        page: page,
        limit: limit,
      }
    };

  } catch (error: any) {
    console.error('Error fetching seller debt invoices list:', error);
    return { success: false, message: error.message || 'Failed to fetch invoices' };
  }
});

// Get debt-based invoice details for seller (filtered to hide sensitive data)
export const getSellerDebtInvoiceById = withDbConnection(async (invoiceId: string) => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, message: 'Unauthorized' };
    }

    if (![UserRole.SELLER].includes(user.role)) {
      return { success: false, message: 'Insufficient permissions' };
    }

    // Find the invoice and ensure it belongs to the current seller
    const invoice: any = await DebtInvoice.findOne({
      _id: new mongoose.Types.ObjectId(invoiceId),
      sellerId: new mongoose.Types.ObjectId(user._id) // Only allow access to their own invoices
    })
    .populate('sellerId', 'name email businessName phone country')
    .populate('warehouseId', 'name country currency')
    .lean();

    if (!invoice) {
      return { success: false, message: 'Invoice not found or access denied' };
    }

    // Get orders and expeditions (only basic data for sellers)
    const orderIds = invoice.orderIds || [];
    const expeditionIds = invoice.expeditionIds || [];
    const refundOrderIds = invoice.refundOrderIds || [];

    const [orders, expeditions, refundOrders] = await Promise.all([
      orderIds.length > 0 ? Order.find({ _id: { $in: orderIds } })
        .populate('products.productId', 'name code')
        .populate('customer', 'name phone')
        .lean() : [],
      expeditionIds.length > 0 ? Expedition.find({ _id: { $in: expeditionIds } })
        .populate('products.productId', 'name code')
        .populate('providerId', 'name')
        .lean() : [],
      refundOrderIds.length > 0 ? Order.find({ _id: { $in: refundOrderIds } })
        .populate('products.productId', 'name code')
        .populate('customer', 'name phone')
        .lean() : []
    ]);

    // Create seller-safe invoice data (preserve original structure but hide sensitive fields)
    const sellerInvoiceData = {
      ...invoice,
      _id: invoice._id.toString(),

      // Hide sensitive admin fields by removing them
      generatedBy: undefined,
      // Show actual fees for transparency
      fees: {
        confirmationFee: invoice.fees?.confirmationFee || 0,
        serviceFee: invoice.fees?.serviceFee || 0,
        warehouseFee: invoice.fees?.warehouseFee || 0,
        shippingFee: invoice.fees?.shippingFee || 0,
        processingFee: invoice.fees?.processingFee || 0,
        expeditionFee: invoice.fees?.expeditionFee || 0,
        customFees: invoice.fees?.customFees || [],
        refundProcessingFees: invoice.fees?.refundProcessingFees || 0,
      },

      // Keep seller and warehouse info properly populated
      sellerId: {
        _id: (invoice.sellerId as any)._id.toString(),
        name: (invoice.sellerId as any).name,
        email: (invoice.sellerId as any).email,
        businessName: (invoice.sellerId as any).businessName,
        phone: (invoice.sellerId as any).phone,
        country: (invoice.sellerId as any).country,
      },
      warehouseId: {
        _id: invoice.warehouseId._id.toString(),
        name: (invoice.warehouseId as any).name,
        country: (invoice.warehouseId as any).country,
        currency: (invoice.warehouseId as any).currency,
      },
    };

    // Serialize orders for seller view
    const serializedOrders = orders.map((order: any) => ({
      _id: order._id.toString(),
      orderId: order.orderId,
      status: order.status,
      totalPrice: order.totalPrice,
      finalTotalPrice: order.finalTotalPrice,
      totalDiscountAmount: order.totalDiscountAmount,
      refundReason: order.refundReason,
      refundAmount: order.refundAmount,
      priceAdjustments: (order.priceAdjustments || []).map((adj: any) => ({
        productId: adj.productId.toString(),
        originalPrice: adj.originalPrice,
        adjustedPrice: adj.adjustedPrice,
        discountAmount: adj.discountAmount,
        discountPercentage: adj.discountPercentage,
        reason: adj.reason,
        appliedBy: adj.appliedBy.toString(),
        appliedAt: adj.appliedAt,
        notes: adj.notes,
        _id: adj._id.toString()
      })),
      createdAt: order.createdAt,
      customer: {
        name: order.customer?.name || 'Unknown Customer'
      },
      products: order.products?.map((product: any) => ({
        productId: {
          _id: product.productId._id.toString(),
          name: product.productId.name,
          code: product.productId.code
        },
        quantity: product.quantity,
        unitPrice: product.unitPrice
      })) || []
    }));

    // Serialize expeditions for seller view
    const serializedExpeditions = expeditions.map((expedition: any) => ({
      _id: expedition._id.toString(),
      expeditionCode: expedition.expeditionCode,
      totalValue: expedition.totalValue,
      expeditionDate: expedition.expeditionDate,
      isPaid: expedition.isPaid,
      status: expedition.status,
      weight: expedition.weight || 0,
      transportMode: expedition.transportMode || 'Unknown',
      fromCountry: expedition.fromCountry || 'Unknown',
      providerId: expedition.providerId,
      providerName: expedition.providerName,
      carrierInfo: expedition.carrierInfo,
      products: expedition.products?.map((product: any) => ({
        productId: product.productId?._id?.toString() || '',
        productName: product.productId?.name || 'Unknown Product',
        productCode: product.productCode || product.productId?.code || '',
        quantity: product.quantity || 0,
      })) || []
    }));

    // Serialize refund orders for seller view
    const serializedRefundOrders = refundOrders.map((order: any) => ({
      _id: order._id.toString(),
      orderId: order.orderId,
      status: order.status,
      totalPrice: order.totalPrice,
      finalTotalPrice: order.finalTotalPrice,
      totalDiscountAmount: order.totalDiscountAmount,
      refundReason: order.refundReason,
      refundAmount: order.refundAmount,
      statusComment: order.statusComment,
      priceAdjustments: (order.priceAdjustments || []).map((adj: any) => ({
        productId: adj.productId.toString(),
        originalPrice: adj.originalPrice,
        adjustedPrice: adj.adjustedPrice,
        discountAmount: adj.discountAmount,
        discountPercentage: adj.discountPercentage,
        reason: adj.reason,
        appliedBy: adj.appliedBy.toString(),
        appliedAt: adj.appliedAt,
        notes: adj.notes,
        _id: adj._id.toString()
      })),
      createdAt: order.createdAt,
      customer: {
        name: order.customer?.name || 'Unknown Customer'
      },
      products: order.products?.map((product: any) => ({
        productId: {
          _id: product.productId._id.toString(),
          name: product.productId.name,
          code: product.productId.code
        },
        quantity: product.quantity,
        unitPrice: product.unitPrice
      })) || []
    }));

    return {
      success: true,
      data: JSON.parse(JSON.stringify({
        invoice: sellerInvoiceData,
        orders: serializedOrders,
        expeditions: serializedExpeditions,
        refundOrders: serializedRefundOrders,
      }))
    };

  } catch (error: any) {
    console.error('Error fetching seller debt invoice details:', error);
    return { success: false, message: error.message || 'Failed to fetch invoice details' };
  }
});