import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/config/auth';
import { connectToDatabase } from '@/lib/db/mongoose';
import ChatMessage from '@/lib/db/models/chat-message';
import mongoose from 'mongoose';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const { messageId } = await params;
    const { emoji } = await req.json();

    if (!emoji) {
      return NextResponse.json({ error: 'Emoji is required' }, { status: 400 });
    }

    // Find the message
    const message = await ChatMessage.findById(messageId);
    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    const userId = new mongoose.Types.ObjectId(session.user.id);

    // Check if user already reacted with this emoji
    const existingReaction = message.reactions.find((r: any) => 
      r.emoji === emoji && r.userId.toString() === userId.toString()
    );

    if (existingReaction) {
      // Remove the reaction
      await message.removeReaction(emoji, userId);
    } else {
      // Add the reaction
      await message.addReaction(emoji, userId);
    }

    // Reload the message to get updated reactions
    const updatedMessage = await ChatMessage.findById(messageId);

    return NextResponse.json({
      success: true,
      reactions: updatedMessage?.reactions || [],
      message: existingReaction ? 'Reaction removed' : 'Reaction added'
    });

  } catch (error: any) {
    console.error('Error reacting to message:', error);
    return NextResponse.json({ 
      error: 'Failed to react to message', 
      details: error.message 
    }, { status: 500 });
  }
}