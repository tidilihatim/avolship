import { MessageType } from '@/lib/db/models/chat-message';

export interface ChatRoom {
  _id: string;
  seller: {
    _id: string;
    name: string;
    email: string;
    businessName?: string;
  };
  provider: {
    _id: string;
    name: string;
    email: string;
    businessName?: string;
  };
  isActive: boolean;
  lastMessage?: ChatMessage;
  lastActivity: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface MessageReaction {
  emoji: string;
  userId: string;
  createdAt: Date;
}

export interface ChatMessage {
  _id: string;
  chatRoom: string;
  sender: {
    _id: string;
    name: string;
    email: string;
    businessName?: string;
  };
  messageType: MessageType;
  content?: string;
  attachments?: MessageAttachment[];
  
  // Modern features
  replyTo?: string | { // Message ID being replied to or full message object
    _id: string;
    content?: string;
    sender: {
      _id: string;
      name: string;
    };
    messageType: MessageType | string;
  };
  isPinned: boolean;
  isEdited: boolean;
  editedAt?: Date;
  editHistory?: Array<{
    content: string;
    editedAt: Date;
    editedBy: string;
  }>;
  reactions: MessageReaction[];
  status: 'sent' | 'delivered' | 'read';
  readBy: Array<{
    userId: string;
    readAt: Date;
  }>;
  
  // Legacy compatibility
  isRead: boolean;
  readAt?: Date;
  
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface MessageAttachment {
  filename: string;
  originalName: string;
  cloudinaryUrl: string;
  publicId: string;
  fileType: string;
  fileSize: number;
}

export interface TypingIndicator {
  userId: string;
  isTyping: boolean;
}

export interface ChatUser {
  _id: string;
  name: string;
  email: string;
  businessName?: string;
  role: 'seller' | 'provider';
  lastActive?: Date;
}