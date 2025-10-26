"use client";
import React, { useState } from "react";
import { UserRole } from "@/lib/db/models/user";
import { useTranslations } from "next-intl";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building, Store } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AnimatePresence } from "framer-motion";
import EmailVerificationStep from "./registration/email-verification-step";
import RegistrationDetailsStep from "./registration/registration-details-step";

enum RegistrationStep {
  EMAIL_VERIFICATION = 'email_verification',
  REGISTRATION_DETAILS = 'registration_details'
}

export default function RegisterPage() {
  const t = useTranslations("register");
  const router = useRouter();

  const [userRole, setUserRole] = useState<UserRole.SELLER | UserRole.PROVIDER>(
    UserRole.SELLER
  );
  const [currentStep, setCurrentStep] = useState<RegistrationStep>(
    RegistrationStep.EMAIL_VERIFICATION
  );
  const [verifiedEmail, setVerifiedEmail] = useState<string>('');
  const [verifiedName, setVerifiedName] = useState<string>('');

  const handleVerificationSuccess = (email: string, name: string) => {
    setVerifiedEmail(email);
    setVerifiedName(name);
    setCurrentStep(RegistrationStep.REGISTRATION_DETAILS);
  };

  const handleBackToEmailVerification = () => {
    setCurrentStep(RegistrationStep.EMAIL_VERIFICATION);
  };

  const handleRegistrationSuccess = () => {
    // Redirect to login page after 3 seconds
    setTimeout(() => {
      router.push("/auth/login");
    }, 3000);
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
      <Tabs
        defaultValue="seller"
        className="w-full"
        onValueChange={(value) => {
          setUserRole(value === "seller" ? UserRole.SELLER : UserRole.PROVIDER);
        }}
      >
        <div className="flex items-center justify-center bg-[#1c2d51] py-6 px-8">
          <TabsList className="grid grid-cols-2 w-full max-w-md bg-white/10 rounded-md h-12">
            <TabsTrigger
              value="seller"
              className="data-[state=active]:bg-[#f37922] data-[state=active]:text-white rounded-md h-full flex items-center justify-center transition-colors font-semibold"
            >
              <Store className="h-5 w-5 mr-2" />
              {t("sellerTab")}
            </TabsTrigger>
            <TabsTrigger
              value="provider"
              className="data-[state=active]:bg-[#f37922] data-[state=active]:text-white rounded-md h-full flex items-center justify-center transition-colors font-semibold"
            >
              <Building className="h-5 w-5 mr-2" />
              {t("providerTab")}
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="p-8 md:p-12">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-semibold text-[#1c2d51] dark:text-white">
              {t("registerAs")}{" "}
              {userRole === UserRole.SELLER ? t("sellerTab") : t("providerTab")}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">{t("createAccount")}</p>
          </div>

          <AnimatePresence mode="wait">
            {currentStep === RegistrationStep.EMAIL_VERIFICATION ? (
              <EmailVerificationStep
                key="email-verification"
                onVerificationSuccess={handleVerificationSuccess}
                initialEmail={verifiedEmail}
                initialName={verifiedName}
              />
            ) : (
              <RegistrationDetailsStep
                key="registration-details"
                email={verifiedEmail}
                name={verifiedName}
                userRole={userRole}
                onBack={handleBackToEmailVerification}
                onSuccess={handleRegistrationSuccess}
              />
            )}
          </AnimatePresence>

          <div className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
            {t("alreadyHaveAccount")}{" "}
            <Link
              href="/auth/login"
              className="text-[#1c2d51] dark:text-[#f37922] font-semibold hover:underline"
            >
              {t("loginLink")}
            </Link>
          </div>
        </div>
      </Tabs>
    </div>
  );
}
