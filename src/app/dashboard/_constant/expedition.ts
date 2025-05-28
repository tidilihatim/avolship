// src/lib/constants/expedition.ts

/**
 * Expedition status enum
 */
export enum ExpeditionStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  IN_TRANSIT = 'in_transit',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  REJECTED = 'rejected',
}

/**
 * Transport mode enum
 */
export enum TransportMode {
  ROAD = 'road',
  RAILWAY = 'railway',
  AIR = 'air',
  MARITIME = 'maritime',
}

/**
 * Provider type enum
 */
export enum ProviderType {
  OWN = 'own', // Seller's own provider
  REGISTERED = 'registered', // Provider registered on the app
}