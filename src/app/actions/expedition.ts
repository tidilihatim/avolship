// src/app/actions/expedition.ts
'use server';

import { withDbConnection } from '@/lib/db/db-connect';
import User, { UserRole, IUser } from '@/lib/db/models/user';
import Warehouse, { IWarehouse } from '@/lib/db/models/warehouse';
import { ExpeditionTableData, ExpeditionFilters, WarehouseOption, SellerOption, ProviderOption } from '@/types/expedition';
import { PaginationData } from '@/types/user';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/config/auth';
import mongoose from 'mongoose';
import Expedition, { IExpedition } from '@/lib/db/models/expedition';
import { ExpeditionStatus, ProviderType } from '../dashboard/_constant/expedition';
import { ExpeditionInput, ProductOption } from '@/types/expedition-form';
import Product from '@/lib/db/models/product';
import StockHistory, { StockMovementType, StockMovementReason } from '@/lib/db/models/stock-history';
import { sendNotification, sendNotificationToUserType } from '@/lib/notifications/send-notification';
import { NotificationType } from '@/types/notification';
import { NotificationIcon } from '@/lib/db/models/notification';

/**
 * Get expeditions with filters and pagination
 */
export const getExpeditions = withDbConnection(async (
  page: number = 1,
  limit: number = 10,
  filters: ExpeditionFilters = {}
): Promise<{
  expeditions: ExpeditionTableData[] | null;
  pagination: PaginationData | null;
  success: boolean;
  message: string;
}> => {
  try {

    // Get current user and check permissions
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { expeditions: null, pagination: null, success: false, message: 'Unauthorized' };
    const user = await User.findById(session?.user?.id) as IUser | null;
    if (!user) {
      redirect('/auth/login');
    }

    // Build query based on user role
    const query: any = {};

    // Sellers can only see their own expeditions
    if (user.role === UserRole.SELLER) {
      query.sellerId = user._id;
    }

    // Apply filters
    if (filters.search) {
      query.$or = [
        { expeditionCode: { $regex: filters.search, $options: 'i' } },
        { sellerName: { $regex: filters.search, $options: 'i' } },
        { warehouseName: { $regex: filters.search, $options: 'i' } },
        { fromCountry: { $regex: filters.search, $options: 'i' } },
        { trackingNumber: { $regex: filters.search, $options: 'i' } },
      ];
    }

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.transportMode) {
      query.transportMode = filters.transportMode;
    }

    if (filters.providerType) {
      query.providerType = filters.providerType;
    }

    if (filters.warehouseId) {
      query.warehouseId = filters.warehouseId;
    }

    // Admin/Moderator can filter by seller
    if (filters.sellerId && (user.role === UserRole.ADMIN || user.role === UserRole.MODERATOR)) {
      query.sellerId = filters.sellerId;
    }

    if (filters.fromCountry) {
      query.fromCountry = filters.fromCountry;
    }

    // Date range filter
    if (filters.dateFrom || filters.dateTo) {
      query.expeditionDate = {};
      if (filters.dateFrom) {
        query.expeditionDate.$gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        query.expeditionDate.$lte = new Date(filters.dateTo);
      }
    }

    // Weight range filter
    if (filters.weightMin !== undefined || filters.weightMax !== undefined) {
      query.weight = {};
      if (filters.weightMin !== undefined) {
        query.weight.$gte = filters.weightMin;
      }
      if (filters.weightMax !== undefined) {
        query.weight.$lte = filters.weightMax;
      }
    }

    // Calculate pagination
    const skip = (page - 1) * limit;
    const total = await Expedition.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    // Fetch expeditions with proper typing and populate products
    const expeditions = await Expedition.find(query)
      .sort({ createdAt: -1 })
      .populate("warehouseId")
      .populate({
        path: 'products.productId',
        model: 'Product',
        select: 'name code description image'
      })
      .skip(skip)
      .limit(limit)
      .lean();

    // Transform data for table display
    const expeditionData: ExpeditionTableData[] = expeditions.map((expedition: any) => {
      // Transform products with populated data
      const transformedProducts = expedition.products?.map((product: any) => ({
        productId: product.productId?._id?.toString() || product.productId?.toString() || '',
        productName: product.productName || product.productId?.name || '',
        productCode: product.productCode || product.productId?.code || '',
        quantity: product.quantity || 0,
        unitPrice: product.unitPrice,
        image: product.productId?.image?.url || '',
        description: product.productId?.description || '',
      })) || [];

      return {
        _id: expedition._id.toString(),
        expeditionCode: expedition.expeditionCode,
        sellerId: expedition.sellerId.toString(),
        sellerName: expedition.sellerName,
        fromCountry: expedition.fromCountry,
        weight: expedition.weight,
        expeditionDate: expedition.expeditionDate,
        transportMode: expedition.transportMode,
        warehouseId: expedition.warehouseId.toString(),
        warehouse: expedition.warehouseId,
        warehouseName: expedition.warehouseName,
        providerType: expedition.providerType,
        providerId: expedition.providerId?.toString(),
        providerName: expedition.providerName,
        carrierName: expedition.carrierInfo?.name,
        carrierPhone: expedition.carrierInfo?.phone,
        products: transformedProducts,
        totalProducts: expedition.totalProducts,
        totalQuantity: expedition.totalQuantity,
        totalValue: expedition.totalValue,
        status: expedition.status,
        approvedBy: expedition.approvedBy?.toString(),
        approvedAt: expedition.approvedAt,
        rejectedReason: expedition.rejectedReason,
        trackingNumber: expedition.trackingNumber,
        estimatedDelivery: expedition.estimatedDelivery,
        actualDelivery: expedition.actualDelivery,
        createdAt: expedition.createdAt,
        updatedAt: expedition.updatedAt,
      };
    });

    const pagination: PaginationData = {
      page,
      limit,
      total,
      totalPages,
    };

    return {
      expeditions: JSON.parse(JSON.stringify(expeditionData)),
      pagination,
      success: true,
      message: 'Expeditions fetched successfully',
    };
  } catch (error) {
    return {
      expeditions: null,
      pagination: null,
      success: false,
      message: 'Failed to fetch expeditions',
    };
  }
});

/**
 * Get provider expeditions with filters and pagination
 */
export const getProviderExpeditions = withDbConnection(async (
  page: number = 1,
  limit: number = 10,
  filters: ExpeditionFilters = {}
): Promise<{
  expeditions: ExpeditionTableData[] | null;
  pagination: PaginationData | null;
  success: boolean;
  message: string;
}> => {
  try {

    // Get current user and check permissions
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { expeditions: null, pagination: null, success: false, message: 'Unauthorized' };
    const user = await User.findById(session?.user?.id) as IUser | null;
    if (!user) {
      redirect('/auth/login');
    }

    // Only providers can access this function
    if (user.role !== UserRole.PROVIDER) {
      return { expeditions: null, pagination: null, success: false, message: 'Only providers can access this endpoint' };
    }

    // Build query - providers can only see expeditions assigned to them
    const query: any = {
      providerId: user._id,
      providerType: 'registered' // Only registered provider expeditions
    };

    // Apply filters
    if (filters.search) {
      query.$or = [
        { expeditionCode: { $regex: filters.search, $options: 'i' } },
        { sellerName: { $regex: filters.search, $options: 'i' } },
        { warehouseName: { $regex: filters.search, $options: 'i' } },
        { fromCountry: { $regex: filters.search, $options: 'i' } },
        { trackingNumber: { $regex: filters.search, $options: 'i' } },
      ];
    }

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.transportMode) {
      query.transportMode = filters.transportMode;
    }

    if (filters.warehouseId) {
      query.warehouseId = filters.warehouseId;
    }

    if (filters.sellerId) {
      query.sellerId = filters.sellerId;
    }

    if (filters.fromCountry) {
      query.fromCountry = filters.fromCountry;
    }

    // Date range filter
    if (filters.dateFrom || filters.dateTo) {
      query.expeditionDate = {};
      if (filters.dateFrom) {
        query.expeditionDate.$gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        query.expeditionDate.$lte = new Date(filters.dateTo);
      }
    }

    // Weight range filter
    if (filters.weightMin !== undefined || filters.weightMax !== undefined) {
      query.weight = {};
      if (filters.weightMin !== undefined) {
        query.weight.$gte = filters.weightMin;
      }
      if (filters.weightMax !== undefined) {
        query.weight.$lte = filters.weightMax;
      }
    }

    // Calculate pagination
    const skip = (page - 1) * limit;
    const total = await Expedition.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    // Fetch expeditions with proper typing and populate products
    const expeditions = await Expedition.find(query)
      .sort({ createdAt: -1 })
      .populate("warehouseId")
      .populate({
        path: 'products.productId',
        model: 'Product',
        select: 'name code description image'
      })
      .skip(skip)
      .limit(limit)
      .lean();

    // Transform data for table display
    const expeditionData: ExpeditionTableData[] = expeditions.map((expedition: any) => {
      // Transform products with populated data
      const transformedProducts = expedition.products?.map((product: any) => ({
        productId: product.productId?._id?.toString() || product.productId?.toString() || '',
        productName: product.productName || product.productId?.name || '',
        productCode: product.productCode || product.productId?.code || '',
        quantity: product.quantity || 0,
        unitPrice: product.unitPrice,
        image: product.productId?.image?.url || '',
        description: product.productId?.description || '',
      })) || [];

      return {
        _id: expedition._id.toString(),
        expeditionCode: expedition.expeditionCode,
        sellerId: expedition.sellerId.toString(),
        sellerName: expedition.sellerName,
        fromCountry: expedition.fromCountry,
        weight: expedition.weight,
        expeditionDate: expedition.expeditionDate,
        transportMode: expedition.transportMode,
        warehouseId: expedition.warehouseId.toString(),
        warehouse: expedition.warehouseId,
        warehouseName: expedition.warehouseName,
        providerType: expedition.providerType,
        providerId: expedition.providerId?.toString(),
        providerName: expedition.providerName,
        carrierName: expedition.carrierInfo?.name,
        carrierPhone: expedition.carrierInfo?.phone,
        products: transformedProducts,
        totalProducts: expedition.totalProducts,
        totalQuantity: expedition.totalQuantity,
        totalValue: expedition.totalValue,
        status: expedition.status,
        approvedBy: expedition.approvedBy?.toString(),
        approvedAt: expedition.approvedAt,
        rejectedReason: expedition.rejectedReason,
        trackingNumber: expedition.trackingNumber,
        estimatedDelivery: expedition.estimatedDelivery,
        actualDelivery: expedition.actualDelivery,
        createdAt: expedition.createdAt,
        updatedAt: expedition.updatedAt,
      };
    });

    const pagination: PaginationData = {
      page,
      limit,
      total,
      totalPages,
    };

    return {
      expeditions: JSON.parse(JSON.stringify(expeditionData)),
      pagination,
      success: true,
      message: 'Provider expeditions fetched successfully',
    };
  } catch (error) {
    return {
      expeditions: null,
      pagination: null,
      success: false,
      message: 'Failed to fetch provider expeditions',
    };
  }
});

/**
 * Get all sellers for filter options (Admin/Moderator only)
 */
export const getAllSellersForExpedition = withDbConnection(async (): Promise<SellerOption[]> => {
  try {

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return [];
    const user = await User.findById(session?.user?.id) as IUser | null;

    if (!user || (user.role !== UserRole.ADMIN && user.role !== UserRole.MODERATOR)) {
      return [];
    }

    const sellers = await User.find({
      role: UserRole.SELLER,
      status: 'approved'
    })
      .select('name email')
      .sort({ name: 1 })
      .lean();

    return sellers.map((seller: any) => ({
      _id: seller._id.toString(),
      name: seller.name,
      email: seller.email,
    }));
  } catch (error) {
    return [];
  }
});
/**
 * Get all providers for filter options
 */
export const getAllProvidersForExpedition = withDbConnection(async (): Promise<ProviderOption[]> => {
  try {

    const providers = await User.find({
      role: UserRole.PROVIDER,
      status: 'approved'
    })
      .select('name businessName serviceType')
      .sort({ name: 1 })
      .lean();

    return providers.map((provider: any) => ({
      _id: provider._id.toString(),
      name: provider.name,
      businessName: provider.businessName,
      serviceType: provider.serviceType,
    }));
  } catch (error) {
    return [];
  }
});

/**
 * Get list of countries for filter options
 */
export const getCountriesForExpedition = withDbConnection(async (): Promise<string[]> => {
  try {

    // Get unique countries from expeditions
    const countries = await Expedition.distinct('fromCountry') as string[];

    return countries.sort();
  } catch (error) {
    return [];
  }
});

/**
 * Update expedition status for providers
 */
export const updateProviderExpeditionStatus = withDbConnection(async (
  expeditionId: string,
  status: ExpeditionStatus,
  trackingNumber?: string,
  estimatedDelivery?: string,
  actualDelivery?: string
): Promise<{
  success: boolean;
  message: string;
}> => {
  try {

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { success: false, message: 'Unauthorized' };
    const user = await User.findById(session?.user?.id) as IUser | null;

    if (!user) {
      return { success: false, message: 'Unauthorized' };
    }

    if (user.role !== UserRole.PROVIDER) {
      return { success: false, message: 'Only providers can update expedition status' };
    }

    const expedition = await Expedition.findOne({
      _id: expeditionId,
      providerId: user._id,
      providerType: 'registered'
    });

    if (!expedition) {
      return {
        success: false,
        message: 'Expedition not found or not assigned to you',
      };
    }

    // Providers can only update status if expedition is approved or in transit
    if (expedition.status !== ExpeditionStatus.APPROVED && expedition.status !== ExpeditionStatus.IN_TRANSIT) {
      return {
        success: false,
        message: 'You can only update status for approved or in-transit expeditions',
      };
    }

    const updateData: any = { status };

    // Providers can set tracking number and delivery dates
    if (trackingNumber) {
      updateData.trackingNumber = trackingNumber;
    }

    if (estimatedDelivery) {
      updateData.estimatedDelivery = new Date(estimatedDelivery);
    }

    if (actualDelivery && status === ExpeditionStatus.DELIVERED) {
      updateData.actualDelivery = new Date(actualDelivery);
    }

    await Expedition.findByIdAndUpdate(expeditionId, updateData);

    // Send notification to seller
    sendNotification({
      userId: expedition?.sellerId?.toString(),
      type: status === ExpeditionStatus.DELIVERED ? NotificationType.SUCCESS : NotificationType.INFO,
      title: `Expedition Status Updated: ${expedition?.expeditionCode}`,
      message: `Your expedition status has been updated to ${status} by the provider.`,
      actionLink: `/dashboard/seller/expeditions/${expeditionId}`,
    });

    return {
      success: true,
      message: `Expedition status updated to ${status}`,
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to update expedition status',
    };
  }
});

/**
 * Update expedition status (Admin/Moderator only)
 */
export const updateExpeditionStatus = withDbConnection(async (
  expeditionId: string,
  status: ExpeditionStatus,
  rejectedReason?: string
): Promise<{
  success: boolean;
  message: string;
}> => {
  try {

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { success: false, message: 'Unauthorized' };
    const user = await User.findById(session?.user?.id) as IUser | null;

    if (!user) {
      return { success: false, message: 'Unauthorized' };
    }

    if (user.role !== UserRole.ADMIN && user.role !== UserRole.MODERATOR) {
      return { success: false, message: 'Insufficient permissions' };
    }

    const updateData: any = { status };

    if (status === ExpeditionStatus.APPROVED) {
      updateData.approvedBy = user._id;
      updateData.approvedAt = new Date();
      updateData.rejectedReason = undefined;
    } else if (status === ExpeditionStatus.REJECTED && rejectedReason) {
      updateData.rejectedReason = rejectedReason;
      updateData.approvedBy = undefined;
      updateData.approvedAt = undefined;
    }

    const expedition = await Expedition.findById(expeditionId);

    if (!expedition) {
      return {
        success: false,
        message: 'Expedition not found',
      };
    }
    await Expedition.findByIdAndUpdate(expeditionId, updateData);

    // Update product stocks and create stock history when delivered
    if (status === ExpeditionStatus.DELIVERED) {
      for (const product of expedition.products) {
        try {
          // Find the product to update
          const productDoc = await Product.findById(product.productId);
          if (!productDoc) continue;

          // Find the warehouse stock entry
          const warehouseStock = productDoc.warehouses.find(
            (w: any) => w.warehouseId.toString() === expedition.warehouseId.toString()
          );

          if (warehouseStock) {
            const previousStock = warehouseStock.stock;
            const newStock = previousStock + product.quantity;

            // Update the warehouse stock
            warehouseStock.stock = newStock;
            
            // Update product status to ACTIVE if it was OUT_OF_STOCK and now has stock
            if (productDoc.status === 'out_of_stock' && newStock > 0) {
              productDoc.status = 'active';
            }
            
            await productDoc.save();

            // Create stock history record
            await StockHistory.recordMovement(
              new mongoose.Types.ObjectId(product.productId.toString()),
              new mongoose.Types.ObjectId(expedition.warehouseId.toString()),
              StockMovementType.INCREASE,
              StockMovementReason.RESTOCK,
              product.quantity,
              previousStock,
              newStock,
              user._id as any,
              {
                notes: `Stock added from expedition ${expedition.expeditionCode}`,
                metadata: {
                  expeditionId: expedition._id,
                  expeditionCode: expedition.expeditionCode
                }
              }
            );
          } else {
            // If warehouse doesn't exist in product, add it
            productDoc.warehouses.push({
              warehouseId: expedition.warehouseId,
              stock: product.quantity
            });
            
            // Update product status to ACTIVE if it was OUT_OF_STOCK and now has stock
            if (productDoc.status === 'out_of_stock' && product.quantity > 0) {
              productDoc.status = 'active';
            }
            
            await productDoc.save();

            // Create stock history record
            await StockHistory.recordMovement(
              new mongoose.Types.ObjectId(product.productId.toString()),
              new mongoose.Types.ObjectId(expedition.warehouseId.toString()),
              StockMovementType.INCREASE,
              StockMovementReason.RESTOCK,
              product.quantity,
              0,
              product.quantity,
              user._id as any,
              {
                notes: `Initial stock added from expedition ${expedition.expeditionCode}`,
                metadata: {
                  expeditionId: expedition._id,
                  expeditionCode: expedition.expeditionCode
                }
              }
            );
          }
        } catch (error) {
          console.error(`Error updating stock for product ${product.productId}:`, error);
        }
      }
    }

    // send notification
    const getNotificationDetails = (status: ExpeditionStatus, expeditionCode: string) => {
      switch (status) {
        case ExpeditionStatus.APPROVED:
          return {
            type: NotificationType.SUCCESS,
            title: `Expedition Approved ${expeditionCode}`,
            message: 'Your expedition has been approved by admin'
          };
        case ExpeditionStatus.REJECTED:
          return {
            type: NotificationType.ERROR,
            title: `Expedition Rejected ${expeditionCode}`,
            message: 'Expedition has been rejected by admin. We apologize for the inconvenience.'
          };
        case ExpeditionStatus.IN_TRANSIT:
          return {
            type: NotificationType.INFO,
            title: `Expedition In Transit ${expeditionCode}`,
            message: 'Your expedition is now in transit. Track your shipment for updates.'
          };
        case ExpeditionStatus.DELIVERED:
          return {
            type: NotificationType.SUCCESS,
            title: `Expedition Delivered ${expeditionCode}`,
            message: 'Your expedition has been successfully delivered to our warehouse. You can now start accepting orders'
          };
        case ExpeditionStatus.CANCELLED:
          return {
            type: NotificationType.WARNING,
            title: `Expedition Cancelled ${expeditionCode}`,
            message: 'Your expedition has been cancelled. Contact support if you need assistance.'
          };
        default:
          return {
            type: NotificationType.INFO,
            title: `Expedition Status Updated ${expeditionCode}`,
            message: `Your expedition status has been updated to ${status}.`
          };
      }
    };

    const notificationDetails = getNotificationDetails(status, expedition.expeditionCode);

    sendNotification({
      userId: expedition?.sellerId?.toString(),
      type: notificationDetails.type,
      title: notificationDetails.title,
      message: notificationDetails.message,
      actionLink: `/dashboard/seller/expeditions/${expeditionId}`,
    })

    return {
      success: true,
      message: `Expedition status updated to ${status}`,
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to update expedition status',
    };
  }
});

/**
 * Get provider expedition by ID (Providers only)
 */
export const getProviderExpeditionById = withDbConnection(async (expeditionId: string): Promise<{
  expedition: ExpeditionTableData | null;
  success: boolean;
  message: string;
}> => {
  try {

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { expedition: null, success: false, message: 'Unauthorized' };
    const user = await User.findById(session?.user?.id) as IUser | null;

    if (!user) {
      return { expedition: null, success: false, message: 'Unauthorized' };
    }

    // Only providers can access this function
    if (user.role !== UserRole.PROVIDER) {
      return { expedition: null, success: false, message: 'Only providers can access this endpoint' };
    }

    const query: any = { 
      _id: expeditionId,
      providerId: user._id,
      providerType: 'registered'
    };

    const expedition = await Expedition.findOne(query).populate("warehouseId").lean() as (IExpedition & { _id: mongoose.Types.ObjectId }) | null;

    if (!expedition) {
      return { expedition: null, success: false, message: 'Expedition not found' };
    }

    return {
      expedition: JSON.parse(JSON.stringify(expedition as any)),
      success: true,
      message: 'Provider expedition fetched successfully',
    };
  } catch (error) {
    return {
      expedition: null,
      success: false,
      message: 'Failed to fetch provider expedition',
    };
  }
});

/**
 * Get expedition by ID
 */
export const getExpeditionById = withDbConnection(async (expeditionId: string): Promise<{
  expedition: ExpeditionTableData | null;
  success: boolean;
  message: string;
}> => {
  try {

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { expedition: null, success: false, message: 'Unauthorized' };
    const user = await User.findById(session?.user?.id) as IUser | null;

    if (!user) {
      return { expedition: null, success: false, message: 'Unauthorized' };
    }

    const query: any = { _id: expeditionId };

    // Sellers can only view their own expeditions
    if (user.role === UserRole.SELLER) {
      query.sellerId = user._id;
    }

    const expedition = await Expedition.findOne(query).populate("warehouseId").lean() as (IExpedition & { _id: mongoose.Types.ObjectId }) | null;

    if (!expedition) {
      return { expedition: null, success: false, message: 'Expedition not found' };
    }

    return {
      expedition: JSON.parse(JSON.stringify(expedition as any)),
      success: true,
      message: 'Expedition fetched successfully',
    };
  } catch (error) {
    return {
      expedition: null,
      success: false,
      message: 'Failed to fetch expedition',
    };
  }
});

/**
 * Create a new expedition
 */
export const createExpedition = withDbConnection(async (expeditionData: ExpeditionInput): Promise<{
  success: boolean;
  message: string;
  errors?: Record<string, string>;
}> => {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, message: 'Unauthorized' };
    }

    const user = await User.findById(session.user.id);
    if (!user || user.role !== UserRole.SELLER) {
      return { success: false, message: 'Only sellers can create expeditions' };
    }

    // Get warehouse info
    const warehouse = await Warehouse.findById(expeditionData.warehouseId);
    if (!warehouse) {
      return { success: false, message: 'Warehouse not found' };
    }

    // Validate and get products
    const products = [];
    for (const productInput of expeditionData.products) {
      const product = await Product.findById(productInput.productId);
      if (!product) {
        return { success: false, message: `Product not found: ${productInput.productId}` };
      }

      // Check if product belongs to the seller
      if (product.sellerId.toString() !== user._id.toString()) {
        return { success: false, message: `Product ${product.name} does not belong to you` };
      }

      products.push({
        productId: product._id,
        productName: product.name,
        productCode: product.code,
        quantity: productInput.quantity,
        unitPrice: productInput.unitPrice || product.price,
      });
    }

    // Create expedition
    const newExpedition = new Expedition({
      sellerId: user._id,
      sellerName: user.name,
      fromCountry: expeditionData.fromCountry,
      weight: expeditionData.weight,
      expeditionDate: new Date(expeditionData.expeditionDate),
      transportMode: expeditionData.transportMode,
      warehouseId: warehouse._id,
      warehouseName: warehouse.name,
      providerType: expeditionData.providerType,
      providerId: expeditionData.providerId,
      providerName: expeditionData.providerId ?
        (await User.findById(expeditionData.providerId))?.name : undefined,
      carrierInfo: expeditionData.carrierInfo,
      products: products,
      trackingNumber: expeditionData.trackingNumber,
      estimatedDelivery: expeditionData.estimatedDelivery ?
        new Date(expeditionData.estimatedDelivery) : undefined,
    });

    await newExpedition.save();

    if(expeditionData?.providerType === ProviderType.REGISTERED && expeditionData?.providerId){
            sendNotification({
              title:`A new expedition is assign to you !`,
              message:`${user?.name} has assign you a new expedition ${newExpedition?.expeditionCode}`,
              userId:expeditionData?.providerId,
              actionLink:`/dashboard/provider/expeditions/${newExpedition?._id}`,
              icon:NotificationIcon.BELL,
              type:NotificationType.INFO
            })
    }

    sendNotificationToUserType("admin",{
      title:`A new expedition created`,
      message:`Seller: ${user?.name} has created a new expedition ${newExpedition?.expeditionCode}`,
      actionLink:`/dashboard/admin/expeditions/${newExpedition?._id}`,
      icon:NotificationIcon.BELL,
      type:NotificationType.INFO
    })

    return {
      success: true,
      message: 'Expedition created successfully',
    };
  } catch (error: any) {

    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      const errors: Record<string, string> = {};
      for (const field in error.errors) {
        errors[field] = error.errors[field].message;
      }
      return {
        success: false,
        message: 'Validation failed',
        errors,
      };
    }

    return {
      success: false,
      message: 'Failed to create expedition',
    };
  }
});

/**
 * Update an existing expedition
 */
export const updateExpedition = withDbConnection(async (
  expeditionId: string,
  expeditionData: ExpeditionInput
): Promise<{
  success: boolean;
  message: string;
  errors?: Record<string, string>;
}> => {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, message: 'Unauthorized' };
    }

    const user = await User.findById(session.user.id);
    if (!user) {
      return { success: false, message: 'User not found' };
    }

    // Find the expedition
    const expedition = await Expedition.findById(expeditionId);
    if (!expedition) {
      return { success: false, message: 'Expedition not found' };
    }

    // Check permissions
    if (user.role === UserRole.SELLER && expedition.sellerId.toString() !== user._id.toString()) {
      return { success: false, message: 'You can only edit your own expeditions' };
    }

    // Only allow editing if expedition is pending
    if (expedition.status !== 'pending') {
      return { success: false, message: 'Can only edit pending expeditions' };
    }

    // Get warehouse info
    const warehouse = await Warehouse.findById(expeditionData.warehouseId);
    if (!warehouse) {
      return { success: false, message: 'Warehouse not found' };
    }

    // Validate and get products
    const products = [];
    for (const productInput of expeditionData.products) {
      const product = await Product.findById(productInput.productId);
      if (!product) {
        return { success: false, message: `Product not found: ${productInput.productId}` };
      }

      // Check if product belongs to the seller (for seller users)
      if (user.role === UserRole.SELLER && product.sellerId.toString() !== user._id.toString()) {
        return { success: false, message: `Product ${product.name} does not belong to you` };
      }

      products.push({
        productId: product._id,
        productName: product.name,
        productCode: product.code,
        quantity: productInput.quantity,
        unitPrice: productInput.unitPrice || product.price,
      });
    }

    // Update expedition
    expedition.fromCountry = expeditionData.fromCountry;
    expedition.weight = expeditionData.weight;
    expedition.expeditionDate = new Date(expeditionData.expeditionDate);
    expedition.transportMode = expeditionData.transportMode;
    expedition.warehouseId = warehouse._id;
    expedition.warehouseName = warehouse.name;
    expedition.providerType = expeditionData.providerType;
    expedition.providerId = expeditionData.providerId;
    expedition.providerName = expeditionData.providerId ?
      (await User.findById(expeditionData.providerId))?.name : undefined;
    expedition.carrierInfo = expeditionData.carrierInfo;
    expedition.products = products;
    expedition.trackingNumber = expeditionData.trackingNumber;
    expedition.estimatedDelivery = expeditionData.estimatedDelivery ?
      new Date(expeditionData.estimatedDelivery) : undefined;

    await expedition.save();

    return {
      success: true,
      message: 'Expedition updated successfully',
    };
  } catch (error: any) {

    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      const errors: Record<string, string> = {};
      for (const field in error.errors) {
        errors[field] = error.errors[field].message;
      }
      return {
        success: false,
        message: 'Validation failed',
        errors,
      };
    }

    return {
      success: false,
      message: 'Failed to update expedition',
    };
  }
});


/**
 * Get all countries from existing expeditions for the dropdown
 */
export const getCountriesForForm = withDbConnection(async (): Promise<string[]> => {
  try {
    // You can either use a predefined list or get from existing data
    const countries = [
      'Algeria', 'Angola', 'Benin', 'Botswana', 'Burkina Faso', 'Burundi',
      'Cameroon', 'Cape Verde', 'Central African Republic', 'Chad', 'Comoros',
      'Democratic Republic of the Congo', 'Republic of the Congo', 'Djibouti',
      'Egypt', 'Equatorial Guinea', 'Eritrea', 'Eswatini', 'Ethiopia', 'Gabon',
      'Gambia', 'Ghana', 'Guinea', 'Guinea-Bissau', 'Ivory Coast', 'Kenya',
      'Lesotho', 'Liberia', 'Libya', 'Madagascar', 'Malawi', 'Mali', 'Mauritania',
      'Mauritius', 'Morocco', 'Mozambique', 'Namibia', 'Niger', 'Nigeria',
      'Rwanda', 'São Tomé and Príncipe', 'Senegal', 'Seychelles', 'Sierra Leone',
      'Somalia', 'South Africa', 'South Sudan', 'Sudan', 'Tanzania', 'Togo',
      'Tunisia', 'Uganda', 'Zambia', 'Zimbabwe'
    ];

    return countries.sort();
  } catch (error) {
    return [];
  }
});





// src/app/actions/expedition.ts - Updated sections

/**
 * Get products for a specific warehouse (supports both seller and admin access)
 */
export const getProductsForWarehouse = withDbConnection(async (warehouseId: string, sellerId?: string): Promise<ProductOption[]> => {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return [];
    }

    const user = await User.findById(session.user.id);
    if (!user) {
      return [];
    }

    let targetSellerId: string;

    // Determine which seller's products to fetch
    if (user.role === UserRole.ADMIN || user.role === UserRole.MODERATOR) {
      // Admin/Moderator: Use provided sellerId or fetch all products for the warehouse
      if (sellerId) {
        targetSellerId = sellerId;
      } else {
        // If no sellerId provided, get all products for this warehouse (from all sellers)
        const products = await Product.find({
          $or: [
            { 'warehouses.warehouseId': warehouseId },
            { 'warehouses.warehouseId': new mongoose.Types.ObjectId(warehouseId) }
          ],
        }).lean();

        const productOptions: ProductOption[] = products.map((product: any) => {
          const warehouseStock = product.warehouses?.find((w: any) =>
            w.warehouseId.toString() === warehouseId
          );
          const stock = warehouseStock?.stock || 0;

          return {
            _id: product._id.toString(),
            name: product.name,
            code: product.code,
            price: product.price,
            totalStock: stock,
          };
        });

        return productOptions;
      }
    } else if (user.role === UserRole.SELLER) {
      // Seller: Use their own ID
      targetSellerId = user._id.toString();
    } else {
      return [];
    }

    // Debug logging

    // Get products that belong to the target seller and are associated with the specified warehouse
    const products = await Product.find({
      sellerId: targetSellerId,
      $or: [
        { 'warehouses.warehouseId': warehouseId },
        { 'warehouses.warehouseId': new mongoose.Types.ObjectId(warehouseId) }
      ],
    }).lean();


    const productOptions: ProductOption[] = products.map((product: any) => {
      // Find the warehouse-specific stock
      const warehouseStock = product.warehouses?.find((w: any) =>
        w.warehouseId.toString() === warehouseId
      );

      const stock = warehouseStock?.stock || 0;


      return {
        _id: product._id.toString(),
        name: product.name,
        code: product.code,
        price: product.price,
        totalStock: stock,
      };
    });

    return productOptions;
  } catch (error) {
    return [];
  }
});

/**
 * Get warehouse with currency information
 */
export const getWarehouseById = withDbConnection(async (warehouseId: string): Promise<{
  warehouse: IWarehouse | null;
  success: boolean;
  message: string;
}> => {
  try {
    const warehouse = await Warehouse.findById(warehouseId).lean();

    if (!warehouse) {
      return { warehouse: null, success: false, message: 'Warehouse not found' };
    }

    return {
      warehouse: warehouse as any,
      success: true,
      message: 'Warehouse fetched successfully',
    };
  } catch (error) {
    return {
      warehouse: null,
      success: false,
      message: 'Failed to fetch warehouse',
    };
  }
});

/**
 * Get all warehouses for filter options with currency info
 */
export const getAllWarehousesForExpedition = withDbConnection(async (): Promise<(WarehouseOption & { currency: string })[]> => {
  try {
    const session = await getServerSession(authOptions);
    const id = session?.user?.id;
    if (!id) return [];

    const user = await User.findById(id);
    if (!user) return [];

    let query: any = { isActive: true };

    // Admin and moderators can see all active warehouses
    if (user.role === UserRole.ADMIN || user.role === UserRole.MODERATOR) {
      // No additional filtering needed - they can see all active warehouses
    } else {
      // Sellers can only see warehouses available to all or assigned to them
      query.$or = [
        { isAvailableToAll: true },
        { assignedSellers: id }
      ];
    }

    const warehouses = await Warehouse.find(query)
      .select('name country currency')
      .sort({ name: 1 })
      .lean();

    return warehouses.map((warehouse: any) => ({
      _id: warehouse._id.toString(),
      name: warehouse.name,
      country: warehouse.country,
      currency: warehouse.currency,
    }));
  } catch (error) {
    return [];
  }
});