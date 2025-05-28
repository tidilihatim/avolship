
import { UserFormData } from '@/types/user';
import { UserRole, UserStatus } from '../db/models/user';

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

/**
 * Email validation regex
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Phone validation regex (international format)
 */
const PHONE_REGEX = /^[\+]?[1-9][\d]{0,15}$/;

/**
 * Validate user form data
 * @param data - User form data to validate
 * @param isUpdate - Whether this is an update operation (password optional)
 * @returns Validation result with errors if any
 */
export function validateUserForm(data: UserFormData, isUpdate: boolean = false): ValidationResult {
  const errors: Record<string, string> = {};

  // Name validation
  if (!data.name || data.name.trim().length === 0) {
    errors.name = 'Name is required';
  } else if (data.name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters long';
  } else if (data.name.trim().length > 100) {
    errors.name = 'Name must be less than 100 characters';
  }

  // Email validation
  if (!data.email || data.email.trim().length === 0) {
    errors.email = 'Email is required';
  } else if (!EMAIL_REGEX.test(data.email.trim())) {
    errors.email = 'Please enter a valid email address';
  }

  // Password validation (required for create, optional for update)
  if (!isUpdate) {
    if (!data.password || data.password.length === 0) {
      errors.password = 'Password is required';
    } else if (data.password.length < 8) {
      errors.password = 'Password must be at least 8 characters long';
    } else if (data.password.length > 128) {
      errors.password = 'Password must be less than 128 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(data.password)) {
      errors.password = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
    }
  } else if (data.password && data.password.length > 0) {
    // If password is provided in update, validate it
    if (data.password.length < 8) {
      errors.password = 'Password must be at least 8 characters long';
    } else if (data.password.length > 128) {
      errors.password = 'Password must be less than 128 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(data.password)) {
      errors.password = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
    }
  }

  // Role validation
  if (!data.role) {
    errors.role = 'Role is required';
  } else if (!Object.values(UserRole).includes(data.role)) {
    errors.role = 'Invalid role selected';
  }

  // Status validation
  if (!data.status) {
    errors.status = 'Status is required';
  } else if (!Object.values(UserStatus).includes(data.status)) {
    errors.status = 'Invalid status selected';
  }

  // Phone validation (optional)
  if (data.phone && data.phone.trim().length > 0) {
    if (!PHONE_REGEX.test(data.phone.trim())) {
      errors.phone = 'Please enter a valid phone number';
    }
  }

  // Business name validation (optional but required for certain roles)
  if ((data.role === UserRole.PROVIDER || data.role === UserRole.SELLER) && (!data.businessName || data.businessName.trim().length === 0)) {
    errors.businessName = `Business name is required for ${data.role}s`;
  } else if (data.businessName && data.businessName.trim().length > 200) {
    errors.businessName = 'Business name must be less than 200 characters';
  }

  // Service type validation (required for providers)
  if (data.role === UserRole.PROVIDER && (!data.serviceType || data.serviceType.trim().length === 0)) {
    errors.serviceType = 'Service type is required for providers';
  } else if (data.serviceType && data.serviceType.trim().length > 100) {
    errors.serviceType = 'Service type must be less than 100 characters';
  }

  // Business info validation (optional)
  if (data.businessInfo && data.businessInfo.trim().length > 1000) {
    errors.businessInfo = 'Business information must be less than 1000 characters';
  }

  // Country validation (optional)
  if (data.country && data.country.trim().length > 100) {
    errors.country = 'Country must be less than 100 characters';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Validate search/filter parameters
 * @param search - Search query
 * @param role - Role filter
 * @param status - Status filter
 * @returns Validation result
 */
export function validateUserFilters(search?: string, role?: UserRole | string, status?: UserStatus | string): ValidationResult {
  const errors: Record<string, string> = {};

  // Search validation
  if (search && search.length > 100) {
    errors.search = 'Search query must be less than 100 characters';
  }

  // Role validation
  if (role && typeof role === 'string' && !Object.values(UserRole).includes(role as UserRole)) {
    errors.role = 'Invalid role filter';
  }

  // Status validation
  if (status && typeof status === 'string' && !Object.values(UserStatus).includes(status as UserStatus)) {
    errors.status = 'Invalid status filter';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Sanitize user input data
 * @param data - Raw form data
 * @returns Sanitized user data
 */
export function sanitizeUserData(data: UserFormData): UserFormData {
  return {
    name: data.name?.trim() || '',
    email: data.email?.trim().toLowerCase() || '',
    password: data.password || undefined,
    role: data.role,
    status: data.status,
    phone: data.phone?.trim() || undefined,
    businessName: data.businessName?.trim() || undefined,
    businessInfo: data.businessInfo?.trim() || undefined,
    serviceType: data.serviceType?.trim() || undefined,
    country: data.country?.trim() || undefined,
    twoFactorEnabled: Boolean(data.twoFactorEnabled)
  };
}