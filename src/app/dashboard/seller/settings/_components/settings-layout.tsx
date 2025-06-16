'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { 
  Settings, 
  Shield, 
  Bell, 
  User, 
  Store, 
  CreditCard,
  Copy,
  Package
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

// Import setting components
import DuplicateDetectionSettings from './duplicate-detection-settings';

// Placeholder component for other settings
function PlaceholderSettings({ title }: { title: string }) {
  const t = useTranslations('settings');
  
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Settings className="w-12 h-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium mb-2">{title}</h3>
      <p className="text-muted-foreground">
        {t('comingSoon')}
      </p>
    </div>
  );
}

interface SettingSection {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  component: React.ReactNode;
  badge?: string;
}

export default function SettingsLayout() {
  const t = useTranslations('settings');
  const [activeTab, setActiveTab] = useState('duplicates');

  const settingSections: SettingSection[] = [
    {
      id: 'account',
      title: t('sections.account.title'),
      description: t('sections.account.description'),
      icon: <User className="w-5 h-5" />,
      component: <PlaceholderSettings title={t('sections.account.title')} />
    },
    {
      id: 'business',
      title: t('sections.business.title'),
      description: t('sections.business.description'),
      icon: <Store className="w-5 h-5" />,
      component: <PlaceholderSettings title={t('sections.business.title')} />
    },
    {
      id: 'products',
      title: t('sections.products.title'),
      description: t('sections.products.description'),
      icon: <Package className="w-5 h-5" />,
      component: <PlaceholderSettings title={t('sections.products.title')} />
    },
    {
      id: 'duplicates',
      title: t('sections.duplicates.title'),
      description: t('sections.duplicates.description'),
      icon: <Copy className="w-5 h-5" />,
      component: <DuplicateDetectionSettings />,
      badge: t('badges.new')
    },
    {
      id: 'notifications',
      title: t('sections.notifications.title'),
      description: t('sections.notifications.description'),
      icon: <Bell className="w-5 h-5" />,
      component: <PlaceholderSettings title={t('sections.notifications.title')} />
    },
    {
      id: 'security',
      title: t('sections.security.title'),
      description: t('sections.security.description'),
      icon: <Shield className="w-5 h-5" />,
      component: <PlaceholderSettings title={t('sections.security.title')} />
    },
    {
      id: 'payment',
      title: t('sections.payment.title'),
      description: t('sections.payment.description'),
      icon: <CreditCard className="w-5 h-5" />,
      component: <PlaceholderSettings title={t('sections.payment.title')} />
    }
  ];

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        {/* Settings Navigation */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {settingSections.map((section) => (
            <Card 
              key={section.id}
              className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                activeTab === section.id 
                  ? 'border-primary bg-primary/5' 
                  : 'hover:border-muted-foreground/20'
              }`}
              onClick={() => setActiveTab(section.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      activeTab === section.id 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted'
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
  );
}