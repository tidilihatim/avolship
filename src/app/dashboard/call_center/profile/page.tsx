import { redirect } from "next/navigation";
import { getCurrentUserProfile } from "@/app/actions/profile";
import { getLoginUserRole } from "@/app/actions/auth";
import { UserRole } from "@/app/dashboard/_constant/user";
import { ProfileForm } from "@/components/profile/profile-form";

export default async function CallCenterProfilePage() {
  const role = await getLoginUserRole();
  
  // Redirect if not call center
  if (role !== UserRole.CALL_CENTER) {
    redirect("/dashboard");
  }

  const profileResult = await getCurrentUserProfile();

  if (!profileResult.success || !profileResult.data) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Call Center Profile</h1>
          <p className="text-muted-foreground mt-2">
            Manage your call center account information
          </p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">
            {profileResult.message || 'Unable to load profile data'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Call Center Profile</h1>
        <p className="text-muted-foreground mt-2">
          Update your call center account information
        </p>
      </div>

      <ProfileForm user={profileResult.data} />
    </div>
  );
}