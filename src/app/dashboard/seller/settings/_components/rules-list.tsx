'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Edit, Trash2, Eye, EyeOff } from 'lucide-react';

// UI Components
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// Actions and Types
import { 
  deleteDuplicateDetectionRule, 
  updateDuplicateDetectionRule 
} from '@/app/actions/duplicate-detection';
import { AVAILABLE_FIELDS } from '@/types/duplicate-detection';

interface RulesListProps {
  rules: any[];
  onUpdate: (rules: any[]) => void;
  onEdit: (rule: any) => void;
}

export default function RulesList({ rules, onUpdate, onEdit }: RulesListProps) {
  const t = useTranslations('settings.duplicateDetection');
  const [deletingRuleId, setDeletingRuleId] = useState<string | null>(null);
  const [togglingRuleId, setTogglingRuleId] = useState<string | null>(null);

  const handleDeleteRule = async (ruleId: string) => {
    try {
      setDeletingRuleId(ruleId);
      const response = await deleteDuplicateDetectionRule(ruleId);
      
      if (response.success) {
        onUpdate(response.data.rules);
        toast.success(t('messages.ruleDeleted'));
      } else {
        toast.error(response.message || t('messages.errorSaving'));
      }
    } catch (error) {
      console.error('Error deleting rule:', error);
      toast.error(t('messages.errorSaving'));
    } finally {
      setDeletingRuleId(null);
    }
  };

  const handleToggleRule = async (rule: any) => {
    try {
      setTogglingRuleId(rule._id);
      const response = await updateDuplicateDetectionRule(rule._id, {
        isActive: !rule.isActive
      });
      
      if (response.success) {
        onUpdate(response.data.rules);
        toast.success(t('messages.ruleUpdated'));
      } else {
        toast.error(response.message || t('messages.errorSaving'));
      }
    } catch (error) {
      console.error('Error toggling rule:', error);
      toast.error(t('messages.errorSaving'));
    } finally {
      setTogglingRuleId(null);
    }
  };

  const getFieldLabel = (fieldValue: string) => {
    const field = AVAILABLE_FIELDS.find(f => f.value === fieldValue);
    return field ? t(`fields.${field.value.split('.').pop()}` as any) : fieldValue;
  };

  const getOperatorLabel = (operator: string) => {
    return operator === 'AND' 
      ? t('operators.and') 
      : t('operators.or');
  };

  if (rules.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-muted-foreground mb-2">
          <Edit className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <h3 className="text-lg font-medium">{t('noRules')}</h3>
          <p className="text-sm">{t('noRulesDescription')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Rule Name</TableHead>
            <TableHead>Conditions</TableHead>
            <TableHead>Logic</TableHead>
            <TableHead>Time Window</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rules.map((rule) => (
            <TableRow key={rule._id}>
              <TableCell className="font-medium">
                {rule.name}
              </TableCell>
              
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {rule.conditions
                    .filter((condition: any) => condition.enabled)
                    .map((condition: any, index: number) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {getFieldLabel(condition.field)}
                      </Badge>
                    ))}
                </div>
              </TableCell>
              
              <TableCell>
                <Badge variant="secondary" className="text-xs">
                  {rule.logicalOperator}
                </Badge>
              </TableCell>
              
              <TableCell>
                <span className="text-sm">
                  {rule.timeWindow.value} {t(`timeUnits.${rule.timeWindow.unit.toLowerCase()}` as any)}
                </span>
              </TableCell>
              
              <TableCell>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant={rule.isActive ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {rule.isActive ? t('isActive') : 'Inactive'}
                  </Badge>
                </div>
              </TableCell>
              
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  {/* Toggle Active/Inactive */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleRule(rule)}
                    disabled={togglingRuleId === rule._id}
                    title={rule.isActive ? 'Deactivate rule' : 'Activate rule'}
                  >
                    {rule.isActive ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </Button>
                  
                  {/* Edit Rule */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(rule)}
                    title="Edit rule"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  
                  {/* Delete Rule */}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={deletingRuleId === rule._id}
                        title="Delete rule"
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Rule</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete the rule "{rule.name}"? 
                          This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteRule(rule._id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}