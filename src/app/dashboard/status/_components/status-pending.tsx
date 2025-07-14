"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import {
  Clock,
  ArrowRight,
  MailCheck,
  Info,
  HelpCircle,
  Hourglass,
} from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { signOut } from "next-auth/react";
import { LogoutButton } from "@/components/auth/logout-button";

/**
 * Content to display when user's account is pending approval
 */
export default function StatusPending() {
  const t = useTranslations("status");
  const router = useRouter();

  // Animation for progress bar
  const [progress, setProgress] = useState(15);

  useEffect(() => {
    const timer = setTimeout(() => setProgress(66), 500);
    return () => clearTimeout(timer);
  }, []);

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
        <Card className="border-primary/40 bg-primary/5 overflow-hidden relative">
          {/* Background decorative elements with fixed positioning */}
          <div className="absolute top-0 right-0 w-32 h-32 -mt-8 -mr-8 bg-primary/10 rounded-full" />
          <div className="absolute bottom-0 left-0 w-24 h-24 -mb-6 -ml-6 bg-primary/10 rounded-full" />

          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="text-primary h-6 w-6" />
              <CardTitle>{t("pending.title")}</CardTitle>
            </div>
            <CardDescription>{t("pending.description")}</CardDescription>
          </CardHeader>

          <CardContent className="pt-2">
            <div className="flex justify-center mb-6">
              <div className="relative w-40 h-40">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="160" 
                  height="160"
                  viewBox="0 0 200 200"
                  fill="none"
                  className="max-w-full"
                >
                  <circle cx="100" cy="100" r="80" fill="#F0F9FF" />
                  <circle
                    cx="100"
                    cy="100"
                    r="50"
                    stroke="#0EA5E9"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M100 70V100L120 120"
                    stroke="#0EA5E9"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M160 100C160 73.49 138.51 52 112 52"
                    stroke="#0EA5E9"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <animateTransform
                      attributeName="transform"
                      attributeType="XML"
                      type="rotate"
                      from="0 100 100"
                      to="360 100 100"
                      dur="10s"
                      repeatCount="indefinite"
                    />
                  </path>
                  <path
                    d="M40 100C40 126.51 61.49 148 88 148"
                    stroke="#0EA5E9"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <animateTransform
                      attributeName="transform"
                      attributeType="XML"
                      type="rotate"
                      from="0 100 100"
                      to="360 100 100"
                      dur="15s"
                      repeatCount="indefinite"
                    />
                  </path>
                  <circle cx="100" cy="54" r="4" fill="#0EA5E9" />
                  <circle cx="100" cy="146" r="4" fill="#0EA5E9" />
                  <circle cx="54" cy="100" r="4" fill="#0EA5E9" />
                  <circle cx="146" cy="100" r="4" fill="#0EA5E9" />
                </svg>
              </div>
            </div>

            <div className="bg-card rounded-lg border p-4 mb-6 relative z-10">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium flex items-center gap-2">
                  <Hourglass className="h-5 w-5 text-primary" />
                  {t("pending.status.title")}
                </h3>
                <span className="text-sm text-primary font-medium">
                  {t("pending.status.inReview")}
                </span>
              </div>
              <Progress value={progress} className="h-2 mb-2" />
              <div className="grid grid-cols-3 text-xs text-muted-foreground">
                <span>{t("pending.status.received")}</span>
                <span className="text-center">{t("pending.status.processing")}</span>
                <span className="text-right">{t("pending.status.completed")}</span>
              </div>
            </div>

            <div className="space-y-4 relative z-10">
              <div className="flex items-start gap-3">
                <div className="bg-primary/20 p-2 rounded-full flex-shrink-0">
                  <Info className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">
                    {t("pending.info.timeframe.title")}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t("pending.info.timeframe.description")}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-primary/20 p-2 rounded-full flex-shrink-0">
                  <MailCheck className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">
                    {t("pending.info.notification.title")}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t("pending.info.notification.description")}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-primary/20 p-2 rounded-full flex-shrink-0">
                  <HelpCircle className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">
                    {t("pending.info.questions.title")}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t("pending.info.questions.description")}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>

          <CardFooter className="border-t bg-card flex flex-wrap gap-2 sm:gap-0 sm:flex-nowrap sm:justify-between">
            <LogoutButton>
              <Button variant="outline">
                {t("pending.signOut")}
              </Button>
            </LogoutButton>
            <Button
              variant="outline"
              className="gap-2"
              onClick={handleContactSupport}
            >
              {t("pending.contact")}
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
          {t("pending.checkEmail")}
          <span className="text-foreground font-medium ml-1">
            {t("pending.estimatedTime")}
          </span>
        </p>
      </motion.div>
    </motion.div>
  );
}