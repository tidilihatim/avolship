import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/config/auth';
import { connectToDatabase } from '@/lib/db/mongoose';
import ChatMessage from '@/lib/db/models/chat-message';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only support and admin can pin messages
    if (session.user.role !== 'support' && session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Not authorized to pin messages' }, { status: 403 });
    }

    await connectToDatabase();
    const { messageId } = await params;

    // Find the message
    const message = await ChatMessage.findById(messageId);
    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Toggle pin status
    message.isPinned = !message.isPinned;
    await message.save();

    return NextResponse.json({
      success: true,
      isPinned: message.isPinned,
      message: message.isPinned ? 'Message pinned successfully' : 'Message unpinned successfully'
    });

  } catch (error: any) {
    console.error('Error pinning message:', error);
    return NextResponse.json({ 
      error: 'Failed to pin message', 
      details: error.message 
    }, { status: 500 });
  }
}