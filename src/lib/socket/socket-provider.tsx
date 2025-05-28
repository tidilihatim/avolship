// src/lib/socket/SocketProvider.tsx

'use client';

import { createContext, ReactNode, useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { ServerToClientEvents, ClientToServerEvents } from '@/types/socket';
import { useSession } from 'next-auth/react';

type SocketClient = Socket<ServerToClientEvents, ClientToServerEvents>;

interface SocketContextType {
  socket: SocketClient | null;
  isConnected: boolean;
  connect: (userId: string) => void;
  disconnect: () => void;
  on: <Event extends keyof ServerToClientEvents>(
    event: Event,
    callback: ServerToClientEvents[Event]
  ) => () => void;
  emit: <Event extends keyof ClientToServerEvents>(
    event: Event,
    ...args: Parameters<ClientToServerEvents[Event]>
  ) => void;
}

export const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  connect: () => {},
  disconnect: () => {},
  on: () => () => {},
  emit: () => {}
});

interface SocketProviderProps {
  children: ReactNode;
}

export function SocketProvider({ children }: SocketProviderProps) {
  const [socket, setSocket] = useState<SocketClient | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { data: session } = useSession();

  

  // Initialize socket
  useEffect(() => {
    // Create the socket instance if it doesn't exist
    if (!socket) {
      console.log('Creating new socket instance');
      const socketURL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000';
      console.log(`Connecting to socket server at: ${socketURL}`);
      
      const socketInstance = io(socketURL, {
        autoConnect: false,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 10000,
        withCredentials: true
      });
      
      setSocket(socketInstance);
    }
  }, [socket]);

  // Set up event listeners for socket
  useEffect(() => {
    if (!socket) return;
    
    // Log all socket events for debugging
    const onConnect = () => {
      console.log('Socket connected successfully');
      setIsConnected(true);
    };
    
    const onDisconnect = (reason: string) => {
      console.log(`Socket disconnected: ${reason}`);
      setIsConnected(false);
    };
    
    const onConnectError = (error: Error) => {
      console.error('Socket connection error:', error.message);
      setIsConnected(false);
    };
    
    const onReconnectAttempt = (attemptNumber: number) => {
      console.log(`Socket reconnection attempt #${attemptNumber}`);
    };
    
    const onReconnect = (attemptNumber: number) => {
      console.log(`Socket reconnected after ${attemptNumber} attempts`);
      setIsConnected(true);
    };
    
    const onReconnectError = (error: Error) => {
      console.error('Socket reconnection error:', error.message);
    };
    
    const onReconnectFailed = () => {
      console.error('Socket reconnection failed after all attempts');
    };
    
    // Add event listeners
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);
    socket.io.on('reconnect_attempt', onReconnectAttempt);
    socket.io.on('reconnect', onReconnect);
    socket.io.on('reconnect_error', onReconnectError);
    socket.io.on('reconnect_failed', onReconnectFailed);
    
    // Set initial connection state
    setIsConnected(socket.connected);
    
    // Clean up event listeners
    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
      socket.io.off('reconnect_attempt', onReconnectAttempt);
      socket.io.off('reconnect', onReconnect);
      socket.io.off('reconnect_error', onReconnectError);
      socket.io.off('reconnect_failed', onReconnectFailed);
    };
  }, [socket]);

  // Connect to socket server and authenticate
  const connect = useCallback((userId: string) => {
    if (!socket) {
      console.error('Cannot connect: No socket instance');
      return;
    }
    
    if (!socket.connected) {
      console.log('Socket not connected, connecting now...');
      socket.connect();
    }
    
    console.log(`Authenticating user ${userId}`);
    socket.emit('authenticate', {userId});
  }, [socket]);

  useEffect(() => {
    if (session?.user && !isConnected) {
      console.log('User authenticated, connecting socket');
      
      // Use appropriate user ID and role from your session
      connect(session.user.id);
    }
  }, [session, connect, isConnected]);

  // Disconnect from socket server
  const disconnect = useCallback(() => {
    if (socket) {
      console.log('Disconnecting socket');
      socket.disconnect();
    }
  }, [socket]);

  // Helper to subscribe to socket events
  const on = useCallback(<Event extends keyof ServerToClientEvents>(
    event: Event,
    callback: ServerToClientEvents[Event]
  ) => {
    if (!socket) {
      console.warn(`Cannot listen to ${String(event)} event: No socket instance`);
      return () => {};
    }
    
    console.log(`Adding listener for ${String(event)} event`);
    socket.on(event, callback as any);
    
    return () => {
      console.log(`Removing listener for ${String(event)} event`);
      socket.off(event, callback as any);
    };
  }, [socket]);

  // Helper to emit socket events
  const emit = useCallback(<Event extends keyof ClientToServerEvents>(
    event: Event,
    ...args: Parameters<ClientToServerEvents[Event]>
  ) => {
    if (!socket) {
      console.warn(`Cannot emit ${String(event)} event: No socket instance`);
      return;
    }
    
    if (!socket.connected) {
      console.warn(`Cannot emit ${String(event)} event: Socket not connected`);
      return;
    }
    
    console.log(`Emitting ${String(event)} event:`, args);
    socket.emit(event, ...args as any);
  }, [socket]);

  // Auto-cleanup on unmount
  useEffect(() => {
    return () => {
      if (socket && socket.connected) {
        console.log('Component unmounting, disconnecting socket');
        socket.disconnect();
      }
    };
  }, [socket]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        connect,
        disconnect,
        on,
        emit
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}