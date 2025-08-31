'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { formatAuthError, isValidEmail, validatePassword } from '@/lib/auth';
import { ROUTES } from '@/lib/constants';

interface AuthFormProps {
  mode: 'login' | 'signup';
  onSuccess?: () => void;
  referralCode?: string;
}

export function AuthForm({ mode, onSuccess, referralCode }: AuthFormProps) {
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    displayName: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const isSignup = mode === 'signup';

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (isSignup) {
      const passwordValidation = validatePassword(formData.password);
      if (!passwordValidation.valid) {
        newErrors.password = passwordValidation.errors[0];
      }
    }

    // Signup-specific validation
    if (isSignup) {
      if (!formData.displayName.trim()) {
        newErrors.displayName = 'Display name is required';
      }

      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    setErrors({});

    try {
      if (isSignup) {
        await signUp(formData.email, formData.password, formData.displayName, referralCode);
      } else {
        await signIn(formData.email, formData.password);
      }
      onSuccess?.();
    } catch (error: any) {
      setErrors({ general: formatAuthError(error) });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrors({});

    try {
      await signInWithGoogle(referralCode);
      onSuccess?.();
    } catch (error: any) {
      setErrors({ general: formatAuthError(error) });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Draworld</h1>
          <p className="text-gray-600 mt-2">
            {isSignup ? 'Create your account' : 'Welcome back'}
          </p>
        </div>

        {/* General error */}
        {errors.general && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg" data-testid="error-message">
            <p className="text-red-600 text-sm">{errors.general}</p>
          </div>
        )}

        {/* Referral notice */}
        {referralCode && isSignup && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-600 text-sm">
              🎉 You&apos;ve been invited! You&apos;ll get 50 bonus credits when you sign up.
            </p>
          </div>
        )}

        {/* Social auth */}
        <div className="space-y-3 mb-6">
          <Button
            onClick={handleGoogleSignIn}
            disabled={loading}
            variant="secondary"
            className="w-full flex items-center justify-center gap-3"
            data-testid="google-signin-button"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285f4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34a853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#fbbc05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#ea4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </Button>
        </div>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">OR</span>
          </div>
        </div>

        {/* Email form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignup && (
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">
                Display Name
              </label>
              <input
                id="displayName"
                type="text"
                data-testid="display-name-input"
                value={formData.displayName}
                onChange={(e) => handleInputChange('displayName', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 ${
                  errors.displayName ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter your display name"
              />
              {errors.displayName && (
                <p className="mt-1 text-sm text-red-600">{errors.displayName}</p>
              )}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              data-testid="email-input"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 ${
                errors.email ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Enter your email"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              data-testid="password-input"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 ${
                errors.password ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder={isSignup ? 'Create a password' : 'Enter your password'}
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password}</p>
            )}
          </div>

          {isSignup && (
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                data-testid="confirm-password-input"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 ${
                  errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Confirm your password"
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
              )}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full"
            data-testid={isSignup ? "signup-button" : "login-button"}
          >
            {loading ? 'Please wait...' : isSignup ? 'Sign Up' : 'Sign In'}
          </Button>
        </form>

        {/* Footer links */}
        <div className="mt-6 text-center text-sm">
          {isSignup ? (
            <>
              <p className="text-gray-600 mb-2">
                By signing up, you agree to our{' '}
                <Link href={ROUTES.TERMS} className="text-pink-600 hover:underline">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href={ROUTES.PRIVACY} className="text-pink-600 hover:underline">
                  Privacy Policy
                </Link>
              </p>
              <p className="text-gray-600">
                Already have an account?{' '}
                <Link href={ROUTES.LOGIN} className="text-pink-600 hover:underline font-medium">
                  Sign In
                </Link>
              </p>
            </>
          ) : (
            <>
              <p className="text-gray-600 mb-2">
                <Link href={ROUTES.FORGOT_PASSWORD} className="text-pink-600 hover:underline">
                  Forgot your password?
                </Link>
              </p>
              <p className="text-gray-600">
                Don&apos;t have an account?{' '}
                <Link href={ROUTES.SIGNUP} className="text-pink-600 hover:underline font-medium">
                  Sign Up
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}