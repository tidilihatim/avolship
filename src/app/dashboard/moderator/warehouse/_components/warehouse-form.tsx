"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Loader2, Users, UserCheck, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import GoogleMapsAddressInput from "@/components/ui/google-maps-address-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

import { Warehouse, commonCurrencies, SellerInfo, WarehouseLocation } from "@/types/warehouse";
import { createWarehouse, updateWarehouse, getApprovedSellers } from "@/app/actions/warehouse";
import { getCountryNames } from "@/constants/countries";

interface WarehouseFormProps {
  warehouse?: Warehouse;
  isEdit?: boolean;
}

/**
 * WarehouseForm Component
 * Provides a form for creating and editing warehouses without any form libraries
 */
export default function WarehouseForm({
  warehouse,
  isEdit = false,
}: WarehouseFormProps) {
  const t = useTranslations("warehouse.form");
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sellers, setSellers] = useState<SellerInfo[]>([]);
  const [loadingSellers, setLoadingSellers] = useState(false);
  const [sellerSearch, setSellerSearch] = useState("");
  const [isSellerSectionOpen, setIsSellerSectionOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    country: "",
    city: "",
    currency: "USD",
    address: "",
    location: undefined as WarehouseLocation | undefined,
    capacity: undefined as number | undefined,
    capacityUnit: "items",
    isActive: true,
    conversionEnabled: false,
    targetCurrency: "USD",
    conversionRate: 1 as number | undefined,
    autoUpdateRate: false,
    isAvailableToAll: false,
    assignedSellers: [] as string[],
  });

  // Load sellers when component mounts
  useEffect(() => {
    fetchSellers();
  }, []);

  // Populate form values when editing
  useEffect(() => {
    if (warehouse && isEdit) {
      setFormData({
        name: warehouse.name,
        country: warehouse.country,
        city: warehouse.city || "",
        currency: warehouse.currency,
        address: warehouse.address || "",
        location: warehouse.location,
        capacity: warehouse.capacity,
        capacityUnit: warehouse.capacityUnit || "items",
        isActive: warehouse.isActive,
        conversionEnabled: warehouse.currencyConversion.enabled,
        targetCurrency: warehouse.currencyConversion.targetCurrency,
        conversionRate: warehouse.currencyConversion.rate,
        autoUpdateRate: warehouse.currencyConversion.autoUpdate,
        isAvailableToAll: warehouse.isAvailableToAll || false,
        assignedSellers: warehouse.assignedSellers || [],
      });
      
      // Open seller section if warehouse has assigned sellers
      if (!warehouse.isAvailableToAll && warehouse.assignedSellers && warehouse.assignedSellers.length > 0) {
        setIsSellerSectionOpen(true);
      }
    }
  }, [warehouse, isEdit]);

  // Fetch sellers from server
  const fetchSellers = async () => {
    setLoadingSellers(true);
    try {
      const result = await getApprovedSellers();
      if (result.sellers) {
        setSellers(result.sellers);
      } else if (result.error) {
        toast.error("Failed to load sellers");
      }
    } catch (error) {
      toast.error("Failed to load sellers");
    } finally {
      setLoadingSellers(false);
    }
  };

  // Handle input changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;

    if (type === "number") {
      setFormData({
        ...formData,
        [name]: value === "" ? undefined : Number(value),
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    if (name && value) {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  // Handle boolean switches
  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData({
      ...formData,
      [name]: checked,
    });
    
    // Clear assigned sellers if switching to "available to all"
    if (name === "isAvailableToAll" && checked) {
      setFormData(prev => ({
        ...prev,
        assignedSellers: []
      }));
    }
  };

  // Handle location change from Google Maps
  const handleLocationChange = (location: WarehouseLocation) => {
    setFormData(prev => ({
      ...prev,
      location,
      address: location.address // Update address field as well
    }));
  };

  // Handle seller selection
  const handleSellerToggle = (sellerId: string) => {
    setFormData(prev => ({
      ...prev,
      assignedSellers: prev.assignedSellers.includes(sellerId)
        ? prev.assignedSellers.filter(id => id !== sellerId)
        : [...prev.assignedSellers, sellerId]
    }));
  };

  // Handle select all sellers
  const handleSelectAllSellers = () => {
    const filteredSellers = getFilteredSellers();
    const allSelected = filteredSellers.every(seller => 
      formData.assignedSellers.includes(seller._id)
    );

    if (allSelected) {
      // Deselect all filtered sellers
      setFormData(prev => ({
        ...prev,
        assignedSellers: prev.assignedSellers.filter(id => 
          !filteredSellers.find(seller => seller._id === id)
        )
      }));
    } else {
      // Select all filtered sellers
      const newSellerIds = filteredSellers.map(seller => seller._id);
      setFormData(prev => ({
        ...prev,
        assignedSellers: [...new Set([...prev.assignedSellers, ...newSellerIds])]
      }));
    }
  };

  // Filter sellers based on search
  const getFilteredSellers = () => {
    return sellers.filter(seller => {
      const search = sellerSearch.toLowerCase();
      return (
        seller.name.toLowerCase().includes(search) ||
        seller.email.toLowerCase().includes(search) ||
        (seller.businessName && seller.businessName.toLowerCase().includes(search)) ||
        (seller.country && seller.country.toLowerCase().includes(search))
      );
    });
  };

  // Simple validation
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Required fields
    if (!formData.name.trim()) {
      newErrors.name = "Warehouse name is required";
    }

    if (!formData.country.trim()) {
      newErrors.country = "Country is required";
    }

    if (!formData.currency) {
      newErrors.currency = "Currency is required";
    }

    if (!formData.location || !formData.location.address.trim()) {
      newErrors.address = "Address with location coordinates is required";
    }

    // Validation for conversion settings when enabled
    if (formData.conversionEnabled) {
      if (!formData.targetCurrency) {
        newErrors.targetCurrency = "Target currency is required";
      } else if (formData.targetCurrency === formData.currency) {
        newErrors.targetCurrency =
          "Target currency must be different from warehouse currency";
      }

      if (
        formData.conversionRate === undefined ||
        formData.conversionRate <= 0
      ) {
        newErrors.conversionRate = "Conversion rate must be a positive number";
      }
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
      let result;

      if (isEdit && warehouse) {
        result = await updateWarehouse(warehouse._id, formData);
      } else {
        result = await createWarehouse(formData);
      }

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(
          isEdit
            ? t("messages.updateSuccess", { ns: "warehouse" })
            : t("messages.createSuccess", { ns: "warehouse" })
        );
        router.push("/dashboard/admin/warehouse");
      }
    } catch (error) {
      toast.error(t("messages.error", { ns: "warehouse" }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredSellers = getFilteredSellers();
  const allFilteredSelected = filteredSellers.length > 0 && 
    filteredSellers.every(seller => formData.assignedSellers.includes(seller._id));

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>
          {isEdit
            ? t("editWarehouse", { ns: "warehouse" })
            : t("createWarehouse", { ns: "warehouse" })}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">
              {t("details.basicInfo", { ns: "warehouse" })}
            </h3>
            <Separator />

            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                {t("name")}
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g., Mali Central Warehouse"
                className={errors.name ? "border-destructive" : ""}
              />
              <p className="text-sm text-muted-foreground">
                {t("nameDescription")}
              </p>
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="country" className="text-sm font-medium">
                  {t("country")}
                </Label>
                <Select
                  value={formData.country}
                  onValueChange={(value) => {
                    if (value) {
                      setFormData({
                        ...formData,
                        country: value,
                      });
                    }
                  }}
                >
                  <SelectTrigger
                    className={errors.country ? "border-destructive w-full" : " w-full"}
                  >
                    <SelectValue placeholder="Select a country" />
                  </SelectTrigger>
                  <SelectContent>
                    {getCountryNames().sort().map((country) => (
                      <SelectItem key={country} value={country}>
                        {country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  {t("countryDescription")}
                </p>
                {errors.country && (
                  <p className="text-sm text-destructive">{errors.country}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="city" className="text-sm font-medium">
                  {t("city")}
                </Label>
                <Input
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="e.g., Bamako"
                  className={errors.city ? "border-destructive" : ""}
                />
                <p className="text-sm text-muted-foreground">
                  {t("cityDescription")}
                </p>
                {errors.city && (
                  <p className="text-sm text-destructive">{errors.city}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <GoogleMapsAddressInput
                label={t("address")}
                value={formData.location}
                onChange={handleLocationChange}
                placeholder="e.g., 123 Commerce Street, District 5"
                error={errors.address}
                className="w-full"
                required={true}
              />
              <p className="text-sm text-muted-foreground">
                {t("addressDescription")} Drag the map marker to set the exact location.
              </p>
            </div>
          </div>

          {/* Properties */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">
              {t("details.properties", { ns: "warehouse" })}
            </h3>
            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="currency" className="text-sm font-medium">
                  {t("currency")}
                </Label>
                <Select
                  value={formData?.currency}
                  onValueChange={(value) =>
                    handleSelectChange("currency", value)
                  }
                >
                  <SelectTrigger
                    id="currency"
                    className={errors.currency ? "border-destructive" : ""}
                  >
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {commonCurrencies.map((currency) => (
                      <SelectItem key={currency.code} value={currency.code}>
                        {currency.code} - {currency.name} ({currency.symbol})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  {t("currencyDescription")}
                </p>
                {errors.currency && (
                  <p className="text-sm text-destructive">{errors.currency}</p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) =>
                      handleSwitchChange("isActive", checked)
                    }
                  />
                  <div className="space-y-1 leading-none">
                    <Label htmlFor="isActive" className="text-sm font-medium">
                      {formData.isActive ? t("active") : t("inactive")}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {t("statusDescription")}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="capacity" className="text-sm font-medium">
                  {t("capacity")}
                </Label>
                <Input
                  id="capacity"
                  name="capacity"
                  type="number"
                  value={
                    formData.capacity === undefined ? "" : formData.capacity
                  }
                  onChange={handleChange}
                  placeholder="e.g., 10000"
                  className={errors.capacity ? "border-destructive" : ""}
                />
                <p className="text-sm text-muted-foreground">
                  {t("capacityDescription")}
                </p>
                {errors.capacity && (
                  <p className="text-sm text-destructive">{errors.capacity}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="capacityUnit" className="text-sm font-medium">
                  {t("capacityUnit")}
                </Label>
                <Input
                  id="capacityUnit"
                  name="capacityUnit"
                  value={formData.capacityUnit || ""}
                  onChange={handleChange}
                  placeholder="e.g., items, pallets, cubic meters"
                  className={errors.capacityUnit ? "border-destructive" : ""}
                />
                <p className="text-sm text-muted-foreground">
                  {t("capacityUnitDescription")}
                </p>
                {errors.capacityUnit && (
                  <p className="text-sm text-destructive">
                    {errors.capacityUnit}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Seller Assignment */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">{t("sellerAssignment")}</h3>
            <Separator />

            <div className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <Switch
                id="isAvailableToAll"
                checked={formData.isAvailableToAll}
                onCheckedChange={(checked) =>
                  handleSwitchChange("isAvailableToAll", checked)
                }
              />
              <div className="space-y-1 leading-none">
                <Label
                  htmlFor="isAvailableToAll"
                  className="text-sm font-medium"
                >
                  {t("availableToAllSellers")}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {t("availableToAllDescription")}
                </p>
              </div>
            </div>

            {!formData.isAvailableToAll && (
              <Collapsible open={isSellerSectionOpen} onOpenChange={setIsSellerSectionOpen}>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    <span className="flex items-center gap-2">
                      <UserCheck className="h-4 w-4" />
                      {t("assignSellers")}
                    </span>
                    <Badge variant="secondary">
                      {formData.assignedSellers.length} {t("selected")}
                    </Badge>
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-4 space-y-4">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      type="search"
                      placeholder={t("searchSellers")}
                      className="pl-8"
                      value={sellerSearch}
                      onChange={(e) => setSellerSearch(e.target.value)}
                    />
                  </div>

                  {loadingSellers ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                          {filteredSellers.length} {t("sellersFound")}
                        </p>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleSelectAllSellers}
                        >
                          {allFilteredSelected ? t("deselectAll") : t("selectAll")}
                        </Button>
                      </div>

                      <ScrollArea className="h-[300px] rounded-md border p-4">
                        <div className="space-y-2">
                          {filteredSellers.map((seller) => (
                            <div
                              key={seller._id}
                              className="flex items-center space-x-3 rounded-lg p-3 hover:bg-muted/50 transition-colors"
                            >
                              <Checkbox
                                id={`seller-${seller._id}`}
                                checked={formData.assignedSellers.includes(seller._id)}
                                onCheckedChange={() => handleSellerToggle(seller._id)}
                              />
                              <label
                                htmlFor={`seller-${seller._id}`}
                                className="flex-1 cursor-pointer space-y-1"
                              >
                                <div className="font-medium">{seller.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  {seller.email}
                                  {seller.businessName && (
                                    <span> • {seller.businessName}</span>
                                  )}
                                  {seller.country && (
                                    <Badge variant="outline" className="ml-2">
                                      {seller.country}
                                    </Badge>
                                  )}
                                </div>
                              </label>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </>
                  )}
                  
                  {errors.assignedSellers && (
                    <p className="text-sm text-destructive">{errors.assignedSellers}</p>
                  )}
                </CollapsibleContent>
              </Collapsible>
            )}
          </div>

          {/* Currency Conversion */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">{t("currencyConversion")}</h3>
            <Separator />

            <div className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <Switch
                id="conversionEnabled"
                checked={formData.conversionEnabled}
                onCheckedChange={(checked) =>
                  handleSwitchChange("conversionEnabled", checked)
                }
              />
              <div className="space-y-1 leading-none">
                <Label
                  htmlFor="conversionEnabled"
                  className="text-sm font-medium"
                >
                  {formData.conversionEnabled
                    ? t("enabled", { ns: "warehouse.details" })
                    : t("disabled", { ns: "warehouse.details" })}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {t("conversionEnabledDescription")}
                </p>
              </div>
            </div>

            {formData.conversionEnabled && (
              <div className="space-y-4 pl-4 border-l-2 border-primary/20">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="targetCurrency"
                      className="text-sm font-medium"
                    >
                      {t("targetCurrency")}
                    </Label>
                    <Select
                      value={formData.targetCurrency}
                      onValueChange={(value) =>
                        handleSelectChange("targetCurrency", value)
                      }
                    >
                      <SelectTrigger
                        id="targetCurrency"
                        className={
                          errors.targetCurrency ? "border-destructive" : ""
                        }
                      >
                        <SelectValue placeholder="Select target currency" />
                      </SelectTrigger>
                      <SelectContent>
                        {commonCurrencies
                          .filter(
                            (currency) => currency.code !== formData.currency
                          )
                          .map((currency) => (
                            <SelectItem
                              key={currency.code}
                              value={currency.code}
                            >
                              {currency.code} - {currency.name} (
                              {currency.symbol})
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      {t("targetCurrencyDescription")}
                    </p>
                    {errors.targetCurrency && (
                      <p className="text-sm text-destructive">
                        {errors.targetCurrency}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="conversionRate"
                      className="text-sm font-medium"
                    >
                      {t("conversionRate")}
                    </Label>
                    <Input
                      id="conversionRate"
                      name="conversionRate"
                      type="number"
                      step="0.0001"
                      value={
                        formData.conversionRate === undefined
                          ? ""
                          : formData.conversionRate
                      }
                      onChange={handleChange}
                      placeholder="e.g., 1.2345"
                      className={
                        errors.conversionRate ? "border-destructive" : ""
                      }
                    />
                    <p className="text-sm text-muted-foreground">
                      {t("conversionRateDescription")}
                    </p>
                    {errors.conversionRate && (
                      <p className="text-sm text-destructive">
                        {errors.conversionRate}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <Switch
                    id="autoUpdateRate"
                    checked={formData.autoUpdateRate}
                    onCheckedChange={(checked) =>
                      handleSwitchChange("autoUpdateRate", checked)
                    }
                  />
                  <div className="space-y-1 leading-none">
                    <Label
                      htmlFor="autoUpdateRate"
                      className="text-sm font-medium"
                    >
                      {formData.autoUpdateRate
                        ? t("enabled", { ns: "warehouse.details" })
                        : t("disabled", { ns: "warehouse.details" })}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {t("autoUpdateRateDescription")}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/dashboard/admin/warehouse")}
              disabled={isSubmitting}
            >
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isSubmitting ? t("saving") : t("submit")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}