"use client";

import { TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useTranslations } from "next-intl";

interface OrderTableHeaderProps {
  isAdminOrModerator: boolean;
}

export default function OrderTableHeader({
  isAdminOrModerator,
}: OrderTableHeaderProps) {
  const t = useTranslations();

  return (
    <TableHeader>
      <TableRow>
        <TableHead>{t("orders.fields.orderId")}</TableHead>
        <TableHead>{t("orders.fields.customer")}</TableHead>
        <TableHead className="table-cell">
          {t("orders.fields.warehouse")}
        </TableHead>
        {isAdminOrModerator && (
          <TableHead className="table-cell">
            {t("orders.fields.seller")}
          </TableHead>
        )}
        {isAdminOrModerator && (
          <TableHead className="table-cell">
            {t("orders.fields.assignedAgent")}
          </TableHead>
        )}
        <TableHead className="table-cell">
          {t("orders.fields.products")}
        </TableHead>
        <TableHead>{t("orders.fields.totalPrice")}</TableHead>
        <TableHead>{t("orders.fields.status")}</TableHead>
        <TableHead className="table-cell">
          {t("orders.fields.callAttempts")}
        </TableHead>
        <TableHead className="table-cell">
          {t("orders.fields.orderDate")}
        </TableHead>
        <TableHead className="text-right">{t("common.actions")}</TableHead>
      </TableRow>
    </TableHeader>
  );
}