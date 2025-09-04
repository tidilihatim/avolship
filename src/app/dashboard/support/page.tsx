import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { getAllTickets } from "@/app/actions/ticket-actions";
import { TicketList } from "@/components/support/ticket-list";
import { TicketStats } from "@/components/support/ticket-stats";
import { authOptions } from "@/config/auth";
import { getLoginUserRole } from "@/app/actions/auth";
import { UserRole } from "../_constant/user";
import { 
  getSupportDashboardStats,
  getTicketStatusChart,
  getTicketPriorityChart,
  getTicketCategoryChart,
  getVolumeChart,
  getAgentPerformanceChart
} from '@/app/actions/support-dashboard';
import { StatsCards } from '@/components/support/dashboard/stats-cards';
import { TicketStatusChart } from '@/components/support/dashboard/charts/ticket-status-chart';
import { PriorityDistributionChart } from '@/components/support/dashboard/charts/priority-distribution-chart';
import { CategoryBreakdownChart } from '@/components/support/dashboard/charts/category-breakdown-chart';
import { VolumeTrendsChart } from '@/components/support/dashboard/charts/volume-trends-chart';
import { AgentPerformanceChart } from '@/components/support/dashboard/charts/agent-performance-chart';
import { SupportDashboardClient } from '@/components/support/dashboard/support-dashboard-client';

interface SupportDashboardProps {
  searchParams: Promise<{ 
    filter?: string;
    start?: string;
    end?: string;
  }>;
}

export default async function SupportDashboard({ searchParams }: SupportDashboardProps) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect("/auth/login");
  }

  const role = await getLoginUserRole()

  if (role!==UserRole.SUPPORT) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const { filter = 'this_month', start, end } = params;

  const [
    tickets,
    statsResult,
    statusChartResult,
    priorityChartResult,
    categoryChartResult,
    volumeChartResult,
    agentPerformanceResult
  ] = await Promise.all([
    getAllTickets(),
    getSupportDashboardStats(start, end),
    getTicketStatusChart(),
    getTicketPriorityChart(),
    getTicketCategoryChart(),
    getVolumeChart(start, end),
    getAgentPerformanceChart()
  ]);

  if (!statsResult.success || !statsResult.data) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Support Dashboard</h1>
            <p className="text-muted-foreground">
              Manage and respond to customer support tickets
            </p>
          </div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">
            {statsResult.message || 'Unable to load dashboard data'}
          </p>
        </div>
      </div>
    );
  }

  const stats = statsResult.data;
  const statusData = statusChartResult.success ? statusChartResult.data || [] : [];
  const priorityData = priorityChartResult.success ? priorityChartResult.data || [] : [];
  const categoryData = categoryChartResult.success ? categoryChartResult.data || [] : [];
  const volumeData = volumeChartResult.success ? volumeChartResult.data || [] : [];
  const agentData = agentPerformanceResult.success ? agentPerformanceResult.data || [] : [];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Support Dashboard</h1>
          <p className="text-muted-foreground">
            Manage tickets and track support performance metrics
          </p>
        </div>
      </div>

      <SupportDashboardClient>
        <StatsCards stats={stats} />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <TicketStatusChart data={statusData} />
          <PriorityDistributionChart data={priorityData} />
          <CategoryBreakdownChart data={categoryData} />
          <AgentPerformanceChart data={agentData} />
        </div>
        
        <div className="mt-6">
          <VolumeTrendsChart data={volumeData} />
        </div>

        <div className="mt-6">
          <TicketStats tickets={tickets} />
          <TicketList tickets={tickets} />
        </div>
      </SupportDashboardClient>
    </div>
  );
}