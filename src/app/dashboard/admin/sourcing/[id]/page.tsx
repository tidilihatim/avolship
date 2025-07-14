"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { 
  ArrowLeft, 
  Package, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  DollarSign,
  Calendar,
  User,
  Building,
  FileText,
  MapPin,
  Truck
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

interface SourcingRequest {
  _id: string;
  requestNumber: string;
  status: string;
  productName: string;
  productDescription: string;
  productImages: string[];
  category: string;
  quantity: number;
  targetPrice: number;
  currency: string;
  urgencyLevel: string;
  notes?: string;
  createdAt: string;
  requiredByDate: string;
  sellerId: {
    _id: string;
    name: string;
    email: string;
  };
  providerId?: {
    _id: string;
    name: string;
    email: string;
  };
  providerResponse?: {
    adjustedPrice?: number;
    adjustedQuantity?: number;
    deliveryDate?: string;
    notes?: string;
    respondedAt?: string;
  };
  negotiations?: Array<{
    senderId: string;
    senderRole: string;
    message: string;
    priceOffer?: number;
    quantityOffer?: number;
    timestamp: string;
  }>;
  finalPrice?: number;
  finalQuantity?: number;
  paymentDetails?: {
    amount: number;
    method: string;
    transactionId: string;
    paidAt: string;
  };
  shippingDetails?: {
    trackingNumber: string;
    carrier: string;
    shippedAt?: string;
    estimatedDelivery?: string;
    deliveredAt?: string;
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

export default function AdminSourcingDetailPage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  const router = useRouter();
  const [request, setRequest] = useState<SourcingRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [requestId, setRequestId] = useState<string>('');

  useEffect(() => {
    const initPage = async () => {
      let id: string;
      if ('then' in params) {
        // params is a Promise
        const resolvedParams = await params;
        id = resolvedParams.id;
      } else {
        // params is direct object
        id = params.id;
      }
      setRequestId(id);
    };
    initPage();
  }, [params]);

  useEffect(() => {
    if (requestId) {
      fetchSourcingRequest();
    }
  }, [requestId]);

  const fetchSourcingRequest = async () => {
    try {
      const response = await fetch(`/api/sourcing/${requestId}`);
      const data = await response.json();

      if (response.ok) {
        setRequest(data.data);
      } else {
        toast.error(data.error || "Failed to load sourcing request");
      }
    } catch (error) {
      toast.error("Failed to load sourcing request");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Sourcing request not found</p>
      </div>
    );
  }

  const status = statusConfig[request.status as keyof typeof statusConfig];
  const StatusIcon = status?.icon || Clock;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sourcing Request Details</h1>
          <p className="text-muted-foreground">
            Request #{request.requestNumber} - Admin View
          </p>
        </div>
      </div>

      {/* Request Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              {request.productName}
            </CardTitle>
            <Badge className={`${status?.color} text-white`}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {status?.label}
            </Badge>
          </div>
          <CardDescription>
            {request.productDescription}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label className="text-sm text-muted-foreground">Quantity</Label>
              <p className="font-medium">{request.quantity.toLocaleString()}</p>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Target Price</Label>
              <p className="font-medium">{request.currency} {request.targetPrice.toFixed(2)}</p>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Urgency</Label>
              <p className="font-medium">{request.urgencyLevel}</p>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Created</Label>
              <p className="font-medium">{formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}</p>
            </div>
          </div>

          {request.notes && (
            <div>
              <Label className="text-sm text-muted-foreground">Additional Notes</Label>
              <p className="text-sm mt-1">{request.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Seller Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Seller Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Name</span>
            <span className="font-medium">{request.sellerId.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Email</span>
            <span className="font-medium">{request.sellerId.email}</span>
          </div>
        </CardContent>
      </Card>

      {/* Provider Information */}
      {request.providerId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Provider Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Name</span>
              <span className="font-medium">{request.providerId.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Email</span>
              <span className="font-medium">{request.providerId.email}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Provider Response */}
      {request.providerResponse && (
        <Card>
          <CardHeader>
            <CardTitle>Provider Response</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              {request.providerResponse.adjustedPrice && (
                <div>
                  <Label className="text-sm text-muted-foreground">Adjusted Price</Label>
                  <p className="font-medium">{request.currency} {request.providerResponse.adjustedPrice.toFixed(2)}</p>
                </div>
              )}
              {request.providerResponse.adjustedQuantity && (
                <div>
                  <Label className="text-sm text-muted-foreground">Adjusted Quantity</Label>
                  <p className="font-medium">{request.providerResponse.adjustedQuantity.toLocaleString()}</p>
                </div>
              )}
            </div>
            {request.providerResponse.notes && (
              <div>
                <Label className="text-sm text-muted-foreground">Provider Notes</Label>
                <p className="text-sm mt-1">{request.providerResponse.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Payment Details */}
      {request.paymentDetails && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Payment Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-muted-foreground">Amount</Label>
                <p className="font-medium">{request.currency} {request.paymentDetails.amount.toFixed(2)}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Method</Label>
                <p className="font-medium">{request.paymentDetails.method}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Transaction ID</Label>
                <p className="font-medium font-mono">{request.paymentDetails.transactionId}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Paid Date</Label>
                <p className="font-medium">{format(new Date(request.paymentDetails.paidAt), "PPP")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Shipping Details */}
      {request.shippingDetails && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Shipping Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-muted-foreground">Tracking Number</Label>
                <p className="font-medium font-mono">{request.shippingDetails.trackingNumber}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Carrier</Label>
                <p className="font-medium">{request.shippingDetails.carrier}</p>
              </div>
              {request.shippingDetails.shippedAt && (
                <div>
                  <Label className="text-sm text-muted-foreground">Shipped Date</Label>
                  <p className="font-medium">{format(new Date(request.shippingDetails.shippedAt), "PPP")}</p>
                </div>
              )}
              {request.shippingDetails.estimatedDelivery && (
                <div>
                  <Label className="text-sm text-muted-foreground">Estimated Delivery</Label>
                  <p className="font-medium">{format(new Date(request.shippingDetails.estimatedDelivery), "PPP")}</p>
                </div>
              )}
              {request.shippingDetails.deliveredAt && (
                <div>
                  <Label className="text-sm text-muted-foreground">Delivered Date</Label>
                  <p className="font-medium">{format(new Date(request.shippingDetails.deliveredAt), "PPP")}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Negotiations History */}
      {request.negotiations && request.negotiations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Negotiation History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {request.negotiations.map((negotiation, index) => (
                <div key={index} className="border-l-2 border-muted pl-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{negotiation.senderRole}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(negotiation.timestamp), { addSuffix: true })}
                      </span>
                    </div>
                    {(negotiation.priceOffer || negotiation.quantityOffer) && (
                      <div className="text-sm">
                        {negotiation.priceOffer && (
                          <span className="text-green-600 font-medium">
                            Price: {request.currency} {negotiation.priceOffer.toFixed(2)}
                          </span>
                        )}
                        {negotiation.quantityOffer && (
                          <span className="text-blue-600 font-medium ml-2">
                            Qty: {negotiation.quantityOffer}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <p className="text-sm mt-2">{negotiation.message}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}