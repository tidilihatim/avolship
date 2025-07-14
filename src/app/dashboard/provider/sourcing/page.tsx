"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  ArrowRight,
  MessageSquare,
  Phone,
  Mail,
  Building,
  MapPin,
  Eye,
  Send,
  Handshake
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface SourcingRequest {
  _id: string;
  requestNumber: string;
  status: string;
  productName: string;
  productDescription: string;
  productImages: string[];
  quantity: number;
  targetPrice: number;
  currency: string;
  urgencyLevel: string;
  createdAt: string;
  requiredByDate: string;
  sellerId: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
  };
  destinationWarehouse: {
    name: string;
    location: string;
    country: string;
  };
  providerId?: {
    _id: string;
    name: string;
  };
  providerResponse?: {
    adjustedPrice?: number;
    adjustedQuantity?: number;
    notes?: string;
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

export default function ProviderSourcingPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<SourcingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedRequest, setSelectedRequest] = useState<SourcingRequest | null>(null);
  const [responseDialogOpen, setResponseDialogOpen] = useState(false);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });

  // Response form state
  const [responseForm, setResponseForm] = useState({
    adjustedPrice: "",
    adjustedQuantity: "",
    deliveryDate: "",
    notes: "",
  });

  // Approval form state
  const [approvalForm, setApprovalForm] = useState({
    finalPrice: "",
    finalQuantity: "",
  });

  useEffect(() => {
    fetchSourcingRequests();
  }, [statusFilter, pagination.page]);

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

  const handleRespond = async (requestId: string) => {
    try {
      const response = await fetch(`/api/sourcing/${requestId}/respond`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          adjustedPrice: responseForm.adjustedPrice ? parseFloat(responseForm.adjustedPrice) : undefined,
          adjustedQuantity: responseForm.adjustedQuantity ? parseInt(responseForm.adjustedQuantity) : undefined,
          deliveryDate: responseForm.deliveryDate || undefined,
          notes: responseForm.notes || undefined,
        }),
      });

      if (response.ok) {
        toast.success("Response sent successfully");
        setResponseDialogOpen(false);
        setResponseForm({
          adjustedPrice: "",
          adjustedQuantity: "",
          deliveryDate: "",
          notes: "",
        });
        fetchSourcingRequests();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to send response");
      }
    } catch (error) {
      toast.error("Failed to send response");
    }
  };

  const handleApprove = async (requestId: string) => {
    try {
      const response = await fetch(`/api/sourcing/${requestId}/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          finalPrice: parseFloat(approvalForm.finalPrice),
          finalQuantity: parseInt(approvalForm.finalQuantity),
        }),
      });

      if (response.ok) {
        toast.success("Request approved successfully");
        setApprovalDialogOpen(false);
        setApprovalForm({
          finalPrice: "",
          finalQuantity: "",
        });
        fetchSourcingRequests();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to approve request");
      }
    } catch (error) {
      toast.error("Failed to approve request");
    }
  };

  const filteredRequests = requests.filter(request =>
    request.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.requestNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.sellerId.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openResponseDialog = (request: SourcingRequest) => {
    setSelectedRequest(request);
    setResponseForm({
      adjustedPrice: request.targetPrice.toString(),
      adjustedQuantity: request.quantity.toString(),
      deliveryDate: "",
      notes: "",
    });
    setResponseDialogOpen(true);
  };

  const openApprovalDialog = (request: SourcingRequest) => {
    setSelectedRequest(request);
    setApprovalForm({
      finalPrice: request.providerResponse?.adjustedPrice?.toString() || request.targetPrice.toString(),
      finalQuantity: request.providerResponse?.adjustedQuantity?.toString() || request.quantity.toString(),
    });
    setApprovalDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sourcing Opportunities</h1>
          <p className="text-muted-foreground">
            Browse and respond to sourcing requests from sellers
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available</CardTitle>
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
            <CardTitle className="text-sm font-medium">My Negotiations</CardTitle>
            <AlertCircle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {requests.filter(r => r.status === 'NEGOTIATING' && r.providerId).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {requests.filter(r => ['APPROVED', 'PAID', 'SHIPPING', 'DELIVERED'].includes(r.status) && r.providerId).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${requests.filter(r => r.finalPrice && r.finalQuantity).reduce((sum, r) => sum + (r.finalPrice! * r.finalQuantity!), 0).toFixed(0)}
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
              placeholder="Search by product name, request number, or seller..."
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
              <SelectItem value="PENDING">Available</SelectItem>
              <SelectItem value="NEGOTIATING">Negotiating</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="PAID">Paid</SelectItem>
              <SelectItem value="SHIPPING">Shipping</SelectItem>
              <SelectItem value="DELIVERED">Delivered</SelectItem>
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
            </CardContent>
          </Card>
        ) : (
          filteredRequests.map((request) => {
            const status = statusConfig[request.status as keyof typeof statusConfig];
            const StatusIcon = status?.icon || Clock;
            const isMyRequest = request.providerId?._id;
            
            return (
              <Card 
                key={request._id} 
                className="hover:shadow-lg transition-shadow"
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
                        <Badge variant="outline">
                          {request.requestNumber}
                        </Badge>
                        {isMyRequest && (
                          <Badge variant="secondary">
                            My Request
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {request.productDescription}
                      </p>
                      
                      <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          <span>Qty: {request.quantity}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span>Target: {request.currency} {request.targetPrice}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>Due: {new Date(request.requiredByDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>{request.destinationWarehouse.location}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm">
                        <div className="flex items-center gap-1">
                          <Building className="h-4 w-4 text-muted-foreground" />
                          <span>Seller: {request.sellerId.name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span>{request.sellerId.email}</span>
                        </div>
                        {request.sellerId.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span>{request.sellerId.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(`/dashboard/provider/sourcing/${request._id}`)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        
                        {request.status === 'PENDING' && (
                          <Button
                            size="sm"
                            onClick={() => openResponseDialog(request)}
                          >
                            <Send className="h-4 w-4 mr-1" />
                            Respond
                          </Button>
                        )}
                        
                        {request.status === 'NEGOTIATING' && isMyRequest && (
                          <Button
                            size="sm"
                            onClick={() => openApprovalDialog(request)}
                          >
                            <Handshake className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                        )}
                      </div>
                      
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Response Dialog */}
      <Dialog open={responseDialogOpen} onOpenChange={setResponseDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Respond to Sourcing Request</DialogTitle>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-semibold">{selectedRequest.productName}</h4>
                <p className="text-sm text-muted-foreground">{selectedRequest.productDescription}</p>
                <div className="mt-2 text-sm">
                  <span className="font-medium">Target: {selectedRequest.currency} {selectedRequest.targetPrice} × {selectedRequest.quantity} units</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="adjustedPrice">Your Price per Unit</Label>
                  <Input
                    id="adjustedPrice"
                    type="number"
                    step="0.01"
                    value={responseForm.adjustedPrice}
                    onChange={(e) => setResponseForm(prev => ({ ...prev, adjustedPrice: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="adjustedQuantity">Available Quantity</Label>
                  <Input
                    id="adjustedQuantity"
                    type="number"
                    value={responseForm.adjustedQuantity}
                    onChange={(e) => setResponseForm(prev => ({ ...prev, adjustedQuantity: e.target.value }))}
                    placeholder="0"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="deliveryDate">Estimated Delivery Date</Label>
                <Input
                  id="deliveryDate"
                  type="date"
                  value={responseForm.deliveryDate}
                  onChange={(e) => setResponseForm(prev => ({ ...prev, deliveryDate: e.target.value }))}
                />
              </div>
              
              <div>
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  value={responseForm.notes}
                  onChange={(e) => setResponseForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Any additional information, terms, or conditions..."
                  rows={3}
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setResponseDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => handleRespond(selectedRequest._id)}>
                  Send Response
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Approval Dialog */}
      <Dialog open={approvalDialogOpen} onOpenChange={setApprovalDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Sourcing Request</DialogTitle>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-semibold">{selectedRequest.productName}</h4>
                <p className="text-sm text-muted-foreground">
                  Original: {selectedRequest.currency} {selectedRequest.targetPrice} × {selectedRequest.quantity} units
                </p>
                {selectedRequest.providerResponse && (
                  <p className="text-sm text-green-600">
                    Your offer: {selectedRequest.currency} {selectedRequest.providerResponse.adjustedPrice} × {selectedRequest.providerResponse.adjustedQuantity} units
                  </p>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="finalPrice">Final Price per Unit</Label>
                  <Input
                    id="finalPrice"
                    type="number"
                    step="0.01"
                    value={approvalForm.finalPrice}
                    onChange={(e) => setApprovalForm(prev => ({ ...prev, finalPrice: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="finalQuantity">Final Quantity</Label>
                  <Input
                    id="finalQuantity"
                    type="number"
                    value={approvalForm.finalQuantity}
                    onChange={(e) => setApprovalForm(prev => ({ ...prev, finalQuantity: e.target.value }))}
                    placeholder="0"
                  />
                </div>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-green-700">
                  Total Value: {selectedRequest.currency} {(parseFloat(approvalForm.finalPrice || "0") * parseInt(approvalForm.finalQuantity || "0")).toFixed(2)}
                </p>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setApprovalDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => handleApprove(selectedRequest._id)}>
                  Approve Request
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

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