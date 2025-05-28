// src/types/expedition-form.ts
import { ExpeditionStatus, TransportMode, ProviderType } from '@/app/dashboard/_constant/expedition';

/**
 * Expedition input interface for form submission
 */
export interface ExpeditionInput {
  // Package Information
  fromCountry: string;
  weight: number;
  expeditionDate: string; // ISO string format
  transportMode: TransportMode;
  warehouseId: string;
  
  // Provider Information
  providerType: ProviderType;
  providerId?: string; // For registered providers
  carrierInfo?: {
    name: string;
    phone: string;
    email?: string;
    companyName?: string;
  };
  
  // Products
  products: ExpeditionProductInput[];
  
  // Status
  status?: ExpeditionStatus;
  
  // Optional tracking info
  trackingNumber?: string;
  estimatedDelivery?: string;
}

/**
 * Expedition product input interface
 */
export interface ExpeditionProductInput {
  productId: string;
  quantity: number;
  unitPrice?: number;
}

/**
 * Product option for selection
 */
export interface ProductOption {
  _id: string;
  name: string;
  code: string;
  price?: number;
  totalStock: number;
}

/**
 * Selected product for expedition
 */
export interface SelectedProduct extends ProductOption {
  quantity: number;
  unitPrice?: number;
}