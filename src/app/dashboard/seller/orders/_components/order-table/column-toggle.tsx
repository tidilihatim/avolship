"use client";

import { useState, useEffect } from "react";
import { Settings, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslations } from "next-intl";

export interface ColumnVisibility {
  orderId: boolean;
  customer: boolean;
  warehouse: boolean;
  deliveryTracking: boolean;
  seller: boolean;
  assignedAgent: boolean;
  assignedRider: boolean;
  products: boolean;
  totalPrice: boolean;
  callCenterCommission: boolean;
  status: boolean;
  callAttempts: boolean;
  orderDate: boolean;
  actions: boolean;
}

interface ColumnToggleProps {
  isAdminOrModerator: boolean;
  columnVisibility: ColumnVisibility;
  onColumnVisibilityChange: (visibility: ColumnVisibility) => void;
}

const DEFAULT_COLUMN_VISIBILITY: ColumnVisibility = {
  orderId: true,
  customer: true,
  warehouse: true,
  seller: true,
  deliveryTracking: true,
  assignedAgent: true,
  assignedRider: true,
  products: true,
  totalPrice: true,
  callCenterCommission: true,
  status: true,
  callAttempts: true,
  orderDate: true,
  actions: true,
};

export default function ColumnToggle({
  isAdminOrModerator,
  columnVisibility,
  onColumnVisibilityChange,
}: ColumnToggleProps) {
  const t = useTranslations();

  const columns = [
    { key: 'orderId', label: t("orders.fields.orderId"), alwaysVisible: false },
    { key: 'customer', label: t("orders.fields.customer"), alwaysVisible: false },
    { key: 'warehouse', label: t("orders.fields.warehouse"), alwaysVisible: false },
    { key: 'seller', label: t("orders.fields.seller"), alwaysVisible: false, adminOnly: true },
    { key: 'assignedAgent', label: t("orders.fields.assignedAgent"), alwaysVisible: false, adminOnly: true },
    { key: 'assignedRider', label: 'Assigned Rider', alwaysVisible: false },
    { key: 'products', label: t("orders.fields.products"), alwaysVisible: false },
    { key: 'totalPrice', label: t("orders.fields.totalPrice"), alwaysVisible: false },
    { key: 'callCenterCommission', label: t("orders.fields.callCenterCommission"), alwaysVisible: false, adminOnly: true },
    { key: 'status', label: t("orders.fields.status"), alwaysVisible: false },
    { key: 'callAttempts', label: t("orders.fields.callAttempts"), alwaysVisible: false },
    { key: 'orderDate', label: t("orders.fields.orderDate"), alwaysVisible: false },
    { key: 'actions', label: t("common.actions"), alwaysVisible: false },
  ];

  const handleColumnToggle = (columnKey: string, checked: boolean) => {
    const newVisibility = {
      ...columnVisibility,
      [columnKey]: checked,
    };
    onColumnVisibilityChange(newVisibility);
  };

  const handleResetToDefault = () => {
    onColumnVisibilityChange(DEFAULT_COLUMN_VISIBILITY);
  };

  const getVisibleColumnsCount = () => {
    return Object.values(columnVisibility).filter(Boolean).length;
  };

  const getAvailableColumns = () => {
    return columns.filter(column => 
      !column.adminOnly || (column.adminOnly && isAdminOrModerator)
    );
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="flex gap-2">
          <Settings className="h-4 w-4" />
          Columns ({getVisibleColumnsCount()})
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Show/Hide Columns</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <div className="max-h-64 overflow-y-auto">
          {getAvailableColumns().map((column) => (
            <DropdownMenuItem
              key={column.key}
              className="flex items-center space-x-2 cursor-pointer"
              onSelect={(e) => e.preventDefault()}
            >
              <Checkbox
                id={column.key}
                checked={columnVisibility[column.key as keyof ColumnVisibility]}
                onCheckedChange={(checked) => 
                  handleColumnToggle(column.key, checked as boolean)
                }
              />
              <label 
                htmlFor={column.key} 
                className="flex-1 text-sm cursor-pointer flex items-center gap-2"
              >
                {columnVisibility[column.key as keyof ColumnVisibility] ? (
                  <Eye className="h-3 w-3" />
                ) : (
                  <EyeOff className="h-3 w-3" />
                )}
                {column.label}
              </label>
            </DropdownMenuItem>
          ))}
        </div>
        
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleResetToDefault}>
          Reset to Default
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { DEFAULT_COLUMN_VISIBILITY };