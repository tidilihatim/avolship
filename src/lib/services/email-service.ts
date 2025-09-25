import * as nodemailer from 'nodemailer';
import * as crypto from 'crypto';
import VerificationCode from '@/lib/db/models/verification-code';
import { withDbConnection } from '@/lib/db/db-connect';

// Email service configuration
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVICE,
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Generate verification code
function generateVerificationCode(): string {
  return crypto.randomInt(100000, 999999).toString();
}

// Clean, professional email template with brand colors
function getEmailTemplate(code: string, action: string, userName?: string): string {
  const actionDisplayNames: Record<string, string> = {
    login: 'sign in to your account',
    reset_password: 'reset your password',
    change_email: 'change your email address',
    register: 'complete your registration',
    enable_2fa: 'enable two-factor authentication',
    disable_2fa: 'disable two-factor authentication',
  };

  const displayAction = actionDisplayNames[action] || action;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification - AvolShip</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            body {
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
                background-color: #f8fafc;
                color: #1e293b;
                line-height: 1.5;
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
            }

            .email-container {
                max-width: 580px;
                margin: 40px auto;
                background: #ffffff;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 8px 32px rgba(28, 45, 81, 0.12);
                border: 1px solid #e2e8f0;
            }

            /* Clean Header */
            .header {
                background: #1c2d51;
                text-align: center;
                padding: 40px 32px;
                position: relative;
            }
            .header::after {
                content: '';
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                height: 4px;
                background: linear-gradient(90deg, #f37922 0%, #e3e438 100%);
            }
            .logo {
                font-size: 32px;
                font-weight: 800;
                color: #ffffff;
                letter-spacing: -1px;
                margin-bottom: 8px;
            }
            .header-tagline {
                color: rgba(255, 255, 255, 0.8);
                font-size: 14px;
                font-weight: 500;
                letter-spacing: 0.5px;
            }

            /* Content Area */
            .content {
                padding: 48px 32px;
            }
            .greeting {
                font-size: 28px;
                font-weight: 700;
                color: #1c2d51;
                text-align: center;
                margin-bottom: 12px;
            }
            .message {
                font-size: 16px;
                color: #64748b;
                text-align: center;
                margin-bottom: 40px;
                max-width: 400px;
                margin-left: auto;
                margin-right: auto;
                line-height: 1.6;
            }

            /* Verification Code */
            .verification-section {
                text-align: center;
                margin: 48px 0;
            }
            .code-label {
                font-size: 14px;
                font-weight: 600;
                color: #64748b;
                text-transform: uppercase;
                letter-spacing: 1px;
                margin-bottom: 20px;
            }
            .code-display {
                background: #f8fafc;
                border: 2px solid #e2e8f0;
                border-radius: 16px;
                padding: 32px;
                margin: 0 auto 20px;
                max-width: 280px;
                position: relative;
            }
            .code-display::before {
                content: '';
                position: absolute;
                top: -2px;
                left: -2px;
                right: -2px;
                bottom: -2px;
                background: linear-gradient(135deg, #f37922, #e3e438);
                border-radius: 18px;
                z-index: -1;
                opacity: 0.1;
            }
            .verification-code {
                font-family: 'JetBrains Mono', 'Fira Code', 'Monaco', 'Consolas', monospace;
                font-size: 40px;
                font-weight: 700;
                color: #1c2d51;
                letter-spacing: 8px;
                margin: 0;
            }
            .code-hint {
                font-size: 12px;
                color: #94a3b8;
                margin-top: 16px;
                font-weight: 500;
            }

            /* Info Cards */
            .info-card {
                border-radius: 12px;
                padding: 24px;
                margin: 24px 0;
                border-left: 4px solid;
            }
            .expiry-card {
                background: #fefce8;
                border-left-color: #f37922;
                border: 1px solid #fed7aa;
            }
            .expiry-content {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 12px;
                color: #9a3412;
                font-weight: 600;
                font-size: 15px;
            }
            .timer-icon {
                font-size: 20px;
                color: #f37922;
            }

            .security-card {
                background: #f1f5f9;
                border-left-color: #1c2d51;
                border: 1px solid #cbd5e1;
            }
            .security-header {
                display: flex;
                align-items: center;
                gap: 10px;
                margin-bottom: 12px;
                color: #1c2d51;
                font-weight: 700;
                font-size: 16px;
            }
            .security-text {
                color: #475569;
                font-size: 14px;
                line-height: 1.6;
            }

            /* Clean Footer */
            .footer {
                background: #f8fafc;
                text-align: center;
                padding: 32px;
                border-top: 1px solid #e2e8f0;
            }
            .footer-brand {
                font-size: 18px;
                font-weight: 700;
                color: #1c2d51;
                margin-bottom: 16px;
            }
            .footer-divider {
                width: 60px;
                height: 2px;
                background: linear-gradient(90deg, #f37922, #e3e438);
                margin: 0 auto 16px;
                border-radius: 1px;
            }
            .footer-text {
                font-size: 13px;
                color: #64748b;
                line-height: 1.5;
            }
            .company-name {
                color: #f37922;
                font-weight: 600;
            }

            /* Responsive Design */
            @media only screen and (max-width: 600px) {
                body {
                    padding: 20px 16px;
                }
                .email-container {
                    margin: 0;
                    border-radius: 8px;
                }
                .header {
                    padding: 32px 24px;
                }
                .content {
                    padding: 32px 24px;
                }
                .greeting {
                    font-size: 24px;
                }
                .verification-code {
                    font-size: 32px;
                    letter-spacing: 6px;
                }
                .code-display {
                    padding: 24px;
                    max-width: 240px;
                }
                .footer {
                    padding: 24px;
                }
            }
        </style>
    </head>
    <body>
        <div class="email-container">
            <!-- Header -->
            <div class="header">
                <div class="logo">AvolShip</div>
                <div class="header-tagline">Secure Verification</div>
            </div>

            <!-- Main Content -->
            <div class="content">
                <h1 class="greeting">
                    ${userName ? `Hello, ${userName}!` : 'Hello!'}
                </h1>

                <p class="message">
                    To complete your request to <strong>${displayAction}</strong>, please enter the verification code below.
                </p>

                <!-- Verification Code Section -->
                <div class="verification-section">
                    <div class="code-label">Verification Code</div>
                    <div class="code-display">
                        <div class="verification-code">${code}</div>
                        <div class="code-hint">Enter this code to continue</div>
                    </div>
                </div>

                <!-- Expiry Info -->
                <div class="info-card expiry-card">
                    <div class="expiry-content">
                        <span class="timer-icon">⏱️</span>
                        <span>This code expires in 10 minutes</span>
                    </div>
                </div>

                <!-- Security Notice -->
                <div class="info-card security-card">
                    <div class="security-header">
                        <span>🔒</span>
                        <span>Security Notice</span>
                    </div>
                    <div class="security-text">
                        If you didn't request this verification, please ignore this email. Never share your verification codes with anyone.
                    </div>
                </div>
            </div>

            <!-- Footer -->
            <div class="footer">
                <div class="footer-brand">AvolShip</div>
                <div class="footer-divider"></div>
                <div class="footer-text">
                    This email was sent by <span class="company-name">AvolShip</span><br>
                    © ${new Date().getFullYear()} AvolShip. All rights reserved.
                </div>
            </div>
        </div>
    </body>
    </html>
  `;
}

// Main email verification service
export class EmailVerificationService {
  /**
   * Send verification code to email
   * @param email - User's email address
   * @param action - Action being performed (e.g., "login", "reset_password", "change_email")
   * @param userName - Optional user name for personalization
   * @returns Object with success status and verification code ID
   */
  static async sendVerificationCode(
    email: string,
    action: string,
    userName?: string
  ): Promise<{ success: boolean; verificationId?: string; message: string }> {
    const dbOperation = withDbConnection(async () => {
      try {
        // Invalidate any existing codes for this email and action
        await VerificationCode.invalidatePrevious(email, action);

        // Generate new verification code
        const code = generateVerificationCode();

        // Create verification record in database
        const verificationRecord: any = new VerificationCode({
          email: email.toLowerCase(),
          code,
          action,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
        });

        await verificationRecord.save();

        // Send email
        await transporter.sendMail({
          from: `"AvolShip Security" <${process.env.EMAIL_USER}>`,
          to: email,
          subject: `AvolShip Verification Code - ${action.replace('_', ' ')}`,
          html: getEmailTemplate(code, action, userName),
        });

        return {
          success: true,
          verificationId: verificationRecord._id.toString(),
          message: 'Verification code sent successfully'
        };
      } catch (error) {
        console.error('Email sending failed:', error);
        return {
          success: false,
          message: 'Failed to send verification code'
        };
      }
    });

    return await dbOperation();
  }

  /**
   * Verify the provided code
   * @param email - User's email address
   * @param action - The action being verified
   * @param providedCode - The code provided by user
   * @returns Object with verification result
   */
  static async verifyCode(
    email: string,
    action: string,
    providedCode: string
  ): Promise<{
    success: boolean;
    message: string;
    remainingAttempts?: number;
  }> {
    const dbOperation = withDbConnection(async () => {
      try {
        // Find the verification code
        const verification = await VerificationCode.findValidCode(email, action, providedCode);

        if (!verification) {
          // Check if there's a code with wrong attempts
          const existingCode = await VerificationCode.findOne({
            email: email.toLowerCase(),
            action,
            verified: false,
            expiresAt: { $gt: new Date() }
          });

          if (existingCode) {
            await existingCode.incrementAttempts();

            if (existingCode.hasMaxAttemptsReached()) {
              return {
                success: false,
                message: 'Maximum verification attempts reached. Please request a new code.',
                remainingAttempts: 0
              };
            }

            return {
              success: false,
              message: 'Invalid verification code',
              remainingAttempts: existingCode.maxAttempts - existingCode.attempts
            };
          }

          return {
            success: false,
            message: 'Invalid or expired verification code'
          };
        }

        // Code is valid, mark as verified
        await verification.markAsVerified();

        return {
          success: true,
          message: 'Code verified successfully'
        };
      } catch (error) {
        console.error('Code verification failed:', error);
        return {
          success: false,
          message: 'Verification failed'
        };
      }
    });

    return await dbOperation();
  }

  /**
   * Resend verification code
   * @param email - User's email address
   * @param action - The action being verified
   * @param userName - Optional user name for personalization
   * @returns Object with new verification details
   */
  static async resendVerificationCode(
    email: string,
    action: string,
    userName?: string
  ): Promise<{ success: boolean; verificationId?: string; message: string }> {
    return await this.sendVerificationCode(email, action, userName);
  }

  /**
   * Check if user has valid pending verification
   * @param email - User's email address
   * @param action - The action being verified
   * @returns Boolean indicating if valid verification exists
   */
  static async hasPendingVerification(
    email: string,
    action: string
  ): Promise<boolean> {
    const dbOperation = withDbConnection(async () => {
      try {
        const verification = await VerificationCode.findOne({
          email: email.toLowerCase(),
          action,
          verified: false,
          expiresAt: { $gt: new Date() },
          attempts: { $lt: 3 }
        });

        return !!verification;
      } catch (error) {
        console.error('Check pending verification failed:', error);
        return false;
      }
    });

    return await dbOperation();
  }

  /**
   * Manual cleanup of verified and failed verification codes
   */
  static async cleanup(): Promise<void> {
    const dbOperation = withDbConnection(async () => {
      try {
        await VerificationCode.cleanup();
      } catch (error) {
        console.error('Cleanup failed:', error);
      }
    });

    await dbOperation();
  }
}

// Export default for convenience
export default EmailVerificationService;