import React, { memo, useMemo, useCallback } from 'react';
import { Control, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';

/**
 * Optimized form input component with memoization
 */
export const OptimizedFormInput = memo(({
  control,
  name,
  label,
  placeholder,
  type = 'text',
  disabled = false,
}: {
  control: Control<any>;
  name: string;
  label: string;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
}) => {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input
              {...field}
              type={type}
              placeholder={placeholder}
              disabled={disabled}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
});

OptimizedFormInput.displayName = 'OptimizedFormInput';

/**
 * Optimized select component with memoization
 */
export const OptimizedFormSelect = memo(({
  control,
  name,
  label,
  placeholder,
  options,
  disabled = false,
  onValueChange,
}: {
  control: Control<any>;
  name: string;
  label: string;
  placeholder?: string;
  options: Array<{ value: string; label: string }>;
  disabled?: boolean;
  onValueChange?: (value: string) => void;
}) => {
  const memoizedOptions = useMemo(
    () => options.map(opt => (
      <SelectItem key={opt.value} value={opt.value}>
        {opt.label}
      </SelectItem>
    )),
    [options]
  );

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <Select
            onValueChange={(value) => {
              field.onChange(value);
              onValueChange?.(value);
            }}
            defaultValue={field.value}
            disabled={disabled}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {memoizedOptions}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
});

OptimizedFormSelect.displayName = 'OptimizedFormSelect';

/**
 * Optimized form section wrapper with memoization
 */
export const OptimizedFormSection = memo(({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) => {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
});

OptimizedFormSection.displayName = 'OptimizedFormSection';

/**
 * Optimized dynamic form field list
 */
export const OptimizedFieldArray = memo(({
  fields,
  onAdd,
  onRemove,
  renderField,
  addButtonText = 'Add Item',
}: {
  fields: any[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  renderField: (field: any, index: number) => React.ReactNode;
  addButtonText?: string;
}) => {
  const handleRemove = useCallback((index: number) => {
    onRemove(index);
  }, [onRemove]);

  const memoizedFields = useMemo(
    () => fields.map((field, index) => (
      <div key={field.id || index} className="space-y-4 p-4 border rounded-lg">
        {renderField(field, index)}
        <button
          type="button"
          onClick={() => handleRemove(index)}
          className="text-sm text-red-600 hover:text-red-800"
        >
          Remove
        </button>
      </div>
    )),
    [fields, renderField, handleRemove]
  );

  return (
    <div className="space-y-4">
      {memoizedFields}
      <button
        type="button"
        onClick={onAdd}
        className="w-full py-2 px-4 border border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-gray-400 hover:text-gray-700"
      >
        {addButtonText}
      </button>
    </div>
  );
});

OptimizedFieldArray.displayName = 'OptimizedFieldArray';

/**
 * Hook for form field dependencies with memoization
 */
export function useFormFieldDependency<T>(
  watch: UseFormWatch<any>,
  fieldName: string,
  transformer?: (value: any) => T
): T {
  const watchedValue = watch(fieldName);
  
  return useMemo(() => {
    if (transformer) {
      return transformer(watchedValue);
    }
    return watchedValue as T;
  }, [watchedValue, transformer]);
}

/**
 * Hook for conditional form fields
 */
export function useConditionalField(
  watch: UseFormWatch<any>,
  conditionField: string,
  conditionValue: any
): boolean {
  const currentValue = watch(conditionField);
  
  return useMemo(() => {
    if (Array.isArray(conditionValue)) {
      return conditionValue.includes(currentValue);
    }
    return currentValue === conditionValue;
  }, [currentValue, conditionValue]);
}