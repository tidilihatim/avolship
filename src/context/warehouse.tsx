"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Warehouse } from "@/types/warehouse";
import { getCookie, setCookie } from "cookies-next";
import { deleteCookie } from "@/app/actions/cookie";

interface WarehouseContextType {
  selectedWarehouse: Warehouse | null;
  warehouses: Warehouse[];
  isLoading: boolean;
  error: string | null;
  setSelectedWarehouse: (warehouse: Warehouse) => void;
}

// Create context with default values
const WarehouseContext = createContext<WarehouseContextType>({
  selectedWarehouse: null,
  warehouses: [],
  isLoading: true,
  error: null,
  setSelectedWarehouse: () => {},
});

/**
 * Custom hook to use the warehouse context
 */
export const useWarehouse = () => useContext(WarehouseContext);

interface WarehouseProviderProps {
  children: React.ReactNode;
  selectedWarehouseId?: string | null;
  initialWarehouses?: Warehouse[];
}

/**
 * WarehouseProvider component
 * Manages state for warehouses and selected warehouse
 */
export const WarehouseProvider: React.FC<WarehouseProviderProps> = ({
  children,
  initialWarehouses = [],
  selectedWarehouseId,
}) => {
  const router = useRouter();
  const [warehouses, setWarehouses] = useState<Warehouse[]>(initialWarehouses);
  const [selectedWarehouse, setSelectedWarehouseState] =
    useState<Warehouse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load warehouses and selected warehouse from API/cookies on mount
  useEffect(() => {
    const loadWarehouses = async () => {
      try {
        setIsLoading(true);

        // If we already have initialWarehouses, use them
        if (initialWarehouses.length > 0) {
          setWarehouses(initialWarehouses);
        } else {
          // Otherwise fetch warehouses - for client-side fallback
          const response = await fetch("/api/warehouses/active");

          if (!response.ok) {
            throw new Error("Failed to fetch warehouses");
          }

          const data = await response.json();
          setWarehouses(data.warehouses || []);
        }

        // Get selected warehouse from cookie
        const selectedWarehouseId = getCookie("selectedWarehouse");

        if (selectedWarehouseId) {
          // Find the warehouse in our list
          const warehouseFromCookie = warehouses.find(
            (w) => w._id === selectedWarehouseId
          );

          if (warehouseFromCookie) {
            setSelectedWarehouseState(warehouseFromCookie);
          } else if (warehouses.length > 0) {
            // If cookie warehouse not found, select first warehouse
            setSelectedWarehouseState(warehouses[0]);
            setCookie("selectedWarehouse", warehouses[0]._id, {
              maxAge: 30 * 24 * 60 * 60,
            }); // 30 days
          }
        } else if (warehouses.length > 0) {
          // No cookie but we have warehouses, select first one
          setSelectedWarehouseState(warehouses[0]);
          setCookie("selectedWarehouse", warehouses[0]._id, {
            maxAge: 30 * 24 * 60 * 60,
          }); // 30 days
        }

        if (selectedWarehouseId && warehouses.length > 0) {
          const warehouseExists = warehouses.some(
            (w: any) => w._id === selectedWarehouseId
          );

          // If the selected warehouse isn't active anymore, clear the cookie
          if (!warehouseExists) {
            deleteCookie("selectedWarehouse").then(() => {
              setIsLoading(false);
            })
          }
        }

        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      }
    };

    loadWarehouses();
  }, [initialWarehouses]);

  // Handler to set selected warehouse and update cookie
  const setSelectedWarehouse = (warehouse: Warehouse) => {
    setSelectedWarehouseState(warehouse);
    setCookie("selectedWarehouse", warehouse._id, {
      maxAge: 30 * 24 * 60 * 60,
    }); // 30 days

    // Refresh the page to reload data with the new warehouse context
    router.refresh();
  };

  return (
    <WarehouseContext.Provider
      value={{
        selectedWarehouse,
        warehouses,
        isLoading,
        error,
        setSelectedWarehouse,
      }}
    >
      {children}
    </WarehouseContext.Provider>
  );
};
