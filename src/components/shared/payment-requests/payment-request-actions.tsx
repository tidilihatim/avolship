"use client";

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  CheckCircle,
  XCircle,
  Calendar as CalendarIcon,
  User,
  MapPin,
  DollarSign,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { PaymentRequestStatus, PaymentRequestPriority } from '@/lib/db/models/payment-request';
import { formatPrice } from '@/lib/utils';

interface PaymentRequest {
  _id: string;
  sellerId: {
    _id: string;
    name: string;
    email: string;
    businessName?: string;
  };
  warehouseId: {
    _id: string;
    name: string;
    country: string;
    city: string;
    currency: string;
  };
  requestedAmount: number;
  description: string;
  requestedFromDate: string;
  requestedToDate: string;
  status: PaymentRequestStatus;
  priority: PaymentRequestPriority;
  createdAt: string;
}

interface PaymentRequestActionsProps {
  request: PaymentRequest;
  open: boolean;
  onClose: () => void;
  onUpdateStatus: (requestId: string, status: PaymentRequestStatus, data?: any) => Promise<void>;
  userRole: 'admin' | 'moderator';
}

const approveSchema = z.object({
  reviewNotes: z.string().optional(),
});

const scheduleSchema = z.object({
  scheduledDate: z.date({
    required_error: 'Scheduled date is required',
  }),
  reviewNotes: z.string().optional(),
});

const rejectSchema = z.object({
  rejectionReason: z.string().min(10, 'Rejection reason must be at least 10 characters'),
  reviewNotes: z.string().optional(),
});

type ApproveForm = z.infer<typeof approveSchema>;
type ScheduleForm = z.infer<typeof scheduleSchema>;
type RejectForm = z.infer<typeof rejectSchema>;

export const PaymentRequestActions: React.FC<PaymentRequestActionsProps> = ({
  request,
  open,
  onClose,
  onUpdateStatus,
  userRole,
}) => {
  const t = useTranslations('paymentRequests');
  const [activeTab, setActiveTab] = useState('approve');
  const [loading, setLoading] = useState(false);

  const approveForm = useForm<ApproveForm>({
    resolver: zodResolver(approveSchema),
    defaultValues: {
      reviewNotes: '',
    },
  });

  const scheduleForm = useForm<ScheduleForm>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      reviewNotes: '',
    },
  });

  const rejectForm = useForm<RejectForm>({
    resolver: zodResolver(rejectSchema),
    defaultValues: {
      rejectionReason: '',
      reviewNotes: '',
    },
  });

  const onApprove = async (data: ApproveForm) => {
    try {
      setLoading(true);
      await onUpdateStatus(request._id, PaymentRequestStatus.APPROVED, {
        reviewNotes: data.reviewNotes,
      });
    } finally {
      setLoading(false);
    }
  };

  const onSchedule = async (data: ScheduleForm) => {
    try {
      setLoading(true);
      await onUpdateStatus(request._id, PaymentRequestStatus.SCHEDULED, {
        scheduledDate: data.scheduledDate.toISOString(),
        reviewNotes: data.reviewNotes,
      });
    } finally {
      setLoading(false);
    }
  };

  const onReject = async (data: RejectForm) => {
    try {
      setLoading(true);
      await onUpdateStatus(request._id, PaymentRequestStatus.REJECTED, {
        rejectionReason: data.rejectionReason,
        reviewNotes: data.reviewNotes,
      });
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: PaymentRequestPriority) => {
    switch (priority) {
      case PaymentRequestPriority.URGENT:
        return 'text-red-600 bg-red-50 border-red-200';
      case PaymentRequestPriority.HIGH:
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case PaymentRequestPriority.NORMAL:
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case PaymentRequestPriority.LOW:
        return 'text-gray-600 bg-gray-50 border-gray-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('management.actions.title')}</DialogTitle>
          <DialogDescription>
            {t('management.actions.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Request Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('management.actions.requestSummary')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <User className="w-4 h-4" />
                    <span>{t('management.actions.seller')}</span>
                  </div>
                  <div className="font-medium">{request.sellerId.name}</div>
                  <div className="text-sm text-muted-foreground">{request.sellerId.email}</div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span>{t('management.actions.warehouse')}</span>
                  </div>
                  <div className="font-medium">{request.warehouseId.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {request.warehouseId.city}, {request.warehouseId.country}
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <DollarSign className="w-4 h-4" />
                    <span>{t('management.actions.amount')}</span>
                  </div>
                  <div className="text-xl font-bold">
                    {formatPrice(request.requestedAmount, request.warehouseId.currency)}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <AlertTriangle className="w-4 h-4" />
                    <span>{t('management.actions.priority')}</span>
                  </div>
                  <div className={`inline-block px-2 py-1 rounded-md text-sm font-medium border ${getPriorityColor(request.priority)}`}>
                    {t(`form.priorities.${request.priority.toLowerCase()}`)}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">{t('management.actions.dateRange')}</div>
                <div className="font-medium">
                  {format(new Date(request.requestedFromDate), 'MMMM dd, yyyy')} - {format(new Date(request.requestedToDate), 'MMMM dd, yyyy')}
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">{t('management.actions.description')}</div>
                <div className="text-sm p-3 bg-muted rounded-lg">
                  {request.description}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="approve" className="gap-2">
                <CheckCircle className="w-4 h-4" />
                {t('management.actions.approve')}
              </TabsTrigger>
              <TabsTrigger value="schedule" className="gap-2">
                <CalendarIcon className="w-4 h-4" />
                {t('management.actions.schedule')}
              </TabsTrigger>
              <TabsTrigger value="reject" className="gap-2">
                <XCircle className="w-4 h-4" />
                {t('management.actions.reject')}
              </TabsTrigger>
            </TabsList>

            {/* Approve Tab */}
            <TabsContent value="approve" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span>{t('management.actions.approveTitle')}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Form {...approveForm}>
                    <form onSubmit={approveForm.handleSubmit(onApprove)} className="space-y-4">
                      <FormField
                        control={approveForm.control}
                        name="reviewNotes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('management.actions.reviewNotes')}</FormLabel>
                            <FormControl>
                              <Textarea
                                {...field}
                                placeholder={t('management.actions.reviewNotesPlaceholder')}
                                rows={3}
                              />
                            </FormControl>
                            <FormDescription>
                              {t('management.actions.reviewNotesDescription')}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex justify-end space-x-4">
                        <Button type="button" variant="outline" onClick={onClose}>
                          {t('management.actions.cancel')}
                        </Button>
                        <Button type="submit" disabled={loading} className="bg-green-600 hover:bg-green-700">
                          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          {t('management.actions.approveRequest')}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Schedule Tab */}
            <TabsContent value="schedule" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <CalendarIcon className="w-5 h-5 text-blue-600" />
                    <span>{t('management.actions.scheduleTitle')}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Form {...scheduleForm}>
                    <form onSubmit={scheduleForm.handleSubmit(onSchedule)} className="space-y-4">
                      <FormField
                        control={scheduleForm.control}
                        name="scheduledDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('management.actions.scheduledDate')}</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    className={cn(
                                      "w-full pl-3 text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value ? (
                                      format(field.value, "PPP")
                                    ) : (
                                      <span>{t('management.actions.pickDate')}</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  disabled={(date) =>
                                    date < new Date(new Date().setHours(0, 0, 0, 0))
                                  }
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormDescription>
                              {t('management.actions.scheduledDateDescription')}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={scheduleForm.control}
                        name="reviewNotes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('management.actions.reviewNotes')}</FormLabel>
                            <FormControl>
                              <Textarea
                                {...field}
                                placeholder={t('management.actions.reviewNotesPlaceholder')}
                                rows={3}
                              />
                            </FormControl>
                            <FormDescription>
                              {t('management.actions.reviewNotesDescription')}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex justify-end space-x-4">
                        <Button type="button" variant="outline" onClick={onClose}>
                          {t('management.actions.cancel')}
                        </Button>
                        <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          {t('management.actions.scheduleRequest')}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Reject Tab */}
            <TabsContent value="reject" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <XCircle className="w-5 h-5 text-red-600" />
                    <span>{t('management.actions.rejectTitle')}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Form {...rejectForm}>
                    <form onSubmit={rejectForm.handleSubmit(onReject)} className="space-y-4">
                      <FormField
                        control={rejectForm.control}
                        name="rejectionReason"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('management.actions.rejectionReason')}</FormLabel>
                            <FormControl>
                              <Textarea
                                {...field}
                                placeholder={t('management.actions.rejectionReasonPlaceholder')}
                                rows={4}
                              />
                            </FormControl>
                            <FormDescription>
                              {t('management.actions.rejectionReasonDescription')}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={rejectForm.control}
                        name="reviewNotes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('management.actions.reviewNotes')}</FormLabel>
                            <FormControl>
                              <Textarea
                                {...field}
                                placeholder={t('management.actions.reviewNotesPlaceholder')}
                                rows={3}
                              />
                            </FormControl>
                            <FormDescription>
                              {t('management.actions.reviewNotesDescription')}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex justify-end space-x-4">
                        <Button type="button" variant="outline" onClick={onClose}>
                          {t('management.actions.cancel')}
                        </Button>
                        <Button type="submit" disabled={loading} variant="destructive">
                          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          {t('management.actions.rejectRequest')}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};