import { UserRole, UserStatus } from "@/app/dashboard/_constant/user";

/**
 * User form data interface for creating/updating users
 */
export interface UserFormData {
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  status: UserStatus;
  phone?: string;
  businessName?: string;
  businessInfo?: string;
  serviceType?: string;
  country?: string;
  twoFactorEnabled: boolean;
}

/**
 * Assigned agent configuration for display
 */
export interface AssignedAgentData {
  _id: string;
  name: string;
  email: string;
  maxPendingOrders?: number;
}

/**
 * User table data interface for displaying users
 */
export interface UserTableData {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  phone?: string;
  businessName?: string;
  country?: string;
  assignedCallCenterAgent?: {
    _id: string;
    name: string;
    email: string;
  };
  assignedCallCenterAgents?: AssignedAgentData[];
  twoFactorEnabled: boolean;
  createdAt: Date;
  lastActive?: Date;
}

/**
 * User filter interface for search and filtering
 */
export interface UserFilters {
  search?: string;
  role?: UserRole;
  status?: UserStatus;
  country?: string;
  limit?: number;
  page?: number;
}

/**
 * Pagination interface
 */
export interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * API response interface for user operations
 */
export interface UserApiResponse {
  success: boolean;
  message: string;
  data?: any;
  errors?: Record<string, string>;
}