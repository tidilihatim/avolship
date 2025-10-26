'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { UserRole } from '@/lib/db/models/user';
import { registerSeller, registerProvider } from '@/app/actions/auth';
import { useTranslations } from 'next-intl';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Loader2,
  Building,
  ShieldCheck,
  Lock,
  ArrowLeft,
  CheckCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { getCountryNames } from '@/constants/countries';

// Get all countries from the constants file
const allCountries = getCountryNames();

// Form values type
type RegistrationDetailsFormValues = {
  password: string;
  confirmPassword: string;
  phone: string;
  countryCode: string;
  country: string;
  businessName: string;
  businessInfo: string;
  serviceType?: string;
};

interface RegistrationDetailsStepProps {
  email: string;
  name: string;
  userRole: UserRole.SELLER | UserRole.PROVIDER;
  onBack: () => void;
  onSuccess: () => void;
}

export default function RegistrationDetailsStep({
  email,
  name,
  userRole,
  onBack,
  onSuccess
}: RegistrationDetailsStepProps) {
  const t = useTranslations('register');

  const [loading, setLoading] = useState(false);
  const [formMessage, setFormMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string>('');

  const form = useForm<RegistrationDetailsFormValues>({
    resolver: zodResolver(
      z
        .object({
          password: z
            .string()
            .min(8, { message: t('passwordLengthError') })
            .regex(/[A-Z]/, { message: t('passwordUppercaseError') })
            .regex(/[a-z]/, { message: t('passwordLowercaseError') })
            .regex(/[0-9]/, { message: t('passwordNumberError') }),
          confirmPassword: z.string(),
          countryCode: z.string(),
          phone: z.string().min(5, { message: t('phoneError') }),
          country: z.string().min(2, { message: t('countryError') }),
          businessName: z.string().min(2, { message: t('businessNameError') }),
          businessInfo: z.string().min(10, { message: t('businessInfoError') }),
          serviceType: z.string().optional(),
        })
        .refine((data) => data.password === data.confirmPassword, {
          message: t('passwordsMatchError'),
          path: ['confirmPassword'],
        })
        .refine(
          (data) => !(userRole === UserRole.PROVIDER && !data.serviceType),
          {
            message: t('serviceTypeRequiredError'),
            path: ['serviceType'],
          }
        )
    ),
    defaultValues: {
      password: '',
      confirmPassword: '',
      countryCode: '',
      phone: '',
      country: '',
      businessName: '',
      businessInfo: '',
      serviceType: '',
    },
  });

  // Update country code when country changes
  useEffect(() => {
    if (selectedCountry) {
      form.setValue('countryCode', '');
    }
  }, [selectedCountry, form]);

  const onSubmit = async (data: RegistrationDetailsFormValues) => {
    setLoading(true);
    setFormMessage(null);

    try {
      // Combine country code and phone number
      const fullPhone = `${data.countryCode}${data.phone}`;

      let result;

      if (userRole === UserRole.SELLER) {
        const { serviceType, countryCode, ...sellerData } = data;

        result = await registerSeller({
          name,
          email,
          ...sellerData,
          phone: fullPhone,
          role: UserRole.SELLER,
        });
      } else {
        const { countryCode, ...providerData } = data;

        result = await registerProvider({
          name,
          email,
          ...providerData,
          phone: fullPhone,
          role: UserRole.PROVIDER,
          serviceType: data.serviceType as string,
        });
      }

      if (result.success) {
        setFormMessage({
          type: 'success',
          text: result.message || t('successMessage'),
        });
        form.reset();

        // Call success callback
        onSuccess();
      } else {
        setFormMessage({
          type: 'error',
          text: result.message || t('errorGeneric'),
        });
      }
    } catch (error) {
      setFormMessage({
        type: 'error',
        text: t('errorGeneric'),
      });
      console.error('Form submission error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.3 }}
    >
      <div className="text-center mb-6">
        <div className="mx-auto w-16 h-16 bg-gradient-to-r from-[#1c2d51] to-[#f37922] rounded-full flex items-center justify-center mb-4">
          <CheckCircle className="h-8 w-8 text-white" />
        </div>
        <h3 className="text-lg font-semibold text-[#1c2d51] mb-2">
          {t('completeRegistration') || 'Complete Your Registration'}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {t('emailVerifiedMessage') || 'Email verified! Now complete your profile.'}
        </p>
      </div>

      {/* Form message */}
      {formMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "p-4 mb-6 rounded-md flex items-start gap-3",
            formMessage.type === 'success'
              ? "bg-green-50 border border-green-200 text-green-700"
              : "bg-red-50 border border-red-200 text-red-700"
          )}
        >
          {formMessage.type === 'success' ? (
            <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
          ) : (
            <Lock className="h-5 w-5 mt-0.5 flex-shrink-0" />
          )}
          <p>{formMessage.text}</p>
        </motion.div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Security Details Section */}
          <div className="p-6 bg-gray-50 dark:bg-gray-800/20 rounded-md border border-gray-200 dark:border-gray-700">
            <h2 className="font-medium text-[#1c2d51] dark:text-white mb-5 flex items-center">
              <Lock className="h-5 w-5 mr-2 text-[#1c2d51] dark:text-white" />
              {t('securityDetails')}
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Password */}
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      {t('password')}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('passwordPlaceholder')}
                        type="password"
                        className="rounded-md shadow-sm"
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
                      {t('confirmPassword')}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('confirmPasswordPlaceholder')}
                        type="password"
                        className="rounded-md shadow-sm"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Personal Details Section */}
          <div className="p-6 bg-gray-50 dark:bg-gray-800/20 rounded-md border border-gray-200 dark:border-gray-700">
            <h2 className="font-medium text-[#1c2d51] dark:text-white mb-5 flex items-center">
              <ShieldCheck className="h-5 w-5 mr-2 text-[#1c2d51] dark:text-white" />
              {t('personalDetails')}
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Country */}
              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      {t('country')}
                    </FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        setSelectedCountry(value);
                      }}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="rounded-md shadow-sm">
                          <SelectValue
                            placeholder={t('countryPlaceholder')}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {allCountries.map((country) => (
                          <SelectItem key={country} value={country}>
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
                  {t('phoneNumber')}
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
                            className="rounded-md shadow-sm"
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
                            placeholder={t('phonePlaceholder')}
                            type="tel"
                            className="rounded-md shadow-sm"
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

          {/* Business Details Section */}
          <div className="p-6 bg-gray-50 dark:bg-gray-800/20 rounded-md border border-gray-200 dark:border-gray-700">
            <h2 className="font-medium text-[#1c2d51] dark:text-white mb-5 flex items-center">
              <Building className="h-5 w-5 mr-2 text-[#1c2d51] dark:text-white" />
              {t('businessDetails')}
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Business Name */}
              <FormField
                control={form.control}
                name="businessName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      {t('businessName')}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('businessNamePlaceholder')}
                        className="rounded-md shadow-sm"
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
                        {t('serviceType')}
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t('serviceTypePlaceholder')}
                          className="rounded-md shadow-sm"
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
                      ? t('businessInfo')
                      : t('servicesDescription')}
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={
                        userRole === UserRole.SELLER
                          ? t('businessInfoPlaceholder')
                          : t('servicesDescPlaceholder')
                      }
                      className="min-h-[100px] rounded-md shadow-sm"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              className="flex-1"
              disabled={loading}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('back') || 'Back'}
            </Button>
            <Button
              type="submit"
              className={cn(
                "flex-1 bg-gradient-to-r from-[#1c2d51] to-[#f37922] text-white hover:from-[#1c2d51]/90 hover:to-[#f37922]/90",
                loading && "opacity-70 cursor-not-allowed"
              )}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  {t('registeringButton')}
                </>
              ) : (
                t('registerButton')
              )}
            </Button>
          </div>
        </form>
      </Form>
    </motion.div>
  );
}
