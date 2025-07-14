'use client';

import { useState, useRef, useCallback } from 'react';
import { Send, Paperclip, Image, FileText, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from 'sonner';
import { MessageType } from '@/lib/db/models/chat-message';
import { useTranslations } from 'next-intl';
import { ChatMessage } from '@/types/chat';

interface ModernMessageInputProps {
  onSendMessage: (content: string, messageType?: MessageType, files?: File[], replyToId?: string) => Promise<void>;
  onTypingStart: () => void;
  onTypingStop: () => void;
  disabled?: boolean;
  replyingTo?: ChatMessage | null;
  onCancelReply?: () => void;
}

export function ModernMessageInput({
  onSendMessage,
  onTypingStart,
  onTypingStop,
  disabled = false,
  replyingTo,
  onCancelReply
}: ModernMessageInputProps) {
  const t = useTranslations('chat');
  const [message, setMessage] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleTyping = useCallback(() => {
    if (!isTyping) {
      setIsTyping(true);
      onTypingStart();
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      onTypingStop();
    }, 4000);
  }, [isTyping, onTypingStart, onTypingStop]);

  const handleSubmit = async () => {
    if ((!message.trim() && selectedFiles.length === 0) || sending || disabled) {
      return;
    }

    setSending(true);
    
    try {
      if (selectedFiles.length > 0) {
        await onSendMessage(message.trim(), MessageType.DOCUMENT, selectedFiles, replyingTo?._id);
      } else {
        await onSendMessage(message.trim(), MessageType.TEXT, undefined, replyingTo?._id);
      }
      
      setMessage('');
      setSelectedFiles([]);
      setIsTyping(false);
      onTypingStop();
      
      // Clear typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    } catch (error) {
      toast.error(t('errors.failedToSendMessage'));
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    } else if (e.key !== 'Enter') {
      handleTyping();
    }
  };

  const handleFileSelect = (type: 'document' | 'image') => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = type === 'image' ? 'image/*' : '.pdf,.doc,.docx,.txt';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setSelectedFiles(prev => [...prev, ...files]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="border-t bg-card flex-shrink-0">
      {/* Reply Banner */}
      {replyingTo && (
        <div className="px-4 py-2 bg-muted/30 border-b">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-muted-foreground">
                Replying to {replyingTo.sender.name}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {replyingTo.content}
              </p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={onCancelReply}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <div className="p-4">
        {/* Selected Files */}
        {selectedFiles.length > 0 && (
          <div className="mb-3 space-y-2">
            {selectedFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeFile(index)}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Message Input */}
        <div className="flex items-end space-x-2">
          <div className="flex-1">
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                handleTyping();
              }}
              onKeyDown={handleKeyPress}
              placeholder={replyingTo ? `Reply to ${replyingTo.sender.name}...` : t('placeholder')}
              className="min-h-[44px] max-h-32 resize-none"
              disabled={disabled || sending}
            />
          </div>

          {/* File Attachment */}
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-11 w-11 p-0"
                disabled={disabled || sending}
              >
                <Paperclip className="h-5 w-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48">
              <div className="space-y-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleFileSelect('image')}
                  className="w-full justify-start"
                >
                  <Image className="h-4 w-4 mr-2" />
                  {t('attachments.image')}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleFileSelect('document')}
                  className="w-full justify-start"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  {t('attachments.document')}
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          {/* Send Button */}
          <Button 
            onClick={handleSubmit}
            disabled={(!message.trim() && selectedFiles.length === 0) || sending || disabled}
            size="sm"
            className="h-11 w-11 p-0"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileChange}
          className="hidden"
          multiple
        />
      </div>
    </div>
  );
}