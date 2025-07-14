'use client';

import { useState, useEffect } from 'react';
import AnimatedFeaturedAdsCarousel from '@/components/ads/animated-featured-ads-carousel';
import { AdPlacement } from '@/types/featured-provider-ad';

export default function DashboardContent() {
  const [showAds, setShowAds] = useState(true);
  const [animationEnabled, setAnimationEnabled] = useState(true);

  useEffect(() => {
    // Load user preferences from localStorage
    const savedPreference = localStorage.getItem('seller_ads_animation');
    if (savedPreference !== null) {
      setAnimationEnabled(savedPreference === 'true');
    }
    
    const showAdsPreference = localStorage.getItem('seller_show_ads');
    if (showAdsPreference !== null) {
      setShowAds(showAdsPreference === 'true');
    }
  }, []);

  const handleCloseAds = () => {
    setShowAds(false);
    localStorage.setItem('seller_show_ads', 'false');
  };

  return (
    <div className="space-y-6">
      {/* Animated Featured Provider Ads */}
      {showAds && (
        <AnimatedFeaturedAdsCarousel
          placement={AdPlacement.DASHBOARD_BANNER}
          animationEnabled={animationEnabled}
          onClose={handleCloseAds}
          className="mb-6"
        />
      )}
      
      {/* Dashboard Stats and Content */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-card p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Total Orders</h3>
          </div>
          <div className="text-2xl font-bold">0</div>
          <p className="text-xs text-muted-foreground">+0% from last month</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Revenue</h3>
          </div>
          <div className="text-2xl font-bold">$0.00</div>
          <p className="text-xs text-muted-foreground">+0% from last month</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Active Products</h3>
          </div>
          <div className="text-2xl font-bold">0</div>
          <p className="text-xs text-muted-foreground">0 in stock</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Pending Orders</h3>
          </div>
          <div className="text-2xl font-bold">0</div>
          <p className="text-xs text-muted-foreground">0 require action</p>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="rounded-lg border bg-card">
        <div className="p-6">
          <h3 className="text-lg font-semibold">Recent Orders</h3>
          <p className="text-sm text-muted-foreground">Your latest order activity</p>
        </div>
        <div className="p-6 pt-0">
          <p className="text-center text-muted-foreground py-8">No orders yet</p>
        </div>
      </div>
    </div>
  );
}