import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  signInSchema,
  SignInInput,
  signUpSchema,
  SignUpInput,
  passwordResetSchema,
  PasswordResetInput,
  calculatePasswordStrength
} from '../../lib/validation/schemas';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, User, ShieldCheck, CheckCircle2, ArrowRight, Eye, EyeOff } from 'lucide-react';

type AuthMode = 'signin' | 'signup' | 'reset';

export const AuthPage: React.FC = () => {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const { signIn, signInWithGoogle, signUp } = useAuth();
  const navigate = useNavigate();

  // Sign In Form
  const {
    register: registerSignIn,
    handleSubmit: handleSignInSubmit,
    formState: { errors: signInErrors, isSubmitting: isSubmittingSignIn }
  } = useForm<SignInInput>({
    resolver: zodResolver(signInSchema)
  });

  // Sign Up Form
  const {
    register: registerSignUp,
    handleSubmit: handleSignUpSubmit,
    watch: watchSignUp,
    formState: { errors: signUpErrors, isSubmitting: isSubmittingSignUp }
  } = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      agreeToTerms: true
    }
  });

  // Password Reset Form
  const {
    register: registerReset,
    handleSubmit: handleResetSubmit,
    formState: { errors: resetErrors, isSubmitting: isSubmittingReset }
  } = useForm<PasswordResetInput>({
    resolver: zodResolver(passwordResetSchema)
  });

  const signUpPassword = watchSignUp('password') || '';
  const passwordStrength = calculatePasswordStrength(signUpPassword);

  const onSignIn = async (data: SignInInput) => {
    setAuthError(null);
    try {
      await signIn(data.email, data.password);
      navigate('/hub');
    } catch (err: unknown) {
      setAuthError(err instanceof Error ? err.message : 'Invalid credentials. Please verify your email and password.');
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    setIsGoogleLoading(true);
    try {
      await signInWithGoogle();
      navigate('/hub');
    } catch (err: unknown) {
      setAuthError(err instanceof Error ? err.message : 'Google sign-in could not be completed.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const onSignUp = async (data: SignUpInput) => {
    setAuthError(null);
    try {
      await signUp(data.email, data.password, {
        fullName: data.fullName,
        role: 'boy',
        status: 'active'
      });
      navigate('/hub');
    } catch (err: unknown) {
      setAuthError(err instanceof Error ? err.message : 'Unable to create account. Please check details.');
    }
  };

  const onReset = async (data: PasswordResetInput) => {
    setAuthError(null);
    try {
      setResetSent(true);
    } catch (err: unknown) {
      setAuthError(err instanceof Error ? err.message : 'Failed to send reset email.');
    }
  };

  return (
    <div className="bg-[#F8FAFC] min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200/80 shadow-md overflow-hidden">
        {/* Header */}
        <div className="bg-[#1B365D] text-white p-6 text-center">
          <img
            src="/assets/aistudio/Screenshot_20260801_081145_WhatsApp__1__8a50926e.jpg"
            alt="Boy Child Association Official Logo"
            className="w-16 h-16 object-contain rounded-full mx-auto mb-3 shadow-md bg-white p-0.5"
          />
          <h1 className="font-heading text-xl font-bold tracking-tight">
            {mode === 'signin' && 'Sign in to Boy Child Portal'}
            {mode === 'signup' && 'Create Your Boy Child Account'}
            {mode === 'reset' && 'Reset Your Password'}
          </h1>
          <p className="text-xs text-[#60C1E5] font-semibold mt-1 uppercase tracking-wider">
            Standing Up As A Man
          </p>
        </div>

        {/* Tab switchers */}
        <div className="flex border-b border-slate-200 text-xs font-bold text-center">
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setAuthError(null);
            }}
            className={`flex-1 py-3 transition-colors min-h-[44px] ${
              mode === 'signin'
                ? 'border-b-2 border-[#005A9C] text-[#005A9C] bg-white'
                : 'text-slate-500 bg-slate-50 hover:text-slate-900'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setAuthError(null);
            }}
            className={`flex-1 py-3 transition-colors min-h-[44px] ${
              mode === 'signup'
                ? 'border-b-2 border-[#005A9C] text-[#005A9C] bg-white'
                : 'text-slate-500 bg-slate-50 hover:text-slate-900'
            }`}
          >
            Create Account
          </button>
        </div>

        <div className="p-6">
          {authError && (
            <div className="mb-4 p-3 bg-red-50 text-[#DC2626] rounded-xl text-xs font-medium border border-red-100">
              {authError}
            </div>
          )}

          {/* 1. SIGN IN FORM */}
          {mode === 'signin' && (
            <form onSubmit={handleSignInSubmit(onSignIn)} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    {...registerSignIn('email')}
                    placeholder="name@example.com"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 focus:border-[#005A9C] min-h-[44px]"
                  />
                </div>
                {signInErrors.email && (
                  <p className="text-xs text-[#DC2626] mt-1">{signInErrors.email.message}</p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('reset');
                      setResetSent(false);
                    }}
                    className="text-[11px] font-semibold text-[#005A9C] hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    {...registerSignIn('password')}
                    placeholder="Enter your password"
                    className="w-full pl-9 pr-10 py-2 text-sm rounded-xl border border-slate-300 focus:border-[#005A9C] min-h-[44px]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {signInErrors.password && (
                  <p className="text-xs text-[#DC2626] mt-1">{signInErrors.password.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmittingSignIn}
                className="w-full mt-2 py-3 bg-[#005A9C] hover:bg-[#004980] text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 min-h-[44px] disabled:opacity-50"
              >
                {isSubmittingSignIn ? 'Verifying...' : 'Sign In'}
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-2 text-slate-500 font-medium">Or</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading}
                className="w-full py-2.5 px-4 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 min-h-[44px] disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                {isGoogleLoading ? 'Connecting...' : 'Sign in with Google'}
              </button>
            </form>
          )}

          {/* 2. SIGN UP FORM */}
          {mode === 'signup' && (
            <form onSubmit={handleSignUpSubmit(onSignUp)} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name <span className="text-[#DC2626]">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    {...registerSignUp('fullName')}
                    placeholder="e.g. David Mukasa"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 focus:border-[#005A9C] min-h-[44px]"
                  />
                </div>
                {signUpErrors.fullName && (
                  <p className="text-xs text-[#DC2626] mt-1">{signUpErrors.fullName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address <span className="text-[#DC2626]">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    {...registerSignUp('email')}
                    placeholder="david@example.com"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 focus:border-[#005A9C] min-h-[44px]"
                  />
                </div>
                {signUpErrors.email && (
                  <p className="text-xs text-[#DC2626] mt-1">{signUpErrors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Create Password (Min 10 characters) <span className="text-[#DC2626]">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    {...registerSignUp('password')}
                    placeholder="Uppercase, lowercase & numbers"
                    className="w-full pl-9 pr-10 py-2 text-sm rounded-xl border border-slate-300 focus:border-[#005A9C] min-h-[44px]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {signUpErrors.password && (
                  <p className="text-xs text-[#DC2626] mt-1">{signUpErrors.password.message}</p>
                )}

                {/* Password Strength Meter */}
                {signUpPassword.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 font-medium">Password Strength:</span>
                      <span className="font-bold text-[#1B365D]">{passwordStrength.label}</span>
                    </div>
                    <div className="grid grid-cols-4 gap-1 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full ${passwordStrength.score >= 1 ? (passwordStrength.score >= 3 ? 'bg-emerald-500' : 'bg-amber-500') : 'bg-slate-200'}`} />
                      <div className={`h-full ${passwordStrength.score >= 2 ? (passwordStrength.score >= 3 ? 'bg-emerald-500' : 'bg-amber-500') : 'bg-slate-200'}`} />
                      <div className={`h-full ${passwordStrength.score >= 3 ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                      <div className={`h-full ${passwordStrength.score >= 4 ? 'bg-emerald-600' : 'bg-slate-200'}`} />
                    </div>
                    {passwordStrength.feedback.length > 0 && (
                      <p className="text-[11px] text-amber-700">
                        {passwordStrength.feedback[0]}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Confirm Password <span className="text-[#DC2626]">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    {...registerSignUp('confirmPassword')}
                    placeholder="Repeat password"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 focus:border-[#005A9C] min-h-[44px]"
                  />
                </div>
                {signUpErrors.confirmPassword && (
                  <p className="text-xs text-[#DC2626] mt-1">{signUpErrors.confirmPassword.message}</p>
                )}
              </div>

              <div>
                <label className="flex items-start gap-2 text-xs text-slate-600 cursor-pointer min-h-[44px]">
                  <input
                    type="checkbox"
                    {...registerSignUp('agreeToTerms')}
                    className="mt-0.5 w-4 h-4 rounded border-slate-300 text-[#005A9C] focus:ring-[#005A9C]"
                  />
                  <span>
                    I agree to the BCA Terms of Service and Child Safeguarding Code of Conduct.
                  </span>
                </label>
                {signUpErrors.agreeToTerms && (
                  <p className="text-xs text-[#DC2626] mt-1">{signUpErrors.agreeToTerms.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmittingSignUp}
                className="w-full py-3 bg-[#005A9C] hover:bg-[#004980] text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 min-h-[44px] disabled:opacity-50"
              >
                {isSubmittingSignUp ? 'Creating Account...' : 'Complete Registration'}
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-2 text-slate-500 font-medium">Or</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading}
                className="w-full py-2.5 px-4 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 min-h-[44px] disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                {isGoogleLoading ? 'Connecting...' : 'Sign up with Google'}
              </button>
            </form>
          )}

          {/* 3. PASSWORD RESET FORM */}
          {mode === 'reset' && (
            <div>
              {resetSent ? (
                <div className="text-center py-4 space-y-3">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <h3 className="font-heading text-lg font-bold text-[#1B365D]">
                    Password Reset Link Sent
                  </h3>
                  <p className="text-xs text-slate-600">
                    If an account matches that email, instructions have been dispatched. Check your inbox and spam folders.
                  </p>
                  <button
                    onClick={() => {
                      setMode('signin');
                      setResetSent(false);
                    }}
                    className="text-xs font-semibold text-[#005A9C] hover:underline block mx-auto pt-2"
                  >
                    Back to Sign In
                  </button>
                </div>
              ) : (
                <form onSubmit={handleResetSubmit(onReset)} className="space-y-4">
                  <p className="text-xs text-slate-600">
                    Enter the email associated with your Boy Child Association account and we will send you a reset link.
                  </p>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      {...registerReset('email')}
                      placeholder="name@example.com"
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:border-[#005A9C] min-h-[44px]"
                    />
                    {resetErrors.email && (
                      <p className="text-xs text-[#DC2626] mt-1">{resetErrors.email.message}</p>
                    )}
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => setMode('signin')}
                      className="text-xs font-semibold text-slate-600 hover:text-slate-900"
                    >
                      Back to Sign In
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingReset}
                      className="px-5 py-2.5 bg-[#005A9C] hover:bg-[#004980] text-white font-bold text-xs rounded-xl shadow-xs min-h-[44px]"
                    >
                      {isSubmittingReset ? 'Sending...' : 'Send Reset Link'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Safeguarding note */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-600">
          <ShieldCheck className="w-4 h-4 text-[#005A9C] shrink-0" />
          <span>Accounts for minors are guarded by parent or guardian verification.</span>
        </div>
      </div>
    </div>
  );
};
