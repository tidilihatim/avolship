"use server";


import AppSettings from "@/lib/db/models/app-settings";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth/next";
import { connectToDatabase as connectDB } from "@/lib/db/mongoose";
import { authOptions } from "@/config/auth";


export async function getAppSettings() {
  try {
    await connectDB();
    const settings = await AppSettings.getActiveSettings();
    
    return {
      success: true,
      data: JSON.parse(JSON.stringify(settings)),
    };
  } catch (error) {
    console.error("Error fetching app settings:", error);
    return {
      success: false,
      error: "Failed to fetch app settings",
    };
  }
}

export async function updateAppSettings(formData: FormData | any) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id || (session.user.role !== "admin" && session.user.role !== "moderator")) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    await connectDB();
    
    // Extract data from FormData or direct object
    const data = formData instanceof FormData 
      ? Object.fromEntries(formData.entries())
      : formData;

    // Parse boolean and number fields
    const settingsData = {
      ...data,
      autoAssignDelivery: data.autoAssignDelivery === true || data.autoAssignDelivery === 'true',
      maxOrdersPerDeliveryGuy: parseInt(data.maxOrdersPerDeliveryGuy) || 10,
      enableCommissionSystem: data.enableCommissionSystem === true || data.enableCommissionSystem === 'true',
      enableDeliveryFees: data.enableDeliveryFees === true || data.enableDeliveryFees === 'true',
      enableTokenSystem: data.enableTokenSystem === true || data.enableTokenSystem === 'true',
      defaultDeliveryFee: parseFloat(data.defaultDeliveryFee) || 0,
      showLocationTracking: {
        seller: data.showLocationTracking?.seller === true || data.showLocationTracking?.seller === 'true',
        call_center: data.showLocationTracking?.call_center === true || data.showLocationTracking?.call_center === 'true',
      },
      lastUpdatedBy: session.user.id,
    };

    const settings = await AppSettings.findOneAndUpdate(
      { isActive: true },
      settingsData,
      { 
        new: true, 
        upsert: true,
        runValidators: true
      }
    );

    revalidatePath("/dashboard/admin/app-settings");
    
    return {
      success: true,
      data: JSON.parse(JSON.stringify(settings)),
    };
  } catch (error) {
    console.error("Error updating app settings:", error);
    return {
      success: false,
      error: "Failed to update app settings",
    };
  }
}

export async function getWarehouses() {
  try {
    await connectDB();
    const Warehouse = (await import("@/lib/db/models/warehouse")).default;
    
    const warehouses = await Warehouse.find(
      { isActive: true },
      { name: 1, currency: 1, country: 1, city: 1 }
    ).sort({ name: 1 });

    return {
      success: true,
      data: JSON.parse(JSON.stringify(warehouses)),
    };
  } catch (error) {
    console.error("Error fetching warehouses:", error);
    return {
      success: false,
      error: "Failed to fetch warehouses",
    };
  }
}