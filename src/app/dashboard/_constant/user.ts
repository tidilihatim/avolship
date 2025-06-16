// src/app/dashboard/_constant/user.ts

/**
 * User role enum
 */
export enum UserRole {
  ADMIN = 'admin',
  MODERATOR = 'moderator',
  SELLER = 'seller',
  CALL_CENTER = 'call_center',
  PROVIDER = 'provider',
  DELIVERY = 'delivery',
  SUPPORT = 'support',
}

/**
 * User status enum
 */
export enum UserStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}