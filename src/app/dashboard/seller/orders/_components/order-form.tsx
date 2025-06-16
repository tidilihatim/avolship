// src/app/dashboard/seller/orders/_components/order-form.tsx
"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Plus,
  X,
  Package,
  User,
  Building,
  AlertTriangle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

import {
  OrderInput,
  ProductOption,
  SelectedProduct,
  OrderFormProps,
} from "@/types/order";
import {
  createOrder,
  getProductsForOrder,
  getWarehousesForOrder,
} from "@/app/actions/order";

/**
 * OrderForm Component
 * Provides a form for creating orders with product and expedition selection
 */
export default function OrderForm({
  order,
  warehouses = [],
  isEdit = false,
  currentUser,
}: OrderFormProps) {
  const t = useTranslations("orders"); // Assuming 'orders' namespace
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
  const [availableProducts, setAvailableProducts] = useState<ProductOption[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [warehouseCurrency, setWarehouseCurrency] = useState("USD");
  const [availableWarehouses, setAvailableWarehouses] = useState(warehouses);

  // Form state
  const [formData, setFormData] = useState({
    customerName: "",
    phoneNumbers: "",
    shippingAddress: "",
    warehouseId: "",
  });

  // Load warehouses on component mount
  useEffect(() => {
    loadWarehouses();
  }, []);

  // Load warehouses for current user
  const loadWarehouses = async () => {
    try {
      const result = await getWarehousesForOrder();
      if (result.success) {
        setAvailableWarehouses(result.warehouses || []);
      } else {
        toast.error(result.message || t("form.messages.failedToLoadWarehouses"));
      }
    } catch (error) {
      console.error("Error loading warehouses:", error);
      toast.error(t("form.messages.failedToLoadWarehouses"));
    }
  };

  // Load products when warehouse changes
  useEffect(() => {
    if (formData.warehouseId) {
      loadProductsForWarehouse(formData.warehouseId);
      const selectedWarehouse = availableWarehouses.find(
        (w) => w._id === formData.warehouseId
      );
      if (selectedWarehouse) {
        setWarehouseCurrency(selectedWarehouse.currency);
      }
    } else {
      setAvailableProducts([]);
      setSelectedProducts([]);
      setWarehouseCurrency("USD");
    }
  }, [formData.warehouseId, availableWarehouses]);

  // Load products for selected warehouse
  const loadProductsForWarehouse = async (warehouseId: string) => {
    setIsLoadingProducts(true);
    try {
      const products: any = await getProductsForOrder(warehouseId);
      setAvailableProducts(products);
      setSelectedProducts([]);
    } catch (error) {
      console.error("Error loading products:", error);
      toast.error(t("form.messages.failedToLoadProducts"));
      setAvailableProducts([]);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  // Handle input changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    if (name && value) {
      setFormData({
        ...formData,
        [name]: value,
      });

      if (name === "warehouseId") {
        setSelectedProducts([]);
      }
    }
  };

  // Add product to order
  const handleAddProduct = (product: ProductOption) => {
    const isAlreadySelected = selectedProducts.some(
      (p) => p._id === product._id
    );
    if (isAlreadySelected) {
      toast.error(t("form.messages.productAlreadySelected"));
      return;
    }

    if (!product.availableExpeditions || product.availableExpeditions.length === 0) {
      toast.error(
        t("form.messages.productHasNoExpeditions", { productName: product.name })
      );
      return;
    }

    const defaultExpedition = product.availableExpeditions[0];

    const newProduct: SelectedProduct = {
      ...product,
      quantity: 1,
      unitPrice: defaultExpedition.unitPrice,
      expeditionId: defaultExpedition._id,
      expeditionCode: defaultExpedition.expeditionCode,
    };

    setSelectedProducts([...selectedProducts, newProduct]);
  };

  // Remove product from order
  const handleRemoveProduct = (productId: string) => {
    if (productId) {
      setSelectedProducts(selectedProducts.filter((p) => p._id !== productId));
    }
  };

  // Update product quantity
  const handleUpdateProductQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) return;

    setSelectedProducts(
      selectedProducts.map((p) =>
        p._id === productId ? { ...p, quantity } : p
      )
    );
  };

  // Update product expedition
  const handleUpdateProductExpedition = (productId: string, expeditionId: string) => {
    setSelectedProducts(
      selectedProducts.map((p) => {
        if (p._id === productId) {
          const selectedExpedition = p.availableExpeditions.find(
            (exp:any) => exp._id === expeditionId
          );
          if (selectedExpedition) {
            return {
              ...p,
              expeditionId,
              expeditionCode: selectedExpedition.expeditionCode,
              unitPrice: selectedExpedition.unitPrice,
            };
          }
        }
        return p;
      })
    );
  };

  // Currency formatter helper
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", { // Consider making locale for NumberFormat dynamic if needed
      style: "currency",
      currency: warehouseCurrency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Simple validation
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.customerName.trim()) {
      newErrors.customerName = t("form.validations.customerNameRequired");
    }
    if (!formData.phoneNumbers.trim()) {
      newErrors.phoneNumbers = t("form.validations.phoneNumbersRequired");
    }
    if (!formData.shippingAddress.trim()) {
      newErrors.shippingAddress = t("form.validations.shippingAddressRequired");
    }
    if (!formData.warehouseId) {
      newErrors.warehouseId = t("form.validations.warehouseRequired");
    }
    if (selectedProducts.length === 0) {
      newErrors.products = t("form.validations.productsRequired");
    }
    for (const product of selectedProducts) {
      if (!product.expeditionId) {
        newErrors.products = t("form.validations.productNeedsExpedition", { productName: product.name });
        break;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Form submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      const firstErrorKey = Object.keys(errors)[0];
      const firstError = errors[firstErrorKey]; // Get the already translated error message
      if (firstError) {
        toast.error(firstError);
      }
      return;
    }

    setIsSubmitting(true);

    try {
      const phoneNumbers = formData.phoneNumbers
        .split("|")
        .map((phone) => phone.trim())
        .filter(Boolean);

      const orderData: OrderInput = {
        customer: {
          name: formData.customerName,
          phoneNumbers,
          shippingAddress: formData.shippingAddress,
        },
        warehouseId: formData.warehouseId,
        products: selectedProducts.map((p) => ({
          productId: p._id,
          quantity: p.quantity,
          unitPrice: p.unitPrice,
          expeditionId: p.expeditionId,
        })),
      };

      const result = await createOrder(orderData);

      if (!result.success) {
        toast.error(result.message || t("form.messages.failedToCreateOrder"));
      } else {
        if (result.isDouble && result.doubleOrderCount! > 0) {
          toast.warning(
            t("form.messages.orderCreatedWithDoubleOrderWarning", { count: result.doubleOrderCount })
          );
        } else {
          toast.success(t("orderCreated")); // Using existing key from your provided JSON
        }
        router.push("/dashboard/seller/orders");
      }
    } catch (error) {
      console.error("Error creating order:", error);
      toast.error(t("form.messages.unexpectedErrorCreatingOrder"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalProducts = selectedProducts.length;
  const totalQuantity = selectedProducts.reduce((sum, p) => sum + p.quantity, 0);
  const totalValue = selectedProducts.reduce(
    (sum, p) => sum + p.unitPrice * p.quantity,
    0
  );

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>
          {isEdit ? t("form.titleEdit") : t("form.titleCreate")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Customer Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <User className="h-5 w-5" />
              {t("form.customerInfoTitle")}
            </h3>
            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customerName" className="text-sm font-medium">
                  {t("form.fullNameLabel")} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="customerName"
                  name="customerName"
                  value={formData.customerName}
                  onChange={handleChange}
                  placeholder={t("form.fullNamePlaceholder")}
                  className={errors.customerName ? "border-destructive" : ""}
                />
                {errors.customerName && (
                  <p className="text-sm text-destructive">{errors.customerName}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phoneNumbers" className="text-sm font-medium">
                  {t("form.phoneNumbersLabel")} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="phoneNumbers"
                  name="phoneNumbers"
                  value={formData.phoneNumbers}
                  onChange={handleChange}
                  placeholder={t("form.phoneNumbersPlaceholder")}
                  className={errors.phoneNumbers ? "border-destructive" : ""}
                />
                <p className="text-sm text-muted-foreground">
                  {t("form.phoneNumbersHelpText")}
                </p>
                {errors.phoneNumbers && (
                  <p className="text-sm text-destructive">{errors.phoneNumbers}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="shippingAddress" className="text-sm font-medium">
                {t("form.shippingAddressLabel")} <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="shippingAddress"
                name="shippingAddress"
                value={formData.shippingAddress}
                onChange={handleChange}
                placeholder={t("form.shippingAddressPlaceholder")}
                rows={3}
                className={errors.shippingAddress ? "border-destructive" : ""}
              />
              {errors.shippingAddress && (
                <p className="text-sm text-destructive">{errors.shippingAddress}</p>
              )}
            </div>
          </div>

          {/* Warehouse Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Building className="h-5 w-5" />
              {t("form.warehouseSelectionTitle")}
            </h3>
            <Separator />

            <div className="space-y-2">
              <Label htmlFor="warehouseId" className="text-sm font-medium">
                {t("form.selectWarehouseLabel")} <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.warehouseId}
                onValueChange={(value) => handleSelectChange("warehouseId", value)}
              >
                <SelectTrigger
                  id="warehouseId"
                  className={errors.warehouseId ? "border-destructive" : ""}
                >
                  <SelectValue placeholder={t("form.selectWarehousePlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {availableWarehouses.map((warehouse:any) => (
                    <SelectItem key={warehouse._id} value={warehouse._id}>
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        <div className="flex flex-col">
                          <span>{warehouse.name}</span>
                          <span className="text-sm text-muted-foreground">
                            {warehouse.country} • {t("form.currencyPrefix")} {warehouse.currency}
                          </span>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.warehouseId && (
                <p className="text-sm text-destructive">{errors.warehouseId}</p>
              )}
              {formData.warehouseId && (
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className="text-xs">
                    {t("form.currencyPrefix")} {warehouseCurrency}
                  </Badge>
                </div>
              )}
            </div>
          </div>

          {/* Product Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Package className="h-5 w-5" />
              {t("form.productSelectionTitle")}
            </h3>
            <Separator />

            {/* Available Products */}
            {formData.warehouseId && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">
                    {t("form.availableProductsLabel")}
                  </Label>
                  <div className="flex items-center gap-2">
                    {isLoadingProducts && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {t("form.loadingProducts")}
                      </div>
                    )}
                  </div>
                </div>

                {availableProducts.length > 0 ? (
                  <div className="border rounded-md">
                    <ScrollArea className="h-48 rounded-md">
                      <div className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                          {availableProducts.map((product) => (
                            <div
                              key={product._id}
                              className={`p-3 rounded-md border hover:bg-muted/50 cursor-pointer transition-colors ${
                                product.totalStock === 0
                                  ? "border-muted-foreground/20"
                                  : ""
                              } ${
                                !product.availableExpeditions ||
                                product.availableExpeditions.length === 0
                                  ? "" // You might want a specific class for non-clickable/warning state
                                  : ""
                              }`}
                              onClick={() => handleAddProduct(product)}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium truncate">
                                    {product.name}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {t("misc.code")}: {product.code} {/* Assuming misc.code exists or add it */}
                                  </div>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-sm text-muted-foreground">
                                     {/* Assuming products.stockLabel key or similar for "Stock:" */ }
                                     Stock: {product.totalStock} 
                                    </span>
                                    {product.totalStock === 0 && (
                                      <Badge
                                        variant="outline"
                                        className="text-xs"
                                      >
                                        {t("form.outOfStockBadge")}
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-sm text-muted-foreground">
                                      {/* Assuming products.expeditionsLabel or similar for "Expeditions:" */}
                                      Expeditions: {product.availableExpeditions?.length || 0}
                                    </span>
                                    {(!product.availableExpeditions ||
                                      product.availableExpeditions.length === 0) && (
                                      <Badge variant="destructive" className="text-xs">
                                        {t("form.noExpeditionsBadge")}
                                      </Badge>
                                    )}
                                  </div>
                                  {product.price && (
                                    <div className="text-sm font-medium text-green-600 mt-1">
                                      {t("form.basePricePrefix")} {formatCurrency(product.price)}
                                    </div>
                                  )}
                                </div>
                                {product.availableExpeditions &&
                                product.availableExpeditions.length > 0 ? (
                                  <Plus className="h-4 w-4 text-primary flex-shrink-0" />
                                ) : (
                                  <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </ScrollArea>
                  </div>
                ) : formData.warehouseId && !isLoadingProducts ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-sm font-medium mb-2">
                      {t("form.noProductsInWarehouse")}
                    </p>
                  </div>
                ) : null}
              </div>
            )}

            {/* Selected Products */}
            <div className="space-y-4">
              <Label className="text-sm font-medium">
                {t("form.selectedProductsLabel")} <span className="text-red-500">*</span>
              </Label>

              {selectedProducts.length > 0 ? (
                <div className="space-y-3">
                  {selectedProducts.map((product) => (
                    <div
                      key={product._id}
                      className="border rounded-md p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="font-medium">{product.name}</div>
                          <div className="text-sm text-muted-foreground">
                           {t("misc.code")}: {product.code} {/* Assuming misc.code exists or add it */}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm text-muted-foreground">
                              {/* Assuming products.availableLabel or similar for "Available:" */}
                              Available: {product.totalStock}
                            </span>
                            {product.totalStock === 0 && (
                              <Badge variant="outline" className="text-xs">
                                {t("form.outOfStockBadge")}
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap"> {/* Added flex-wrap */}
                          <div className="space-y-1">
                            <Label className="text-xs">{t("form.quantityLabel")}</Label>
                            <Input
                              type="number"
                              min="1"
                              value={product.quantity}
                              onChange={(e) =>
                                handleUpdateProductQuantity(
                                  product._id,
                                  parseInt(e.target.value) || 1
                                )
                              }
                              className="w-20 h-8"
                            />
                          </div>

                          <div className="space-y-1">
                            <Label className="text-xs">{t("form.expeditionLabel")}</Label>
                            <Select
                              value={product.expeditionId}
                              onValueChange={(value) =>
                                handleUpdateProductExpedition(product._id, value)
                              }
                            >
                              <SelectTrigger className="w-48 h-8">
                                <SelectValue placeholder={t("form.selectExpeditionPlaceholder")} />
                              </SelectTrigger>
                              <SelectContent>
                                {product.availableExpeditions.map((expedition) => (
                                  <SelectItem
                                    key={expedition._id}
                                    value={expedition._id}
                                  >
                                    <div className="flex flex-col">
                                      <span className="text-sm font-medium">
                                        {expedition.expeditionCode}
                                      </span>
                                      <span className="text-xs text-muted-foreground">
                                        {formatCurrency(expedition.unitPrice)} • {expedition.transportMode}
                                      </span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-1">
                            <Label className="text-xs">
                              {t("form.unitPriceLabel")} ({warehouseCurrency})
                            </Label>
                            <div className="text-sm font-medium p-2 bg-muted rounded text-center w-24">
                              {formatCurrency(product.unitPrice)}
                            </div>
                          </div>

                          <div className="space-y-1">
                            <Label className="text-xs">{t("form.totalLabel")}</Label>
                            <div className="text-sm font-medium p-2 bg-muted rounded text-center w-24">
                              {formatCurrency(product.unitPrice * product.quantity)}
                            </div>
                          </div>

                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="h-8 w-8 mt-5" // or align-self-end if in flex parent
                            onClick={() => handleRemoveProduct(product._id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Order Summary */}
                  <div className="border rounded-md p-4 bg-muted/20">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="font-medium">{t("form.summaryTotalProducts")}</div>
                        <div className="text-lg font-bold">{totalProducts}</div>
                      </div>
                      <div>
                        <div className="font-medium">{t("form.summaryTotalQuantity")}</div>
                        <div className="text-lg font-bold">{totalQuantity}</div>
                      </div>
                      <div>
                        <div className="font-medium">{t("form.summaryTotalValue")}</div>
                        <div className="text-lg font-bold">
                          {formatCurrency(totalValue)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground border rounded-md border-dashed">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">{t("form.noProductsSelected")}</p>
                  <p className="text-xs mt-1">
                    {t("form.selectProductsHelpText")}
                  </p>
                </div>
              )}

              {errors.products && (
                <p className="text-sm text-destructive">{errors.products}</p>
              )}
            </div>
          </div>
          {/* Form Actions */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/dashboard/seller/orders")}
              disabled={isSubmitting}
            >
              {t("form.cancelButton")}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isSubmitting ? t("form.creatingButton") : t("form.createButton")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}