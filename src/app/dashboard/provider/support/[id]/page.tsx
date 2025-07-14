'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarInitials } from '@/components/ui/avatar';
import { ArrowLeft, Send, Paperclip, User, Bot, Clock, MessageCircle } from 'lucide-react';
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
  assignedAgentId?: any;
  tags: string[];
  messageCount: number;
  lastMessageAt?: string;
  createdAt: string;
  updatedAt: string;
  sla: {
    responseTimeTarget: number;
    resolutionTimeTarget: number;
    firstResponseAt?: string;
    firstResponseDuration?: number;
    resolvedAt?: string;
    resolutionDuration?: number;
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

export default function SupportTicketDetailPage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  const { data: session } = useSession();
  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatRoom, setChatRoom] = useState<ChatRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [ticketId, setTicketId] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = await Promise.resolve(params);
      setTicketId(resolvedParams.id);
    };
    resolveParams();
  }, [params]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchTicketDetails = async () => {
    if (!ticketId) return;

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case TicketStatus.OPEN: return 'bg-blue-100 text-blue-800';
      case TicketStatus.IN_PROGRESS: return 'bg-yellow-100 text-yellow-800';
      case TicketStatus.WAITING_CUSTOMER: return 'bg-orange-100 text-orange-800';
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
          <p className="text-gray-600 mb-4">The support ticket you're looking for doesn't exist or you don't have access to it.</p>
          <Link href="/dashboard/provider/support">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Support
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/provider/support">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Support
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{ticket.subject}</h1>
          <p className="text-gray-600">Ticket #{ticket.ticketNumber}</p>
        </div>
        <div className="flex gap-2">
          <Badge className={getStatusColor(ticket.status)}>
            {ticket.status.replace('_', ' ')}
          </Badge>
          <Badge className={getPriorityColor(ticket.priority)}>
            {ticket.priority}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ticket Details */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ticket Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Category</label>
                <p className="text-sm">{ticket.category.replace('_', ' ').toUpperCase()}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600">Priority</label>
                <p className="text-sm">{ticket.priority.toUpperCase()}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600">Status</label>
                <p className="text-sm">{ticket.status.replace('_', ' ').toUpperCase()}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600">Created</label>
                <p className="text-sm">{formatTime(ticket.createdAt)}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600">Last Updated</label>
                <p className="text-sm">{formatTime(ticket.updatedAt)}</p>
              </div>

              {ticket.assignedAgentId && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Assigned Agent</label>
                  <p className="text-sm">{ticket.assignedAgentId.name}</p>
                </div>
              )}

              {ticket.tags.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Tags</label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {ticket.tags.map(tag => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Original Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{ticket.description}</p>
            </CardContent>
          </Card>

          {/* SLA Information */}
          <Card>
            <CardHeader>
              <CardTitle>SLA Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Response Target</p>
                  <p className="text-xs text-gray-600">{ticket.sla.responseTimeTarget} minutes</p>
                </div>
                {ticket.sla.firstResponseDuration && (
                  <Badge variant={ticket.sla.firstResponseDuration <= ticket.sla.responseTimeTarget ? 'default' : 'destructive'}>
                    {ticket.sla.firstResponseDuration}m
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Resolution Target</p>
                  <p className="text-xs text-gray-600">{Math.floor(ticket.sla.resolutionTimeTarget / 60)} hours</p>
                </div>
                {ticket.sla.resolutionDuration && (
                  <Badge variant={ticket.sla.resolutionDuration <= ticket.sla.resolutionTimeTarget ? 'default' : 'destructive'}>
                    {Math.floor(ticket.sla.resolutionDuration / 60)}h
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chat/Messages */}
        <div className="lg:col-span-2">
          <Card className="h-[700px] flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                Conversation
                <Badge variant="outline">{messages.length} messages</Badge>
              </CardTitle>
            </CardHeader>
            
            <CardContent className="flex-1 overflow-hidden p-0">
              <TicketChatWindow
                ticketId={ticketId}
                messages={messages}
                currentUserId={session?.user?.id || ''}
                currentUserRole={session?.user?.role || ''}
                onSendMessage={handleSendMessage}
                onMessagesUpdate={setMessages}
                showInternalNote={false}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}