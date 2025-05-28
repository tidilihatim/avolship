"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  ArrowRight,
  Rocket,
  Settings,
  ShieldCheck,
  Building,
} from "lucide-react";
import Image from "next/image";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * Content to display when user's account is approved
 */
export default function StatusApproved() {
  const t = useTranslations("status");
  const router = useRouter();

  // Navigate to dashboard
  const handleContinue = () => {
    router.push("/dashboard/seller");
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
      },
    },
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-6 w-full"
    >
      <motion.div variants={itemVariants}>
        <Card className="border-success/40 bg-success/5 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 -mt-8 -mr-8 bg-success/10 rounded-full" />
          <div className="absolute bottom-0 left-0 w-24 h-24 -mb-6 -ml-6 bg-success/10 rounded-full" />

          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="text-success h-6 w-6" />
              <CardTitle>{t("approved.title")}</CardTitle>
            </div>
            <CardDescription>{t("approved.description")}</CardDescription>
          </CardHeader>

          <CardContent className="pt-2">
            <div className="flex justify-center mb-6">
              <div className="relative w-40 h-40">
                <img src="https://img.icons8.com/?size=300&id=63262&format=png&color=000000" alt="" />
              </div>
            </div>

            <div className="space-y-4 relative z-10">
              <div className="flex items-start gap-3">
                <div className="bg-success/20 p-2 rounded-full flex-shrink-0">
                  <ShieldCheck className="h-5 w-5 text-success" />
                </div>
                <div>
                  <h3 className="font-medium">
                    {t("approved.features.access.title")}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t("approved.features.access.description")}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-success/20 p-2 rounded-full flex-shrink-0">
                  <Building className="h-5 w-5 text-success" />
                </div>
                <div>
                  <h3 className="font-medium">
                    {t("approved.features.warehouse.title")}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t("approved.features.warehouse.description")}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-success/20 p-2 rounded-full flex-shrink-0">
                  <Rocket className="h-5 w-5 text-success" />
                </div>
                <div>
                  <h3 className="font-medium">
                    {t("approved.features.tools.title")}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t("approved.features.tools.description")}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>

          <CardFooter className="border-t bg-card flex flex-wrap gap-2 sm:gap-0 sm:flex-nowrap sm:justify-end">
            <Button
              className="gap-2 w-full sm:w-auto"
              onClick={handleContinue}
            >
              {t("approved.continue")}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      </motion.div>

      <motion.div
        variants={itemVariants}
        className="text-center text-sm text-muted-foreground"
      >
        <p>
          {t("approved.support")}
          <a
            href="mailto:support@avolship.com"
            className="text-primary hover:underline ml-1"
          >
            support@avolship.com
          </a>
        </p>
      </motion.div>
    </motion.div>
  );
}
