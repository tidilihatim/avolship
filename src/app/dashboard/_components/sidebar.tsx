"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Settings,
  HelpCircle,
  X,
  ChevronDown,
} from "lucide-react";
import { useState } from "react";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
    href?: string;
    icon: React.ComponentType<{ className?: string }>;
    children?: Array<{
      name: string;
      href: string;
      icon: React.ComponentType<{ className?: string }>;
    }>;
  };
  collapsed: boolean;
  isActive: boolean;
  onClick?: () => void;
}

function NavItem({ item, collapsed, isActive, onClick }: NavItemProps) {
  const t = useTranslations();
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  // Check if any child is active
  const hasActiveChild = item.children?.some(
    (child) => pathname === child.href || pathname.startsWith(child.href + "/")
  );

  // If item has children, render as expandable parent
  if (item.children && item.children.length > 0) {
    const parentContent = (
      <div>
        <div
          className={cn(
            "flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group relative",
            hasActiveChild
              ? "bg-primary/10 text-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-accent",
            collapsed && "justify-center px-2"
          )}
        >
          {/* Parent link - clickable to navigate */}
          <Link
            href={item.href || "#"}
            className="flex items-center gap-3 flex-1 min-w-0"
            onClick={onClick}
          >
            <item.icon
              className={cn(
                "h-5 w-5 transition-colors flex-shrink-0",
                hasActiveChild
                  ? "text-foreground"
                  : "text-muted-foreground group-hover:text-foreground"
              )}
            />
            {!collapsed && (
              <span className="font-medium text-sm truncate flex-1">{t(item.name)}</span>
            )}
          </Link>

          {/* Chevron - clickable to toggle children */}
          {!collapsed && (
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform cursor-pointer hover:text-foreground",
                isExpanded && "rotate-180"
              )}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
            />
          )}
        </div>

        {/* Children */}
        {!collapsed && isExpanded && (
          <div className="ml-8 mt-1 space-y-1">
            {item.children.map((child) => {
              const isChildActive =
                pathname === child.href || pathname.startsWith(child.href + "/");
              return (
                <Link key={child.name} href={child.href} onClick={onClick}>
                  <div
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group",
                      isChildActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent"
                    )}
                  >
                    <child.icon
                      className={cn(
                        "h-4 w-4 transition-colors flex-shrink-0",
                        isChildActive
                          ? "text-primary-foreground"
                          : "text-muted-foreground group-hover:text-foreground"
                      )}
                    />
                    <span className="font-medium text-sm truncate">
                      {t(child.name)}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );

    if (collapsed) {
      return (
        <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
          <PopoverTrigger asChild>
            <div
              onMouseEnter={() => setIsPopoverOpen(true)}
              onMouseLeave={() => setIsPopoverOpen(false)}
            >
              {/* Parent link - clickable to navigate */}
              <Link href={item.href || "#"} onClick={onClick}>
                <div
                  className={cn(
                    "flex items-center justify-center px-2 py-3 rounded-lg transition-all duration-200 group relative cursor-pointer",
                    hasActiveChild
                      ? "bg-primary/10 text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                >
                  <item.icon
                    className={cn(
                      "h-5 w-5 transition-colors flex-shrink-0",
                      hasActiveChild
                        ? "text-foreground"
                        : "text-muted-foreground group-hover:text-foreground"
                    )}
                  />
                </div>
              </Link>
            </div>
          </PopoverTrigger>
          <PopoverContent
            side="right"
            className="ml-2 w-56 p-2"
            align="start"
            onMouseEnter={() => setIsPopoverOpen(true)}
            onMouseLeave={() => setIsPopoverOpen(false)}
          >
            <div className="space-y-1">
              <div className="px-3 py-2 font-semibold text-sm">
                {t(item.name)}
              </div>
              {item.children.map((child) => {
                const isChildActive =
                  pathname === child.href || pathname.startsWith(child.href + "/");
                return (
                  <Link key={child.name} href={child.href} onClick={onClick}>
                    <div
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group cursor-pointer",
                        isChildActive
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent"
                      )}
                    >
                      <child.icon
                        className={cn(
                          "h-4 w-4 transition-colors flex-shrink-0",
                          isChildActive
                            ? "text-primary-foreground"
                            : "text-muted-foreground group-hover:text-foreground"
                        )}
                      />
                      <span className="font-medium text-sm truncate">
                        {t(child.name)}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>
      );
    }

    return parentContent;
  }

  // Regular item without children
  const content = (
    <Link href={item.href!} onClick={onClick}>
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
            const isActive = item.href
              ? pathname === item.href ||
                (item.href !== `/dashboard/${userType}` && pathname.startsWith(item.href))
              : false;

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
              const isActive = item.href
                ? pathname === item.href ||
                  (item.href !== `/dashboard/${userType}` &&
                    pathname.startsWith(item.href))
                : false;

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
