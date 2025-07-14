import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/config/auth';
import { connectToDatabase } from '@/lib/db/mongoose';
import User from '@/lib/db/models/user';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    const { token, action } = await req.json();
    
    if (!token) {
      return NextResponse.json({ error: 'Verification token is required' }, { status: 400 });
    }
    
    await connectToDatabase();
    
    // Find the user
    const user = await User.findById(session.user.id);
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Verify the token
    const isValid = await user.verifyTwoFactorToken(token);
    
    if (!isValid) {
      return NextResponse.json({ 
        error: 'Invalid verification code. Please try again.' 
      }, { status: 400 });
    }
    
    // If action is 'enable', enable 2FA
    if (action === 'enable' && !user.twoFactorEnabled) {
      user.twoFactorEnabled = true;
      await user.save();
      
      return NextResponse.json({
        success: true,
        message: '2FA has been enabled successfully.',
        twoFactorEnabled: true
      });
    }
    
    // Otherwise, just verify the token (for login)
    return NextResponse.json({
      success: true,
      message: 'Verification successful.',
      verified: true
    });
    
  } catch (error) {
    console.error('2FA verification error:', error);
    return NextResponse.json({ 
      error: 'Failed to verify 2FA token',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}