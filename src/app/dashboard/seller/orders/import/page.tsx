'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import WarehouseSelector from './_components/warehouse-selector';
import FileStructureDisplay from './_components/file-structure-display';
import FileUpload from './_components/file-upload';
import OrderPreview, { ParsedOrder } from './_components/order-preview';
import { processFile } from './_components/file-processor';
import { createBulkOrder, getWarehousesForOrder } from '@/app/actions/order';

export default function ImportOrdersPage() {
  const t = useTranslations('orders.import');
  const tMessages = useTranslations('orders.import.messages');
  const router = useRouter();
  
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('');
  const [warehouseInfo, setWarehouseInfo] = useState<{ currency: string; name: string } | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [parsedOrders, setParsedOrders] = useState<ParsedOrder[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const handleWarehouseChange = async (warehouseId: string) => {
    setSelectedWarehouse(warehouseId);
    
    // Reset everything when warehouse changes
    setUploadedFile(null);
    setParsedOrders([]);
    setIsProcessing(false);
    setIsImporting(false);
    
    if (warehouseId) {
      try {
        const result = await getWarehousesForOrder();
        if (result.success) {
          const warehouse = result.warehouses.find(w => w._id === warehouseId);
          if (warehouse) {
            setWarehouseInfo({
              currency: warehouse.currency,
              name: warehouse.name
            });
          }
        }
      } catch (error) {
        console.error('Error fetching warehouse info:', error);
        setWarehouseInfo(null);
      }
    } else {
      setWarehouseInfo(null);
    }
  };

  const handleFileUpload = (file: File) => {
    setUploadedFile(file);
    processUploadedFile(file);
  };

  const handleFileRemove = () => {
    setUploadedFile(null);
    setParsedOrders([]);
  };

  const processUploadedFile = async (file: File) => {
    if (!selectedWarehouse) {
      toast.error(tMessages('selectWarehouseFirst'));
      return;
    }

    setIsProcessing(true);
    try {
      const result = await processFile(file, selectedWarehouse);
      
      if (!result.success) {
        toast.error(result.message || tMessages('fileProcessingFailed'));
        setParsedOrders([]);
        return;
      }

      setParsedOrders(result.orders);
      
      if (result.validRows > 0) {
        toast.success(tMessages('fileProcessed', { count: result.totalRows }));
      } else {
        toast.error('No valid orders found in the file');
      }
    } catch (error) {
      console.error('Error processing file:', error);
      toast.error(tMessages('fileProcessingFailed'));
      setParsedOrders([]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImportOrders = async (validOrders: ParsedOrder[]) => {
    if (!selectedWarehouse) {
      toast.error('Please select a warehouse first');
      return;
    }

    setIsImporting(true);
    try {
      const result = await createBulkOrder(validOrders, selectedWarehouse);
      
      if (result.success) {
        toast.success(`Successfully imported ${result.successCount} out of ${result.totalCount} orders`);
        if (result.errorCount && result.errorCount > 0) {
          toast.error(`${result.errorCount} orders failed to import`);
        }
        router.push('/dashboard/seller/orders');
      } else {
        toast.error(result.message || 'Failed to import orders');
      }
    } catch (error) {
      console.error('Error importing orders:', error);
      toast.error('Failed to import orders');
    } finally {
      setIsImporting(false);
    }
  };

  const handleExportCorrected = () => {
    if (parsedOrders.length === 0) {
      toast.error('No orders to export');
      return;
    }

    try {
      // Prepare corrected data for export
      const headers = [
        'ORDER ID',
        'PRODUCT ID', 
        'DATE',
        'PRODUCT NAME',
        'PRODUCT LINK',
        'CUSTOMER NAME',
        'PHONE NUMBER',
        'ADDRESS',
        'PRICE',
        'QUANTITY',
        'STORE NAME',
        'STATUS',
        'ERRORS'
      ];

      const csvRows = [headers.join(',')];

      parsedOrders.forEach(order => {
        const products = order.products;
        if (products.length > 0) {
          const productIds = products.map(p => p.id).join('|');
          const productNames = products.map(p => p.name).join('|');
          const prices = products.map(p => p.price).join('|');
          const quantities = products.map(p => p.quantity).join('|');
          
          const row = [
            order.orderId,
            productIds,
            order.date,
            productNames,
            '', // product link
            order.customer.name,
            order.customer.phone,
            order.customer.address,
            prices,
            quantities,
            order.storeName,
            order.errors.length === 0 ? 'Valid' : 'Error',
            order.errors.join('; ')
          ];

          // Escape CSV fields that contain commas
          const escapedRow = row.map(field => {
            const fieldStr = String(field);
            if (fieldStr.includes(',') || fieldStr.includes('"') || fieldStr.includes('\n')) {
              return `"${fieldStr.replace(/"/g, '""')}"`;
            }
            return fieldStr;
          });

          csvRows.push(escapedRow.join(','));
        }
      });

      const csvContent = csvRows.join('\n');
      const BOM = '\uFEFF'; // UTF-8 BOM for Excel compatibility
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `corrected_orders_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast.success('Corrected CSV file downloaded');
    } catch (error) {
      console.error('Error exporting corrected CSV:', error);
      toast.error('Failed to export corrected CSV');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="flex gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('backToOrders')}
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground">
            {t('description')}
          </p>
        </div>
      </div>

      {/* Warehouse Selection */}
      <WarehouseSelector
        selectedWarehouse={selectedWarehouse}
        onWarehouseChange={handleWarehouseChange}
      />

      {/* File Structure Information */}
      <FileStructureDisplay />

      {/* File Upload */}
      <FileUpload
        selectedWarehouse={selectedWarehouse}
        uploadedFile={uploadedFile}
        onFileUpload={handleFileUpload}
        onFileRemove={handleFileRemove}
        isProcessing={isProcessing}
      />

      {/* Order Preview */}
      <OrderPreview
        orders={parsedOrders}
        onImportOrders={handleImportOrders}
        onExportCorrected={handleExportCorrected}
        isImporting={isImporting}
        warehouseInfo={warehouseInfo}
      />
    </div>
  );
}