'use server';

import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/config/auth';
import { connectToDatabase } from '@/lib/db/mongoose';
import mongoose from 'mongoose';
import User, { UserRole, UserStatus } from '@/lib/db/models/user';
import TokenPackage, { TokenPackageStatus } from '@/lib/db/models/token-package';
import UserToken, { TokenTransaction, TokenTransactionType, TokenTransactionStatus } from '@/lib/db/models/user-token';
import ProfileBoost, { ProfileBoostStatus } from '@/lib/db/models/profile-boost';
import { stripe } from '@/lib/stripe';

interface CreateBoostCampaignData {
  tokensPerClick: number;
  totalTokensBudget: number;
  isAutoRenew: boolean;
  targetAudience?: {
    countries?: string[];
    serviceTypes?: string[];
  };
}

/**
 * Admin: Create token package
 */
export async function createTokenPackage(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== UserRole.ADMIN) {
    throw new Error('Unauthorized');
  }

  await connectToDatabase();

  const name = formData.get('name') as string;
  const description = formData.get('description') as string;
  const tokenCount = parseInt(formData.get('tokenCount') as string);
  const priceUsd = parseFloat(formData.get('priceUsd') as string);
  const status = formData.get('status') as string;
  const sortOrder = parseInt(formData.get('sortOrder') as string) || 0;

  if (!name || tokenCount < 1 || priceUsd < 0) {
    throw new Error('Invalid input data');
  }

  // Create Stripe price
  const stripePrice = await stripe.prices.create({
    currency: 'usd',
    unit_amount: Math.round(priceUsd * 100),
    product_data: {
      name: name,
      metadata: {
        tokenCount: tokenCount.toString(),
        description: description || `${tokenCount} tokens for profile boosting`,
      },
    },
  });

  const tokenPackage = new TokenPackage({
    name,
    description,
    tokenCount,
    priceUsd,
    status: status || 'active',
    sortOrder,
    stripePriceId: stripePrice.id,
  });

  await tokenPackage.save();
  revalidatePath('/dashboard/admin/tokens');
  
  return { success: true, id: tokenPackage._id };
}

/**
 * Admin: Update token package
 */
export async function updateTokenPackage(packageId: string, formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== UserRole.ADMIN) {
    throw new Error('Unauthorized');
  }

  await connectToDatabase();

  const name = formData.get('name') as string;
  const description = formData.get('description') as string;
  const tokenCount = parseInt(formData.get('tokenCount') as string);
  const priceUsd = parseFloat(formData.get('priceUsd') as string);
  const status = formData.get('status') as string;
  const sortOrder = parseInt(formData.get('sortOrder') as string) || 0;

  if (!name || tokenCount < 1 || priceUsd < 0) {
    throw new Error('Invalid input data');
  }

  const tokenPackage = await TokenPackage.findById(packageId);
  if (!tokenPackage) {
    throw new Error('Token package not found');
  }

  // Update Stripe price if price changed
  let stripePriceId = tokenPackage.stripePriceId;
  if (tokenPackage.priceUsd !== priceUsd) {
    const stripePrice = await stripe.prices.create({
      currency: 'usd',
      unit_amount: Math.round(priceUsd * 100),
      product_data: {
        name: name,
        metadata: {
          tokenCount: tokenCount.toString(),
          description: description || `${tokenCount} tokens for profile boosting`,
        },
      },
    });
    stripePriceId = stripePrice.id;
  }

  tokenPackage.name = name;
  tokenPackage.description = description;
  tokenPackage.tokenCount = tokenCount;
  tokenPackage.priceUsd = priceUsd;
  tokenPackage.status = status as TokenPackageStatus;
  tokenPackage.sortOrder = sortOrder;
  tokenPackage.stripePriceId = stripePriceId;

  await tokenPackage.save();

  revalidatePath('/dashboard/admin/tokens');
  return { success: true };
}

/**
 * Admin: Delete token package
 */
export async function deleteTokenPackage(packageId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== UserRole.ADMIN) {
    throw new Error('Unauthorized');
  }

  await connectToDatabase();

  const tokenPackage = await TokenPackage.findById(packageId);
  if (!tokenPackage) {
    throw new Error('Token package not found');
  }

  // Archive instead of delete to maintain data integrity
  tokenPackage.status = TokenPackageStatus.ARCHIVED;
  await tokenPackage.save();

  revalidatePath('/dashboard/admin/tokens');
  return { success: true };
}

/**
 * Provider: Purchase tokens (DEPRECATED - Use Stripe Elements flow instead)
 * This function is disabled to prevent duplicate transactions
 */
export async function purchaseTokens() {
  throw new Error('This function is deprecated. Use the new Stripe Elements checkout flow instead.');
}

/**
 * Provider: Create boost campaign
 */
export async function createBoostCampaign(data: CreateBoostCampaignData) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== UserRole.PROVIDER) {
    throw new Error('Unauthorized');
  }

  await connectToDatabase();

  if (!data.tokensPerClick || data.tokensPerClick < 1 || data.tokensPerClick > 100) {
    throw new Error('Tokens per click must be between 1 and 100');
  }

  if (!data.totalTokensBudget || data.totalTokensBudget < 1) {
    throw new Error('Total tokens budget must be at least 1');
  }

  const user = await User.findById(session.user.id);
  if (!user) {
    throw new Error('User not found');
  }

  // Get user token balance
  const userToken = await UserToken.findOne({ userId: user._id });
  if (!userToken || userToken.currentBalance < data.totalTokensBudget) {
    throw new Error('Insufficient token balance');
  }

  // Check active campaigns limit
  const activeCampaigns = await ProfileBoost.countDocuments({
    userId: user._id,
    status: ProfileBoostStatus.ACTIVE,
  });

  if (activeCampaigns >= 3) { // MAX_ACTIVE_CAMPAIGNS_PER_USER
    throw new Error('Maximum active campaigns reached');
  }

  // NOTE: Tokens are NOT deducted upfront - they're only deducted when clicks happen
  // This just reserves the budget but doesn't spend tokens yet

  // Create boost campaign
  const boostCampaign = new ProfileBoost({
    userId: user._id,
    tokensPerClick: data.tokensPerClick,
    totalTokensBudget: data.totalTokensBudget,
    isAutoRenew: data.isAutoRenew || false,
    targetAudience: data.targetAudience,
  });

  await boostCampaign.save();
  revalidatePath('/dashboard/provider');
  
  return { success: true, campaignId: boostCampaign._id };
}

/**
 * Provider: Pause/Resume boost campaign
 */
export async function toggleBoostCampaign(campaignId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== UserRole.PROVIDER) {
    throw new Error('Unauthorized');
  }

  await connectToDatabase();

  const campaign = await ProfileBoost.findOne({
    _id: campaignId,
    userId: session.user.id,
  });

  if (!campaign) {
    throw new Error('Campaign not found');
  }

  if (campaign.status === ProfileBoostStatus.ACTIVE) {
    await campaign.pauseBoost();
  } else if (campaign.status === ProfileBoostStatus.PAUSED) {
    await campaign.resumeBoost();
  }

  revalidatePath('/dashboard/provider');
  return { success: true, status: campaign.status };
}

/**
 * Provider: Cancel boost campaign and refund remaining tokens
 */
export async function cancelBoostCampaign(campaignId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== UserRole.PROVIDER) {
    throw new Error('Unauthorized');
  }

  await connectToDatabase();

  const campaign = await ProfileBoost.findOne({
    _id: campaignId,
    userId: session.user.id,
  });

  if (!campaign) {
    throw new Error('Campaign not found');
  }

  if (campaign.status === ProfileBoostStatus.COMPLETED || campaign.status === ProfileBoostStatus.CANCELLED) {
    throw new Error('Campaign cannot be cancelled');
  }

  const remainingTokens = campaign.getRemainingBudget();
  
  if (remainingTokens > 0) {
    // Refund remaining tokens
    const userToken = await UserToken.findOne({ userId: campaign.userId });
    if (userToken) {
      await userToken.addTokens(remainingTokens, {
        type: TokenTransactionType.REFUND,
        description: `Refund from cancelled campaign - ${remainingTokens} tokens`,
        metadata: {
          profileBoostId: campaign._id,
        },
      });
    }
  }

  campaign.status = ProfileBoostStatus.CANCELLED;
  campaign.endDate = new Date();
  await campaign.save();

  revalidatePath('/dashboard/provider');
  return { success: true, refundedTokens: remainingTokens };
}

/**
 * Get available token packages
 */
export async function getTokenPackages() {
  await connectToDatabase();
  
  const packages = await TokenPackage.find({
    status: TokenPackageStatus.ACTIVE,
  }).sort({ sortOrder: 1 }).lean();

  return packages.map((pkg: any) => ({
    _id: pkg._id.toString(),
    name: pkg.name,
    description: pkg.description,
    tokenCount: pkg.tokenCount,
    priceUsd: pkg.priceUsd,
    stripePriceId: pkg.stripePriceId,
    status: pkg.status,
    sortOrder: pkg.sortOrder,
    createdAt: pkg.createdAt.toISOString(),
    updatedAt: pkg.updatedAt.toISOString(),
  }));
}

/**
 * Get user token balance and recent transactions
 */
export async function getUserTokenData() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  await connectToDatabase();

  const userToken = await UserToken.findOne({ userId: session.user.id });
  if (!userToken) {
    return {
      balance: 0,
      totalPurchased: 0,
      totalSpent: 0,
      transactions: [],
    };
  }

  const transactions = await userToken.getTransactionHistory(10);
  
  return {
    balance: userToken.currentBalance,
    totalPurchased: userToken.totalPurchased,
    totalSpent: userToken.totalSpent,
    transactions: transactions.map((t: any) => ({
      id: t._id.toString(),
      type: t.type,
      status: t.status,
      amount: t.amount,
      description: t.description,
      createdAt: t.createdAt.toISOString(),
    })),
  };
}

/**
 * Get user's active boost campaigns
 */
export async function getUserBoostCampaigns() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  await connectToDatabase();

  const campaigns = await ProfileBoost.find({
    userId: session.user.id,
  }).sort({ createdAt: -1 }).lean();

  return campaigns.map((campaign: any) => ({
    id: campaign._id.toString(),
    tokensPerClick: campaign.tokensPerClick,
    totalTokensBudget: campaign.totalTokensBudget,
    tokensSpent: campaign.tokensSpent,
    clicksReceived: campaign.clicksReceived,
    impressions: campaign.impressions,
    status: campaign.status,
    startDate: campaign.startDate.toISOString(),
    endDate: campaign.endDate ? campaign.endDate.toISOString() : null,
    clickThroughRate: campaign.impressions > 0 ? (campaign.clicksReceived / campaign.impressions * 100) : 0,
    remainingBudget: Math.max(0, campaign.totalTokensBudget - campaign.tokensSpent),
  }));
}

/**
 * Get boosted providers with proper ranking and impression tracking
 */
export async function getBoostedProviders(page: number = 1, limit: number = 12, filters?: any) {
  await connectToDatabase();

  try {
    // Get active boost campaigns with sufficient budget, sorted by priority (tokensPerClick)
    const activeCampaigns = await ProfileBoost.aggregate([
      {
        $match: {
          status: ProfileBoostStatus.ACTIVE,
          $expr: { $lt: ['$tokensSpent', '$totalTokensBudget'] } // Has remaining budget
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'userId'
        }
      },
      {
        $unwind: '$userId'
      },
      {
        $match: {
          'userId.status': UserStatus.APPROVED
        }
      },
      {
        $sort: { tokensPerClick: -1 } // Higher bid = higher priority
      }
    ]);

    // Get regular providers (non-boosted)
    const skip = (page - 1) * limit;
    const boostedUserIds = activeCampaigns.map(campaign => campaign.userId._id.toString());
    
    const userQuery: any = {
      role: UserRole.PROVIDER,
      status: UserStatus.APPROVED,
      _id: { $nin: boostedUserIds }, // Exclude boosted providers
    };

    if (filters?.search) {
      userQuery.$or = [
        { name: { $regex: filters.search, $options: 'i' } },
        { businessName: { $regex: filters.search, $options: 'i' } },
        { serviceType: { $regex: filters.search, $options: 'i' } },
      ];
    }

    const regularProviders = await User.find(userQuery)
      .skip(skip)
      .limit(Math.max(0, limit - activeCampaigns.length))
      .lean();

    // Record impressions for boosted campaigns
    const impressionUpdates = activeCampaigns.map(campaign => 
      ProfileBoost.findByIdAndUpdate(
        campaign._id,
        { $inc: { impressions: 1 } },
        { new: true }
      )
    );
    
    await Promise.all(impressionUpdates);

    // Combine boosted and regular providers
    const boostedProviders = activeCampaigns.map((campaign: any) => ({
      ...campaign.userId,
      _id: campaign.userId._id.toString(),
      name: campaign.userId.name,
      email: campaign.userId.email,
      businessName: campaign.userId.businessName,
      serviceType: campaign.userId.serviceType,
      country: campaign.userId.country,
      status: campaign.userId.status,
      createdAt: campaign.userId.createdAt?.toISOString(),
      updatedAt: campaign.userId.updatedAt?.toISOString(),
      isBoosted: true,
      boostCampaign: {
        id: campaign._id.toString(),
        tokensPerClick: campaign.tokensPerClick,
        priority: campaign.tokensPerClick * 100,
      },
    }));

    const regularProvidersFormatted = regularProviders.map((provider: any) => ({
      _id: provider._id.toString(),
      name: provider.name,
      email: provider.email,
      businessName: provider.businessName,
      serviceType: provider.serviceType,
      country: provider.country,
      status: provider.status,
      createdAt: provider.createdAt.toISOString(),
      updatedAt: provider.updatedAt.toISOString(),
      isBoosted: false,
    }));

    // Combine: boosted first, then regular
    const allProviders = [...boostedProviders, ...regularProvidersFormatted];

    // Get total count
    const totalRegular = await User.countDocuments(userQuery);
    const total = activeCampaigns.length + totalRegular;

    return {
      users: allProviders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      success: true,
      message: 'Providers loaded successfully',
    };

  } catch (error) {
    console.error('Error getting boosted providers:', error);
    return {
      users: [],
      pagination: { page, limit, total: 0, totalPages: 0 },
      success: false,
      message: 'Failed to load providers',
    };
  }
}

/**
 * Track provider click and deduct tokens
 */
export async function trackProviderClick(providerId: string) {
  await connectToDatabase();

  try {
    // Find active boost campaign for this provider
    const campaigns = await ProfileBoost.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(providerId),
          status: ProfileBoostStatus.ACTIVE,
          $expr: { $lt: ['$tokensSpent', '$totalTokensBudget'] }
        }
      },
      {
        $limit: 1
      }
    ]);
    
    const campaign = campaigns[0] ? await ProfileBoost.findById(campaigns[0]._id) : null;

    if (!campaign) {
      return { success: true, message: 'No active campaign' };
    }

    // Check if campaign has sufficient budget
    const remainingBudget = campaign.totalTokensBudget - campaign.tokensSpent;
    if (remainingBudget < campaign.tokensPerClick) {
      // Auto-pause campaign if insufficient budget
      campaign.status = ProfileBoostStatus.COMPLETED;
      campaign.endDate = new Date();
      await campaign.save();
      return { success: true, message: 'Campaign completed - insufficient budget' };
    }

    // Get user's token balance and deduct tokens
    const userToken = await UserToken.findOne({ userId: campaign.userId });
    if (!userToken) {
      return { success: false, message: 'User token record not found' };
    }

    // Check if user has sufficient tokens
    if (userToken.currentBalance < campaign.tokensPerClick) {
      // Auto-pause campaign if user has insufficient tokens
      campaign.status = ProfileBoostStatus.COMPLETED;
      campaign.endDate = new Date();
      await campaign.save();
      return { success: true, message: 'Campaign completed - insufficient user balance' };
    }

    // Use a transaction to ensure atomicity
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Deduct tokens from user's actual balance
      await userToken.spendTokens(campaign.tokensPerClick, {
        type: TokenTransactionType.SPEND,
        description: `Profile boost click - ${campaign.tokensPerClick} tokens`,
        metadata: {
          profileBoostId: campaign._id,
        },
      });

      // Update campaign metrics
      campaign.tokensSpent += campaign.tokensPerClick;
      campaign.clicksReceived += 1;
      campaign.lastClickAt = new Date();

      // Auto-complete campaign if budget exhausted
      if (campaign.tokensSpent >= campaign.totalTokensBudget) {
        campaign.status = ProfileBoostStatus.COMPLETED;
        campaign.endDate = new Date();
      }

      await campaign.save({ session });
      await session.commitTransaction();
      
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }

    console.log(`Click tracked: Provider ${providerId}, Campaign ${campaign._id}, Tokens deducted: ${campaign.tokensPerClick}`);

    return {
      success: true,
      message: 'Click tracked successfully',
      data: {
        tokensDeducted: campaign.tokensPerClick,
        remainingBudget: campaign.totalTokensBudget - campaign.tokensSpent,
        campaignStatus: campaign.status,
      },
    };

  } catch (error) {
    console.error('Error tracking provider click:', error);
    return {
      success: false,
      message: 'Failed to track click',
    };
  }
}