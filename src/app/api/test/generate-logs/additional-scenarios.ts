// Additional important logging scenarios for e-commerce platform

export const additionalScenarios = {
  // 1. Order Management Logs
  order_status_change: {
    description: "Log when order status changes (pending -> confirmed -> shipped -> delivered)",
    example: {
      orderId: "ORD-123456",
      previousStatus: "PENDING",
      newStatus: "CONFIRMED", 
      changedBy: "admin@example.com",
      reason: "Payment verified"
    }
  },

  order_cancellation: {
    description: "Log order cancellations with reasons",
    example: {
      orderId: "ORD-123456",
      cancelledBy: "customer",
      reason: "Changed mind",
      refundAmount: 150.00
    }
  },

  double_order_detected: {
    description: "Log when duplicate orders are detected",
    example: {
      originalOrderId: "ORD-123456",
      duplicateOrderId: "ORD-123457",
      customerPhone: "+1234567890",
      matchingProducts: ["PROD-001", "PROD-002"]
    }
  },

  // 2. Inventory Management
  low_stock_alert: {
    description: "Log when product stock falls below threshold",
    example: {
      productId: "PROD-001",
      productName: "Wireless Headphones",
      currentStock: 5,
      threshold: 10,
      warehouseId: "WH-001"
    }
  },

  stock_adjustment: {
    description: "Log manual stock adjustments",
    example: {
      productId: "PROD-001",
      previousQuantity: 100,
      newQuantity: 95,
      adjustmentReason: "Damaged goods",
      adjustedBy: "warehouse-manager@example.com"
    }
  },

  // 3. Financial Logs
  payment_received: {
    description: "Log successful payments",
    example: {
      orderId: "ORD-123456",
      amount: 299.99,
      paymentMethod: "credit_card",
      transactionId: "TXN-789012",
      gateway: "Stripe"
    }
  },

  refund_processed: {
    description: "Log refund operations",
    example: {
      orderId: "ORD-123456",
      refundAmount: 150.00,
      refundReason: "Product defective",
      processedBy: "support@example.com"
    }
  },

  suspicious_transaction: {
    description: "Log potentially fraudulent transactions",
    example: {
      orderId: "ORD-123456",
      reasons: ["Multiple failed payments", "Unusual order pattern", "High value order from new customer"],
      riskScore: 85,
      action: "Manual review required"
    }
  },

  // 4. User Activity Logs
  login_attempt: {
    description: "Log all login attempts (success/failure)",
    example: {
      email: "user@example.com",
      success: false,
      reason: "Invalid password",
      ip: "192.168.1.1",
      attemptNumber: 3
    }
  },

  permission_denied: {
    description: "Log unauthorized access attempts",
    example: {
      userId: "USER-123",
      attemptedAction: "DELETE_ORDER",
      resource: "Order/ORD-123456",
      userRole: "SELLER",
      requiredRole: "ADMIN"
    }
  },

  bulk_operation: {
    description: "Log bulk operations (imports, exports, updates)",
    example: {
      operation: "BULK_PRODUCT_IMPORT",
      recordCount: 500,
      successCount: 495,
      failureCount: 5,
      duration: 12500,
      performedBy: "admin@example.com"
    }
  },

  // 5. Integration Logs
  webhook_received: {
    description: "Log incoming webhooks from external services",
    example: {
      source: "Shopify",
      event: "order.created",
      webhookId: "WH-123456",
      processed: true,
      responseTime: 250
    }
  },

  api_rate_limit: {
    description: "Log when API rate limits are hit",
    example: {
      clientId: "CLIENT-123",
      endpoint: "/api/orders",
      requestCount: 100,
      timeWindow: "1 minute",
      blocked: true
    }
  },

  external_api_failure: {
    description: "Log failures when calling external APIs",
    example: {
      service: "ShippingProvider",
      endpoint: "https://api.shipping.com/rates",
      error: "Timeout after 30s",
      retryCount: 3
    }
  },

  // 6. Warehouse Operations
  expedition_created: {
    description: "Log when shipping expeditions are created",
    example: {
      expeditionId: "EXP-123456",
      orderIds: ["ORD-001", "ORD-002"],
      provider: "DHL",
      estimatedCost: 45.00,
      packageCount: 3
    }
  },

  delivery_status_update: {
    description: "Log delivery status changes",
    example: {
      orderId: "ORD-123456",
      trackingNumber: "DHL123456789",
      previousStatus: "In Transit",
      newStatus: "Delivered",
      deliveryTime: "2024-01-15T14:30:00Z",
      signature: "John Doe"
    }
  },

  // 7. Customer Support
  call_center_activity: {
    description: "Log call center interactions",
    example: {
      orderId: "ORD-123456",
      agentId: "AGENT-001",
      callDuration: 180,
      outcome: "Order confirmed",
      customerSatisfaction: 4
    }
  },

  support_ticket: {
    description: "Log support ticket creation and resolution",
    example: {
      ticketId: "TICKET-123",
      customerId: "CUST-456",
      issue: "Missing item in order",
      priority: "HIGH",
      resolutionTime: 3600
    }
  },

  // 8. System Health
  database_slow_query: {
    description: "Log slow database queries",
    example: {
      query: "SELECT * FROM orders WHERE status = 'pending'",
      executionTime: 5234,
      collection: "orders",
      indexesUsed: [],
      documentsExamined: 50000
    }
  },

  memory_usage_high: {
    description: "Log high memory usage",
    example: {
      service: "avolship-backend",
      memoryUsed: 1800,
      memoryLimit: 2048,
      percentage: 87.9,
      action: "Alert sent to DevOps"
    }
  },

  scheduled_job_failure: {
    description: "Log failed scheduled jobs/cron tasks",
    example: {
      jobName: "daily-report-generation",
      scheduledTime: "2024-01-15T02:00:00Z",
      error: "Database connection failed",
      nextRetry: "2024-01-15T02:30:00Z"
    }
  }
};