'use client';

import { useRef } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Upload, FileSpreadsheet, X, AlertTriangle } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface FileUploadProps {
  selectedWarehouse: string;
  uploadedFile: File | null;
  onFileUpload: (file: File) => void;
  onFileRemove: () => void;
  isProcessing?: boolean;
}

export default function FileUpload({
  selectedWarehouse,
  uploadedFile,
  onFileUpload,
  onFileRemove,
  isProcessing = false
}: FileUploadProps) {
  const t = useTranslations('orders.import.fileUpload');
  const tMessages = useTranslations('orders.import.messages');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    const isValidType = validTypes.includes(file.type) || 
                       file.name.endsWith('.csv') || 
                       file.name.endsWith('.xlsx') || 
                       file.name.endsWith('.xls');

    if (!isValidType) {
      toast.error(tMessages('invalidFileType'));
      return;
    }

    onFileUpload(file);
  };

  const handleUploadClick = () => {
    if (!selectedWarehouse) {
      toast.error(tMessages('selectWarehouseFirst'));
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileRemove = () => {
    onFileRemove();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          {t('title')}
        </CardTitle>
        <CardDescription>
          {t('description')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileChange}
            className="hidden"
            disabled={!selectedWarehouse || isProcessing}
          />
          
          {!uploadedFile ? (
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                selectedWarehouse && !isProcessing
                  ? 'border-muted-foreground/25 cursor-pointer hover:border-muted-foreground/50'
                  : 'border-muted-foreground/10 cursor-not-allowed'
              }`}
              onClick={handleUploadClick}
            >
              <FileSpreadsheet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">
                {selectedWarehouse && !isProcessing ? t('clickToUpload') : t('selectWarehouseFirst')}
              </p>
              <p className="text-sm text-muted-foreground">
                {t('supportedFormats')}
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5" />
                <span className="font-medium">{uploadedFile.name}</span>
                <Badge variant="secondary">{(uploadedFile.size / 1024).toFixed(1)} KB</Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleFileRemove}
                disabled={isProcessing}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
          
          {!selectedWarehouse && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {t('selectWarehouseAlert')}
              </AlertDescription>
            </Alert>
          )}

          {isProcessing && (
            <div className="flex items-center gap-2 p-4 border rounded-lg bg-muted/50">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              <span>{t('processing')}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}