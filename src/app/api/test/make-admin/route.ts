import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/config/auth';
import { connectToDatabase } from '@/lib/db/mongoose';
import User, { UserRole } from '@/lib/db/models/user';

export async function POST(req: NextRequest) {
  try {
    // Get current session
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Update the current user's role to ADMIN
    const updatedUser = await User.findByIdAndUpdate(
      session.user.id,
      { role: UserRole.ADMIN },
      { new: true }
    );

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `User ${updatedUser.email} is now an ADMIN. Please logout and login again for changes to take effect.`,
      user: {
        id: updatedUser._id,
        email: updatedUser.email,
        role: updatedUser.role,
        previousRole: session.user.role,
      }
    });

  } catch (error: any) {
    console.error('Error updating user role:', error);
    return NextResponse.json(
      { error: 'Failed to update user role', details: error.message },
      { status: 500 }
    );
  }
}