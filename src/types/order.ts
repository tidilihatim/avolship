// src/types/order.ts
import { OrderStatus } from "@/lib/db/models/order";

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
  status: 'answered' | 'unreached' | 'busy' | 'invalid';
  notes?: string;
  callCenterAgent?: {
    _id: string;
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
    _id: string;
    name: string;
    role: string;
  };
  statusChangedAt: Date;
  callAttempts: CallAttempt[];
  totalCallAttempts: number;
  lastCallAttempt?: Date;
  lastCallStatus?: 'answered' | 'unreached' | 'busy' | 'invalid';
  isDouble: boolean;
  doubleOrderReferences: DoubleOrderReference[];
  orderDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderFilters {
  search?: string;
  status?: OrderStatus;
  warehouseId?: string;
  sellerId?: string;
  callStatus?: 'answered' | 'unreached' | 'busy' | 'invalid';
  dateFrom?: string;
  dateTo?: string;
  showDoubleOnly?: boolean;
  page?: number;
  limit?: number;
}

export interface OrderResponse {
  success: boolean;
  orders?: OrderTableData[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  message?: string;
}