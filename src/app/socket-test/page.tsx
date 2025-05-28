// src/app/socket-test/page.tsx

'use client';

import { useSocket } from '@/lib/socket/use-socket';
import { useState, useEffect } from 'react';

export default function SocketTestPage() {
  const [connectionStatus, setConnectionStatus] = useState('Disconnected');
  const [connected, setConnected] = useState(false);
  const [clientCount, setClientCount] = useState(0);
  const [messages, setMessages] = useState<string[]>([]);
  const [userId, setUserId] = useState('test-user-1');
  const [role, setRole] = useState('seller');
  
  const { socket, isConnected, connect, disconnect, on, emit } = useSocket();

  // Connect to socket
  const handleConnect = () => {
    connect(userId);
    addMessage('Connecting to server...');
  };

  // Disconnect from socket
  const handleDisconnect = () => {
    disconnect();
    addMessage('Disconnected from server');
  };

  // Send a ping message
  const handlePing = () => {
    if (!isConnected) {
      addMessage('Socket not connected. Cannot send ping.');
      return;
    }
    
    const pingData = { 
      timestamp: new Date(),
      message: 'Hello from the client!'
    };
    
    addMessage(`Sending ping: ${JSON.stringify(pingData)}`);
    emit('ping', pingData);
  };

  // Helper to add a message to the log
  const addMessage = (message: string) => {
    setMessages(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  // Set up event listeners
  useEffect(() => {
    if (!socket) return;
    
    // Update connection status
    setConnected(isConnected);
    setConnectionStatus(isConnected ? 'Connected' : 'Disconnected');
    
    // Listen for client count updates
    const clientCountCleanup = on('clientCount', (data) => {
      setClientCount(data.count);
      addMessage(`Client count updated: ${data.count}`);
    });
    
    // Listen for pong responses
    const pongCleanup = on('pong', (data) => {
      addMessage(`Received pong: ${JSON.stringify(data)}`);
    });
    
    // Listen for auth status
    const authStatusCleanup = on('authStatus', (data) => {
      addMessage(`Auth status: ${JSON.stringify(data)}`);
    });
    
    return () => {
      clientCountCleanup();
      pongCleanup();
      authStatusCleanup();
    };
  }, [socket, isConnected, on]);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Socket.io Connection Test</h1>
      
      <div className="mb-6 p-4 border rounded-lg bg-gray-50">
        <div className="flex items-center mb-4">
          <div className={`h-4 w-4 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} mr-2`}></div>
          <span className="font-semibold">Status: {connectionStatus}</span>
        </div>
        
        <p className="mb-2">Connected Clients: {clientCount}</p>
        
        <div className="flex gap-4 mb-4">
          <button
            onClick={handleConnect}
            disabled={isConnected}
            className={`px-4 py-2 rounded ${
              isConnected ? 'bg-gray-300' : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            Connect
          </button>
          
          <button
            onClick={handleDisconnect}
            disabled={!isConnected}
            className={`px-4 py-2 rounded ${
              !isConnected ? 'bg-gray-300' : 'bg-red-500 text-white hover:bg-red-600'
            }`}
          >
            Disconnect
          </button>
          
          <button
            onClick={handlePing}
            disabled={!isConnected}
            className={`px-4 py-2 rounded ${
              !isConnected ? 'bg-gray-300' : 'bg-green-500 text-white hover:bg-green-600'
            }`}
          >
            Send Ping
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">User ID:</label>
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full p-2 border rounded"
              disabled={isConnected}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Role:</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full p-2 border rounded"
              disabled={isConnected}
            >
              <option value="seller">Seller</option>
              <option value="provider">Provider</option>
              <option value="delivery">Delivery</option>
              <option value="admin">Admin</option>
              <option value="support">Support</option>
              <option value="call_center">Call Center</option>
            </select>
          </div>
        </div>
      </div>
      
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Event Log</h2>
        <div className="h-64 overflow-y-auto p-4 border rounded-lg bg-gray-900 text-green-400 font-mono text-sm">
          {messages.length > 0 ? (
            messages.map((msg, index) => <div key={index}>{msg}</div>)
          ) : (
            <div className="text-gray-500">No events yet. Try connecting to the server.</div>
          )}
        </div>
      </div>
      
      <div className="text-sm text-gray-500">
        <p>Note: Make sure your Socket.io server is running on {process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000'}</p>
      </div>
    </div>
  );
}