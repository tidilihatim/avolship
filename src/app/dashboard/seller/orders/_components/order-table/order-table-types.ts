import { OrderStatus } from "@/lib/db/models/order";

// Interfaces
export interface OrderProduct {
  productId: string;
  productName: string;
  productCode: string;
  quantity: number;
  unitPrice: number;
}

export interface CallAttempt {
  attemptNumber: number;
  phoneNumber: string;
  attemptDate: Date;
  status: "answered" | "unreached" | "busy" | "invalid";
  notes?: string;
  callCenterAgent?: {
    name: string;
    role: string;
  };
}

export interface DoubleOrderReference {
  orderId: string;
  customerName: string;
  orderDate: Date;
  similarity: {
    sameName: boolean;
    samePhone: boolean;
    sameProduct: boolean;
    orderDateDifference: number;
  };
}

export interface PriceAdjustment {
  productId: string;
  originalPrice: number;
  adjustedPrice: number;
  discountAmount: number;
  discountPercentage: number;
  reason: string;
  appliedBy: string;
  appliedAt: Date;
  notes?: string;
}

export interface OrderTableData {
  _id: string;
  orderId: string;
  customer: {
    name: string;
    phoneNumbers: string[];
    shippingAddress: string;
  };
  warehouseId: string;
  warehouseName: string;
  warehouseCountry: string;
  warehouseCurrency: string;
  sellerId: string;
  sellerName: string;
  products: OrderProduct[];
  totalPrice: number;
  status: OrderStatus;
  statusComment?: string;
  statusChangedBy?: {
    name: string;
    role: string;
  };
  statusChangedAt: Date;
  callAttempts: CallAttempt[];
  totalCallAttempts: number;
  lastCallAttempt?: Date;
  lastCallStatus?: "answered" | "unreached" | "busy" | "invalid";
  isDouble: boolean;
  doubleOrderReferences: DoubleOrderReference[];
  orderDate: Date;
  assignedAgent?: string;
  // Discount tracking fields
  priceAdjustments?: PriceAdjustment[];
  finalTotalPrice?: number;
  totalDiscountAmount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderFilters {
  search?: string;
  status?: OrderStatus;
  warehouseId?: string;
  sellerId?: string;
  callStatus?: "answered" | "unreached" | "busy" | "invalid";
  dateFrom?: string;
  dateTo?: string;
  showDoubleOnly?: boolean;
  page?: number;
  limit?: number;
}

export interface WarehouseOption {
  _id: string;
  name: string;
  country: string;
  currency: string;
}

export interface SellerOption {
  _id: string;
  name: string;
  email: string;
}

export interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface OrderTableProps {
  orders: OrderTableData[];
  allWarehouses?: WarehouseOption[];
  allSellers?: SellerOption[];
  pagination?: PaginationData;
  error?: string;
  filters: OrderFilters & { dateRange?: string };
}

// Constants
export const ALL_STATUSES = "all_statuses";
export const ALL_WAREHOUSES = "all_warehouses";
export const ALL_SELLERS = "all_sellers";
export const ALL_CALL_STATUSES = "all_call_statuses";
export const CUSTOM_DATE_RANGE = "custom_range";