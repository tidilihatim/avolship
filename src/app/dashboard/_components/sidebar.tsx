"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Settings,
  HelpCircle,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Logo from "@/components/ui/global/logo";
import { useSession } from "next-auth/react";
import { Skeleton } from "@/components/ui/skeleton";
import { sidebarNavigations } from "../_constant";
import WarehouseSelector from "./warehouse-selector";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
  userType: "seller" | "admin" | "support" | "delivery" | "provider";
}

interface NavItemProps {
  item: {
    name: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
  };
  collapsed: boolean;
  isActive: boolean;
  onClick?: () => void;
}

function NavItem({ item, collapsed, isActive, onClick }: NavItemProps) {
  const t = useTranslations();

  const content = (
    <Link href={item.href} onClick={onClick}>
      <div
        className={cn(
          "flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group relative",
          isActive
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground hover:bg-accent",
          collapsed && "justify-center px-2"
        )}
      >
        <item.icon
          className={cn(
            "h-5 w-5 transition-colors flex-shrink-0",
            isActive
              ? "text-primary-foreground"
              : "text-muted-foreground group-hover:text-foreground"
          )}
        />
        {!collapsed && (
          <span className="font-medium text-sm truncate">{t(item.name)}</span>
        )}
        {isActive && collapsed && (
          <div className="absolute left-full ml-2 w-1 h-8 bg-primary rounded-r-full" />
        )}
      </div>
    </Link>
  );

  if (collapsed) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="right" className="ml-2">
            {t(item.name)}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return content;
}

export default function Sidebar({
  collapsed,
  onToggle,
  mobileOpen,
  onMobileClose,
  userType,
}: SidebarProps) {
  
  const t = useTranslations();
  const pathname = usePathname();
  const { status, data: session } = useSession();

  const navigation = sidebarNavigations[userType];
  
  const bottomNavigation = [
    {
      name: "navigation.settings",
      href: `/dashboard/${userType}/settings`,
      icon: Settings,
    },
  ];

  // Desktop Sidebar
  const DesktopSidebar = () => (
    <div
      className={cn(
        "hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 bg-background/95 backdrop-blur-xl border-r border-border shadow-lg transition-all duration-300 z-40",
        collapsed ? "lg:w-20" : "lg:w-80"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between h-16 px-6 border-b border-border bg-background/50">
        {!collapsed && <Logo showText />}
        {collapsed && <Logo showText={false} />}
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-4 py-6">
        <nav className="space-y-1">
          {navigation.map((item: any) => {
            const isActive =
              pathname === item.href 

            return (
              <NavItem
                key={item.name}
                item={item}
                collapsed={collapsed}
                isActive={isActive}
              />
            );
          })}
        </nav>

        <Separator className="my-6" />

        <nav className="space-y-1">
          {bottomNavigation.map((item) => {
            const isActive = pathname === item.href;

            return (
              <NavItem
                key={item.name}
                item={item}
                collapsed={collapsed}
                isActive={isActive}
              />
            );
          })}
        </nav>
      </ScrollArea>

      {/* User Profile */}
      <div className="p-4 border-t border-border bg-background/30">
        {!collapsed ? (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50 border border-border/60">
            <Avatar className="h-12 w-12">
              {status === "authenticated" ? (
                <>
                  <AvatarImage src="/avatars/user.jpg" alt="User" />
                  <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                    {session?.user?.name?.charAt(0)?.toUpperCase() +
                      session?.user?.name?.slice(1)?.charAt(0)?.toUpperCase()}
                  </AvatarFallback>
                </>
              ) : (
                <Skeleton className="h-10 w-10 rounded-full" />
              )}
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground truncate">
                {session?.user?.name}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {userType?.toUpperCase()} {t("dashboard.navbar.user.account")}
              </p>
              <div className="flex items-center mt-1">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                  {t("dashboard.navbar.user.status.online")}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <Avatar className="h-12 w-12">
              {status === "authenticated" ? (
                <>
                  <AvatarImage src="/avatars/user.jpg" alt="User" />
                  <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                    {session?.user?.name?.charAt(0)?.toUpperCase() +
                      session?.user?.name?.slice(1)?.charAt(0)?.toUpperCase()}
                  </AvatarFallback>
                </>
              ) : (
                <Skeleton className="h-10 w-10 rounded-full" />
              )}
            </Avatar>
          </div>
        )}
      </div>
    </div>
  );

  // Mobile Sidebar
  const MobileSidebar = () => (
    <div
      className={cn(
        "fixed inset-y-0 left-0 z-50 w-80 transform transition-transform duration-300 ease-in-out lg:hidden",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      <div className="flex flex-col h-full bg-background shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-border bg-background">
          <Logo showText />

          <Button
            variant="ghost"
            size="sm"
            onClick={onMobileClose}
            className="hover:bg-accent"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 px-4 py-6">
          <nav className="space-y-1">
            <div className="flex items-center">
              <WarehouseSelector />
            </div>
            {navigation.map((item: any) => {
              const isActive =
                pathname === item.href ||
                (item.href !== `/dashboard/${userType}` &&
                  pathname.startsWith(item.href));

              return (
                <NavItem
                  key={item.name}
                  item={item}
                  collapsed={false}
                  isActive={isActive}
                  onClick={onMobileClose}
                />
              );
            })}
          </nav>
          <Separator className="my-6" />

          <nav className="space-y-1">
            {bottomNavigation.map((item) => {
              const isActive = pathname === item.href;

              return (
                <NavItem
                  key={item.name}
                  item={item}
                  collapsed={false}
                  isActive={isActive}
                  onClick={onMobileClose}
                />
              );
            })}
          </nav>
        </ScrollArea>

        {/* User Profile */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50 border border-border">
            <Avatar className="h-12 w-12">
              {status === "authenticated" ? (
                <>
                  <AvatarImage src="/avatars/user.jpg" alt="User" />
                  <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                    {session?.user?.name?.charAt(0)?.toUpperCase() +
                      session?.user?.name?.slice(1)?.charAt(0)?.toUpperCase()}
                  </AvatarFallback>
                </>
              ) : (
                <Skeleton className="h-10 w-10 rounded-full" />
              )}
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground truncate">
                {session?.user?.name}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {userType?.toUpperCase()} {t("dashboard.navbar.user.account")}
              </p>
              <div className="flex items-center mt-1">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                  {t("dashboard.navbar.user.status.online")}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <DesktopSidebar />
      <MobileSidebar />
    </>
  );
}
