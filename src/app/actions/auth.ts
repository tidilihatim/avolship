'use server';

import { authOptions } from '@/config/auth';
import { withDbConnection } from '@/lib/db/db-connect';
import User, { UserStatus, UserRole } from '@/lib/db/models/user';
import { getServerSession } from 'next-auth';

// Type definitions for form data
type SellerFormData = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  country: string;
  businessName: string;
  businessInfo: string;
  role: UserRole.SELLER;
};

type ProviderFormData = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  country: string;
  businessName: string;
  businessInfo: string;
  serviceType: string;
  role: UserRole.PROVIDER;
};

// Registration result type
type RegistrationResult = {
  success: boolean;
  message: string;
};


/**
 * Server action to register a new seller
 */
export const registerSeller = withDbConnection(async (formData: SellerFormData): Promise<RegistrationResult> => {
  try {
    // Basic validation - you can add more detailed validation if needed
    if (!formData.name || !formData.email || !formData.password || !formData.phone) {
      return {
        success: false,
        message: 'Please fill in all required fields'
      };
    }

    // Check if user with this email already exists
    const existingUser = await User.findOne({ email: formData.email });

    if (existingUser) {
      return {
        success: false,
        message: 'A user with this email already exists'
      };
    }

    // Create a new user (omitting the confirmPassword field)
    const { confirmPassword, ...userData } = formData;

    const user = new User({
      ...userData,
      status: UserStatus.PENDING, // Pending admin approval
    });

    // Save the user to the database
    await user.save();

    return {
      success: true,
      message: 'Registration successful! Your account is pending approval by an administrator.'
    };
  } catch (error) {
    console.error('Registration error:', error);

    return {
      success: false,
      message: 'Registration failed. Please try again later.'
    };
  }
});

/**
 * Server action to register a new provider
 */
export const registerProvider = withDbConnection(async (formData: ProviderFormData): Promise<RegistrationResult> => {
  try {
    // Basic validation
    if (!formData.name || !formData.email || !formData.password || !formData.phone || !formData.serviceType) {
      return {
        success: false,
        message: 'Please fill in all required fields'
      };
    }

    // Check if user with this email already exists
    const existingUser = await User.findOne({ email: formData.email });

    if (existingUser) {
      return {
        success: false,
        message: 'A user with this email already exists'
      };
    }

    // Create a new user (omitting the confirmPassword field)
    const { confirmPassword, ...userData } = formData;

    const user = new User({
      ...userData,
      status: UserStatus.PENDING, // Pending admin approval
    });

    // Save the user to the database
    await user.save();

    return {
      success: true,
      message: 'Registration successful! Your account is pending approval by an administrator.'
    };
  } catch (error) {
    console.error('Registration error:', error);

    return {
      success: false,
      message: 'Registration failed. Please try again later.'
    };
  }
});


export const getLoginUserRole = withDbConnection(async () => {
  try {
    const session = await getServerSession(authOptions);

    const userId = session?.user?.id;
    if (!userId) throw new Error('User not found');
    const user = await User.findById(userId).select('role');
    return user?.role;
  } catch (error: any) {
    throw new Error(error.message)
  }
}); 


export const getLoginUserStatus = withDbConnection(async () => {
  try {
    const session = await getServerSession(authOptions);

    const userId = session?.user?.id;
    if (!userId) throw new Error('User not found');
    const user = await User.findById(userId).select('status');
    return user?.status;
  } catch (error: any) {
    throw new Error(error.message)
  }
});

export const getCurrentUser = withDbConnection(async () => {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new Error('User not found');
    const user = await User.findById(session.user.id);
    return JSON.parse(JSON.stringify(user));
  } catch (error: any) {
    throw new Error(error.message)
  }
});