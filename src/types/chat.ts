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
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
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