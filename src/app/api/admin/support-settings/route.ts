import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/config/auth';

// In a real app, these would be stored in a database
// For now, we'll use in-memory storage
let supportSettings = {
  autoAssignment: true,
  slaEnabled: true,
  escalationEnabled: true,
  customerSatisfactionEnabled: true,
  categories: ['technical', 'billing', 'account', 'orders', 'sourcing', 'expeditions', 'integrations', 'general'],
  priorities: [
    { value: 'critical', label: 'Critical', slaMinutes: 15 },
    { value: 'high', label: 'High', slaMinutes: 60 },
    { value: 'medium', label: 'Medium', slaMinutes: 240 },
    { value: 'low', label: 'Low', slaMinutes: 480 }
  ],
  cannedResponses: [
    {
      id: '1',
      title: 'Order Status Inquiry',
      content: 'Thank you for reaching out. I\'ll check the status of your order right away. Could you please provide your order ID?',
      category: 'orders'
    },
    {
      id: '2',
      title: 'Password Reset Instructions',
      content: 'To reset your password, please click on the "Forgot Password" link on the login page. You\'ll receive an email with instructions to create a new password.',
      category: 'account'
    }
  ]
};

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can access this
    if (session.user.role !== 'admin' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      settings: supportSettings
    });

  } catch (error) {
    console.error('Error fetching support settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can update this
    if (session.user.role !== 'admin' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { settings } = body;

    if (!settings) {
      return NextResponse.json({ error: 'Settings required' }, { status: 400 });
    }

    // Update settings
    supportSettings = {
      ...supportSettings,
      ...settings
    };

    return NextResponse.json({
      success: true,
      settings: supportSettings,
      message: 'Settings updated successfully'
    });

  } catch (error) {
    console.error('Error updating support settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}