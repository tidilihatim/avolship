// src/lib/socket/socket.ts

import { io, Socket } from 'socket.io-client';
import { ServerToClientEvents, ClientToServerEvents } from '@/types/socket';

// Define the socket type with all event handlers
export type SocketClient = Socket<ServerToClientEvents, ClientToServerEvents>;

// Singleton to hold the socket instance
let socket: SocketClient | null = null;

export const getSocket = (): SocketClient => {
  if (!socket) {
    // Create new socket connection
    const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000';
    
    socket = io(SOCKET_URL, {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
  }
  
  return socket;
};

// Initialize socket connection with auth data
export const initializeSocket = (userId: string, role: string): SocketClient => {
  const socket = getSocket();
  
  if (!socket.connected) {
    socket.connect();
    
    // Send authentication after connection
    socket.on('connect', () => {
      console.log('Socket connected');
      socket.emit('authenticate', { userId, role });
    });
    
    // For reconnect, we use the Socket.IO event 'reconnect_attempt' instead of 'reconnect'
    // which can cause TypeScript errors
    socket.io.on('reconnect_attempt', () => {
      console.log('Socket reconnecting...');
    });
    
    socket.io.on('reconnect', () => {
      console.log('Socket reconnected');
      socket.emit('authenticate', { userId, role });
    });
    
    // Log disconnections
    socket.on('disconnect', (reason) => {
      console.log(`Socket disconnected: ${reason}`);
    });
    
    // Log errors
    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });
  }
  
  return socket;
};

// Clean up socket connection
export const disconnectSocket = (): void => {
  if (socket && socket.connected) {
    socket.disconnect();
  }
};