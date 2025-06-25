'use client';

import { getAccessToken } from '@/app/actions/cookie';
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

interface AgentWorkload {
  agentId: string;
  agentName: string;
  email: string;
  workload: number;
  isOnline: boolean;
  lastActive?: Date;
}

interface WorkloadSummary {
  totalAgents: number;
  activeAgents: number;
  totalPendingOrders: number;
  averageWorkload: number;
  lastUpdated: string;
}

interface WorkloadStats {
  agents: AgentWorkload[];
  summary: WorkloadSummary;
}

export function useWorkloadStats() {
  const [workloadStats, setWorkloadStats] = useState<WorkloadStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkloadStats = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Call your Express server instead of Next.js API
      const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

      const jwtToken = await getAccessToken();
      if (!jwtToken) {
        return toast.error("Configuration Error")
      }

      const response = await fetch(`${SOCKET_URL}/api/orders/workload-stats`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          "authorization": `Bearer ${jwtToken}`,
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch workload stats');
      }

      setWorkloadStats(result.data);
    } catch (err) {
      console.error('Error fetching workload stats:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    fetchWorkloadStats();

    const interval = setInterval(fetchWorkloadStats, 30000);
    return () => clearInterval(interval);
  }, [fetchWorkloadStats]);

  return {
    workloadStats,
    isLoading,
    error,
    refetch: fetchWorkloadStats
  };
}