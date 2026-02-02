"use client";

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Coins, TrendingUp, TrendingDown } from 'lucide-react';
import { getUserTokenData } from '@/app/actions/tokens';

interface TokenData {
  balance: number;
  totalPurchased: number;
  totalSpent: number;
  transactions: any[];
}

interface TokenBalanceCardProps {
  onBalanceUpdate?: () => void;
}

export function TokenBalanceCard({ onBalanceUpdate }: TokenBalanceCardProps = {}) {
  const t = useTranslations('providerTokens.balance');
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTokenData();
  }, []);

  const fetchTokenData = async () => {
    try {
      setLoading(true);
      const data = await getUserTokenData();
      setTokenData(data);
    } catch (error) {
      console.error('Error fetching token data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <div className="h-4 w-4 bg-muted rounded" />
                <div className="h-4 w-20 bg-muted rounded" />
              </div>
              <div className="h-8 w-16 bg-muted rounded mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!tokenData) {
    return (
      <Card>
        <CardContent className="text-center py-6">
          <p className="text-muted-foreground">{t('unableToLoad')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('currentBalance')}</CardTitle>
          <Coins className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{tokenData.balance}</div>
          <p className="text-xs text-muted-foreground">
            {t('availableTokens')}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('totalPurchased')}</CardTitle>
          <TrendingUp className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{tokenData.totalPurchased}</div>
          <p className="text-xs text-muted-foreground">
            {t('tokensPurchasedAllTime')}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('totalSpent')}</CardTitle>
          <TrendingDown className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">{tokenData.totalSpent}</div>
          <p className="text-xs text-muted-foreground">
            {t('tokensSpentOnCampaigns')}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}