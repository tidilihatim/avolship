"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  RefreshCw, 
  Settings2,
  CreditCard,
  Coins,
  TrendingUp,
  Search,
  Filter
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getUserTokenData } from '@/app/actions/tokens';

interface Transaction {
  id: string;
  type: string;
  status: string;
  amount: number;
  description: string;
  createdAt: string;
}

export function TransactionHistorySection() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchTransactions();
  }, []);

  useEffect(() => {
    filterTransactions();
  }, [transactions, searchTerm, typeFilter, statusFilter]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const tokenData = await getUserTokenData();
      setTransactions(tokenData?.transactions || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterTransactions = () => {
    let filtered = [...transactions];

    if (searchTerm) {
      filtered = filtered.filter(t => 
        t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(t => t.type === typeFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(t => t.status === statusFilter);
    }

    setFilteredTransactions(filtered);
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'purchase':
        return <CreditCard className="h-4 w-4 text-green-600" />;
      case 'spend':
        return <TrendingUp className="h-4 w-4 text-blue-600" />;
      case 'refund':
        return <RefreshCw className="h-4 w-4 text-orange-600" />;
      case 'admin_adjustment':
        return <Settings2 className="h-4 w-4 text-purple-600" />;
      default:
        return <Coins className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: 'default',
      pending: 'secondary',
      failed: 'destructive',
      refunded: 'outline',
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    const config = {
      purchase: { label: 'Purchase', color: 'bg-green-100 text-green-800' },
      spend: { label: 'Campaign', color: 'bg-blue-100 text-blue-800' },
      refund: { label: 'Refund', color: 'bg-orange-100 text-orange-800' },
      admin_adjustment: { label: 'Adjustment', color: 'bg-purple-100 text-purple-800' },
    };

    const typeConfig = config[type as keyof typeof config] || 
      { label: type, color: 'bg-gray-100 text-gray-800' };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${typeConfig.color}`}>
        {typeConfig.label}
      </span>
    );
  };

  const formatAmount = (amount: number, type: string) => {
    const prefix = type === 'spend' ? '-' : '+';
    const color = type === 'spend' ? 'text-red-600' : 'text-green-600';
    return (
      <span className={`font-medium ${color}`}>
        {prefix}{Math.abs(amount)}
      </span>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>Loading your token transactions...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="h-4 w-4 bg-muted rounded" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded" />
                  <div className="h-3 bg-muted rounded w-3/4" />
                </div>
                <div className="h-6 w-16 bg-muted rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>
                View all your token purchases, spending, and adjustments
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchTransactions}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[140px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="purchase">Purchases</SelectItem>
                <SelectItem value="spend">Campaigns</SelectItem>
                <SelectItem value="refund">Refunds</SelectItem>
                <SelectItem value="admin_adjustment">Adjustments</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredTransactions.length === 0 ? (
            <div className="text-center py-8">
              <Coins className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Transactions Found</h3>
              <p className="text-muted-foreground">
                {searchTerm || typeFilter !== 'all' || statusFilter !== 'all'
                  ? 'No transactions match your current filters.'
                  : 'You haven\'t made any token transactions yet.'}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTransactionIcon(transaction.type)}
                          {getTypeBadge(transaction.type)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{transaction.description}</div>
                          <div className="text-xs text-muted-foreground">
                            ID: {transaction.id.slice(-8)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {formatAmount(transaction.amount, transaction.type)}
                          <Coins className="h-3 w-3 text-muted-foreground" />
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(transaction.status)}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(transaction.createdAt).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(transaction.createdAt).toLocaleTimeString()}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}