"use client";

import React, { useState, useEffect, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Settings, MapPin, DollarSign, Package, Users, Cog, Zap, Trophy, User, Headphones } from 'lucide-react';
import { DeliveryFeeRulesForm } from './_components/delivery-fee-rules-form';
import { CommissionRulesForm } from './_components/commission-rules-form';
import { CallCenterCommissionRulesForm } from './_components/call-center-commission-rules-form';
import { LocationTrackingForm } from './_components/location-tracking-form';
import { TokenSystemForm } from './_components/token-system-form';
import { SellerSettingsForm } from '@/components/shared/settings';
import { getAppSettings, updateAppSettings } from '@/app/actions/app-settings';
import { getTokenPackages } from '@/app/actions/tokens';

interface AppSettings {
  _id?: string;
  deliveryFeeRules: any[];
  commissionRules: any[];
  callCenterCommissionRules: any[];
  autoAssignDelivery: boolean;
  maxOrdersPerDeliveryGuy: number;
  showLocationTracking: {
    seller: boolean;
    call_center: boolean;
  };
  leaderboardSettings: {
    enableSellerLeaderboard: boolean;
    enableProviderLeaderboard: boolean;
    enableDeliveryLeaderboard: boolean;
    enableCallCenterLeaderboard: boolean;
  };
  enableCommissionSystem: boolean;
  enableDeliveryFees: boolean;
  defaultDeliveryFee: number;
  enableTokenSystem: boolean;
  showDeliveryProofToSeller: boolean;
  canSellerRequestPayments: boolean;
  isActive: boolean;
}

interface SettingSection {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  component: React.ReactNode;
  badge?: string;
}

const AppSettingsPage = () => {
  const t = useTranslations('settings');
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [tokenPackages, setTokenPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const [settingsResult, packagesResult] = await Promise.all([
        getAppSettings(),
        getTokenPackages()
      ]);
      
      if (settingsResult.success) {
        setSettings(settingsResult.data);
      } else {
        toast.error(settingsResult.error || t('messages.fetchFailed'));
      }

      setTokenPackages(packagesResult || []);
      
    } catch (error) {
      toast.error(t('messages.fetchError'));
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!settings) return;
    
    startTransition(async () => {
      try {
        const result = await updateAppSettings(settings);
        
        if (result.success) {
          toast.success(t('messages.saveSuccess'));
          setSettings(result.data); // Update with latest data
        } else {
          toast.error(result.error || t('messages.saveFailed'));
        }
      } catch (error) {
        toast.error(t('messages.saveError'));
        console.error(error);
      }
    });
  };

  const updateSettings = (updates: Partial<AppSettings>) => {
    setSettings(prev => prev ? { ...prev, ...updates } : null);
  };

  const refreshTokenPackages = async () => {
    try {
      const packagesResult = await getTokenPackages();
      setTokenPackages(packagesResult || []);
    } catch (error) {
      console.error('Error fetching token packages:', error);
    }
  };

  const settingSections: SettingSection[] = [
    {
      id: 'general',
      title: t('sections.general.title'),
      description: t('sections.general.description'),
      icon: <Cog className="w-5 h-5" />,
      component: settings ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="auto-assign">{t('general.autoAssign.label')}</Label>
              <p className="text-sm text-muted-foreground">
                {t('general.autoAssign.description')}
              </p>
            </div>
            <Switch
              id="auto-assign"
              checked={settings.autoAssignDelivery}
              onCheckedChange={(checked) => 
                updateSettings({ autoAssignDelivery: checked })
              }
            />
          </div>
          
          <Separator />
          
          <div className="space-y-2">
            <Label htmlFor="max-orders">{t('general.maxOrders.label')}</Label>
            <Input
              id="max-orders"
              type="number"
              min="1"
              value={settings.maxOrdersPerDeliveryGuy}
              onChange={(e) => 
                updateSettings({ 
                  maxOrdersPerDeliveryGuy: parseInt(e.target.value) || 1 
                })
              }
              className="w-32"
            />
            <p className="text-sm text-muted-foreground">
              {t('general.maxOrders.description')}
            </p>
          </div>
        </div>
      ) : null
    },
    {
      id: 'delivery',
      title: t('sections.delivery.title'),
      description: t('sections.delivery.description'),
      icon: <Package className="w-5 h-5" />,
      component: settings ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="enable-fees">{t('delivery.enableFees.label')}</Label>
              <p className="text-sm text-muted-foreground">
                {t('delivery.enableFees.description')}
              </p>
            </div>
            <Switch
              id="enable-fees"
              checked={settings.enableDeliveryFees}
              onCheckedChange={(checked) => 
                updateSettings({ enableDeliveryFees: checked })
              }
            />
          </div>

          <Separator />

          <DeliveryFeeRulesForm
            rules={settings.deliveryFeeRules}
            onRulesChange={(rules) => updateSettings({ deliveryFeeRules: rules })}
          />
        </div>
      ) : null
    },
    {
      id: 'commission',
      title: t('sections.commission.title'),
      description: t('sections.commission.description'),
      icon: <DollarSign className="w-5 h-5" />,
      component: settings ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="enable-commission">{t('commission.enableCommission.label')}</Label>
              <p className="text-sm text-muted-foreground">
                {t('commission.enableCommission.description')}
              </p>
            </div>
            <Switch
              id="enable-commission"
              checked={settings.enableCommissionSystem}
              onCheckedChange={(checked) =>
                updateSettings({ enableCommissionSystem: checked })
              }
            />
          </div>

          <Separator />

          <CommissionRulesForm
            rules={settings.commissionRules}
            onRulesChange={(rules) => updateSettings({ commissionRules: rules })}
          />
        </div>
      ) : null
    },
    {
      id: 'callCenterCommission',
      title: t('sections.callCenterCommission.title'),
      description: t('sections.callCenterCommission.description'),
      icon: <Headphones className="w-5 h-5" />,
      component: settings ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="enable-callcenter-commission">{t('callCenterCommission.enableCommission.label')}</Label>
              <p className="text-sm text-muted-foreground">
                {t('callCenterCommission.enableCommission.description')}
              </p>
            </div>
            <Switch
              id="enable-callcenter-commission"
              checked={settings.enableCommissionSystem}
              onCheckedChange={(checked) =>
                updateSettings({ enableCommissionSystem: checked })
              }
            />
          </div>

          <Separator />

          <CallCenterCommissionRulesForm
            rules={settings.callCenterCommissionRules}
            onRulesChange={(rules) => updateSettings({ callCenterCommissionRules: rules })}
          />
        </div>
      ) : null
    },
    {
      id: 'tracking',
      title: t('sections.tracking.title'),
      description: t('sections.tracking.description'),
      icon: <MapPin className="w-5 h-5" />,
      component: settings ? (
        <LocationTrackingForm
          settings={settings.showLocationTracking}
          onSettingsChange={(trackingSettings) => 
            updateSettings({ showLocationTracking: trackingSettings })
          }
        />
      ) : null
    },
    {
      id: 'leaderboards',
      title: t('sections.leaderboards.title'),
      description: t('sections.leaderboards.description'),
      icon: <Trophy className="w-5 h-5" />,
      component: settings ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="seller-leaderboard">{t('leaderboards.seller.label')}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('leaderboards.seller.description')}
                </p>
              </div>
              <Switch
                id="seller-leaderboard"
                checked={settings.leaderboardSettings?.enableSellerLeaderboard ?? true}
                onCheckedChange={(checked) => 
                  updateSettings({ 
                    leaderboardSettings: {
                      ...settings.leaderboardSettings,
                      enableSellerLeaderboard: checked
                    }
                  })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="provider-leaderboard">{t('leaderboards.provider.label')}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('leaderboards.provider.description')}
                </p>
              </div>
              <Switch
                id="provider-leaderboard"
                checked={settings.leaderboardSettings?.enableProviderLeaderboard ?? true}
                onCheckedChange={(checked) => 
                  updateSettings({ 
                    leaderboardSettings: {
                      ...settings.leaderboardSettings,
                      enableProviderLeaderboard: checked
                    }
                  })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="delivery-leaderboard">{t('leaderboards.delivery.label')}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('leaderboards.delivery.description')}
                </p>
              </div>
              <Switch
                id="delivery-leaderboard"
                checked={settings.leaderboardSettings?.enableDeliveryLeaderboard ?? true}
                onCheckedChange={(checked) => 
                  updateSettings({ 
                    leaderboardSettings: {
                      ...settings.leaderboardSettings,
                      enableDeliveryLeaderboard: checked
                    }
                  })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="callcenter-leaderboard">{t('leaderboards.callCenter.label')}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('leaderboards.callCenter.description')}
                </p>
              </div>
              <Switch
                id="callcenter-leaderboard"
                checked={settings.leaderboardSettings?.enableCallCenterLeaderboard ?? true}
                onCheckedChange={(checked) => 
                  updateSettings({ 
                    leaderboardSettings: {
                      ...settings.leaderboardSettings,
                      enableCallCenterLeaderboard: checked
                    }
                  })
                }
              />
            </div>
          </div>

          <Separator />

          <div className="rounded-lg bg-muted/50 p-4">
            <h4 className="text-sm font-medium mb-2">{t('leaderboards.status.title')}</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${settings.leaderboardSettings?.enableSellerLeaderboard ? 'bg-green-500' : 'bg-red-500'}`} />
                <span>{t('leaderboards.status.sellers')}: {settings.leaderboardSettings?.enableSellerLeaderboard ? t('common.active') : t('common.disabled')}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${settings.leaderboardSettings?.enableProviderLeaderboard ? 'bg-green-500' : 'bg-red-500'}`} />
                <span>{t('leaderboards.status.providers')}: {settings.leaderboardSettings?.enableProviderLeaderboard ? t('common.active') : t('common.disabled')}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${settings.leaderboardSettings?.enableDeliveryLeaderboard ? 'bg-green-500' : 'bg-red-500'}`} />
                <span>{t('leaderboards.status.delivery')}: {settings.leaderboardSettings?.enableDeliveryLeaderboard ? t('common.active') : t('common.disabled')}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${settings.leaderboardSettings?.enableCallCenterLeaderboard ? 'bg-green-500' : 'bg-red-500'}`} />
                <span>{t('leaderboards.status.callCenter')}: {settings.leaderboardSettings?.enableCallCenterLeaderboard ? t('common.active') : t('common.disabled')}</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {t('leaderboards.status.note')}
            </p>
          </div>
        </div>
      ) : null
    },
    {
      id: 'sellers',
      title: t('sections.sellers.title'),
      description: t('sections.sellers.description'),
      icon: <User className="w-5 h-5" />,
      component: settings ? (
        <SellerSettingsForm
          settings={{
            showDeliveryProofToSeller: settings.showDeliveryProofToSeller,
            canSellerRequestPayments: settings.canSellerRequestPayments,
          }}
          onSettingsChange={(sellerSettings) =>
            updateSettings({
              showDeliveryProofToSeller: sellerSettings.showDeliveryProofToSeller,
              canSellerRequestPayments: sellerSettings.canSellerRequestPayments,
            })
          }
        />
      ) : null
    },
    {
      id: 'tokens',
      title: t('sections.tokens.title'),
      description: t('sections.tokens.description'),
      icon: <Zap className="w-5 h-5" />,
      badge: settings?.enableTokenSystem ? t('common.active') : t('common.inactive'),
      component: settings ? (
        <TokenSystemForm
          settings={{
            enabled: settings.enableTokenSystem,
            packages: tokenPackages,
          }}
          onSettingsChange={(tokenSettings) =>
            updateSettings({ enableTokenSystem: tokenSettings.enabled })
          }
          onPackagesUpdate={refreshTokenPackages}
        />
      ) : null
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Settings className="w-8 h-8 animate-spin mx-auto mb-2" />
          <p>{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p>{t('loadFailed')}</p>
          <Button onClick={fetchSettings} className="mt-2">
            {t('tryAgain')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t('title')}
          </h1>
          <p className="text-muted-foreground">
            {t('description')}
          </p>
        </div>
        <Button 
          onClick={saveSettings} 
          disabled={isPending}
          className="min-w-[120px]"
        >
          {isPending ? t('saving') : t('saveChanges')}
        </Button>
      </div>

      <div className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Settings Navigation */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {settingSections.map((section) => (
              <Card 
                key={section.id}
                className={`group cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1 hover:scale-[1.02] ${
                  activeTab === section.id 
                    ? 'border-primary bg-primary/5 shadow-md' 
                    : 'hover:border-primary/30 hover:bg-primary/5'
                }`}
                onClick={() => setActiveTab(section.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg transition-all duration-300 ${
                        activeTab === section.id 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted group-hover:bg-primary group-hover:text-primary-foreground'
                      }`}>
                        {section.icon}
                      </div>
                      <div>
                        <h3 className="font-medium text-sm">{section.title}</h3>
                        {section.badge && (
                          <Badge variant="secondary" className="text-xs mt-1">
                            {section.badge}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {section.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Settings Content */}
          <div className="space-y-6">
            {settingSections.map((section) => (
              <TabsContent key={section.id} value={section.id} className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary text-primary-foreground">
                        {section.icon}
                      </div>
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {section.title}
                          {section.badge && (
                            <Badge variant="secondary" className="text-xs">
                              {section.badge}
                            </Badge>
                          )}
                        </CardTitle>
                        <CardDescription>
                          {section.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {section.component}
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default AppSettingsPage;