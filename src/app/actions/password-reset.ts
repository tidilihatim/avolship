'use server';

import { withDbConnection } from '@/lib/db/db-connect';
import User from '@/lib/db/models/user';
import EmailVerificationService from '@/lib/services/email-service';
import bcrypt from 'bcryptjs';

/**
 * Send password reset code to user's email
 * @param email - User's email address
 * @returns Object with send status
 */
export const sendPasswordResetCode = withDbConnection(async (email: string): Promise<{
  success: boolean;
  verificationId?: string;
  message: string;
}> => {
  try {
    if (!email || !email.trim()) {
      return {
        success: false,
        message: 'Email is required'
      };
    }

    // Check if user exists
    const user = await User.findOne({
      email: email.toLowerCase().trim()
    }).select('name email status');

    if (!user) {
      return {
        success: false,
        message: 'No account found with this email address'
      };
    }

    // Check if user account is active
    if (user.status !== 'approved') {
      return {
        success: false,
        message: 'Account is not approved. Please contact support.'
      };
    }

    // Send verification code with 'reset_password' action
    const result = await EmailVerificationService.sendVerificationCode(
      email,
      'reset_password',
      user.name
    );

    return {
      success: result.success,
      verificationId: result.verificationId,
      message: result.message
    };
  } catch (error: any) {
    console.error('Send password reset code failed:', error);
    return {
      success: false,
      message: 'Failed to send password reset code'
    };
  }
});

/**
 * Verify password reset code
 * @param email - User's email address
 * @param code - Verification code provided by user
 * @returns Object with verification result
 */
export const verifyPasswordResetCode = withDbConnection(async (
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

    // Verify the code with 'reset_password' action
    const result = await EmailVerificationService.verifyCode(
      email,
      'reset_password',
      code
    );

    return result;
  } catch (error: any) {
    console.error('Verify password reset code failed:', error);
    return {
      success: false,
      message: 'Verification failed'
    };
  }
});

/**
 * Reset user password
 * @param email - User's email address
 * @param newPassword - New password
 * @returns Object with reset status
 */
export const resetPassword = withDbConnection(async (
  email: string,
  newPassword: string
): Promise<{
  success: boolean;
  message: string;
}> => {
  try {
    if (!email || !newPassword) {
      return {
        success: false,
        message: 'Email and new password are required'
      };
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return {
        success: false,
        message: 'Password must be at least 8 characters long'
      };
    }

    if (!/[A-Z]/.test(newPassword)) {
      return {
        success: false,
        message: 'Password must contain at least one uppercase letter'
      };
    }

    if (!/[a-z]/.test(newPassword)) {
      return {
        success: false,
        message: 'Password must contain at least one lowercase letter'
      };
    }

    if (!/[0-9]/.test(newPassword)) {
      return {
        success: false,
        message: 'Password must contain at least one number'
      };
    }

    // Find user
    const user = await User.findOne({
      email: email.toLowerCase().trim()
    });

    if (!user) {
      return {
        success: false,
        message: 'User not found'
      };
    }

    // Update user password (pre-save hook will hash it automatically)
    user.password = newPassword;
    await user.save();

    return {
      success: true,
      message: 'Password reset successfully'
    };
  } catch (error: any) {
    console.error('Reset password failed:', error);
    return {
      success: false,
      message: 'Failed to reset password'
    };
  }
});

/**
 * Resend password reset code
 * @param email - User's email address
 * @returns Object with resend status
 */
export const resendPasswordResetCode = withDbConnection(async (email: string): Promise<{
  success: boolean;
  verificationId?: string;
  message: string;
}> => {
  try {
    // Get user info for personalization
    const user = await User.findOne({
      email: email.toLowerCase().trim()
    }).select('name email');

    if (!user) {
      return {
        success: false,
        message: 'User not found'
      };
    }

    // Resend verification code with 'reset_password' action
    const result = await EmailVerificationService.resendVerificationCode(
      email,
      'reset_password',
      user.name
    );

    return {
      success: result.success,
      verificationId: result.verificationId,
      message: result.message
    };
  } catch (error: any) {
    console.error('Resend password reset code failed:', error);
    return {
      success: false,
      message: 'Failed to resend password reset code'
    };
  }
});
