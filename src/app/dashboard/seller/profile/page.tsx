import { redirect } from "next/navigation";
import { getCurrentUserProfile } from "@/app/actions/profile";
import { getLoginUserRole } from "@/app/actions/auth";
import { UserRole } from "@/app/dashboard/_constant/user";
import { ProfileForm } from "@/components/profile/profile-form";
import { getTranslations } from 'next-intl/server';

export default async function SellerProfilePage() {
  const role = await getLoginUserRole();
  const t = await getTranslations('profile');

  // Redirect if not seller
  if (role !== UserRole.SELLER) {
    redirect("/dashboard");
  }

  const profileResult = await getCurrentUserProfile();

  if (!profileResult.success || !profileResult.data) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground mt-2">
            {t('description')}
          </p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">
            {profileResult.message || t('messages.loadProfileFailed')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground mt-2">
          {t('description')}
        </p>
      </div>

      <ProfileForm user={profileResult.data} />
    </div>
  );
}