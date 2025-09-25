"use client";
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { UserRole } from "@/lib/db/models/user";
import { registerSeller, registerProvider } from "@/app/actions/auth";
import { useTranslations } from "next-intl";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertCircle,
  CheckCircle,
  Loader2,
  Building,
  Store,
  ShieldCheck,
  Lock,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { getCountryNames } from "@/constants/countries";

// Get all countries from the constants file
const allCountries = getCountryNames();

// Create a common base type that can work with conditional fields
type CommonFormValues = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  countryCode: string;
  country: string;
  businessName: string;
  businessInfo: string;
  serviceType?: string;
  role: UserRole.SELLER | UserRole.PROVIDER;
};

export default function RegisterPage() {
  const t = useTranslations("register");

  const [userRole, setUserRole] = useState<UserRole.SELLER | UserRole.PROVIDER>(
    UserRole.SELLER
  );
  const [loading, setLoading] = useState(false);
  const [formMessage, setFormMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const router = useRouter();

  // Create a form with common shape that will handle both types
  const form = useForm<CommonFormValues>({
    resolver: zodResolver(
      // Add runtime validation for password match
      z
        .object({
          name: z.string().min(2, { message: t("nameError") }),
          email: z.string().email({ message: t("emailError") }),
          password: z
            .string()
            .min(8, { message: t("passwordLengthError") })
            .regex(/[A-Z]/, { message: t("passwordUppercaseError") })
            .regex(/[a-z]/, { message: t("passwordLowercaseError") })
            .regex(/[0-9]/, { message: t("passwordNumberError") }),
          confirmPassword: z.string(),
          countryCode: z.string(),
          phone: z.string().min(5, { message: t("phoneError") }),
          country: z.string().min(2, { message: t("countryError") }),
          businessName: z.string().min(2, { message: t("businessNameError") }),
          businessInfo: z.string().min(10, { message: t("businessInfoError") }),
          serviceType: z.string().optional(),
          role: z.enum([UserRole.SELLER, UserRole.PROVIDER]),
        })
        .refine((data) => data.password === data.confirmPassword, {
          message: t("passwordsMatchError"),
          path: ["confirmPassword"],
        })
        .refine(
          (data) => !(data.role === UserRole.PROVIDER && !data.serviceType),
          {
            message: t("serviceTypeRequiredError"),
            path: ["serviceType"],
          }
        )
    ),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      countryCode: "",
      phone: "",
      country: "",
      businessName: "",
      businessInfo: "",
      serviceType: "",
      role: userRole,
    },
  });

  // Update the role when it changes
  useEffect(() => {
    form.setValue("role", userRole);
  }, [userRole, form]);

  // Update country code when country changes
  useEffect(() => {
    if (selectedCountry) {
      // For now, clear the country code since we don't have calling codes
      // You may want to add a separate calling codes mapping if needed
      form.setValue("countryCode", "");
    }
  }, [selectedCountry, form]);

  const onSubmit = async (data: CommonFormValues) => {
    setLoading(true);
    setFormMessage(null);

    try {
      // Combine country code and phone number
      const fullPhone = `${data.countryCode}${data.phone}`;

      let result;

      if (data.role === UserRole.SELLER) {
        const { serviceType, countryCode, ...sellerData } = data;

        result = await registerSeller({
          ...sellerData,
          phone: fullPhone,
          role: userRole as UserRole.SELLER,
        });
      } else {
        const { countryCode, ...providerData } = data;

        result = await registerProvider({
          ...providerData,
          phone: fullPhone,
          role: userRole as UserRole.PROVIDER,
          serviceType: data.serviceType as string,
        });
      }

      if (result.success) {
        setFormMessage({
          type: "success",
          text: result.message || t("successMessage"),
        });
        form.reset();

        // Redirect to login page after 3 seconds
        setTimeout(() => {
          router.push("/auth/login");
        }, 3000);
      } else {
        setFormMessage({
          type: "error",
          text: result.message || t("errorGeneric"),
        });
      }
    } catch (error) {
      setFormMessage({
        type: "error",
        text: t("errorGeneric"),
      });
      console.error("Form submission error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-[#e3e4e8]">
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
              className={`data-[state=active]:bg-[#f37922] data-[state=active]:text-white rounded-md h-full flex items-center justify-center transition-colors font-semibold`}
            >
              <Store className="h-5 w-5 mr-2" />
              {t("sellerTab")}
            </TabsTrigger>
            <TabsTrigger
              value="provider"
              className={`data-[state=active]:bg-[#f37922] data-[state=active]:text-white rounded-md h-full flex items-center justify-center transition-colors font-semibold`}
            >
              <Building className="h-5 w-5 mr-2" />
              {t("providerTab")}
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="p-8 md:p-12">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-semibold text-[#1c2d51]">
              {t("registerAs")}{" "}
              {userRole === UserRole.SELLER ? t("sellerTab") : t("providerTab")}
            </h1>
            <p className="text-gray-600 mt-2">{t("createAccount")}</p>
          </div>

          {/* Form message */}
          {formMessage && (
            <div
              className={`p-4 mb-6 rounded-md flex items-start gap-3 ${
                formMessage.type === "success"
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {formMessage.type === "success" ? (
                <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
              ) : (
                <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
              )}
              <p>{formMessage.text}</p>
            </div>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="space-y-6">
                <div className="p-6 bg-[#e3e4e8]/20 rounded-md border border-[#e3e4e8]">
                  <h2 className="font-medium text-[#1c2d51] mb-5 flex items-center">
                    <ShieldCheck className="h-5 w-5 mr-2 text-[#1c2d51]" />
                    {t("personalDetails")}
                  </h2>
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Name */}
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">
                            {t("fullName")}
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder={t("fullNamePlaceholder")}
                              className="rounded-md shadow-sm border-[#d1d5db]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Email */}
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">
                            {t("email")}
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder={t("emailPlaceholder")}
                              type="email"
                              className="rounded-md shadow-sm border-[#d1d5db]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Country */}
                    <FormField
                      control={form.control}
                      name="country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">
                            {t("country")}
                          </FormLabel>
                          <Select
                            onValueChange={(value) => {
                              field.onChange(value);
                              setSelectedCountry(value);
                            }}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="rounded-md shadow-sm border-[#d1d5db]">
                                <SelectValue
                                  placeholder={t("countryPlaceholder")}
                                />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {allCountries.map((country) => (
                                <SelectItem
                                  key={country}
                                  value={country}
                                >
                                  {country}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Phone with country code */}
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        {t("phoneNumber")}
                      </FormLabel>
                      <div className="flex gap-2">
                        <div className="w-1/3">
                          <FormField
                            control={form.control}
                            name="countryCode"
                            render={({ field }) => (
                              <FormControl>
                                <Input
                                  placeholder="+123"
                                  className="rounded-md shadow-sm border-[#d1d5db]"
                                  {...field}
                                  disabled={!selectedCountry}
                                />
                              </FormControl>
                            )}
                          />
                        </div>
                        <div className="w-2/3">
                          <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                              <FormControl>
                                <Input
                                  placeholder={t("phonePlaceholder")}
                                  type="tel"
                                  className="rounded-md shadow-sm border-[#d1d5db]"
                                  {...field}
                                />
                              </FormControl>
                            )}
                          />
                        </div>
                      </div>
                      <FormField
                        control={form.control}
                        name="phone"
                        render={() => <FormMessage />}
                      />
                    </FormItem>
                  </div>
                </div>

                <div className="p-6 bg-[#e3e4e8]/20 rounded-md border border-[#e3e4e8]">
                  <h2 className="font-medium text-[#1c2d51] mb-5 flex items-center">
                    <Lock className="h-5 w-5 mr-2 text-[#1c2d51]" />
                    {t("securityDetails")}
                  </h2>
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Password */}
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">
                            {t("password")}
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder={t("passwordPlaceholder")}
                              type="password"
                              className="rounded-md shadow-sm border-[#d1d5db]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Confirm Password */}
                    <FormField
                      control={form.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">
                            {t("confirmPassword")}
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder={t("confirmPasswordPlaceholder")}
                              type="password"
                              className="rounded-md shadow-sm border-[#d1d5db]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="p-6 bg-[#e3e4e8]/20 rounded-md border border-[#e3e4e8]">
                  <h2 className="font-medium text-[#1c2d51] mb-5 flex items-center">
                    <Building className="h-5 w-5 mr-2 text-[#1c2d51]" />
                    {t("businessDetails")}
                  </h2>
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Business Name */}
                    <FormField
                      control={form.control}
                      name="businessName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">
                            {t("businessName")}
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder={t("businessNamePlaceholder")}
                              className="rounded-md shadow-sm border-[#d1d5db]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Service Type - Only for Providers */}
                    {userRole === UserRole.PROVIDER && (
                      <FormField
                        control={form.control}
                        name="serviceType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">
                              {t("serviceType")}
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder={t("serviceTypePlaceholder")}
                                className="rounded-md shadow-sm border-[#d1d5db]"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>

                  {/* Business Info */}
                  <FormField
                    control={form.control}
                    name="businessInfo"
                    render={({ field }) => (
                      <FormItem className="mt-6">
                        <FormLabel className="text-sm font-medium">
                          {userRole === UserRole.SELLER
                            ? t("businessInfo")
                            : t("servicesDescription")}
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder={
                              userRole === UserRole.SELLER
                                ? t("businessInfoPlaceholder")
                                : t("servicesDescPlaceholder")
                            }
                            className="min-h-[100px] rounded-md shadow-sm border-[#d1d5db]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="flex flex-col space-y-4">
                <Button
                  type="submit"
                  className={cn(
                    "w-full px-6 py-3 cursor-pointer rounded-xl flex items-center justify-center gap-2",
                    "transition-all duration-300",
                    "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50",
                    "bg-gradient-to-r from-[#1c2d51] to-[#f37922] text-white hover:from-[#1c2d51]/90 hover:to-[#f37922]/90",
                    loading && "opacity-70 cursor-not-allowed"
                  )}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      {t("registeringButton")}
                    </>
                  ) : (
                    t("registerButton")
                  )}
                </Button>
                <div className="text-center text-sm text-gray-600">
                  {t("alreadyHaveAccount")}{" "}
                  <Link
                    href="/auth/login"
                    className="text-[#1c2d51] font-semibold hover:underline"
                  >
                    {t("loginLink")}
                  </Link>
                </div>
              </div>
            </form>
          </Form>
        </div>
      </Tabs>
    </div>
  );
}
