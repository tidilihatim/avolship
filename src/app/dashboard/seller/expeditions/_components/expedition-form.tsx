"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Plus,
  X,
  Package,
  Truck,
  Calendar,
  MapPin,
  User,
  Building,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
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
  ExpeditionInput,
  ProductOption,
  SelectedProduct,
} from "@/types/expedition-form";
import {
  TransportMode,
  ProviderType,
} from "@/app/dashboard/_constant/expedition";
import {
  createExpedition,
  updateExpedition,
  getProductsForWarehouse,
} from "@/app/actions/expedition";

interface ExtendedWarehouse {
  _id: string;
  name: string;
  country: string;
  currency: string;
}

interface ExpeditionFormProps {
  expedition?: any;
  warehouses?: ExtendedWarehouse[];
  providers?: { _id: string; name: string; businessName?: string }[];
  countries?: string[];
  isEdit?: boolean;
  userRole: string
}

/**
 * ExpeditionForm Component
 * Provides a form for creating and editing expeditions with product selection
 */
export default function ExpeditionForm({
  expedition,
  warehouses = [],
  providers = [],
  countries = [],
  isEdit = false,
  userRole
}: ExpeditionFormProps) {
  const t = useTranslations();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>(
    []
  );
  const [availableProducts, setAvailableProducts] = useState<ProductOption[]>(
    []
  );
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [hasLoadedEditData, setHasLoadedEditData] = useState(false);
  const [warehouseCurrency, setWarehouseCurrency] = useState("USD");

  // Form state
  const [formData, setFormData] = useState({
    fromCountry: "",
    weight: "",
    expeditionDate: "",
    transportMode: "" as TransportMode | "",
    warehouseId: "",
    providerType: "" as ProviderType | "",
    providerId: "",
    carrierName: "",
    carrierPhone: "",
    carrierEmail: "",
    carrierCompany: "",
    trackingNumber: "",
    estimatedDelivery: "",
  });

  // Populate form values when editing
  useEffect(() => {
    if (expedition && isEdit) {
      // Handle warehouseId - it might be a populated object or just an ID string
      const warehouseId = typeof expedition.warehouseId === 'object' 
        ? expedition.warehouseId._id 
        : expedition.warehouseId;
      
      setFormData({
        fromCountry: expedition.fromCountry || "",
        weight: expedition.weight ? String(expedition.weight) : "",
        expeditionDate: expedition.expeditionDate
          ? new Date(expedition.expeditionDate).toISOString().split("T")[0]
          : "",
        transportMode: expedition.transportMode || "",
        warehouseId: warehouseId || "",
        providerType: expedition.providerType || "",
        providerId: expedition.providerId || "",
        carrierName: expedition.carrierInfo?.name || "",
        carrierPhone: expedition.carrierInfo?.phone || "",
        carrierEmail: expedition.carrierInfo?.email || "",
        carrierCompany: expedition.carrierInfo?.companyName || "",
        trackingNumber: expedition.trackingNumber || "",
        estimatedDelivery: expedition.estimatedDelivery
          ? new Date(expedition.estimatedDelivery).toISOString().split("T")[0]
          : "",
      });

      // Set warehouse currency for edit mode
      if (warehouseId) {
        // First try to get currency from populated warehouse object
        let currency = "USD";
        if (typeof expedition.warehouseId === 'object' && expedition.warehouseId.currency) {
          currency = expedition.warehouseId.currency;
        } else {
          // Fallback to finding in warehouses array
          const warehouse = warehouses.find((w) => w._id === warehouseId);
          if (warehouse) {
            currency = warehouse.currency;
          }
        }
        setWarehouseCurrency(currency);
        console.log("Edit mode: Warehouse currency set to:", currency);
      }

      // Set selected products

      console.log("I ran");
      setSelectedProducts(
        expedition.products.map((p: any) => ({
          _id: p.productId,
          name: p.productName,
          code: p.productCode,
          price: p.unitPrice,
          totalStock: 100, // Default value for edit mode
          quantity: p.quantity,
          unitPrice: p.unitPrice,
        }))
      );
    }
    setHasLoadedEditData(true);
  }, [expedition, isEdit, warehouses]);

  // Load products when warehouse changes
  useEffect(() => {
    if (!hasLoadedEditData && isEdit) {
      return; // Skip if we're still loading edit data
    }

    if (formData.warehouseId) {
      loadProductsForWarehouse(formData.warehouseId);
      // Update currency when warehouse changes
      const selectedWarehouse = warehouses.find(
        (w) => w._id === formData.warehouseId
      );
      if (selectedWarehouse) {
        setWarehouseCurrency(selectedWarehouse.currency);
        console.log("Warehouse currency set to:", selectedWarehouse.currency);
      }
    } else {
      setAvailableProducts([]);
      setSelectedProducts([]);
      setWarehouseCurrency("USD");
    }
  }, [formData.warehouseId, warehouses]);

  // Load products for selected warehouse
  const loadProductsForWarehouse = async (warehouseId: string) => {
    setIsLoadingProducts(true);
    try {
      console.log("Loading products for warehouse:", warehouseId);
      
      // If we're in edit mode and have expedition data, pass the seller ID
      let sellerId: string | undefined;
      if (isEdit && expedition?.sellerId) {
        sellerId = typeof expedition.sellerId === 'object' 
          ? expedition.sellerId._id || expedition.sellerId.toString()
          : expedition.sellerId;
      }
      
      console.log("Seller ID for product loading:", sellerId);
      const products = await getProductsForWarehouse(warehouseId, sellerId);
      console.log("Received products:", products);
      setAvailableProducts(products);

      // Clear selected products when switching warehouses (except in edit mode)
      if (!isEdit) {
        setSelectedProducts([]);
      }
    } catch (error) {
      console.error("Error loading products:", error);
      toast.error("Failed to load products");
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

      if(name === "warehouseId") {
        setSelectedProducts([]);
      }

      // Clear provider-related fields when provider type changes
      if (name === "providerType") {
        setFormData((prev: any) => ({
          ...prev,
          [name]: value,
          providerId: "",
          carrierName: "",
          carrierPhone: "",
          carrierEmail: "",
          carrierCompany: "",
        }));
      }
    }
  };

  // Add product to expedition
  const handleAddProduct = (product: ProductOption) => {
    const isAlreadySelected = selectedProducts.some(
      (p) => p._id === product._id
    );
    if (isAlreadySelected) {
      toast.error("Product already selected");
      return;
    }

    // Warn user if product has no stock
    if (product.totalStock === 0) {
      toast.warning(
        `${product.name} is out of stock but has been added to the expedition`
      );
    }

    const newProduct: SelectedProduct = {
      ...product,
      quantity: 1,
      unitPrice: product.price,
    };

    setSelectedProducts([...selectedProducts, newProduct]);
  };

  // Remove product from expedition
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

  // Update product unit price
  const handleUpdateProductPrice = (productId: string, unitPrice: number) => {
    if (unitPrice < 0) return;

    setSelectedProducts(
      selectedProducts.map((p) =>
        p._id === productId ? { ...p, unitPrice } : p
      )
    );
  };

  // Currency formatter helper
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: warehouseCurrency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Simple validation
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Required fields
    if (!formData.fromCountry.trim()) {
      newErrors.fromCountry = t("expeditions.validation.fromCountryRequired");
    }

    if (!formData.weight.trim()) {
      newErrors.weight = t("expeditions.validation.weightRequired");
    } else if (
      isNaN(parseFloat(formData.weight)) ||
      parseFloat(formData.weight) <= 0
    ) {
      newErrors.weight = t("expeditions.validation.weightInvalid");
    }

    if (!formData.expeditionDate) {
      newErrors.expeditionDate = t(
        "expeditions.validation.expeditionDateRequired"
      );
    }

    if (!formData.transportMode) {
      newErrors.transportMode = t(
        "expeditions.validation.transportModeRequired"
      );
    }

    if (!formData.warehouseId) {
      newErrors.warehouseId = t("expeditions.validation.warehouseRequired");
    }

    if (!formData.providerType) {
      newErrors.providerType = t("expeditions.validation.providerTypeRequired");
    }

    // Provider-specific validation
    if (formData.providerType === ProviderType.REGISTERED) {
      if (!formData.providerId) {
        newErrors.providerId = t("expeditions.validation.providerRequired");
      }
    } else if (formData.providerType === ProviderType.OWN) {
      if (!formData.carrierName.trim()) {
        newErrors.carrierName = t("expeditions.validation.carrierNameRequired");
      }
      if (!formData.carrierPhone.trim()) {
        newErrors.carrierPhone = t(
          "expeditions.validation.carrierPhoneRequired"
        );
      }
    }

    // Products validation
    if (selectedProducts.length === 0) {
      newErrors.products = t("expeditions.validation.productsRequired");
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Form submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      // Show first error as toast
      const firstError = Object.values(errors)[0];
      if (firstError) {
        toast.error(firstError);
      }
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare expedition data
      const expeditionData: ExpeditionInput = {
        fromCountry: formData.fromCountry,
        weight: parseFloat(formData.weight),
        expeditionDate: formData.expeditionDate,
        transportMode: formData.transportMode as TransportMode,
        warehouseId: formData.warehouseId,
        providerType: formData.providerType as ProviderType,
        products: selectedProducts.map((p) => ({
          productId: p._id,
          quantity: p.quantity,
          unitPrice: p.unitPrice,
        })),
      };

      // Add provider-specific data
      if (formData.providerType === ProviderType.REGISTERED) {
        expeditionData.providerId = formData.providerId;
      } else if (formData.providerType === ProviderType.OWN) {
        expeditionData.carrierInfo = {
          name: formData.carrierName,
          phone: formData.carrierPhone,
          email: formData.carrierEmail || undefined,
          companyName: formData.carrierCompany || undefined,
        };
      }

      // Add optional fields
      if (formData.trackingNumber) {
        expeditionData.trackingNumber = formData.trackingNumber;
      }
      if (formData.estimatedDelivery) {
        expeditionData.estimatedDelivery = formData.estimatedDelivery;
      }

      let result;
      if (isEdit && expedition) {
        result = await updateExpedition(expedition._id, expeditionData);
      } else {
        result = await createExpedition(expeditionData);
      }

      if (!result.success) {
        if (result.errors) {
          setErrors(result.errors);
        }
        toast.error(result.message || t("expeditions.errors.saveFailed"));
      } else {
        toast.success(
          isEdit
            ? t("expeditions.expeditionUpdated")
            : t("expeditions.expeditionCreated")
        );
        router.push(`/dashboard/${userRole}/expeditions`);
      }
    } catch (error) {
      console.error("Error saving expedition:", error);
      toast.error(t("expeditions.errors.unexpectedError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate total values
  const totalProducts = selectedProducts.length;
  const totalQuantity = selectedProducts.reduce(
    (sum, p) => sum + p.quantity,
    0
  );
  const totalValue = selectedProducts.reduce(
    (sum, p) => sum + (p.unitPrice || 0) * p.quantity,
    0
  );

  // Group warehouses by country for better organization
  const warehousesByCountry: Record<string, typeof warehouses> = {};
  warehouses.forEach((warehouse) => {
    if (!warehousesByCountry[warehouse.country]) {
      warehousesByCountry[warehouse.country] = [];
    }
    warehousesByCountry[warehouse.country].push(warehouse);
  });

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>
          {isEdit
            ? t("expeditions.editExpedition")
            : t("expeditions.createExpedition")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Package Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Package className="h-5 w-5" />
              {t("expeditions.sections.packageInfo")}
            </h3>
            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fromCountry" className="text-sm font-medium">
                  {t("expeditions.fields.fromCountry")}{" "}
                  <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.fromCountry}
                  onValueChange={(value) =>
                    handleSelectChange("fromCountry", value)
                  }
                >
                  <SelectTrigger
                    id="fromCountry"
                    className={errors.fromCountry ? "border-destructive" : ""}
                  >
                    <SelectValue
                      placeholder={t("expeditions.placeholders.selectCountry")}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country} value={country}>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          {country}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.fromCountry && (
                  <p className="text-sm text-destructive">
                    {errors.fromCountry}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="weight" className="text-sm font-medium">
                  {t("expeditions.fields.weight")} (KG){" "}
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="weight"
                  name="weight"
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={formData.weight}
                  onChange={handleChange}
                  placeholder={t("expeditions.placeholders.enterWeight")}
                  className={errors.weight ? "border-destructive" : ""}
                />
                {errors.weight && (
                  <p className="text-sm text-destructive">{errors.weight}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expeditionDate" className="text-sm font-medium">
                  {t("expeditions.fields.expeditionDate")}{" "}
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="expeditionDate"
                  name="expeditionDate"
                  type="date"
                  value={formData.expeditionDate}
                  onChange={handleChange}
                  className={errors.expeditionDate ? "border-destructive" : ""}
                />
                {errors.expeditionDate && (
                  <p className="text-sm text-destructive">
                    {errors.expeditionDate}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="transportMode" className="text-sm font-medium">
                  {t("expeditions.fields.transportMode")}{" "}
                  <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.transportMode}
                  onValueChange={(value) =>
                    handleSelectChange("transportMode", value)
                  }
                >
                  <SelectTrigger
                    id="transportMode"
                    className={errors.transportMode ? "border-destructive" : ""}
                  >
                    <SelectValue
                      placeholder={t(
                        "expeditions.placeholders.selectTransportMode"
                      )}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(TransportMode).map((mode) => (
                      <SelectItem key={mode} value={mode}>
                        <div className="flex items-center gap-2">
                          <Truck className="h-4 w-4" />
                          {t(`expeditions.transportModes.${mode}`)}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.transportMode && (
                  <p className="text-sm text-destructive">
                    {errors.transportMode}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="warehouseId" className="text-sm font-medium">
                {t("expeditions.fields.warehouse")}{" "}
                <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.warehouseId}
                onValueChange={(value) =>
                  handleSelectChange("warehouseId", value)
                }
              >
                <SelectTrigger
                  id="warehouseId"
                  className={errors.warehouseId ? "border-destructive" : ""}
                >
                  <SelectValue
                    placeholder={t("expeditions.placeholders.selectWarehouse")}
                  />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(warehousesByCountry)
                    .sort()
                    .map((country) => (
                      <div key={country}>
                        <div className="px-2 py-1 text-sm font-semibold text-muted-foreground">
                          {country}
                        </div>
                        {warehousesByCountry[country].map((warehouse) => (
                          <SelectItem key={warehouse._id} value={warehouse._id}>
                            <div className="flex items-center gap-2">
                              <Building className="h-4 w-4" />
                              <div className="flex flex-col">
                                <span>{warehouse.name}</span>
                                <span className="text-sm text-muted-foreground">
                                  Currency: {warehouse.currency}
                                </span>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </div>
                    ))}
                </SelectContent>
              </Select>
              {errors.warehouseId && (
                <p className="text-sm text-destructive">{errors.warehouseId}</p>
              )}
              {formData.warehouseId && (
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className="text-xs">
                    Currency: {warehouseCurrency}
                  </Badge>
                </div>
              )}
            </div>
          </div>

          {/* Provider Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <User className="h-5 w-5" />
              {t("expeditions.sections.providerInfo")}
            </h3>
            <Separator />

            <div className="space-y-2">
              <Label htmlFor="providerType" className="text-sm font-medium">
                {t("expeditions.fields.providerType")}{" "}
                <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.providerType}
                onValueChange={(value) =>
                  handleSelectChange("providerType", value)
                }
              >
                <SelectTrigger
                  id="providerType"
                  className={errors.providerType ? "border-destructive" : ""}
                >
                  <SelectValue
                    placeholder={t(
                      "expeditions.placeholders.selectProviderType"
                    )}
                  />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(ProviderType).map((type) => (
                    <SelectItem key={type} value={type}>
                      {t(`expeditions.providerTypes.${type}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.providerType && (
                <p className="text-sm text-destructive">
                  {errors.providerType}
                </p>
              )}
            </div>

            {/* Registered Provider Selection */}
            {formData.providerType === ProviderType.REGISTERED && (
              <div className="space-y-2">
                <Label htmlFor="providerId" className="text-sm font-medium">
                  {t("expeditions.fields.provider")}{" "}
                  <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.providerId}
                  onValueChange={(value) =>
                    handleSelectChange("providerId", value)
                  }
                >
                  <SelectTrigger
                    id="providerId"
                    className={errors.providerId ? "border-destructive" : ""}
                  >
                    <SelectValue
                      placeholder={t("expeditions.placeholders.selectProvider")}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {providers.map((provider) => (
                      <SelectItem key={provider._id} value={provider._id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{provider.name}</span>
                          {provider.businessName && (
                            <span className="text-sm text-muted-foreground">
                              {provider.businessName}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.providerId && (
                  <p className="text-sm text-destructive">
                    {errors.providerId}
                  </p>
                )}
              </div>
            )}

            {/* Own Carrier Information */}
            {formData.providerType === ProviderType.OWN && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="carrierName"
                      className="text-sm font-medium"
                    >
                      {t("expeditions.fields.carrierName")}{" "}
                      <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="carrierName"
                      name="carrierName"
                      value={formData.carrierName}
                      onChange={handleChange}
                      placeholder={t(
                        "expeditions.placeholders.enterCarrierName"
                      )}
                      className={errors.carrierName ? "border-destructive" : ""}
                    />
                    {errors.carrierName && (
                      <p className="text-sm text-destructive">
                        {errors.carrierName}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="carrierPhone"
                      className="text-sm font-medium"
                    >
                      {t("expeditions.fields.carrierPhone")}{" "}
                      <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="carrierPhone"
                      name="carrierPhone"
                      value={formData.carrierPhone}
                      onChange={handleChange}
                      placeholder={t(
                        "expeditions.placeholders.enterCarrierPhone"
                      )}
                      className={
                        errors.carrierPhone ? "border-destructive" : ""
                      }
                    />
                    {errors.carrierPhone && (
                      <p className="text-sm text-destructive">
                        {errors.carrierPhone}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="carrierEmail"
                      className="text-sm font-medium"
                    >
                      {t("expeditions.fields.carrierEmail")}
                    </Label>
                    <Input
                      id="carrierEmail"
                      name="carrierEmail"
                      type="email"
                      value={formData.carrierEmail}
                      onChange={handleChange}
                      placeholder={t(
                        "expeditions.placeholders.enterCarrierEmail"
                      )}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="carrierCompany"
                      className="text-sm font-medium"
                    >
                      {t("expeditions.fields.carrierCompany")}
                    </Label>
                    <Input
                      id="carrierCompany"
                      name="carrierCompany"
                      value={formData.carrierCompany}
                      onChange={handleChange}
                      placeholder={t(
                        "expeditions.placeholders.enterCarrierCompany"
                      )}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Product Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Package className="h-5 w-5" />
              {t("expeditions.sections.productSelection")}
            </h3>
            <Separator />

            {/* Available Products */}
            {formData.warehouseId && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">
                    {t("expeditions.fields.availableProducts")}
                  </Label>
                  <div className="flex items-center gap-2">
                    {isLoadingProducts && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading products...
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
                              }`}
                              onClick={() => handleAddProduct(product)}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium truncate">
                                    {product.name}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    Code: {product.code}
                                  </div>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-sm text-muted-foreground">
                                      Stock: {product.totalStock}
                                    </span>
                                    {product.totalStock === 0 && (
                                      <Badge
                                        variant="outline"
                                        className="text-xs"
                                      >
                                        Out of Stock
                                      </Badge>
                                    )}
                                  </div>
                                  {product.price && (
                                    <div className="text-sm font-medium text-green-600 mt-1">
                                      {formatCurrency(product.price)}
                                    </div>
                                  )}
                                </div>
                                <Plus className="h-4 w-4 text-primary flex-shrink-0" />
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
                      {t("expeditions.noProductsAvailable")}
                    </p>
                  </div>
                ) : null}
              </div>
            )}

            {/* Selected Products */}
            <div className="space-y-4">
              <Label className="text-sm font-medium">
                {t("expeditions.fields.selectedProducts")}{" "}
                <span className="text-red-500">*</span>
              </Label>

              {selectedProducts.length > 0 ? (
                <div className="space-y-3">
                  {selectedProducts.map((product) => (
                    <div
                      key={product._id}
                      className={`border rounded-md p-4 ${
                        product.totalStock === 0
                          ? "border-muted-foreground/20"
                          : ""
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="font-medium">{product.name}</div>
                          <div className="text-sm text-muted-foreground">
                            Code: {product.code}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm text-muted-foreground">
                              Available: {product.totalStock}
                            </span>
                            {product.totalStock === 0 && (
                              <Badge variant="outline" className="text-xs">
                                Out of Stock
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="space-y-1">
                            <Label className="text-xs">Quantity</Label>
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
                            {product.totalStock === 0 && (
                              <p className="text-xs text-muted-foreground">
                                No stock available
                              </p>
                            )}
                          </div>

                          <div className="space-y-1">
                            <Label className="text-xs">
                              Unit Price ({warehouseCurrency})
                            </Label>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={product.unitPrice || ""}
                              onChange={(e) =>
                                handleUpdateProductPrice(
                                  product._id,
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              className="w-32 h-8"
                              placeholder="0.00"
                            />
                          </div>

                          <div className="space-y-1">
                            <Label className="text-xs">Total</Label>
                            <div className="text-sm font-medium p-2 bg-muted rounded text-center w-24">
                              {formatCurrency(
                                (product.unitPrice || 0) * product.quantity
                              )}
                            </div>
                          </div>

                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="h-8 w-8 mt-5"
                            onClick={() => handleRemoveProduct(product._id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Summary */}
                  <div className="border rounded-md p-4 bg-muted/20">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="font-medium">Total Products</div>
                        <div className="text-lg font-bold">{totalProducts}</div>
                      </div>
                      <div>
                        <div className="font-medium">Total Quantity</div>
                        <div className="text-lg font-bold">{totalQuantity}</div>
                      </div>
                      <div>
                        <div className="font-medium">Total Value</div>
                        <div className="text-lg font-bold text-green-600">
                          {formatCurrency(totalValue)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground border rounded-md border-dashed">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">
                    {t("expeditions.noProductsSelected")}
                  </p>
                  <p className="text-xs mt-1">
                    Select products from the available list above
                  </p>
                </div>
              )}

              {errors.products && (
                <p className="text-sm text-destructive">{errors.products}</p>
              )}
            </div>
          </div>

          {/* Optional Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {t("expeditions.sections.optionalInfo")}
            </h3>
            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="trackingNumber" className="text-sm font-medium">
                  {t("expeditions.fields.trackingNumber")}
                </Label>
                <Input
                  id="trackingNumber"
                  name="trackingNumber"
                  value={formData.trackingNumber}
                  onChange={handleChange}
                  placeholder={t(
                    "expeditions.placeholders.enterTrackingNumber"
                  )}
                />
                <p className="text-sm text-muted-foreground">
                  {t("expeditions.help.trackingNumber")}
                </p>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="estimatedDelivery"
                  className="text-sm font-medium"
                >
                  {t("expeditions.fields.estimatedDelivery")}
                </Label>
                <Input
                  id="estimatedDelivery"
                  name="estimatedDelivery"
                  type="date"
                  value={formData.estimatedDelivery}
                  onChange={handleChange}
                />
                <p className="text-sm text-muted-foreground">
                  {t("expeditions.help.estimatedDelivery")}
                </p>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/dashboard/${userRole}/expeditions`)}
              disabled={isSubmitting}
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isSubmitting
                ? t("common.saving")
                : isEdit
                ? t("common.update")
                : t("common.create")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
