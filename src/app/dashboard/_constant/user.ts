// src/app/dashboard/_constant/user.ts

/**
 * User role enum
 */
export enum UserRole {
  ADMIN = 'admin',
  MODERATOR = 'moderator',
  SELLER = 'seller',
  CALL_CENTER_AGENT = 'call_center_agent',
  PROVIDER = 'provider',
}

/**
 * User status enum
 */
export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive', 
  PENDING = 'pending',
  SUSPENDED = 'suspended',
}