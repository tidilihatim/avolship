'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

// UI Components
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

// Actions and Types
import { 
  addDuplicateDetectionRule, 
  updateDuplicateDetectionRule 
} from '@/app/actions/duplicate-detection';
import { 
  AVAILABLE_FIELDS, 
  LOGICAL_OPERATOR_OPTIONS, 
  TIME_UNIT_OPTIONS,
  LogicalOperator,
  TimeUnit,
  FieldType
} from '@/types/duplicate-detection';

interface RuleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  rule?: any;
  onSave: () => void;
}

export default function RuleDialog({ isOpen, onClose, rule, onSave }: RuleDialogProps) {
  const t = useTranslations('settings.duplicateDetection');
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    conditions: [] as Array<{ field: FieldType; enabled: boolean }>,
    logicalOperator: LogicalOperator.AND,
    timeWindow: {
      value: 24,
      unit: TimeUnit.HOURS
    },
    isActive: true
  });

  // Initialize form when rule changes
  useEffect(() => {
    if (rule) {
      setFormData({
        name: rule.name || '',
        conditions: rule.conditions || [],
        logicalOperator: rule.logicalOperator || LogicalOperator.AND,
        timeWindow: rule.timeWindow || { value: 24, unit: TimeUnit.HOURS },
        isActive: rule.isActive ?? true
      });
    } else {
      // Reset form for new rule
      setFormData({
        name: '',
        conditions: [],
        logicalOperator: LogicalOperator.AND,
        timeWindow: {
          value: 24,
          unit: TimeUnit.HOURS
        },
        isActive: true
      });
    }
  }, [rule, isOpen]);

  const handleConditionToggle = (field: FieldType, enabled: boolean) => {
    setFormData(prev => ({
      ...prev,
      conditions: enabled
        ? [...prev.conditions.filter(c => c.field !== field), { field, enabled: true }]
        : prev.conditions.filter(c => c.field !== field)
    }));
  };

  const isConditionEnabled = (field: FieldType) => {
    return formData.conditions.some(c => c.field === field && c.enabled);
  };

  const handleSave = async () => {
    // Validation
    if (!formData.name.trim()) {
      toast.error(t('messages.ruleNameRequired'));
      return;
    }

    if (formData.conditions.filter(c => c.enabled).length === 0) {
      toast.error(t('messages.conditionsRequired'));
      return;
    }

    if (!formData.timeWindow.value || formData.timeWindow.value <= 0) {
      toast.error(t('messages.timeWindowRequired'));
      return;
    }

    try {
      setIsSaving(true);
      
      const ruleData = {
        name: formData.name.trim(),
        conditions: formData.conditions.filter(c => c.enabled),
        logicalOperator: formData.logicalOperator,
        timeWindow: formData.timeWindow,
        isActive: formData.isActive
      };

      const response = rule
        ? await updateDuplicateDetectionRule(rule._id, ruleData)
        : await addDuplicateDetectionRule(ruleData);

      if (response.success) {
        toast.success(rule ? t('messages.ruleUpdated') : t('messages.ruleAdded'));
        onSave();
        onClose();
      } else {
        toast.error(response.message || t('messages.errorSaving'));
      }
    } catch (error) {
      console.error('Error saving rule:', error);
      toast.error(t('messages.errorSaving'));
    } finally {
      setIsSaving(false);
    }
  };

  // Group fields by category
  const fieldsByCategory = AVAILABLE_FIELDS.reduce((acc, field) => {
    if (!acc[field.category]) {
      acc[field.category] = [];
    }
    acc[field.category].push(field);
    return acc;
  }, {} as Record<string, typeof AVAILABLE_FIELDS>);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {rule ? t('editRule') : t('addRule')}
          </DialogTitle>
          <DialogDescription>
            Configure conditions and settings for duplicate order detection
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Rule Name */}
          <div className="space-y-2">
            <Label htmlFor="rule-name">{t('ruleName')}</Label>
            <Input
              id="rule-name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder={t('ruleNamePlaceholder')}
            />
          </div>

          {/* Conditions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('conditions')}</CardTitle>
              <CardDescription>
                {t('conditionsDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(fieldsByCategory).map(([category, fields]) => (
                <div key={category} className="space-y-3">
                  <h4 className="font-medium text-sm text-muted-foreground">
                    {t(`categories.${category.toLowerCase()}` as any)}
                  </h4>
                  <div className="grid grid-cols-1 gap-2">
                    {fields.map((field) => (
                      <div key={field.value} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{field.label}</span>
                            {isConditionEnabled(field.value) && (
                              <Badge variant="default" className="text-xs">Selected</Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {field.description}
                          </p>
                        </div>
                        <Switch
                          checked={isConditionEnabled(field.value)}
                          onCheckedChange={(enabled) => handleConditionToggle(field.value, enabled)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Logical Operator */}
          <div className="space-y-2">
            <Label>{t('logicalOperator')}</Label>
            <Select 
              value={formData.logicalOperator} 
              onValueChange={(value) => setFormData(prev => ({ 
                ...prev, 
                logicalOperator: value as LogicalOperator 
              }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LOGICAL_OPERATOR_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div>
                      <div className="font-medium">{option.label}</div>
                      <div className="text-xs text-muted-foreground">{option.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Time Window */}
          <div className="space-y-2">
            <Label>{t('timeWindow')}</Label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                min="1"
                value={formData.timeWindow.value}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  timeWindow: {
                    ...prev.timeWindow,
                    value: parseInt(e.target.value) || 1
                  }
                }))}
                placeholder="Value"
              />
              <Select 
                value={formData.timeWindow.unit} 
                onValueChange={(value) => setFormData(prev => ({
                  ...prev,
                  timeWindow: {
                    ...prev.timeWindow,
                    unit: value as TimeUnit
                  }
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIME_UNIT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {t(`timeUnits.${option.value.toLowerCase()}` as any)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground">
              {t('timeWindowDescription')}
            </p>
          </div>

          <Separator />

          {/* Rule Status */}
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="rule-active" className="text-sm font-medium">
                {t('isActive')}
              </Label>
              <p className="text-xs text-muted-foreground">
                Enable this rule to start detecting duplicates
              </p>
            </div>
            <Switch
              id="rule-active"
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData(prev => ({ 
                ...prev, 
                isActive: checked 
              }))}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            {t('cancel')}
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? t('saving') : t('save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}