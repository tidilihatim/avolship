"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Loader2, Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

import { UserFormData } from "@/types/user";
import { UserRole, UserStatus } from "@/lib/db/models/user";
import { createUser, updateUser } from "@/app/actions/user";
import { getCountryNames } from "@/constants/countries";

interface UserFormProps {
  user?: any;
  isEdit?: boolean;
}

/**
 * UserForm Component
 * Provides a form for creating and editing users without any form libraries
 */
export default function UserForm({ user, isEdit = false }: UserFormProps) {
  const t = useTranslations();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "" as UserRole | "",
    status: UserStatus.PENDING,
    phone: "",
    businessName: "",
    businessInfo: "",
    serviceType: "",
    country: "",
    twoFactorEnabled: false,
  });

  // Populate form values when editing
  useEffect(() => {
    if (user && isEdit) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        password: "", // Never populate password for security
        role: user.role || "",
        status: user.status || UserStatus.PENDING,
        phone: user.phone || "",
        businessName: user.businessName || "",
        businessInfo: user.businessInfo || "",
        serviceType: user.serviceType || "",
        country: user.country || "",
        twoFactorEnabled: user.twoFactorEnabled || false,
      });
    }
  }, [user, isEdit]);

  // Handle input changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    if (name && value) {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  // Handle boolean switches
  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData({
      ...formData,
      [name]: checked,
    });
  };

  // Simple validation
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Required fields
    if (!formData.name.trim()) {
      newErrors.name = t("users.validation.nameRequired");
    } else if (formData.name.trim().length < 2) {
      newErrors.name = t("users.validation.nameMinLength");
    }

    if (!formData.email.trim()) {
      newErrors.email = t("users.validation.emailRequired");
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = t("users.validation.emailInvalid");
    }

    if (!isEdit && !formData.password.trim()) {
      newErrors.password = t("users.validation.passwordRequired");
    } else if (formData.password && formData.password.length < 8) {
      newErrors.password = t("users.validation.passwordMinLength");
    } else if (
      formData.password &&
      !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)
    ) {
      newErrors.password = t("users.validation.passwordComplex");
    }

    if (!formData.role) {
      newErrors.role = t("users.validation.roleRequired");
    }

    if (!formData.status) {
      newErrors.status = t("users.validation.statusRequired");
    }

    // Validation for business fields
    if (
      (formData.role === UserRole.SELLER ||
        formData.role === UserRole.PROVIDER) &&
      !formData.businessName.trim()
    ) {
      newErrors.businessName = t("users.validation.businessNameRequired", {
        role: formData.role,
      });
    }

    if (formData.role === UserRole.PROVIDER && !formData.serviceType.trim()) {
      newErrors.serviceType = t("users.validation.serviceTypeRequired");
    }

    if (
      formData.phone &&
      !/^[\+]?[1-9][\d]{0,15}$/.test(formData.phone.trim())
    ) {
      newErrors.phone = t("users.validation.phoneInvalid");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Form submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      // Show first error as toast
      const firstError = Object.values(errors)[0];
      if (firstError) {
        toast.error(firstError);
      }
      return;
    }

    setIsSubmitting(true);

    try {
      let result;

      if (isEdit && user) {
        result = await updateUser(user._id, formData as any);
      } else {
        result = await createUser(formData as any);
      }

      if (!result.success) {
        if (result.errors) {
          setErrors(result.errors);
        }
        toast.error(result.message);
      } else {
        toast.success(isEdit ? t("users.userUpdated") : t("users.userCreated"));
        router.push("/dashboard/admin/users");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if role-specific fields should be shown
  const shouldShowBusinessFields =
    formData.role === UserRole.SELLER || formData.role === UserRole.PROVIDER;
  const shouldShowServiceType = formData.role === UserRole.PROVIDER;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>
          {isEdit ? t("users.editUser") : t("users.createUser")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">
              {t("users.sections.basicInfo")}
            </h3>
            <Separator />

            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                {t("users.fields.fullName")}{" "}
                <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder={t("users.placeholders.enterFullName")}
                className={errors.name ? "border-destructive" : ""}
              />
              <p className="text-sm text-muted-foreground">
                Enter the user's full name
              </p>
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  {t("users.fields.emailAddress")}{" "}
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder={t("users.placeholders.enterEmail")}
                  className={errors.email ? "border-destructive" : ""}
                />
                <p className="text-sm text-muted-foreground">
                  User's email address for login
                </p>
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium">
                  {t("users.fields.phoneNumber")}
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder={t("users.placeholders.enterPhone")}
                  className={errors.phone ? "border-destructive" : ""}
                />
                <p className="text-sm text-muted-foreground">
                  Optional phone number
                </p>
                {errors.phone && (
                  <p className="text-sm text-destructive">{errors.phone}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                {t("users.fields.password")}{" "}
                {!isEdit && <span className="text-red-500">*</span>}
                {isEdit && (
                  <span className="text-sm text-muted-foreground ml-2">
                    {t("users.messages.passwordKeepCurrent")}
                  </span>
                )}
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder={t("users.placeholders.enterPassword")}
                  className={
                    errors.password ? "border-destructive pr-10" : "pr-10"
                  }
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                {isEdit
                  ? "Leave blank to keep current password"
                  : "Must be at least 8 characters with uppercase, lowercase, and number"}
              </p>
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="country" className="text-sm font-medium">
                {t("users.fields.country")}
              </Label>
              <Select
                value={formData.country}
                onValueChange={(value) => {
                  if (value) {
                    setFormData({
                      ...formData,
                      country: value,
                    });
                  }
                }}
              >
                <SelectTrigger
                  className={
                    errors.country ? "border-destructive w-full" : " w-full"
                  }
                >
                  <SelectValue placeholder="Select a country" />
                </SelectTrigger>
                <SelectContent>
                  {getCountryNames().sort().map((country) => (
                    <SelectItem key={country} value={country}>
                      {country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                User's country location
              </p>
              {errors.country && (
                <p className="text-sm text-destructive">{errors.country}</p>
              )}
            </div>
          </div>

          {/* Role & Permissions */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">
              {t("users.sections.rolePermissions")}
            </h3>
            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="role" className="text-sm font-medium">
                  {t("users.fields.role")}{" "}
                  <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => handleSelectChange("role", value)}
                >
                  <SelectTrigger
                    id="role"
                    className={errors.role ? "border-destructive" : ""}
                  >
                    <SelectValue
                      placeholder={t("users.placeholders.selectRole")}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(UserRole)
                      .filter((role) => role !== UserRole.SUPER_ADMIN)
                      .map((role) => (
                        <SelectItem key={role} value={role}>
                          {t(`users.roles.${role}`)} -{" "}
                          {t(`users.roles.descriptions.${role}`)}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  User's role determines their permissions
                </p>
                {errors.role && (
                  <p className="text-sm text-destructive">{errors.role}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="status" className="text-sm font-medium">
                  {t("users.fields.status")}{" "}
                  <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleSelectChange("status", value)}
                >
                  <SelectTrigger
                    id="status"
                    className={errors.status ? "border-destructive" : ""}
                  >
                    <SelectValue
                      placeholder={t("users.placeholders.selectStatus")}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(UserStatus).map((status) => (
                      <SelectItem key={status} value={status}>
                        {t(`users.statuses.${status}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  User's account status
                </p>
                {errors.status && (
                  <p className="text-sm text-destructive">{errors.status}</p>
                )}
              </div>
            </div>
          </div>

          {/* Business Information */}
          {shouldShowBusinessFields && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">
                {t("users.sections.businessInfo")}
              </h3>
              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="businessName" className="text-sm font-medium">
                    {t("users.fields.businessName")}{" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="businessName"
                    name="businessName"
                    value={formData.businessName}
                    onChange={handleChange}
                    placeholder={t("users.placeholders.enterBusinessName")}
                    className={errors.businessName ? "border-destructive" : ""}
                  />
                  <p className="text-sm text-muted-foreground">
                    Name of the business or company
                  </p>
                  {errors.businessName && (
                    <p className="text-sm text-destructive">
                      {errors.businessName}
                    </p>
                  )}
                </div>

                {shouldShowServiceType && (
                  <div className="space-y-2">
                    <Label
                      htmlFor="serviceType"
                      className="text-sm font-medium"
                    >
                      {t("users.fields.serviceType")}{" "}
                      <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="serviceType"
                      name="serviceType"
                      value={formData.serviceType}
                      onChange={handleChange}
                      placeholder={t("users.placeholders.enterServiceType")}
                      className={errors.serviceType ? "border-destructive" : ""}
                    />
                    <p className="text-sm text-muted-foreground">
                      Type of service provided
                    </p>
                    {errors.serviceType && (
                      <p className="text-sm text-destructive">
                        {errors.serviceType}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessInfo" className="text-sm font-medium">
                  {t("users.fields.businessInfo")}
                </Label>
                <Textarea
                  id="businessInfo"
                  name="businessInfo"
                  value={formData.businessInfo}
                  onChange={handleChange}
                  placeholder={t("users.placeholders.enterBusinessInfo")}
                  className={`resize-none ${
                    errors.businessInfo ? "border-destructive" : ""
                  }`}
                  rows={3}
                />
                <p className="text-sm text-muted-foreground">
                  Additional business information
                </p>
                {errors.businessInfo && (
                  <p className="text-sm text-destructive">
                    {errors.businessInfo}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Security Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">
              {t("users.sections.securitySettings")}
            </h3>
            <Separator />

            <div className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <Switch
                id="twoFactorEnabled"
                checked={formData.twoFactorEnabled}
                onCheckedChange={(checked) =>
                  handleSwitchChange("twoFactorEnabled", checked)
                }
              />
              <div className="space-y-1 leading-none">
                <Label
                  htmlFor="twoFactorEnabled"
                  className="text-sm font-medium"
                >
                  {formData.twoFactorEnabled
                    ? "Two-Factor Authentication Enabled"
                    : "Two-Factor Authentication Disabled"}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {formData.twoFactorEnabled
                    ? t("users.messages.twoFactorEnabled")
                    : t("users.messages.twoFactorDisabled")}
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/dashboard/admin/users")}
              disabled={isSubmitting}
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isSubmitting
                ? "Saving..."
                : isEdit
                ? t("common.update")
                : t("common.create")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
