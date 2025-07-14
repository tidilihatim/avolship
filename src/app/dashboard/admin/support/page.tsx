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

export default function AdminSupportDashboard() {
  const { data: session } = useSession();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [stats, setStats] = useState<SupportStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [assignedFilter, setAssignedFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTickets, setSelectedTickets] = useState<string[]>([]);

  const fetchTickets = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(categoryFilter !== 'all' && { category: categoryFilter }),
        ...(priorityFilter !== 'all' && { priority: priorityFilter }),
        ...(assignedFilter !== 'all' && { assignedAgent: assignedFilter })
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
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchTickets(), fetchStats()]);
      setLoading(false);
    };

    if (session?.user) {
      loadData();
    }
  }, [session, currentPage, statusFilter, categoryFilter, priorityFilter, assignedFilter]);

  const handleBulkStatusUpdate = async (newStatus: string) => {
    if (selectedTickets.length === 0) {
      toast.error('Please select tickets to update');
      return;
    }

    try {
      const promises = selectedTickets.map(ticketId =>
        fetch(`/api/support/tickets/${ticketId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus })
        })
      );

      await Promise.all(promises);
      toast.success(`Updated ${selectedTickets.length} tickets`);
      setSelectedTickets([]);
      fetchTickets();
      fetchStats();
    } catch (error) {
      console.error('Error updating tickets:', error);
      toast.error('Failed to update tickets');
    }
  };

  const assignTicketToAgent = async (ticketId: string, agentId: string) => {
    try {
      const response = await fetch(`/api/support/tickets/${ticketId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          assignedAgentId: agentId,
          status: TicketStatus.IN_PROGRESS
        })
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Ticket assigned successfully');
        fetchTickets();
      } else {
        toast.error(data.error || 'Failed to assign ticket');
      }
    } catch (error) {
      console.error('Error assigning ticket:', error);
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

  const getCustomerTypeIcon = (type: string) => {
    return type === 'seller' ? '🏪' : '🚛';
  };

  const getSLAStatus = (ticket: SupportTicket) => {
    const now = new Date().getTime();
    const created = new Date(ticket.createdAt).getTime();
    const minutesElapsed = Math.floor((now - created) / (1000 * 60));

    if (ticket.status === TicketStatus.RESOLVED || ticket.status === TicketStatus.CLOSED) {
      return 'completed';
    }

    if (!ticket.sla.firstResponseAt && minutesElapsed > ticket.sla.responseTimeTarget) {
      return 'overdue';
    }

    if (ticket.sla.firstResponseAt && minutesElapsed > ticket.sla.resolutionTimeTarget) {
      return 'overdue';
    }

    if (minutesElapsed > ticket.sla.responseTimeTarget * 0.8) {
      return 'warning';
    }

    return 'on-track';
  };

  const getSLAColor = (status: string) => {
    switch (status) {
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'on-track': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredTickets = tickets.filter(ticket =>
    ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.customerId?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Support Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage customer support tickets and agent performance</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => window.location.href = '/dashboard/admin/support/settings'}
          >
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Tickets</p>
                  <p className="text-2xl font-bold">{stats.overview.totalTickets}</p>
                </div>
                <Bug className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Open/Active</p>
                  <p className="text-2xl font-bold">{stats.overview.openTickets + stats.overview.inProgressTickets}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Resolution Rate</p>
                  <p className="text-2xl font-bold">{stats.overview.responseRate}%</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Resolution</p>
                  <p className="text-2xl font-bold">{stats.overview.averageResolutionTime}h</p>
                </div>
                <Clock className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          {stats.chatStats && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Chats</p>
                    <p className="text-2xl font-bold">{stats.chatStats.activeChatRooms}</p>
                  </div>
                  <MessageCircle className="w-8 h-8 text-indigo-500" />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <Tabs defaultValue="tickets" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tickets">All Tickets</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="agents">Agents</TabsTrigger>
        </TabsList>

        <TabsContent value="tickets" className="space-y-4">
          {/* Filters and Actions */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col lg:flex-row gap-4 mb-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search tickets, customers..."
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

              {/* Bulk Actions */}
              {selectedTickets.length > 0 && (
                <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
                  <span className="text-sm text-blue-800">
                    {selectedTickets.length} ticket(s) selected
                  </span>
                  <div className="flex gap-2 ml-auto">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleBulkStatusUpdate(TicketStatus.IN_PROGRESS)}
                    >
                      Mark In Progress
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleBulkStatusUpdate(TicketStatus.RESOLVED)}
                    >
                      Mark Resolved
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedTickets([])}
                    >
                      Clear Selection
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tickets Table */}
          <Card>
            <CardHeader>
              <CardTitle>Support Tickets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <input
                          type="checkbox"
                          checked={selectedTickets.length === filteredTickets.length && filteredTickets.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedTickets(filteredTickets.map(t => t._id));
                            } else {
                              setSelectedTickets([]);
                            }
                          }}
                        />
                      </TableHead>
                      <TableHead>Ticket #</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>SLA</TableHead>
                      <TableHead>Agent</TableHead>
                      <TableHead>Messages</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTickets.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={12} className="text-center py-8 text-gray-500">
                          No tickets found matching your criteria.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredTickets.map((ticket) => {
                        const slaStatus = getSLAStatus(ticket);
                        return (
                          <TableRow key={ticket._id}>
                            <TableCell>
                              <input
                                type="checkbox"
                                checked={selectedTickets.includes(ticket._id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedTickets(prev => [...prev, ticket._id]);
                                  } else {
                                    setSelectedTickets(prev => prev.filter(id => id !== ticket._id));
                                  }
                                }}
                              />
                            </TableCell>
                            <TableCell className="font-mono text-sm">{ticket.ticketNumber}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span>{getCustomerTypeIcon(ticket.customerType)}</span>
                                <div>
                                  <p className="font-medium text-sm">{ticket.customerId?.name || 'Unknown'}</p>
                                  <p className="text-xs text-gray-500">{ticket.customerType}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="max-w-xs">
                              <div>
                                <p className="font-medium truncate">{ticket.subject}</p>
                                {ticket.sla.escalationLevel > 0 && (
                                  <Badge variant="destructive" className="text-xs mt-1">
                                    Escalated L{ticket.sla.escalationLevel}
                                  </Badge>
                                )}
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
                              <Badge className={getSLAColor(slaStatus)}>
                                {slaStatus.replace('-', ' ')}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {ticket.assignedAgentId ? (
                                <div className="flex items-center gap-1">
                                  <User className="w-3 h-3" />
                                  <span className="text-sm">{ticket.assignedAgentId.name}</span>
                                </div>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => assignTicketToAgent(ticket._id, session?.user?.id || '')}
                                >
                                  Assign to me
                                </Button>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <MessageCircle className="w-4 h-4" />
                                {ticket.messageCount}
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-gray-500">
                              {new Date(ticket.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(`/dashboard/admin/support/${ticket._id}`, '_blank')}
                              >
                                View
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          {stats && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Category Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {stats.categoryBreakdown.map((item, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          {item.category.replace('_', ' ').toUpperCase()}
                        </span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full"
                              style={{ width: `${item.percentage}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-600 w-12">
                            {item.count}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {stats.recentActivity.slice(0, 5).map((ticket) => (
                      <div key={ticket._id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex-1">
                          <p className="text-sm font-medium truncate">{ticket.subject}</p>
                          <p className="text-xs text-gray-500">
                            {ticket.customerId?.name} • {new Date(ticket.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge className={getStatusColor(ticket.status)} variant="outline">
                          {ticket.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="agents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Agent Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>Agent performance metrics will be displayed here.</p>
                <p className="text-sm">Feature coming soon...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}