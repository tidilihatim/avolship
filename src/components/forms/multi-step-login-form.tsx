'use client';

import React, { useState, useRef, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Loader2,
  Lock,
  Mail,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  Shield,
  Timer
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { checkUserEmail, send2FACode, verify2FACode, resend2FACode } from '@/app/actions/auth-verification';
import ForgotPasswordForm from './forgot-password-form';

enum LoginStep {
  EMAIL = 'email',
  VERIFICATION = 'verification',
  PASSWORD = 'password'
}

const MultiStepLoginForm: React.FC = () => {
  const t = useTranslations('login');
  const searchParams = useSearchParams();

  // Form state
  const [currentStep, setCurrentStep] = useState<LoginStep>(LoginStep.EMAIL);
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  // User info
  const [userName, setUserName] = useState<string>('');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
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
    if (currentStep === LoginStep.EMAIL && emailInputRef.current) {
      emailInputRef.current.focus();
    } else if (currentStep === LoginStep.VERIFICATION && codeInputRef.current) {
      codeInputRef.current.focus();
    } else if (currentStep === LoginStep.PASSWORD && passwordInputRef.current) {
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
      setError(t('messages.emailRequired'));
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const result = await checkUserEmail(email);

      if (!result.success || !result.userExists) {
        setError(result.message || t('messages.userNotFound'));
        setIsLoading(false);
        return;
      }

      setUserName(result.userName || '');
      setTwoFactorEnabled(result.twoFactorEnabled);

      if (result.twoFactorEnabled) {
        // Send 2FA code
        const codeResult = await send2FACode(email);

        if (!codeResult.success) {
          setError(codeResult.message);
          setIsLoading(false);
          return;
        }

        setVerificationId(codeResult.verificationId || '');
        setCurrentStep(LoginStep.VERIFICATION);
        startResendTimer();
        toast.success(t('messages.codeSent'));
      } else {
        // Skip 2FA, go directly to password
        setCurrentStep(LoginStep.PASSWORD);
      }
    } catch (error) {
      console.error('Email check failed:', error);
      setError(t('messages.error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode.trim()) {
      setError(t('messages.codeRequired'));
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const result = await verify2FACode(email, verificationCode);

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

      toast.success(t('messages.emailVerified'));
      setCurrentStep(LoginStep.PASSWORD);
    } catch (error) {
      console.error('Verification failed:', error);
      setError(t('messages.verificationFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError(t('password.label') + ' is required');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
        setIsLoading(false);
        if (passwordInputRef.current) {
          passwordInputRef.current.focus();
        }
      } else {
        toast.success(t('messages.loginSuccessful'), {
          description: t('messages.redirecting'),
        });

        const redirectUrl = searchParams?.get("callbackUrl") || '/dashboard';
        setTimeout(() => {
          window.location.href = redirectUrl;
        }, 100);
      }
    } catch (err) {
      console.error('Login failed:', err);
      setError(t('messages.loginFailed'));
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    console.log('Resend code clicked', { canResend, maxAttemptsReached, isLoading });

    // Allow resend if max attempts reached, regardless of timer
    if (!canResend && !maxAttemptsReached) {
      console.log('Resend blocked - conditions not met');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('Calling resend2FACode with email:', email);
      const result = await resend2FACode(email);
      console.log('Resend result:', result);

      if (result.success) {
        setVerificationId(result.verificationId || '');
        startResendTimer();
        toast.success(t('messages.newCodeSent'));
        setVerificationCode('');
        setRemainingAttempts(3);
        setMaxAttemptsReached(false);
        setError(null);
      } else {
        setError(result.message);
      }
    } catch (error) {
      console.error('Resend failed:', error);
      setError(t('messages.resendFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const goBackToEmail = () => {
    setCurrentStep(LoginStep.EMAIL);
    setVerificationCode('');
    setPassword('');
    setError(null);
    setRemainingAttempts(3);
    setMaxAttemptsReached(false);
  };

  const goBackToVerification = () => {
    setCurrentStep(LoginStep.VERIFICATION);
    setPassword('');
    setError(null);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case LoginStep.EMAIL:
        return (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            <form onSubmit={handleEmailSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-200 flex items-center gap-1.5"
                >
                  <Mail className="h-4 w-4" />
                  {t('email.label')}
                </Label>
                <Input
                  type="email"
                  id="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={cn(
                    "w-full px-4 py-3 rounded-xl shadow-sm",
                    "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                    "text-gray-900 dark:text-white",
                    "bg-white dark:bg-gray-800",
                    "border border-gray-300 dark:border-gray-700",
                    "placeholder:text-gray-400 dark:placeholder-gray-500",
                    error
                      ? "border-red-500 focus:ring-red-500"
                      : "dark:border-gray-600",
                    "transition-all duration-300"
                  )}
                  placeholder={t('email.placeholder')}
                  ref={emailInputRef}
                  required
                />
              </div>

              <Button
                type="submit"
                className={cn(
                  "w-full px-6 py-3 cursor-pointer rounded-xl flex items-center justify-center gap-2",
                  "transition-all duration-300",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50",
                  "bg-gradient-to-r from-[#1c2d51] to-[#f37922] text-white hover:from-[#1c2d51]/90 hover:to-[#f37922]/90",
                  isLoading && "opacity-70 cursor-not-allowed"
                )}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    {t('email.checking')}
                  </>
                ) : (
                  <>
                    {t('email.continue')}
                    <ChevronRight className="h-5 w-5" />
                  </>
                )}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-sm text-[#1c2d51] hover:text-[#f37922] dark:text-[#f37922] dark:hover:text-[#e3e438] font-medium transition-colors"
                >
                  {t('password.forgotPassword') || 'Forgot Password?'}
                </button>
              </div>
            </form>
          </motion.div>
        );

      case LoginStep.VERIFICATION:
        return (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            <div className="text-center mb-6">
              <div className="mx-auto w-16 h-16 bg-gradient-to-r from-[#1c2d51] to-[#f37922] rounded-full flex items-center justify-center mb-4">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {t('verification.title')}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('verification.subtitle')} <strong>{email}</strong>
              </p>
            </div>

            <form onSubmit={handleVerificationSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label
                  htmlFor="verification-code"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-200 flex items-center gap-1.5"
                >
                  <Shield className="h-4 w-4" />
                  {t('verification.label')}
                </Label>
                <Input
                  type="text"
                  id="verification-code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className={cn(
                    "w-full px-4 py-3 rounded-xl shadow-sm text-center text-2xl font-mono letter-spacing-wider",
                    "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                    "text-gray-900 dark:text-white",
                    "bg-white dark:bg-gray-800",
                    "border border-gray-300 dark:border-gray-700",
                    "placeholder:text-gray-400 dark:placeholder-gray-500",
                    error
                      ? "border-red-500 focus:ring-red-500"
                      : "dark:border-gray-600",
                    maxAttemptsReached && "opacity-50 cursor-not-allowed",
                    "transition-all duration-300"
                  )}
                  placeholder={t('verification.placeholder')}
                  maxLength={6}
                  ref={codeInputRef}
                  disabled={maxAttemptsReached}
                  required
                />
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">
                    {t('verification.attemptsRemaining')} <span className={cn(
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
                        t('verification.resendCode')
                      ) : (
                        <span className="flex items-center gap-1">
                          <Timer className="h-3 w-3" />
                          {t('verification.resendIn')} {resendTimer}s
                        </span>
                      )}
                    </button>
                  ) : (
                    <span className="text-red-500 text-xs">{t('verification.maxAttemptsReached')}</span>
                  )}
                </div>
              </div>

              {maxAttemptsReached ? (
                <div className="space-y-3">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                    <p className="text-red-800 font-medium mb-2">{t('verification.maxAttemptsMessage')}</p>
                    <p className="text-red-600 text-sm">{t('verification.maxAttemptsDescription')}</p>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={goBackToEmail}
                      className="flex-1"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      {t('verification.back')}
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
                      {t('verification.requestNewCode')}
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
                    {t('verification.back')}
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
                    {t('verification.verify')}
                  </Button>
                </div>
              )}
            </form>
          </motion.div>
        );

      case LoginStep.PASSWORD:
        return (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            <div className="text-center mb-6">
              <div className="mx-auto w-16 h-16 bg-gradient-to-r from-[#1c2d51] to-[#f37922] rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {t('password.title')}{userName ? `, ${userName}` : ''}!
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('password.subtitle')}
              </p>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-200 flex items-center gap-1.5"
                  >
                    <Lock className="h-4 w-4" />
                    {t('password.label')}
                  </Label>
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-sm text-[#1c2d51] hover:text-[#f37922] dark:text-[#f37922] dark:hover:text-[#e3e438] font-medium transition-colors"
                  >
                    {t('password.forgotPassword') || 'Forgot Password?'}
                  </button>
                </div>
                <Input
                  type="password"
                  id="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={cn(
                    "w-full px-4 py-3 rounded-xl shadow-sm",
                    "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                    "text-gray-900 dark:text-white",
                    "bg-white dark:bg-gray-800",
                    "border border-gray-300 dark:border-gray-700",
                    "placeholder:text-gray-400 dark:placeholder-gray-500",
                    error
                      ? "border-red-500 focus:ring-red-500"
                      : "dark:border-gray-600",
                    "transition-all duration-300"
                  )}
                  placeholder={t('password.placeholder')}
                  ref={passwordInputRef}
                  required
                />
              </div>

              <div className="flex gap-3">
                {twoFactorEnabled && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={goBackToVerification}
                    className="flex-1"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {t('verification.back')}
                  </Button>
                )}
                <Button
                  type="submit"
                  className={cn(
                    twoFactorEnabled ? "flex-1" : "w-full",
                    "bg-gradient-to-r from-[#1c2d51] to-[#f37922] text-white hover:from-[#1c2d51]/90 hover:to-[#f37922]/90",
                    isLoading && "opacity-70 cursor-not-allowed"
                  )}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      {t('password.signingIn')}
                    </>
                  ) : (
                    <>
                      {t('password.signIn')}
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
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 dark:from-gray-900 dark:to-black p-4">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeInOut' }}
        className="w-full max-w-md p-8 bg-white/5 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/10 space-y-8"
      >
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t('title')}
          </h2>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            {t('subtitle')}
          </p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded-md relative flex items-center gap-2"
            role="alert"
          >
            <AlertCircle className="h-5 w-5" />
            <span className="block sm:inline">{error}</span>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {showForgotPassword ? (
            <ForgotPasswordForm
              onBackToLogin={() => setShowForgotPassword(false)}
              onSuccess={() => {
                setShowForgotPassword(false);
                setCurrentStep(LoginStep.EMAIL);
                setEmail('');
                setPassword('');
                setError(null);
              }}
            />
          ) : (
            renderStepContent()
          )}
        </AnimatePresence>

        {!showForgotPassword && (
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {t('noAccount')}
              <a
                href="/auth/register"
                className="ml-1 font-semibold text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
              >
                {t('register')}
              </a>
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default MultiStepLoginForm;