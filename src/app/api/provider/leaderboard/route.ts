import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/config/auth';
import { LeaderboardService } from '@/services/leaderboard-service';
import { LeaderboardType, LeaderboardPeriod } from '@/lib/db/models/leaderboard';
import { UserRole } from '@/lib/db/models/user';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== UserRole.PROVIDER) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') as LeaderboardType || LeaderboardType.PROVIDER;
    const period = searchParams.get('period') as LeaderboardPeriod || LeaderboardPeriod.MONTHLY;
    const limit = parseInt(searchParams.get('limit') || '50');
    
    // Providers can view both provider and seller leaderboards
    if (!Object.values(LeaderboardType).includes(type) || type === LeaderboardType.CALL_CENTER_AGENT) {
      return NextResponse.json({ error: 'Invalid leaderboard type' }, { status: 400 });
    }
    
    if (!Object.values(LeaderboardPeriod).includes(period)) {
      return NextResponse.json({ error: 'Invalid period' }, { status: 400 });
    }
    
    const leaderboard = await LeaderboardService.getLeaderboard(
      type,
      period,
      limit
    );
    
    return NextResponse.json({ 
      success: true, 
      data: leaderboard,
      type,
      period,
      count: leaderboard.length
    });
    
  } catch (error) {
    console.error('Error fetching provider leaderboard:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}