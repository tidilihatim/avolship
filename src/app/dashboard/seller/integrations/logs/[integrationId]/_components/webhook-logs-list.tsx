'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle, 
  ExternalLink,
  User,
  Package,
  DollarSign,
  Timer
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface WebhookLogsListProps {
  logs: any[];
  loading?: boolean;
}

export function WebhookLogsList({ logs, loading }: WebhookLogsListProps) {

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
      case 'order_creation_failed':
      case 'signature_invalid':
      case 'integration_not_found':
      case 'product_not_found':
      case 'expedition_not_found':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'processing':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'integration_paused':
        return <Clock className="h-4 w-4 text-orange-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'failed':
      case 'order_creation_failed':
      case 'signature_invalid':
      case 'integration_not_found':
      case 'product_not_found':
      case 'expedition_not_found':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'integration_paused':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatStatus = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };


  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="flex items-center justify-between">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-6 bg-gray-200 rounded w-20"></div>
                </div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No logs found</h3>
          <p className="text-muted-foreground">
            No webhook logs match your current filters. Try adjusting your search criteria.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {logs.map((log) => (
        <Card key={log._id} className="overflow-hidden">
          <Accordion type="single" collapsible>
            <AccordionItem value="details" className="border-0">
              <AccordionTrigger className="hover:no-underline p-0 [&[data-state=open]>div]:bg-muted/50">
              <CardContent className="p-6 hover:bg-muted/50 transition-colors w-full">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    {getStatusIcon(log.status)}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-sm text-muted-foreground">
                          {log.webhookId}
                        </span>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getStatusColor(log.status)}`}
                        >
                          {formatStatus(log.status)}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>
                          {formatDistanceToNow(new Date(log.startedAt), { addSuffix: true })}
                        </span>
                        
                        {log.orderData?.customerName && (
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span>{log.orderData.customerName}</span>
                          </div>
                        )}
                        
                        {log.orderData?.externalOrderId && (
                          <div className="flex items-center gap-1">
                            <Package className="h-3 w-3" />
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
                      <div className="flex items-center gap-1 text-sm">
                        <DollarSign className="h-3 w-3" />
                        <span>
                          {log.orderData.totalAmount} {log.orderData.currency || 'MAD'}
                        </span>
                      </div>
                    )}
                    
                    <Badge variant="secondary" className="text-xs">
                      {log.platform.toUpperCase()}
                    </Badge>
                  </div>
                </div>
                
                {log.errorMessage && (
                  <div className="mt-3 p-3 bg-destructive/10 border border-destructive/20 rounded text-sm text-destructive">
                    <div className="font-medium mb-1">Error:</div>
                    <div className="break-words">{log.errorMessage}</div>
                  </div>
                )}
              </CardContent>
            </AccordionTrigger>
            
            <AccordionContent className="pb-0">
              <div className="border-t bg-muted/30 p-6 space-y-6">
                    {/* Order Details */}
                    {log.orderData && (
                      <div>
                        <h4 className="font-medium mb-3 flex items-center gap-2">
                          <Package className="h-4 w-4" />
                          Order Details
                        </h4>
                        <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3 text-sm">
                          {log.orderData.externalOrderId && (
                            <div>
                              <span className="text-muted-foreground">External ID:</span>
                              <span className="ml-2 font-mono">{log.orderData.externalOrderId}</span>
                            </div>
                          )}
                          {log.orderData.internalOrderId && (
                            <div>
                              <span className="text-muted-foreground">Internal ID:</span>
                              <span className="ml-2 font-mono">{log.orderData.internalOrderId}</span>
                            </div>
                          )}
                          {log.orderData.customerName && (
                            <div>
                              <span className="text-muted-foreground">Customer:</span>
                              <span className="ml-2">{log.orderData.customerName}</span>
                            </div>
                          )}
                          {log.orderData.totalAmount && (
                            <div>
                              <span className="text-muted-foreground">Amount:</span>
                              <span className="ml-2">
                                {log.orderData.totalAmount} {log.orderData.currency || 'MAD'}
                              </span>
                            </div>
                          )}
                          {log.orderData.productsCount && (
                            <div>
                              <span className="text-muted-foreground">Products:</span>
                              <span className="ml-2">{log.orderData.productsCount}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Processing Steps */}
                    {log.steps && log.steps.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-3 flex items-center gap-2">
                          <Timer className="h-4 w-4" />
                          Processing Steps
                        </h4>
                        <div className="space-y-2">
                          {log.steps.map((step: any, index: number) => (
                            <div key={index} className="flex items-center gap-3 p-2 bg-background rounded border">
                              {step.status === 'success' && <CheckCircle className="h-4 w-4 text-green-600" />}
                              {step.status === 'failed' && <XCircle className="h-4 w-4 text-red-600" />}
                              {step.status === 'skipped' && <AlertCircle className="h-4 w-4 text-gray-600" />}
                              
                              <div className="flex-1">
                                <div className="font-medium text-sm">{step.step}</div>
                                {step.details && (
                                  <div className="text-xs text-muted-foreground">{step.details}</div>
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
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <ExternalLink className="h-4 w-4" />
                        Technical Details
                      </h4>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <div className="text-sm">
                            <span className="text-muted-foreground">Request URL:</span>
                            <div className="font-mono text-xs break-all bg-background p-2 rounded border">
                              {log.requestUrl}
                            </div>
                          </div>
                          
                          <div className="text-sm">
                            <span className="text-muted-foreground">Response Status:</span>
                            <span className="ml-2 font-mono">{log.responseStatus}</span>
                          </div>
                          
                          <div className="text-sm">
                            <span className="text-muted-foreground">Processing Time:</span>
                            <span className="ml-2">{log.processingTime}ms</span>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="text-sm">
                            <span className="text-muted-foreground">Started:</span>
                            <span className="ml-2">{new Date(log.startedAt).toLocaleString()}</span>
                          </div>
                          
                          {log.completedAt && (
                            <div className="text-sm">
                              <span className="text-muted-foreground">Completed:</span>
                              <span className="ml-2">{new Date(log.completedAt).toLocaleString()}</span>
                            </div>
                          )}
                          
                          {log.signatureValidation && (
                            <div className="text-sm">
                              <span className="text-muted-foreground">Signature:</span>
                              <Badge 
                                variant={log.signatureValidation.isValid ? "default" : "destructive"}
                                className="ml-2 text-xs"
                              >
                                {log.signatureValidation.isValid ? 'Valid' : 'Invalid'}
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>
                </div>
              </div>
            </AccordionContent>
            </AccordionItem>
          </Accordion>
        </Card>
      ))}
    </div>
  );
}