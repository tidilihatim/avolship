'use server';

import { withDbConnection } from '@/lib/db/db-connect';
import User from '@/lib/db/models/user';
import EmailVerificationService from '@/lib/services/email-service';

/**
 * Check if user exists and handle 2FA requirements
 * @param email - User's email address
 * @returns Object with user status and 2FA requirements
 */
export const checkUserEmail = withDbConnection(async (email: string): Promise<{
  success: boolean;
  userExists: boolean;
  twoFactorEnabled: boolean;
  userName?: string;
  message: string;
}> => {
  try {
    if (!email || !email.trim()) {
      return {
        success: false,
        userExists: false,
        twoFactorEnabled: false,
        message: 'Email is required'
      };
    }

    // Find user by email
    const user = await User.findOne({
      email: email.toLowerCase().trim()
    }).select('name email twoFactorEnabled status');

    if (!user) {
      return {
        success: false,
        userExists: false,
        twoFactorEnabled: false,
        message: 'No account found with this email address'
      };
    }

    // Check if user account is active
    if (user.status !== 'approved') {
      return {
        success: false,
        userExists: true,
        twoFactorEnabled: user.twoFactorEnabled,
        message: 'Account is not approved. Please contact support.'
      };
    }

    return {
      success: true,
      userExists: true,
      twoFactorEnabled: user.twoFactorEnabled,
      userName: user.name,
      message: 'User found'
    };
  } catch (error: any) {
    console.error('Check user email failed:', error);
    return {
      success: false,
      userExists: false,
      twoFactorEnabled: false,
      message: 'An error occurred while checking email'
    };
  }
});

/**
 * Send 2FA verification code to user's email
 * @param email - User's email address
 * @returns Object with send status
 */
export const send2FACode = withDbConnection(async (email: string): Promise<{
  success: boolean;
  verificationId?: string;
  message: string;
}> => {
  try {
    // Check if user exists and has 2FA enabled
    const userCheck = await checkUserEmail(email);

    if (!userCheck.success || !userCheck.userExists) {
      return {
        success: false,
        message: userCheck.message
      };
    }

    if (!userCheck.twoFactorEnabled) {
      return {
        success: false,
        message: 'Two-factor authentication is not enabled for this account'
      };
    }

    // Send verification code
    const result = await EmailVerificationService.sendVerificationCode(
      email,
      'login',
      userCheck.userName
    );

    return {
      success: result.success,
      verificationId: result.verificationId,
      message: result.message
    };
  } catch (error: any) {
    console.error('Send 2FA code failed:', error);
    return {
      success: false,
      message: 'Failed to send verification code'
    };
  }
});

/**
 * Verify 2FA code
 * @param email - User's email address
 * @param code - Verification code provided by user
 * @returns Object with verification result
 */
export const verify2FACode = withDbConnection(async (
  email: string,
  code: string
): Promise<{
  success: boolean;
  message: string;
  remainingAttempts?: number;
}> => {
  try {
    if (!email || !code) {
      return {
        success: false,
        message: 'Email and verification code are required'
      };
    }

    // Verify the code
    const result = await EmailVerificationService.verifyCode(
      email,
      'login',
      code
    );

    return result;
  } catch (error: any) {
    console.error('Verify 2FA code failed:', error);
    return {
      success: false,
      message: 'Verification failed'
    };
  }
});

/**
 * Resend 2FA verification code
 * @param email - User's email address
 * @returns Object with resend status
 */
export const resend2FACode = withDbConnection(async (email: string): Promise<{
  success: boolean;
  verificationId?: string;
  message: string;
}> => {
  try {
    // Get user info for personalization
    const userCheck = await checkUserEmail(email);

    if (!userCheck.success || !userCheck.userExists) {
      return {
        success: false,
        message: userCheck.message
      };
    }

    // Resend verification code
    const result = await EmailVerificationService.resendVerificationCode(
      email,
      'login',
      userCheck.userName
    );

    return {
      success: result.success,
      verificationId: result.verificationId,
      message: result.message
    };
  } catch (error: any) {
    console.error('Resend 2FA code failed:', error);
    return {
      success: false,
      message: 'Failed to resend verification code'
    };
  }
});