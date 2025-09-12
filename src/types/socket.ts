// src/types/socket.ts

export interface ServerToClientEvents {

  // Connection events
  'connect': () => void;
  'disconnect': (reason: string) => void;
  'connect_error': (error: Error) => void;
  'pong': () => void;

  'auth:success': (data: { message: string; userRole: string }) => void;
  'auth:error': (data: { message: string }) => void;
  // Notification events
  notification: (data: { message: string; type: string }) => void;

   // Order events
  'order:assigned': (data: {
    orderId: string;
    orderNumber: string;
    customer: {
      name: string;
      phoneNumbers: string[];
      shippingAddress: string;
    };
    products: Array<{
      productId: string;
      quantity: number;
      unitPrice: number;
      expeditionId: string;
    }>;
    totalPrice: number;
    status: string;
    assignedAt: Date;
    lockExpiry: Date;
    seller: {
      _id: string;
      name: string;
      email: string;
      businessName?: string;
      assignedCallCenterAgent?: string;
    };
    warehouse: {
      _id: string;
      name: string;
      location: string;
      country: string;
    };
  }) => void;

  'order:new': (data: {
    orderId: string;
    orderNumber: string;
    customer: {
      name: string;
      phoneNumbers: string[];
      shippingAddress: string;
    };
    totalPrice: number;
    status: string;
    createdAt: Date;
    isAssigned: boolean;
    assignedAgent?: string;
  }) => void;

  'order:unavailable': (data: {
    orderId: string;
    assignedTo: string;
  }) => void;

  'order:assignment-result': (data: {
    orderId: string;
    success: boolean;
    message: string;
  }) => void;

  'order:removed': (data: {
    orderId: string;
    message: string;
  }) => void;

  // Queue events
  'queue:update': (data: {
    queueCount: number;
    orders: string[];
  }) => void;

  'queue:initial': (data: {
    queueCount: number;
    workloadCount: number;
    orders: Array<{
      orderId: string;
      orderNumber: string;
      customer: {
        name: string;
        phoneNumbers: string[];
        shippingAddress: string;
      };
      totalPrice: number;
      status: string;
      createdAt: Date;
      assignedAt: Date;
      lockExpiry: Date;
    }>;
  }) => void;
  
  // Chat events
  chatMessage: (data: { 
    senderId: string; 
    message: string; 
    timestamp: Date 
  }) => void;
  
  // Delivery events
  deliveryUpdate: (data: { 
    deliveryId: string; 
    status: string; 
    location?: { lat: number; lng: number }; 
    timestamp: Date 
  }) => void;

  // Admin events for delivery rider tracking
  'admin:delivery_riders': (data: Array<{
    id: string;
    name: string;
    email: string;
    phone?: string;
    isOnline: boolean;
    isAvailableForDelivery: boolean;
    currentLocation?: {
      latitude: number;
      longitude: number;
      timestamp: Date;
      accuracy?: number;
    };
    assignedOrders?: Array<{
      _id: string;
      orderId: string;
      customer: {
        name: string;
        address: string;
        coordinates?: {
          latitude: number;
          longitude: number;
        };
      };
      status: string;
      totalAmount: number;
    }>;
    deliveryStats?: {
      totalDeliveries: number;
      todayDeliveries: number;
      averageRating?: number;
    };
    lastActive?: Date;
  }>) => void;

  'admin:rider_location_update': (data: {
    riderId: string;
    location: {
      latitude: number;
      longitude: number;
      timestamp: Date;
      accuracy?: number;
    };
  }) => void;

  'admin:rider_status_update': (data: {
    riderId: string;
    isOnline: boolean;
    isAvailableForDelivery: boolean;
  }) => void;

  'admin:rider_orders_update': (data: {
    riderId: string;
    orders: Array<{
      _id: string;
      orderId: string;
      customer: {
        name: string;
        address: string;
        coordinates?: {
          latitude: number;
          longitude: number;
        };
      };
      status: string;
      totalAmount: number;
    }>;
  }) => void;

  'admin:rider_details': (data: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    isOnline: boolean;
    isAvailableForDelivery: boolean;
    currentLocation?: {
      latitude: number;
      longitude: number;
      timestamp: Date;
      accuracy?: number;
    };
    assignedOrders: Array<{
      _id: string;
      orderId: string;
      customer: {
        name: string;
        address: string;
        coordinates?: {
          latitude: number;
          longitude: number;
        };
      };
      status: string;
      totalAmount: number;
    }>;
    deliveryStats?: {
      totalDeliveries: number;
      todayDeliveries: number;
      averageRating?: number;
    };
    lastActive?: Date;
  }) => void;

  'admin:rider_route_update': (data: {
    riderId: string;
    routeDirections: Array<{ latitude: number; longitude: number }>;
    orderId?: string;
    timestamp: Date;
  }) => void;

  'admin:error': (data: { message: string }) => void;
}

export interface ClientToServerEvents {
  // Authentication
  authenticate: (userData: { userId: string}) => void;
  'order:request-assignment': (data: { orderId: string }) => void;
  'order:complete': (data: { orderId: string }) => void;
   'agent:status': (data: { available: boolean }) => void;
  
  // Chat events
  sendMessage: (data: { 
    recipientId: string; 
    message: string;
  }) => void;
  
  // Delivery events
  updateLocation: (data: { 
    deliveryId: string; 
    location: { lat: number; lng: number };
  }) => void;
  
  updateDeliveryStatus: (data: {
    deliveryId: string;
    status: string;
  }) => void;

  // Admin events
  'admin:get_delivery_riders': () => void;
  'admin:get_rider_details': (data: { riderId: string }) => void;
}

// Types for order data
export interface OrderItem {
  orderId: string;
  orderNumber: string;
  customer: {
    name: string;
    phoneNumbers: string[];
    shippingAddress: string;
  };
  products?: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
    expeditionId: string;
  }>;
  totalPrice: number;
  status: string;
  createdAt: Date;
  assignedAt?: Date;
  lockExpiry?: Date;
  seller?: {
    _id: string;
    name: string;
    email: string;
    businessName?: string;
    assignedCallCenterAgent?: string;
  };
  warehouse?: {
    _id: string;
    name: string;
    location: string;
    country: string;
    currency: string;
  };
}

export interface QueueStats {
  queueCount: number;
  workloadCount: number;
  orders: OrderItem[];
}