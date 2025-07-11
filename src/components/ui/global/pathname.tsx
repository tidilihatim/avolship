"use client";

import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import Navbar from "./navbar";
import Footer from "./footer";
import { cn } from "@/lib/utils";

// This a client component, still prerendered
export function Pathname({ children, locale }: { children: React.ReactNode, locale: string }) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  return (
    <>
      {
        !pathname?.startsWith("/dashboard") && !(pathname?.startsWith("/auth") && session?.user?.id) && (
            <Navbar currentLocale={locale} />
        )
      }
      <div className={cn("",!pathname?.startsWith("/dashboard") && "md:mt-22 md:mb-22 mt-12 mb-12")}>{children}</div>
      {
        !pathname?.startsWith("/dashboard") && !(pathname?.startsWith("/auth") && session?.user?.id) && (
            <Footer />
        )
      }
    </>
  );
}
