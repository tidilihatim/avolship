"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"


export function ThemeProvider({ children, ...props }:any) {
  React.useEffect(() => {
    return () => {
      document.documentElement.classList.remove(
        "light",
        "dark",
        "theme-default",
        "theme-orange",
        "theme-rose",
        "theme-blue",
        "theme-green",
        "theme-purpleish",
        "theme-cyanish",
        "theme-yellowish",
        "theme-maronish",
        "theme-lightish",
        "theme-lightish-pink",
        "theme-lightish-blue",
        "theme-darkish-blue",
        "theme-darkish-purple",
        "theme-darkish"
      );
    };
  }, []);
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}