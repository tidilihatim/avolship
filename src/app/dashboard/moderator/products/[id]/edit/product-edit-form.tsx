"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Save, Loader2, Plus, Trash2, Upload } from "lucide-react";

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
  redirectPath?: string;
}

interface WarehouseStock {
  warehouseId: string;
  stock: number;
}

export default function ProductEditForm({
  product,
  warehouses,
  productId,
  redirectPath = "/dashboard/admin/products"
}: ProductEditFormProps) {
  const router = useRouter();
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
      stock: w.stock
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

  // Add warehouse
  const addWarehouse = (warehouseId: string) => {
    if (!warehouseStocks.find(w => w.warehouseId === warehouseId)) {
      setWarehouseStocks(prev => [...prev, { warehouseId, stock: 0 }]);
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
        router.push(`${redirectPath}/${productId}`);
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
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Update the basic product details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter product name"
                className={errors.name ? "border-destructive" : ""}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Enter product description"
                rows={3}
                className={errors.description ? "border-destructive" : ""}
              />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Product Code *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => handleInputChange('code', e.target.value)}
                  placeholder="Enter product code"
                  className={errors.code ? "border-destructive" : ""}
                />
                {errors.code && (
                  <p className="text-sm text-destructive">{errors.code}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="variantCode">Variant Code</Label>
                <Input
                  id="variantCode"
                  value={formData.variantCode}
                  onChange={(e) => handleInputChange('variantCode', e.target.value)}
                  placeholder="Enter variant code"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="verificationLink">Verification Link</Label>
              <Input
                id="verificationLink"
                type="url"
                value={formData.verificationLink}
                onChange={(e) => handleInputChange('verificationLink', e.target.value)}
                placeholder="https://example.com/verify"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ProductStatus.ACTIVE}>Active</SelectItem>
                  <SelectItem value={ProductStatus.INACTIVE}>Inactive</SelectItem>
                  <SelectItem value={ProductStatus.OUT_OF_STOCK}>Out of Stock</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Warehouse Inventory */}
        <Card>
          <CardHeader>
            <CardTitle>Warehouse Inventory</CardTitle>
            <CardDescription>
              Manage stock levels across warehouses
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Current Warehouses */}
            {warehouseStocks.map((warehouseStock, index) => (
              <div key={warehouseStock.warehouseId} className="flex items-center gap-3 p-3 border rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-sm">
                    {getWarehouseName(warehouseStock.warehouseId)}
                  </p>
                </div>
                <div className="w-24">
                  <Input
                    type="number"
                    min="0"
                    value={warehouseStock.stock}
                    onChange={(e) => handleStockChange(warehouseStock.warehouseId, e.target.value)}
                    placeholder="Stock"
                  />
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
            ))}

            {/* Add Warehouse */}
            {availableWarehouses.length > 0 && (
              <div className="space-y-2">
                <Label>Add Warehouse</Label>
                <Select onValueChange={addWarehouse}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select warehouse to add" />
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
                No warehouses selected. Add at least one warehouse.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Product Image */}
      <Card>
        <CardHeader>
          <CardTitle>Product Image</CardTitle>
          <CardDescription>
            Current product image
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
                <p className="text-sm font-medium">Current Image</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center p-8 border-2 border-dashed rounded-lg">
              <div className="text-center">
                <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No image uploaded</p>
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
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Updating...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Update Product
            </>
          )}
        </Button>
      </div>
    </form>
  );
}