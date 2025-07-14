'use client';

import { useState, useEffect, useRef, use } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarInitials } from '@/components/ui/avatar';
import { 
  ArrowLeft, Send, Paperclip, User, Bot, Clock, MessageCircle, 
  AlertTriangle, CheckCircle2, UserPlus, Settings, Tag, FileText 
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { TicketChatWindow } from '@/components/support/ticket-chat-window';

// Define enums locally to avoid importing Mongoose models on client
enum TicketStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  WAITING_CUSTOMER = 'waiting_customer',
  WAITING_INTERNAL = 'waiting_internal',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

enum TicketPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

enum MessageSenderType {
  CUSTOMER = 'customer',
  AGENT = 'agent',
  SYSTEM = 'system',
  BOT = 'bot',
}

interface SupportTicket {
  _id: string;
  ticketNumber: string;
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  customerId: any;
  customerType: string;
  assignedAgentId?: any;
  tags: string[];
  messageCount: number;
  lastMessageAt?: string;
  createdAt: string;
  updatedAt: string;
  internalNotes: Array<{
    agentId: string;
    content: string;
    createdAt: string;
  }>;
  sla: {
    responseTimeTarget: number;
    resolutionTimeTarget: number;
    firstResponseAt?: string;
    firstResponseDuration?: number;
    resolvedAt?: string;
    resolutionDuration?: number;
    escalationLevel: number;
  };
}

interface ChatMessage {
  _id: string;
  senderId: any;
  senderType: string;
  messageType: string;
  content: string;
  attachments: any[];
  isInternal: boolean;
  responseTime?: number;
  isFirstResponse: boolean;
  createdAt: string;
}

interface ChatRoom {
  _id: string;
  status: string;
  participants: any[];
  metrics: {
    totalMessages: number;
    customerMessages: number;
    agentMessages: number;
    averageResponseTime: number;
  };
}

export default function SupportTicketDetail({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { data: session } = useSession();
  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatRoom, setChatRoom] = useState<ChatRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [showInternalNote, setShowInternalNote] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const ticketId = resolvedParams.id;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchTicketDetails = async () => {
    try {
      const [ticketResponse, messagesResponse] = await Promise.all([
        fetch(`/api/support/tickets/${ticketId}`),
        fetch(`/api/support/tickets/${ticketId}/messages`)
      ]);

      const ticketData = await ticketResponse.json();
      const messagesData = await messagesResponse.json();

      if (ticketData.success) {
        setTicket(ticketData.data);
      }

      if (messagesData.success) {
        setMessages(messagesData.data.messages);
        setChatRoom(messagesData.data.chatRoom);
      }
    } catch (error) {
      console.error('Error fetching ticket details:', error);
      toast.error('Failed to load ticket details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user && ticketId) {
      fetchTicketDetails();
    }
  }, [session, ticketId]);

  const handleSendMessage = async (content: string, isInternal = false) => {
    if (!content.trim()) return;

    setSending(true);
    try {
      const response = await fetch(`/api/support/tickets/${ticketId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content.trim(),
          messageType: 'text',
          isInternal
        })
      });

      const data = await response.json();

      if (data.success) {
        setMessages(prev => [...prev, data.data]);
        
        // Update message count in ticket
        if (ticket) {
          setTicket(prev => prev ? { ...prev, messageCount: prev.messageCount + 1 } : null);
        }
      } else {
        toast.error(data.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleUpdateTicket = async (updates: Partial<SupportTicket>) => {
    setUpdating(true);
    try {
      const response = await fetch(`/api/support/tickets/${ticketId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      const data = await response.json();

      if (data.success) {
        setTicket(data.data);
        toast.success('Ticket updated successfully');
      } else {
        toast.error(data.error || 'Failed to update ticket');
      }
    } catch (error) {
      console.error('Error updating ticket:', error);
      toast.error('Failed to update ticket');
    } finally {
      setUpdating(false);
    }
  };

  const assignToMe = () => {
    if (session?.user?.id) {
      handleUpdateTicket({
        assignedAgentId: session.user.id,
        status: TicketStatus.IN_PROGRESS
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case TicketStatus.OPEN: return 'bg-blue-100 text-blue-800';
      case TicketStatus.IN_PROGRESS: return 'bg-yellow-100 text-yellow-800';
      case TicketStatus.WAITING_CUSTOMER: return 'bg-orange-100 text-orange-800';
      case TicketStatus.WAITING_INTERNAL: return 'bg-purple-100 text-purple-800';
      case TicketStatus.RESOLVED: return 'bg-green-100 text-green-800';
      case TicketStatus.CLOSED: return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case TicketPriority.CRITICAL: return 'bg-red-100 text-red-800';
      case TicketPriority.HIGH: return 'bg-orange-100 text-orange-800';
      case TicketPriority.MEDIUM: return 'bg-yellow-100 text-yellow-800';
      case TicketPriority.LOW: return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatResponseTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Ticket Not Found</h2>
          <p className="text-gray-600 mb-4">The support ticket you're looking for doesn't exist.</p>
          <Link href="/dashboard/support">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Support Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/support">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Ticket #{ticket.ticketNumber}</h1>
            <p className="text-gray-600">{ticket.subject}</p>
          </div>
        </div>
        
        {!ticket.assignedAgentId && (
          <Button onClick={assignToMe} disabled={updating}>
            <UserPlus className="w-4 h-4 mr-2" />
            Assign to Me
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ticket Info */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ticket Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm text-gray-600">Status</label>
                <Select 
                  value={ticket.status} 
                  onValueChange={(value) => handleUpdateTicket({ status: value })}
                  disabled={updating}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(TicketStatus).map(status => (
                      <SelectItem key={status} value={status}>
                        {status.replace('_', ' ').toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm text-gray-600">Priority</label>
                <Select 
                  value={ticket.priority} 
                  onValueChange={(value) => handleUpdateTicket({ priority: value })}
                  disabled={updating}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(TicketPriority).map(priority => (
                      <SelectItem key={priority} value={priority}>
                        {priority.toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm text-gray-600">Category</label>
                <Badge variant="outline">{ticket.category}</Badge>
              </div>

              <div>
                <label className="text-sm text-gray-600">Customer</label>
                <p className="font-medium">{ticket.customerId?.name}</p>
                <p className="text-sm text-gray-500">{ticket.customerId?.email}</p>
                <Badge variant="secondary" className="mt-1">{ticket.customerType}</Badge>
              </div>

              <div>
                <label className="text-sm text-gray-600">Assigned To</label>
                <p className="font-medium">
                  {ticket.assignedAgentId?.name || 'Unassigned'}
                </p>
              </div>

              <Separator />

              <div>
                <label className="text-sm text-gray-600">SLA Targets</label>
                <div className="space-y-1 text-sm">
                  <p>Response: {ticket.sla.responseTimeTarget} min</p>
                  <p>Resolution: {ticket.sla.resolutionTimeTarget} min</p>
                </div>
              </div>

              {ticket.sla.firstResponseAt && (
                <div>
                  <label className="text-sm text-gray-600">First Response</label>
                  <p className="text-sm">{formatTime(ticket.sla.firstResponseAt)}</p>
                  <p className="text-sm text-gray-500">
                    Time: {ticket.sla.firstResponseDuration} min
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Chat */}
        <div className="lg:col-span-2">
          <Card className="h-[600px] flex flex-col">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Conversation</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowInternalNote(!showInternalNote)}
                >
                  {showInternalNote ? 'Public Reply' : 'Internal Note'}
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="flex-1 overflow-hidden p-0">
              {/* Initial ticket description */}
              <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-b">
                <p className="font-medium text-sm mb-2">Initial Description</p>
                <p className="text-sm">{ticket.description}</p>
                <p className="text-xs text-gray-500 mt-2">{formatTime(ticket.createdAt)}</p>
              </div>
              
              <div className="h-[calc(100%-100px)]">
                <TicketChatWindow
                  ticketId={ticketId}
                  messages={messages}
                  currentUserId={session?.user?.id || ''}
                  currentUserRole={session?.user?.role || ''}
                  onSendMessage={handleSendMessage}
                  onMessagesUpdate={setMessages}
                  showInternalNote={showInternalNote}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}