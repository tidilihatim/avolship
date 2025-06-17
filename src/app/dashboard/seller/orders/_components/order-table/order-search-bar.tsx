"use client";

import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslations } from "next-intl";

interface OrderSearchBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export default function OrderSearchBar({
  search,
  onSearchChange,
  onSubmit,
}: OrderSearchBarProps) {
  const t = useTranslations();

  return (
    <form onSubmit={onSubmit} className="flex w-full sm:w-auto gap-2">
      <div className="relative flex-1 sm:min-w-[300px]">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
        <Input
          type="search"
          placeholder={t("orders.searchOrders")}
          className="pl-8"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <Button type="submit" variant="default">
        {t("orders.applyFilters")}
      </Button>
    </form>
  );
}