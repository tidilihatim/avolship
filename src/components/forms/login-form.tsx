'use client';

import React, { useState, useRef, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2, Lock, Mail, ChevronRight, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const LoginPage: React.FC = () => {
    const  t  = useTranslations();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const searchParams = useSearchParams()
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const emailInputRef = useRef<HTMLInputElement>(null);
    const passwordInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (emailInputRef.current) {
            emailInputRef.current.focus();
        }
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        if (!email || !password) {
            setError(t('login.error.emptyFields'));
            setIsLoading(false);
            return;
        }

        try {
            const result = await signIn('credentials', {
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
                setError(result.error);
                setIsLoading(false);
                if (emailInputRef.current) {
                    emailInputRef.current.focus();
                }
            } else {
                toast.success(t('login.success'), {
                    description: t('login.redirecting'),
                });

                // Use window.location.href to force a full page reload and ensure session is properly set
                const redirectUrl = searchParams?.get("callbackUrl") || '/dashboard';
                setTimeout(() => {
                    window.location.href = redirectUrl;
                }, 100);
            }
        } catch (err) {
            console.error('Login failed:', err);
            setError(t('login.error.general'));
            setIsLoading(false);
            if (emailInputRef.current) {
                emailInputRef.current.focus();
            }
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
                        {t('login.title')}
                    </h2>
                    <p className="mt-2 text-gray-500 dark:text-gray-400">
                        Welcome back! Please enter your credentials to sign in.
                    </p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-6">
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
                    <div className="space-y-2">
                        <Label
                            htmlFor="email"
                            className="block text-sm font-medium text-gray-700 dark:text-gray-200 flex items-center gap-1.5"
                        >
                            <Mail className="h-4 w-4" />
                            {t('login.email')}
                        </Label>
                        <Input
                            type="email"
                            id="email"
                            autoComplete="email"
                            name='email'
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
                            placeholder={t('login.emailPlaceholder')}
                            ref={emailInputRef}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label
                            htmlFor="password"
                            className="block text-sm font-medium text-gray-700 dark:text-gray-200 flex items-center gap-1.5"
                        >
                            <Lock className="h-4 w-4" />
                            {t('login.password')}
                        </Label>
                        <Input
                            type="password"
                            id="password"
                            name="password"
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
                            placeholder={t('login.passwordPlaceholder')}
                            ref={passwordInputRef}
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
                                {t('login.loggingIn')}
                            </>
                        ) : (
                            <>
                                {t('login.loginButton')}
                                <ChevronRight className="h-5 w-5" />
                            </>

                        )}
                    </Button>
                </form>
                <div className="mt-6 text-center text-gray-500 dark:text-gray-400">
                    {/* Add links for password reset, etc. later */}
                </div>
                <div className="mt-8 text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                        {t('login.noAccount')}
                        <a
                            href="/auth/register"  // replace with your actual register page
                            className="ml-1 font-semibold text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                        >
                            {t('login.register')}
                        </a>
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default LoginPage;
