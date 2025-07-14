import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/config/auth';
import { connectToDatabase } from '@/lib/db/mongoose';
import { logger, LogCategory, LogLevel } from '@/lib/logging/logger';
import User from '@/lib/db/models/user';
import { useOrderLogging } from '@/lib/logging/hooks/useOrderLogging';
import { useInventoryLogging } from '@/lib/logging/hooks/useInventoryLogging';
import { usePaymentLogging } from '@/lib/logging/hooks/usePaymentLogging';
import { useActivityLogging } from '@/lib/logging/hooks/useActivityLogging';
import { useSourcingLogging } from '@/lib/logging/hooks/useSourcingLogging';

export async function POST(req: NextRequest) {
  // Initialize logging hooks
  const orderLogging = useOrderLogging();
  const inventoryLogging = useInventoryLogging();
  const paymentLogging = usePaymentLogging();
  const activityLogging = useActivityLogging();
  const sourcingLogging = useSourcingLogging();

  try {
    // Get current session
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Get test type from request
    const { testType } = await req.json();

    const userInfo = {
      id: session.user.id,
      role: session.user.role,
      email: session.user.email,
    };

    switch (testType) {
      case 'api_error':
        // Generate an API error
        await logger.logApiError(
          new Error('Test API Error: Failed to process payment'),
          {
            url: '/api/test/payment',
            method: 'POST',
            headers: req.headers,
            ip: req.headers.get('x-forwarded-for') || '127.0.0.1',
          },
          userInfo,
          500
        );
        break;

      case 'auth_error':
        // Generate an auth error
        await logger.error('Authentication failed: Invalid credentials', 
          new Error('Invalid password for user'), 
          {
            category: LogCategory.AUTH_ERROR,
            userId: session.user.id,
            userEmail: session.user.email,
            metadata: {
              attemptedEmail: session.user.email,
              ip: req.headers.get('x-forwarded-for') || '127.0.0.1',
            }
          }
        );
        break;

      case 'database_error':
        // Generate a database error
        try {
          // This will fail and generate a real database error
          await User.findOne({ _id: 'invalid-object-id' });
        } catch (dbError) {
          await logger.logDatabaseError(
            dbError as Error,
            'User.findOne',
            { _id: 'invalid-object-id' }
          );
        }
        break;

      case 'performance_issue':
        // Generate a performance issue log
        await logger.logPerformanceIssue(
          'GET /api/orders - Slow query detected',
          5234, // 5.2 seconds
          1000, // 1 second threshold
          {
            query: 'Order.find().populate("items").limit(1000)',
            resultCount: 1000,
            userId: session.user.id,
          }
        );
        break;

      case 'critical_operation':
        // Log a critical operation
        await logger.logCriticalOperation(
          'DELETE_ALL_ORDERS',
          userInfo,
          'Order',
          'bulk-delete-123',
          {
            deletedCount: 42,
            reason: 'Test cleanup operation',
          }
        );
        break;

      case 'security_event':
        // Log a security event
        await logger.logSecurityEvent(
          'SUSPICIOUS_LOGIN_PATTERN',
          userInfo,
          {
            attemptCount: 10,
            timeWindow: '5 minutes',
            ips: ['192.168.1.1', '10.0.0.1', '172.16.0.1'],
            userAgent: req.headers.get('user-agent'),
          }
        );
        break;

      case 'validation_error':
        // Generate validation error
        await logger.warn('Validation failed: Invalid order data', {
          category: LogCategory.VALIDATION_ERROR,
          userId: session.user.id,
          metadata: {
            errors: [
              { field: 'customerName', message: 'Required field missing' },
              { field: 'phoneNumber', message: 'Invalid format' },
              { field: 'totalAmount', message: 'Must be greater than 0' },
            ],
            endpoint: '/api/orders',
          }
        });
        break;

      case 'payment_error':
        // Generate payment error
        await logger.error('Payment processing failed', 
          new Error('Insufficient funds'), 
          {
            category: LogCategory.PAYMENT_ERROR,
            userId: session.user.id,
            metadata: {
              orderId: 'ORD-123456',
              amount: 150.00,
              currency: 'USD',
              paymentMethod: 'credit_card',
              errorCode: 'INSUFFICIENT_FUNDS',
            }
          }
        );
        break;

      case 'multiple_errors':
        // Generate multiple different errors
        const errors = [
          { type: 'api', message: 'API timeout on external service' },
          { type: 'db', message: 'Connection pool exhausted' },
          { type: 'auth', message: 'Token expired during request' },
          { type: 'validation', message: 'Invalid data format' },
        ];

        for (const error of errors) {
          await logger.error(`Test Error: ${error.message}`, 
            new Error(error.message), 
            {
              category: LogCategory.SYSTEM_ERROR,
              userId: session.user.id,
              metadata: { errorType: error.type }
            }
          );
        }
        break;

      case 'user_action':
        // Log a user action
        await logger.info('User exported order data', {
          category: LogCategory.USER_ACTION,
          userId: session.user.id,
          userRole: session.user.role,
          action: 'EXPORT_ORDERS',
          metadata: {
            format: 'CSV',
            recordCount: 250,
            dateRange: '2024-01-01 to 2024-12-31',
          }
        });
        break;

      // New Order Management Scenarios
      case 'order_status_change':
        await orderLogging.logOrderStatusChange(
          'ORD-TEST-001',
          'PENDING',
          'CONFIRMED',
          userInfo,
          'Payment verified by system'
        );
        break;

      case 'order_cancelled':
        await orderLogging.logOrderCancellation(
          'ORD-TEST-002',
          userInfo,
          'Customer requested cancellation',
          150.00
        );
        break;

      case 'duplicate_order':
        await orderLogging.logDoubleOrderDetected(
          'ORD-ORIG-001',
          'ORD-DUP-001',
          '+1234567890',
          ['PROD-001', 'PROD-002', 'PROD-003']
        );
        break;

      // Inventory Management Scenarios
      case 'low_stock':
        await inventoryLogging.logLowStockAlert(
          'PROD-TEST-001',
          'Wireless Headphones Pro',
          5,
          10,
          'WH-CASA-001'
        );
        break;

      case 'stock_adjustment':
        await inventoryLogging.logStockAdjustment(
          'PROD-TEST-002',
          'Gaming Mouse RGB',
          100,
          85,
          'Damaged items removed from inventory',
          userInfo
        );
        break;

      case 'out_of_stock':
        await inventoryLogging.logOutOfStock(
          'PROD-TEST-003',
          'USB-C Cable 2m',
          'WH-RABAT-001',
          25
        );
        break;

      // Payment Scenarios
      case 'payment_success':
        await paymentLogging.logPaymentReceived(
          'ORD-PAY-001',
          299.99,
          'USD',
          'credit_card',
          'TXN-CC-123456',
          'Stripe',
          'CUST-001'
        );
        break;

      case 'payment_failed':
        await paymentLogging.logPaymentFailed(
          'ORD-PAY-002',
          199.99,
          'USD',
          'credit_card',
          'Card declined - Insufficient funds',
          'insufficient_funds',
          'CUST-002'
        );
        break;

      case 'refund':
        await paymentLogging.logRefundProcessed(
          'ORD-REF-001',
          75.00,
          'USD',
          'Product defective - customer complaint',
          userInfo,
          'REF-123456'
        );
        break;

      case 'suspicious_payment':
        await paymentLogging.logSuspiciousTransaction(
          'ORD-SUS-001',
          [
            'Multiple failed payment attempts',
            'Unusual high value for new customer',
            'Different billing and shipping countries'
          ],
          85,
          'Manual review required',
          {
            id: 'CUST-SUS-001',
            email: 'suspicious@example.com',
            ip: '192.168.1.100'
          }
        );
        break;

      // User Activity Scenarios
      case 'login_failed':
        await activityLogging.logLoginAttempt(
          'test@example.com',
          false,
          req.headers.get('x-forwarded-for') || '127.0.0.1',
          req.headers.get('user-agent') || 'Unknown',
          'Invalid password - attempt 3 of 5'
        );
        break;

      case 'permission_denied':
        await activityLogging.logPermissionDenied(
          userInfo,
          'DELETE_ALL_ORDERS',
          'Order/bulk-delete',
          'ADMIN'
        );
        break;

      case 'data_export':
        await activityLogging.logDataExport(
          userInfo,
          'orders',
          1250,
          'CSV',
          { 
            dateRange: 'last_30_days',
            status: 'completed',
            warehouse: 'all'
          }
        );
        break;

      case 'bulk_import':
        await activityLogging.logBulkImport(
          userInfo,
          'products',
          {
            total: 500,
            success: 495,
            failed: 5,
            duration: 12500
          },
          'products_import_2024.csv'
        );
        break;

      // Sourcing Scenarios
      case 'sourcing_request_created':
        await sourcingLogging.logSourcingRequestCreated(
          'SRC-TEST-001',
          'SRC-2024-000001',
          userInfo,
          'Premium Bluetooth Headphones',
          50,
          75.00,
          'USD'
        );
        break;

      case 'sourcing_provider_response':
        await sourcingLogging.logProviderResponse(
          'SRC-TEST-002',
          'SRC-2024-000002',
          {
            id: 'provider-123',
            name: 'TechSupply Co.',
            email: 'supplier@techsupply.com'
          },
          68.50,
          45
        );
        break;

      case 'sourcing_negotiation':
        await sourcingLogging.logNegotiationMessage(
          'SRC-TEST-003',
          'SRC-2024-000003',
          userInfo,
          'Can you provide bulk pricing for 100+ units?',
          65.00,
          100
        );
        break;

      case 'sourcing_approved':
        await sourcingLogging.logSourcingApproved(
          'SRC-TEST-004',
          'SRC-2024-000004',
          {
            id: 'provider-456',
            name: 'ElectroHub Ltd.',
            email: 'sales@electrohub.com'
          },
          72.00,
          50,
          'USD'
        );
        break;

      case 'sourcing_payment_confirmed':
        await sourcingLogging.logPaymentConfirmed(
          'SRC-TEST-005',
          'SRC-2024-000005',
          {
            id: 'provider-789',
            name: 'ComponentSource Inc.',
            email: 'billing@componentsource.com'
          },
          3600.00,
          'bank_transfer',
          'TXN-SRC-123456'
        );
        break;

      case 'sourcing_shipped':
        await sourcingLogging.logShipmentCreated(
          'SRC-TEST-006',
          'SRC-2024-000006',
          {
            id: 'provider-101',
            name: 'FastShip Suppliers',
            email: 'logistics@fastship.com'
          },
          'FS123456789',
          'DHL Express',
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
        );
        break;

      case 'sourcing_delivered':
        await sourcingLogging.logSourcingDelivered(
          'SRC-TEST-007',
          'SRC-2024-000007',
          userInfo,
          new Date()
        );
        break;

      case 'sourcing_cancelled':
        await sourcingLogging.logSourcingCancelled(
          'SRC-TEST-008',
          'SRC-2024-000008',
          userInfo,
          'Product no longer needed - inventory overstocked'
        );
        break;

      case 'sourcing_error':
        await sourcingLogging.logSourcingError(
          'SRC-TEST-009',
          'SRC-2024-000009',
          new Error('Provider communication timeout'),
          'provider_response',
          userInfo
        );
        break;

      default:
        // Generate a generic error
        throw new Error('Unknown test type - This is an intentional test error!');
    }

    // Force flush logs immediately for testing
    await logger.forceFlush();

    return NextResponse.json({
      success: true,
      message: `Test ${testType} log generated successfully`,
      user: session.user.email,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    // This error will also be logged
    console.error('Test endpoint error:', error);
    
    return NextResponse.json(
      { 
        error: 'Test error generated', 
        message: error.message,
        type: 'intentional_test_error' 
      },
      { status: 500 }
    );
  }
}