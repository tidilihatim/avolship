// src/app/actions/expedition.ts
'use server';

import { withDbConnection } from '@/lib/db/db-connect';
import User, { UserRole, IUser } from '@/lib/db/models/user';
import Warehouse, { IWarehouse } from '@/lib/db/models/warehouse';
import { ExpeditionTableData, ExpeditionFilters, WarehouseOption, SellerOption, ProviderOption } from '@/types/expedition';
import { PaginationData } from '@/types/user';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '../api/auth/[...nextauth]/route';
import mongoose from 'mongoose';
import Expedition, { IExpedition } from '@/lib/db/models/expedition';
import { ExpeditionStatus } from '../dashboard/_constant/expedition';
import { ExpeditionInput, ProductOption } from '@/types/expedition-form';
import Product from '@/lib/db/models/product';

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
    if(!session?.user?.id) return { expeditions: null, pagination: null, success: false, message: 'Unauthorized' };
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

    // Fetch expeditions with proper typing
    const expeditions = await Expedition.find(query)
    .sort({ createdAt: -1 })
    .populate("warehouseId")
    .skip(skip)
    .limit(limit)
    .lean();
    
    // Transform data for table display
    const expeditionData: ExpeditionTableData[] = expeditions.map((expedition: any) => ({
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
    }));

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
    console.error('Error fetching expeditions:', error);
    return {
      expeditions: null,
      pagination: null,
      success: false,
      message: 'Failed to fetch expeditions',
    };
  }
});

/**
 * Get all sellers for filter options (Admin/Moderator only)
 */
export const getAllSellersForExpedition = withDbConnection(async (): Promise<SellerOption[]> => {
  try {
    
    const session = await getServerSession(authOptions);
    if(!session?.user?.id) return [];
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
    console.error('Error fetching sellers:', error);
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
    console.error('Error fetching providers:', error);
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
    console.error('Error fetching countries:', error);
    return [];
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
    if(!session?.user?.id) return {success: false, message: 'Unauthorized' };
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

    await Expedition.findByIdAndUpdate(expeditionId, updateData);

    return {
      success: true,
      message: `Expedition status updated to ${status}`,
    };
  } catch (error) {
    console.error('Error updating expedition status:', error);
    return {
      success: false,
      message: 'Failed to update expedition status',
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
    if(!session?.user?.id) return { expedition: null, success: false, message: 'Unauthorized' };
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
    console.error('Error fetching expedition:', error);
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

    return {
      success: true,
      message: 'Expedition created successfully',
    };
  } catch (error: any) {
    console.error('Error creating expedition:', error);
    
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
    console.error('Error updating expedition:', error);
    
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
    console.error('Error fetching countries:', error);
    return [];
  }
});





// src/app/actions/expedition.ts - Updated sections

/**
 * Get products for a specific warehouse (seller's products only)
 */
export const getProductsForWarehouse = withDbConnection(async (warehouseId: string): Promise<ProductOption[]> => {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return [];
    }

    const user = await User.findById(session.user.id);
    if (!user || user.role !== UserRole.SELLER) {
      return [];
    }

    // Debug logging to see what's happening
    console.log('Getting products for warehouse:', warehouseId);
    console.log('Seller ID:', user._id.toString());

    // Get products that belong to this seller and are associated with the specified warehouse
    const products = await Product.find({
      sellerId: user._id,
      $or: [
        { 'warehouses.warehouseId': warehouseId },
        { 'warehouses.warehouseId': new mongoose.Types.ObjectId(warehouseId) }
      ],
    }).lean();

    console.log('Found products:', products.length);

    const productOptions: ProductOption[] = products.map((product: any) => {
      // Find the warehouse-specific stock
      const warehouseStock = product.warehouses?.find((w: any) => 
        w.warehouseId.toString() === warehouseId
      );
      
      const stock = warehouseStock?.stock || 0; // Use warehouse-specific stock, default to 0
      
      console.log(`Product ${product.name}: warehouse stock = ${stock}, total stock = ${product.totalStock}`);

      return {
        _id: product._id.toString(),
        name: product.name,
        code: product.code,
        price: product.price,
        totalStock: stock, // Show actual warehouse stock (including 0)
      };
    }); // Remove the filter - show all products including those with 0 stock

    console.log('All products (including 0 stock):', productOptions.length);
    
    return productOptions;
  } catch (error) {
    console.error('Error fetching products for warehouse:', error);
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
    console.error('Error fetching warehouse:', error);
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
    const warehouses = await Warehouse.find({ isActive: true })
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
    console.error('Error fetching warehouses:', error);
    return [];
  }
});