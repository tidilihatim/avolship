"use client";

import { Card } from "@/components/ui/card";
import { AlertCircle, CheckCircle, Clock, Users } from "lucide-react";

interface Ticket {
  _id: string;
  status: string;
  priority: string;
  assignedTo?: any;
  createdAt: string;
}

interface TicketStatsProps {
  tickets: Ticket[];
}

export function TicketStats({ tickets }: TicketStatsProps) {
  const stats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === 'open').length,
    inProgress: tickets.filter(t => ['assigned', 'in_progress'].includes(t.status)).length,
    resolved: tickets.filter(t => ['resolved', 'closed'].includes(t.status)).length,
    unassigned: tickets.filter(t => !t.assignedTo && ['open', 'assigned'].includes(t.status)).length,
    critical: tickets.filter(t => t.priority === 'critical' && !['resolved', 'closed'].includes(t.status)).length,
  };

  const avgResponseTime = tickets.length > 0 
    ? Math.round(tickets.reduce((acc, ticket) => {
        const created = new Date(ticket.createdAt);
        const now = new Date();
        const hours = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
        return acc + hours;
      }, 0) / tickets.length)
    : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total Tickets</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
          <div className="h-8 w-8 text-muted-foreground">
            <Users className="h-full w-full" />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Open Tickets</p>
            <p className="text-2xl font-bold text-blue-600">{stats.open}</p>
          </div>
          <div className="h-8 w-8 text-blue-600">
            <AlertCircle className="h-full w-full" />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">In Progress</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.inProgress}</p>
          </div>
          <div className="h-8 w-8 text-yellow-600">
            <Clock className="h-full w-full" />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Resolved</p>
            <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
          </div>
          <div className="h-8 w-8 text-green-600">
            <CheckCircle className="h-full w-full" />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Unassigned</p>
            <p className="text-2xl font-bold text-red-600">{stats.unassigned}</p>
          </div>
          <div className="h-8 w-8 text-red-600">
            <AlertCircle className="h-full w-full" />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Critical</p>
            <p className="text-2xl font-bold text-red-600">{stats.critical}</p>
          </div>
          <div className="h-8 w-8 text-red-600">
            <AlertCircle className="h-full w-full" />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Avg. Age (Hours)</p>
            <p className="text-2xl font-bold">{avgResponseTime}h</p>
          </div>
          <div className="h-8 w-8 text-muted-foreground">
            <Clock className="h-full w-full" />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Resolution Rate</p>
            <p className="text-2xl font-bold">
              {stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0}%
            </p>
          </div>
          <div className="h-8 w-8 text-muted-foreground">
            <CheckCircle className="h-full w-full" />
          </div>
        </div>
      </Card>
    </div>
  );
}