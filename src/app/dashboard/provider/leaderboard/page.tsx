import UniversalLeaderboardV2 from '@/app/dashboard/_components/universal-leaderboard-v2';

export default function ProviderLeaderboardPage() {
  return (
    <UniversalLeaderboardV2 
      allowedTypes={['provider', 'seller']}
      defaultType="provider"
      apiEndpoint="/api/provider/leaderboard"
    />
  );
}