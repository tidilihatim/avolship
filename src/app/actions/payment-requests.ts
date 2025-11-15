'use server';

import { getServerSession } from 'next-auth/next';
import PaymentRequest, { PaymentRequestStatus, PaymentRequestPriority } from '@/lib/db/models/payment-request';
import { getAppSettings } from './app-settings';
import { getActiveWarehouses } from './warehouse';
import mongoose from 'mongoose';
import { authOptions } from '@/config/auth';
import { withDbConnection } from '@/lib/db/db-connect';
import { getLoginUserRole } from './auth';
import { UserRole } from '@/lib/db/models/user';
import { sendNotification, sendNotificationToUserType } from '@/lib/notifications/send-notification';
import { NotificationType } from '@/types/notification';
import { NotificationIcon } from '@/lib/db/models/notification';

interface CreatePaymentRequestData {
  warehouseId: string;
  description: string;
  requestedFromDate: string;
  requestedToDate: string;
  priority?: PaymentRequestPriority;
}

interface GetPaymentRequestsParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  status?: PaymentRequestStatus;
  warehouseId?: string;
  priority?: PaymentRequestPriority;
  search?: string;
}

interface UpdatePaymentRequestStatusData {
  requestId: string;
  status: PaymentRequestStatus;
  reviewNotes?: string;
  scheduledDate?: string;
  rejectionReason?: string;
}

/**
 * Create a new payment request for seller
 */
export const createPaymentRequest = withDbConnection(async (data: CreatePaymentRequestData) => {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { error: 'Unauthorized access' };
    }

    const userRole = await getLoginUserRole();
    if (userRole !== UserRole.SELLER) {
      return { error: 'Only sellers can create payment requests' };
    }

    // Check app settings to see if sellers can request payments
    const appSettingsResult = await getAppSettings();
    if (!appSettingsResult.success || !appSettingsResult.data?.canSellerRequestPayments) {
      return {
        error: 'Payment requests are currently disabled. Please contact support for assistance.',
        disabled: true
      };
    }

    // Validate warehouse access
    const warehousesResult = await getActiveWarehouses();
    if (!warehousesResult.warehouses) {
      return { error: 'No accessible warehouses found' };
    }

    const hasAccess = warehousesResult.warehouses.some(
      (warehouse: any) => warehouse._id.toString() === data.warehouseId
    );

    if (!hasAccess) {
      return { error: 'Access denied to selected warehouse' };
    }

    // Validate date range
    const fromDate = new Date(data.requestedFromDate);
    const toDate = new Date(data.requestedToDate);

    if (toDate <= fromDate) {
      return { error: 'To date must be after from date' };
    }

    // Create payment request
    const paymentRequest = await PaymentRequest.createRequest({
      sellerId: new mongoose.Types.ObjectId(session.user.id),
      warehouseId: new mongoose.Types.ObjectId(data.warehouseId),
      description: data.description,
      requestedFromDate: fromDate,
      requestedToDate: toDate,
      priority: data.priority || PaymentRequestPriority.NORMAL,
      status: PaymentRequestStatus.PENDING,
    });

    // Get warehouse details for notification
    const warehouse = warehousesResult.warehouses.find(
      (w: any) => w._id.toString() === data.warehouseId
    );

    // Send notifications to admins and moderators
    sendNotificationToUserType(UserRole.ADMIN, {
      title: "New Payment Request",
      message: `${session.user.name} has requested a payment from ${warehouse?.name}`,
      type: NotificationType.PAYMENT,
      icon: NotificationIcon.CREDIT_CARD,
      actionLink: `/dashboard/admin/payment-requests/${paymentRequest._id}`,
      metadata: {
        sellerId: session.user.id,
        warehouseId: data.warehouseId,
        currency: warehouse?.currency
      }
    });

    sendNotificationToUserType(UserRole.MODERATOR, {
      title: "New Payment Request",
      message: `${session.user.name} has requested a payment from ${warehouse?.name}`,
      type: NotificationType.PAYMENT,
      icon: NotificationIcon.CREDIT_CARD,
      actionLink: `/dashboard/moderator/payment-requests/${paymentRequest._id}`,
      metadata: {
        sellerId: session.user.id,
        warehouseId: data.warehouseId,
        currency: warehouse?.currency
      }
    });

    return {
      success: true,
      data: JSON.parse(JSON.stringify(paymentRequest)),
      message: 'Payment request created successfully'
    };
  } catch (error: any) {
    return { error: error.message || 'Failed to create payment request' };
  }
});

/**
 * Get seller's payment requests with pagination and filters
 */
export const getSellerPaymentRequests = withDbConnection(async (params: GetPaymentRequestsParams = {}) => {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { error: 'Unauthorized access' };
    }

    const userRole = await getLoginUserRole();
    if (userRole !== UserRole.SELLER) {
      return { error: 'Access denied' };
    }

    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      status,
      warehouseId,
      priority,
      search
    } = params;

    const options = {
      page,
      limit,
      sortBy,
      sortOrder,
      status,
      warehouseId: warehouseId ? new mongoose.Types.ObjectId(warehouseId) : undefined,
      priority,
      search
    };

    const result = await PaymentRequest.getSellerRequestsPaginated(
      new mongoose.Types.ObjectId(session.user.id),
      options
    );

    return {
      success: true,
      data: JSON.parse(JSON.stringify(result.data)),
      pagination: result.pagination
    };
  } catch (error: any) {
    return { error: error.message || 'Failed to fetch payment requests' };
  }
});

/**
 * Get all payment requests with pagination and filters (Admin/Moderator only)
 */
export const getAllPaymentRequests = withDbConnection(async (params: GetPaymentRequestsParams = {}) => {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { error: 'Unauthorized access' };
    }

    const userRole = await getLoginUserRole();
    if (userRole !== UserRole.ADMIN && userRole !== UserRole.MODERATOR) {
      return { error: 'Access denied' };
    }

    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      status,
      warehouseId,
      priority,
      search
    } = params;

    const options = {
      page,
      limit,
      sortBy,
      sortOrder,
      status,
      warehouseId: warehouseId ? new mongoose.Types.ObjectId(warehouseId) : undefined,
      priority,
      search
    };

    const result = await PaymentRequest.getAllRequestsPaginated(options);

    return {
      success: true,
      data: JSON.parse(JSON.stringify(result.data)),
      pagination: result.pagination
    };
  } catch (error: any) {
    return { error: error.message || 'Failed to fetch payment requests' };
  }
});

/**
 * Update payment request status (Admin/Moderator only)
 */
export const updatePaymentRequestStatus = withDbConnection(async (data: UpdatePaymentRequestStatusData) => {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { error: 'Unauthorized access' };
    }

    const userRole = await getLoginUserRole();
    if (userRole !== UserRole.ADMIN && userRole !== UserRole.MODERATOR) {
      return { error: 'Access denied' };
    }

    const scheduledDate = data.scheduledDate ? new Date(data.scheduledDate) : undefined;

    const updatedRequest:any = await PaymentRequest.updateRequestStatus(
      new mongoose.Types.ObjectId(data.requestId),
      data.status,
      new mongoose.Types.ObjectId(session.user.id),
      data.reviewNotes,
      scheduledDate
    );

    if (!updatedRequest) {
      return { error: 'Payment request not found' };
    }

    // If rejected, add rejection reason
    if (data.status === PaymentRequestStatus.REJECTED && data.rejectionReason) {
      updatedRequest.rejectionReason = data.rejectionReason;
      await updatedRequest.save();
    }

    // Send notification to seller about status update
    const statusMessages:any = {
      [PaymentRequestStatus.APPROVED]: `Your payment request has been approved`,
      [PaymentRequestStatus.REJECTED]: `Your payment request has been rejected`,
      [PaymentRequestStatus.SCHEDULED]: `Your payment request has been scheduled`,
      [PaymentRequestStatus.PROCESSED]: `Your payment request has been processed`
    };

    if (statusMessages[data.status]) {
      await sendNotification({
        userId:updatedRequest.sellerId._id.toString(),
        title: "Payment Request Update",
        message: statusMessages[data.status],
        type: NotificationType.INFO,
        icon: NotificationIcon.CREDIT_CARD,
        actionLink:"/dashboard/seller/payment-requests"
      });
    }

    return {
      success: true,
      data: JSON.parse(JSON.stringify(updatedRequest)),
      message: `Payment request ${data.status.toLowerCase()} successfully`
    };
  } catch (error: any) {
    return { error: error.message || 'Failed to update payment request' };
  }
});

/**
 * Cancel payment request (Seller only)
 */
export const cancelPaymentRequest = withDbConnection(async (requestId: string) => {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { error: 'Unauthorized access' };
    }

    const userRole = await getLoginUserRole();
    if (userRole !== UserRole.SELLER) {
      return { error: 'Access denied' };
    }

    // Find the request and verify ownership
    const request: any = await PaymentRequest.findById(requestId);
    if (!request) {
      return { error: 'Payment request not found' };
    }

    if (request.sellerId.toString() !== session.user.id) {
      return { error: 'Access denied' };
    }

    // Can only cancel pending requests
    if (request.status !== PaymentRequestStatus.PENDING) {
      return { error: 'Can only cancel pending requests' };
    }

    request.status = PaymentRequestStatus.CANCELLED;
    await request.save();

    // Populate warehouse details for notification
    await request.populate('warehouseId', 'name country city currency');

    // Send notifications to admins and moderators about cancellation
    sendNotificationToUserType(UserRole.ADMIN, {
      title: "Payment Request Cancelled",
      message: `${session.user.name} has cancelled a payment request from ${request.warehouseId.name}`,
      type: NotificationType.WARNING,
      icon: NotificationIcon.X_CIRCLE,
      actionLink: `/dashboard/admin/payment-requests/${request._id}`,
      metadata: {
        sellerId: session.user.id,
        warehouseId: request.warehouseId._id.toString(),
      }
    });

    sendNotificationToUserType(UserRole.MODERATOR, {
      title: "Payment Request Cancelled",
      message: `${session.user.name} has cancelled a payment request from ${request.warehouseId.name}`,
      type: NotificationType.WARNING,
      icon: NotificationIcon.X_CIRCLE,
      actionLink: `/dashboard/moderator/payment-requests/${request._id}`,
      metadata: {
        sellerId: session.user.id,
        warehouseId: request.warehouseId._id.toString(),
      }
    });

    return {
      success: true,
      message: 'Payment request cancelled successfully'
    };
  } catch (error: any) {
    return { error: error.message || 'Failed to cancel payment request' };
  }
});


/**
 * Get payment request details by ID
 */
export const getPaymentRequestById = withDbConnection(async (requestId: string) => {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { error: 'Unauthorized access' };
    }

    const userRole = await getLoginUserRole();
    const request = await PaymentRequest.findById(requestId)
      .populate('sellerId', 'name email businessName')
      .populate('warehouseId', 'name country city currency')
      .populate('reviewedBy', 'name email');

    if (!request) {
      return { error: 'Payment request not found' };
    }

    // Sellers can only view their own requests
    if (userRole === UserRole.SELLER && request.sellerId._id.toString() !== session.user.id) {
      return { error: 'Access denied' };
    }

    // Only admin and moderator can view all requests
    if (userRole !== UserRole.ADMIN && userRole !== UserRole.MODERATOR && userRole !== UserRole.SELLER) {
      return { error: 'Access denied' };
    }

    return {
      success: true,
      data: JSON.parse(JSON.stringify(request))
    };
  } catch (error: any) {
    return { error: error.message || 'Failed to fetch payment request' };
  }
});