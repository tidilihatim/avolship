"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { 
  Plus, 
  Search, 
  Package, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  DollarSign,
  Calendar,
  ArrowRight,
  Filter
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface SourcingRequest {
  _id: string;
  requestNumber: string;
  status: string;
  productName: string;
  productDescription: string;
  quantity: number;
  targetPrice: number;
  currency: string;
  urgencyLevel: string;
  createdAt: string;
  requiredByDate: string;
  providerId?: {
    name: string;
    email: string;
  };
  providerResponse?: {
    adjustedPrice?: number;
    adjustedQuantity?: number;
  };
  finalPrice?: number;
  finalQuantity?: number;
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

export default function SellerSourcingPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [requests, setRequests] = useState<SourcingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });

  const fetchSourcingRequests = async () => {
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(statusFilter !== "all" && { status: statusFilter }),
      });

      const response = await fetch(`/api/sourcing?${params}`);
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

  useEffect(() => {
    fetchSourcingRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, pagination.page]);

  const filteredRequests = requests.filter((request) => {
    return (
      request.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.requestNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sourcing Requests</h1>
          <p className="text-muted-foreground">
            Manage your product sourcing requests with providers
          </p>
        </div>
        <div className="flex gap-2">
          {process.env.NODE_ENV === 'development' && (
            <>
              <Button 
                variant="outline" 
                onClick={async () => {
                  try {
                    const toastId = toast.loading('Generating test sourcing data...');
                    const response = await fetch('/api/seller/sourcing/seed', {
                      method: 'POST'
                    });
                    const data = await response.json();
                    toast.dismiss(toastId);
                    if (data.success) {
                      toast.success(data.data.message || 'Test data generated successfully!');
                      fetchSourcingRequests();
                    } else {
                      toast.error(data.error || 'Failed to generate test data');
                    }
                  } catch (error) {
                    toast.error('Error generating test data');
                  }
                }}
              >
                Generate Test Data
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  console.log('[DEBUG] Current sourcing requests:', requests);
                  console.log('[DEBUG] User session:', session);
                  toast.success('Debug info logged to console');
                }}
              >
                Debug Check
              </Button>
              <Button 
                variant="outline"
                className="text-red-600 hover:text-red-700" 
                onClick={async () => {
                  if (confirm('This will remove all test products and sourcing requests. Are you sure?')) {
                    try {
                      const toastId = toast.loading('Cleaning up test data...');
                      const response = await fetch('/api/seller/sourcing/cleanup', {
                        method: 'DELETE'
                      });
                      const data = await response.json();
                      toast.dismiss(toastId);
                      if (data.success) {
                        toast.success(`Cleaned up ${data.data.productsDeleted} products and ${data.data.sourcingRequestsDeleted} requests`);
                        fetchSourcingRequests();
                      } else {
                        toast.error(data.error || 'Failed to cleanup test data');
                      }
                    } catch (error) {
                      toast.error('Error cleaning up test data');
                    }
                  }
                }}
              >
                Cleanup Test Data
              </Button>
            </>
          )}
          <Button onClick={() => router.push("/dashboard/seller/sourcing/new")}>
            <Plus className="h-4 w-4 mr-2" />
            New Request
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pagination.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {requests.filter(r => r.status === 'PENDING').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <AlertCircle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {requests.filter(r => ['NEGOTIATING', 'APPROVED', 'PAID', 'SHIPPING'].includes(r.status)).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {requests.filter(r => r.status === 'DELIVERED').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filter Requests</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search by product name or request number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
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
        </CardContent>
      </Card>

      {/* Requests List */}
      <div className="space-y-4">
        {loading ? (
          <Card>
            <CardContent className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
              <p className="mt-4 text-muted-foreground">Loading sourcing requests...</p>
            </CardContent>
          </Card>
        ) : filteredRequests.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No sourcing requests found</p>
              <Button 
                className="mt-4" 
                onClick={() => router.push("/dashboard/seller/sourcing/new")}
              >
                Create Your First Request
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredRequests.map((request) => {
            const status = statusConfig[request.status as keyof typeof statusConfig];
            const StatusIcon = status?.icon || Clock;
            
            return (
              <Card 
                key={request._id} 
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push(`/dashboard/seller/sourcing/${request._id}`)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold">{request.productName}</h3>
                        <Badge className={`${status?.color} text-white`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {status?.label}
                        </Badge>
                        <Badge variant="outline" className="ml-2">
                          {request.requestNumber}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {request.productDescription}
                      </p>
                      
                      <div className="flex items-center gap-6 text-sm">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          <span>Qty: {request.quantity}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span>Target: {request.currency} {request.targetPrice.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>Required by: {formatDistanceToNow(new Date(request.requiredByDate), { addSuffix: true })}</span>
                        </div>
                      </div>
                      
                      {request.providerId && (
                        <div className="text-sm text-muted-foreground">
                          Assigned to: {request.providerId.name}
                        </div>
                      )}
                      
                      {request.finalPrice && (
                        <div className="text-sm font-medium text-green-600">
                          Final Price: {request.currency} {request.finalPrice.toFixed(2)}
                        </div>
                      )}
                    </div>
                    
                    <ArrowRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

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