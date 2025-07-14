"use client";

import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { LogoutButton } from "@/components/auth/logout-button";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function TestLogoutPage() {
  const { data: session, status } = useSession({ required: false });
  const router = useRouter();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [status, router]);

  // Show loading state while checking session
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render the page if unauthenticated
  if (status === "unauthenticated") {
    return null;
  }

  const handleDirectSignOut = async () => {
    try {
      await signOut({ redirect: false });
      router.push("/auth/login");
    } catch (error) {
      console.error("Direct signOut error:", error);
    }
  };

  const handleForceLogout = () => {
    // Clear all auth-related storage
    localStorage.clear();
    sessionStorage.clear();
    
    // Clear cookies
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    
    // Force redirect
    window.location.href = "/auth/login";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg">
        <div>
          <h2 className="text-2xl font-bold text-center">Logout Test Page</h2>
          <p className="mt-2 text-center text-gray-600">
            Testing different logout methods
          </p>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-gray-100 rounded">
            <p className="text-sm font-medium">Session Status: {status}</p>
            {session && (
              <>
                <p className="text-sm">User: {session.user?.name}</p>
                <p className="text-sm">Email: {session.user?.email}</p>
              </>
            )}
          </div>

          <div className="space-y-2">
            <h3 className="font-medium">Test Logout Methods:</h3>
            
            <LogoutButton className="w-full">
              <Button className="w-full" variant="default">
                1. Logout with LogoutButton Component
              </Button>
            </LogoutButton>

            <Button 
              onClick={handleDirectSignOut} 
              className="w-full" 
              variant="secondary"
            >
              2. Direct signOut() Call
            </Button>

            <Button 
              onClick={handleForceLogout} 
              className="w-full" 
              variant="destructive"
            >
              3. Force Logout (Clear Everything)
            </Button>
          </div>

          <div className="pt-4">
            <Button 
              onClick={() => router.push("/dashboard")} 
              className="w-full" 
              variant="outline"
            >
              Go to Dashboard
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}