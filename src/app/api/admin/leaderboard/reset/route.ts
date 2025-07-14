import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/config/auth';
import { LeaderboardService } from '@/services/leaderboard-service';
import { LeaderboardType, LeaderboardPeriod } from '@/lib/db/models/leaderboard';
import { UserRole } from '@/lib/db/models/user';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
    }
    
    const { type, period } = await req.json();
    
    if (!type || !Object.values(LeaderboardType).includes(type)) {
      return NextResponse.json({ error: 'Invalid leaderboard type' }, { status: 400 });
    }
    
    if (!period || !Object.values(LeaderboardPeriod).includes(period)) {
      return NextResponse.json({ error: 'Invalid period' }, { status: 400 });
    }
    
    await LeaderboardService.resetLeaderboard(type, period);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Leaderboard reset successfully',
      type,
      period
    });
    
  } catch (error) {
    console.error('Error resetting leaderboard:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}