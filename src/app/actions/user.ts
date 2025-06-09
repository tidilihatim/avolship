'use server';

import { revalidatePath } from 'next/cache';

import { UserFormData, UserApiResponse, UserFilters, PaginationData } from '@/types/user';
import { withDbConnection } from '@/lib/db/db-connect';
import { sanitizeUserData, validateUserFilters, validateUserForm } from '@/lib/validations/user';
import User, { UserStatus } from '@/lib/db/models/user';
import { sendNotification } from '@/lib/notifications/send-notification';
import { NotificationType } from '@/types/notification';

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
  filters: UserFilters = {}
): Promise<{ 
  users: any[]; 
  pagination: PaginationData; 
  success: boolean; 
  message: string;
}> => {
  try {
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
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return {
      users: JSON.parse(JSON.stringify(users)),
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
     sendNotification({
      userId,
      title: status === UserStatus.APPROVED ? "Account Approved" : status === UserStatus.REJECTED ? "Account Rejected" : "Account Pending",
      message: status === UserStatus.APPROVED ? "Your account has been approved and is now active for business operations and shipping services Thank you for choosing AvolShip" : status === UserStatus.REJECTED ? "Your account has been rejected and cannot be used for business operations and shipping services we are sorry for the inconvenience" : "Your account is pending approval and is currently under review. We'll notify you once it's approved",
      type: status === UserStatus.APPROVED ? NotificationType.SUCCESS : status === UserStatus.REJECTED ? NotificationType.ERROR : NotificationType.WARNING,
      icon: status === UserStatus.APPROVED ? "check-circle" : status === UserStatus.REJECTED ? "x-circle": "alert-triangle"
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