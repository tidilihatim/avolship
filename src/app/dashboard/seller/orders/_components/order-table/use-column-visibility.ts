"use client";

import { useState, useEffect } from "react";
import { ColumnVisibility, DEFAULT_COLUMN_VISIBILITY } from "./column-toggle";

const STORAGE_KEY = "order-table-column-visibility";

export function useColumnVisibility() {
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibility>(
    DEFAULT_COLUMN_VISIBILITY
  );

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsedVisibility = JSON.parse(stored);
        // Merge with default to ensure all columns are present
        const mergedVisibility = {
          ...DEFAULT_COLUMN_VISIBILITY,
          ...parsedVisibility,
        };
        setColumnVisibility(mergedVisibility);
      }
    } catch (error) {
      console.error("Error loading column visibility from localStorage:", error);
      setColumnVisibility(DEFAULT_COLUMN_VISIBILITY);
    }
  }, []);

  // Save to localStorage whenever visibility changes
  const updateColumnVisibility = (newVisibility: ColumnVisibility) => {
    setColumnVisibility(newVisibility);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newVisibility));
    } catch (error) {
      console.error("Error saving column visibility to localStorage:", error);
    }
  };

  return {
    columnVisibility,
    setColumnVisibility: updateColumnVisibility,
  };
}