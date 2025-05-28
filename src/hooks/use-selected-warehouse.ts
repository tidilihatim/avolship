'use client';

import { useWarehouse } from "@/context/warehouse";


/**
 * Hook to access the selected warehouse information
 * @returns The selected warehouse, or null if none selected
 */
export function useSelectedWarehouse() {
  const { selectedWarehouse, warehouses, isLoading, error, setSelectedWarehouse } = useWarehouse();
  
  return {
    warehouse: selectedWarehouse,
    warehouses,
    isLoading,
    error,
    setWarehouse: setSelectedWarehouse,
    
    // Helpful derived properties
    warehouseId: selectedWarehouse?._id,
    warehouseName: selectedWarehouse?.name,
    warehouseCountry: selectedWarehouse?.country,
    warehouseCity: selectedWarehouse?.city,
    warehouseCurrency: selectedWarehouse?.currency,
  };
}