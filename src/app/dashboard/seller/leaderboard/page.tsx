import UniversalLeaderboardV2 from '@/app/dashboard/_components/universal-leaderboard-v2';

export default function SellerLeaderboardPage() {
  return (
    <UniversalLeaderboardV2 
      allowedTypes={['seller', 'provider']}
      defaultType="seller"
      apiEndpoint="/api/seller/leaderboard"
    />
  );
}