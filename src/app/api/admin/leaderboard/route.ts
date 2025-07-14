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
    const type = searchParams.get('type') as LeaderboardType;
    const period = searchParams.get('period') as LeaderboardPeriod;
    const limit = parseInt(searchParams.get('limit') || '50');
    
    if (!type || !Object.values(LeaderboardType).includes(type)) {
      return NextResponse.json({ error: 'Invalid leaderboard type' }, { status: 400 });
    }
    
    if (!period || !Object.values(LeaderboardPeriod).includes(period)) {
      return NextResponse.json({ error: 'Invalid period' }, { status: 400 });
    }
    
    const leaderboard = await LeaderboardService.getLeaderboard(type, period, limit);
    
    return NextResponse.json({ 
      success: true, 
      data: leaderboard,
      type,
      period,
      count: leaderboard.length
    });
    
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !['admin', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
    }
    
    const { type, period } = await req.json();
    
    if (!type || !Object.values(LeaderboardType).includes(type)) {
      return NextResponse.json({ error: 'Invalid leaderboard type' }, { status: 400 });
    }
    
    if (!period || !Object.values(LeaderboardPeriod).includes(period)) {
      return NextResponse.json({ error: 'Invalid period' }, { status: 400 });
    }
    
    await LeaderboardService.updateLeaderboard(type, period);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Leaderboard updated successfully',
      type,
      period
    });
    
  } catch (error) {
    console.error('Error updating leaderboard:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}