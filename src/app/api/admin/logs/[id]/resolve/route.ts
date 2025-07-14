import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/config/auth';
import { connectToDatabase } from '@/lib/db/mongoose';
import SystemLog from '@/lib/db/models/system-log';
import { UserRole } from '@/lib/db/models/user';
import { withApiLogging } from '@/lib/logging/api-logger';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user || session.user.role !== UserRole.ADMIN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { notes } = await req.json();
    
    await connectToDatabase();

    const { id } = await params;
    const log = await SystemLog.findById(id);
    
    if (!log) {
      return NextResponse.json({ error: 'Log not found' }, { status: 404 });
    }

    await log.markResolved(session.user.id, notes);

    return NextResponse.json({
      success: true,
      log,
    });
  } catch (error: any) {
    console.error('Error resolving log:', error);
    return NextResponse.json(
      { error: 'Failed to resolve log' },
      { status: 500 }
    );
  }
}