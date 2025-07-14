"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { 
  AlertCircle, 
  Shield, 
  Database, 
  Zap, 
  AlertTriangle, 
  CreditCard, 
  CheckCircle,
  Bug,
  Activity,
  User,
  Package,
  XCircle,
  Download,
  Upload,
  MessageSquare
} from "lucide-react";

const testScenarios = [
  // Original scenarios
  {
    type: "api_error",
    title: "API Error",
    description: "Simulate a failed API request (500 error)",
    icon: AlertCircle,
    color: "text-red-500",
    category: "errors",
  },
  {
    type: "auth_error",
    title: "Authentication Error",
    description: "Simulate failed authentication attempt",
    icon: Shield,
    color: "text-orange-500",
    category: "errors",
  },
  {
    type: "database_error",
    title: "Database Error",
    description: "Simulate a database query failure",
    icon: Database,
    color: "text-purple-500",
    category: "errors",
  },
  {
    type: "performance_issue",
    title: "Performance Issue",
    description: "Log a slow operation (>5 seconds)",
    icon: Zap,
    color: "text-yellow-500",
    category: "performance",
  },
  {
    type: "critical_operation",
    title: "Critical Operation",
    description: "Log a critical system operation",
    icon: AlertTriangle,
    color: "text-red-600",
    category: "operations",
  },
  {
    type: "security_event",
    title: "Security Event",
    description: "Log a suspicious security pattern",
    icon: Shield,
    color: "text-red-700",
    category: "security",
  },
  {
    type: "validation_error",
    title: "Validation Error",
    description: "Simulate form validation failures",
    icon: CheckCircle,
    color: "text-amber-500",
    category: "errors",
  },
  {
    type: "payment_error",
    title: "Payment Error",
    description: "Simulate payment processing failure",
    icon: CreditCard,
    color: "text-pink-500",
    category: "payments",
  },
  {
    type: "multiple_errors",
    title: "Multiple Errors",
    description: "Generate several different errors at once",
    icon: Bug,
    color: "text-red-500",
    category: "errors",
  },
  {
    type: "user_action",
    title: "User Action",
    description: "Log a normal user action (info level)",
    icon: User,
    color: "text-blue-500",
    category: "activity",
  },
  // New Order Management scenarios
  {
    type: "order_status_change",
    title: "Order Status Change",
    description: "Log order status update (pending → confirmed)",
    icon: Activity,
    color: "text-green-500",
    category: "orders",
  },
  {
    type: "order_cancelled",
    title: "Order Cancellation",
    description: "Log order cancellation with refund",
    icon: XCircle,
    color: "text-red-500",
    category: "orders",
  },
  {
    type: "duplicate_order",
    title: "Duplicate Order Detection",
    description: "Log when duplicate orders are detected",
    icon: AlertTriangle,
    color: "text-orange-500",
    category: "orders",
  },
  // Inventory Management scenarios
  {
    type: "low_stock",
    title: "Low Stock Alert",
    description: "Product stock below threshold warning",
    icon: Package,
    color: "text-yellow-500",
    category: "inventory",
  },
  {
    type: "stock_adjustment",
    title: "Stock Adjustment",
    description: "Manual inventory adjustment log",
    icon: Package,
    color: "text-blue-500",
    category: "inventory",
  },
  {
    type: "out_of_stock",
    title: "Out of Stock",
    description: "Product completely out of stock error",
    icon: Package,
    color: "text-red-500",
    category: "inventory",
  },
  // Payment scenarios
  {
    type: "payment_success",
    title: "Payment Success",
    description: "Successful payment transaction log",
    icon: CreditCard,
    color: "text-green-500",
    category: "payments",
  },
  {
    type: "payment_failed",
    title: "Payment Failed",
    description: "Failed payment with error details",
    icon: CreditCard,
    color: "text-red-500",
    category: "payments",
  },
  {
    type: "refund",
    title: "Refund Processed",
    description: "Customer refund transaction log",
    icon: CreditCard,
    color: "text-orange-500",
    category: "payments",
  },
  {
    type: "suspicious_payment",
    title: "Suspicious Transaction",
    description: "Potential fraud detection alert",
    icon: Shield,
    color: "text-red-700",
    category: "payments",
  },
  // Sourcing scenarios
  {
    type: "sourcing_request_created",
    title: "Sourcing Request Created",
    description: "New sourcing request submitted by seller",
    icon: Package,
    color: "text-blue-500",
    category: "sourcing",
  },
  {
    type: "sourcing_provider_response",
    title: "Provider Response",
    description: "Provider responds with pricing and terms",
    icon: User,
    color: "text-green-500",
    category: "sourcing",
  },
  {
    type: "sourcing_negotiation",
    title: "Negotiation Message",
    description: "Negotiation message with price offer",
    icon: MessageSquare,
    color: "text-blue-500",
    category: "sourcing",
  },
  {
    type: "sourcing_approved",
    title: "Sourcing Approved",
    description: "Provider approves sourcing request",
    icon: CheckCircle,
    color: "text-green-500",
    category: "sourcing",
  },
  {
    type: "sourcing_payment_confirmed",
    title: "Payment Confirmed",
    description: "Provider confirms payment received",
    icon: CreditCard,
    color: "text-indigo-500",
    category: "sourcing",
  },
  {
    type: "sourcing_shipped",
    title: "Sourcing Shipped",
    description: "Provider ships sourcing order",
    icon: Package,
    color: "text-purple-500",
    category: "sourcing",
  },
  {
    type: "sourcing_delivered",
    title: "Sourcing Delivered",
    description: "Sourcing order delivered to warehouse",
    icon: CheckCircle,
    color: "text-green-600",
    category: "sourcing",
  },
  {
    type: "sourcing_cancelled",
    title: "Sourcing Cancelled",
    description: "Sourcing request cancelled by seller",
    icon: XCircle,
    color: "text-red-500",
    category: "sourcing",
  },
  {
    type: "sourcing_error",
    title: "Sourcing Error",
    description: "Error in sourcing process",
    icon: AlertCircle,
    color: "text-red-500",
    category: "sourcing",
  },
  // User Activity scenarios
  {
    type: "login_failed",
    title: "Failed Login",
    description: "Failed login attempt with IP tracking",
    icon: User,
    color: "text-red-500",
    category: "activity",
  },
  {
    type: "permission_denied",
    title: "Permission Denied",
    description: "Unauthorized access attempt",
    icon: Shield,
    color: "text-orange-500",
    category: "activity",
  },
  {
    type: "data_export",
    title: "Data Export",
    description: "User exported large dataset",
    icon: Download,
    color: "text-blue-500",
    category: "activity",
  },
  {
    type: "bulk_import",
    title: "Bulk Import",
    description: "Bulk data import operation log",
    icon: Upload,
    color: "text-green-500",
    category: "activity",
  },
];

export default function TestLogsPage() {
  const [loading, setLoading] = useState<string | null>(null);

  const createDirectLog = async () => {
    setLoading('direct');
    
    try {
      const response = await fetch("/api/test/create-test-log", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Direct test logs created in database!");
      } else {
        toast.error(data.error || "Failed to create direct log");
      }
    } catch (error) {
      console.error("Error creating direct log:", error);
      toast.error("Failed to create direct log");
    } finally {
      setLoading(null);
    }
  };

  const generateTestLog = async (testType: string) => {
    setLoading(testType);
    
    try {
      const response = await fetch("/api/test/generate-logs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ testType }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || `${testType} log generated successfully`);
      } else {
        toast.error(data.error || "Failed to generate test log");
      }
    } catch (error) {
      console.error("Error generating test log:", error);
      toast.error("Failed to generate test log");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Test Logging System</h1>
        <p className="text-muted-foreground">
          Generate different types of logs to test the logging system
        </p>
      </div>

      <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            Test Environment Only
          </CardTitle>
          <CardDescription>
            This page is for testing the logging system. Each action will generate real logs
            that will appear in the system logs page (if you have admin access).
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-600">
            <Database className="h-5 w-5" />
            Direct Database Test
          </CardTitle>
          <CardDescription>
            Create test logs directly in the database to verify the logging system is working
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={createDirectLog}
            disabled={loading === 'direct'}
            className="w-full"
            variant="success"
          >
            {loading === 'direct' ? (
              <>
                <Activity className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Create Direct Test Logs
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Group scenarios by category */}
      {Object.entries(
        testScenarios.reduce((acc, scenario) => {
          if (!acc[scenario.category]) {
            acc[scenario.category] = [];
          }
          acc[scenario.category].push(scenario);
          return acc;
        }, {} as Record<string, typeof testScenarios>)
      ).map(([category, scenarios]) => (
        <div key={category} className="space-y-4">
          <h2 className="text-xl font-semibold capitalize">
            {category.replace('_', ' ')} Scenarios
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {scenarios.map((scenario) => {
              const Icon = scenario.icon;
              
              return (
                <Card key={scenario.type} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Icon className={`h-5 w-5 ${scenario.color}`} />
                      {scenario.title}
                    </CardTitle>
                    <CardDescription>{scenario.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      onClick={() => generateTestLog(scenario.type)}
                      disabled={loading === scenario.type}
                      className="w-full"
                      variant={scenario.type.includes("error") ? "destructive" : "default"}
                    >
                      {loading === scenario.type ? (
                        <>
                          <Activity className="h-4 w-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Bug className="h-4 w-4 mr-2" />
                          Generate {scenario.title}
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ))}

      <Card>
        <CardHeader>
          <CardTitle>How to View Logs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">
            After generating test logs, you can view them in the following ways:
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>
              <strong>Admin Dashboard:</strong> Go to{" "}
              <a href="/dashboard/admin/logs" className="text-primary hover:underline">
                /dashboard/admin/logs
              </a>{" "}
              (requires admin role)
            </li>
            <li>
              <strong>Database:</strong> Check the SystemLog collection in MongoDB
            </li>
            <li>
              <strong>Console:</strong> Some logs may also appear in the server console
            </li>
          </ul>
          <p className="text-sm text-muted-foreground mt-4">
            Note: You need to be logged in as an admin user to view the system logs page.
            The current user ({loading === null ? "loading..." : "tidihatim1@gmail.com"}) needs 
            the ADMIN role to access the logs dashboard.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}