"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Save, Loader2, Plus, Trash2, Upload } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import { ProductTableData } from "@/types/product";
import { ProductStatus } from "@/lib/db/models/product";
import { updateProduct } from "@/app/actions/product";

interface ProductEditFormProps {
  product: ProductTableData;
  warehouses: { _id: string; name: string; country: string }[];
  productId: string;
}

interface WarehouseStock {
  warehouseId: string;
  stock: number;
  defectiveQuantity: number;
}

export default function ProductEditForm({ product, warehouses, productId }: ProductEditFormProps) {
  const router = useRouter();
  const t = useTranslations("products.editForm");
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: product.name,
    description: product.description,
    code: product.code,
    variantCode: product.variantCode || "",
    verificationLink: product.verificationLink || "",
    status: product.status,
  });

  const [warehouseStocks, setWarehouseStocks] = useState<WarehouseStock[]>(
    product.warehouses.map(w => ({
      warehouseId: w.warehouseId,
      stock: w.stock,
      defectiveQuantity: w.defectiveQuantity || 0
    }))
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Handle form field changes
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  // Handle warehouse stock changes
  const handleStockChange = (warehouseId: string, stock: string) => {
    const stockNumber = parseInt(stock) || 0;
    setWarehouseStocks(prev =>
      prev.map(w =>
        w.warehouseId === warehouseId ? { ...w, stock: stockNumber } : w
      )
    );
  };

  // Handle defective quantity changes
  const handleDefectiveQuantityChange = (warehouseId: string, quantity: string) => {
    const quantityNumber = parseInt(quantity) || 0;
    setWarehouseStocks(prev =>
      prev.map(w =>
        w.warehouseId === warehouseId ? { ...w, defectiveQuantity: quantityNumber } : w
      )
    );
  };

  // Add warehouse
  const addWarehouse = (warehouseId: string) => {
    if (!warehouseStocks.find(w => w.warehouseId === warehouseId)) {
      setWarehouseStocks(prev => [...prev, { warehouseId, stock: 0, defectiveQuantity: 0 }]);
    }
  };

  // Remove warehouse
  const removeWarehouse = (warehouseId: string) => {
    setWarehouseStocks(prev => prev.filter(w => w.warehouseId !== warehouseId));
  };

  // Get warehouse name by ID
  const getWarehouseName = (warehouseId: string) => {
    const warehouse = warehouses.find(w => w._id === warehouseId);
    return warehouse ? `${warehouse.name} (${warehouse.country})` : 'Unknown Warehouse';
  };

  // Get available warehouses (not already selected)
  const availableWarehouses = warehouses.filter(
    w => !warehouseStocks.find(ws => ws.warehouseId === w._id)
  );

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    try {
      // Validate required fields
      const newErrors: Record<string, string> = {};

      if (!formData.name.trim()) {
        newErrors.name = "Product name is required";
      }

      if (!formData.description.trim()) {
        newErrors.description = "Product description is required";
      }

      if (!formData.code.trim()) {
        newErrors.code = "Product code is required";
      }

      if (warehouseStocks.length === 0) {
        newErrors.warehouses = "At least one warehouse must be selected";
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        setIsLoading(false);
        return;
      }

      // Prepare data for API
      const updateData = {
        ...formData,
        warehouses: warehouseStocks,
        image: product.image // Keep existing image for now
      };

      const result = await updateProduct(productId, updateData);

      if (result.success) {
        toast.success('Product updated successfully');
        router.push(`/dashboard/admin/products/${productId}`);
      } else {
        if (result.errors) {
          setErrors(result.errors);
        }
        toast.error(result.message || 'Failed to update product');
      }
    } catch (error) {
      toast.error('An error occurred while updating the product');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>{t("basicInfo.title")}</CardTitle>
            <CardDescription>
              {t("basicInfo.description")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t("labels.productName")}</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder={t("placeholders.productName")}
                className={errors.name ? "border-destructive" : ""}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t("labels.description")}</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder={t("placeholders.description")}
                rows={3}
                className={errors.description ? "border-destructive" : ""}
              />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">{t("labels.productCode")}</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => handleInputChange('code', e.target.value)}
                  placeholder={t("placeholders.productCode")}
                  className={errors.code ? "border-destructive" : ""}
                />
                {errors.code && (
                  <p className="text-sm text-destructive">{errors.code}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="variantCode">{t("labels.variantCode")}</Label>
                <Input
                  id="variantCode"
                  value={formData.variantCode}
                  onChange={(e) => handleInputChange('variantCode', e.target.value)}
                  placeholder={t("placeholders.variantCode")}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="verificationLink">{t("labels.verificationLink")}</Label>
              <Input
                id="verificationLink"
                type="url"
                value={formData.verificationLink}
                onChange={(e) => handleInputChange('verificationLink', e.target.value)}
                placeholder={t("placeholders.verificationLink")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">{t("labels.status")}</Label>
              <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                <SelectTrigger>
                  <SelectValue placeholder={t("placeholders.selectStatus")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ProductStatus.ACTIVE}>{t("status.active")}</SelectItem>
                  <SelectItem value={ProductStatus.INACTIVE}>{t("status.inactive")}</SelectItem>
                  <SelectItem value={ProductStatus.OUT_OF_STOCK}>{t("status.outOfStock")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Warehouse Inventory */}
        <Card>
          <CardHeader>
            <CardTitle>{t("warehouseInventory.title")}</CardTitle>
            <CardDescription>
              {t("warehouseInventory.description")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Current Warehouses */}
            {warehouseStocks.map((warehouseStock, index) => (
              <div key={warehouseStock.warehouseId} className="space-y-2 p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <p className="font-medium text-sm">
                      {getWarehouseName(warehouseStock.warehouseId)}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeWarehouse(warehouseStock.warehouseId)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">{t("labels.stock")}</Label>
                    <Input
                      type="number"
                      min="0"
                      value={warehouseStock.stock}
                      onChange={(e) => handleStockChange(warehouseStock.warehouseId, e.target.value)}
                      placeholder={t("placeholders.stock")}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">{t("labels.defectiveQty")}</Label>
                    <Input
                      type="number"
                      min="0"
                      value={warehouseStock.defectiveQuantity}
                      onChange={(e) => handleDefectiveQuantityChange(warehouseStock.warehouseId, e.target.value)}
                      placeholder={t("placeholders.defective")}
                    />
                  </div>
                </div>
              </div>
            ))}

            {/* Add Warehouse */}
            {availableWarehouses.length > 0 && (
              <div className="space-y-2">
                <Label>{t("labels.addWarehouse")}</Label>
                <Select onValueChange={addWarehouse}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("placeholders.selectWarehouse")} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableWarehouses.map((warehouse) => (
                      <SelectItem key={warehouse._id} value={warehouse._id}>
                        {warehouse.name} ({warehouse.country})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {errors.warehouses && (
              <p className="text-sm text-destructive">{errors.warehouses}</p>
            )}

            {warehouseStocks.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                {t("messages.noWarehouses")}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Product Image */}
      <Card>
        <CardHeader>
          <CardTitle>{t("productImage.title")}</CardTitle>
          <CardDescription>
            {t("productImage.description")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {product.image ? (
            <div className="flex items-center gap-4">
              <img
                src={product.image.url}
                alt={product.name}
                className="w-24 h-24 rounded-lg object-cover border"
              />
              <div>
                <p className="text-sm font-medium">{t("messages.currentImage")}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center p-8 border-2 border-dashed rounded-lg">
              <div className="text-center">
                <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">{t("messages.noImage")}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          {t("buttons.cancel")}
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {t("buttons.updating")}
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              {t("buttons.update")}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}