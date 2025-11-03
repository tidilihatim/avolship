"use client";

import { TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useTranslations } from "next-intl";
import { ColumnVisibility } from "./column-toggle";

interface OrderTableHeaderProps {
  isAdminOrModerator: boolean;
  columnVisibility: ColumnVisibility;
}

export default function OrderTableHeader({
  isAdminOrModerator,
  columnVisibility,
}: OrderTableHeaderProps) {
  const t = useTranslations();

  return (
    <TableHeader>
      <TableRow>
        {columnVisibility.orderId && (
          <TableHead>{t("orders.fields.orderId")}</TableHead>
        )}
        {columnVisibility.customer && (
          <TableHead>{t("orders.fields.customer")}</TableHead>
        )}
        {columnVisibility.warehouse && (
          <TableHead className="table-cell">
            {t("orders.fields.warehouse")}
          </TableHead>
        )}
        {isAdminOrModerator && columnVisibility.seller && (
          <TableHead className="table-cell">
            {t("orders.fields.seller")}
          </TableHead>
        )}
        {isAdminOrModerator && columnVisibility.assignedAgent && (
          <TableHead className="table-cell">
            {t("orders.fields.assignedAgent")}
          </TableHead>
        )}
        {columnVisibility.assignedRider && (
          <TableHead className="table-cell">
            {t("orders.fields.assignedRider")}
          </TableHead>
        )}
        {columnVisibility.deliveryTracking && (
          <TableHead className="table-cell">
            {t("orders.fields.deliveryTracking")}
          </TableHead>
        )}
        {columnVisibility.products && (
          <TableHead className="table-cell">
            {t("orders.fields.products")}
          </TableHead>
        )}
        {columnVisibility.totalPrice && (
          <TableHead>{t("orders.fields.totalPrice")}</TableHead>
        )}
        {isAdminOrModerator && columnVisibility.callCenterCommission && (
          <TableHead className="table-cell">
            {t("orders.fields.callCenterCommission")}
          </TableHead>
        )}
        {columnVisibility.status && (
          <TableHead>{t("orders.fields.status")}</TableHead>
        )}
        {columnVisibility.callAttempts && (
          <TableHead className="table-cell">
            {t("orders.fields.callAttempts")}
          </TableHead>
        )}
        {columnVisibility.orderDate && (
          <TableHead className="table-cell">
            {t("orders.fields.orderDate")}
          </TableHead>
        )}
        {columnVisibility.actions && (
          <TableHead className="text-right">{t("common.actions")}</TableHead>
        )}
      </TableRow>
    </TableHeader>
  );
}