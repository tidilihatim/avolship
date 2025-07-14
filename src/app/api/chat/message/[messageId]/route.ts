import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/config/auth';
import { connectToDatabase } from '@/lib/db/mongoose';
import ChatMessage from '@/lib/db/models/chat-message';

export async function DELETE(
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

    // Find the message
    const message = await ChatMessage.findById(messageId);
    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Check permissions: user can delete their own messages, or support/admin can delete any
    const canDelete = message.sender.toString() === session.user.id ||
                     session.user.role === 'support' ||
                     session.user.role === 'admin';

    if (!canDelete) {
      return NextResponse.json({ error: 'Not authorized to delete this message' }, { status: 403 });
    }

    // Soft delete by setting deletedAt timestamp
    message.deletedAt = new Date();
    await message.save();

    // Or hard delete if preferred:
    // await ChatMessage.findByIdAndDelete(messageId);

    return NextResponse.json({
      success: true,
      message: 'Message deleted successfully'
    });

  } catch (error: any) {
    console.error('Error deleting message:', error);
    return NextResponse.json({ 
      error: 'Failed to delete message', 
      details: error.message 
    }, { status: 500 });
  }
}