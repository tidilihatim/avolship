import {
  BarChart3, CreditCard, LayoutDashboard,
  MessageCircle, Package, PlaneIcon, ShoppingCart,
  Truck, User, Warehouse, Clock, Users, FileText, UserCheck,
  Zap,
  DollarSign,
  MapPin,
  Settings,
  HeadphonesIcon,
  Trophy,
  Coins,
  Receipt,
  Key,
  Ticket,
  ChartArea,
  ChartBar,
  DollarSignIcon,
  User2,
  AlertCircle
} from "lucide-react";

type UserType = 'admin' | 'seller' | 'support' | 'delivery' | 'provider' | 'call_center' | 'moderator' | 'super_admin';

// Define the structure of a navigation item
interface NavigationItem {
  name: string;
  href?: string;
  icon: React.ElementType;
  children?: NavigationItem[];
}

// Map navigation items to each user type
export const sidebarNavigations: Record<UserType, NavigationItem[]> = {
  "super_admin": [
    {
      name: "navigation.overview",
      href: "/dashboard/super_admin",
      icon: LayoutDashboard,
    },
    {
      name: "navigation.users",
      href: "/dashboard/super_admin/users",
      icon: User
    },
  ],
  admin: [
    {
      name: "navigation.overview",
      href: "/dashboard/admin",
      icon: LayoutDashboard,
    },
    {
      name: "navigation.performanceTracking",
      icon: BarChart3,
      children: [
        {
          name: "navigation.callcenter",
          href: "/dashboard/admin/call_center",
          icon: ChartArea
        },
        {
          name: "navigation.delivery",
          href: "/dashboard/admin/delivery",
          icon: ChartBar
        },
        {
          name:"navigation.finance",
          href:"/dashboard/admin/finance",
          icon:DollarSignIcon
        },
        {
          name:"navigation.seller",
          href:"/dashboard/admin/seller-analytics",
          icon:User2
        },
        {
          name:"navigation.system",
          href:"/dashboard/admin/system",
          icon:AlertCircle
        }
      ]
    },
    {
      name: "navigation.users",
      href: "/dashboard/admin/users",
      icon: User
    },
    {
      name: "navigation.warehouse",
      href: "/dashboard/admin/warehouse",
      icon: Warehouse,
    },
    {
      name: "navigation.products",
      href: "/dashboard/admin/products",
      icon: Package,
    },
    {
      name: "navigation.orders",
      href: "/dashboard/admin/orders",
      icon: ShoppingCart
    },
    {
      name: "navigation.expeditions",
      href: "/dashboard/admin/expeditions",
      icon: PlaneIcon
    },
    {
      name: "navigation.deliveryRiders",
      href: "/dashboard/admin/delivery-riders",
      icon: MapPin
    },
    {
      name: "navigation.invoices",
      href: "/dashboard/admin/invoices",
      icon: DollarSign
    },
    {
      name: "navigation.paymentRequests",
      href: "/dashboard/admin/payment-requests",
      icon: Receipt,
    },
    {
      name: "navigation.leaderboard",
      href: "/dashboard/admin/leaderboard",
      icon: Trophy
    },
    {
      name: "navigation.contacts",
      href: "/dashboard/admin/contacts",
      icon: MessageCircle
    },
    {
      name:"navigation.tickets",
      href:"/dashboard/admin/tickets",
      icon:Ticket
    }
  ],
  seller: [
    {
      name: "navigation.overview",
      href: "/dashboard/seller",
      icon: LayoutDashboard,
    },
    {
      name: "navigation.products",
      href: "/dashboard/seller/products",
      icon: Package,
    },
    {
      name: "navigation.orders",
      href: "/dashboard/seller/orders",
      icon: ShoppingCart,
    },
    {
      name: "navigation.expeditions",
      href: "/dashboard/seller/expeditions",
      icon: PlaneIcon
    },
    {
      name: "navigation.invoices",
      href: "/dashboard/seller/invoices",
      icon: DollarSign
    },
    {
      name: "navigation.paymentRequests",
      href: "/dashboard/seller/payment-requests",
      icon: Receipt,
    },
    {
      name: "navigation.providers",
      href: "/dashboard/seller/providers",
      icon: UserCheck,
    },
    {
      name: "navigation.chat",
      href: "/dashboard/seller/chat",
      icon: MessageCircle,
    },
    {
      name: "navigation.integrations",
      href: "/dashboard/seller/integrations",
      icon: Zap
    },
    {
      name: "navigation.api",
      href: "/dashboard/seller/api",
      icon: Key
    },
    {
      name: "navigation.leaderboard",
      href: "/dashboard/seller/leaderboard",
      icon: Trophy
    },
    {
      name: "navigation.support",
      href: "/dashboard/seller/support",
      icon: HeadphonesIcon
    },
  ],
  'call_center': [
    {
      name: "navigation.overview",
      href: "/dashboard/call_center",
      icon: LayoutDashboard,
    },
    {
      name: "navigation.queue",
      href: "/dashboard/call_center/queue",
      icon: Clock,
    },
    {
      name: "navigation.orders",
      href: "/dashboard/call_center/orders",
      icon: ShoppingCart,
    },
    {
      name: "navigation.customers",
      href: "/dashboard/call_center/customers",
      icon: Users,
    },
    {
      name: "navigation.leaderboard",
      href: "/dashboard/call_center/leaderboard",
      icon: Trophy
    },
    {
      name: "navigation.support",
      href: "/dashboard/call_center/support",
      icon: HeadphonesIcon
    },
  ],
  'support': [
    {
      name: "navigation.overview",
      href: "/dashboard/support",
      icon: LayoutDashboard,
    },
  ],
  'delivery': [
    {
      name: "navigation.overview",
      href: "/dashboard/delivery",
      icon: LayoutDashboard,
    },
    {
      name: "navigation.leaderboard",
      href: "/dashboard/delivery/leaderboard",
      icon: Trophy
    },
  ],
  'provider': [
    {
      name: "navigation.overview",
      href: "/dashboard/provider",
      icon: LayoutDashboard,
    },
    {
      name: "navigation.tokens",
      href: "/dashboard/provider/tokens",
      icon: Coins,
    },
    {
      name: "navigation.chat",
      href: "/dashboard/provider/chat",
      icon: MessageCircle,
    },
    {
      name: "navigation.expeditions",
      href: "/dashboard/provider/expeditions",
      icon: PlaneIcon
    },
    {
      name: "navigation.leaderboard",
      href: "/dashboard/provider/leaderboard",
      icon: Trophy
    }
  ],
  moderator: [
    {
      name: "navigation.overview",
      href: "/dashboard/moderator",
      icon: LayoutDashboard,
    },
    {
      name: "navigation.warehouse",
      href: "/dashboard/moderator/warehouse",
      icon: Warehouse,
    },
    {
      name: "navigation.products",
      href: "/dashboard/moderator/products",
      icon: Package,
    },
    {
      name: "navigation.orders",
      href: "/dashboard/moderator/orders",
      icon: ShoppingCart
    },
    {
      name: "navigation.expeditions",
      href: "/dashboard/moderator/expeditions",
      icon: PlaneIcon
    },
    {
      name: "navigation.deliveryRiders",
      href: "/dashboard/moderator/delivery-riders",
      icon: MapPin
    },
    {
      name: "navigation.invoices",
      href: "/dashboard/moderator/invoices",
      icon: DollarSign
    },
    {
      name: "navigation.paymentRequests",
      href: "/dashboard/moderator/payment-requests",
      icon: Receipt,
    },
    {
      name: "navigation.leaderboard",
      href: "/dashboard/moderator/leaderboard",
      icon: Trophy
    },
    {
      name: "navigation.contacts",
      href: "/dashboard/moderator/contacts",
      icon: MessageCircle
    }
  ],

};


export const africanCountries = [
  "Algeria", "Angola", "Benin", "Botswana", "Burkina Faso", "Burundi",
  "Cabo Verde", "Cameroon", "Central African Republic", "Chad", "Comoros", "Congo (Brazzaville)",
  "Congo (Kinshasa)", "Djibouti", "Egypt", "Equatorial Guinea", "Eritrea", "Eswatini",
  "Ethiopia", "Gabon", "Gambia", "Ghana", "Guinea", "Guinea-Bissau", "Ivory Coast",
  "Kenya", "Lesotho", "Liberia", "Libya", "Madagascar", "Malawi", "Mali", "Mauritania",
  "Mauritius", "Morocco", "Mozambique", "Namibia", "Niger", "Nigeria", "Rwanda",
  "São Tomé and Príncipe", "Senegal", "Seychelles", "Sierra Leone", "Somalia",
  "South Africa", "South Sudan", "Sudan", "Tanzania", "Togo", "Tunisia", "Uganda",
  "Zambia", "Zimbabwe"
]

// Map of African country names to icon IDs for img.icons8.com
export const COUNTRY_FLAGS: Record<string, string> = {
  'Algeria': 'https://img.icons8.com/?size=96&id=t3kWQF9Vsy6f&format=png',
  'Angola': 'https://img.icons8.com/?size=96&id=b01kKNkAzXQb&format=png',
  'Benin': 'https://img.icons8.com/?size=96&id=rPGgns9cKs0v&format=png',
  'Botswana': 'https://img.icons8.com/?size=96&id=UpUUbLnLTJm9&format=png',
  'Burkina Faso': 'https://img.icons8.com/?size=96&id=aaGdLtXK6Y9L&format=png',
  'Burundi': 'https://img.icons8.com/?size=96&id=LWUuMX2u3HZM&format=png',
  'Cameroon': 'https://img.icons8.com/?size=96&id=GfqZsWUlvnOA&format=png',
  'Cape Verde': 'https://img.icons8.com/?size=96&id=9UF5HjJxrQoy&format=png',
  'Central African Republic': 'https://img.icons8.com/?size=96&id=4i5gL6USK6VC&format=png',
  "China": "https://img.icons8.com/?size=100&id=17962&format=png&color=000000",
  'Chad': 'https://img.icons8.com/?size=96&id=nVHJ7oF0ybvK&format=png',
  'Comoros': 'https://img.icons8.com/?size=96&id=VBQmkWOg0i14&format=png',
  'Democratic Republic of the Congo': 'https://img.icons8.com/?size=96&id=GEWyMWLxV6Pl&format=png',
  'Congo (Kinshasa)': 'https://img.icons8.com/?size=100&id=TJiAcnTMMuJ5&format=png&color=000000',
  'Djibouti': 'https://img.icons8.com/?size=96&id=A7Mv7k6PWYtA&format=png',
  'Egypt': 'https://img.icons8.com/?size=96&id=HKRnN4vBDs1i&format=png',
  'Equatorial Guinea': 'https://img.icons8.com/?size=96&id=jU91m6p3wd9s&format=png',
  'Eritrea': 'https://img.icons8.com/?size=96&id=B6xeLWp6XsWw&format=png',
  'Ethiopia': 'https://img.icons8.com/?size=96&id=mfLh4TQh13wv&format=png',
  'Gabon': 'https://img.icons8.com/?size=96&id=uPBZKLtEzxqR&format=png',
  'Gambia': 'https://img.icons8.com/?size=96&id=PxMQvqZ8f34U&format=png',
  'Ghana': 'https://img.icons8.com/?size=100&id=yFbMXwkgAYtU&format=png&color=000000',
  'Guinea': 'https://img.icons8.com/?size=100&id=dpTrWGmEWKWs&format=png&color=000000',
  'Guinea-Bissau': 'https://img.icons8.com/?size=96&id=LnQHNfIWlwkb&format=png',
  'Ivory Coast': 'https://img.icons8.com/?size=100&id=60220&format=png&color=000000',
  "Côte d'Ivoire": 'https://img.icons8.com/?size=96&id=Ls0V1Ng4Kker&format=png',
  'Kenya': 'https://img.icons8.com/?size=96&id=EwEDwCZx33ym&format=png',
  'Lesotho': 'https://img.icons8.com/?size=96&id=MbnUxvMD1c3O&format=png',
  'Liberia': 'https://img.icons8.com/?size=96&id=o3kUBtOgMmFa&format=png',
  'Libya': 'https://img.icons8.com/?size=96&id=5SBTdWq27rvl&format=png',
  'Madagascar': 'https://img.icons8.com/?size=96&id=qgMxQyrHqQ3A&format=png',
  'Malawi': 'https://img.icons8.com/?size=96&id=x8XmVzI8Uhdz&format=png',
  'Mali': 'https://img.icons8.com/?size=100&id=15545&format=png&color=000000',
  'Mauritania': 'https://img.icons8.com/?size=96&id=PmhXJZDgLrE9&format=png',
  'Mauritius': 'https://img.icons8.com/?size=96&id=A2KwAJudpnvw&format=png',
  'Morocco': 'https://img.icons8.com/?size=100&id=22436&format=png&color=000000',
  'Mozambique': 'https://img.icons8.com/?size=96&id=QUzPD6WxOP5s&format=png',
  'Namibia': 'https://img.icons8.com/?size=96&id=P1jMtCaI61rx&format=png',
  'Niger': 'https://img.icons8.com/?size=96&id=PeHrBcLnkE4k&format=png',
  'Nigeria': 'https://img.icons8.com/?size=96&id=HKLcPIXlQEh3&format=png',
  'Rwanda': 'https://img.icons8.com/?size=96&id=d36qPstXJGMg&format=png',
  'Sao Tome and Principe': 'https://img.icons8.com/?size=96&id=xylKtHbvHbSt&format=png',
  'Senegal': 'https://img.icons8.com/?size=100&id=xXRLL3dOn7Aa&format=png&color=000000',
  'Seychelles': 'https://img.icons8.com/?size=96&id=y5WZVPa7WK8p&format=png',
  'Sierra Leone': 'https://img.icons8.com/?size=96&id=JJ8C29ypXPW7&format=png',
  'Somalia': 'https://img.icons8.com/?size=96&id=y57i1ZvfBXIT&format=png',
  'South Africa': 'https://img.icons8.com/?size=96&id=sV4XwP2sTwWh&format=png',
  'South Sudan': 'https://img.icons8.com/?size=96&id=bHXhulxrZ4h6&format=png',
  'Sudan': 'https://img.icons8.com/?size=96&id=Mw5AdKvpO51o&format=png',
  'Tanzania': 'https://img.icons8.com/?size=96&id=JHHfYbiOrYQi&format=png',
  'Togo': 'https://img.icons8.com/?size=96&id=jCBJFLx5yBT4&format=png',
  'Tunisia': 'https://img.icons8.com/?size=96&id=qgf2Kj8yQSSy&format=png',
  'Uganda': 'https://img.icons8.com/?size=96&id=6fS6qV7ug31M&format=png',
  'Zambia': 'https://img.icons8.com/?size=96&id=SoQrQdMVLpW7&format=png',
  'Zimbabwe': 'https://img.icons8.com/?size=96&id=NKCW5OEARzqB&format=png',
};