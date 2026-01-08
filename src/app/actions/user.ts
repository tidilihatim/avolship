'use server';

import { revalidatePath } from 'next/cache';
import mongoose from 'mongoose';

import { UserFormData, UserApiResponse, UserFilters, PaginationData } from '@/types/user';
import { withDbConnection } from '@/lib/db/db-connect';
import { sanitizeUserData, validateUserFilters, validateUserForm } from '@/lib/validations/user';
import User, { UserRole, UserStatus } from '@/lib/db/models/user';
import { sendNotification } from '@/lib/notifications/send-notification';
import { NotificationType } from '@/types/notification';
import { getCurrentUser } from './auth';

/**
 * Create a new user
 * @param formData - User form data
 * @returns API response with success/error status
 */
export const createUser = withDbConnection(async (formData: UserFormData): Promise<UserApiResponse> => {
  try {
    // Sanitize input data
    const sanitizedData = sanitizeUserData(formData);

    // Validate form data
    const validation = validateUserForm(sanitizedData, false);
    if (!validation.isValid) {
      return {
        success: false,
        message: 'Validation failed',
        errors: validation.errors
      };
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: sanitizedData.email });
    if (existingUser) {
      return {
        success: false,
        message: 'User with this email already exists',
        errors: { email: 'Email already exists' }
      };
    }

    // Create new user
    const newUser = new User({
      name: sanitizedData.name,
      email: sanitizedData.email,
      password: sanitizedData.password,
      role: sanitizedData.role,
      status: sanitizedData.status,
      phone: sanitizedData.phone,
      businessName: sanitizedData.businessName,
      businessInfo: sanitizedData.businessInfo,
      serviceType: sanitizedData.serviceType,
      country: sanitizedData.country,
      twoFactorEnabled: sanitizedData.twoFactorEnabled
    });

    await newUser.save();

    // Revalidate the users page
    revalidatePath('/admin/users');

    return {
      success: true,
      message: 'User created successfully',
      data: { userId: newUser._id }
    };
  } catch (error) {
    console.error('Error creating user:', error);
    return {
      success: false,
      message: 'Failed to create user. Please try again.'
    };
  }
});

/**
 * Get all users with pagination and filtering
 * @param page - Page number
 * @param limit - Items per page
 * @param filters - Filter options
 * @returns Users data with pagination info
 */
export const getUsers = withDbConnection(async (
  page: number = 1,
  limit: number = 10,
  filters: any = {}
): Promise<{
  users: any[];
  pagination: PaginationData;
  success: boolean;
  message: string;
}> => {
  try {
    // Get current user and check permissions
    const currentUser = await getCurrentUser();
    if (!currentUser || ![UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(currentUser.role)) {
      return {
        users: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
        success: false,
        message: 'Unauthorized - Admin or Super Admin access required'
      };
    }

    // Validate filters
    const filterValidation = validateUserFilters(filters.search, filters.role, filters.status);
    if (!filterValidation.isValid) {
      return {
        users: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
        success: false,
        message: 'Invalid filter parameters'
      };
    }

    // Build query
    const query: any = {};

    // Role-based filtering: Admin cannot see Super Admin users

    query.role = { $ne: UserRole.SUPER_ADMIN };
    // Super Admin can see all users (no additional role restriction)

    if (filters.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: 'i' } },
        { email: { $regex: filters.search, $options: 'i' } },
        { businessName: { $regex: filters.search, $options: 'i' } }
      ];
    }

    if (filters.role) {
      query.role = filters.role;
    }

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.country) {
      query.country = { $regex: filters.country, $options: 'i' };
    }

    // Calculate pagination
    const skip = (page - 1) * limit;
    const total = await User.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    // Fetch users
    const users = await User.find(query)
      .select('-password -twoFactorSecret -passwordResetToken')
      .populate({
        path: 'assignedCallCenterAgent',
        select: 'name email',
        model: 'User'
      })
      .populate({
        path: 'assignedCallCenterAgents.agentId',
        select: 'name email',
        model: 'User'
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Transform assignedCallCenterAgents to flatten the structure for frontend
    const transformedUsers = users.map((user: any) => {
      if (user.assignedCallCenterAgents && user.assignedCallCenterAgents.length > 0) {
        user.assignedCallCenterAgents = user.assignedCallCenterAgents
          .map((config: any) => {
            // Handle both populated and unpopulated cases
            if (!config.agentId) return null;

            return {
              _id: config.agentId._id?.toString() || config.agentId.toString(),
              name: config.agentId.name,
              email: config.agentId.email,
              maxPendingOrders: config.maxPendingOrders
            };
          })
          .filter(Boolean); // Remove null entries (deleted agents)
      }
      return user;
    });

    return {
      users: JSON.parse(JSON.stringify(transformedUsers)),
      pagination: { page, limit, total, totalPages },
      success: true,
      message: 'Users fetched successfully'
    };
  } catch (error) {
    console.error('Error fetching users:', error);
    return {
      users: [],
      pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
      success: false,
      message: 'Failed to fetch users'
    };
  }
});

/**
 * Get user by ID
 * @param userId - User ID
 * @returns User data or null
 */
export const getUserById = withDbConnection(async (userId: string): Promise<{ user: any | null; success: boolean; message: string }> => {
  try {
    if (!userId || userId.trim().length === 0) {
      return {
        user: null,
        success: false,
        message: 'User ID is required'
      };
    }

    const user = await User.findById(userId)
      .select('-password -twoFactorSecret -passwordResetToken')
      .lean();

    if (!user) {
      return {
        user: null,
        success: false,
        message: 'User not found'
      };
    }

    return {
      user: JSON.parse(JSON.stringify(user)),
      success: true,
      message: 'User fetched successfully'
    };
  } catch (error) {
    console.error('Error fetching user:', error);
    return {
      user: null,
      success: false,
      message: 'Failed to fetch user'
    };
  }
});

/**
 * Update user
 * @param userId - User ID
 * @param formData - Updated user data
 * @returns API response
 */
export const updateUser = withDbConnection(async (userId: string, formData: UserFormData): Promise<UserApiResponse> => {
  try {
    if (!userId || userId.trim().length === 0) {
      return {
        success: false,
        message: 'User ID is required'
      };
    }

    // Sanitize input data
    const sanitizedData = sanitizeUserData(formData);

    // Validate form data (isUpdate = true)
    const validation = validateUserForm(sanitizedData, true);
    if (!validation.isValid) {
      return {
        success: false,
        message: 'Validation failed',
        errors: validation.errors
      };
    }

    // Check if user exists
    const existingUser = await User.findById(userId);
    if (!existingUser) {
      return {
        success: false,
        message: 'User not found'
      };
    }

    // Check if email is already taken by another user
    if (sanitizedData.email !== existingUser.email) {
      const emailExists = await User.findOne({
        email: sanitizedData.email,
        _id: { $ne: userId }
      });
      if (emailExists) {
        return {
          success: false,
          message: 'Email already exists',
          errors: { email: 'Email already exists' }
        };
      }
    }

    // Update user data
    const updateData: any = {
      name: sanitizedData.name,
      email: sanitizedData.email,
      role: sanitizedData.role,
      status: sanitizedData.status,
      phone: sanitizedData.phone,
      businessName: sanitizedData.businessName,
      businessInfo: sanitizedData.businessInfo,
      serviceType: sanitizedData.serviceType,
      country: sanitizedData.country,
      twoFactorEnabled: sanitizedData.twoFactorEnabled
    };

    // Only update password if provided
    if (sanitizedData.password && sanitizedData.password.trim().length > 0) {
      updateData.password = sanitizedData.password;
    }

    await User.findByIdAndUpdate(userId, updateData);

    // Revalidate the users page
    revalidatePath('/dashboard/admin/users');
    revalidatePath(`/dashboard/admin/users/${userId}`);

    return {
      success: true,
      message: 'User updated successfully'
    };
  } catch (error) {
    console.error('Error updating user:', error);
    return {
      success: false,
      message: 'Failed to update user. Please try again.'
    };
  }
});

/**
 * Delete user
 * @param userId - User ID
 * @returns API response
 */
export const deleteUser = withDbConnection(async (userId: string): Promise<UserApiResponse> => {
  try {
    if (!userId || userId.trim().length === 0) {
      return {
        success: false,
        message: 'User ID is required'
      };
    }

    const user = await User.findById(userId);
    if (!user) {
      return {
        success: false,
        message: 'User not found'
      };
    }

    await User.findByIdAndDelete(userId);

    // Revalidate the users page
    revalidatePath('/dashboard/admin/users');

    return {
      success: true,
      message: 'User deleted successfully'
    };
  } catch (error) {
    console.error('Error deleting user:', error);
    return {
      success: false,
      message: 'Failed to delete user. Please try again.'
    };
  }
});

/**
 * Update user status
 * @param userId - User ID
 * @param status - New status
 * @returns API response
 */
export const updateUserStatus = withDbConnection(async (userId: string, status: UserStatus): Promise<UserApiResponse> => {
  try {
    if (!userId || userId.trim().length === 0) {
      return {
        success: false,
        message: 'User ID is required'
      };
    }

    if (!Object.values(UserStatus).includes(status)) {
      return {
        success: false,
        message: 'Invalid status'
      };
    }

    const user = await User.findById(userId);
    if (!user) {
      return {
        success: false,
        message: 'User not found'
      };
    }

    await User.findByIdAndUpdate(userId, { status });

    // send in app notification to user -- Email to be implemented in future
    await sendNotification({
      userId,
      title: status === UserStatus.APPROVED ? "Account Approved" : status === UserStatus.REJECTED ? "Account Rejected" : "Account Pending",
      message: status === UserStatus.APPROVED ? "Your account has been approved and is now active for business operations and shipping services Thank you for choosing AvolShip" : status === UserStatus.REJECTED ? "Your account has been rejected and cannot be used for business operations and shipping services we are sorry for the inconvenience" : "Your account is pending approval and is currently under review. We'll notify you once it's approved",
      type: status === UserStatus.APPROVED ? NotificationType.SUCCESS : status === UserStatus.REJECTED ? NotificationType.ERROR : NotificationType.WARNING,
      icon: status === UserStatus.APPROVED ? "check-circle" : status === UserStatus.REJECTED ? "x-circle" : "alert-triangle"
    })

    // Revalidate the users page
    revalidatePath('/dashboard/admin/users');
    revalidatePath(`/dashboard/admin/users/${userId}`);

    return {
      success: true,
      message: 'User status updated successfully'
    };
  } catch (error) {
    console.error('Error updating user status:', error);
    return {
      success: false,
      message: 'Failed to update user status. Please try again.'
    };
  }
});

/**
 * Bulk delete users
 * @param userIds - Array of user IDs
 * @returns API response
 */
export const bulkDeleteUsers = withDbConnection(async (userIds: string[]): Promise<UserApiResponse> => {
  try {
    if (!userIds || userIds.length === 0) {
      return {
        success: false,
        message: 'No users selected for deletion'
      };
    }

    const result = await User.deleteMany({ _id: { $in: userIds } });

    // Revalidate the users page
    revalidatePath('/dashboard/admin/users');

    return {
      success: true,
      message: `${result.deletedCount} users deleted successfully`
    };
  } catch (error) {
    console.error('Error bulk deleting users:', error);
    return {
      success: false,
      message: 'Failed to delete users. Please try again.'
    };
  }
});

/**
 * Get all call center agents for assignment dropdown
 */
export const getCallCenterAgents = withDbConnection(async () => {
  try {
    const agents = await User.find({
      role: 'call_center',
      status: { $ne: 'inactive' }
    })
      .select('name email')
      .sort({ name: 1 })
      .lean();

    return {
      success: true,
      agents: agents.map((agent: any) => ({
        _id: agent._id.toString(),
        name: agent.name,
        email: agent.email,
      }))
    };
  } catch (error) {
    console.error('Error fetching call center agents:', error);
    return {
      success: false,
      message: 'Failed to fetch call center agents',
      agents: []
    };
  }
});

/**
 * Assign a seller to call center agents (supports multiple agents with configurations)
 * @param sellerId - ID of the seller to assign
 * @param agentConfigs - Array of agent configurations with agentId and maxPendingOrders
 * @returns API response
 */
export const assignSellerToAgent = withDbConnection(async (
  sellerId: string,
  agentConfigs: Array<{ agentId: string; maxPendingOrders?: number }>
): Promise<UserApiResponse> => {
  try {
    // Validate seller exists and is a seller
    const seller = await User.findById(sellerId);
    if (!seller) {
      return {
        success: false,
        message: 'Seller not found'
      };
    }

    if (seller.role !== 'seller') {
      return {
        success: false,
        message: 'User is not a seller'
      };
    }

    // If agentConfigs are provided, validate all agents exist and are call center agents
    if (agentConfigs && agentConfigs.length > 0) {
      const agentIds = agentConfigs.map(config => config.agentId);
      const agents = await User.find({
        _id: { $in: agentIds },
        role: 'call_center',
        status: UserStatus.APPROVED
      });

      if (agents.length !== agentIds.length) {
        return {
          success: false,
          message: 'One or more call center agents not found or not approved'
        };
      }

      // Validate maxPendingOrders values
      for (const config of agentConfigs) {
        if (config.maxPendingOrders !== undefined && config.maxPendingOrders < 1) {
          return {
            success: false,
            message: 'Max pending orders must be at least 1'
          };
        }
      }
    }

    // Get current agents for comparison (to find newly added agents)
    const previousAgentIds = (seller.assignedCallCenterAgents || []).map((agent: any) =>
      agent.agentId?.toString() || agent.toString()
    );
    const newAgentIds = agentConfigs
      .map(config => config.agentId)
      .filter(id => !previousAgentIds.includes(id));

    // Update seller's assignedCallCenterAgents field (array of objects)
    seller.assignedCallCenterAgents = agentConfigs.map(config => ({
      agentId: new mongoose.Types.ObjectId(config.agentId),
      maxPendingOrders: config.maxPendingOrders || 10 // Default to 10
    }));

    // Also update old field for backward compatibility (use first agent)
    seller.assignedCallCenterAgent = agentConfigs.length > 0
      ? new mongoose.Types.ObjectId(agentConfigs[0].agentId)
      : undefined;

    await seller.save();

    // Send notification to the seller about assignment change
    if (agentConfigs.length > 0) {
      await sendNotification({
        userId: sellerId,
        type: NotificationType.SYSTEM,
        title: 'Call Center Agents Assigned',
        message: `You have been assigned ${agentConfigs.length} call center agent(s). They will handle your orders.`,
        actionLink: '/dashboard/seller/orders',
      });

      // Send notification to newly assigned agents
      for (const agentId of newAgentIds) {
        await sendNotification({
          userId: agentId,
          type: NotificationType.SYSTEM,
          title: 'New Seller Assigned',
          message: `Seller ${seller.name} has been assigned to you. You will receive their orders automatically.`,
          actionLink: '/dashboard/call_center/orders',
        });
      }
    } else {
      // Unassignment notification
      await sendNotification({
        userId: sellerId,
        type: NotificationType.SYSTEM,
        title: 'Call Center Agents Unassigned',
        message: 'You are no longer assigned to any call center agents.',
        actionLink: '/dashboard/seller/orders',
      });
    }

    // Revalidate related pages
    revalidatePath('/dashboard/admin/users');
    revalidatePath('/dashboard/super_admin/users');
    revalidatePath('/dashboard/call_center/orders');

    return {
      success: true,
      message: agentConfigs.length > 0
        ? `Seller successfully assigned to ${agentConfigs.length} call center agent(s)`
        : 'Seller successfully unassigned from all call center agents'
    };
  } catch (error) {
    console.error('Error assigning seller to agents:', error);
    return {
      success: false,
      message: 'Failed to assign seller to agents. Please try again.'
    };
  }
});

/**
 * Get sellers assigned to a specific call center agent
 * @param agentId - ID of the call center agent
 * @returns List of assigned sellers
 */
export const getAssignedSellers = withDbConnection(async (agentId: string) => {
  try {
    const sellers = await User.find({
      role: 'seller',
      assignedCallCenterAgent: agentId
    })
      .select('name email businessName createdAt')
      .sort({ name: 1 })
      .lean();

    return {
      success: true,
      sellers: sellers.map((seller: any) => ({
        _id: seller._id.toString(),
        name: seller.name,
        email: seller.email,
        businessName: seller.businessName,
        createdAt: seller.createdAt,
      }))
    };
  } catch (error) {
    console.error('Error fetching assigned sellers:', error);
    return {
      success: false,
      message: 'Failed to fetch assigned sellers',
      sellers: []
    };
  }
});

/**
 * Get rider location history for tracking
 * @param riderId - ID of the delivery rider
 * @returns Location history array with timestamps
 */
export const getRiderLocationHistory = withDbConnection(async (riderId: string) => {
  try {
    if (!riderId || riderId.trim().length === 0) {
      return {
        success: false,
        message: 'Rider ID is required',
        locationHistory: []
      };
    }

    const rider = await User.findById(riderId)
      .select('locationHistory role')
      .lean();

    if (!rider) {
      return {
        success: false,
        message: 'Rider not found',
        locationHistory: []
      };
    }

    const riderData = rider as any;

    if (riderData.role !== 'delivery') {
      return {
        success: false,
        message: 'User is not a delivery rider',
        locationHistory: []
      };
    }

    return {
      success: true,
      message: 'Location history fetched successfully',
      locationHistory: (riderData.locationHistory || []).map((location: any) => ({
        latitude: location.latitude,
        longitude: location.longitude,
        timestamp: location.timestamp.toISOString(),
        accuracy: location.accuracy
      }))
    };
  } catch (error) {
    console.error('Error fetching rider location history:', error);
    return {
      success: false,
      message: 'Failed to fetch location history',
      locationHistory: []
    };
  }
});