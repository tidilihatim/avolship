import { LogStatsWidget } from './_components/log-stats-widget';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Users, Package, CreditCard } from 'lucide-react';

export default function AdminDashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Monitor system health, user activity, and manage platform operations
        </p>
      </div>

      {/* System Health Overview */}
      <LogStatsWidget />

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,234</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">456</div>
            <p className="text-xs text-muted-foreground">
              23 pending confirmation
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue (MTD)</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$45,231</div>
            <p className="text-xs text-muted-foreground">
              +8% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Events</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">
              2 resolved, 1 pending
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Admin Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common administrative tasks and system management
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <a
            href="/dashboard/admin/logs"
            className="flex items-center gap-2 p-4 rounded-lg border hover:bg-accent transition-colors"
          >
            <Shield className="h-5 w-5 text-primary" />
            <div>
              <div className="font-medium">System Logs</div>
              <div className="text-sm text-muted-foreground">View and search logs</div>
            </div>
          </a>
          
          <a
            href="/dashboard/test-logs"
            className="flex items-center gap-2 p-4 rounded-lg border hover:bg-accent transition-colors"
          >
            <Package className="h-5 w-5 text-primary" />
            <div>
              <div className="font-medium">Test Logging</div>
              <div className="text-sm text-muted-foreground">Generate test logs</div>
            </div>
          </a>
          
          <a
            href="/dashboard/admin/users"
            className="flex items-center gap-2 p-4 rounded-lg border hover:bg-accent transition-colors"
          >
            <Users className="h-5 w-5 text-primary" />
            <div>
              <div className="font-medium">User Management</div>
              <div className="text-sm text-muted-foreground">Manage user accounts</div>
            </div>
          </a>
        </CardContent>
      </Card>
    </div>
  );
}