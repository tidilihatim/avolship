"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
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
  MessageSquare,
  User,
  Building,
  Send,
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
    phone?: string;
  };
  providerId?: {
    _id: string;
    name: string;
    email: string;
    company?: string;
    phone?: string;
  };
  destinationWarehouse: {
    name: string;
    location: string;
    country: string;
  };
  providerResponse?: {
    adjustedPrice?: number;
    adjustedQuantity?: number;
    deliveryDate?: string;
    notes?: string;
    respondedAt?: string;
  };
  negotiations: Array<{
    _id: string;
    senderId: {
      _id: string;
      name: string;
      email: string;
      role: string;
    };
    senderRole: string;
    message: string;
    priceOffer?: number;
    quantityOffer?: number;
    timestamp: string;
  }>;
  finalPrice?: number;
  finalQuantity?: number;
  approvedAt?: string;
  paymentDetails?: {
    amount: number;
    method: string;
    transactionId: string;
    paidAt: string;
  };
  shippingDetails?: {
    trackingNumber: string;
    carrier: string;
    shippedAt: string;
    estimatedDelivery: string;
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

export default function SourcingRequestDetailPage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  const router = useRouter();
  const [request, setRequest] = useState<SourcingRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [negotiationMessage, setNegotiationMessage] = useState("");
  const [priceOffer, setPriceOffer] = useState("");
  const [quantityOffer, setQuantityOffer] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
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
        toast.error(data.error || "Failed to fetch sourcing request");
        router.push("/dashboard/seller/sourcing");
      }
    } catch (error) {
      toast.error("Failed to fetch sourcing request");
      router.push("/dashboard/seller/sourcing");
    } finally {
      setLoading(false);
    }
  };

  const sendNegotiationMessage = async () => {
    if (!negotiationMessage.trim()) {
      toast.error("Please enter a message");
      return;
    }

    setSendingMessage(true);
    try {
      const response = await fetch(`/api/sourcing/${requestId}/negotiate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: negotiationMessage,
          priceOffer: priceOffer ? parseFloat(priceOffer) : undefined,
          quantityOffer: quantityOffer ? parseInt(quantityOffer) : undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Message sent successfully");
        setNegotiationMessage("");
        setPriceOffer("");
        setQuantityOffer("");
        fetchSourcingRequest();
      } else {
        toast.error(data.error || "Failed to send message");
      }
    } catch (error) {
      toast.error("Failed to send message");
    } finally {
      setSendingMessage(false);
    }
  };

  const cancelRequest = async () => {
    if (!confirm("Are you sure you want to cancel this request?")) return;

    try {
      const response = await fetch(`/api/sourcing/${requestId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Request cancelled successfully");
        router.push("/dashboard/seller/sourcing");
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to cancel request");
      }
    } catch (error) {
      toast.error("Failed to cancel request");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!request) return null;

  const status = statusConfig[request.status as keyof typeof statusConfig];
  const StatusIcon = status?.icon || Clock;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{request.productName}</h1>
              <Badge className={`${status?.color} text-white`}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {status?.label}
              </Badge>
            </div>
            <p className="text-muted-foreground">{request.requestNumber}</p>
          </div>
        </div>
        
        {request.status === "PENDING" || request.status === "NEGOTIATING" ? (
          <Button variant="destructive" onClick={cancelRequest}>
            <XCircle className="h-4 w-4 mr-2" />
            Cancel Request
          </Button>
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Product Details */}
          <Card>
            <CardHeader>
              <CardTitle>Product Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Description</Label>
                <p className="text-sm mt-1">{request.productDescription}</p>
              </div>
              
              {request.productImages.length > 0 && (
                <div>
                  <Label>Product Images</Label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {request.productImages.map((image, index) => (
                      <img
                        key={index}
                        src={image}
                        alt={`Product ${index + 1}`}
                        className="w-full h-32 object-cover rounded-md"
                      />
                    ))}
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Category</Label>
                  <p className="text-sm mt-1 capitalize">{request.category}</p>
                </div>
                <div>
                  <Label>Urgency Level</Label>
                  <Badge variant="outline" className="mt-1">
                    {request.urgencyLevel}
                  </Badge>
                </div>
              </div>
              
              {request.notes && (
                <div>
                  <Label>Additional Notes</Label>
                  <p className="text-sm mt-1">{request.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Negotiation & Communication */}
          {request.status === "NEGOTIATING" && (
            <Card>
              <CardHeader>
                <CardTitle>Negotiation</CardTitle>
                <CardDescription>
                  Communicate with the provider about pricing and terms
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Messages */}
                {request.negotiations.length > 0 && (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {request.negotiations.map((msg) => (
                      <div
                        key={msg._id}
                        className={`flex ${
                          msg.senderRole === "SELLER" ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg p-3 ${
                            msg.senderRole === "SELLER"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium">
                              {msg.senderId.name}
                            </span>
                            <span className="text-xs opacity-70">
                              {formatDistanceToNow(new Date(msg.timestamp), { addSuffix: true })}
                            </span>
                          </div>
                          <p className="text-sm">{msg.message}</p>
                          {(msg.priceOffer || msg.quantityOffer) && (
                            <div className="mt-2 pt-2 border-t border-current/20">
                              {msg.priceOffer && (
                                <p className="text-xs">
                                  Price Offer: {request.currency} {msg.priceOffer}
                                </p>
                              )}
                              {msg.quantityOffer && (
                                <p className="text-xs">
                                  Quantity Offer: {msg.quantityOffer} units
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <Separator />

                {/* Send Message */}
                <div className="space-y-3">
                  <Textarea
                    placeholder="Type your message..."
                    value={negotiationMessage}
                    onChange={(e) => setNegotiationMessage(e.target.value)}
                    rows={3}
                  />
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="priceOffer">Price Offer (Optional)</Label>
                      <Input
                        id="priceOffer"
                        type="number"
                        step="0.01"
                        placeholder={`${request.currency} 0.00`}
                        value={priceOffer}
                        onChange={(e) => setPriceOffer(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="quantityOffer">Quantity Offer (Optional)</Label>
                      <Input
                        id="quantityOffer"
                        type="number"
                        placeholder="Units"
                        value={quantityOffer}
                        onChange={(e) => setQuantityOffer(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <Button
                    onClick={sendNegotiationMessage}
                    disabled={sendingMessage}
                    className="w-full"
                  >
                    {sendingMessage ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send Message
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Shipping Details */}
          {request.shippingDetails && (
            <Card>
              <CardHeader>
                <CardTitle>Shipping Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Tracking Number</Label>
                    <p className="text-sm mt-1 font-mono">{request.shippingDetails.trackingNumber}</p>
                  </div>
                  <div>
                    <Label>Carrier</Label>
                    <p className="text-sm mt-1">{request.shippingDetails.carrier}</p>
                  </div>
                  {request.shippingDetails.shippedAt && (
                    <div>
                      <Label>Shipped Date</Label>
                      <p className="text-sm mt-1">
                        {format(new Date(request.shippingDetails.shippedAt), "PPP")}
                      </p>
                    </div>
                  )}
                  {request.shippingDetails.estimatedDelivery && (
                    <div>
                      <Label>Estimated Delivery</Label>
                      <p className="text-sm mt-1">
                        {format(new Date(request.shippingDetails.estimatedDelivery), "PPP")}
                      </p>
                    </div>
                  )}
                  {request.shippingDetails.deliveredAt && (
                    <div>
                      <Label>Delivered Date</Label>
                      <p className="text-sm mt-1">
                        {format(new Date(request.shippingDetails.deliveredAt), "PPP")}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Sourcing Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Sourcing Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Quantity</span>
                <span className="font-medium">{request.quantity} units</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Target Price</span>
                <span className="font-medium">
                  {request.currency} {request.targetPrice}/unit
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total Target</span>
                <span className="font-medium">
                  {request.currency} {(request.targetPrice * request.quantity).toFixed(2)}
                </span>
              </div>
              
              {request.finalPrice && (
                <>
                  <Separator />
                  <div className="flex justify-between text-green-600">
                    <span className="text-sm">Final Price</span>
                    <span className="font-medium">
                      {request.currency} {request.finalPrice}/unit
                    </span>
                  </div>
                  <div className="flex justify-between text-green-600">
                    <span className="text-sm">Final Total</span>
                    <span className="font-medium">
                      {request.currency} {(request.finalPrice * (request.finalQuantity || request.quantity)).toFixed(2)}
                    </span>
                  </div>
                </>
              )}
              
              <Separator />
              
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Required By</span>
                <span className="font-medium">
                  {format(new Date(request.requiredByDate), "PP")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Created</span>
                <span className="font-medium">
                  {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Provider Information */}
          {request.providerId && (
            <Card>
              <CardHeader>
                <CardTitle>Provider Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Building className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{request.providerId.name}</p>
                    {request.providerId.company && (
                      <p className="text-sm text-muted-foreground">{request.providerId.company}</p>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{request.providerId.email}</span>
                  </div>
                  {request.providerId.phone && (
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span>{request.providerId.phone}</span>
                    </div>
                  )}
                </div>
                
                {request.providerResponse && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Provider Response</p>
                      {request.providerResponse.adjustedPrice && (
                        <div className="flex justify-between text-sm">
                          <span>Offered Price</span>
                          <span className="font-medium">
                            {request.currency} {request.providerResponse.adjustedPrice}
                          </span>
                        </div>
                      )}
                      {request.providerResponse.adjustedQuantity && (
                        <div className="flex justify-between text-sm">
                          <span>Offered Quantity</span>
                          <span className="font-medium">
                            {request.providerResponse.adjustedQuantity} units
                          </span>
                        </div>
                      )}
                      {request.providerResponse.notes && (
                        <p className="text-sm text-muted-foreground mt-2">
                          {request.providerResponse.notes}
                        </p>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Warehouse Information */}
          <Card>
            <CardHeader>
              <CardTitle>Destination Warehouse</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{request.destinationWarehouse.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {request.destinationWarehouse.location}, {request.destinationWarehouse.country}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Information */}
          {request.paymentDetails && (
            <Card>
              <CardHeader>
                <CardTitle>Payment Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Amount</span>
                  <span className="font-medium">
                    {request.currency} {request.paymentDetails.amount}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Method</span>
                  <span className="font-medium capitalize">{request.paymentDetails.method}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Transaction ID</span>
                  <span className="font-mono text-xs">{request.paymentDetails.transactionId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Paid At</span>
                  <span className="font-medium">
                    {format(new Date(request.paymentDetails.paidAt), "PPP")}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}