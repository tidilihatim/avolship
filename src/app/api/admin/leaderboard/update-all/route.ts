import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/config/auth';
import { LeaderboardService } from '@/services/leaderboard-service';
import { UserRole } from '@/lib/db/models/user';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !['ADMIN', 'admin', UserRole.ADMIN].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
    }
    
    // Start the update process asynchronously
    LeaderboardService.updateAllLeaderboards().catch(error => {
      console.error('Error updating all leaderboards:', error);
    });
    
    return NextResponse.json({ 
      success: true, 
      message: 'Leaderboard update process started. This may take a few minutes to complete.',
    });
    
  } catch (error) {
    console.error('Error starting leaderboard update:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}