'use server';

import { revalidatePath } from 'next/cache';
import Warehouse from '@/lib/db/models/warehouse';
import { WarehouseFormValues } from '@/types/warehouse';
import { UserRole } from '@/lib/db/models/user';
import { getServerSession } from 'next-auth';
import { withDbConnection } from '@/lib/db/db-connect';
import { getLoginUserRole } from './auth';
import { sendNotification, sendNotificationToUserType } from '@/lib/notifications/send-notification';
import { authOptions } from '@/config/auth';


/**
 * Get all active warehouses for a seller
 * @returns List of active warehouses
 */
export const getActiveWarehouses = withDbConnection(async () => {
  try {
    // Verify seller access
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return { error: 'Unauthorized access' };
    }
    
    // Find all active warehouses
    const warehouses = await Warehouse.find({ isActive: true })
      .sort({ name: 1 })
      .select('_id name country city currency');
    
    if (!warehouses || warehouses.length === 0) {
      return { warehouses: [], message: 'No active warehouses found' };
    }
    
    return { warehouses: JSON.parse(JSON.stringify(warehouses)) };
  } catch (error:any) {
    throw new Error(error)
  }
});



/**
 * Get all unique countries from the database
 * @returns List of all countries in the system
 */
export const getAllCountries = withDbConnection(async () => {
  try {
    const session = await getServerSession(authOptions);
    const role = await getLoginUserRole()
    if (!session?.user || role !== UserRole.ADMIN) {
      return { error: 'Unauthorized access' };
    }
    const results = await Warehouse.aggregate([
      { $group: { _id: "$country" } },
      { $sort: { _id: 1 } },
      { $project: { country: "$_id", _id: 0 } }
    ]);

    const countries = results.map(item => item.country);

    return { countries };
  } catch (error: any) {
    throw new Error(error)
  }
});


/**
 * Create a new warehouse
 * @param data - Warehouse data from the form
 * @returns Created warehouse object or error
 */
export const createWarehouse = withDbConnection(async (data: WarehouseFormValues) => {
  try {
    // Verify admin access
    const session = await getServerSession(authOptions);
    const role = await getLoginUserRole()
    if (!session?.user || role !== UserRole.ADMIN) {
      return { error: 'Unauthorized access' };
    }


    const newWarehouse = await Warehouse.create({
      ...data,
      currencyConversion: {
        enabled: data.conversionEnabled || false,
        targetCurrency: data.targetCurrency || 'USD',
        rate: data.conversionRate || 1,
        autoUpdate: data.autoUpdateRate || false,
        lastUpdated: data.conversionEnabled ? new Date() : undefined,
      },
    });

    sendNotificationToUserType(UserRole.SELLER, {
      title: "Introducing a new warehouse",
      message:`We have added a new warehouse for you in ${data?.country}. You can now start selling products from this location.`,
      icon:"bell"
    })

    revalidatePath('/admin/warehouse');
    return { warehouse: JSON.parse(JSON.stringify(newWarehouse)) };
  } catch (error: any) {
    throw new Error(error)
  }
});

/**
 * Get all warehouses with optional filtering and pagination
 * @param params - Optional filter and pagination parameters
 * @returns Array of warehouses, total count, and error if any
 */
export const getWarehouses = withDbConnection(async (params?: {
  country?: string;
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}) => {
  try {
    // Verify admin access
    const session = await getServerSession(authOptions);
    const role = await getLoginUserRole()
    if (!session?.user || role !== UserRole.ADMIN) {
      return { error: 'Unauthorized access' };
    }


    // Build query based on provided filters
    const query: any = {};

    if (params?.country) {
      query.country = params.country;
    }

    if (params?.isActive !== undefined) {
      query.isActive = params.isActive;
    }

    if (params?.search) {
      query.$or = [
        { name: { $regex: params.search, $options: 'i' } },
        { country: { $regex: params.search, $options: 'i' } },
        { city: { $regex: params.search, $options: 'i' } },
      ];
    }

    // Pagination parameters
    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const totalCount = await Warehouse.countDocuments(query);

    // Get paginated warehouses
    const warehouses = await Warehouse.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return {
      warehouses: JSON.parse(JSON.stringify(warehouses)),
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit)
      }
    };
  } catch (error: any) {
    throw new Error(error)
  }
});

/**
 * Get a single warehouse by ID
 * @param id - Warehouse ID
 * @returns Warehouse object or error
 */
export const getWarehouseById = withDbConnection(async (id: string) => {
  try {
    // Verify admin access
    const session = await getServerSession(authOptions);
    const role = await getLoginUserRole()
    if (!session?.user || role !== UserRole.ADMIN) {
      return { error: 'Unauthorized access' };
    }


    const warehouse = await Warehouse.findById(id);

    if (!warehouse) {
      return { error: 'Warehouse not found' };
    }

    return { warehouse: JSON.parse(JSON.stringify(warehouse)) };
  } catch (error: any) {
    throw new Error(error)
  }
});

/**
 * Update a warehouse
 * @param id - Warehouse ID
 * @param data - Updated warehouse data
 * @returns Updated warehouse object or error
 */
export const updateWarehouse = withDbConnection(async (id: string, data: WarehouseFormValues) => {
  try {
    // Verify admin access
    const session = await getServerSession(authOptions);
    const role = await getLoginUserRole()
    if (!session?.user || role !== UserRole.ADMIN) {
      return { error: 'Unauthorized access' };
    }


    const warehouse = await Warehouse.findById(id);

    if (!warehouse) {
      return { error: 'Warehouse not found' };
    }

    // Update warehouse fields
    warehouse.name = data.name;
    warehouse.country = data.country;
    warehouse.city = data.city;
    warehouse.currency = data.currency;
    warehouse.address = data.address;
    warehouse.capacity = data.capacity;
    warehouse.capacityUnit = data.capacityUnit;
    warehouse.isActive = data.isActive;

    // Update currency conversion settings
    warehouse.currencyConversion = {
      enabled: data.conversionEnabled || false,
      targetCurrency: data.targetCurrency || 'USD',
      rate: data.conversionRate || 1,
      autoUpdate: data.autoUpdateRate || false,
      lastUpdated: data.conversionEnabled ? new Date() : warehouse.currencyConversion?.lastUpdated,
    };

    await warehouse.save();

    revalidatePath(`/admin/warehouse/${id}`);
    revalidatePath('/admin/warehouse');

    return { warehouse: JSON.parse(JSON.stringify(warehouse)) };
  } catch (error: any) {
    throw new Error(error)
  }
});

/**
 * Delete a warehouse
 * @param id - Warehouse ID
 * @returns Success message or error
 */
export const deleteWarehouse = withDbConnection(async (id: string) => {
  try {
    // Verify admin access
    const session = await getServerSession(authOptions);
    const role = await getLoginUserRole()
    if (!session?.user || role !== UserRole.ADMIN) {
      return { error: 'Unauthorized access' };
    }


    const result = await Warehouse.findByIdAndDelete(id);

    if (!result) {
      return { error: 'Warehouse not found' };
    }

    revalidatePath('/admin/warehouse');

    return { success: true };
  } catch (error: any) {
    throw new Error(error)
  }
});

/**
 * Toggle warehouse active status
 * @param id - Warehouse ID
 * @returns Updated warehouse or error
 */
export const toggleWarehouseStatus = withDbConnection(async (id: string) => {
  try {
    // Verify admin access
    const session = await getServerSession(authOptions);
    const role = await getLoginUserRole()
    if (!session?.user || role !== UserRole.ADMIN) {
      return { error: 'Unauthorized access' };
    }


    const warehouse = await Warehouse.findById(id);

    if (!warehouse) {
      return { error: 'Warehouse not found' };
    }

    warehouse.isActive = !warehouse.isActive;
    await warehouse.save();

    revalidatePath('/admin/warehouse');

    return { warehouse: JSON.parse(JSON.stringify(warehouse)) };
  } catch (error: any) {
    throw new Error(error)
  }
});

/**
 * Update currency conversion settings
 * @param id - Warehouse ID
 * @param data - Currency conversion settings
 * @returns Updated warehouse or error
 */
export const updateCurrencySettings = withDbConnection(async (
  id: string,
  data: {
    enabled: boolean;
    targetCurrency: string;
    rate: number;
    autoUpdate: boolean;
  }
) => {
  try {
    // Verify admin access
    const session = await getServerSession(authOptions);
    const role = await getLoginUserRole()
    if (!session?.user || role !== UserRole.ADMIN) {
      return { error: 'Unauthorized access' };
    }


    const warehouse = await Warehouse.findById(id);

    if (!warehouse) {
      return { error: 'Warehouse not found' };
    }

    warehouse.currencyConversion = {
      enabled: data.enabled,
      targetCurrency: data.targetCurrency,
      rate: data.rate,
      autoUpdate: data.autoUpdate,
      lastUpdated: new Date(), // Always update lastUpdated when settings are manually changed
    };

    await warehouse.save();

    revalidatePath(`/admin/warehouse/${id}`);

    return { warehouse: JSON.parse(JSON.stringify(warehouse)) };
  } catch (error: any) {
    throw new Error(error)
  }
});


export const getWarehouseCurrency = withDbConnection(async (id: string) => {
  try {
    const warehouse = await Warehouse.findById(id);
    if (!warehouse) {
      return { error: 'Warehouse not found' };
    }
    return warehouse.currency ;
  } catch (error: any) {
    throw new Error(error)
  }
});