"use client";

import React, { useState, useEffect, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Settings, MapPin, DollarSign, Package, Users, Cog, Zap } from 'lucide-react';
import { DeliveryFeeRulesForm } from './_components/delivery-fee-rules-form';
import { CommissionRulesForm } from './_components/commission-rules-form';
import { LocationTrackingForm } from './_components/location-tracking-form';
import { TokenSystemForm } from './_components/token-system-form';
import { getAppSettings, updateAppSettings } from '@/app/actions/app-settings';
import { getTokenPackages } from '@/app/actions/tokens';

interface AppSettings {
  _id?: string;
  deliveryFeeRules: any[];
  commissionRules: any[];
  autoAssignDelivery: boolean;
  maxOrdersPerDeliveryGuy: number;
  showLocationTracking: {
    seller: boolean;
    call_center: boolean;
  };
  enableCommissionSystem: boolean;
  enableDeliveryFees: boolean;
  defaultDeliveryFee: number;
  enableTokenSystem: boolean;
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
        toast.error(settingsResult.error || 'Failed to fetch app settings');
      }

      setTokenPackages(packagesResult || []);
      
    } catch (error) {
      toast.error('Error fetching app settings');
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
          toast.success('Settings saved successfully');
          setSettings(result.data); // Update with latest data
        } else {
          toast.error(result.error || 'Failed to save settings');
        }
      } catch (error) {
        toast.error('Error saving settings');
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
      title: 'General Settings',
      description: 'Configure basic application settings and delivery preferences',
      icon: <Cog className="w-5 h-5" />,
      component: settings ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="auto-assign">Auto-assign Delivery</Label>
              <p className="text-sm text-muted-foreground">
                Automatically assign orders to nearest delivery personnel
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
            <Label htmlFor="max-orders">Max Orders per Delivery Person</Label>
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
              Maximum number of orders a delivery person can handle simultaneously
            </p>
          </div>
        </div>
      ) : null
    },
    {
      id: 'delivery',
      title: 'Delivery Fee Configuration',
      description: 'Configure delivery fees and distance-based rules by warehouse',
      icon: <Package className="w-5 h-5" />,
      component: settings ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="enable-fees">Enable Delivery Fees</Label>
              <p className="text-sm text-muted-foreground">
                Enable or disable delivery fee system
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
      title: 'Commission Configuration',
      description: 'Configure commission rules and rates for delivery personnel',
      icon: <DollarSign className="w-5 h-5" />,
      component: settings ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="enable-commission">Enable Commission System</Label>
              <p className="text-sm text-muted-foreground">
                Enable or disable commission system
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
      id: 'tracking',
      title: 'Location Tracking Settings',
      description: 'Configure location tracking visibility for different user roles',
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
      id: 'tokens',
      title: 'Token Boost System',
      description: 'Configure token-based provider profile boosting and advertising',
      icon: <Zap className="w-5 h-5" />,
      badge: settings?.enableTokenSystem ? 'Active' : 'Inactive',
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
          <p>Loading settings...</p>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p>Failed to load settings</p>
          <Button onClick={fetchSettings} className="mt-2">
            Try Again
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
            App Settings
          </h1>
          <p className="text-muted-foreground">
            Configure system-wide application settings
          </p>
        </div>
        <Button 
          onClick={saveSettings} 
          disabled={isPending}
          className="min-w-[120px]"
        >
          {isPending ? 'Saving...' : 'Save Changes'}
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