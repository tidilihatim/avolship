// src/types/socket.ts

export interface ServerToClientEvents {
  // Notification events
  notification: (data: { message: string; type: string }) => void;
  
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
}

export interface ClientToServerEvents {
  // Authentication
  authenticate: (userData: { userId: string}) => void;
  
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
}