"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Save, User, Phone, MapPin, Loader2, Plus, Trash2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import GoogleMapsAddressInput, { Location } from "@/components/ui/google-maps-address-input";
import { OrderTableData } from "./order-table-types";

interface CustomerUpdateDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  order: OrderTableData | null;
  isUpdating: boolean;
  onUpdate: (customerData: CustomerUpdateData) => void;
}

export interface CustomerUpdateData {
  name: string;
  phoneNumbers: string[];
  shippingAddress: string;
  location?: {
    latitude: number;
    longitude: number;
  };
}

export default function CustomerUpdateDialog({
  isOpen,
  onOpenChange,
  order,
  isUpdating,
  onUpdate,
}: CustomerUpdateDialogProps) {
  const t = useTranslations();
  
  // Form states
  const [customerName, setCustomerName] = useState("");
  const [phoneNumbers, setPhoneNumbers] = useState<string[]>([""]);
  const [mapLocation, setMapLocation] = useState<Location | undefined>();
  
  // Form validation
  const [errors, setErrors] = useState<{
    name?: string;
    phones?: string;
    address?: string;
  }>({});

  // Initialize form data when dialog opens
  useEffect(() => {
    if (isOpen && order) {
      setCustomerName(order.customer.name);
      setPhoneNumbers(order.customer.phoneNumbers.length > 0 ? [...order.customer.phoneNumbers] : [""]);
      
      // Set map location if available
      if (order.customer.location) {
        setMapLocation({
          latitude: order.customer.location.latitude,
          longitude: order.customer.location.longitude,
          address: order.customer.shippingAddress
        });
      } else {
        setMapLocation({
          latitude: 33.5889, // Default to Rabat, Morocco
          longitude: -7.6114,
          address: order.customer.shippingAddress || ""
        });
      }
      
      // Clear errors
      setErrors({});
    }
  }, [isOpen, order]);

  // Add phone number field
  const addPhoneNumber = () => {
    setPhoneNumbers([...phoneNumbers, ""]);
  };

  // Remove phone number field
  const removePhoneNumber = (index: number) => {
    if (phoneNumbers.length > 1) {
      setPhoneNumbers(phoneNumbers.filter((_, i) => i !== index));
    }
  };

  // Update phone number at specific index
  const updatePhoneNumber = (index: number, value: string) => {
    const updated = [...phoneNumbers];
    updated[index] = value;
    setPhoneNumbers(updated);
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    // Validate name
    if (!customerName.trim()) {
      newErrors.name = "Customer name is required";
    }

    // Validate phone numbers
    const validPhones = phoneNumbers.filter(phone => phone.trim());
    if (validPhones.length === 0) {
      newErrors.phones = "At least one phone number is required";
    }

    // Validate address
    if (!mapLocation?.address?.trim()) {
      newErrors.address = "Shipping address is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle save
  const handleSave = () => {
    if (!validateForm()) {
      toast.error("Please fix the form errors");
      return;
    }

    const validPhones = phoneNumbers.filter(phone => phone.trim());
    
    const customerData: CustomerUpdateData = {
      name: customerName.trim(),
      phoneNumbers: validPhones,
      shippingAddress: mapLocation?.address || "",
      location: mapLocation ? {
        latitude: mapLocation.latitude,
        longitude: mapLocation.longitude
      } : undefined
    };

    onUpdate(customerData);
  };

  // Handle map location change
  const handleMapLocationChange = (location: Location) => {
    setMapLocation(location);
    // Clear address error when location is updated
    if (errors.address) {
      setErrors({ ...errors, address: undefined });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Update Customer Information
          </DialogTitle>
          <DialogDescription>
            Update customer details for order #{order?.orderId}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Order Info */}
          {order && (
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <span className="font-semibold">Order #{order.orderId}</span>
                <Badge variant="secondary">{order.status}</Badge>
              </div>
            </div>
          )}

          <Separator />

          {/* Customer Name */}
          <div className="space-y-2">
            <Label htmlFor="customer-name" className="text-base font-semibold">
              Customer Name *
            </Label>
            <Input
              id="customer-name"
              value={customerName}
              onChange={(e) => {
                setCustomerName(e.target.value);
                if (errors.name) {
                  setErrors({ ...errors, name: undefined });
                }
              }}
              placeholder="Enter customer name"
              className={errors.name ? "border-destructive" : ""}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>

          {/* Phone Numbers */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">
                Phone Numbers *
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addPhoneNumber}
                className="h-8"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Phone
              </Button>
            </div>
            
            <div className="space-y-2">
              {phoneNumbers.map((phone, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={phone}
                    onChange={(e) => {
                      updatePhoneNumber(index, e.target.value);
                      if (errors.phones) {
                        setErrors({ ...errors, phones: undefined });
                      }
                    }}
                    placeholder={`Phone number ${index + 1}`}
                    className={errors.phones && index === 0 ? "border-destructive" : ""}
                  />
                  {phoneNumbers.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removePhoneNumber(index)}
                      className="shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            
            {errors.phones && (
              <p className="text-sm text-destructive">{errors.phones}</p>
            )}
          </div>

          {/* Shipping Address with Map */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">
              Shipping Address with Location *
            </Label>
            <GoogleMapsAddressInput
              value={mapLocation}
              onChange={handleMapLocationChange}
              placeholder="Enter customer shipping address..."
              error={errors.address}
            />
            
            {/* Current vs New Location Comparison */}
            {order?.customer.location && mapLocation && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <h4 className="font-medium text-sm mb-2">Current Location</h4>
                  <p className="text-xs text-muted-foreground">
                    📍 {order.customer.shippingAddress}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    🌍 {order.customer.location.latitude.toFixed(6)}, {order.customer.location.longitude.toFixed(6)}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-sm mb-2">New Location</h4>
                  <p className="text-xs text-muted-foreground">
                    📍 {mapLocation.address}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    🌍 {mapLocation.latitude.toFixed(6)}, {mapLocation.longitude.toFixed(6)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="pt-6">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isUpdating}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isUpdating}
          >
            {isUpdating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Update Customer
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}