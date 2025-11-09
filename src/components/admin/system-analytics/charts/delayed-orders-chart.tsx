'use client';

import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface DelayedOrder {
  orderId: string;
  orderMongoId: string;
  status: string;
  customerName: string;
  sellerName: string;
  confirmedAt: string; // ISO string
  hoursDelayed: number;
}

interface DelayedOrdersChartProps {
  data: DelayedOrder[];
  count: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function DelayedOrdersChart({ data, count, page, limit, totalPages }: DelayedOrdersChartProps) {
  const t = useTranslations('adminSystemAnalytics.charts.delayedOrders');
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    startTransition(() => {
      router.push(`/dashboard/admin/system?${params.toString()}`, { scroll: false });
    });
  };

  const handleLimitChange = (newLimit: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('limit', newLimit);
    params.set('page', '1'); // Reset to page 1 when changing limit
    startTransition(() => {
      router.push(`/dashboard/admin/system?${params.toString()}`, { scroll: false });
    });
  };

  const getStatusColor = (status: string) => {
    const statusColors: { [key: string]: string } = {
      confirmed: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      shipped: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      assigned_to_delivery:
        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      accepted_by_delivery:
        'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
      in_transit: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300',
      out_for_delivery: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300',
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
  };

  const getDelayColor = (hours: number) => {
    if (hours >= 120) return 'text-red-600 dark:text-red-400'; // 5+ days
    if (hours >= 96) return 'text-orange-600 dark:text-orange-400'; // 4+ days
    if (hours >= 72) return 'text-yellow-600 dark:text-yellow-500'; // 3+ days
    return 'text-amber-600 dark:text-amber-400'; // 2+ days
  };

  const formatStatus = (status: string) => {
    return status
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const startIndex = (page - 1) * limit + 1;
  const endIndex = Math.min(page * limit, count);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              {t('title')}
            </CardTitle>
            <CardDescription className="mt-1">{t('description')}</CardDescription>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-red-600 dark:text-red-400">{count}</div>
            <div className="text-sm text-muted-foreground">{t('delayedCount')}</div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {count === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Clock className="w-12 h-12 text-green-500 mb-4" />
            <p className="text-lg font-medium text-green-600 dark:text-green-400">
              {t('noDelayedOrders')}
            </p>
            <p className="text-sm text-muted-foreground mt-1">{t('allOrdersOnTime')}</p>
          </div>
        ) : (
          <>
            {/* Table */}
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px]">{t('orderId')}</TableHead>
                    <TableHead>{t('customer')}</TableHead>
                    <TableHead>{t('seller')}</TableHead>
                    <TableHead>{t('status')}</TableHead>
                    <TableHead>{t('confirmedAt')}</TableHead>
                    <TableHead className="text-right">{t('delay')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((order:any) => (
                    <TableRow key={order.orderMongoId}>
                      <TableCell className="font-mono text-sm font-medium">
                        {order.orderId}
                      </TableCell>
                      <TableCell className="max-w-[150px] truncate">
                        {order.customerName}
                      </TableCell>
                      <TableCell className="max-w-[150px] truncate">
                        {order.sellerName}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getStatusColor(order.status)}>
                          {formatStatus(order.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(order.confirmedAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-col items-end">
                          <span className={`text-lg font-bold ${getDelayColor(order.hoursDelayed)}`}>
                            {order.hoursDelayed}h
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {Math.floor(order.hoursDelayed / 24)} {t('days')}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{t('rowsPerPage')}:</span>
                <Select value={limit.toString()} onValueChange={handleLimitChange} disabled={isPending}>
                  <SelectTrigger className="w-[70px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">
                  {t('showing', { start: startIndex, end: endIndex, total: count })}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page <= 1 || isPending}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm px-2">
                    {t('page', { current: page, total: totalPages })}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page >= totalPages || isPending}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
