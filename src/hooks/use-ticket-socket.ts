"use client";

import { useEffect, useRef } from 'react';
import { useSocket } from '@/lib/socket/use-socket';

interface UseTicketSocketProps {
  ticketId: string;
  onNewMessage?: (message: any) => void;
  onTicketUpdate?: (data: any) => void;
  onTyping?: (data: { userId: string; isTyping: boolean }) => void;
}

export function useTicketSocket({ 
  ticketId, 
  onNewMessage, 
  onTicketUpdate, 
  onTyping 
}: UseTicketSocketProps) {
  const { socket, isConnected, emit, on } = useSocket();
  const hasJoined = useRef(false);

  // Join ticket room when connected and ticket ID is available
  useEffect(() => {
    if (!isConnected || !socket || !ticketId || hasJoined.current) return;

    console.log('Joining ticket room:', ticketId);
    emit('ticket:join', { ticketId });
    hasJoined.current = true;

    // Listen for successful join
    const unsubscribeJoined = on('ticket:joined', (data: { ticketId: string }) => {
      console.log('Successfully joined ticket room:', data.ticketId);
    });

    // Listen for join errors
    const unsubscribeError = on('ticket:error', (data: { message: string }) => {
      console.error('Ticket room join error:', data.message);
      hasJoined.current = false;
    });

    return () => {
      unsubscribeJoined();
      unsubscribeError();
    };
  }, [isConnected, socket, ticketId, emit, on]);

  // Set up event listeners
  useEffect(() => {
    if (!isConnected || !socket) return;

    const unsubscribers: (() => void)[] = [];

    // Listen for new messages
    if (onNewMessage) {
      unsubscribers.push(on('new-ticket-message', onNewMessage));
    }

    // Listen for ticket updates
    if (onTicketUpdate) {
      unsubscribers.push(on('ticket-assigned', onTicketUpdate));
      unsubscribers.push(on('ticket-status-changed', onTicketUpdate));
    }

    // Listen for typing indicators
    if (onTyping) {
      unsubscribers.push(on('ticket:typing', onTyping));
    }

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [isConnected, socket, onNewMessage, onTicketUpdate, onTyping, on]);

  // Leave room on unmount
  useEffect(() => {
    return () => {
      if (socket && ticketId && hasJoined.current) {
        console.log('Leaving ticket room:', ticketId);
        emit('ticket:leave', { ticketId });
        hasJoined.current = false;
      }
    };
  }, [socket, ticketId, emit]);

  // Helper functions
  const sendTyping = (isTyping: boolean) => {
    if (!isConnected || !socket || !ticketId) return;
    emit('ticket:typing', { ticketId, isTyping });
  };

  return {
    isConnected,
    sendTyping
  };
}