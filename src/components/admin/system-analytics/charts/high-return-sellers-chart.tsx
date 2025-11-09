'use client';

import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
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

interface HighReturnSeller {
  sellerId: string;
  sellerName: string;
  sellerEmail: string;
  totalOrders: number;
  refundedOrders: number;
  returnRate: number;
}

interface HighReturnSellersChartProps {
  data: HighReturnSeller[];
  count: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function HighReturnSellersChart({
  data,
  count,
  page,
  limit,
  totalPages,
}: HighReturnSellersChartProps) {
  const t = useTranslations('adminSystemAnalytics.charts.highReturnSellers');
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('returnPage', newPage.toString());
    startTransition(() => {
      router.push(`/dashboard/admin/system?${params.toString()}`, { scroll: false });
    });
  };

  const handleLimitChange = (newLimit: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('returnLimit', newLimit);
    params.set('returnPage', '1'); // Reset to page 1 when changing limit
    startTransition(() => {
      router.push(`/dashboard/admin/system?${params.toString()}`, { scroll: false });
    });
  };

  const getReturnRateColor = (rate: number) => {
    if (rate >= 50) return 'text-red-600 dark:text-red-400 font-bold';
    if (rate >= 35) return 'text-orange-600 dark:text-orange-400 font-semibold';
    return 'text-yellow-600 dark:text-yellow-500 font-medium';
  };

  const startIndex = (page - 1) * limit + 1;
  const endIndex = Math.min(page * limit, count);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              {t('title')}
            </CardTitle>
            <CardDescription className="mt-1">{t('description')}</CardDescription>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-orange-600 dark:text-orange-400">{count}</div>
            <div className="text-sm text-muted-foreground">{t('sellersCount')}</div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {count === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mb-4" />
            <p className="text-lg font-medium text-green-600 dark:text-green-400">
              {t('noHighReturnSellers')}
            </p>
            <p className="text-sm text-muted-foreground mt-1">{t('allSellersGood')}</p>
          </div>
        ) : (
          <>
            {/* Table */}
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('seller')}</TableHead>
                    <TableHead>{t('email')}</TableHead>
                    <TableHead className="text-right">{t('totalOrders')}</TableHead>
                    <TableHead className="text-right">{t('refundedOrders')}</TableHead>
                    <TableHead className="text-right">{t('returnRate')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((seller) => (
                    <TableRow key={seller.sellerId}>
                      <TableCell className="font-medium max-w-[200px] truncate">
                        {seller.sellerName}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                        {seller.sellerEmail}
                      </TableCell>
                      <TableCell className="text-right">{seller.totalOrders}</TableCell>
                      <TableCell className="text-right">
                        <span className="text-red-600 dark:text-red-400 font-medium">
                          {seller.refundedOrders}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={getReturnRateColor(seller.returnRate)}>
                          {seller.returnRate}%
                        </span>
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
