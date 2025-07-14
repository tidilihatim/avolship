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
    
    await connectToDatabase();
    
    // Find the user
    const user = await User.findById(session.user.id);
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Check if 2FA is already enabled
    if (user.twoFactorEnabled) {
      return NextResponse.json({ 
        error: '2FA is already enabled. Disable it first to set up again.' 
      }, { status: 400 });
    }
    
    // Generate 2FA secret and QR code
    const { secret, qrCodeUrl, manualEntryKey } = await user.generateTwoFactorSecret();
    
    // Save the user with the new secret (but don't enable 2FA yet)
    await user.save();
    
    return NextResponse.json({
      success: true,
      qrCodeUrl,
      manualEntryKey,
      // Don't send the full secret for security
      message: 'Scan the QR code with your authenticator app and verify with a code to complete setup.'
    });
    
  } catch (error) {
    console.error('2FA setup error:', error);
    return NextResponse.json({ 
      error: 'Failed to set up 2FA',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    await connectToDatabase();
    
    // Find the user
    const user = await User.findById(session.user.id);
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Verify password before disabling 2FA
    const { password } = await req.json();
    
    if (!password) {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 });
    }
    
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }
    
    // Disable 2FA
    user.twoFactorEnabled = false;
    user.twoFactorSecret = undefined;
    await user.save();
    
    return NextResponse.json({
      success: true,
      message: '2FA has been disabled successfully.'
    });
    
  } catch (error) {
    console.error('2FA disable error:', error);
    return NextResponse.json({ 
      error: 'Failed to disable 2FA',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}