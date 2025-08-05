'use client';

import { useTranslations } from 'next-intl';
import { 
  Truck,
  MapPin,
  Clock,
  DollarSign,
  Star,
  Image,
  Edit,
  CheckCircle,
  Package,
  Navigation,
  Timer,
  User
} from 'lucide-react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { UserRole } from '@/lib/db/models/user';
import { getAccessToken } from '@/app/actions/cookie';
import { toast } from 'sonner';

interface DeliveryTrackingCardProps {
  order: any;
  formatDate: (date: Date | string) => string;
  formatPrice: (price: number) => string;
  userRole?: string;
}

export default function DeliveryTrackingCard({ 
  order, 
  formatDate, 
  formatPrice,
  userRole 
}: DeliveryTrackingCardProps) {
  const t = useTranslations('orders');

  if (!order.deliveryTracking) {
    return null;
  }

  const { deliveryTracking } = order;
  const isAdminOrModerator = userRole === UserRole.ADMIN || userRole === UserRole.MODERATOR;
  const isCallCenter = userRole === UserRole.CALL_CENTER;
  const canViewFinancials = isAdminOrModerator || isCallCenter;

  // Function to view delivery proof
  const handleViewDeliveryProof = async () => {
    try {
      const accessToken = await getAccessToken();
      if (!accessToken) {
        toast.error("Authentication required");
        return;
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/orders/delivery-proof-url/${order._id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (response.ok && result.success) {
        window.open(result.data.signedUrl, '_blank');
      } else {
        toast.error(result.message || "Failed to get delivery proof image");
      }
    } catch (error) {
      console.error("Error fetching delivery proof:", error);
      toast.error("Failed to load delivery proof image");
    }
  };

  // Get delivery status badge based on tracking info
  const getDeliveryStatus = () => {
    if (deliveryTracking.actualDeliveryTime) {
      return { label: 'Delivered', className: 'bg-green-100 text-green-800', icon: CheckCircle };
    } else if (deliveryTracking.pickedUpAt) {
      return { label: 'In Transit', className: 'bg-blue-100 text-blue-800', icon: Navigation };
    } else if (deliveryTracking.acceptedAt) {
      return { label: 'Accepted', className: 'bg-cyan-100 text-cyan-800', icon: CheckCircle };
    } else {
      return { label: 'Assigned', className: 'bg-indigo-100 text-indigo-800', icon: Package };
    }
  };

  const status = getDeliveryStatus();
  const StatusIcon = status.icon;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Truck className="h-5 w-5 text-blue-600" />
          Delivery Tracking
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status and Tracking Number */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <StatusIcon className="h-4 w-4" />
            <Badge className={status.className}>
              {status.label}
            </Badge>
          </div>
          <Badge variant="outline" className="font-mono">
            {deliveryTracking.trackingNumber}
          </Badge>
        </div>

        {/* Delivery Timeline */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Clock className="h-4 w-4" />
            Delivery Timeline
          </div>
          
          <div className="space-y-3 ml-6">
            {/* Assigned */}
            {deliveryTracking.assignedAt && (
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-indigo-500 rounded-full" />
                <div className="flex-1 flex justify-between">
                  <span className="text-sm text-muted-foreground">Assigned to delivery rider</span>
                  <span className="text-sm font-medium">{formatDate(deliveryTracking.assignedAt)}</span>
                </div>
              </div>
            )}

            {/* Accepted */}
            {deliveryTracking.acceptedAt && (
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-cyan-500 rounded-full" />
                <div className="flex-1 flex justify-between">
                  <span className="text-sm text-muted-foreground">Accepted by rider</span>
                  <span className="text-sm font-medium">{formatDate(deliveryTracking.acceptedAt)}</span>
                </div>
              </div>
            )}

            {/* Picked Up */}
            {deliveryTracking.pickedUpAt && (
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                <div className="flex-1 flex justify-between">
                  <span className="text-sm text-muted-foreground">Package picked up</span>
                  <span className="text-sm font-medium">{formatDate(deliveryTracking.pickedUpAt)}</span>
                </div>
              </div>
            )}

            {/* Estimated Delivery */}
            {deliveryTracking.estimatedDeliveryTime && !deliveryTracking.actualDeliveryTime && (
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                <div className="flex-1 flex justify-between">
                  <span className="text-sm text-muted-foreground">Estimated delivery</span>
                  <span className="text-sm font-medium">{formatDate(deliveryTracking.estimatedDeliveryTime)}</span>
                </div>
              </div>
            )}

            {/* Delivered */}
            {deliveryTracking.actualDeliveryTime && (
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <div className="flex-1 flex justify-between">
                  <span className="text-sm text-muted-foreground">Delivered</span>
                  <span className="text-sm font-medium text-green-600">{formatDate(deliveryTracking.actualDeliveryTime)}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Distance and Location */}
        {deliveryTracking.distance && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <MapPin className="h-4 w-4" />
              Distance & Location
            </div>
            <div className="ml-6 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total distance:</span>
                <span className="font-medium">{deliveryTracking.distance} km</span>
              </div>
              {deliveryTracking.currentLocation && (
                <div className="text-xs text-muted-foreground">
                  Current: {deliveryTracking.currentLocation.latitude.toFixed(4)}, {deliveryTracking.currentLocation.longitude.toFixed(4)}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Financial Information - Only for Admin/Moderator/Call Center */}
        {canViewFinancials && (
          <div className="space-y-2 border-t pt-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              Financial Details
            </div>
            <div className="ml-6 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Delivery fee:</span>
                <span className="font-medium">{formatPrice(deliveryTracking.deliveryFee)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Rider commission:</span>
                <span className="font-medium text-green-600">{formatPrice(deliveryTracking.commission)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Customer Rating */}
        {deliveryTracking.customerRating && (
          <div className="space-y-2 border-t pt-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Star className="h-4 w-4" />
              Customer Rating
            </div>
            <div className="ml-6">
              <div className="flex items-center gap-2">
                <div className="flex items-center">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < deliveryTracking.customerRating
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm font-medium">
                  {deliveryTracking.customerRating}/5
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Delivery Proof */}
        {deliveryTracking.deliveryProof && (
          <div className="space-y-2 border-t pt-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Image className="h-4 w-4" />
              Delivery Proof
            </div>
            <div className="ml-6 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Type:</span>
                <Badge variant="outline" className="text-xs">
                  {deliveryTracking.deliveryProof.type}
                </Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Uploaded:</span>
                <span className="font-medium">{formatDate(deliveryTracking.deliveryProof.uploadedAt)}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-2"
                onClick={handleViewDeliveryProof}
              >
                <Image className="h-4 w-4 mr-2" />
                View Proof
              </Button>
            </div>
          </div>
        )}

        {/* Delivery Notes */}
        {deliveryTracking.deliveryNotes && (
          <div className="space-y-2 border-t pt-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Edit className="h-4 w-4" />
              Delivery Notes
            </div>
            <div className="ml-6">
              <div className="bg-muted/50 p-3 rounded-md border">
                <p className="text-sm leading-relaxed">
                  {deliveryTracking.deliveryNotes}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Delivery Rider Info */}
        {order.assignedRider && (
          <div className="space-y-2 border-t pt-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <User className="h-4 w-4" />
              Delivery Rider
            </div>
            <div className="ml-6 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Name:</span>
                <span className="font-medium">{order.assignedRider.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Email:</span>
                <span className="font-medium">{order.assignedRider.email}</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}