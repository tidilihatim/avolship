'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestSocketPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const testDirectConnection = async () => {
    setIsConnecting(true);
    addLog('Starting direct socket connection test...');
    
    try {
      // Test HTTP endpoint first
      addLog('Testing HTTP endpoint...');
      const healthResponse = await fetch('http://localhost:3001/api/health');
      if (healthResponse.ok) {
        const health = await healthResponse.json();
        addLog(`✅ HTTP endpoint working: ${JSON.stringify(health)}`);
      } else {
        addLog(`❌ HTTP endpoint failed: ${healthResponse.status}`);
      }

      // Import socket.io dynamically
      addLog('Loading socket.io client...');
      const { io } = await import('socket.io-client');
      
      // Create socket connection
      addLog('Creating socket connection to http://localhost:3001...');
      const socket = io('http://localhost:3001', {
        withCredentials: true,
        transports: ['polling', 'websocket'],
        reconnection: false
      });

      socket.on('connect', () => {
        addLog('✅ Socket connected successfully!');
        addLog(`Socket ID: ${socket.id}`);
        setIsConnecting(false);
      });

      socket.on('connect_error', (error) => {
        addLog(`❌ Connection error: ${error.message}`);
        addLog(`Error type: ${error.type}`);
        setIsConnecting(false);
      });

      socket.on('error', (error) => {
        addLog(`❌ Socket error: ${error}`);
      });

      // Cleanup
      return () => {
        socket.disconnect();
      };
    } catch (error) {
      addLog(`❌ Test failed: ${error}`);
      setIsConnecting(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Socket Connection Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button 
              onClick={testDirectConnection}
              disabled={isConnecting}
            >
              {isConnecting ? 'Connecting...' : 'Test Socket Connection'}
            </Button>
            <Button 
              onClick={() => setLogs([])}
              variant="outline"
            >
              Clear Logs
            </Button>
          </div>
          
          <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <div className="text-gray-500">No logs yet. Click "Test Socket Connection" to start.</div>
            ) : (
              logs.map((log, index) => (
                <div key={index}>{log}</div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}