'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Ticket, 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  MessageSquare, 
  Users,
  TrendingUp,
  Timer
} from 'lucide-react';
import { SupportDashboardStats } from '@/app/actions/support-dashboard';

interface StatsCardsProps {
  stats: SupportDashboardStats;
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: 'Total Tickets',
      value: stats.totalTickets.toLocaleString(),
      icon: Ticket,
      description: 'All time tickets'
    },
    {
      title: 'Open Tickets',
      value: stats.openTickets.toLocaleString(),
      icon: Clock,
      description: 'Awaiting assignment'
    },
    {
      title: 'In Progress',
      value: stats.inProgressTickets.toLocaleString(),
      icon: Users,
      description: 'Being worked on'
    },
    {
      title: 'Critical Tickets',
      value: stats.criticalTickets.toLocaleString(),
      icon: AlertTriangle,
      description: 'Require immediate attention'
    },
    {
      title: 'Resolution Rate',
      value: `${stats.resolutionRate}%`,
      icon: CheckCircle,
      description: 'Tickets successfully resolved'
    },
    {
      title: 'Avg Resolution Time',
      value: `${stats.averageResolutionTime}h`,
      icon: Timer,
      description: 'Average time to resolve'
    },
    {
      title: 'Response Rate',
      value: `${stats.responseRate}%`,
      icon: MessageSquare,
      description: 'Tickets with responses'
    },
    {
      title: 'Unassigned',
      value: stats.unassignedTickets.toLocaleString(),
      icon: TrendingUp,
      description: 'Need assignment'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => {
        const IconComponent = card.icon;
        return (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {card.title}
              </CardTitle>
              <IconComponent className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground">
                {card.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}