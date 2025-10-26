'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Loader2,
  Mail,
  ChevronRight,
  Shield,
  Timer,
  CheckCircle,
  ArrowLeft,
  Lock,
  KeyRound
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  sendPasswordResetCode,
  verifyPasswordResetCode,
  resetPassword,
  resendPasswordResetCode
} from '@/app/actions/password-reset';

enum ForgotPasswordStep {
  EMAIL = 'email',
  VERIFICATION = 'verification',
  RESET_PASSWORD = 'reset_password'
}

interface ForgotPasswordFormProps {
  onBackToLogin: () => void;
  onSuccess: () => void;
}

export default function ForgotPasswordForm({
  onBackToLogin,
  onSuccess
}: ForgotPasswordFormProps) {
  const t = useTranslations('forgotPassword');

  // State
  const [currentStep, setCurrentStep] = useState<ForgotPasswordStep>(ForgotPasswordStep.EMAIL);
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Verification state
  const [verificationId, setVerificationId] = useState<string>('');
  const [remainingAttempts, setRemainingAttempts] = useState<number>(3);
  const [maxAttemptsReached, setMaxAttemptsReached] = useState<boolean>(false);

  // Timer for resend code
  const [resendTimer, setResendTimer] = useState(0);
  const [canResend, setCanResend] = useState(false);

  // Refs
  const emailInputRef = useRef<HTMLInputElement>(null);
  const codeInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  // Focus management
  useEffect(() => {
    if (currentStep === ForgotPasswordStep.EMAIL && emailInputRef.current) {
      emailInputRef.current.focus();
    } else if (currentStep === ForgotPasswordStep.VERIFICATION && codeInputRef.current) {
      codeInputRef.current.focus();
    } else if (currentStep === ForgotPasswordStep.RESET_PASSWORD && passwordInputRef.current) {
      passwordInputRef.current.focus();
    }
  }, [currentStep]);

  // Resend timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [resendTimer]);

  const startResendTimer = () => {
    setResendTimer(60); // 60 seconds
    setCanResend(false);
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      setError(t('emailRequired') || 'Email is required');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const result = await sendPasswordResetCode(email);

      if (!result.success) {
        setError(result.message);
        setIsLoading(false);
        return;
      }

      setVerificationId(result.verificationId || '');
      setCurrentStep(ForgotPasswordStep.VERIFICATION);
      startResendTimer();
      toast.success(t('codeSent') || 'Verification code sent to your email');
    } catch (error) {
      console.error('Email submission failed:', error);
      setError(t('error') || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!verificationCode.trim()) {
      setError(t('codeRequired') || 'Verification code is required');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const result = await verifyPasswordResetCode(email, verificationCode);

      if (!result.success) {
        setError(result.message);
        const remaining = result.remainingAttempts || 0;
        setRemainingAttempts(remaining);

        if (remaining <= 0) {
          setMaxAttemptsReached(true);
        }

        setIsLoading(false);
        return;
      }

      toast.success(t('codeVerified') || 'Code verified successfully!');
      setCurrentStep(ForgotPasswordStep.RESET_PASSWORD);
    } catch (error) {
      console.error('Verification failed:', error);
      setError(t('verificationFailed') || 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword.trim()) {
      setError(t('passwordRequired') || 'Password is required');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t('passwordsDoNotMatch') || 'Passwords do not match');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const result = await resetPassword(email, newPassword);

      if (!result.success) {
        setError(result.message);
        setIsLoading(false);
        return;
      }

      toast.success(t('passwordResetSuccess') || 'Password reset successfully!');
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (error) {
      console.error('Password reset failed:', error);
      setError(t('passwordResetFailed') || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!canResend && !maxAttemptsReached) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await resendPasswordResetCode(email);

      if (result.success) {
        setVerificationId(result.verificationId || '');
        startResendTimer();
        toast.success(t('newCodeSent') || 'New verification code sent');
        setVerificationCode('');
        setRemainingAttempts(3);
        setMaxAttemptsReached(false);
        setError(null);
      } else {
        setError(result.message);
      }
    } catch (error) {
      console.error('Resend failed:', error);
      setError(t('resendFailed') || 'Failed to resend code');
    } finally {
      setIsLoading(false);
    }
  };

  const goBackToEmail = () => {
    setCurrentStep(ForgotPasswordStep.EMAIL);
    setVerificationCode('');
    setNewPassword('');
    setConfirmPassword('');
    setError(null);
    setRemainingAttempts(3);
    setMaxAttemptsReached(false);
  };

  const goBackToVerification = () => {
    setCurrentStep(ForgotPasswordStep.VERIFICATION);
    setNewPassword('');
    setConfirmPassword('');
    setError(null);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case ForgotPasswordStep.EMAIL:
        return (
          <motion.div
            key="email"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            <div className="text-center mb-6">
              <div className="mx-auto w-16 h-16 bg-gradient-to-r from-[#1c2d51] to-[#f37922] rounded-full flex items-center justify-center mb-4">
                <KeyRound className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-[#1c2d51] dark:text-white mb-2">
                {t('title') || 'Forgot Password?'}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('subtitle') || "Enter your email to receive a verification code"}
              </p>
            </div>

            <form onSubmit={handleEmailSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-200 flex items-center gap-1.5"
                >
                  <Mail className="h-4 w-4" />
                  {t('emailLabel') || 'Email Address'}
                </Label>
                <Input
                  type="email"
                  id="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={cn(
                    "w-full px-4 py-3 rounded-xl shadow-sm transition-all duration-300 border border-gray-300 dark:border-gray-600",
                    error && "border-red-500 focus:ring-red-500"
                  )}
                  placeholder={t('emailPlaceholder') || 'Enter your email'}
                  ref={emailInputRef}
                  required
                />
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm"
                  role="alert"
                >
                  {error}
                </motion.div>
              )}

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onBackToLogin}
                  className="flex-1"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {t('back') || 'Back'}
                </Button>
                <Button
                  type="submit"
                  className={cn(
                    "flex-1 bg-gradient-to-r from-[#1c2d51] to-[#f37922] text-white hover:from-[#1c2d51]/90 hover:to-[#f37922]/90",
                    isLoading && "opacity-70 cursor-not-allowed"
                  )}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      {t('sending') || 'Sending...'}
                    </>
                  ) : (
                    <>
                      {t('sendCode') || 'Send Code'}
                      <ChevronRight className="h-5 w-5" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </motion.div>
        );

      case ForgotPasswordStep.VERIFICATION:
        return (
          <motion.div
            key="verification"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            <div className="text-center mb-6">
              <div className="mx-auto w-16 h-16 bg-gradient-to-r from-[#1c2d51] to-[#f37922] rounded-full flex items-center justify-center mb-4">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-[#1c2d51] dark:text-white mb-2">
                {t('verifyTitle') || 'Verify Your Email'}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('verifySubtitle') || 'We sent a verification code to'} <strong>{email}</strong>
              </p>
            </div>

            <form onSubmit={handleVerificationSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label
                  htmlFor="verification-code"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-200 flex items-center gap-1.5"
                >
                  <Shield className="h-4 w-4" />
                  {t('codeLabel') || 'Verification Code'}
                </Label>
                <Input
                  type="text"
                  id="verification-code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className={cn(
                    "w-full px-4 py-3 rounded-xl shadow-sm text-center text-2xl font-mono tracking-wider transition-all duration-300 border border-gray-300 dark:border-gray-600",
                    error && "border-red-500 focus:ring-red-500",
                    maxAttemptsReached && "opacity-50 cursor-not-allowed"
                  )}
                  placeholder="000000"
                  maxLength={6}
                  ref={codeInputRef}
                  disabled={maxAttemptsReached}
                  required
                />
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    {t('attemptsRemaining') || 'Attempts remaining:'} <span className={cn(
                      "font-semibold",
                      remainingAttempts <= 1 ? "text-red-500" : "text-[#f37922]"
                    )}>{remainingAttempts}</span>
                  </span>
                  {!maxAttemptsReached ? (
                    <button
                      type="button"
                      onClick={handleResendCode}
                      disabled={!canResend || isLoading}
                      className={cn(
                        "text-[#1c2d51] hover:text-[#f37922] font-medium transition-colors",
                        (!canResend || isLoading) && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      {canResend ? (
                        t('resendCode') || 'Resend code'
                      ) : (
                        <span className="flex items-center gap-1">
                          <Timer className="h-3 w-3" />
                          {t('resendIn') || 'Resend in'} {resendTimer}s
                        </span>
                      )}
                    </button>
                  ) : (
                    <span className="text-red-500 text-xs">{t('maxAttemptsReached') || 'Max attempts reached'}</span>
                  )}
                </div>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm"
                  role="alert"
                >
                  {error}
                </motion.div>
              )}

              {maxAttemptsReached ? (
                <div className="space-y-3">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                    <p className="text-red-800 font-medium mb-2">{t('tooManyAttempts') || 'Too many failed attempts'}</p>
                    <p className="text-red-600 text-sm">{t('requestNewCode') || 'Please request a new verification code'}</p>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={goBackToEmail}
                      className="flex-1"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      {t('back') || 'Back'}
                    </Button>
                    <Button
                      type="button"
                      onClick={handleResendCode}
                      disabled={isLoading}
                      className="flex-1 bg-gradient-to-r from-[#1c2d51] to-[#f37922] text-white hover:from-[#1c2d51]/90 hover:to-[#f37922]/90"
                    >
                      {isLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Mail className="mr-2 h-4 w-4" />
                      )}
                      {t('getNewCode') || 'Get New Code'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={goBackToEmail}
                    className="flex-1"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {t('back') || 'Back'}
                  </Button>
                  <Button
                    type="submit"
                    className={cn(
                      "flex-1 bg-gradient-to-r from-[#1c2d51] to-[#f37922] text-white hover:from-[#1c2d51]/90 hover:to-[#f37922]/90",
                      isLoading && "opacity-70 cursor-not-allowed"
                    )}
                    disabled={isLoading || verificationCode.length !== 6}
                  >
                    {isLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle className="mr-2 h-4 w-4" />
                    )}
                    {t('verify') || 'Verify'}
                  </Button>
                </div>
              )}
            </form>
          </motion.div>
        );

      case ForgotPasswordStep.RESET_PASSWORD:
        return (
          <motion.div
            key="reset-password"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            <div className="text-center mb-6">
              <div className="mx-auto w-16 h-16 bg-gradient-to-r from-[#1c2d51] to-[#f37922] rounded-full flex items-center justify-center mb-4">
                <Lock className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-[#1c2d51] dark:text-white mb-2">
                {t('resetTitle') || 'Reset Your Password'}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('resetSubtitle') || 'Enter your new password'}
              </p>
            </div>

            <form onSubmit={handleResetPasswordSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label
                  htmlFor="new-password"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-200 flex items-center gap-1.5"
                >
                  <Lock className="h-4 w-4" />
                  {t('newPasswordLabel') || 'New Password'}
                </Label>
                <Input
                  type="password"
                  id="new-password"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={cn(
                    "w-full px-4 py-3 rounded-xl shadow-sm transition-all duration-300 border border-gray-300 dark:border-gray-600",
                    error && "border-red-500 focus:ring-red-500"
                  )}
                  placeholder={t('newPasswordPlaceholder') || 'Enter new password'}
                  ref={passwordInputRef}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="confirm-password"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-200 flex items-center gap-1.5"
                >
                  <Lock className="h-4 w-4" />
                  {t('confirmPasswordLabel') || 'Confirm Password'}
                </Label>
                <Input
                  type="password"
                  id="confirm-password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={cn(
                    "w-full px-4 py-3 rounded-xl shadow-sm transition-all duration-300 border border-gray-300 dark:border-gray-600",
                    error && "border-red-500 focus:ring-red-500"
                  )}
                  placeholder={t('confirmPasswordPlaceholder') || 'Confirm new password'}
                  required
                />
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm"
                  role="alert"
                >
                  {error}
                </motion.div>
              )}

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={goBackToVerification}
                  className="flex-1"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {t('back') || 'Back'}
                </Button>
                <Button
                  type="submit"
                  className={cn(
                    "flex-1 bg-gradient-to-r from-[#1c2d51] to-[#f37922] text-white hover:from-[#1c2d51]/90 hover:to-[#f37922]/90",
                    isLoading && "opacity-70 cursor-not-allowed"
                  )}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      {t('resetting') || 'Resetting...'}
                    </>
                  ) : (
                    <>
                      {t('resetPassword') || 'Reset Password'}
                      <ChevronRight className="h-5 w-5" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <AnimatePresence mode="wait">
      {renderStepContent()}
    </AnimatePresence>
  );
}
