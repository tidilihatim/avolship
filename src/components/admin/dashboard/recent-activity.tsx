'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ShoppingCart, 
  UserPlus, 
  Clock, 
  DollarSign,
  Package,
  User
} from 'lucide-react';

interface RecentActivityProps {
  data: Array<{
    type: 'order' | 'user';
    id: string;
    title: string;
    description: string;
    date: string;
    status?: string;
    amount?: number;
    role?: string;
  }>;
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
  
  if (diffInHours < 1) {
    return 'Just now';
  } else if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  } else if (diffInHours < 48) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const getStatusColor = (status: string, type: string) => {
  if (type === 'order') {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'delivered':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  } else {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  }
};

const getActivityIcon = (type: string, role?: string) => {
  if (type === 'order') {
    return <ShoppingCart className="h-4 w-4" />;
  } else {
    return <UserPlus className="h-4 w-4" />;
  }
};

export function RecentActivityComponent({ data }: RecentActivityProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Recent Activity
        </CardTitle>
        <CardDescription>
          Latest activities across the platform
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <div className="space-y-4">
            {data.map((activity) => (
              <div
                key={`${activity.type}-${activity.id}`}
                className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary">
                  {getActivityIcon(activity.type, activity.role)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium truncate">
                      {activity.title}
                    </p>
                    {activity.status && (
                      <Badge
                        variant="secondary"
                        className={`text-xs ${getStatusColor(activity.status, activity.type)}`}
                      >
                        {activity.status}
                      </Badge>
                    )}
                  </div>
                  
                  <p className="text-xs text-muted-foreground mb-2 truncate">
                    {activity.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {formatDate(activity.date)}
                    </span>
                    
                    {activity.amount && (
                      <div className="flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400">
                        <DollarSign className="h-3 w-3" />
                        {formatCurrency(activity.amount)}
                      </div>
                    )}
                    
                    {activity.role && (
                      <Badge variant="outline" className="text-xs">
                        {activity.role}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {data.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No recent activity</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}