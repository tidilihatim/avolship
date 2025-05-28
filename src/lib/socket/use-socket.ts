// src/lib/socket/useSocket.ts - Simplified version with type assertions

'use client';

import { useContext, useCallback } from 'react';
import { SocketContext } from './socket-provider';

// Custom hook to provide easy access to socket
export function useSocket() {
  const context = useContext(SocketContext);
  
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  
  const { socket, isConnected, connect, disconnect } = context;

  // Helper to subscribe to socket events
  const on = useCallback((event: string, callback: (...args: any[]) => void) => {
    if (!socket) return () => {};
    
    socket.on(event as any, callback);
    
    return () => {
      socket.off(event as any, callback);
    };
  }, [socket]);

  // Helper to emit socket events
  const emit = useCallback((event: string, ...args: any[]) => {
    if (!socket) return;
    (socket as any).emit(event, ...args);
  }, [socket]);

  return {
    socket,
    isConnected,
    connect,
    disconnect,
    on,
    emit
  };
}