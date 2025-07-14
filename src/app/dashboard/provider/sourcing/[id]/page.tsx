"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Truck,
  Handshake,
  CreditCard,
  Phone,
  Mail
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

export default function ProviderSourcingDetailPage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  const router = useRouter();
  const [request, setRequest] = useState<SourcingRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [negotiationMessage, setNegotiationMessage] = useState("");
  const [priceOffer, setPriceOffer] = useState("");
  const [quantityOffer, setQuantityOffer] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [requestId, setRequestId] = useState<string>('');
  
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
  
  // Payment form state
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    method: "",
    transactionId: "",
  });
  
  // Shipping form state
  const [shippingForm, setShippingForm] = useState({
    trackingNumber: "",
    carrier: "",
    estimatedDelivery: "",
  });

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
        // Initialize forms with current data
        if (data.data.providerResponse) {
          setResponseForm({
            adjustedPrice: data.data.providerResponse.adjustedPrice?.toString() || "",
            adjustedQuantity: data.data.providerResponse.adjustedQuantity?.toString() || "",
            deliveryDate: data.data.providerResponse.deliveryDate || "",
            notes: data.data.providerResponse.notes || "",
          });
        }
        if (data.data.finalPrice) {
          setApprovalForm({
            finalPrice: data.data.finalPrice.toString(),
            finalQuantity: data.data.finalQuantity?.toString() || "",
          });
        }
      } else {
        toast.error(data.error || "Failed to fetch sourcing request");
        router.push("/dashboard/provider/sourcing");
      }
    } catch (error) {
      toast.error("Failed to fetch sourcing request");
      router.push("/dashboard/provider/sourcing");
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async () => {
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
        fetchSourcingRequest();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to send response");
      }
    } catch (error) {
      toast.error("Failed to send response");
    }
  };

  const handleApprove = async () => {
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
        fetchSourcingRequest();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to approve request");
      }
    } catch (error) {
      toast.error("Failed to approve request");
    }
  };

  const handlePayment = async () => {
    try {
      const response = await fetch(`/api/sourcing/${requestId}/payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: parseFloat(paymentForm.amount),
          method: paymentForm.method,
          transactionId: paymentForm.transactionId,
        }),
      });

      if (response.ok) {
        toast.success("Payment marked as received");
        fetchSourcingRequest();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to update payment");
      }
    } catch (error) {
      toast.error("Failed to update payment");
    }
  };

  const handleShipping = async () => {
    try {
      const response = await fetch(`/api/sourcing/${requestId}/shipping`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          trackingNumber: shippingForm.trackingNumber,
          carrier: shippingForm.carrier,
          estimatedDelivery: shippingForm.estimatedDelivery,
        }),
      });

      if (response.ok) {
        toast.success("Shipping information updated");
        fetchSourcingRequest();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to update shipping");
      }
    } catch (error) {
      toast.error("Failed to update shipping");
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

      if (response.ok) {
        toast.success("Message sent successfully");
        setNegotiationMessage("");
        setPriceOffer("");
        setQuantityOffer("");
        fetchSourcingRequest();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to send message");
      }
    } catch (error) {
      toast.error("Failed to send message");
    } finally {
      setSendingMessage(false);
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
  const isMyRequest = request.providerId?._id;

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
              {isMyRequest && (
                <Badge variant="secondary">My Request</Badge>
              )}
            </div>
            <p className="text-muted-foreground">{request.requestNumber}</p>
          </div>
        </div>
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

          {/* Provider Response Form */}
          {request.status === "PENDING" && (
            <Card>
              <CardHeader>
                <CardTitle>Respond to Request</CardTitle>
                <CardDescription>
                  Submit your pricing and terms for this sourcing request
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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
                
                <Button onClick={handleRespond} className="w-full">
                  <Send className="h-4 w-4 mr-2" />
                  Send Response
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Approval Form */}
          {request.status === "NEGOTIATING" && isMyRequest && (
            <Card>
              <CardHeader>
                <CardTitle>Approve Final Terms</CardTitle>
                <CardDescription>
                  Set the final pricing and approve the request
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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
                    Total Value: {request.currency} {(parseFloat(approvalForm.finalPrice || "0") * parseInt(approvalForm.finalQuantity || "0")).toFixed(2)}
                  </p>
                </div>
                
                <Button onClick={handleApprove} className="w-full">
                  <Handshake className="h-4 w-4 mr-2" />
                  Approve Request
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Payment Form */}
          {request.status === "APPROVED" && isMyRequest && (
            <Card>
              <CardHeader>
                <CardTitle>Mark Payment as Received</CardTitle>
                <CardDescription>
                  Confirm payment receipt and provide transaction details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="amount">Amount Received</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      value={paymentForm.amount}
                      onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: e.target.value }))}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="method">Payment Method</Label>
                    <Input
                      id="method"
                      value={paymentForm.method}
                      onChange={(e) => setPaymentForm(prev => ({ ...prev, method: e.target.value }))}
                      placeholder="e.g., Bank Transfer, Credit Card"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="transactionId">Transaction ID</Label>
                  <Input
                    id="transactionId"
                    value={paymentForm.transactionId}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, transactionId: e.target.value }))}
                    placeholder="Transaction reference number"
                  />
                </div>
                
                <Button onClick={handlePayment} className="w-full">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Confirm Payment Received
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Shipping Form */}
          {request.status === "PAID" && isMyRequest && (
            <Card>
              <CardHeader>
                <CardTitle>Ship the Order</CardTitle>
                <CardDescription>
                  Provide shipping details and tracking information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="trackingNumber">Tracking Number</Label>
                    <Input
                      id="trackingNumber"
                      value={shippingForm.trackingNumber}
                      onChange={(e) => setShippingForm(prev => ({ ...prev, trackingNumber: e.target.value }))}
                      placeholder="Tracking number"
                    />
                  </div>
                  <div>
                    <Label htmlFor="carrier">Carrier</Label>
                    <Input
                      id="carrier"
                      value={shippingForm.carrier}
                      onChange={(e) => setShippingForm(prev => ({ ...prev, carrier: e.target.value }))}
                      placeholder="e.g., DHL, FedEx, UPS"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="estimatedDelivery">Estimated Delivery Date</Label>
                  <Input
                    id="estimatedDelivery"
                    type="date"
                    value={shippingForm.estimatedDelivery}
                    onChange={(e) => setShippingForm(prev => ({ ...prev, estimatedDelivery: e.target.value }))}
                  />
                </div>
                
                <Button onClick={handleShipping} className="w-full">
                  <Truck className="h-4 w-4 mr-2" />
                  Ship Order
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Negotiation */}
          {request.status === "NEGOTIATING" && (
            <Card>
              <CardHeader>
                <CardTitle>Negotiation</CardTitle>
                <CardDescription>
                  Communicate with the seller about pricing and terms
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
                          msg.senderRole === "PROVIDER" ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg p-3 ${
                            msg.senderRole === "PROVIDER"
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

          {/* Seller Information */}
          <Card>
            <CardHeader>
              <CardTitle>Seller Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Building className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{request.sellerId.name}</p>
                  <p className="text-sm text-muted-foreground">{request.sellerId.email}</p>
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{request.sellerId.email}</span>
                </div>
                {request.sellerId.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{request.sellerId.phone}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

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

          {/* Your Response */}
          {request.providerResponse && (
            <Card>
              <CardHeader>
                <CardTitle>Your Response</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {request.providerResponse.adjustedPrice && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Your Price</span>
                    <span className="font-medium">
                      {request.currency} {request.providerResponse.adjustedPrice}/unit
                    </span>
                  </div>
                )}
                {request.providerResponse.adjustedQuantity && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Your Quantity</span>
                    <span className="font-medium">
                      {request.providerResponse.adjustedQuantity} units
                    </span>
                  </div>
                )}
                {request.providerResponse.deliveryDate && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Delivery Date</span>
                    <span className="font-medium">
                      {format(new Date(request.providerResponse.deliveryDate), "PP")}
                    </span>
                  </div>
                )}
                {request.providerResponse.notes && (
                  <div>
                    <span className="text-sm text-muted-foreground">Notes</span>
                    <p className="text-sm mt-1">{request.providerResponse.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

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

          {/* Shipping Information */}
          {request.shippingDetails && (
            <Card>
              <CardHeader>
                <CardTitle>Shipping Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Tracking Number</span>
                  <span className="font-mono text-xs">{request.shippingDetails.trackingNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Carrier</span>
                  <span className="font-medium">{request.shippingDetails.carrier}</span>
                </div>
                {request.shippingDetails.shippedAt && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Shipped Date</span>
                    <span className="font-medium">
                      {format(new Date(request.shippingDetails.shippedAt), "PP")}
                    </span>
                  </div>
                )}
                {request.shippingDetails.estimatedDelivery && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Estimated Delivery</span>
                    <span className="font-medium">
                      {format(new Date(request.shippingDetails.estimatedDelivery), "PP")}
                    </span>
                  </div>
                )}
                {request.shippingDetails.deliveredAt && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Delivered</span>
                    <span className="font-medium">
                      {format(new Date(request.shippingDetails.deliveredAt), "PP")}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}