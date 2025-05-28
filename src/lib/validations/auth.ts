import { z } from 'zod';
import { UserRole } from '../db/models/user';

// Simple schema for sellers
export const sellerSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters' }),
  confirmPassword: z.string(),
  phone: z.string().min(10, { message: 'Phone number must be at least 10 characters' }),
  country: z.string().min(2, { message: 'Country must be at least 2 characters' }),
  businessName: z.string().min(2, { message: 'Business name must be at least 2 characters' }),
  businessInfo: z.string().min(10, { message: 'Please provide more details about your business' }),
  role: z.literal(UserRole.SELLER),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Simple schema for providers
export const providerSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters' }),
  confirmPassword: z.string(),
  phone: z.string().min(10, { message: 'Phone number must be at least 10 characters' }),
  country: z.string().min(2, { message: 'Country must be at least 2 characters' }),
  businessName: z.string().min(2, { message: 'Business name must be at least 2 characters' }),
  businessInfo: z.string().min(10, { message: 'Please provide more details about your services' }),
  serviceType: z.string().min(2, { message: 'Service type must be at least 2 characters' }),
  role: z.literal(UserRole.PROVIDER),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Types for the registration form data
export type SellerFormData = z.infer<typeof sellerSchema>;
export type ProviderFormData = z.infer<typeof providerSchema>;