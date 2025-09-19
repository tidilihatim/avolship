'use server';

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/config/auth';
import { withDbConnection } from '@/lib/db/db-connect';
import { getLoginUserRole } from '@/app/actions/auth';
import { UserRole } from '@/lib/db/models/user';
import ApiKey, { ApiKeyStatus } from '@/lib/db/models/api-key';
import mongoose from 'mongoose';

interface CreateApiKeyData {
  name: string;
}

interface UpdateApiKeyData {
  keyId: string;
  name?: string;
  status?: ApiKeyStatus;
}

/**
 * Create a new API key for seller
 */
export const createApiKey = withDbConnection(async (data: CreateApiKeyData) => {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { error: 'Unauthorized access' };
    }

    const userRole = await getLoginUserRole();
    if (userRole !== UserRole.SELLER) {
      return { error: 'Only sellers can create API keys' };
    }

    // Validate name
    if (!data.name || data.name.trim().length === 0) {
      return { error: 'API key name is required' };
    }

    if (data.name.trim().length > 100) {
      return { error: 'API key name must be less than 100 characters' };
    }

    // Check if seller already has 5 active API keys (limit)
    const existingKeysCount = await ApiKey.countDocuments({
      sellerId: new mongoose.Types.ObjectId(session.user.id),
      status: ApiKeyStatus.ACTIVE
    });

    if (existingKeysCount >= 5) {
      return { error: 'Maximum of 5 active API keys allowed. Please revoke unused keys first.' };
    }

    // Check if name already exists for this seller
    const existingKey = await ApiKey.findOne({
      sellerId: new mongoose.Types.ObjectId(session.user.id),
      name: data.name.trim(),
      status: { $ne: ApiKeyStatus.REVOKED }
    });

    if (existingKey) {
      return { error: 'API key with this name already exists' };
    }

    // Create new API key
    const result = await ApiKey.createApiKey(
      new mongoose.Types.ObjectId(session.user.id),
      data.name.trim()
    );

    return {
      success: true,
      data: {
        apiKey: JSON.parse(JSON.stringify(result.apiKey)),
        credentials: result.credentials // Only returned once during creation
      },
      message: 'API key created successfully'
    };
  } catch (error: any) {
    return { error: error.message || 'Failed to create API key' };
  }
});

/**
 * Get seller's API keys
 */
export const getSellerApiKeys = withDbConnection(async () => {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { error: 'Unauthorized access' };
    }

    const userRole = await getLoginUserRole();
    if (userRole !== UserRole.SELLER) {
      return { error: 'Access denied' };
    }

    const apiKeys = await ApiKey.find({
      sellerId: new mongoose.Types.ObjectId(session.user.id),
      status: { $ne: ApiKeyStatus.REVOKED }
    })
    .select('keyId name status lastUsed usageCount createdAt updatedAt')
    .sort({ createdAt: -1 });

    return {
      success: true,
      data: JSON.parse(JSON.stringify(apiKeys))
    };
  } catch (error: any) {
    return { error: error.message || 'Failed to fetch API keys' };
  }
});

/**
 * Update API key (name or status)
 */
export const updateApiKey = withDbConnection(async (data: UpdateApiKeyData) => {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { error: 'Unauthorized access' };
    }

    const userRole = await getLoginUserRole();
    if (userRole !== UserRole.SELLER) {
      return { error: 'Access denied' };
    }

    // Find the API key
    const apiKey = await ApiKey.findOne({
      keyId: data.keyId,
      sellerId: new mongoose.Types.ObjectId(session.user.id),
      status: { $ne: ApiKeyStatus.REVOKED }
    });

    if (!apiKey) {
      return { error: 'API key not found' };
    }

    // Update name if provided
    if (data.name !== undefined) {
      if (!data.name || data.name.trim().length === 0) {
        return { error: 'API key name is required' };
      }

      if (data.name.trim().length > 100) {
        return { error: 'API key name must be less than 100 characters' };
      }

      // Check if new name conflicts with existing keys
      const existingKey = await ApiKey.findOne({
        sellerId: new mongoose.Types.ObjectId(session.user.id),
        name: data.name.trim(),
        keyId: { $ne: data.keyId }, // Exclude current key
        status: { $ne: ApiKeyStatus.REVOKED }
      });

      if (existingKey) {
        return { error: 'API key with this name already exists' };
      }

      apiKey.name = data.name.trim();
    }

    // Update status if provided
    if (data.status !== undefined) {
      if (!Object.values(ApiKeyStatus).includes(data.status)) {
        return { error: 'Invalid status' };
      }
      apiKey.status = data.status;
    }

    await apiKey.save();

    return {
      success: true,
      data: JSON.parse(JSON.stringify(apiKey)),
      message: 'API key updated successfully'
    };
  } catch (error: any) {
    return { error: error.message || 'Failed to update API key' };
  }
});

/**
 * Revoke API key (soft delete)
 */
export const revokeApiKey = withDbConnection(async (keyId: string) => {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { error: 'Unauthorized access' };
    }

    const userRole = await getLoginUserRole();
    if (userRole !== UserRole.SELLER) {
      return { error: 'Access denied' };
    }

    // Find and revoke the API key
    const apiKey = await ApiKey.findOne({
      keyId,
      sellerId: new mongoose.Types.ObjectId(session.user.id),
      status: { $ne: ApiKeyStatus.REVOKED }
    });

    if (!apiKey) {
      return { error: 'API key not found' };
    }

    apiKey.status = ApiKeyStatus.REVOKED;
    await apiKey.save();

    return {
      success: true,
      message: 'API key revoked successfully'
    };
  } catch (error: any) {
    return { error: error.message || 'Failed to revoke API key' };
  }
});

/**
 * Get API key usage statistics
 */
export const getApiKeyStats = withDbConnection(async () => {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { error: 'Unauthorized access' };
    }

    const userRole = await getLoginUserRole();
    if (userRole !== UserRole.SELLER) {
      return { error: 'Access denied' };
    }

    const sellerId = new mongoose.Types.ObjectId(session.user.id);

    // Get aggregated stats
    const stats = await ApiKey.aggregate([
      {
        $match: {
          sellerId,
          status: { $ne: ApiKeyStatus.REVOKED }
        }
      },
      {
        $group: {
          _id: null,
          totalKeys: { $sum: 1 },
          activeKeys: {
            $sum: { $cond: [{ $eq: ['$status', ApiKeyStatus.ACTIVE] }, 1, 0] }
          },
          totalUsage: { $sum: '$usageCount' },
          lastUsed: { $max: '$lastUsed' }
        }
      }
    ]);

    const result = stats[0] || {
      totalKeys: 0,
      activeKeys: 0,
      totalUsage: 0,
      lastUsed: null
    };

    return {
      success: true,
      data: result
    };
  } catch (error: any) {
    return { error: error.message || 'Failed to fetch API key stats' };
  }
});