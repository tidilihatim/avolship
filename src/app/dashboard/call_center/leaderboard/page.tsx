import UniversalLeaderboardV2 from '@/app/dashboard/_components/universal-leaderboard-v2';

export default function CallCenterLeaderboardPage() {
  return (
    <UniversalLeaderboardV2 
      allowedTypes={['call_center_agent']}
      defaultType="call_center_agent"
      apiEndpoint="/api/call-center/leaderboard"
    />
  );
}