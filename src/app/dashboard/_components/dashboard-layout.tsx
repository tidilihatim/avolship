'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import Navbar from './navbar';
import Sidebar from './sidebar';

interface DashboardLayoutProps {
  children: React.ReactNode;
  userType: 'seller' | 'admin' | 'support' | 'delivery' | 'provider';
}

export default function DashboardLayout({ children, userType }: DashboardLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [pathname]);

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen">
      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 transition-opacity lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar 
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
        userType={userType}
      />

      {/* Main Content */}
      <div className={cn(
        "transition-all duration-300 ease-in-out",
        sidebarCollapsed ? "lg:pl-20" : "lg:pl-80"
      )}>
        {/* Navbar */}
        <Navbar 
          onMobileMenuClick={() => setMobileSidebarOpen(true)}
          onSidebarToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          sidebarCollapsed={sidebarCollapsed}
          userType={userType}
        />

        {/* Page Content */}
        <main className="min-h-[calc(100vh-4rem)]">
          <div className="sm:p-6 p-3 max-w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}