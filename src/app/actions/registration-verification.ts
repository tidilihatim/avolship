'use server';

import { withDbConnection } from '@/lib/db/db-connect';
import User from '@/lib/db/models/user';
import EmailVerificationService from '@/lib/services/email-service';

/**
 * Check if email is available for registration
 * @param email - User's email address
 * @returns Object with availability status
 */
export const checkEmailAvailability = withDbConnection(async (email: string): Promise<{
  success: boolean;
  available: boolean;
  message: string;
}> => {
  try {
    if (!email || !email.trim()) {
      return {
        success: false,
        available: false,
        message: 'Email is required'
      };
    }

    // Check if email already exists
    const existingUser = await User.findOne({
      email: email.toLowerCase().trim()
    }).select('email');

    if (existingUser) {
      return {
        success: false,
        available: false,
        message: 'An account with this email already exists'
      };
    }

    return {
      success: true,
      available: true,
      message: 'Email is available'
    };
  } catch (error: any) {
    console.error('Check email availability failed:', error);
    return {
      success: false,
      available: false,
      message: 'An error occurred while checking email availability'
    };
  }
});

/**
 * Send verification code for registration
 * @param email - User's email address
 * @param userName - User's name for personalization
 * @returns Object with send status
 */
export const sendRegistrationCode = withDbConnection(async (
  email: string,
  userName?: string
): Promise<{
  success: boolean;
  verificationId?: string;
  message: string;
}> => {
  try {
    // First check if email is available
    const availabilityCheck = await checkEmailAvailability(email);

    if (!availabilityCheck.success || !availabilityCheck.available) {
      return {
        success: false,
        message: availabilityCheck.message
      };
    }

    // Send verification code with 'register' action
    const result = await EmailVerificationService.sendVerificationCode(
      email,
      'register',
      userName
    );

    return {
      success: result.success,
      verificationId: result.verificationId,
      message: result.message
    };
  } catch (error: any) {
    console.error('Send registration code failed:', error);
    return {
      success: false,
      message: 'Failed to send verification code'
    };
  }
});

/**
 * Verify registration code
 * @param email - User's email address
 * @param code - Verification code provided by user
 * @returns Object with verification result
 */
export const verifyRegistrationCode = withDbConnection(async (
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

    // Verify the code with 'register' action
    const result = await EmailVerificationService.verifyCode(
      email,
      'register',
      code
    );

    return result;
  } catch (error: any) {
    console.error('Verify registration code failed:', error);
    return {
      success: false,
      message: 'Verification failed'
    };
  }
});

/**
 * Resend registration verification code
 * @param email - User's email address
 * @param userName - User's name for personalization
 * @returns Object with resend status
 */
export const resendRegistrationCode = withDbConnection(async (
  email: string,
  userName?: string
): Promise<{
  success: boolean;
  verificationId?: string;
  message: string;
}> => {
  try {
    // Resend verification code with 'register' action
    const result = await EmailVerificationService.resendVerificationCode(
      email,
      'register',
      userName
    );

    return {
      success: result.success,
      verificationId: result.verificationId,
      message: result.message
    };
  } catch (error: any) {
    console.error('Resend registration code failed:', error);
    return {
      success: false,
      message: 'Failed to resend verification code'
    };
  }
});
