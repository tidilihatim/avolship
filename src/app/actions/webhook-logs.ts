"use server"

import { connectToDatabase } from '@/lib/db/mongoose';
import WebhookLog, { IWebhookLog, WebhookStatus } from '@/lib/db/models/webhook-log';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/config/auth';

export interface WebhookLogsFilters {
  status?: WebhookStatus;
  platform?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface WebhookLogsResponse {
  success: boolean;
  data?: {
    logs: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
    stats: {
      totalLogs: number;
      successRate: number;
      avgProcessingTime: number;
      statusCounts: Record<string, number>;
    };
  };
  error?: string;
}

export async function getWebhookLogs(
  integrationId: string,
  page: number = 1,
  limit: number = 20,
  filters: WebhookLogsFilters = {}
): Promise<WebhookLogsResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return {
        success: false,
        error: 'Unauthorized'
      };
    }

    await connectToDatabase();

    // Build the query
    const query: any = {
      integrationId
    };

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.platform) {
      query.platform = filters.platform;
    }

    if (filters.dateFrom || filters.dateTo) {
      query.startedAt = {};
      if (filters.dateFrom) {
        query.startedAt.$gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        query.startedAt.$lte = new Date(filters.dateTo);
      }
    }

    if (filters.search) {
      query.$or = [
        { webhookId: { $regex: filters.search, $options: 'i' } },
        { 'orderData.externalOrderId': { $regex: filters.search, $options: 'i' } },
        { 'orderData.customerName': { $regex: filters.search, $options: 'i' } },
        { errorMessage: { $regex: filters.search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;
    const total = await WebhookLog.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    // Fetch logs
    const logs = await WebhookLog.find(query)
      .sort({ startedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get stats - exclude INTEGRATION_PAUSED from success rate calculation
    const [statsResult] = await WebhookLog.aggregate([
      { $match: { integrationId } },
      {
        $group: {
          _id: null,
          totalLogs: { $sum: 1 },
          // For success rate calculation, exclude INTEGRATION_PAUSED webhooks
          totalLogsForSuccessRate: {
            $sum: { $cond: [{ $ne: ['$status', 'integration_paused'] }, 1, 0] }
          },
          successCount: {
            $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] }
          },
          avgProcessingTime: { $avg: '$processingTime' },
          statusCounts: {
            $push: '$status'
          }
        }
      },
      {
        $addFields: {
          successRate: {
            $cond: [
              { $gt: ['$totalLogsForSuccessRate', 0] },
              {
                $multiply: [
                  { $divide: ['$successCount', '$totalLogsForSuccessRate'] },
                  100
                ]
              },
              0
            ]
          }
        }
      }
    ]);

    // Count status occurrences
    const statusCounts: Record<string, number> = {};
    if (statsResult?.statusCounts) {
      statsResult.statusCounts.forEach((status: string) => {
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });
    }

    const stats = {
      totalLogs: statsResult?.totalLogs || 0,
      successRate: Math.round(statsResult?.successRate || 0),
      avgProcessingTime: Math.round(statsResult?.avgProcessingTime || 0),
      statusCounts
    };

    return {
      success: true,
      data: {
        logs: JSON.parse(JSON.stringify(logs)),
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        },
        stats
      }
    };
  } catch (error) {
    console.error('Error fetching webhook logs:', error);
    return {
      success: false,
      error: 'Failed to fetch webhook logs'
    };
  }
}

export async function getWebhookLogDetail(logId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return {
        success: false,
        error: 'Unauthorized'
      };
    }

    await connectToDatabase();

    const log = await WebhookLog.findOne({
      _id: logId
    }).lean();

    if (!log) {
      return {
        success: false,
        error: 'Log not found'
      };
    }

    return {
      success: true,
      data: JSON.parse(JSON.stringify(log))
    };
  } catch (error) {
    console.error('Error fetching webhook log detail:', error);
    return {
      success: false,
      error: 'Failed to fetch log detail'
    };
  }
}