'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { FileText, Eye, EyeOff, Download } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface FileStructureDisplayProps {
  showStructure?: boolean;
}

export default function FileStructureDisplay({ showStructure: initialShow = true }: FileStructureDisplayProps) {
  const t = useTranslations('orders.import.fileStructure');
  const [showStructure, setShowStructure] = useState(initialShow);

  // File structure information
  const fileStructure = [
    { key: 'orderId', required: true },
    { key: 'productId', required: true },
    { key: 'date', required: true },
    { key: 'productName', required: true },
    { key: 'productLink', required: false },
    { key: 'customerName', required: true },
    { key: 'phoneNumber', required: true },
    { key: 'address', required: true },
    { key: 'price', required: true },
    { key: 'quantity', required: true },
    { key: 'storeName', required: true }
  ];

  const downloadExampleFile = () => {
    const headers = fileStructure.map(f => t(`fields.${f.key}.name`));
    // Fix the example data to match the correct order of headers
    const exampleData = [
      'ORD001',                                    // ORDER ID
      'PROD001|PROD002',                          // PRODUCT ID  
      '2024-01-15',                               // DATE
      'Product 1|Product 2',                      // PRODUCT NAME
      'https://example.com/prod1|https://example.com/prod2', // PRODUCT LINK
      'John Doe',                                 // CUSTOMER NAME
      '+1234567890',                              // PHONE NUMBER
      '123 Main St, City, Country',               // ADDRESS
      '29.99|45.00',                             // PRICE
      '2|1',                                     // QUANTITY
      'My Store'                                 // STORE NAME
    ];

    // Properly escape CSV fields that contain commas
    const escapeCsvField = (field: string) => {
      if (field.includes(',') || field.includes('"') || field.includes('\n')) {
        return `"${field.replace(/"/g, '""')}"`;
      }
      return field;
    };
    
    const BOM = '\uFEFF'; // UTF-8 BOM for Excel compatibility
    const csvContent = BOM + [
      headers.map(escapeCsvField).join(','),
      exampleData.map(escapeCsvField).join(',')
    ].join('\r\n'); // Use Windows line endings for Excel
    
    const blob = new Blob([csvContent], { 
      type: 'text/csv;charset=utf-8;' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'order_import_example.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {t('title')}
            </CardTitle>
            <CardDescription>
              {t('description')}
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowStructure(!showStructure)}
          >
            {showStructure ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showStructure ? t('hide') : t('show')}
          </Button>
        </div>
      </CardHeader>
      {showStructure && (
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-medium mb-2">Download Example File</h4>
                <Button
                  size="sm"
                  onClick={downloadExampleFile}
                  className="flex gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download CSV Example
                </Button>
              </div>
              <div>
                <h4 className="font-medium mb-2">{t('multipleProducts')}</h4>
                <p className="text-sm text-muted-foreground">
                  {t('multipleProductsDesc')}
                </p>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-4">
              <h4 className="font-medium mb-3">Excel/CSV File Structure</h4>
              
              {/* Excel-like spreadsheet */}
              <div className="overflow-x-auto">
                <div className="inline-block min-w-full">
                  <div className="border border-border rounded-lg overflow-hidden bg-background">
                    {/* Column headers (A, B, C, etc.) */}
                    <div className="flex">
                      <div className="w-8 h-8 bg-muted border-r border-border flex items-center justify-center text-xs font-medium"></div>
                      {fileStructure.map((_, index) => (
                        <div key={index} className="min-w-[140px] h-8 bg-muted border-r border-border flex items-center justify-center text-xs font-medium">
                          {String.fromCharCode(65 + index)}
                        </div>
                      ))}
                    </div>
                    
                    {/* Header row */}
                    <div className="flex">
                      <div className="w-8 h-10 bg-muted border-r border-b border-border flex items-center justify-center text-xs font-medium">1</div>
                      {fileStructure.map((field, index) => (
                        <div key={index} className="min-w-[140px] h-10 border-r border-b border-border flex items-center px-2 bg-muted/50">
                          <span className="text-xs font-medium truncate">
                            {t(`fields.${field.key}.name`)}
                            {field.required && <span className="text-destructive ml-1">*</span>}
                          </span>
                        </div>
                      ))}
                    </div>
                    
                    {/* Example data row */}
                    <div className="flex">
                      <div className="w-8 h-10 bg-muted border-r border-b border-border flex items-center justify-center text-xs font-medium">2</div>
                      <div className="min-w-[140px] h-10 border-r border-b border-border flex items-center px-2 bg-background">
                        <span className="text-xs font-mono truncate">ORD001</span>
                      </div>
                      <div className="min-w-[140px] h-10 border-r border-b border-border flex items-center px-2 bg-background">
                        <span className="text-xs font-mono truncate">PROD001|PROD002</span>
                      </div>
                      <div className="min-w-[140px] h-10 border-r border-b border-border flex items-center px-2 bg-background">
                        <span className="text-xs font-mono truncate">2024-01-15</span>
                      </div>
                      <div className="min-w-[140px] h-10 border-r border-b border-border flex items-center px-2 bg-background">
                        <span className="text-xs font-mono truncate">Product 1|Product 2</span>
                      </div>
                      <div className="min-w-[140px] h-10 border-r border-b border-border flex items-center px-2 bg-background">
                        <span className="text-xs font-mono truncate">https://example.com</span>
                      </div>
                      <div className="min-w-[140px] h-10 border-r border-b border-border flex items-center px-2 bg-background">
                        <span className="text-xs font-mono truncate">John Doe</span>
                      </div>
                      <div className="min-w-[140px] h-10 border-r border-b border-border flex items-center px-2 bg-background">
                        <span className="text-xs font-mono truncate">+1234567890</span>
                      </div>
                      <div className="min-w-[140px] h-10 border-r border-b border-border flex items-center px-2 bg-background">
                        <span className="text-xs font-mono truncate">123 Main St, City</span>
                      </div>
                      <div className="min-w-[140px] h-10 border-r border-b border-border flex items-center px-2 bg-background">
                        <span className="text-xs font-mono truncate">29.99|45.00</span>
                      </div>
                      <div className="min-w-[140px] h-10 border-r border-b border-border flex items-center px-2 bg-background">
                        <span className="text-xs font-mono truncate">2|1</span>
                      </div>
                      <div className="min-w-[140px] h-10 border-b border-border flex items-center px-2 bg-background">
                        <span className="text-xs font-mono truncate">My Store</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="text-sm text-muted-foreground">
                <p>• Use | (pipe) to separate multiple products in one order</p>
                <p>• Required fields are marked with *</p>
              </div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}