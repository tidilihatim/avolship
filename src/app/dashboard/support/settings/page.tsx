'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Save, Bell, MessageSquare, Clock, Shield } from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

interface NotificationSettings {
  emailNotifications: boolean;
  desktopNotifications: boolean;
  newTicketAlert: boolean;
  assignmentAlert: boolean;
  slaBreachAlert: boolean;
  messageAlert: boolean;
}

interface WorkingHours {
  startTime: string;
  endTime: string;
  timezone: string;
  workDays: string[];
}

export default function SupportSettingsPage() {
  const { toast } = useToast();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    desktopNotifications: true,
    newTicketAlert: true,
    assignmentAlert: true,
    slaBreachAlert: true,
    messageAlert: true,
  });

  const [workingHours, setWorkingHours] = useState<WorkingHours>({
    startTime: '09:00',
    endTime: '18:00',
    timezone: 'UTC',
    workDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
  });

  const [responseTemplates, setResponseTemplates] = useState([
    { id: 1, name: 'Greeting', content: 'Hello! Thank you for contacting support. How can I help you today?' },
    { id: 2, name: 'Closing', content: 'Is there anything else I can help you with?' },
  ]);

  const saveSettings = async () => {
    setLoading(true);
    try {
      // In a real app, this would save to the backend
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: 'Settings saved',
        description: 'Your preferences have been updated successfully.'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save settings. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const weekDays = [
    { value: 'monday', label: 'Monday' },
    { value: 'tuesday', label: 'Tuesday' },
    { value: 'wednesday', label: 'Wednesday' },
    { value: 'thursday', label: 'Thursday' },
    { value: 'friday', label: 'Friday' },
    { value: 'saturday', label: 'Saturday' },
    { value: 'sunday', label: 'Sunday' },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Support Settings</h1>
          <p className="text-muted-foreground">Manage your support preferences and notifications</p>
        </div>
        <Link href="/dashboard/support">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Support
          </Button>
        </Link>
      </div>

      <div className="grid gap-6">
        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notification Preferences
            </CardTitle>
            <CardDescription>Configure how you want to be notified about support activities</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="email-notifications">Email Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive email alerts for important updates</p>
              </div>
              <Switch
                id="email-notifications"
                checked={notificationSettings.emailNotifications}
                onCheckedChange={(checked) => 
                  setNotificationSettings(prev => ({ ...prev, emailNotifications: checked }))
                }
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="desktop-notifications">Desktop Notifications</Label>
                <p className="text-sm text-muted-foreground">Show browser notifications for real-time alerts</p>
              </div>
              <Switch
                id="desktop-notifications"
                checked={notificationSettings.desktopNotifications}
                onCheckedChange={(checked) => 
                  setNotificationSettings(prev => ({ ...prev, desktopNotifications: checked }))
                }
              />
            </div>

            <Separator />

            <div className="space-y-4">
              <h4 className="font-medium">Alert Types</h4>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="new-ticket">New Ticket Assignments</Label>
                <Switch
                  id="new-ticket"
                  checked={notificationSettings.newTicketAlert}
                  onCheckedChange={(checked) => 
                    setNotificationSettings(prev => ({ ...prev, newTicketAlert: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="assignment">Ticket Reassignments</Label>
                <Switch
                  id="assignment"
                  checked={notificationSettings.assignmentAlert}
                  onCheckedChange={(checked) => 
                    setNotificationSettings(prev => ({ ...prev, assignmentAlert: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="sla-breach">SLA Breach Warnings</Label>
                <Switch
                  id="sla-breach"
                  checked={notificationSettings.slaBreachAlert}
                  onCheckedChange={(checked) => 
                    setNotificationSettings(prev => ({ ...prev, slaBreachAlert: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="messages">New Messages</Label>
                <Switch
                  id="messages"
                  checked={notificationSettings.messageAlert}
                  onCheckedChange={(checked) => 
                    setNotificationSettings(prev => ({ ...prev, messageAlert: checked }))
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Working Hours */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Working Hours
            </CardTitle>
            <CardDescription>Set your availability for ticket assignments</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start-time">Start Time</Label>
                <Input
                  id="start-time"
                  type="time"
                  value={workingHours.startTime}
                  onChange={(e) => setWorkingHours(prev => ({ ...prev, startTime: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="end-time">End Time</Label>
                <Input
                  id="end-time"
                  type="time"
                  value={workingHours.endTime}
                  onChange={(e) => setWorkingHours(prev => ({ ...prev, endTime: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <Label>Working Days</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {weekDays.map(day => (
                  <Button
                    key={day.value}
                    variant={workingHours.workDays.includes(day.value) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setWorkingHours(prev => ({
                        ...prev,
                        workDays: prev.workDays.includes(day.value)
                          ? prev.workDays.filter(d => d !== day.value)
                          : [...prev.workDays, day.value]
                      }));
                    }}
                  >
                    {day.label}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Response Templates */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Quick Response Templates
            </CardTitle>
            <CardDescription>Your personal response templates for common queries</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {responseTemplates.map((template) => (
              <div key={template.id} className="p-4 border rounded-lg">
                <h4 className="font-medium">{template.name}</h4>
                <p className="text-sm text-muted-foreground mt-1">{template.content}</p>
              </div>
            ))}
            <Button variant="outline" className="w-full">
              Add New Template
            </Button>
          </CardContent>
        </Card>

        {/* Account Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Account Security
            </CardTitle>
            <CardDescription>Manage your account security settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Current Password</Label>
              <p className="text-sm text-muted-foreground">Last changed 30 days ago</p>
              <Button variant="outline" className="mt-2">Change Password</Button>
            </div>
            
            <Separator />
            
            <div>
              <Label>Two-Factor Authentication</Label>
              <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
              <Button variant="outline" className="mt-2">Enable 2FA</Button>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={saveSettings} disabled={loading} size="lg">
            <Save className="w-4 w-4 mr-2" />
            Save All Settings
          </Button>
        </div>
      </div>
    </div>
  );
}