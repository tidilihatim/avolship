"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MessageCircle, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface Ticket {
  _id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  assignedTo?: {
    name: string;
    email: string;
  };
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface MyTicketListProps {
  tickets: Ticket[];
}

const statusColors = {
  open: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  assigned: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  in_progress: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  resolved: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  closed: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
};

const priorityColors = {
  low: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
  medium: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  high: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  critical: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
};

const categoryColors = {
  technical: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  billing: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  account: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  order: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  general: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
};

export function MyTicketList({ tickets }: MyTicketListProps) {
  const pathname = usePathname();
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTicketDetailUrl = (ticketId: string) => {
    return `${pathname}/tickets/${ticketId}`;
  };

  if (tickets.length === 0) {
    return (
      <Card className="p-8 text-center">
        <MessageCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">No tickets yet</h3>
        <p className="text-muted-foreground">
          When you create support tickets, they will appear here.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">My Support Tickets</h2>
      <div className="space-y-4">
        {tickets.map((ticket) => (
          <Card key={ticket._id} className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-medium">{ticket.title}</h3>
                  <Badge className={statusColors[ticket.status as keyof typeof statusColors]}>
                    {ticket.status.replace('_', ' ')}
                  </Badge>
                  <Badge className={priorityColors[ticket.priority as keyof typeof priorityColors]}>
                    {ticket.priority}
                  </Badge>
                  <Badge className={categoryColors[ticket.category as keyof typeof categoryColors]}>
                    {ticket.category}
                  </Badge>
                </div>
                <p className="text-muted-foreground line-clamp-2 mb-3">
                  {ticket.description}
                </p>
                
                {ticket.tags && ticket.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {ticket.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Created {formatDate(ticket.createdAt)}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    Updated {formatDate(ticket.updatedAt)}
                  </div>
                  {ticket.assignedTo && (
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      Assigned to {ticket.assignedTo.name}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href={getTicketDetailUrl(ticket._id)}>
                    View Details
                  </Link>
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}