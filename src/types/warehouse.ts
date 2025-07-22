/**
 * TypeScript interfaces for warehouse module (without Zod dependencies)
 * Updated to include seller assignment functionality
 */

// Simplified seller info for warehouse assignment
export interface SellerInfo {
  _id: string;
  name: string;
  email: string;
  businessName?: string;
  country?: string;
}

// Location interface for warehouse coordinates
export interface WarehouseLocation {
  latitude: number;
  longitude: number;
  address: string;
}

// Form values for warehouse create/update
export interface WarehouseFormValues {
  name: string;
  country: string;
  city?: string;
  currency: string;
  address?: string;
  location?: WarehouseLocation;
  capacity?: number | null;
  capacityUnit?: string;
  isActive: boolean;
  conversionEnabled: boolean;
  targetCurrency?: string;
  conversionRate?: number | null;
  autoUpdateRate: boolean;
  // New fields for seller assignment
  isAvailableToAll: boolean;
  assignedSellers: string[]; // Array of seller IDs
}

// Warehouse object from the database
export interface Warehouse {
  _id: string;
  name: string;
  country: string;
  city?: string;
  currency: string;
  address?: string;
  location?: WarehouseLocation;
  capacity?: number;
  capacityUnit?: string;
  currencyConversion: {
    enabled: boolean;
    targetCurrency: string;
    rate: number;
    autoUpdate: boolean;
    lastUpdated?: string; // ISO date string
  };
  // New fields for seller assignment
  isAvailableToAll: boolean;
  assignedSellers: string[]; // Array of seller IDs
  sellerDetails?: SellerInfo[]; // Populated seller details (when requested)
  isActive: boolean;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

// Filter params for warehouse listing
export interface WarehouseFilterParams {
  search?: string;
  country?: string;
  isActive?: boolean;
  sellerId?: string; // Filter warehouses accessible by a specific seller
  page?: number;
  limit?: number;
  isAvailableToAll?: boolean;
}

// Pagination information
export interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Response from server actions
export interface WarehouseResponse {
  warehouse?: Warehouse;
  warehouses?: Warehouse[];
  pagination?: PaginationInfo;
  error?: string;
  success?: boolean;
}

// Currency conversion settings
export interface CurrencySettings {
  enabled: boolean;
  targetCurrency: string;
  rate: number;
  autoUpdate: boolean;
}

// Currency options
export interface CurrencyOption {
  code: string;
  name: string;
  symbol: string;
}

// Seller assignment update interface
export interface WarehouseSellerAssignment {
  warehouseId: string;
  isAvailableToAll: boolean;
  assignedSellers: string[]; // Array of seller IDs
}

// Response for seller list queries
export interface SellerListResponse {
  sellers: SellerInfo[];
  total: number;
  error?: string;
}

// Common currency codes that might be used
export const commonCurrencies: CurrencyOption[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'XOF', name: 'West African CFA Franc', symbol: 'CFA' },
  { code: 'GNF', name: 'Guinean Franc', symbol: 'FG' },
  { code: 'XAF', name: 'Central African CFA Franc', symbol: 'FCFA' },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦' },
  { code: 'GHS', name: 'Ghanaian Cedi', symbol: '₵' },
  { code: 'MAD', name: 'Moroccan Dirham', symbol: 'د.م.' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh' },
  { code: 'EGP', name: 'Egyptian Pound', symbol: 'E£' },
];

// Helper type for warehouse access check
export interface WarehouseAccessCheck {
  warehouseId: string;
  sellerId: string;
  hasAccess: boolean;
}

// Bulk assignment operation
export interface BulkWarehouseAssignment {
  warehouseIds: string[];
  operation: 'add' | 'remove' | 'set';
  sellerIds: string[];
  setAvailableToAll?: boolean;
}