'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Plus, Settings } from 'lucide-react';

// UI Components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';

// Custom Components
import RulesList from './rules-list';
import RuleDialog from './rule-dialog';

// Actions and Types
import { 
  getDuplicateDetectionSettings, 
  updateDuplicateDetectionSettings 
} from '@/app/actions/duplicate-detection';
import { DuplicateDetectionSettings as IDuplicateDetectionSettings } from '@/types/duplicate-detection';

export default function DuplicateDetectionSettings() {
  const t = useTranslations('settings.duplicateDetection');
  
  // State
  const [settings, setSettings] = useState<IDuplicateDetectionSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const response = await getDuplicateDetectionSettings();
      
      if (response.success) {
        setSettings(response.data);
      } else {
        toast.error(response.message || t('messages.errorLoading'));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error(t('messages.errorLoading'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnabledToggle = async (enabled: boolean) => {
    if (!settings) return;

    try {
      setIsSaving(true);
      const response = await updateDuplicateDetectionSettings({
        isEnabled: enabled,
        defaultTimeWindow: settings.defaultTimeWindow,
        rules: settings.rules
      });

      if (response.success) {
        setSettings({ ...settings, isEnabled: enabled });
        toast.success(t('messages.settingsSaved'));
      } else {
        toast.error(response.message || t('messages.errorSaving'));
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error(t('messages.errorSaving'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDefaultTimeWindowUpdate = async (timeWindow: { value: number; unit: string }) => {
    if (!settings) return;

    try {
      setIsSaving(true);
      const response = await updateDuplicateDetectionSettings({
        isEnabled: settings.isEnabled,
        defaultTimeWindow: timeWindow,
        rules: settings.rules
      });

      if (response.success) {
        setSettings({ ...settings, defaultTimeWindow: timeWindow as any });
        toast.success(t('messages.settingsSaved'));
      } else {
        toast.error(response.message || t('messages.errorSaving'));
      }
    } catch (error) {
      console.error('Error updating default time window:', error);
      toast.error(t('messages.errorSaving'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleRuleUpdate = (updatedRules: any[]) => {
    if (!settings) return;
    setSettings({ ...settings, rules: updatedRules });
  };

  const handleAddRule = () => {
    setEditingRule(null);
    setIsDialogOpen(true);
  };

  const handleEditRule = (rule: any) => {
    setEditingRule(rule);
    setIsDialogOpen(true);
  };

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (!settings) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Settings className="w-12 h-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">Failed to Load Settings</h3>
        <p className="text-muted-foreground mb-4">
          Unable to load duplicate detection settings.
        </p>
        <Button onClick={loadSettings} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enable/Disable Toggle */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">{t('title')}</CardTitle>
              <CardDescription>
                {t('description')}
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Label htmlFor="enable-detection" className="text-sm">
                {t('enableToggle')}
              </Label>
              <Switch
                id="enable-detection"
                checked={settings.isEnabled}
                onCheckedChange={handleEnabledToggle}
                disabled={isSaving}
              />
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Settings Content - Only show when enabled */}
      {settings.isEnabled && (
        <>
          {/* Rules Management */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{t('detectionRulesTitle')}</CardTitle>
                  <CardDescription>
                    {t('detectionRulesDescription')}
                  </CardDescription>
                </div>
                <Button onClick={handleAddRule} size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  {t('addRule')}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <RulesList
                rules={settings.rules}
                onUpdate={handleRuleUpdate}
                onEdit={handleEditRule}
              />
            </CardContent>
          </Card>
        </>
      )}

      {/* Rule Dialog */}
      <RuleDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        rule={editingRule}
        onSave={loadSettings}
      />
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-6 w-64" />
              <Skeleton className="h-4 w-96" />
            </div>
            <Skeleton className="h-6 w-12" />
          </div>
        </CardHeader>
      </Card>
      
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}