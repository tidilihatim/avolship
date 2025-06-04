'use client';

// src/app/[locale]/dashboard/expeditions/_components/expedition-details.tsx
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { 
  Edit, 
  ArrowLeft, 
  Package, 
  MapPin, 
  Tag, 
  Building2, 
  Calendar, 
  DollarSign, 
  Hash, 
  Truck,
  User,
  Phone,
  Mail,
  Building,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Eye,
  Weight,
  Navigation
} from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import { ExpeditionStatus, TransportMode, ProviderType } from '@/app/dashboard/_constant/expedition';
import { updateExpeditionStatus } from '@/app/actions/expedition';
import { UserRole } from '@/lib/db/models/user';

interface ExpeditionDetailsProps {
  expedition: any;
  userRole?: string;
  warehouseCurrency?: string;
}

/**
 * ExpeditionDetails Component
 * Displays detailed information about an expedition
 */
export default function ExpeditionDetails({ expedition, userRole }: ExpeditionDetailsProps) {
  const t = useTranslations();
  const router = useRouter();

  // Check if user is admin or moderator
  const isAdminOrModerator = userRole === UserRole.ADMIN || userRole === UserRole.MODERATOR;
  const isSeller = userRole === UserRole.SELLER;
  
  // Get status configuration
  const getStatusConfig = (status: ExpeditionStatus) => {
    const statusConfigs = {
      [ExpeditionStatus.PENDING]: { 
        label: t('expeditions.statuses.pending'), 
        description: 'Expedition is waiting for approval',
        className: 'bg-yellow-50 text-yellow-700 hover:bg-yellow-50 border-yellow-200',
        icon: Clock
      },
      [ExpeditionStatus.APPROVED]: { 
        label: t('expeditions.statuses.approved'), 
        description: 'Expedition has been approved and ready for transit',
        className: 'bg-green-50 text-green-700 hover:bg-green-50 border-green-200',
        icon: CheckCircle2
      },
      [ExpeditionStatus.IN_TRANSIT]: { 
        label: t('expeditions.statuses.in_transit'), 
        description: 'Expedition is currently in transit',
        className: 'bg-blue-50 text-blue-700 hover:bg-blue-50 border-blue-200',
        icon: Truck
      },
      [ExpeditionStatus.DELIVERED]: { 
        label: t('expeditions.statuses.delivered'), 
        description: 'Expedition has been successfully delivered',
        className: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-emerald-200',
        icon: CheckCircle2
      },
      [ExpeditionStatus.CANCELLED]: { 
        label: t('expeditions.statuses.cancelled'), 
        description: 'Expedition has been cancelled',
        className: 'bg-gray-50 text-gray-700 hover:bg-gray-50 border-gray-200',
        icon: XCircle
      },
      [ExpeditionStatus.REJECTED]: { 
        label: t('expeditions.statuses.rejected'), 
        description: 'Expedition has been rejected',
        className: 'bg-red-50 text-red-700 hover:bg-red-50 border-red-200',
        icon: XCircle
      }
    };
    return statusConfigs[status] || { 
      label: t('common.unknown'), 
      description: 'Unknown status',
      className: 'bg-gray-50 text-gray-700 hover:bg-gray-50 border-gray-200',
      icon: AlertTriangle
    };
  };

  const statusConfig = getStatusConfig(expedition.status);
  const StatusIcon = statusConfig.icon;
  
  // Get transport mode configuration
  const getTransportModeConfig = (mode: TransportMode) => {
    const modeConfigs = {
      [TransportMode.ROAD]: { 
        label: t('expeditions.transportModes.road'), 
        icon: Truck,
        className: 'bg-blue-50 text-blue-700 border-blue-200'
      },
      [TransportMode.RAILWAY]: { 
        label: t('expeditions.transportModes.railway'), 
        icon: Navigation,
        className: 'bg-purple-50 text-purple-700 border-purple-200'
      },
      [TransportMode.AIR]: { 
        label: t('expeditions.transportModes.air'), 
        icon: Package,
        className: 'bg-sky-50 text-sky-700 border-sky-200'
      },
      [TransportMode.MARITIME]: { 
        label: t('expeditions.transportModes.maritime'), 
        icon: Navigation,
        className: 'bg-teal-50 text-teal-700 border-teal-200'
      }
    };
    return modeConfigs[mode] || { 
      label: mode, 
      icon: Package,
      className: 'bg-gray-50 text-gray-700 border-gray-200'
    };
  };

  const transportConfig = getTransportModeConfig(expedition.transportMode);
  const TransportIcon = transportConfig.icon;
  
  // Handle status update (Admin/Moderator only)
  const handleStatusUpdate = async (newStatus: ExpeditionStatus, rejectedReason?: string) => {
    const result = await updateExpeditionStatus(expedition._id, newStatus, rejectedReason);
    
    if (result.success) {
      toast.success(t('expeditions.expeditionUpdated'));
      router.refresh();
    } else {
      toast.error(result.message || 'Failed to update status');
    }
  };

  // Format currency with dynamic currency
  const formatCurrency = (value?: number) => {
    if (value === undefined || value === null) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: expedition?.warehouseId?.currency,
    }).format(value);
  };

  // Format weight
  const formatWeight = (weight: number) => {
    return `${weight} KG`;
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push(`/dashboard/${userRole}/expeditions`)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-bold">
              <Package className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold">{expedition.expeditionCode}</h1>
          </div>
          <Badge variant="outline" className={statusConfig.className}>
            <StatusIcon className="mr-1 h-3 w-3" />
            {statusConfig.label}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          {/* Status Quick Actions for Admin/Moderator */}
          {isAdminOrModerator && (
            <>
              {expedition.status === ExpeditionStatus.PENDING && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStatusUpdate(ExpeditionStatus.APPROVED)}
                    className="text-green-600 hover:text-green-700"
                  >
                    <CheckCircle2 className="mr-1 h-4 w-4" />
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStatusUpdate(ExpeditionStatus.REJECTED, "Rejected by admin")}
                    className="text-red-600 hover:text-red-700"
                  >
                    <XCircle className="mr-1 h-4 w-4" />
                    Reject
                  </Button>
                </>
              )}
              {expedition.status === ExpeditionStatus.APPROVED && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusUpdate(ExpeditionStatus.IN_TRANSIT)}
                  className="text-blue-600 hover:text-blue-700"
                >
                  <Truck className="mr-1 h-4 w-4" />
                  Mark In Transit
                </Button>
              )}
              {expedition.status === ExpeditionStatus.IN_TRANSIT && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusUpdate(ExpeditionStatus.DELIVERED)}
                  className="text-emerald-600 hover:text-emerald-700"
                >
                  <CheckCircle2 className="mr-1 h-4 w-4" />
                  Mark Delivered
                </Button>
              )}
            </>
          )}
          
          {/* Edit button for sellers (only pending expeditions) */}
          {isSeller && expedition.status === ExpeditionStatus.PENDING && (
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => router.push(`/dashboard/${userRole}/expeditions/${expedition._id}/edit`)}
            >
              <Edit className="h-4 w-4" />
              {t('common.edit')}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-2">
              <Package className="h-5 w-5 text-muted-foreground" />
              <CardTitle>{t('expeditions.sections.basicInfo')}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t('expeditions.fields.expeditionCode')}
                </p>
                <div className="flex items-center space-x-2">
                  <Hash className="h-4 w-4 text-muted-foreground" />
                  <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm">
                    {expedition.expeditionCode}
                  </code>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t('expeditions.fields.fromCountry')}
                </p>
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <p className="text-base font-medium">{expedition.fromCountry}</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t('expeditions.fields.weight')}
                </p>
                <div className="flex items-center space-x-2">
                  <Weight className="h-4 w-4 text-muted-foreground" />
                  <p className="text-base font-medium">{formatWeight(expedition.weight)}</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t('expeditions.fields.transportMode')}
                </p>
                <Badge variant="outline" className={transportConfig.className}>
                  <TransportIcon className="mr-1 h-3 w-3" />
                  {transportConfig.label}
                </Badge>
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t('expeditions.fields.expeditionDate')}
                </p>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <p className="text-base">
                    {format(new Date(expedition.expeditionDate), 'PPP')}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t('common.createdAt')}
                </p>
                <p className="text-base">
                  {format(new Date(expedition.createdAt), 'PPP p')}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t('common.updatedAt')}
                </p>
                <p className="text-base">
                  {format(new Date(expedition.updatedAt), 'PPP p')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status & Tracking */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <CardTitle>{t('expeditions.sections.statusTracking')}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t('common.status')}
                </p>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge variant="outline" className={statusConfig.className}>
                    <StatusIcon className="mr-1 h-3 w-3" />
                    {statusConfig.label}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {statusConfig.description}
                </p>
              </div>
              
              {expedition.trackingNumber && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {t('expeditions.fields.trackingNumber')}
                    </p>
                    <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm">
                      {expedition.trackingNumber}
                    </code>
                  </div>
                </>
              )}

              {expedition.estimatedDelivery && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {t('expeditions.fields.estimatedDelivery')}
                    </p>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <p className="text-base">
                        {format(new Date(expedition.estimatedDelivery), 'PPP')}
                      </p>
                    </div>
                  </div>
                </>
              )}

              {expedition.actualDelivery && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {t('expeditions.fields.actualDelivery')}
                    </p>
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <p className="text-base">
                        {format(new Date(expedition.actualDelivery), 'PPP p')}
                      </p>
                    </div>
                  </div>
                </>
              )}

              {expedition.rejectedReason && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {t('expeditions.fields.rejectedReason')}
                    </p>
                    <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                      {expedition.rejectedReason}
                    </p>
                  </div>
                </>
              )}

              <Separator />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Expedition ID
                </p>
                <p className="text-sm font-mono bg-muted px-2 py-1 rounded">
                  {expedition._id}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Warehouse Information */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-2">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              <CardTitle>{t('expeditions.sections.warehouseInfo')}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-center space-x-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">
                      {expedition.warehouseName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {t('expeditions.fields.warehouse')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Provider Information */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-2">
              <User className="h-5 w-5 text-muted-foreground" />
              <CardTitle>{t('expeditions.sections.providerInfo')}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t('expeditions.fields.providerType')}
                </p>
                <Badge variant="outline">
                  {t(`expeditions.providerTypes.${expedition.providerType}`)}
                </Badge>
              </div>

              {expedition.providerType === ProviderType.REGISTERED && expedition.providerName && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {t('expeditions.fields.provider')}
                    </p>
                    <p className="text-base font-medium">{expedition.providerName}</p>
                  </div>
                </>
              )}

              {expedition.providerType === ProviderType.OWN && expedition.carrierName && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        {t('expeditions.fields.carrierName')}
                      </p>
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <p className="text-base font-medium">{expedition.carrierName}</p>
                      </div>
                    </div>
                    
                    {expedition.carrierPhone && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          {t('expeditions.fields.carrierPhone')}
                        </p>
                        <div className="flex items-center space-x-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <p className="text-base">{expedition.carrierPhone}</p>
                        </div>
                      </div>
                    )}

                    {expedition.carrierEmail && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          {t('expeditions.fields.carrierEmail')}
                        </p>
                        <div className="flex items-center space-x-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <p className="text-base">{expedition.carrierEmail}</p>
                        </div>
                      </div>
                    )}

                    {expedition.carrierCompany && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          {t('expeditions.fields.carrierCompany')}
                        </p>
                        <div className="flex items-center space-x-2">
                          <Building className="h-4 w-4 text-muted-foreground" />
                          <p className="text-base">{expedition.carrierCompany}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Products Information */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Package className="h-5 w-5 text-muted-foreground" />
                <CardTitle>{t('expeditions.sections.products')}</CardTitle>
              </div>
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <span>Total Products: <strong>{expedition.totalProducts}</strong></span>
                <span>Total Quantity: <strong>{expedition.totalQuantity}</strong></span>
                {expedition.totalValue && (
                  <span>Total Value: <strong>{formatCurrency(expedition.totalValue)}</strong></span>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {expedition.products && expedition.products.length > 0 ? (
                expedition.products.map((product: any, index: number) => (
                  <div key={product.productId || index} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <Package className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {product.productName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Code: {product.productCode}
                        </p>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="font-bold text-lg">
                        {product.quantity}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Quantity
                      </p>
                      {product.unitPrice && (
                        <p className="text-sm text-green-600">
                          {formatCurrency(product.unitPrice)} each
                        </p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>{t('expeditions.noProductsSelected')}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Seller Information (Admin/Moderator only) */}
        {isAdminOrModerator && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-muted-foreground" />
                <CardTitle>{t('expeditions.sections.sellerInfo')}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t('expeditions.fields.sellerName')}
                  </p>
                  <p className="text-base font-medium">{expedition.sellerName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Seller ID
                  </p>
                  <p className="text-sm font-mono bg-muted px-2 py-1 rounded">
                    {expedition.sellerId}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Approval Information (if approved) */}
        {expedition.approvedBy && expedition.approvedAt && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <CardTitle>{t('expeditions.sections.approvalInfo')}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t('expeditions.fields.approvedAt')}
                  </p>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <p className="text-base">
                      {format(new Date(expedition.approvedAt), 'PPP p')}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}