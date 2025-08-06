import { notFound } from 'next/navigation';
import { getOrderById } from '@/app/actions/order';
import { getUserById } from '@/app/actions/user';
import { getAppSettings } from '@/app/actions/app-settings';
import { getLoginUserRole } from '@/app/actions/auth';
import { UserRole } from '@/lib/db/models/user';
import OrderTrackingClient from '@/app/dashboard/seller/orders/[id]/track/_components/order-tracking-client';

interface TrackOrderPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function TrackOrderPage({ params }: TrackOrderPageProps) {
  // Await params before using
  const { id } = await params;
  
  // Check user permissions
  const userRole = await getLoginUserRole();
  if (!userRole) {
    return notFound();
  }

  // Get app settings to check if tracking is allowed
  const settingsResult = await getAppSettings();
  if (!settingsResult.success) {
    return notFound();
  }

  const trackingSettings = settingsResult.data.showLocationTracking;
  
  // Check if current user role has tracking permission
  const isTrackingAllowed = () => {
    switch (userRole) {
      case UserRole.SELLER:
        return trackingSettings.seller;
      case UserRole.CALL_CENTER:
        return trackingSettings.call_center;
      case UserRole.ADMIN:
      case UserRole.MODERATOR:
        return true;
      default:
        return false;
    }
  };

  if (!isTrackingAllowed()) {
    return notFound();
  }

  // Get the specific order
  const orderResult = await getOrderById(id);
  if (!orderResult.success || !orderResult.order) {
    return notFound();
  }

  const order = orderResult.order;

  // Check if order has an assigned rider
  if (!order?.deliveryTracking?.deliveryGuyId) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">No Rider Assigned</h2>
          <p className="text-muted-foreground">This order has not been assigned to a delivery rider yet.</p>
        </div>
      </div>
    );
  }

  // Get rider details
  const riderResult = await getUserById(order.deliveryTracking.deliveryGuyId);
  if (!riderResult.success || !riderResult.user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Rider Not Found</h2>
          <p className="text-muted-foreground">The assigned delivery rider could not be found.</p>
        </div>
      </div>
    );
  }

  const rider = riderResult.user;

  // Transform order to match the expected format
  const transformedOrder = {
    _id: order._id,
    orderId: order.orderId,
    customer: {
      name: order.customer.name,
      address: order.customer.shippingAddress,
      coordinates: order.customer.location ? {
        latitude: order.customer.location.latitude,
        longitude: order.customer.location.longitude
      } : undefined
    },
    status: order.status,
    totalAmount: order.totalPrice
  };

  // Transform rider data
  const riderData = {
    id: order.deliveryTracking.deliveryGuyId,
    name: rider.name,
    email: rider.email,
    currentLocation: rider?.currentLocation || undefined,
    isOnline: true, // Assume online if we have location data
    isAvailableForDelivery: order.status !== 'delivered'
  };

  return (
    <OrderTrackingClient 
      initialOrder={transformedOrder}
      rider={riderData}
    />
  );
}