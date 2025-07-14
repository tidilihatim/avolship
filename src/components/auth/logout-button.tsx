"use client";

import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

interface LogoutButtonProps {
  children: React.ReactNode;
  className?: string;
}

export function LogoutButton({ children, className }: LogoutButtonProps) {
  const router = useRouter();
  
  const handleLogout = async () => {
    try {
      // Clear any local storage or session storage if needed
      if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
        
        // Clear all cookies manually
        document.cookie.split(";").forEach((c) => {
          document.cookie = c
            .replace(/^ +/, "")
            .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });
      }
      
      // Try to sign out with NextAuth first
      try {
        const data = await signOut({
          redirect: false,
          callbackUrl: "/auth/login?logout=true",
        });
        console.log('SignOut response:', data);
      } catch (nextAuthError) {
        console.error("NextAuth signOut error:", nextAuthError);
        
        // Fallback to custom logout endpoint
        try {
          await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include',
          });
        } catch (apiError) {
          console.error("API logout error:", apiError);
        }
      }
      
      // Clear the NextAuth session from client
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.removeItem('next-auth.session-token');
      }
      
      // Manual redirect after signout with logout parameter
      router.push("/auth/login?logout=true");
      router.refresh();
      
      // Fallback: force reload to login page
      setTimeout(() => {
        window.location.href = "/auth/login?logout=true";
      }, 100);
      
    } catch (error) {
      console.error("Logout error:", error);
      // Force redirect even on error
      window.location.href = "/auth/login?logout=true";
    }
  };

  return (
    <div onClick={handleLogout} className={className} style={{ cursor: 'pointer' }}>
      {children}
    </div>
  );
}