/**
 * TypeScript interfaces for warehouse module (without Zod dependencies)
 */

// Form values for warehouse create/update
export interface WarehouseFormValues {
  name: string;
  country: string;
  city?: string;
  currency: string;
  address?: string;
  capacity?: number | null;
  capacityUnit?: string;
  isActive: boolean;
  conversionEnabled: boolean;
  targetCurrency?: string;
  conversionRate?: number | null;
  autoUpdateRate: boolean;
}

// Warehouse object from the database
export interface Warehouse {
  _id: string;
  name: string;
  country: string;
  city?: string;
  currency: string;
  address?: string;
  capacity?: number;
  capacityUnit?: string;
  currencyConversion: {
    enabled: boolean;
    targetCurrency: string;
    rate: number;
    autoUpdate: boolean;
    lastUpdated?: string; // ISO date string
  };
  isActive: boolean;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

// Filter params for warehouse listing
export interface WarehouseFilterParams {
  search?: string;
  country?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
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