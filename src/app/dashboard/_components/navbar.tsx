"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { getCurrentUserProfile } from "@/app/actions/profile";
import {
  Bell,
  Search,
  Menu,
  Settings,
  LogOut,
  User2,
  ChevronLeft,
  ChevronRight,
  Mail,
  Calendar,
  Clock,
  MessageSquare,
  ChevronDown,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Locale } from "@/config/locales";
import { setUserLocale, getUserLocale } from "@/services/locale";
import { signOut, useSession } from "next-auth/react";
import { Skeleton } from "@/components/ui/skeleton";
import Theme from "./theme";
import WarehouseSelector from "./warehouse-selector";
import { NotificationPopover } from "./notification-popover";

interface NavbarProps {
  onMobileMenuClick: () => void;
  onSidebarToggle: () => void;
  sidebarCollapsed: boolean;
  userType: string;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: "info" | "warning" | "success" | "error";
  read: boolean;
  icon: React.ComponentType<{ className?: string }>;
}

export default function Navbar({
  onMobileMenuClick,
  onSidebarToggle,
  sidebarCollapsed,
  userType,
}: NavbarProps) {
  const t = useTranslations();
  const [searchQuery, setSearchQuery] = useState("");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [currentLocale, setCurrentLocale] = useState("en");
  const [userProfile, setUserProfile] = useState<any>(null);
  const { status, data: session } = useSession();

  useEffect(() => {
    getUserLocale().then((locale) => setCurrentLocale(locale));
  }, []);

  // Fetch user profile including profile image
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (status === "authenticated") {
        const result = await getCurrentUserProfile();
        if (result.success) {
          setUserProfile(result.data);
        }
      }
    };

    fetchUserProfile();
  }, [status]);

  const handleLanguageChange = async (locale: Locale) => {
    await setUserLocale(locale);
    setCurrentLocale(locale);
  };

  // Mock notifications data
  const notifications: Notification[] = [
    {
      id: "1",
      title: "Low Stock Alert",
      message: 'Product "Wireless Headphones" has only 5 items left',
      time: "2 minutes ago",
      type: "warning",
      read: false,
      icon: Bell,
    },
    {
      id: "2",
      title: "New Order Received",
      message: "Order #12345 from John Doe - $299.99",
      time: "5 minutes ago",
      type: "success",
      read: false,
      icon: MessageSquare,
    },
    {
      id: "3",
      title: "Payment Received",
      message: "$1,250.00 payment processed successfully",
      time: "1 hour ago",
      type: "success",
      read: true,
      icon: Calendar,
    },
    {
      id: "4",
      title: "Inventory Update",
      message: "Weekly inventory sync completed",
      time: "3 hours ago",
      type: "info",
      read: true,
      icon: Clock,
    },
  ];

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "warning":
        return "border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950/20 dark:border-l-yellow-400";
      case "success":
        return "border-l-green-500 bg-green-50 dark:bg-green-950/20 dark:border-l-green-400";
      case "error":
        return "border-l-red-500 bg-red-50 dark:bg-red-950/20 dark:border-l-red-400";
      default:
        return "border-l-blue-500 bg-blue-50 dark:bg-blue-950/20 dark:border-l-blue-400";
    }
  };

  const getNotificationIconStyle = (type: string) => {
    switch (type) {
      case "warning":
        return "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "success":
        return "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400";
      case "error":
        return "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400";
    }
  };

  return (
    <header className="h-16 bg-background/95 backdrop-blur-xl border-b border-border sticky top-0 z-30 shadow-sm">
      <div className="flex h-full items-center justify-between px-6">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden hover:bg-muted transition-colors"
            onClick={onMobileMenuClick}
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Desktop Sidebar Toggle */}
          <Button
            variant="ghost"
            size="sm"
            className="hidden lg:flex cursor-pointer hover:bg-muted transition-colors p-2"
            onClick={onSidebarToggle}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <ChevronLeft className="h-5 w-5" />
            )}
          </Button>
        </div>

        {/* Center Section - Warehouse Selector (replaces breadcrumb) */}
        <div className="lg:flex hidden items-center">
          <WarehouseSelector />
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          {/* Language Switcher */}
          <Select value={currentLocale} onValueChange={handleLanguageChange}>
            <SelectTrigger className="w-[150px] h-9 cursor-pointer border-none bg-transparent hover:bg-muted focus:ring-0 focus:ring-offset-0">
              <SelectValue>
                <div className="flex items-center space-x-2">
                  <div className="w-5 cursor-pointer h-5 relative">
                    {currentLocale === "en" ? (
                      <img
                        src="https://img.icons8.com/?size=100&id=t3NE3BsOAQwq&format=png&color=000000"
                        alt="English"
                        className="object-cover rounded-sm"
                      />
                    ) : (
                      <img
                        src="https://img.icons8.com/?size=100&id=YwnngGdMBmIV&format=png&color=000000"
                        alt="Français"
                        className="object-cover rounded-sm"
                      />
                    )}
                  </div>
                  <span className="text-sm cursor-pointer">
                    {currentLocale === "en" ? "English" : "Français"}
                  </span>
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="cursor-pointer">
              <SelectItem className="cursor-pointer" value="en">
                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 relative">
                    <img
                      src="https://img.icons8.com/?size=100&id=t3NE3BsOAQwq&format=png&color=000000"
                      alt="English"
                      className="object-cover rounded-sm"
                    />
                  </div>
                  <span>English</span>
                </div>
              </SelectItem>
              <SelectItem className="cursor-pointer" value="fr">
                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 relative">
                    <img
                      src="https://img.icons8.com/?size=100&id=YwnngGdMBmIV&format=png&color=000000"
                      alt="Français"
                      className="object-cover rounded-sm"
                    />
                  </div>
                  <span>Français</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Notifications */}
          <NotificationPopover />

          <Theme />

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative cursor-pointer h-10 w-10 rounded-full p-0 hover:ring-2 hover:ring-primary/20 transition-all"
              >
                <Avatar className="h-10 w-10">
                  {status === "authenticated" ? (
                    <>
                      <AvatarImage 
                        src={userProfile?.profileImage || "/avatars/user.jpg"} 
                        alt="User" 
                      />
                      <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                        {session?.user?.name?.charAt(0)?.toUpperCase() +
                          session?.user?.name
                            ?.slice(1)
                            ?.charAt(0)
                            ?.toUpperCase()}
                      </AvatarFallback>
                    </>
                  ) : (
                    <Skeleton className="h-10 w-10 rounded-full" />
                  )}
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64" align="end" sideOffset={10}>
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-semibold">{session?.user?.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {session?.user?.email}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge
                      variant="secondary"
                      className="text-xs bg-primary/10 text-primary border-primary/20"
                    >
                      {userType.charAt(0).toUpperCase() + userType.slice(1)}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-xs text-green-600 dark:text-green-400">
                        {t("dashboard.navbar.user.status.online")}
                      </span>
                    </div>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer hover:bg-muted" asChild>
                <Link href={`/dashboard/${userType}/profile`}>
                  <User2 className="mr-3 h-4 w-4" />
                  <span>{t("dashboard.navbar.user.profile")}</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer hover:bg-muted" asChild>
                <Link href={`/dashboard/${userType}/settings`}>
                <Settings className="mr-3 h-4 w-4" />
                <span>{t("dashboard.navbar.user.settings")}</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => signOut()}
                className="cursor-pointer text-destructive focus:text-destructive hover:bg-destructive/10"
              >
                <LogOut className="mr-3 h-4 w-4" />
                <span>{t("dashboard.navbar.user.logout")}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
