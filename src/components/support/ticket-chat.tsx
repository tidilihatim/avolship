"use client";

import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Send, 
  Paperclip, 
  Image as ImageIcon,
  FileIcon,
  Clock,
  CheckCircle2
} from "lucide-react";
import { TicketAPI } from "@/lib/api/ticket-api";
import { toast } from "sonner";
import { useTicketSocket } from "@/hooks/use-ticket-socket";

interface TicketMessage {
  _id: string;
  ticketId: string;
  senderId: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  message: string;
  messageType: 'text' | 'image' | 'file';
  images: string[];
  attachments: {
    filename: string;
    url: string;
    size: number;
    mimeType: string;
  }[];
  isInternal: boolean;
  readBy: {
    userId: string;
    readAt: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

interface TicketChatProps {
  ticket: any;
  messages: TicketMessage[];
  currentUser: any;
}

export function TicketChat({ ticket, messages: initialMessages, currentUser }: TicketChatProps) {
  const [messages, setMessages] = useState<TicketMessage[]>(initialMessages);
  const [newMessage, setNewMessage] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>(null);
  const MESSAGES_PER_PAGE = 20;

  // Socket connection for real-time updates
  const { isConnected, sendTyping } = useTicketSocket({
    ticketId: ticket._id,
    onNewMessage: (data: { message: TicketMessage }) => {
      // Only add message if it's not from the current user
      // (current user's messages are added immediately when sent)
      if (data.message.senderId._id !== currentUser.id) {
        setMessages(prev => {
          // Check if message already exists to avoid duplicates
          const exists = prev.some(msg => msg._id === data.message._id);
          if (!exists) {
            return [...prev, data.message];
          }
          return prev;
        });
        
        const audio = new Audio("/sounds/notification.mp3")
        audio.play()

        const oldTitle = document.title
        document.title = "New message from support team"

        setTimeout(()=>{
            document.title = oldTitle
        },5000)
      }
    },
    onTyping: (data: { userId: string; isTyping: boolean }) => {
      if (data.userId === currentUser._id) return; // Ignore own typing
      
      setTypingUsers(prev => {
        const newSet = new Set(prev);
        if (data.isTyping) {
          newSet.add(data.userId);
        } else {
          newSet.delete(data.userId);
        }
        return newSet;
      });
    }
  });

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load initial messages on component mount
  useEffect(() => {
    loadInitialMessages();
  }, [ticket._id]);

  const loadInitialMessages = async () => {
    try {
      const fetchedMessages = await TicketAPI.getTicketMessages(ticket._id, 1, MESSAGES_PER_PAGE);
      setMessages(fetchedMessages);
      setHasMoreMessages(fetchedMessages.length === MESSAGES_PER_PAGE);
    } catch (error: any) {
      console.error("Error loading messages:", error);
    }
  };

  const loadMoreMessages = async () => {
    if (isLoadingMore || !hasMoreMessages) return;
    
    setIsLoadingMore(true);
    
    // Store scroll position before loading more messages
    const scrollContainer = messagesContainerRef.current;
    const scrollHeight = scrollContainer?.scrollHeight || 0;
    
    try {
      const nextPage = currentPage + 1;
      const olderMessages = await TicketAPI.getTicketMessages(ticket._id, nextPage, MESSAGES_PER_PAGE);
      
      if (olderMessages.length > 0) {
        // Prepend older messages to the beginning
        setMessages(prev => [...olderMessages, ...prev]);
        setCurrentPage(nextPage);
        setHasMoreMessages(olderMessages.length === MESSAGES_PER_PAGE);
        
        // Maintain scroll position after loading more messages
        setTimeout(() => {
          if (scrollContainer) {
            const newScrollHeight = scrollContainer.scrollHeight;
            scrollContainer.scrollTop = newScrollHeight - scrollHeight;
          }
        }, 100);
      } else {
        setHasMoreMessages(false);
      }
    } catch (error: any) {
      console.error("Error loading more messages:", error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() && selectedFiles.length === 0) return;

    setIsSending(true);
    try {
      const result = await TicketAPI.addTicketMessage(
        ticket._id,
        newMessage.trim(),
        isInternal && ['support', 'admin'].includes(currentUser.role),
        selectedFiles.length > 0 ? selectedFiles : undefined
      );

      if (result.success) {
        // Add the sent message to local state immediately
        if (result.message) {
          setMessages(prev => [...prev, result.message]);
        }
        
        setNewMessage("");
        setSelectedFiles([]);
        setIsInternal(false);
        // Send typing stopped
        sendTyping(false);
      }
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast.error(error.message || "Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  // Handle typing indicators
  const handleTyping = (value: string) => {
    setNewMessage(value);
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Send typing started
    if (value.trim()) {
      sendTyping(true);
      
      // Set timeout to send typing stopped after 2 seconds of no typing
      typingTimeoutRef.current = setTimeout(() => {
        sendTyping(false);
      }, 2000);
    } else {
      sendTyping(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    // Validate file sizes (10MB each)
    const oversizedFiles = files.filter(file => file.size > 10485760);
    if (oversizedFiles.length > 0) {
      toast.error("Each file must be less than 10MB");
      return;
    }

    setSelectedFiles([...selectedFiles, ...files.slice(0, 5 - selectedFiles.length)]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getUserInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const isCurrentUser = (userId: string) => {
    return userId === currentUser.id;
  };

  return (
    <Card className="h-[600px] flex flex-col">
      <div className="p-4 border-b">
        <h3 className="font-semibold">Ticket Conversation</h3>
        <p className="text-sm text-muted-foreground">
          Real-time chat with support team
        </p>
      </div>

      {/* Messages */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Load More Button */}
        {hasMoreMessages && (
          <div className="flex justify-center mb-4">
            <Button
              variant="outline"
              onClick={loadMoreMessages}
              disabled={isLoadingMore}
              className="text-sm"
            >
              {isLoadingMore ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                  Loading...
                </>
              ) : (
                'Load More Messages'
              )}
            </Button>
          </div>
        )}
        
        {messages.map((message) => {
          const isMine = isCurrentUser(message.senderId._id);
         
          return (
            <div key={message._id} className={`flex ${isMine ? 'justify-end' : 'justify-start'} mb-1`}>
              <div className={`flex gap-3 max-w-[80%] ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
                <Avatar className={`h-8 w-8 ${isMine ? 'ring-2 ring-primary ring-offset-1' : ''}`}>
                  <AvatarFallback className={`text-xs ${
                    isMine ? 'bg-primary text-primary-foreground' : ''
                  }`}>
                    {getUserInitials(message.senderId.name)}
                  </AvatarFallback>
                </Avatar>
                
                <div className={`rounded-lg p-3 relative ${
                  isMine 
                    ? 'bg-primary text-primary-foreground shadow-lg border border-primary/30 ml-8' 
                    : 'bg-muted border border-border mr-8'
                }`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-medium ${isMine ? 'text-primary-foreground' : ''}`}>
                      {isMine ? 'You' : message.senderId.name}
                    </span>
                    {message.isInternal && (
                      <Badge variant="outline" className="text-xs">
                        Internal
                      </Badge>
                    )}
                    <span className="text-xs opacity-70 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatTime(message.createdAt)}
                    </span>
                  </div>
                  
                  {message.message && (
                    <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                  )}
                  
                  {/* Images */}
                  {message.images && message.images.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {message.images.map((imageUrl, index) => (
                        <div key={index} className="relative aspect-square border rounded overflow-hidden">
                          <img
                            src={imageUrl}
                            alt={`Attachment ${index + 1}`}
                            className="object-cover w-full h-full cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => window.open(imageUrl, '_blank')}
                            onError={(e) => {
                              console.log('Image failed to load:', imageUrl);
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Attachments */}
                  {message.attachments && message.attachments.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {message.attachments.map((attachment, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-background/50 rounded">
                          <FileIcon className="h-4 w-4" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">
                              {attachment.filename}
                            </p>
                            <p className="text-xs opacity-70">
                              {formatFileSize(attachment.size)}
                            </p>
                          </div>
                          <Button variant="ghost" size="sm" asChild>
                            <a href={attachment.url} target="_blank" rel="noopener noreferrer" download={attachment.filename}>
                              Download
                            </a>
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t">
        {/* File Preview */}
        {selectedFiles.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {selectedFiles.map((file, index) => (
              <div key={index} className="flex items-center gap-2 bg-muted p-2 rounded text-sm">
                {file.type.startsWith('image/') ? (
                  <ImageIcon className="h-4 w-4" />
                ) : (
                  <FileIcon className="h-4 w-4" />
                )}
                <span className="truncate max-w-[100px]">{file.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                  className="h-4 w-4 p-0"
                >
                  ×
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Typing Indicator */}
        {typingUsers.size > 0 && (
          <div className="mb-2 text-sm text-muted-foreground">
            Someone is typing...
          </div>
        )}

        {/* Socket Connection Status */}
        {!isConnected && (
          <div className="mb-2 text-sm text-yellow-600 dark:text-yellow-400">
            Connecting to real-time chat...
          </div>
        )}

        {/* Internal Note Toggle */}
        {['support', 'admin'].includes(currentUser.role) && (
          <div className="mb-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isInternal}
                onChange={(e) => setIsInternal(e.target.checked)}
                className="rounded border-input"
              />
              Internal note (only visible to support team)
            </label>
          </div>
        )}

        <div className="flex gap-2">
          <Textarea
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => handleTyping(e.target.value)}
            className="flex-1 resize-none"
            rows={2}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
          
          <div className="flex flex-col gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={selectedFiles.length >= 5}
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            
            <Button 
              onClick={handleSendMessage}
              disabled={isSending || (!newMessage.trim() && selectedFiles.length === 0)}
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,application/pdf,.doc,.docx,.txt,.csv,.xlsx,.xls"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    </Card>
  );
}