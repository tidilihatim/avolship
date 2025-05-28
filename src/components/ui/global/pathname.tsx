"use client";

import { usePathname } from "next/navigation";
import Navbar from "./navbar";
import Footer from "./footer";
import { cn } from "@/lib/utils";

// This a client component, still prerendered
export function Pathname({ children, locale }: { children: React.ReactNode, locale: string }) {
  const pathname = usePathname();
  return (
    <>
      {
        !pathname?.startsWith("/dashboard") && (
            <Navbar currentLocale={locale} />
        )
      }
      <div className={cn("",!pathname?.startsWith("/dashboard") && "md:mt-22 md:mb-22 mt-12 mb-12")}>{children}</div>
      {
        !pathname?.startsWith("/dashboard") && (
            <Footer />
        )
      }
    </>
  );
}
