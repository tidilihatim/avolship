'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import PhoneInput from 'react-phone-number-input';
import { parsePhoneNumberWithError, isValidPhoneNumber } from 'libphonenumber-js';
import 'react-phone-number-input/style.css';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Loader2,
  Mail,
  Phone,
  User,
  MessageSquare,
  Send,
  MapPin,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { submitContactForm, getWarehouseCountries } from '@/app/actions/contact';

interface ContactFormData {
  fullName: string;
  email: string;
  phoneNumber: string;
  countryCode: string;
  country: string;
  message: string;
}

const ContactUsForm: React.FC = () => {
  const t = useTranslations('contact');

  // Form state
  const [formData, setFormData] = useState<ContactFormData>({
    fullName: '',
    email: '',
    phoneNumber: '',
    countryCode: '',
    country: '',
    message: ''
  });

  const [phone, setPhone] = useState<string>('');
  const [countries, setCountries] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<Partial<ContactFormData>>({});

  // Load warehouse countries
  useEffect(() => {
    const loadCountries = async () => {
      try {
        const result = await getWarehouseCountries();
        if (result.countries) {
          setCountries(result.countries);
        }
      } catch (error) {
        console.error('Error loading countries:', error);
        toast.error('Failed to load countries');
      }
    };

    loadCountries();
  }, []);

  // Handle phone number change
  const handlePhoneChange = (value: string | undefined) => {
    setPhone(value || '');

    if (value) {
      try {
        // Parse phone number using libphonenumber-js
        const phoneNumber = parsePhoneNumberWithError(value);

        if (phoneNumber) {
          setFormData(prev => ({
            ...prev,
            countryCode: '+' + phoneNumber.countryCallingCode,
            phoneNumber: phoneNumber.nationalNumber
          }));
        } else {
          // Fallback if parsing fails
          setFormData(prev => ({
            ...prev,
            countryCode: '',
            phoneNumber: value.replace(/\D/g, '')
          }));
        }
      } catch (error) {
        // If parsing completely fails, store as is
        setFormData(prev => ({
          ...prev,
          countryCode: '',
          phoneNumber: value.replace(/\D/g, '')
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        countryCode: '',
        phoneNumber: ''
      }));
    }

    // Clear phone error
    if (errors.phoneNumber) {
      setErrors(prev => ({ ...prev, phoneNumber: '' }));
    }
  };

  // Handle input changes
  const handleInputChange = (field: keyof ContactFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear field error
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Partial<ContactFormData> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = t('errors.fullNameRequired');
    }

    if (!formData.email.trim()) {
      newErrors.email = t('errors.emailRequired');
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = t('errors.emailInvalid');
    }

    if (!phone) {
      newErrors.phoneNumber = t('errors.phoneRequired');
    } else if (!isValidPhoneNumber(phone)) {
      newErrors.phoneNumber = t('errors.phoneInvalid');
    }

    if (!formData.country) {
      newErrors.country = t('errors.countryRequired');
    }

    if (!formData.message.trim()) {
      newErrors.message = t('errors.messageRequired');
    } else if (formData.message.trim().length < 10) {
      newErrors.message = t('errors.messageMinLength');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error(t('errors.fixErrors'));
      return;
    }

    setIsLoading(true);

    try {
      const result = await submitContactForm(formData);

      if (result.success) {
        setIsSubmitted(true);
        toast.success(result.message);

        // Reset form
        setFormData({
          fullName: '',
          email: '',
          phoneNumber: '',
          countryCode: '',
          country: '',
          message: ''
        });
        setPhone('');
      } else {
        toast.error(result.error || t('errors.submitFailed'));
      }
    } catch (error) {
      console.error('Form submission error:', error);
      toast.error(t('errors.submitFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  // Success state
  if (isSubmitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 text-center"
      >
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <h3 className="text-2xl font-bold text-[#1c2d51] mb-4">
          {t('successTitle')}
        </h3>
        <p className="text-gray-600 mb-6">
          {t('successMessage')}
        </p>
        <Button
          onClick={() => setIsSubmitted(false)}
          variant="outline"
          className="border-[#f37922] text-[#f37922] hover:bg-[#f37922] hover:text-white"
        >
          {t('sendAnother')}
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100"
    >
      <div className="mb-8">
        <h3 className="text-2xl md:text-3xl font-bold text-[#1c2d51] mb-4">
          {t('title')}
        </h3>
        <p className="text-gray-600">
          {t('subtitle')}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Full Name */}
        <div className="space-y-2">
          <Label htmlFor="fullName" className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <User className="h-4 w-4" />
            {t('fullName')}
          </Label>
          <Input
            id="fullName"
            type="text"
            value={formData.fullName}
            onChange={(e) => handleInputChange('fullName', e.target.value)}
            placeholder={t('fullNamePlaceholder')}
            className={cn(
              "w-full px-4 py-3 rounded-lg border transition-colors",
              errors.fullName
                ? "border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:ring-[#f37922] focus:border-[#f37922]"
            )}
          />
          {errors.fullName && (
            <p className="text-red-500 text-sm flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {errors.fullName}
            </p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email" className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Mail className="h-4 w-4" />
            {t('email')}
          </Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            placeholder={t('emailPlaceholder')}
            className={cn(
              "w-full px-4 py-3 rounded-lg border transition-colors",
              errors.email
                ? "border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:ring-[#f37922] focus:border-[#f37922]"
            )}
          />
          {errors.email && (
            <p className="text-red-500 text-sm flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {errors.email}
            </p>
          )}
        </div>

        {/* Phone Number */}
        <div className="space-y-2">
          <Label htmlFor="phone" className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Phone className="h-4 w-4" />
            {t('phone')}
          </Label>
          <div className={cn(
            "w-full rounded-lg border transition-colors bg-white",
            errors.phoneNumber
              ? "border-red-500 focus-within:ring-1 focus-within:ring-red-500"
              : "border-gray-300 focus-within:ring-2 focus-within:ring-[#f37922] focus-within:border-[#f37922]"
          )}>
            <PhoneInput
              placeholder={t('phonePlaceholder')}
              value={phone}
              onChange={handlePhoneChange}
              defaultCountry="US"
              international
              countryCallingCodeEditable={false}
              className="phone-input"
              style={{
                '--PhoneInputCountryFlag-height': '1.2em',
                '--PhoneInputCountrySelectArrow-color': '#6b7280',
                '--PhoneInput-color': '#374151',
                '--PhoneInputCountrySelect-marginRight': '0.5em',
                '--PhoneInputCountryFlag-borderRadius': '0.25em',
              } as React.CSSProperties}
              countrySelectProps={{
                'aria-label': 'Select country'
              }}
            />
          </div>
          {errors.phoneNumber && (
            <p className="text-red-500 text-sm flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {errors.phoneNumber}
            </p>
          )}
        </div>

        {/* Country (Warehouse) */}
        <div className="space-y-2">
          <Label htmlFor="country" className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <MapPin className="h-4 w-4" />
            {t('country')}
          </Label>
          <Select value={formData.country} onValueChange={(value) => handleInputChange('country', value)}>
            <SelectTrigger className={cn(
              "w-full px-4 py-3 rounded-lg border transition-colors",
              errors.country
                ? "border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:ring-[#f37922] focus:border-[#f37922]"
            )}>
              <SelectValue placeholder={t('countryPlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              {countries.map((country) => (
                <SelectItem key={country} value={country}>
                  {country}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.country && (
            <p className="text-red-500 text-sm flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {errors.country}
            </p>
          )}
        </div>

        {/* Message */}
        <div className="space-y-2">
          <Label htmlFor="message" className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <MessageSquare className="h-4 w-4" />
            {t('message')}
          </Label>
          <Textarea
            id="message"
            value={formData.message}
            onChange={(e) => handleInputChange('message', e.target.value)}
            placeholder={t('messagePlaceholder')}
            rows={5}
            className={cn(
              "w-full px-4 py-3 rounded-lg border transition-colors resize-none",
              errors.message
                ? "border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:ring-[#f37922] focus:border-[#f37922]"
            )}
          />
          <div className="flex justify-between items-center">
            {errors.message ? (
              <p className="text-red-500 text-sm flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.message}
              </p>
            ) : (
              <div />
            )}
            <p className="text-gray-400 text-sm">
              {formData.message.length}/2000
            </p>
          </div>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-[#1c2d51] to-[#f37922] text-white hover:from-[#1c2d51]/90 hover:to-[#f37922]/90 py-3 rounded-lg font-medium transition-all duration-300 shadow-md hover:shadow-lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              {t('sending')}
            </>
          ) : (
            <>
              <Send className="mr-2 h-5 w-5" />
              {t('sendMessage')}
            </>
          )}
        </Button>
      </form>

      {/* Custom styles for phone input */}
      <style jsx global>{`
        .phone-input {
          display: flex;
          align-items: center;
          width: 100%;
          min-height: 48px;
          padding: 0;
          background: white;
        }

        .phone-input .PhoneInputCountrySelect {
          border: none !important;
          outline: none !important;
          background: transparent;
          padding: 10px 12px;
          margin: 4px 8px 4px 8px;
          border-radius: 8px;
          transition: background-color 0.2s;
          min-width: auto;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .phone-input .PhoneInputCountrySelect:hover {
          background-color: #f3f4f6;
        }

        .phone-input .PhoneInputCountrySelectArrow {
          margin-left: 4px;
          opacity: 0.7;
        }

        .phone-input .PhoneInputCountryIcon {
          margin-right: 0;
          flex-shrink: 0;
        }

        .phone-input .PhoneInputInput {
          border: none !important;
          outline: none !important;
          padding: 12px 16px 12px 4px;
          font-size: 16px;
          background: transparent;
          flex: 1;
          color: #374151;
        }

        .phone-input .PhoneInputInput::placeholder {
          color: #9ca3af;
        }

        .phone-input .PhoneInputCountryCode {
          font-weight: 500;
          color: #1f2937;
          font-size: 16px;
          margin-left: 4px;
        }

        /* Ensure flags are properly sized and spaced */
        .phone-input .PhoneInputCountryIcon--square {
          width: 1.3em;
          height: 1.3em;
          border-radius: 3px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border: 1px solid rgba(0, 0, 0, 0.1);
        }

        /* Style for international format display */
        .phone-input .PhoneInputInput[value*="+"] {
          font-family: 'JetBrains Mono', 'Monaco', 'Consolas', monospace;
        }
      `}</style>
    </motion.div>
  );
};

export default ContactUsForm;