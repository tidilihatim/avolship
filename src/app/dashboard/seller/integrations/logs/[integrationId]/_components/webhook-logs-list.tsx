'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  User,
  Package,
  DollarSign,
  Timer,
  Globe,
  Hash,
  Calendar
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface WebhookLogsListProps {
  logs: any[];
  loading?: boolean;
}

export function WebhookLogsList({ logs, loading }: WebhookLogsListProps) {
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());

  const toggleLogExpansion = (logId: string) => {
    const newExpanded = new Set(expandedLogs);
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId);
    } else {
      newExpanded.add(logId);
    }
    setExpandedLogs(newExpanded);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />;
      case 'failed':
      case 'order_creation_failed':
      case 'signature_invalid':
      case 'integration_not_found':
      case 'product_not_found':
      case 'expedition_not_found':
        return <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />;
      case 'processing':
        return <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />;
      case 'integration_paused':
        return <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'success':
        return 'default';
      case 'failed':
      case 'order_creation_failed':
      case 'signature_invalid':
      case 'integration_not_found':
      case 'product_not_found':
      case 'expedition_not_found':
        return 'destructive';
      case 'processing':
      case 'integration_paused':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const formatStatus = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="border rounded-lg p-4 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="h-4 w-4 bg-muted rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-1/4" />
                <div className="h-3 bg-muted rounded w-3/4" />
              </div>
              <div className="h-6 bg-muted rounded w-16" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No webhook logs found</h3>
          <p className="text-muted-foreground">
            No webhook logs match your current filters. Try adjusting your search criteria.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {logs.map((log) => {
        const isExpanded = expandedLogs.has(log._id);
        
        return (
          <div 
            key={log._id} 
            className={cn(
              "border rounded-lg transition-all duration-200",
              "hover:shadow-sm"
            )}
          >
            {/* Log Header */}
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => toggleLogExpansion(log._id)}
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>

                  {getStatusIcon(log.status)}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                        {log.webhookId || log._id.slice(-8)}
                      </code>
                      <Badge 
                        variant={getStatusVariant(log.status)} 
                        className={cn(
                          "text-xs",
                          log.status === 'success' && "bg-green-500/10 text-green-700 border-green-500/20 hover:bg-green-500/20 dark:text-green-400"
                        )}
                      >
                        {formatStatus(log.status)}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {log.platform.toUpperCase()}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDistanceToNow(new Date(log.startedAt), { addSuffix: true })}</span>
                      </div>
                      
                      {log.orderData?.customerName && (
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span className="truncate max-w-32">{log.orderData.customerName}</span>
                        </div>
                      )}
                      
                      {log.orderData?.externalOrderId && (
                        <div className="flex items-center gap-1">
                          <Hash className="h-3 w-3" />
                          <span>#{log.orderData.externalOrderId}</span>
                        </div>
                      )}
                      
                      {log.processingTime && (
                        <div className="flex items-center gap-1">
                          <Timer className="h-3 w-3" />
                          <span>{log.processingTime}ms</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {log.orderData?.totalAmount && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <DollarSign className="h-3 w-3" />
                      <span>{log.orderData.totalAmount} {log.orderData.currency || 'MAD'}</span>
                    </div>
                  )}
                </div>
              </div>
              
              {log.errorMessage && (
                <div className="mt-3 p-3 bg-destructive/10 border border-destructive/20 rounded-md text-sm">
                  <div className="font-medium text-destructive mb-1">Error</div>
                  <div className="text-destructive/80 break-words font-mono text-xs">
                    {log.errorMessage}
                  </div>
                </div>
              )}
            </div>

            {/* Expanded Content */}
            {isExpanded && (
              <>
                <Separator />
                <div className="p-4 bg-muted/30 space-y-6">
                  {/* Order Details */}
                  {log.orderData && (
                    <div>
                      <h4 className="font-medium mb-3 flex items-center gap-2 text-sm">
                        <Package className="h-4 w-4" />
                        Order Information
                      </h4>
                      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                        {log.orderData.externalOrderId && (
                          <div className="text-sm">
                            <div className="text-muted-foreground mb-1">External Order ID</div>
                            <code className="text-xs bg-background px-2 py-1 rounded border">
                              {log.orderData.externalOrderId}
                            </code>
                          </div>
                        )}
                        {log.orderData.internalOrderId && (
                          <div className="text-sm">
                            <div className="text-muted-foreground mb-1">Internal Order ID</div>
                            <code className="text-xs bg-background px-2 py-1 rounded border">
                              {log.orderData.internalOrderId}
                            </code>
                          </div>
                        )}
                        {log.orderData.customerName && (
                          <div className="text-sm">
                            <div className="text-muted-foreground mb-1">Customer</div>
                            <div>{log.orderData.customerName}</div>
                          </div>
                        )}
                        {log.orderData.totalAmount && (
                          <div className="text-sm">
                            <div className="text-muted-foreground mb-1">Amount</div>
                            <div>{log.orderData.totalAmount} {log.orderData.currency || 'MAD'}</div>
                          </div>
                        )}
                        {log.orderData.productsCount && (
                          <div className="text-sm">
                            <div className="text-muted-foreground mb-1">Products</div>
                            <div>{log.orderData.productsCount} items</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Processing Steps */}
                  {log.steps && log.steps.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-3 flex items-center gap-2 text-sm">
                        <Timer className="h-4 w-4" />
                        Processing Timeline
                      </h4>
                      <div className="space-y-2">
                        {log.steps.map((step: any, index: number) => (
                          <div key={index} className="flex items-start gap-3 p-3 bg-background rounded-md border">
                            <div className="mt-0.5">
                              {step.status === 'success' && <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />}
                              {step.status === 'failed' && <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />}
                              {step.status === 'skipped' && <AlertTriangle className="h-4 w-4 text-muted-foreground" />}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm">{step.step}</div>
                              {step.details && (
                                <div className="text-xs text-muted-foreground mt-1">{step.details}</div>
                              )}
                            </div>
                            
                            <div className="text-xs text-muted-foreground">
                              {step.duration}ms
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Technical Details */}
                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2 text-sm">
                      <Globe className="h-4 w-4" />
                      Technical Details
                    </h4>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-3">
                        <div>
                          <div className="text-muted-foreground text-xs mb-1">Request URL</div>
                          <code className="text-xs bg-background p-2 rounded border block break-all">
                            {log.requestUrl}
                          </code>
                        </div>
                        
                        <div className="flex gap-4">
                          <div>
                            <div className="text-muted-foreground text-xs mb-1">Response Status</div>
                            <Badge variant="outline" className="text-xs">
                              {log.responseStatus}
                            </Badge>
                          </div>
                          
                          <div>
                            <div className="text-muted-foreground text-xs mb-1">Processing Time</div>
                            <Badge variant="secondary" className="text-xs">
                              {log.processingTime}ms
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div>
                          <div className="text-muted-foreground text-xs mb-1">Started At</div>
                          <div className="text-sm font-mono">
                            {format(new Date(log.startedAt), 'PPpp')}
                          </div>
                        </div>
                        
                        {log.completedAt && (
                          <div>
                            <div className="text-muted-foreground text-xs mb-1">Completed At</div>
                            <div className="text-sm font-mono">
                              {format(new Date(log.completedAt), 'PPpp')}
                            </div>
                          </div>
                        )}
                        
                        {log.signatureValidation && (
                          <div>
                            <div className="text-muted-foreground text-xs mb-1">Signature Validation</div>
                            <Badge 
                              variant={log.signatureValidation.isValid ? "default" : "destructive"}
                              className="text-xs"
                            >
                              {log.signatureValidation.isValid ? 'Valid' : 'Invalid'}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}