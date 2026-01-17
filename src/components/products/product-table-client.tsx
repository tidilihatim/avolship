"use client";

import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import ProductTable from "./product-table";
import { ProductTableData, ProductFilters } from "@/types/product";
import { PaginationData } from "@/types/user";
import { deleteProduct } from "@/app/actions/product";

interface ProductTableClientProps {
  products: ProductTableData[];
  allWarehouses: { _id: string; name: string; country: string }[];
  allSellers: { _id: string; name: string; email: string }[];
  pagination: PaginationData;
  error?: string;
  filters: ProductFilters;
  showSellerFilter: boolean;
}

export default function ProductTableClient({
  products,
  allWarehouses,
  allSellers,
  pagination,
  error,
  filters,
  showSellerFilter,
}: ProductTableClientProps) {
  const router = useRouter();
  const pathname = usePathname();

  // Determine the base path for navigation based on current route
  const getBasePath = () => {
    if (pathname.includes('/admin/')) {
      return '/dashboard/admin/products';
    } else if (pathname.includes('/moderator/')) {
      return '/dashboard/moderator/products';
    } else if (pathname.includes('/call_center/')) {
      return '/dashboard/call_center/products';
    } else {
      return '/dashboard/products'; // fallback for sellers
    }
  };

  const handleProductAction = async (action: 'view' | 'edit' | 'delete', productId: string) => {
    const basePath = getBasePath();

    switch (action) {
      case 'view':
        router.push(`${basePath}/${productId}`);
        break;
      case 'edit':
        router.push(`${basePath}/${productId}/edit`);
        break;
      case 'delete':
        if (confirm('Are you sure you want to delete this product?')) {
          try {
            const result = await deleteProduct(productId);
            if (result.success) {
              toast.success('Product deleted successfully');
              router.refresh();
            } else {
              toast.error(result.message || 'Failed to delete product');
            }
          } catch (error) {
            toast.error('An error occurred while deleting the product');
          }
        }
        break;
    }
  };

  return (
    <ProductTable
      products={products}
      allWarehouses={allWarehouses}
      allSellers={allSellers}
      pagination={pagination}
      error={error}
      filters={filters}
      showSellerFilter={showSellerFilter}
      onProductAction={handleProductAction}
    />
  );
}