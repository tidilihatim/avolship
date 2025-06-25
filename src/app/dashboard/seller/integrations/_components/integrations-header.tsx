import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Zap } from 'lucide-react';

export function IntegrationsHeader() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Zap className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Integrations</h1>
          <p className="text-muted-foreground">Connect your e-commerce platforms</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Automate Your Order Fulfillment</CardTitle>
            <Badge variant="secondary">Beta</Badge>
          </div>
          <CardDescription>
            Connect your online stores to automatically receive and fulfill orders through our network
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
                <div className="h-2 w-2 rounded-full bg-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Real-time Sync</p>
                <p className="text-xs text-muted-foreground">Orders sync instantly</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20">
                <div className="h-2 w-2 rounded-full bg-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Auto Fulfillment</p>
                <p className="text-xs text-muted-foreground">Hands-free processing</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/20">
                <div className="h-2 w-2 rounded-full bg-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Multi-platform</p>
                <p className="text-xs text-muted-foreground">Connect multiple stores</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}