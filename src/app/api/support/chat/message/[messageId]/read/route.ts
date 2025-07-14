import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/config/auth';
import { connectToDatabase } from '@/lib/db/mongoose';
import SupportChatMessage from '@/lib/db/models/support-chat-message';

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ messageId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    await connectToDatabase();
    
    const params = await context.params;
    const { messageId } = params;
    
    console.log('Marking message as read:', { messageId, userId: session.user.id });
    
    // Validate messageId format
    if (!messageId || typeof messageId !== 'string' || messageId.length !== 24) {
      console.error('Invalid message ID format:', messageId);
      return NextResponse.json({ 
        error: 'Invalid message ID format',
        details: `ID "${messageId}" is not a valid ObjectId`
      }, { status: 400 });
    }
    
    // Find the message first to verify it exists
    let message;
    try {
      message = await SupportChatMessage.findById(messageId);
    } catch (findError) {
      console.error('Error finding message:', findError);
      return NextResponse.json({ 
        error: 'Database error finding message',
        details: findError instanceof Error ? findError.message : 'Unknown error'
      }, { status: 500 });
    }
    
    if (!message) {
      console.error('Message not found:', messageId);
      return NextResponse.json({ 
        error: 'Message not found',
        messageId 
      }, { status: 404 });
    }
    
    // Update the message as read
    const updated = await SupportChatMessage.findByIdAndUpdate(
      messageId, 
      {
        isRead: true,
        readAt: new Date()
      },
      { new: true }
    );
    
    console.log('Message marked as read:', updated?._id);
    
    return NextResponse.json({ success: true, data: { isRead: true, readAt: updated?.readAt } });
    
  } catch (error) {
    console.error('Error marking support message as read:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    
    return NextResponse.json(
      { 
        error: 'Failed to mark message as read',
        details: error instanceof Error ? error.message : 'Unknown error',
        type: error instanceof Error ? error.name : 'Unknown'
      }, 
      { status: 500 }
    );
  }
}