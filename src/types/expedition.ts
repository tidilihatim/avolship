// src/types/expedition.ts

import { ExpeditionStatus, TransportMode } from "@/app/dashboard/_constant/expedition";
import { ProviderType } from "next-auth/providers/index";
import { Warehouse } from "./warehouse";

/**
 * Expedition table data interface for display
 */
export interface ExpeditionTableData {
  _id: string;
  expeditionCode: string;
  sellerId: string;
  sellerName: string;
  fromCountry: string;
  weight: number;
  expeditionDate: Date;
  transportMode: TransportMode;
  warehouseId: string;
  warehouseName: string;
  providerType: ProviderType;
  providerId?: string;
  warehouse: Warehouse
  providerName?: string;
  carrierName?: string;
  carrierPhone?: string;
  totalProducts: number;
  totalQuantity: number;
  totalValue?: number;
  status: ExpeditionStatus;
  approvedBy?: string;
  approvedAt?: Date;
  rejectedReason?: string;
  trackingNumber?: string;
  estimatedDelivery?: Date;
  actualDelivery?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Expedition filters for search and filtering
 */
export interface ExpeditionFilters {
  search?: string;
  status?: ExpeditionStatus;
  transportMode?: TransportMode;
  providerType?: ProviderType;
  warehouseId?: string;
  sellerId?: string;
  fromCountry?: string;
  dateFrom?: string;
  dateTo?: string;
  weightMin?: number;
  weightMax?: number;
  page?: number;
  limit?: number;
}

/**
 * Client-side expedition filters (for URL params and form state)
 */
export interface ClientExpeditionFilters extends Omit<ExpeditionFilters, 'transportMode' | 'providerType'> {
  transportMode?: string;
  providerType?: string;
  weightLevel?: string;
}

/**
 * Warehouse option for filters
 */
export interface WarehouseOption {
  _id: string;
  name: string;
  country: string;
}

/**
 * Seller option for filters
 */
export interface SellerOption {
  _id: string;
  name: string;
  email: string;
}

/**
 * Country option for filters
 */
export interface CountryOption {
  code: string;
  name: string;
}

/**
 * Provider option for filters
 */
export interface ProviderOption {
  _id: string;
  name: string;
  businessName?: string;
  serviceType?: string;
}