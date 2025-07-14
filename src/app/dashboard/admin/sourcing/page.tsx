"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { 
  Search, 
  Package, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  DollarSign,
  Calendar,
  Eye,
  Download,
  TrendingUp,
  TrendingDown,
  Activity,
  Users,
  Filter,
  BarChart,
  Globe
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

interface SourcingRequest {
  _id: string;
  requestNumber: string;
  status: string;
  productName: string;
  quantity: number;
  targetPrice: number;
  finalPrice?: number;
  finalQuantity?: number;
  currency: string;
  urgencyLevel: string;
  sourcingCountry: string;
  createdAt: string;
  requiredByDate: string;
  approvedAt?: string;
  sellerId: {
    _id: string;
    name: string;
    email: string;
    company?: string;
  };
  providerId?: {
    _id: string;
    name: string;
    email: string;
    company?: string;
  };
  destinationWarehouse: {
    name: string;
    location: string;
    country: string;
  };
  paymentDetails?: {
    amount: number;
    method: string;
    paidAt: string;
  };
}

const statusConfig = {
  PENDING: { label: "Pending", color: "bg-yellow-500", icon: Clock },
  NEGOTIATING: { label: "Negotiating", color: "bg-blue-500", icon: AlertCircle },
  APPROVED: { label: "Approved", color: "bg-green-500", icon: CheckCircle },
  PAID: { label: "Paid", color: "bg-indigo-500", icon: DollarSign },
  SHIPPING: { label: "Shipping", color: "bg-purple-500", icon: Package },
  DELIVERED: { label: "Delivered", color: "bg-green-600", icon: CheckCircle },
  CANCELLED: { label: "Cancelled", color: "bg-red-500", icon: XCircle },
};

export default function AdminSourcingHistoryPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<SourcingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [countryFilter, setCountryFilter] = useState("all");
  const [expeditionFilter, setExpeditionFilter] = useState("all");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("all");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0,
  });

  // Stats
  const [stats, setStats] = useState({
    totalRequests: 0,
    totalValue: 0,
    averageValue: 0,
    completionRate: 0,
    avgProcessingTime: 0,
    topProviders: [] as Array<{ name: string; count: number; value: number }>,
    topSellers: [] as Array<{ name: string; count: number; value: number }>,
  });

  useEffect(() => {
    fetchSourcingRequests();
    fetchStats();
  }, [statusFilter, dateFilter, countryFilter, expeditionFilter, paymentMethodFilter, pagination.page]);

  const fetchSourcingRequests = async () => {
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(statusFilter !== "all" && { status: statusFilter }),
        ...(dateFilter !== "all" && { dateFilter }),
        ...(countryFilter !== "all" && { country: countryFilter }),
        ...(expeditionFilter !== "all" && { expeditionStatus: expeditionFilter }),
        ...(paymentMethodFilter !== "all" && { paymentMethod: paymentMethodFilter }),
      });

      const response = await fetch(`/api/admin/sourcing?${params}`);
      const data = await response.json();

      if (response.ok) {
        setRequests(data.data);
        setPagination(data.pagination);
      } else {
        toast.error(data.error || "Failed to fetch sourcing requests");
      }
    } catch (error) {
      toast.error("Failed to fetch sourcing requests");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/admin/sourcing/stats");
      const data = await response.json();

      if (response.ok) {
        setStats(data);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  const exportToCSV = async () => {
    try {
      const response = await fetch("/api/admin/sourcing/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: statusFilter,
          dateFilter,
          country: countryFilter,
          expeditionStatus: expeditionFilter,
          paymentMethod: paymentMethodFilter,
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `sourcing-history-${new Date().toISOString().split("T")[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        toast.success("Export completed successfully");
      } else {
        toast.error("Failed to export data");
      }
    } catch (error) {
      toast.error("Failed to export data");
    }
  };

  const filteredRequests = requests.filter(request =>
    request.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.requestNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.sellerId.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.providerId?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount: number, currency: string) => {
    return `${currency} ${amount.toFixed(2)}`;
  };

  const getStatusBadge = (status: string) => {
    const config = statusConfig[status as keyof typeof statusConfig];
    const StatusIcon = config?.icon || Clock;
    
    return (
      <Badge className={`${config?.color} text-white`}>
        <StatusIcon className="h-3 w-3 mr-1" />
        {config?.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sourcing History</h1>
          <p className="text-muted-foreground">
            Complete overview of all sourcing requests and transactions
          </p>
        </div>
        <Button onClick={exportToCSV} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRequests}</div>
            <p className="text-xs text-muted-foreground">
              {stats.completionRate.toFixed(1)}% completion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalValue.toFixed(0)}</div>
            <p className="text-xs text-muted-foreground">
              Avg: ${stats.averageValue.toFixed(0)} per request
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processing Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgProcessingTime.toFixed(1)}d</div>
            <p className="text-xs text-muted-foreground">
              Average completion time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Providers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.topProviders.length}</div>
            <p className="text-xs text-muted-foreground">
              Contributing providers
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top Performers */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top Providers</CardTitle>
            <CardDescription>Most active sourcing providers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.topProviders.slice(0, 5).map((provider, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-medium">{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium">{provider.name}</p>
                      <p className="text-sm text-muted-foreground">{provider.count} requests</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${provider.value.toFixed(0)}</p>
                    <p className="text-sm text-muted-foreground">total value</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top Sellers</CardTitle>
            <CardDescription>Most active sourcing requesters</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.topSellers.slice(0, 5).map((seller, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-medium">{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium">{seller.name}</p>
                      <p className="text-sm text-muted-foreground">{seller.count} requests</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${seller.value.toFixed(0)}</p>
                    <p className="text-sm text-muted-foreground">total value</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filter & Search</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search by product, request number, seller, or provider..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="NEGOTIATING">Negotiating</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="PAID">Paid</SelectItem>
                <SelectItem value="SHIPPING">Shipping</SelectItem>
                <SelectItem value="DELIVERED">Delivered</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="quarter">This Quarter</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-4">
            <Select value={countryFilter} onValueChange={setCountryFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Country" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Countries</SelectItem>
                <SelectItem value="China">China</SelectItem>
                <SelectItem value="Turkey">Turkey</SelectItem>
                <SelectItem value="Morocco">Morocco</SelectItem>
                <SelectItem value="India">India</SelectItem>
                <SelectItem value="Vietnam">Vietnam</SelectItem>
                <SelectItem value="Bangladesh">Bangladesh</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
            <Select value={expeditionFilter} onValueChange={setExpeditionFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Expedition" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Expeditions</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="IN_TRANSIT">In Transit</SelectItem>
                <SelectItem value="CUSTOMS">Customs</SelectItem>
                <SelectItem value="DELIVERED">Delivered</SelectItem>
                <SelectItem value="DELAYED">Delayed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Payment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="credit_card">Credit Card</SelectItem>
                <SelectItem value="paypal">PayPal</SelectItem>
                <SelectItem value="wire_transfer">Wire Transfer</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="check">Check</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              onClick={() => {
                setStatusFilter("all");
                setDateFilter("all");
                setCountryFilter("all");
                setExpeditionFilter("all");
                setPaymentMethodFilter("all");
                setSearchTerm("");
              }}
            >
              <Filter className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Sourcing Requests</CardTitle>
          <CardDescription>
            Showing {filteredRequests.length} of {pagination.total} requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
              <p className="mt-4 text-muted-foreground">Loading requests...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Request</TableHead>
                  <TableHead>Seller</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((request) => (
                  <TableRow key={request._id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{request.productName}</p>
                        <p className="text-sm text-muted-foreground">{request.requestNumber}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{request.sellerId.name}</p>
                        <p className="text-sm text-muted-foreground">{request.sellerId.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {request.providerId ? (
                        <div>
                          <p className="font-medium">{request.providerId.name}</p>
                          <p className="text-sm text-muted-foreground">{request.providerId.email}</p>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{request.sourcingCountry}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(request.status)}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{request.quantity} units</p>
                        <Badge variant="outline" className="text-xs">
                          {request.urgencyLevel}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {formatCurrency(request.targetPrice, request.currency)}
                        </p>
                        {request.finalPrice && (
                          <p className="text-sm text-green-600">
                            Final: {formatCurrency(request.finalPrice, request.currency)}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {format(new Date(request.createdAt), "MMM d, yyyy")}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => router.push(`/dashboard/admin/sourcing/${request._id}`)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
            disabled={pagination.page === 1}
          >
            Previous
          </Button>
          <span className="flex items-center px-4 text-sm">
            Page {pagination.page} of {pagination.pages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
            disabled={pagination.page === pagination.pages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}