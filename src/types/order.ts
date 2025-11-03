// src/types/order.ts
import { OrderStatus } from "@/lib/db/models/order";

export interface OrderProduct {
  productId: string;
  productName: string;
  productCode: string;
  quantity: number;
  unitPrice: number;
}

export interface OrderInput {
  customer: {
    name: string;
    phoneNumbers: string[];
    shippingAddress: string;
  };
  warehouseId: string;
  products: {
    productId: string;
    quantity: number;
    unitPrice: number;
    expeditionId: string;
  }[];
}

export interface ProductOption {
  _id: string;
  name: string;
  code: string;
  price?: number;
  totalStock: number;
  description: string;
  availableExpeditions: ExpeditionOption[];
}

export interface ExpeditionOption {
  _id: string;
  expeditionCode: string;
  unitPrice: number;
  status: string;
  expeditionDate: Date;
  transportMode: string;
}

export interface SelectedProduct {
  _id: string;
  name: string;
  code: string;
  price?: number;
  totalStock: number;
  quantity: number;
  unitPrice: number;
  expeditionId: string;
  expeditionCode: string;
  availableExpeditions: ExpeditionOption[];
}

export interface OrderFormProps {
  order?: any;
  warehouses?: Array<{
    _id: string;
    name: string;
    country: string;
    currency: string;
  }>;
  isEdit?: boolean;
  currentUser?: {
    _id: string;
    role: string;
  };
}

// src/app/dashboard/_constant/order.ts
export const ORDER_STATUS_LABELS = {
  [OrderStatus.PENDING]: 'Pending',
  [OrderStatus.CONFIRMED]: 'Confirmed', 
  [OrderStatus.CANCELLED]: 'Cancelled',
  [OrderStatus.WRONG_NUMBER]: 'Wrong Number',
  [OrderStatus.DOUBLE]: 'Double Order',
  [OrderStatus.UNREACHED]: 'Unreached',
  [OrderStatus.EXPIRED]: 'Expired',
} as const;

export const ORDER_STATUS_COLORS = {
  [OrderStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
  [OrderStatus.CONFIRMED]: 'bg-green-100 text-green-800',
  [OrderStatus.CANCELLED]: 'bg-red-100 text-red-800',
  [OrderStatus.WRONG_NUMBER]: 'bg-orange-100 text-orange-800',
  [OrderStatus.DOUBLE]: 'bg-purple-100 text-purple-800',
  [OrderStatus.UNREACHED]: 'bg-gray-100 text-gray-800',
  [OrderStatus.EXPIRED]: 'bg-gray-100 text-gray-800',
} as const;

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

export interface DeliveryTracking {
  deliveryGuyId: string;
  assignedAt: Date;
  acceptedAt?: Date;
  pickedUpAt?: Date;
  estimatedDeliveryTime?: Date;
  actualDeliveryTime?: Date;
  deliveryFee: number;
  commission: number;
  distance?: number; // Distance in kilometers
  trackingNumber: string;
  currentLocation?: {
    latitude: number;
    longitude: number;
    timestamp: Date;
  };
  route?: {
    latitude: number;
    longitude: number;
    timestamp: Date;
  }[];
  deliveryNotes?: string;
  customerRating?: number; // 1-5 rating from customer
  deliveryProof?: {
    type: 'photo' | 'signature';
    url: string;
    signedUrl?: string; // Generated signed URL for private S3 images
    uploadedAt: Date;
  };
}

export interface CallCenterCommission {
  commission: number;
  calculatedAt: Date;
  isPaid: boolean;
  paidAt?: Date;
  notes?: string;
}

export interface OrderTableData {
  _id: string;
  orderId: string;
  customer: {
    name: string;
    phoneNumbers: string[];
    shippingAddress: string;
    location?: {
      latitude: number;
      longitude: number;
    };
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
  assignedAgent?: string;
  assignedRider?: {
    name: string;
    email: string;
  };
  // Delivery tracking information
  deliveryTracking?: DeliveryTracking;
  isDeliveryRequired: boolean;
  // Call center commission tracking
  callCenterCommission?: CallCenterCommission;
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