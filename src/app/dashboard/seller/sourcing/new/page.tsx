"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Package, Upload, Calendar, DollarSign, AlertCircle, Link, Search } from "lucide-react";
import { createSourcingRequestSchema } from "@/lib/validations/sourcing";

type FormData = z.infer<typeof createSourcingRequestSchema>;

interface Warehouse {
  _id: string;
  name: string;
  city?: string;
  location?: string; // For backward compatibility
  country: string;
}

interface Product {
  _id: string;
  name: string;
  code: string;
  description: string;
  image?: {
    url: string;
  };
  totalStock: number;
  status?: string;
}

export default function NewSourcingRequestPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productSearch, setProductSearch] = useState("");

  const form = useForm<FormData>({
    resolver: zodResolver(createSourcingRequestSchema),
    defaultValues: {
      currency: "USD",
      urgencyLevel: "MEDIUM",
      sourcingCountry: "China",
    },
  });

  useEffect(() => {
    fetchWarehouses();
    fetchProducts();
  }, []);

  const fetchWarehouses = async () => {
    try {
      const response = await fetch("/api/warehouses");
      const data = await response.json();
      if (response.ok) {
        setWarehouses(data.data || []);
        console.log("Fetched warehouses:", data.data);
      } else {
        console.error("API error:", data.error);
        toast.error("Failed to fetch warehouses");
      }
    } catch (error) {
      console.error("Failed to fetch warehouses:", error);
      toast.error("Failed to fetch warehouses");
    }
  };

  const fetchProducts = async () => {
    try {
      // Fetch all products for sourcing, regardless of status
      const response = await fetch("/api/products");
      const data = await response.json();
      if (response.ok) {
        setProducts(data.data || []);
        console.log("Fetched products:", data.data);
      } else {
        console.error("API error:", data.error);
        toast.error("Failed to fetch products");
      }
    } catch (error) {
      console.error("Failed to fetch products:", error);
      toast.error("Failed to fetch products");
    }
  };

  const handleProductSelect = (productId: string) => {
    const product = products.find(p => p._id === productId);
    if (product) {
      setSelectedProduct(product);
      form.setValue("productId", product._id);
    }
  };

  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    product.code.toLowerCase().includes(productSearch.toLowerCase())
  );

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const response = await fetch("/api/sourcing", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success("Sourcing request created successfully");
        router.push(`/dashboard/seller/sourcing/${result.data._id}`);
      } else {
        toast.error(result.error || "Failed to create sourcing request");
      }
    } catch (error) {
      toast.error("Failed to create sourcing request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Sourcing Request</h1>
          <p className="text-muted-foreground">
            Request products from providers for your inventory
          </p>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Select Product</CardTitle>
            <CardDescription>
              Choose the product you want to source from your catalog
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="productSearch">Search Products</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  id="productSearch"
                  placeholder="Search by product name or code..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="product">Select Product</Label>
              <Select
                value={selectedProduct?._id || ""}
                onValueChange={handleProductSelect}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a product from your catalog" />
                </SelectTrigger>
                <SelectContent>
                  {filteredProducts.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">
                      <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No products found</p>
                      <p className="text-xs mt-1">Add products to your catalog first</p>
                    </div>
                  ) : (
                    filteredProducts.map((product) => (
                      <SelectItem key={product._id} value={product._id}>
                        <div className="flex items-center gap-2">
                          {product.image && (
                            <img 
                              src={product.image.url} 
                              alt={product.name}
                              className="h-8 w-8 object-cover rounded"
                            />
                          )}
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-muted-foreground">
                              Code: {product.code} | Stock: {product.totalStock} | Status: {product.status || 'active'}
                            </p>
                          </div>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {form.formState.errors.productId && (
                <p className="text-sm text-red-500">{form.formState.errors.productId.message}</p>
              )}
            </div>

            {selectedProduct && (
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <h4 className="font-medium">Selected Product Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  {selectedProduct.image && (
                    <img 
                      src={selectedProduct.image.url} 
                      alt={selectedProduct.name}
                      className="w-full h-32 object-cover rounded-md col-span-2"
                    />
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium">{selectedProduct.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Code</p>
                    <p className="font-medium">{selectedProduct.code}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Description</p>
                    <p className="text-sm">{selectedProduct.description}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="sourceLink">Product Source Link</Label>
              <div className="relative">
                <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  id="sourceLink"
                  placeholder="https://example.com/product-link"
                  {...form.register("sourceLink")}
                  className="pl-10"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Provide a link where the sourcing team can see/buy this product
              </p>
              {form.formState.errors.sourceLink && (
                <p className="text-sm text-red-500">{form.formState.errors.sourceLink.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sourcing Details</CardTitle>
            <CardDescription>
              Specify quantity, pricing, and delivery requirements
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  placeholder="e.g., 100"
                  {...form.register("quantity", { valueAsNumber: true })}
                />
                {form.formState.errors.quantity && (
                  <p className="text-sm text-red-500">{form.formState.errors.quantity.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="targetPrice">Target Price per Unit</Label>
                <div className="flex gap-2">
                  <Select
                    value={form.watch("currency")}
                    onValueChange={(value) => form.setValue("currency", value)}
                  >
                    <SelectTrigger className="w-[100px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="MAD">MAD</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    id="targetPrice"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...form.register("targetPrice", { valueAsNumber: true })}
                    className="flex-1"
                  />
                </div>
                {form.formState.errors.targetPrice && (
                  <p className="text-sm text-red-500">{form.formState.errors.targetPrice.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sourcingCountry">Sourcing Country</Label>
                <Select
                  value={form.watch("sourcingCountry")}
                  onValueChange={(value) => form.setValue("sourcingCountry", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select sourcing country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="China">China</SelectItem>
                    <SelectItem value="Turkey">Turkey</SelectItem>
                    <SelectItem value="Morocco">Morocco</SelectItem>
                    <SelectItem value="India">India</SelectItem>
                    <SelectItem value="Vietnam">Vietnam</SelectItem>
                    <SelectItem value="Bangladesh">Bangladesh</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.sourcingCountry && (
                  <p className="text-sm text-red-500">{form.formState.errors.sourcingCountry.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="preferredSupplierRegion">Preferred Supplier Region (Optional)</Label>
                <Input
                  id="preferredSupplierRegion"
                  placeholder="e.g., Guangzhou, Istanbul, Casablanca"
                  {...form.register("preferredSupplierRegion")}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="destinationWarehouse">Destination Warehouse</Label>
                <Select
                  value={form.watch("destinationWarehouse")}
                  onValueChange={(value) => form.setValue("destinationWarehouse", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select warehouse" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map((warehouse) => (
                      <SelectItem key={warehouse._id} value={warehouse._id}>
                        {warehouse.name} - {warehouse.city || warehouse.location || warehouse.country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.destinationWarehouse && (
                  <p className="text-sm text-red-500">{form.formState.errors.destinationWarehouse.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="requiredByDate">Required By Date</Label>
                <Input
                  id="requiredByDate"
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  {...form.register("requiredByDate")}
                />
                {form.formState.errors.requiredByDate && (
                  <p className="text-sm text-red-500">{form.formState.errors.requiredByDate.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="urgencyLevel">Urgency Level</Label>
              <Select
                value={form.watch("urgencyLevel")}
                onValueChange={(value) => form.setValue("urgencyLevel", value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low - Flexible timeline</SelectItem>
                  <SelectItem value="MEDIUM">Medium - Standard timeline</SelectItem>
                  <SelectItem value="HIGH">High - Need soon</SelectItem>
                  <SelectItem value="URGENT">Urgent - Need immediately</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                placeholder="Any special requirements, preferences, or additional information..."
                rows={3}
                {...form.register("notes")}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Creating...
              </>
            ) : (
              <>
                <Package className="h-4 w-4 mr-2" />
                Create Request
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}