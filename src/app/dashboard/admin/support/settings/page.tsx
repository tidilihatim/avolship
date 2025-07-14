'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface TicketSettings {
  autoAssignment: boolean;
  slaEnabled: boolean;
  escalationEnabled: boolean;
  customerSatisfactionEnabled: boolean;
  priorities: { value: string; label: string; slaMinutes: number }[];
  cannedResponses: { id: string; title: string; content: string; category: string }[];
}

export default function SupportSettingsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<TicketSettings>({
    autoAssignment: true,
    slaEnabled: true,
    escalationEnabled: true,
    customerSatisfactionEnabled: true,
    priorities: [
      { value: 'critical', label: 'Critical', slaMinutes: 15 },
      { value: 'high', label: 'High', slaMinutes: 60 },
      { value: 'medium', label: 'Medium', slaMinutes: 240 },
      { value: 'low', label: 'Low', slaMinutes: 480 }
    ],
    cannedResponses: []
  });
  
  const [cannedResponseDialogOpen, setCannedResponseDialogOpen] = useState(false);
  const [newResponse, setNewResponse] = useState({ title: '', content: '', category: 'general' });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/support-settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings || settings);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const saveSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/support-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings })
      });
      
      if (response.ok) {
        toast({
          title: 'Settings saved',
          description: 'Support settings have been updated successfully.'
        });
      } else {
        throw new Error('Failed to save settings');
      }
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

  const addCannedResponse = () => {
    if (!newResponse.title || !newResponse.content) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields',
        variant: 'destructive'
      });
      return;
    }

    setSettings(prev => ({
      ...prev,
      cannedResponses: [...prev.cannedResponses, {
        id: Date.now().toString(),
        ...newResponse
      }]
    }));

    setNewResponse({ title: '', content: '', category: 'general' });
    setCannedResponseDialogOpen(false);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Support Settings</h1>
          <p className="text-muted-foreground">Configure support ticket behavior and automation</p>
        </div>
        <Link href="/dashboard/admin/support">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Support
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ticket Automation</CardTitle>
          <CardDescription>Configure automatic ticket handling</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="auto-assignment">Auto Assignment</Label>
              <p className="text-sm text-muted-foreground">Automatically assign tickets to available agents</p>
            </div>
            <Switch
              id="auto-assignment"
              checked={settings.autoAssignment}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, autoAssignment: checked }))}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="sla-enabled">SLA Tracking</Label>
              <p className="text-sm text-muted-foreground">Track response and resolution times</p>
            </div>
            <Switch
              id="sla-enabled"
              checked={settings.slaEnabled}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, slaEnabled: checked }))}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="escalation-enabled">Automatic Escalation</Label>
              <p className="text-sm text-muted-foreground">Escalate tickets based on SLA breaches</p>
            </div>
            <Switch
              id="escalation-enabled"
              checked={settings.escalationEnabled}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, escalationEnabled: checked }))}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="csat-enabled">Customer Satisfaction</Label>
              <p className="text-sm text-muted-foreground">Request feedback after ticket resolution</p>
            </div>
            <Switch
              id="csat-enabled"
              checked={settings.customerSatisfactionEnabled}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, customerSatisfactionEnabled: checked }))}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>SLA Configuration</CardTitle>
          <CardDescription>Set response time targets for each priority level</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {settings.priorities.map((priority, index) => (
            <div key={priority.value} className="flex items-center gap-4">
              <Badge 
                variant={priority.value === 'critical' ? 'destructive' : 
                        priority.value === 'high' ? 'default' :
                        priority.value === 'medium' ? 'secondary' : 'outline'}
                className="w-20 justify-center"
              >
                {priority.label}
              </Badge>
              <div className="flex-1 flex items-center gap-2">
                <Label htmlFor={`sla-${priority.value}`} className="min-w-fit">
                  Response time:
                </Label>
                <Input
                  id={`sla-${priority.value}`}
                  type="number"
                  value={priority.slaMinutes}
                  onChange={(e) => {
                    const newPriorities = [...settings.priorities];
                    newPriorities[index].slaMinutes = parseInt(e.target.value) || 0;
                    setSettings(prev => ({ ...prev, priorities: newPriorities }));
                  }}
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">minutes</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Canned Responses</CardTitle>
            <CardDescription>Pre-written responses for common support issues</CardDescription>
          </div>
          <Dialog open={cannedResponseDialogOpen} onOpenChange={setCannedResponseDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Response
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Canned Response</DialogTitle>
                <DialogDescription>
                  Create a pre-written response that agents can use quickly
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="response-title">Title</Label>
                  <Input
                    id="response-title"
                    value={newResponse.title}
                    onChange={(e) => setNewResponse(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Password Reset Instructions"
                  />
                </div>
                <div>
                  <Label htmlFor="response-content">Content</Label>
                  <textarea
                    id="response-content"
                    className="w-full min-h-[120px] px-3 py-2 text-sm rounded-md border border-input bg-background"
                    value={newResponse.content}
                    onChange={(e) => setNewResponse(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Enter the response content..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={addCannedResponse}>Add Response</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {settings.cannedResponses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No canned responses yet. Add your first one to speed up support replies!
            </div>
          ) : (
            <div className="space-y-2">
              {settings.cannedResponses.map(response => (
                <div key={response.id} className="flex items-start justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">{response.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{response.content}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSettings(prev => ({
                        ...prev,
                        cannedResponses: prev.cannedResponses.filter(r => r.id !== response.id)
                      }));
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={saveSettings} disabled={loading} size="lg">
          <Save className="w-4 w-4 mr-2" />
          Save Settings
        </Button>
      </div>
    </div>
  );
}