import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing - AvolShip | Transparent Fulfillment Fees",
  description:
    "Discover AvolShip's transparent pricing structure. $0.30 per order includes confirmation, warehouse, processing, and service fees. No hidden charges for your logistics and fulfillment needs.",
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
