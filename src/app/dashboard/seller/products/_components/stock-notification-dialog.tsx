"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Bell, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { updateProductStockNotifications } from "@/app/actions/product";

interface StockNotificationLevel {
  threshold: number;
  enabled: boolean;
}

interface StockNotificationDialogProps {
  productId: string;
  productName: string;
  currentLevels?: StockNotificationLevel[];
}

export function StockNotificationDialog({
  productId,
  productName,
  currentLevels = [],
}: StockNotificationDialogProps) {
  const t = useTranslations("products.stockNotifications");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [levels, setLevels] = useState<StockNotificationLevel[]>(
    currentLevels.length > 0
      ? currentLevels
      : [{ threshold: 0, enabled: true }]
  );

  const handleAddLevel = () => {
    if (levels.length >= 5) {
      toast.error(t("maxLevelsReached"));
      return;
    }
    setLevels([...levels, { threshold: 0, enabled: true }]);
  };

  const handleRemoveLevel = (index: number) => {
    setLevels(levels.filter((_, i) => i !== index));
  };

  const handleThresholdChange = (index: number, value: string) => {
    const threshold = parseInt(value) || 0;
    const newLevels = [...levels];
    newLevels[index] = { ...newLevels[index], threshold };
    setLevels(newLevels);
  };

  const handleEnabledChange = (index: number, enabled: boolean) => {
    const newLevels = [...levels];
    newLevels[index] = { ...newLevels[index], enabled };
    setLevels(newLevels);
  };

  const handleSave = () => {
    // Validate thresholds
    const validLevels = levels.filter(
      (level) => level.threshold >= 0 && level.enabled
    );

    // Check for duplicate thresholds
    const thresholds = validLevels.map((l) => l.threshold);
    const uniqueThresholds = new Set(thresholds);
    if (thresholds.length !== uniqueThresholds.size) {
      toast.error(t("duplicateThresholds"));
      return;
    }

    // Sort levels by threshold in descending order
    const sortedLevels = validLevels.sort((a, b) => b.threshold - a.threshold);

    startTransition(async () => {
      const result = await updateProductStockNotifications(
        productId,
        sortedLevels
      );

      if (result.success) {
        toast.success(t("updateSuccess"));
        setOpen(false);
        router.refresh();
      } else {
        toast.error(result.message || t("updateError"));
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
          <Bell className="mr-2 h-4 w-4" />
          {t("setupNotifications")}
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>
            {t("description", { productName })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-3">
            {levels.map((level, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 rounded-lg border"
              >
                <div className="flex-1 space-y-2">
                  <Label htmlFor={`threshold-${index}`}>
                    {t("level")} {index + 1}
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id={`threshold-${index}`}
                      type="number"
                      min="0"
                      value={level.threshold}
                      onChange={(e) =>
                        handleThresholdChange(index, e.target.value)
                      }
                      placeholder={t("thresholdPlaceholder")}
                      className="flex-1"
                    />
                    <div className="flex items-center gap-2">
                      <Switch
                        id={`enabled-${index}`}
                        checked={level.enabled}
                        onCheckedChange={(checked) =>
                          handleEnabledChange(index, checked)
                        }
                      />
                      <Label
                        htmlFor={`enabled-${index}`}
                        className="text-sm text-muted-foreground cursor-pointer"
                      >
                        {level.enabled ? t("enabled") : t("disabled")}
                      </Label>
                    </div>
                  </div>
                </div>
                {levels.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveLevel(index)}
                    className="h-8 w-8"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          {levels.length < 5 && (
            <Button
              type="button"
              variant="outline"
              onClick={handleAddLevel}
              className="w-full"
            >
              <Plus className="mr-2 h-4 w-4" />
              {t("addLevel")}
            </Button>
          )}

          <p className="text-sm text-muted-foreground">{t("hint")}</p>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            {t("cancel")}
          </Button>
          <Button type="button" onClick={handleSave} disabled={isPending}>
            {isPending ? t("saving") : t("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
