import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/config/auth';
import { connectToDatabase } from '@/lib/db/mongoose';
import ChatMessage from '@/lib/db/models/chat-message';

export async function PUT(
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
    const { content } = await req.json();

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    // Find the message
    const message = await ChatMessage.findById(messageId);
    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Check permissions: user can edit their own messages, or support/admin can edit any
    const canEdit = message.sender.toString() === session.user.id ||
                   session.user.role === 'support' ||
                   session.user.role === 'admin';

    if (!canEdit) {
      return NextResponse.json({ error: 'Not authorized to edit this message' }, { status: 403 });
    }

    // Use the model method to edit with history
    await message.editMessage(content.trim(), session.user.id);

    return NextResponse.json({
      success: true,
      message: 'Message edited successfully'
    });

  } catch (error: any) {
    console.error('Error editing message:', error);
    return NextResponse.json({ 
      error: 'Failed to edit message', 
      details: error.message 
    }, { status: 500 });
  }
}