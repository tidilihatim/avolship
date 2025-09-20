'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Bell } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import NotificationSettings from '@/components/settings/notification-settings';

interface UserSettingsLayoutProps {
  userType: 'call_center' | 'delivery' | 'provider' | 'support';
}

interface SettingSection {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  component: React.ReactNode;
  badge?: string;
}

export default function UserSettingsLayout({ userType }: UserSettingsLayoutProps) {
  const t = useTranslations('settings');
  const [activeTab, setActiveTab] = useState('notifications');

  const settingSections: SettingSection[] = [
    {
      id: 'notifications',
      title: t('sections.notifications.title'),
      description: t('sections.notifications.description'),
      icon: <Bell className="w-5 h-5" />,
      component: <NotificationSettings />
    },
  ];

  return (
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
  );
}