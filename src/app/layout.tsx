import "./globals.css";
import type { Metadata } from "next";
// import { Inter } from 'next/font/google';
import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "next-intl/server";
import Navbar from "@/components/ui/global/navbar";
import Footer from "@/components/ui/global/footer";
import AuthSessionProvider from "@/components/providers/auth-providers";
import { headers } from "next/headers";
import { Pathname } from "@/components/ui/global/pathname";

// const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: "AvolShip - Fulfillment Services Platform",
  description:
    "A centralized system for managing logistics, warehousing, order processing, and customer communication across multiple African countries.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  return (
    <html lang={locale} suppressHydrationWarning>
      {/* <body className={inter.className}> */}
      <body>
        <NextIntlClientProvider>
          <div className="min-h-screen">
            <AuthSessionProvider>
              <Pathname locale={locale}>
                {children}
              </Pathname>
            </AuthSessionProvider>
          </div>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
