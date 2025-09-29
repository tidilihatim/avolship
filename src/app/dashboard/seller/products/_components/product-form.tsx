"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Loader2, Upload, X, ImageIcon, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";

import { ProductInput } from "@/types/product";
import { ProductStatus } from "@/lib/db/models/product";
import { createProduct, updateProduct } from "@/app/actions/product";
import { uploadImageToS3, validateImageFile } from "@/lib/s3-upload";
import { COUNTRY_FLAGS } from "@/app/dashboard/_constant";

interface ProductFormProps {
  product?: any;
  warehouses?: { _id: string; name: string; country: string }[];
  isEdit?: boolean;
}

/**
 * ProductForm Component
 * Provides a form for creating and editing products with image upload
 */
export default function ProductForm({
  product,
  warehouses = [],
  isEdit = false,
}: ProductFormProps) {
  const t = useTranslations();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedWarehouses, setSelectedWarehouses] = useState<string[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    code: "",
    variantCode: "",
    verificationLink: "",
  });

  // Populate form values when editing
  useEffect(() => {
    if (product && isEdit) {
      setFormData({
        name: product.name || "",
        description: product.description || "",
        code: product.code || "",
        variantCode: product.variantCode || "",
        verificationLink: product.verificationLink || "",
      });

      // Set warehouse selections
      if (product.warehouses && product.warehouses.length > 0) {
        const selectedIds = product.warehouses.map((wh: any) => wh.warehouseId);
        setSelectedWarehouses(selectedIds);
      }

      // Set image preview if exists
      if (product.image && product.image.url) {
        setImagePreview(product.image.url);
      }
    }
  }, [product, isEdit]);

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

  // Handle warehouse selection
  const handleWarehouseToggle = (warehouseId: string) => {
    if (selectedWarehouses.includes(warehouseId)) {
      // If already selected, remove it
      setSelectedWarehouses(selectedWarehouses.filter(id => id !== warehouseId));
    } else {
      // If not selected, add it
      setSelectedWarehouses([...selectedWarehouses, warehouseId]);
    }
  };

  // Handle image selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // Validate the image file
    const validation = validateImageFile(file);
    if (!validation.isValid) {
      setErrors({
        ...errors,
        image: validation.error || t('products.validation.imageTypeInvalid')
      });
      toast.error(validation.error || t('products.validation.imageTypeInvalid'));
      return;
    }

    // Clear any previous errors
    if (errors.image) {
      const newErrors = { ...errors };
      delete newErrors.image;
      setErrors(newErrors);
    }
    
    // Create preview
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    
    // Store file for upload
    setImageFile(file);
  };

  // Clear image selection
  const handleClearImage = () => {
    setImagePreview(null);
    setImageFile(null);
    
    // Reset file input by clearing its value
    const fileInput = document.getElementById('product-image') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  // Upload image to S3
  const uploadImage = async (): Promise<{url: string; publicId: string} | null> => {
    if (!imageFile) {
      // If no new image and we're editing, return the existing image
      if (isEdit && product?.image) {
        return product.image;
      }
      return null;
    }

    try {
      setIsUploading(true);
      // Use our S3 utility to upload
      const imageData = await uploadImageToS3(imageFile);
      return imageData;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error(t('products.errors.imageUploadFailed'));
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  // Simple validation
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Required fields
    if (!formData.name.trim()) {
      newErrors.name = t('products.validation.nameRequired');
    }

    if (!formData.description.trim()) {
      newErrors.description = t('products.validation.descriptionRequired');
    }

    if (!formData.code.trim()) {
      newErrors.code = t('products.validation.codeRequired');
    }

    if (selectedWarehouses.length === 0) {
      newErrors.warehouses = t('products.validation.warehouseRequired');
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
      // First upload the image if needed
      const imageData = await uploadImage();
      
      // Prepare warehouses data - all warehouses start with 0 stock
      const warehousesData = selectedWarehouses.map(warehouseId => ({
        warehouseId,
        stock: 0
      }));

      // Prepare product data
      const productData: ProductInput = {
        name: formData.name,
        description: formData.description,
        code: formData.code,
        variantCode: formData.variantCode,
        verificationLink: formData.verificationLink,
        warehouses: warehousesData,
      };

      // Add image if available
      if (imageData) {
        productData.image = imageData;
      }

      let result;
      if (isEdit && product) {
        result = await updateProduct(product._id, productData);
      } else {
        result = await createProduct(productData);
      }

      if (!result.success) {
        if (result.errors) {
          setErrors(result.errors);
        }
        toast.error(result.message || t('products.errors.saveFailed'));
      } else {
        toast.success(isEdit ? t('products.productUpdated') : t('products.productCreated'));
        router.push('/dashboard/seller/products');
      }
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error(t('products.errors.unexpectedError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const isProcessing = isSubmitting || isUploading;

  // Group warehouses by country for better organization
  const warehousesByCountry: Record<string, typeof warehouses> = {};
  warehouses.forEach(warehouse => {
    if (!warehousesByCountry[warehouse.country]) {
      warehousesByCountry[warehouse.country] = [];
    }
    warehousesByCountry[warehouse.country].push(warehouse);
  });

  // Sort countries alphabetically
  const countries = Object.keys(warehousesByCountry).sort();

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>
          {isEdit ? t('products.editProduct') : t('products.createProduct')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">
              {t('products.sections.basicInfo')}
            </h3>
            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  {t('products.fields.name')} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder={t('products.placeholders.enterName')}
                  className={errors.name ? "border-destructive" : ""}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="code" className="text-sm font-medium">
                  {t('products.fields.code')} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="code"
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  placeholder={t('products.placeholders.enterCode')}
                  className={errors.code ? "border-destructive" : ""}
                />
                <p className="text-sm text-muted-foreground">
                  {t('products.help.uniqueCode')}
                </p>
                {errors.code && (
                  <p className="text-sm text-destructive">{errors.code}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="variantCode" className="text-sm font-medium">
                  {t('products.fields.variantCode')}
                </Label>
                <Input
                  id="variantCode"
                  name="variantCode"
                  value={formData.variantCode}
                  onChange={handleChange}
                  placeholder={t('products.placeholders.enterVariantCode')}
                />
                <p className="text-sm text-muted-foreground">
                  {t('products.help.optionalVariant')}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">
                {t('products.fields.description')} <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder={t('products.placeholders.enterDescription')}
                className={errors.description ? "border-destructive resize-none" : "resize-none"}
                rows={3}
              />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="verificationLink" className="text-sm font-medium">
                {t('products.fields.verificationLink')}
              </Label>
              <Input
                id="verificationLink"
                name="verificationLink"
                value={formData.verificationLink}
                onChange={handleChange}
                placeholder={t('products.placeholders.enterVerificationLink')}
              />
              <p className="text-sm text-muted-foreground">
                {t('products.help.verificationLink')}
              </p>
            </div>
          </div>

          {/* Inventory Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">
              {t('products.sections.warehouseDistribution')}
            </h3>
            <Separator />

            <div className="space-y-2">
              <Label className="text-sm font-medium">
                {t('products.fields.warehouses')} <span className="text-red-500">*</span>
              </Label>
              
              {warehouses.length > 0 ? (
                <div className="border rounded-md">
                  <ScrollArea className="h-64 rounded-md">
                    <div className="p-4">
                      {countries.map(country => (
                        <div key={country} className="mb-6 last:mb-0">
                          <h4 className="text-sm font-semibold mb-2 flex items-center">
                            <img className="h-4 w-4 mr-2"  src={COUNTRY_FLAGS[country]} alt="" />
                            {country}
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                            {warehousesByCountry[country].map(warehouse => (
                              <div
                                key={warehouse._id}
                                className={`
                                  p-3 rounded-md border cursor-pointer transition-colors
                                  ${selectedWarehouses.includes(warehouse._id) 
                                    ? 'border-primary bg-primary/5' 
                                    : 'hover:bg-muted/50'}
                                `}
                                onClick={() => handleWarehouseToggle(warehouse._id)}
                              >
                                <div className="flex items-start justify-between">
                                  <div className="font-medium truncate pr-2">{warehouse.name}</div>
                                  {selectedWarehouses.includes(warehouse._id) && (
                                    <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-4">
                  {t('products.noWarehousesAvailable')}
                </p>
              )}
              
              {errors.warehouses && (
                <p className="text-sm text-destructive mt-2">{errors.warehouses}</p>
              )}
            </div>
          </div>

          {/* Product Image */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">
              {t('products.sections.productImage')}
            </h3>
            <Separator />

            <div className="space-y-4">
              <div className="flex items-center gap-4">
                {imagePreview ? (
                  <div className="relative h-36 w-36 rounded-md overflow-hidden border">
                    <img
                      src={imagePreview}
                      alt="Product preview"
                      className="object-contain"
                    />
                    <Button 
                      variant="destructive" 
                      size="icon" 
                      className="absolute top-1 right-1 h-6 w-6 rounded-full"
                      onClick={handleClearImage}
                      type="button"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-36 w-36 rounded-md border border-dashed">
                    <ImageIcon className="h-10 w-10 text-muted-foreground" />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="product-image" className="text-sm font-medium">
                    {t('products.fields.productImage')}
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="product-image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('product-image')?.click()}
                      className="flex items-center gap-2"
                      disabled={isProcessing}
                    >
                      <Upload className="h-4 w-4" />
                      {imagePreview ? t('products.changeImage') : t('products.uploadImage')}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {t('products.help.imageRequirements')}
                  </p>
                  {errors.image && (
                    <p className="text-sm text-destructive">{errors.image}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/dashboard/seller/products')}
              disabled={isProcessing}
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isProcessing}>
              {isProcessing && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isUploading
                ? t('products.uploadingImage')
                : isSubmitting
                ? t('common.saving')
                : isEdit
                ? t('common.update')
                : t('common.create')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}