"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertCircle,
  AlertTriangle,
  Info,
  Bug,
  Search,
  Filter,
  RefreshCw,
  CheckCircle,
  XCircle,
  Activity,
  TrendingUp,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface SystemLog {
  _id: string;
  timestamp: string;
  level: string;
  category: string;
  message: string;
  userId?: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  userRole?: string;
  action?: string;
  resourceType?: string;
  resourceId?: string;
  url?: string;
  method?: string;
  statusCode?: number;
  duration?: number;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  metadata?: any;
  resolved: boolean;
  resolvedAt?: string;
  resolvedBy?: {
    name: string;
    email: string;
  };
  resolutionNotes?: string;
}

const LogLevelIcon = {
  error: AlertCircle,
  warn: AlertTriangle,
  info: Info,
  debug: Bug,
};

const LogLevelColor = {
  error: "destructive",
  warn: "warning",
  info: "default",
  debug: "secondary",
} as const;

export default function SystemLogsPage() {
  const t = useTranslations();
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    level: "all",
    category: "all",
    search: "",
    resolved: "all",
    startDate: "",
    endDate: "",
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });
  const [stats, setStats] = useState<any>({
    errors: [],
    performance: [],
  });
  const [selectedLog, setSelectedLog] = useState<SystemLog | null>(null);
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(false);

  const fetchLogs = useCallback(async () => {
    try {
      const queryParams = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...Object.entries(filters).reduce((acc, [key, value]) => {
          if (value && value !== "all") acc[key] = value;
          return acc;
        }, {} as any),
      });

      const response = await fetch(`/api/admin/logs?${queryParams}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
        if (response.status === 401) {
          toast.error("Unauthorized: You need admin access to view logs");
        } else {
          toast.error(errorData.error || "Failed to fetch logs");
        }
        return;
      }

      const data = await response.json();

      if (data.success) {
        setLogs(data.logs || []);
        setPagination(data.pagination || { page: 1, limit: 50, total: 0, totalPages: 0 });
        setStats(data.stats || { errors: [], performance: [] });
      } else {
        toast.error(data.error || "Failed to fetch logs");
      }
    } catch (error) {
      console.error("Error fetching logs:", error);
      toast.error("Failed to fetch logs");
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchLogs, 10000); // Refresh every 10 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh, fetchLogs]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleResolveLog = async () => {
    if (!selectedLog) return;

    try {
      const response = await fetch(`/api/admin/logs/${selectedLog._id}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: resolutionNotes }),
      });

      if (response.ok) {
        toast.success("Log marked as resolved");
        setResolveDialogOpen(false);
        setSelectedLog(null);
        setResolutionNotes("");
        fetchLogs();
      } else {
        toast.error("Failed to resolve log");
      }
    } catch (error) {
      console.error("Error resolving log:", error);
      toast.error("Failed to resolve log");
    }
  };

  const getLogLevelIcon = (level: string) => {
    const Icon = LogLevelIcon[level as keyof typeof LogLevelIcon] || Info;
    return <Icon className="h-4 w-4" />;
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return "-";
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Logs</h1>
          <p className="text-muted-foreground">
            Monitor errors, performance issues, and critical operations
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? "animate-spin" : ""}`} />
            Auto Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={fetchLogs}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Errors (7d)</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.errors.reduce((sum: number, item: any) => sum + item.count, 0)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unresolved Errors</CardTitle>
            <XCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {logs.filter(log => log.level === 'error' && !log.resolved).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {logs.length > 0
                ? formatDuration(
                    logs.reduce((sum, log) => sum + (log.duration || 0), 0) / logs.length
                  )
                : "-"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Performance Issues</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.performance.reduce((sum: number, item: any) => sum + item.count, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="logs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="logs">Logs</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="logs" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-6">
                <div>
                  <Label htmlFor="level">Level</Label>
                  <Select
                    value={filters.level}
                    onValueChange={(value) => handleFilterChange("level", value)}
                  >
                    <SelectTrigger id="level">
                      <SelectValue placeholder="All levels" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All levels</SelectItem>
                      <SelectItem value="error">Error</SelectItem>
                      <SelectItem value="warn">Warning</SelectItem>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="debug">Debug</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={filters.category}
                    onValueChange={(value) => handleFilterChange("category", value)}
                  >
                    <SelectTrigger id="category">
                      <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All categories</SelectItem>
                      <SelectItem value="api_error">API Error</SelectItem>
                      <SelectItem value="auth_error">Auth Error</SelectItem>
                      <SelectItem value="database_error">Database Error</SelectItem>
                      <SelectItem value="payment_error">Payment Error</SelectItem>
                      <SelectItem value="critical_operation">Critical Operation</SelectItem>
                      <SelectItem value="security_event">Security Event</SelectItem>
                      <SelectItem value="performance_issue">Performance Issue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="resolved">Status</Label>
                  <Select
                    value={filters.resolved}
                    onValueChange={(value) => handleFilterChange("resolved", value)}
                  >
                    <SelectTrigger id="resolved">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="false">Unresolved</SelectItem>
                      <SelectItem value="true">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="search">Search</Label>
                  <Input
                    id="search"
                    placeholder="Search logs..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange("search", e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="datetime-local"
                    value={filters.startDate}
                    onChange={(e) => handleFilterChange("startDate", e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="datetime-local"
                    value={filters.endDate}
                    onChange={(e) => handleFilterChange("endDate", e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Logs Table */}
          <Card>
            <CardHeader>
              <CardTitle>Log Entries</CardTitle>
              <CardDescription>
                Showing {logs.length} of {pagination.total} logs
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <div className="relative overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>Level</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Message</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logs.map((log) => (
                        <TableRow key={log._id}>
                          <TableCell className="text-xs">
                            {format(new Date(log.timestamp), "MMM dd HH:mm:ss")}
                          </TableCell>
                          <TableCell>
                            <Badge variant={LogLevelColor[log.level as keyof typeof LogLevelColor]}>
                              <span className="flex items-center gap-1">
                                {getLogLevelIcon(log.level)}
                                {log.level}
                              </span>
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs">{log.category}</TableCell>
                          <TableCell className="max-w-xs truncate">
                            {log.message}
                          </TableCell>
                          <TableCell className="text-xs">
                            {log.userId ? (
                              <div>
                                <div>{log.userId.name}</div>
                                <div className="text-muted-foreground">{log.userRole}</div>
                              </div>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell className="text-xs">
                            {formatDuration(log.duration)}
                          </TableCell>
                          <TableCell>
                            {log.resolved ? (
                              <Badge variant="success">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Resolved
                              </Badge>
                            ) : log.level === "error" ? (
                              <Badge variant="destructive">
                                <XCircle className="h-3 w-3 mr-1" />
                                Unresolved
                              </Badge>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedLog(log)}
                            >
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Page {pagination.page} of {pagination.totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page <= 1}
                      onClick={() =>
                        setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
                      }
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page >= pagination.totalPages}
                      onClick={() =>
                        setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
                      }
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          {/* Error Trends Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Error Trends (Last 7 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={stats.errors}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="_id.date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#ef4444"
                    name="Errors"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Performance Issues Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Issues by Operation</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.performance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="_id.action" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="avgDuration" fill="#f59e0b" name="Avg Duration (ms)" />
                  <Bar dataKey="count" fill="#3b82f6" name="Count" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Log Details Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Log Details</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Timestamp</Label>
                  <div className="text-sm">
                    {format(new Date(selectedLog.timestamp), "PPpp")}
                  </div>
                </div>
                <div>
                  <Label>Level</Label>
                  <Badge variant={LogLevelColor[selectedLog.level as keyof typeof LogLevelColor]}>
                    {selectedLog.level}
                  </Badge>
                </div>
                <div>
                  <Label>Category</Label>
                  <div className="text-sm">{selectedLog.category}</div>
                </div>
                <div>
                  <Label>Duration</Label>
                  <div className="text-sm">{formatDuration(selectedLog.duration)}</div>
                </div>
              </div>

              <div>
                <Label>Message</Label>
                <div className="text-sm bg-muted p-2 rounded">{selectedLog.message}</div>
              </div>

              {selectedLog.error && (
                <div>
                  <Label>Error Details</Label>
                  <div className="text-sm bg-destructive/10 p-2 rounded space-y-2">
                    <div>
                      <strong>Name:</strong> {selectedLog.error.name}
                    </div>
                    <div>
                      <strong>Message:</strong> {selectedLog.error.message}
                    </div>
                    {selectedLog.error.stack && (
                      <details>
                        <summary className="cursor-pointer">Stack Trace</summary>
                        <pre className="text-xs overflow-x-auto mt-2">
                          {selectedLog.error.stack}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              )}

              {selectedLog.userId && (
                <div>
                  <Label>User</Label>
                  <div className="text-sm">
                    {selectedLog.userId.name} ({selectedLog.userId.email}) - {selectedLog.userRole}
                  </div>
                </div>
              )}

              {selectedLog.url && (
                <div>
                  <Label>Request</Label>
                  <div className="text-sm">
                    {selectedLog.method} {selectedLog.url}
                    {selectedLog.statusCode && ` - ${selectedLog.statusCode}`}
                  </div>
                </div>
              )}

              {selectedLog.metadata && (
                <div>
                  <Label>Metadata</Label>
                  <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.resolved && selectedLog.resolvedBy && (
                <div className="border-t pt-4">
                  <Label>Resolution</Label>
                  <div className="text-sm space-y-2">
                    <div>
                      Resolved by {selectedLog.resolvedBy.name} on{" "}
                      {selectedLog.resolvedAt && format(new Date(selectedLog.resolvedAt), "PPp")}
                    </div>
                    {selectedLog.resolutionNotes && (
                      <div className="bg-muted p-2 rounded">{selectedLog.resolutionNotes}</div>
                    )}
                  </div>
                </div>
              )}

              {!selectedLog.resolved && selectedLog.level === "error" && (
                <div className="border-t pt-4">
                  <Button
                    onClick={() => {
                      setResolveDialogOpen(true);
                    }}
                  >
                    Mark as Resolved
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Resolve Dialog */}
      <Dialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Log</DialogTitle>
            <DialogDescription>
              Add notes about how this issue was resolved
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="notes">Resolution Notes</Label>
              <Textarea
                id="notes"
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="Describe how this issue was resolved..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResolveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleResolveLog}>Mark as Resolved</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}