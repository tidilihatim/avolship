"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import {
  XCircle,
  ArrowRight,
  RefreshCw,
  MailCheck,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { signOut } from "next-auth/react";

/**
 * Content to display when user's account is rejected
 */
export default function StatusRejected() {
  const t = useTranslations("status");
  const router = useRouter();

  // Navigate to contact form
  const handleContactSupport = () => {
    router.push("/contact");
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
        <Card className="border-destructive/40 bg-destructive/5 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 -mt-8 -mr-8 bg-destructive/10 rounded-full" />
          <div className="absolute bottom-0 left-0 w-24 h-24 -mb-6 -ml-6 bg-destructive/10 rounded-full" />

          <CardHeader>
            <div className="flex items-center gap-2">
              <XCircle className="text-destructive h-6 w-6" />
              <CardTitle>{t("rejected.title")}</CardTitle>
            </div>
            <CardDescription>{t("rejected.description")}</CardDescription>
          </CardHeader>

          <CardContent className="pt-2">
            <div className="flex justify-center mb-6">
              <div className="relative w-40 h-40">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  x="0px"
                  y="0px"
                  width="150"
                  height="150"
                  viewBox="0 0 48 48"
                >
                  <path
                    fill="#f44336"
                    d="M44,24c0,11.045-8.955,20-20,20S4,35.045,4,24S12.955,4,24,4S44,12.955,44,24z"
                  ></path>
                  <path
                    fill="#fff"
                    d="M29.656,15.516l2.828,2.828l-14.14,14.14l-2.828-2.828L29.656,15.516z"
                  ></path>
                  <path
                    fill="#fff"
                    d="M32.484,29.656l-2.828,2.828l-14.14-14.14l2.828-2.828L32.484,29.656z"
                  ></path>
                </svg>
              </div>
            </div>

            <div className="bg-card rounded-lg border p-4 mb-4 relative z-10">
              <h3 className="font-medium flex items-center gap-2 mb-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                {t("rejected.reason.title")}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {t("rejected.reason.description")}
              </p>

              <Accordion
                type="single"
                collapsible
                className="w-full cursor-pointer"
              >
                <AccordionItem
                  value="item-1"
                  className="border-b-0 cursor-pointer"
                >
                  <AccordionTrigger className="py-2 cursor-pointer">
                    <span className="text-sm font-medium">
                      {t("rejected.reason.list.verification.title")}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="cursor-pointer">
                    <p className="text-sm cursor-pointer text-muted-foreground pl-4 pb-2">
                      {t("rejected.reason.list.verification.description")}
                    </p>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2" className="border-b-0">
                  <AccordionTrigger className="py-2 cursor-pointer">
                    <span className="text-sm cursor-pointer font-medium">
                      {t("rejected.reason.list.information.title")}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="text-sm text-muted-foreground pl-4 pb-2">
                      {t("rejected.reason.list.information.description")}
                    </p>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem
                  value="item-3"
                  className="border-b-0 cursor-pointer"
                >
                  <AccordionTrigger className="py-2 cursor-pointer">
                    <span className="text-sm font-medium">
                      {t("rejected.reason.list.requirements.title")}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="text-sm text-muted-foreground pl-4 pb-2">
                      {t("rejected.reason.list.requirements.description")}
                    </p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>

            <div className="space-y-4 relative z-10">
              <div className="flex items-start gap-3">
                <div className="bg-primary/20 p-2 rounded-full flex-shrink-0">
                  <RefreshCw className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">
                    {t("rejected.nextSteps.reapply.title")}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t("rejected.nextSteps.reapply.description")}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-primary/20 p-2 rounded-full flex-shrink-0">
                  <MailCheck className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">
                    {t("rejected.nextSteps.contact.title")}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t("rejected.nextSteps.contact.description")}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-primary/20 p-2 rounded-full flex-shrink-0">
                  <HelpCircle className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">
                    {t("rejected.nextSteps.support.title")}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t("rejected.nextSteps.support.description")}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>

          <CardFooter className="border-t bg-card flex flex-wrap gap-2 sm:gap-0 sm:flex-nowrap sm:justify-between">
            <Button variant="outline" onClick={() => signOut()}>
              {t("rejected.signOut")}
            </Button>
            <Button className="gap-2" onClick={handleContactSupport}>
              {t("rejected.contact")}
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
          {t("rejected.appealText")}
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
