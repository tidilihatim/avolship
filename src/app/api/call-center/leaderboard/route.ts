import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/config/auth';
import { LeaderboardService } from '@/services/leaderboard-service';
import { LeaderboardType, LeaderboardPeriod } from '@/lib/db/models/leaderboard';
import { UserRole } from '@/lib/db/models/user';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !['admin', 'call_center'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') as LeaderboardPeriod || LeaderboardPeriod.MONTHLY;
    const limit = parseInt(searchParams.get('limit') || '20');
    
    if (!Object.values(LeaderboardPeriod).includes(period)) {
      return NextResponse.json({ error: 'Invalid period' }, { status: 400 });
    }
    
    const leaderboard = await LeaderboardService.getLeaderboard(
      LeaderboardType.CALL_CENTER_AGENT, 
      period, 
      limit
    );
    
    return NextResponse.json({ 
      success: true, 
      data: leaderboard,
      period,
      count: leaderboard.length
    });
    
  } catch (error) {
    console.error('Error fetching call center leaderboard:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}