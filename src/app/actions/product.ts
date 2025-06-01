// src/app/actions/product.ts
'use server';

import { revalidatePath } from 'next/cache';
import Product, { ProductStatus } from '@/lib/db/models/product';
import User, { UserRole } from '@/lib/db/models/user';
import Warehouse from '@/lib/db/models/warehouse';
import { ProductFilters, ProductInput, ProductResponse, ProductTableData, WarehouseData } from '@/types/product';
import mongoose from 'mongoose';
import { withDbConnection } from '@/lib/db/db-connect';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/config/auth';
import { cookies } from 'next/headers';
import { deleteFromCloudinary, uploadToCloudinary } from '@/lib/cloudinary';
import { getCurrentUser } from './auth';





/**
 * Get products with pagination and filtering
 */
async function getProductsImpl(
  page: number = 1,
  limit: number = 10,
  filters: ProductFilters = {}
): Promise<ProductResponse> {
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

    // If user is a seller, only show their products
    if (user.role === UserRole.SELLER) {
      query.sellerId = user._id;
    } else if (filters.sellerId) {
      query.sellerId = new mongoose.Types.ObjectId(filters.sellerId);
    }

    // Apply warehouse filter if provided
    const cookiesStore = await cookies();
    const selectedWarehouseId = cookiesStore.get('selectedWarehouse')?.value;

    
    if (selectedWarehouseId) {
      query['warehouses.warehouseId'] = new mongoose.Types.ObjectId(selectedWarehouseId);
    }

    // Apply status filter if provided
    if (filters.status) {
      query.status = filters.status;
    }

    // Apply stock range filters if provided
    if (filters.minStock !== undefined) {
      query.totalStock = { $gte: filters.minStock };
    }

    if (filters.maxStock !== undefined) {
      query.totalStock = { ...(query.totalStock || {}), $lte: filters.maxStock };
    }

    // Apply search filter if provided
    if (filters.search) {
      const searchRegex = new RegExp(filters.search, 'i');
      query.$or = [
        { name: searchRegex },
        { code: searchRegex },
        { variantCode: searchRegex },
        { description: searchRegex },
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Execute query with pagination
    const products: any[] = await Product.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    
    // Count total results for pagination
    const total = await Product.countDocuments(query);
    
    // Get unique warehouseIds and sellerIds for populating names
    const warehouseIds = products.flatMap(p => p.warehouses.map((w: any) => w.warehouseId));
    const sellerIds = [...new Set(products.map(p => p.sellerId))];
    
    // Fetch warehouses and sellers in parallel
    const warehouses: any[] = await Warehouse.find({ _id: { $in: warehouseIds } }).lean();
    const sellers: any[] = await User.find({ _id: { $in: sellerIds } }).lean();
    
    // Create lookup maps for efficient access
    const warehouseMap = new Map<string, any>();
    for (const w of warehouses) {
      warehouseMap.set(w._id.toString(), w);
    }
    
    const sellerMap = new Map<string, any>();
    for (const s of sellers) {
      sellerMap.set(s._id.toString(), s);
    }
    
    // Map products to include warehouse and seller names
    const productsWithNames: ProductTableData[] = [];
    
    for (const product of products) {
      const sellerId = product.sellerId.toString();
      
      // Map warehouses with names
      const warehousesWithNames: WarehouseData[] = [];
      
      for (const warehouse of product.warehouses) {
        const warehouseId = warehouse.warehouseId.toString();
        const warehouseData = warehouseMap.get(warehouseId);
        
        warehousesWithNames.push({
          warehouseId,
          warehouseName: warehouseData?.name || 'Unknown Warehouse',
          stock: warehouse.stock,
          country: warehouseData?.country,
        });
      }
      
      // Get primary warehouse (first one for display purposes)
      const primaryWarehouse = warehousesWithNames[0] || null;
      
      productsWithNames.push({
        _id: product._id.toString(),
        name: product.name,
        description: product.description,
        code: product.code,
        variantCode: product.variantCode,
        verificationLink: product.verificationLink,
        warehouses: warehousesWithNames,
        primaryWarehouseId: primaryWarehouse?.warehouseId,
        primaryWarehouseName: primaryWarehouse?.warehouseName,
        sellerId,
        sellerName: sellerMap.get(sellerId)?.name || 'Unknown Seller',
        image: product.image,
        totalStock: product.totalStock,
        status: product.status,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt
      });
    }
    
    // Calculate pagination data
    const totalPages = Math.ceil(total / limit);
    
    return {
      success: true,
      products: productsWithNames,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  } catch (error: any) {
    console.error('Error fetching products:', error);
    return {
      success: false,
      message: error.message || 'Failed to fetch products',
    };
  }
}

/**
 * Get a product by ID
 */
async function getProductByIdImpl(id: string): Promise<ProductResponse> {
  try {
    // Get the current user
    const user = await getCurrentUser();
    if (!user) {
      return {
        success: false,
        message: 'Unauthorized',
      };
    }

    // Find the product
    const product: any = await Product.findById(id).lean();
    
    if (!product) {
      return {
        success: false,
        message: 'Product not found',
      };
    }

    // Check if user is a seller and is the owner of the product
    if (user.role === UserRole.SELLER && product.sellerId.toString() !== user._id.toString()) {
      return {
        success: false,
        message: 'Unauthorized to view this product',
      };
    }

    // Get all warehouse IDs and seller ID
    const warehouseIds = product.warehouses.map((w: any) => w.warehouseId);
    const sellerId = product.sellerId;

    // Get warehouse and seller data
    const warehouses: any[] = await Warehouse.find({ _id: { $in: warehouseIds } }).lean();
    const seller: any = await User.findById(sellerId).lean();

    // Create a warehouse map for quick lookups
    const warehouseMap = new Map<string, any>();
    for (const w of warehouses) {
      warehouseMap.set(w._id.toString(), w);
    }

    // Map warehouses with names
    const warehousesWithNames: WarehouseData[] = [];
    
    for (const warehouse of product.warehouses) {
      const warehouseId = warehouse.warehouseId.toString();
      const warehouseData = warehouseMap.get(warehouseId);
      
      warehousesWithNames.push({
        warehouseId,
        warehouseName: warehouseData?.name || 'Unknown Warehouse',
        stock: warehouse.stock,
        country: warehouseData?.country,
      });
    }

    // Get primary warehouse (first one for display purposes)
    const primaryWarehouse = warehousesWithNames[0] || null;

    const productData: ProductTableData = {
      _id: product._id.toString(),
      name: product.name,
      description: product.description,
      code: product.code,
      variantCode: product.variantCode,
      verificationLink: product.verificationLink,
      warehouses: warehousesWithNames,
      primaryWarehouseId: primaryWarehouse?.warehouseId,
      primaryWarehouseName: primaryWarehouse?.warehouseName,
      sellerId: product.sellerId.toString(),
      sellerName: seller?.name || 'Unknown Seller',
      image: product.image,
      totalStock: product.totalStock,
      status: product.status,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt
    };

    return {
      success: true,
      product: productData,
    };
  } catch (error: any) {
    console.error('Error fetching product:', error);
    return {
      success: false,
      message: error.message || 'Failed to fetch product',
    };
  }
}

/**
 * Get all warehouses for product filters
 */
async function getAllWarehousesImpl(): Promise<{ _id: string; name: string; country: string }[]> {
  try {
    // Get the current user
    const user = await getCurrentUser();
    if (!user) {
      return [];
    }

    // Query to get all warehouses
    const warehouses: any[] = await Warehouse.find({ 
      isActive: true,
      $or: [
        { isAvailableToAll: true },
        { assignedSellers: user._id }
      ]
     })
      .select('_id name country')
      .sort({ name: 1 })
      .lean();

    const result: { _id: string; name: string; country: string }[] = [];
    
    for (const warehouse of warehouses) {
      result.push({
        _id: warehouse._id.toString(),
        name: warehouse.name,
        country: warehouse.country,
      });
    }
    
    return result;
  } catch (error) {
    console.error('Error fetching warehouses:', error);
    return [];
  }
}

/**
 * Get all sellers for product filters (admin only)
 */
async function getAllSellersImpl(): Promise<{ _id: string; name: string; email: string }[]> {
  try {
    // Get the current user
    const user = await getCurrentUser();
    if (!user || ![UserRole.ADMIN, UserRole.MODERATOR].includes(user.role)) {
      return [];
    }

    // Query to get all sellers
    const sellers: any[] = await User.find({ role: UserRole.SELLER })
      .select('_id name email')
      .sort({ name: 1 })
      .lean();

    const result: { _id: string; name: string; email: string }[] = [];
    
    for (const seller of sellers) {
      result.push({
        _id: seller._id.toString(),
        name: seller.name,
        email: seller.email,
      });
    }
    
    return result;
  } catch (error) {
    console.error('Error fetching sellers:', error);
    return [];
  }
}


/**
 * Create a new product
 */
async function createProductImpl(productData: ProductInput): Promise<ProductResponse> {
  try {
    // Get the current user
    const user = await getCurrentUser();
    if (!user) {
      return {
        success: false,
        message: 'Unauthorized',
      };
    }

    // Check if user is a seller or admin
    if (![UserRole.SELLER, UserRole.ADMIN].includes(user.role)) {
      return {
        success: false,
        message: 'Only sellers and admins can create products',
      };
    }

    // Check if code is unique for this seller
    const existingProduct = await Product.findOne({
      code: productData.code,
      sellerId: user._id,
    });

    if (existingProduct) {
      return {
        success: false,
        message: 'Product code already exists for your account',
        errors: {
          code: 'Product code must be unique for each seller',
        },
      };
    }

    // Validate required fields
    if (!productData.name || !productData.description || !productData.code) {
      return {
        success: false,
        message: 'Missing required fields',
        errors: {
          ...(productData.name ? {} : { name: 'Name is required' }),
          ...(productData.description ? {} : { description: 'Description is required' }),
          ...(productData.code ? {} : { code: 'Code is required' }),
        },
      };
    }

    // Validate warehouses
    if (!productData.warehouses || productData.warehouses.length === 0) {
      return {
        success: false,
        message: 'At least one warehouse must be selected',
        errors: {
          warehouses: 'At least one warehouse must be selected',
        },
      };
    }

    // Check if warehouses exist
    const warehouseIds = productData.warehouses.map(w => w.warehouseId);
    const warehouses = await Warehouse.find({
      _id: { $in: warehouseIds },
      isActive: true,
    }).lean();

    if (warehouses.length !== warehouseIds.length) {
      return {
        success: false,
        message: 'One or more selected warehouses do not exist or are inactive',
        errors: {
          warehouses: 'Invalid warehouse selection',
        },
      };
    }

    // Calculate total stock
    const totalStock = productData.warehouses.reduce(
      (sum, warehouse) => sum + warehouse.stock,
      0
    );

    // Set seller ID from current user if not provided
    if (!productData.sellerId) {
      productData.sellerId = user._id.toString();
    }
    
    // Create product
    const newProduct = new Product({
      name: productData.name,
      description: productData.description,
      code: productData.code,
      variantCode: productData.variantCode,
      verificationLink: productData.verificationLink,
      warehouses: productData.warehouses.map(w => ({
        warehouseId: new mongoose.Types.ObjectId(w.warehouseId),
        stock: w.stock,
      })),
      sellerId: new mongoose.Types.ObjectId(productData.sellerId),
      image: productData.image,
      totalStock,
      status: totalStock > 0 ? (productData.status || ProductStatus.ACTIVE) : ProductStatus.OUT_OF_STOCK,
    });

    await newProduct.save();

    // Revalidate the products path
    revalidatePath('/dashboard/products');

    // Get the complete product data for response
    const createdProduct = await getProductById(newProduct._id.toString());

    return {
      success: true,
      message: 'Product created successfully',
      product: createdProduct.product,
    };
  } catch (error: any) {
    console.error('Error creating product:', error);
    return {
      success: false,
      message: error.message || 'Failed to create product',
    };
  }
}

/**
 * Update an existing product
 */
async function updateProductImpl(id: string, productData: ProductInput): Promise<ProductResponse> {
  try {
    // Get the current user
    const user = await getCurrentUser();
    if (!user) {
      return {
        success: false,
        message: 'Unauthorized',
      };
    }

    // Find the product
    const product = await Product.findById(id);
    if (!product) {
      return {
        success: false,
        message: 'Product not found',
      };
    }

    // Check if user is the owner of the product or an admin
    if (
      user.role === UserRole.SELLER &&
      product.sellerId.toString() !== user._id.toString()
    ) {
      return {
        success: false,
        message: 'You do not have permission to update this product',
      };
    }

    // Check if code is unique for this seller if changed
    if (productData.code !== product.code) {
      const existingProduct = await Product.findOne({
        code: productData.code,
        sellerId: product.sellerId,
        _id: { $ne: product._id }, // Exclude current product
      });

      if (existingProduct) {
        return {
          success: false,
          message: 'Product code already exists for this seller',
          errors: {
            code: 'Product code must be unique for each seller',
          },
        };
      }
    }

    // Validate required fields
    if (!productData.name || !productData.description || !productData.code) {
      return {
        success: false,
        message: 'Missing required fields',
        errors: {
          ...(productData.name ? {} : { name: 'Name is required' }),
          ...(productData.description ? {} : { description: 'Description is required' }),
          ...(productData.code ? {} : { code: 'Code is required' }),
        },
      };
    }

    // Validate warehouses
    if (!productData.warehouses || productData.warehouses.length === 0) {
      return {
        success: false,
        message: 'At least one warehouse must be selected',
        errors: {
          warehouses: 'At least one warehouse must be selected',
        },
      };
    }

    // Check if warehouses exist
    const warehouseIds = productData.warehouses.map(w => w.warehouseId);
    const warehouses = await Warehouse.find({
      _id: { $in: warehouseIds },
      isActive: true,
    }).lean();

    if (warehouses.length !== warehouseIds.length) {
      return {
        success: false,
        message: 'One or more selected warehouses do not exist or are inactive',
        errors: {
          warehouses: 'Invalid warehouse selection',
        },
      };
    }

    // Calculate total stock
    const totalStock = productData.warehouses.reduce(
      (sum, warehouse) => sum + warehouse.stock,
      0
    );

    // Determine if we need to delete the old image
    let shouldDeleteOldImage = false;
    let oldImagePublicId = null;
    
    if (product.image && product.image.publicId && 
        (!productData.image || product.image.publicId !== productData.image.publicId)) {
      shouldDeleteOldImage = true;
      oldImagePublicId = product.image.publicId;
    }

    // Update product
    product.name = productData.name;
    product.description = productData.description;
    product.code = productData.code;
    product.variantCode = productData.variantCode;
    product.verificationLink = productData.verificationLink;
    product.warehouses = productData.warehouses.map(w => ({
      warehouseId: new mongoose.Types.ObjectId(w.warehouseId),
      stock: w.stock,
    }));
    
    // Only update image if provided
    if (productData.image) {
      product.image = productData.image;
    }
    
    product.totalStock = totalStock;
    
    // Update status based on stock unless explicitly set
    if (productData.status) {
      product.status = productData.status;
    } else if (totalStock === 0 && product.status === ProductStatus.ACTIVE) {
      product.status = ProductStatus.OUT_OF_STOCK;
    }

    await product.save();

    // Delete old image from Cloudinary if needed
    if (shouldDeleteOldImage && oldImagePublicId) {
      try {
        // Asynchronously delete the old image, but don't wait for it
        deleteFromCloudinary(oldImagePublicId).catch(err => 
          console.error('Error deleting old Cloudinary image:', err)
        );
      } catch (error) {
        // Don't fail the update if image deletion fails
        console.error('Error initiating Cloudinary image deletion:', error);
      }
    }

    // Revalidate the product path
    revalidatePath(`/dashboard/products/${id}`);
    revalidatePath('/dashboard/products');

    // Get the updated product data for response
    const updatedProduct = await getProductById(id);

    return {
      success: true,
      message: 'Product updated successfully',
      product: updatedProduct.product,
    };
  } catch (error: any) {
    console.error('Error updating product:', error);
    return {
      success: false,
      message: error.message || 'Failed to update product',
    };
  }
}

/**
 * Delete a product
 */
async function deleteProductImpl(id: string): Promise<ProductResponse> {
  try {
    // Get the current user
    const user = await getCurrentUser();
    if (!user) {
      return {
        success: false,
        message: 'Unauthorized',
      };
    }

    // Find the product
    const product = await Product.findById(id);
    
    if (!product) {
      return {
        success: false,
        message: 'Product not found',
      };
    }

    // Check if user is a seller and is the owner of the product
    if (user.role === UserRole.SELLER && product.sellerId.toString() !== user._id.toString()) {
      return {
        success: false,
        message: 'Unauthorized to delete this product',
      };
    }

    // Check if product has an image to delete
    const imagePublicId = product.image?.publicId;

    // Delete the product
    await Product.findByIdAndDelete(id);

    // Delete the image from Cloudinary if it exists
    if (imagePublicId) {
      try {
        // Asynchronously delete the image, but don't wait for it
        deleteFromCloudinary(imagePublicId).catch(err => 
          console.error('Error deleting Cloudinary image:', err)
        );
      } catch (error) {
        // Don't fail the deletion if image removal fails
        console.error('Error initiating Cloudinary image deletion:', error);
      }
    }

    // Revalidate the products path to update the UI
    revalidatePath('/dashboard/products');

    return {
      success: true,
      message: 'Product deleted successfully',
    };
  } catch (error: any) {
    console.error('Error deleting product:', error);
    return {
      success: false,
      message: error.message || 'Failed to delete product',
    };
  }
}

/**
 * Update product status
 */
async function updateProductStatusImpl(id: string, status: ProductStatus): Promise<ProductResponse> {
  try {
    // Get the current user
    const user = await getCurrentUser();
    if (!user) {
      return {
        success: false,
        message: 'Unauthorized',
      };
    }

    // Find the product
    const product = await Product.findById(id);
    
    if (!product) {
      return {
        success: false,
        message: 'Product not found',
      };
    }

    // Check if user is a seller and is the owner of the product
    if (user.role === UserRole.SELLER && product.sellerId.toString() !== user._id.toString()) {
      return {
        success: false,
        message: 'Unauthorized to update this product',
      };
    }

    // Validate status change
    if (status === ProductStatus.ACTIVE && product.totalStock === 0) {
      return {
        success: false,
        message: 'Cannot set product to Active when it has no stock',
        errors: {
          status: 'Product must have stock to be marked as Active',
        },
      };
    }

    // Update the product status
    product.status = status;
    await product.save();

    // Revalidate the products path to update the UI
    revalidatePath('/dashboard/products');
    revalidatePath(`/dashboard/products/${id}`);

    return {
      success: true,
      message: 'Product status updated successfully',
    };
  } catch (error: any) {
    console.error('Error updating product status:', error);
    return {
      success: false,
      message: error.message || 'Failed to update product status',
    };
  }
}

// Export the wrapped server actions
export const getProducts = withDbConnection(getProductsImpl);
export const getProductById = withDbConnection(getProductByIdImpl);
export const getAllWarehouses = withDbConnection(getAllWarehousesImpl);
export const getAllSellers = withDbConnection(getAllSellersImpl);
export const deleteProduct = withDbConnection(deleteProductImpl);
export const updateProductStatus = withDbConnection(updateProductStatusImpl);
export const createProduct = withDbConnection(createProductImpl);
export const updateProduct = withDbConnection(updateProductImpl);