"use client";

import React, { useState, useEffect } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { createPaymentRequest } from '@/app/actions/payment-requests';
import { getActiveWarehouses } from '@/app/actions/warehouse';
import { PaymentRequestPriority } from '@/lib/db/models/payment-request';

interface Warehouse {
  _id: string;
  name: string;
  country: string;
  city: string;
  currency: string;
}

interface CreatePaymentRequestDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (success: boolean) => void;
}

const createPaymentRequestSchema = z.object({
  warehouseId: z.string().min(1, 'Warehouse is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  requestedFromDate: z.date({
    required_error: 'From date is required',
  }),
  requestedToDate: z.date({
    required_error: 'To date is required',
  }),
  priority: z.enum([
    PaymentRequestPriority.LOW,
    PaymentRequestPriority.NORMAL,
    PaymentRequestPriority.HIGH,
    PaymentRequestPriority.URGENT,
  ]),
}).refine((data) => data.requestedToDate > data.requestedFromDate, {
  message: "To date must be after from date",
  path: ["requestedToDate"],
});

type CreatePaymentRequestForm = z.infer<typeof createPaymentRequestSchema>;

export const CreatePaymentRequestDialog: React.FC<CreatePaymentRequestDialogProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const t = useTranslations('paymentRequests');
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingWarehouses, setLoadingWarehouses] = useState(true);

  const form = useForm<CreatePaymentRequestForm>({
    resolver: zodResolver(createPaymentRequestSchema),
    defaultValues: {
      warehouseId: '',
      description: '',
      requestedFromDate: undefined,
      requestedToDate: undefined,
      priority: PaymentRequestPriority.NORMAL,
    },
  });

  useEffect(() => {
    if (open) {
      fetchWarehouses();
      form.reset();
    }
  }, [open, form]);

  const fetchWarehouses = async () => {
    try {
      setLoadingWarehouses(true);
      const result = await getActiveWarehouses();
      if (result.warehouses) {
        setWarehouses(result.warehouses);
      } else {
        toast.error(result.error || 'Failed to load warehouses');
      }
    } catch (error) {
      console.error('Error fetching warehouses:', error);
      toast.error('Failed to load warehouses');
    } finally {
      setLoadingWarehouses(false);
    }
  };

  const onSubmit = async (data: CreatePaymentRequestForm) => {
    try {
      setLoading(true);

      const result = await createPaymentRequest({
        warehouseId: data.warehouseId,
        description: data.description,
        requestedFromDate: data.requestedFromDate.toISOString(),
        requestedToDate: data.requestedToDate.toISOString(),
        priority: data.priority,
      });

      if (result.success) {
        toast.success(t('messages.createSuccess'));
        onSuccess(true);
        form.reset();
      } else if (result.disabled) {
        toast.error(result.error);
        onClose();
      } else {
        toast.error(result.error || t('messages.createError'));
      }
    } catch (error) {
      console.error('Error creating payment request:', error);
      toast.error(t('messages.createError'));
    } finally {
      setLoading(false);
    }
  };

  const handleWarehouseChange = (warehouseId: string) => {
    form.setValue('warehouseId', warehouseId);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{t('dialog.create.title')}</DialogTitle>
          <DialogDescription>
            {t('dialog.create.description')}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Warehouse Selection */}
              <FormField
                control={form.control}
                name="warehouseId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('form.warehouse')}</FormLabel>
                    <Select
                      disabled={loadingWarehouses}
                      onValueChange={handleWarehouseChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('form.warehousePlaceholder')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {warehouses.map((warehouse) => (
                          <SelectItem key={warehouse._id} value={warehouse._id}>
                            <div className="flex flex-col">
                              <span className="font-medium">{warehouse.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {warehouse.city}, {warehouse.country} ({warehouse.currency})
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Priority */}
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('form.priority')}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('form.priorityPlaceholder')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={PaymentRequestPriority.LOW}>
                          {t('form.priorities.low')}
                        </SelectItem>
                        <SelectItem value={PaymentRequestPriority.NORMAL}>
                          {t('form.priorities.normal')}
                        </SelectItem>
                        <SelectItem value={PaymentRequestPriority.HIGH}>
                          {t('form.priorities.high')}
                        </SelectItem>
                        <SelectItem value={PaymentRequestPriority.URGENT}>
                          {t('form.priorities.urgent')}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* From Date */}
              <FormField
                control={form.control}
                name="requestedFromDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('form.fromDate')}</FormLabel>
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
                              <span>Pick from date</span>
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
                            date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
              {/* To Date */}
              <FormField
                control={form.control}
                name="requestedToDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('form.toDate')}</FormLabel>
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
                              <span>Pick to date</span>
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
                          disabled={(date) => {
                            const fromDate = form.getValues('requestedFromDate');
                            return date < new Date("1900-01-01") ||
                                   (fromDate && date <= fromDate);
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('form.description')}</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder={t('form.descriptionPlaceholder')}
                      rows={4}
                    />
                  </FormControl>
                  <FormDescription>
                    Provide details about why you need this payment
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading || loadingWarehouses}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('dialog.create.title')}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};