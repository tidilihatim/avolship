'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, Filter, MessageCircle, Clock, CheckCircle, AlertCircle, 
  Bug, Users, TrendingUp, Activity, User, Bot, Settings 
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

// Define enums locally to avoid importing Mongoose models on client
enum TicketCategory {
  TECHNICAL = 'technical',
  BILLING = 'billing',
  ACCOUNT = 'account',
  ORDERS = 'orders',
  SOURCING = 'sourcing',
  EXPEDITIONS = 'expeditions',
  INTEGRATIONS = 'integrations',
  GENERAL = 'general',
}

enum TicketPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

enum TicketStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  WAITING_CUSTOMER = 'waiting_customer',
  WAITING_INTERNAL = 'waiting_internal',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

interface SupportTicket {
  _id: string;
  ticketNumber: string;
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  customerId: any;
  customerType: string;
  assignedAgentId?: any;
  tags: string[];
  messageCount: number;
  lastMessageAt?: string;
  createdAt: string;
  updatedAt: string;
  sla: {
    responseTimeTarget: number;
    resolutionTimeTarget: number;
    firstResponseAt?: string;
    firstResponseDuration?: number;
    resolvedAt?: string;
    resolutionDuration?: number;
    escalationLevel: number;
  };
}

interface SupportStats {
  overview: {
    totalTickets: number;
    openTickets: number;
    inProgressTickets: number;
    resolvedTickets: number;
    closedTickets: number;
    responseRate: number;
    averageResolutionTime: number;
    criticalTickets: number;
    highPriorityTickets: number;
  };
  categoryBreakdown: Array<{
    category: string;
    count: number;
    percentage: string;
  }>;
  recentActivity: SupportTicket[];
  chatStats?: {
    activeChatRooms: number;
    totalChatSessions: number;
  };
}

export default function SupportDashboard() {
  const { data: session } = useSession();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [stats, setStats] = useState<SupportStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const fetchTickets = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '50', // Show more tickets for support dashboard
        // Remove assignedAgent filter so support sees ALL tickets
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(priorityFilter !== 'all' && { priority: priorityFilter }),
        ...(categoryFilter !== 'all' && { category: categoryFilter }),
        ...(searchTerm && { search: searchTerm })
      });

      const response = await fetch(`/api/support/tickets?${params}`);
      const data = await response.json();

      if (data.success) {
        setTickets(data.data.tickets);
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
      toast.error('Failed to fetch tickets');
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/support/stats?period=30');
      const data = await response.json();

      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    if (session?.user) {
      setLoading(true);
      Promise.all([fetchTickets(), fetchStats()]).finally(() => setLoading(false));
    }
  }, [session, statusFilter, priorityFilter, categoryFilter, searchTerm, currentPage]);

  const handleAssignToMe = async (ticketId: string) => {
    try {
      const response = await fetch(`/api/support/tickets/${ticketId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignedAgentId: session?.user?.id,
          status: TicketStatus.IN_PROGRESS
        })
      });

      if (response.ok) {
        toast.success('Ticket assigned to you');
        fetchTickets();
      }
    } catch (error) {
      toast.error('Failed to assign ticket');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case TicketStatus.OPEN: return 'bg-blue-100 text-blue-800';
      case TicketStatus.IN_PROGRESS: return 'bg-yellow-100 text-yellow-800';
      case TicketStatus.WAITING_CUSTOMER: return 'bg-orange-100 text-orange-800';
      case TicketStatus.WAITING_INTERNAL: return 'bg-purple-100 text-purple-800';
      case TicketStatus.RESOLVED: return 'bg-green-100 text-green-800';
      case TicketStatus.CLOSED: return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case TicketPriority.CRITICAL: return 'bg-red-100 text-red-800';
      case TicketPriority.HIGH: return 'bg-orange-100 text-orange-800';
      case TicketPriority.MEDIUM: return 'bg-yellow-100 text-yellow-800';
      case TicketPriority.LOW: return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h`;
    return `${Math.floor(minutes / 1440)}d`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Support Overview</h1>
          <p className="text-gray-600 mt-1">Your support dashboard with key metrics and recent activity</p>
        </div>
        <Link href="/dashboard/support/settings">
          <Button variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </Link>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Open Tickets</p>
                  <p className="text-2xl font-bold">{stats.overview.openTickets}</p>
                </div>
                <Bug className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">In Progress</p>
                  <p className="text-2xl font-bold">{stats.overview.inProgressTickets}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Resolved Today</p>
                  <p className="text-2xl font-bold">{stats.overview.resolvedTickets}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Critical/High</p>
                  <p className="text-2xl font-bold">
                    {stats.overview.criticalTickets + stats.overview.highPriorityTickets}
                  </p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg Resolution</p>
                  <p className="text-2xl font-bold">{stats.overview.averageResolutionTime}h</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search tickets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {Object.values(TicketStatus).map(status => (
                  <SelectItem key={status} value={status}>
                    {status.replace('_', ' ').toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                {Object.values(TicketPriority).map(priority => (
                  <SelectItem key={priority} value={priority}>
                    {priority.toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {Object.values(TicketCategory).map(category => (
                  <SelectItem key={category} value={category}>
                    {category.replace('_', ' ').toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tickets Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticket #</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>SLA</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      No tickets found
                    </TableCell>
                  </TableRow>
                ) : (
                  tickets.map((ticket) => (
                    <TableRow key={ticket._id}>
                      <TableCell className="font-mono text-sm">
                        {ticket.ticketNumber}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {ticket.subject}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{ticket.customerId?.name || 'Unknown'}</p>
                          <p className="text-xs text-gray-500">{ticket.customerType}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {ticket.category.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getPriorityColor(ticket.priority)}>
                          {ticket.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(ticket.status)}>
                          {ticket.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>Response: {formatTime(ticket.sla.responseTimeTarget)}</p>
                          <p>Resolution: {formatTime(ticket.sla.resolutionTimeTarget)}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Link href={`/dashboard/support/tickets/${ticket._id}`}>
                            <Button size="sm" variant="outline">
                              <MessageCircle className="w-4 h-4" />
                            </Button>
                          </Link>
                          {!ticket.assignedAgentId && (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleAssignToMe(ticket._id)}
                            >
                              Assign to me
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}