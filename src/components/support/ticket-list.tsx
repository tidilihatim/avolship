"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Clock, MessageCircle, User, Search, Filter } from "lucide-react";
import Link from "next/link";
import { UserRole } from "@/app/dashboard/_constant/user";

interface TicketUser {
  _id: string;
  name: string;
  email: string;
  role: string;
}

interface Ticket {
  _id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  createdBy: TicketUser;
  assignedTo?: TicketUser;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface TicketListProps {
  tickets: Ticket[];
  userRole?:string
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

export function TicketList({ tickets,userRole=UserRole.SUPPORT }: TicketListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.createdBy.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || ticket.priority === priorityFilter;
    const matchesCategory = categoryFilter === "all" || ticket.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const past = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - past.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    const diffInWeeks = Math.floor(diffInDays / 7);
    return `${diffInWeeks}w ago`;
  };

  if (tickets.length === 0) {
    return (
      <Card className="p-8 text-center">
        <MessageCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">No tickets found</h3>
        <p className="text-muted-foreground">
          Support tickets will appear here when users create them.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tickets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="technical">Technical</SelectItem>
                <SelectItem value="billing">Billing</SelectItem>
                <SelectItem value="account">Account</SelectItem>
                <SelectItem value="order">Order</SelectItem>
                <SelectItem value="general">General</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {(searchTerm || statusFilter !== "all" || priorityFilter !== "all" || categoryFilter !== "all") && (
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {filteredTickets.length} of {tickets.length} tickets
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
                setPriorityFilter("all");
                setCategoryFilter("all");
              }}
            >
              Clear filters
            </Button>
          </div>
        )}
      </Card>

      {/* Tickets */}
      <div className="space-y-4">
        {filteredTickets.map((ticket) => (
          <Card key={ticket._id} className="p-6 hover:bg-accent/50 transition-colors">
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
                    <User className="h-4 w-4" />
                    {ticket.createdBy.name} ({ticket.createdBy.role})
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {formatDate(ticket.createdAt)}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {getTimeAgo(ticket.createdAt)}
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
                  <Link href={`/dashboard/${userRole}/tickets/${ticket._id}`}>
                    View & Reply
                  </Link>
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredTickets.length === 0 && (
        <Card className="p-8 text-center">
          <Filter className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No tickets match your filters</h3>
          <p className="text-muted-foreground">
            Try adjusting your search criteria or clear the filters.
          </p>
        </Card>
      )}
    </div>
  );
}