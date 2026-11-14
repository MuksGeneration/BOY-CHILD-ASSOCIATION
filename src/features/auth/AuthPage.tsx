import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  signInSchema,
  SignInInput,
  signUpSchema,
  SignUpInput,
  passwordResetSchema,
  PasswordResetInput,
  calculatePasswordStrength,
  normaliseUgandanPhone,
} from '../../lib/validation/schemas';
import { useAuth } from '../../hooks/useAuth';
import { firebaseService } from '../../lib/firebase/firebase';
import { mapAuthErrorToUserMessage, FirestoreConnectivityState } from '../../lib/firebase/diagnostics';
import { AppUser } from '../../types';
import { useNavigate } from 'react-router-dom';
import { ConfirmationResult } from 'firebase/auth';
import {
  Lock,
  Mail,
  User,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Eye,
  EyeOff,
  Smartphone,
  AlertTriangle,
  RefreshCw,
  LogOut,
  Wifi,
  WifiOff,
  Loader2,
} from 'lucide-react';

type AuthMode = 'signin' | 'signup' | 'reset' | 'phone';

interface UiAuthError {
  message: string;
  diagnosticRef: string;
}

export function getPostAuthRoute(appUser: Pick<AppUser, 'role' | 'status'>): string {
  if (appUser.status !== 'active') {
    return '/hub';
  }
  switch (appUser.role) {
    case 'admin':
      return '/admin';
    case 'coordinator':
      return '/coordinator';
    case 'mentor':
      return '/mentor';
    case 'guardian':
      return '/guardian';
    case 'partner':
      return '/partner';
    case 'instructor':
      return '/instructor';
    case 'learning_manager':
      return '/learning-manager';
    default:
      return '/hub';
  }
}

function getConnectivityLabel(state: FirestoreConnectivityState): {
  label: string;
  toneClass: string;
  isHealthy: boolean;
} {
  switch (state) {
    case 'connected':
      return {
        label: 'Database Connected',
        toneClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        isHealthy: true,
      };
    case 'checking':
      return {
        label: 'Checking Database Connection...',
        toneClass: 'bg-sky-50 text-sky-800 border-sky-200',
        isHealthy: true,
      };
    case 'permission_denied':
      return {
        label: 'Profile Permission Restricted',
        toneClass: 'bg-amber-50 text-amber-800 border-amber-200',
        isHealthy: false,
      };
    case 'unauthenticated':
      return {
        label: 'Session Verification Required',
        toneClass: 'bg-amber-50 text-amber-800 border-amber-200',
        isHealthy: false,
      };
    case 'misconfigured':
      return {
        label: 'Database Configuration Issue',
        toneClass: 'bg-red-50 text-[#DC2626] border-red-200',
        isHealthy: false,
      };
    case 'unreachable':
    default:
      return {
        label: 'Database Temporarily Unreachable',
        toneClass: 'bg-amber-50 text-amber-900 border-amber-200',
        isHealthy: false,
      };
  }
}

export const AuthPage: React.FC = () => {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<UiAuthError | null>(null);
  const [infoNotice, setInfoNotice] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isRetryingProfile, setIsRetryingProfile] = useState(false);

  // Phone Auth state
  const [phoneInput, setPhoneInput] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [confirmResult, setConfirmResult] = useState<ConfirmationResult | null>(null);
  const [phoneBusy, setPhoneBusy] = useState(false);

  const {
    user,
    isLiveFirebaseUser,
    authReady,
    profileStatus,
    profileError,
    connectivityStatus,
    connectivityLatencyMs,
    checkFirestoreConnectivity,
    retryProfileLoad,
    signIn,
    signInWithGoogle,
    signUp,
    resetPassword,
    resendVerificationEmail,
    signOut,
  } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (authReady && isLiveFirebaseUser && profileStatus === 'ready' && user && user.emailVerified !== false) {
      navigate(getPostAuthRoute(user), { replace: true });
    }
  }, [authReady, isLiveFirebaseUser, profileStatus, user, navigate]);

  const {
    register: registerSignIn,
    handleSubmit: handleSignInSubmit,
    formState: { errors: signInErrors, isSubmitting: isSubmittingSignIn },
  } = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
  });

  const {
    register: registerSignUp,
    handleSubmit: handleSignUpSubmit,
    watch: watchSignUp,
    formState: { errors: signUpErrors, isSubmitting: isSubmittingSignUp },
  } = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      agreeToTerms: true,
    },
  });

  const {
    register: registerReset,
    handleSubmit: handleResetSubmit,
    formState: { errors: resetErrors, isSubmitting: isSubmittingReset },
  } = useForm<PasswordResetInput>({
    resolver: zodResolver(passwordResetSchema),
  });

  const signUpPassword = watchSignUp('password') || '';
  const passwordStrength = calculatePasswordStrength(signUpPassword);

  const onSignIn = async (data: SignInInput) => {
    setAuthError(null);
    setInfoNotice(null);
    try {
      const loggedIn = await signIn(data.email, data.password);
      navigate(getPostAuthRoute(loggedIn), { replace: true });
    } catch (err: unknown) {
      setAuthError(mapAuthErrorToUserMessage(err));
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    setInfoNotice(null);
    setIsGoogleLoading(true);
    try {
      const loggedIn = await signInWithGoogle();
      navigate(getPostAuthRoute(loggedIn), { replace: true });
    } catch (err: unknown) {
      setAuthError(mapAuthErrorToUserMessage(err));
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const onSignUp = async (data: SignUpInput) => {
    setAuthError(null);
    setInfoNotice(null);
    try {
      const created = await signUp(data.email, data.password, {
        fullName: data.fullName,
        role: 'boy',
        status: 'active',
        calculatedAge: 18,
      });
      setInfoNotice('Account created. A verification email has been sent to your inbox.');
      navigate(getPostAuthRoute(created), { replace: true });
    } catch (err: unknown) {
      setAuthError(mapAuthErrorToUserMessage(err));
    }
  };

  const onReset = async (data: PasswordResetInput) => {
    setAuthError(null);
    try {
      await resetPassword(data.email);
      setResetSent(true);
    } catch (err: unknown) {
      setAuthError(mapAuthErrorToUserMessage(err));
    }
  };

  const handleSendPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    const norm = normaliseUgandanPhone(phoneInput);
    if (!norm.valid) {
      setAuthError({
        message: norm.error || 'Enter a valid Ugandan phone number (e.g. 0772123456).',
        diagnosticRef: 'BCA-PHONE-INPUT',
      });
      return;
    }
    setPhoneBusy(true);
    try {
      const res = await firebaseService.startPhoneSignIn(norm.e164, 'bca-recaptcha-container');
      if (!res) {
        setAuthError({
          message: 'Phone OTP requires Firebase Phone Auth enabled with an authorized domain in your Firebase Console.',
          diagnosticRef: 'BCA-PHONE-CONFIG',
        });
      } else {
        setConfirmResult(res);
        setInfoNotice(`SMS verification code sent to ${norm.e164}.`);
      }
    } catch (err: unknown) {
      setAuthError(mapAuthErrorToUserMessage(err));
    } finally {
      setPhoneBusy(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmResult || otpCode.trim().length < 6) {
      setAuthError({
        message: 'Enter the 6-digit SMS code.',
        diagnosticRef: 'BCA-OTP-INPUT',
      });
      return;
    }
    setPhoneBusy(true);
    setAuthError(null);
    try {
      const cred = await confirmResult.confirm(otpCode.trim());
      const profile = await firebaseService.loadOrEnsureUserProfile(cred.user);
      navigate(getPostAuthRoute(profile), { replace: true });
    } catch (err: unknown) {
      setAuthError(mapAuthErrorToUserMessage(err));
    } finally {
      setPhoneBusy(false);
    }
  };

  const handleRetryProfile = async () => {
    setAuthError(null);
    setIsRetryingProfile(true);
    try {
      const loaded = await retryProfileLoad();
      if (loaded) {
        navigate(getPostAuthRoute(loaded), { replace: true });
      }
    } finally {
      setIsRetryingProfile(false);
    }
  };

  const connMeta = getConnectivityLabel(connectivityStatus);
  const showRecoveryPanel = isLiveFirebaseUser && (profileStatus === 'loading' || profileStatus === 'error');

  return (
    <div className="bg-[#F8FAFC] min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200/80 shadow-md overflow-hidden">
        <div id="bca-recaptcha-container" />
        <div className="bg-[#1B365D] text-white p-6 text-center">
          <img
            src="/assets/aistudio/Screenshot_20260801_081145_WhatsApp__1__8a50926e.jpg"
            alt="Boy Child Association Official Logo"
            className="w-16 h-16 object-contain rounded-full mx-auto mb-3 shadow-md bg-white p-0.5"
          />
          <h1 className="font-heading text-xl font-bold tracking-tight">
            {showRecoveryPanel && 'Completing Your Sign-In'}
            {!showRecoveryPanel && mode === 'signin' && 'Sign in to Boy Child Portal'}
            {!showRecoveryPanel && mode === 'signup' && 'Create Your Boy Child Account'}
            {!showRecoveryPanel && mode === 'reset' && 'Reset Your Password'}
            {!showRecoveryPanel && mode === 'phone' && 'Uganda Mobile Phone Sign In'}
          </h1>
          <p className="text-xs text-[#60C1E5] font-semibold mt-1 uppercase tracking-wider">
            Standing Up As A Man
          </p>
        </div>

        {/* Recovery state when Firebase Authentication succeeded but Firestore profile sync is loading or errored */}
        {showRecoveryPanel ? (
          <div className="p-6 space-y-4">
            <div
              className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl border text-xs font-semibold ${connMeta.toneClass}`}
              role="status"
            >
              <span className="flex items-center gap-2">
                {connectivityStatus === 'checking' ? (
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                ) : connMeta.isHealthy ? (
                  <Wifi className="w-4 h-4 shrink-0" />
                ) : (
                  <WifiOff className="w-4 h-4 shrink-0" />
                )}
                <span>{connMeta.label}</span>
              </span>
              {connectivityLatencyMs !== null && connectivityStatus === 'connected' && (
                <span className="text-[11px] font-mono opacity-80">{connectivityLatencyMs}ms</span>
              )}
            </div>

            {profileStatus === 'loading' || isRetryingProfile ? (
              <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-3">
                <Loader2 className="w-8 h-8 text-[#005A9C] animate-spin mx-auto" />
                <p className="text-sm font-bold text-[#1B365D]">Loading Your BCA Profile...</p>
                <p className="text-xs text-slate-600">
                  Your account is authenticated. Syncing your membership profile and safeguarding permissions.
                </p>
              </div>
            ) : (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-amber-950">Profile Connection Interrupted</p>
                    <p className="text-xs text-amber-900 leading-relaxed">
                      {profileError?.message ||
                        'Your account has been authenticated, but we could not load your BCA profile. Please check your connection and try again.'}
                    </p>
                    {profileError?.diagnosticRef && (
                      <p className="text-[11px] font-mono text-amber-800/80 pt-1">
                        Diagnostic Ref: {profileError.diagnosticRef}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
              <button
                type="button"
                onClick={handleRetryProfile}
                disabled={isRetryingProfile || profileStatus === 'loading'}
                className="flex-1 py-2.5 px-4 bg-[#005A9C] hover:bg-[#004980] text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 min-h-[44px] disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isRetryingProfile ? 'animate-spin' : ''}`} />
                <span>{isRetryingProfile ? 'Retrying...' : 'Retry Loading Profile'}</span>
              </button>

              <button
                type="button"
                onClick={() => checkFirestoreConnectivity()}
                disabled={connectivityStatus === 'checking'}
                className="py-2.5 px-3 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl transition-colors min-h-[44px] disabled:opacity-50"
              >
                Test Connection
              </button>
            </div>

            <button
              type="button"
              onClick={() => signOut()}
              className="w-full py-2.5 px-4 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 min-h-[44px]"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        ) : (
          <>
            {/* Tab switchers */}
            <div className="grid grid-cols-3 border-b border-slate-200 text-xs font-bold text-center">
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setAuthError(null);
                }}
                className={`py-3 transition-colors min-h-[44px] ${
                  mode === 'signin' ? 'border-b-2 border-[#005A9C] text-[#005A9C] bg-white' : 'text-slate-500 bg-slate-50'
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
                className={`py-3 transition-colors min-h-[44px] ${
                  mode === 'signup' ? 'border-b-2 border-[#005A9C] text-[#005A9C] bg-white' : 'text-slate-500 bg-slate-50'
                }`}
              >
                Register
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('phone');
                  setAuthError(null);
                }}
                className={`py-3 transition-colors min-h-[44px] flex items-center justify-center gap-1 ${
                  mode === 'phone' ? 'border-b-2 border-[#005A9C] text-[#005A9C] bg-white' : 'text-slate-500 bg-slate-50'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Phone</span>
              </button>
            </div>

            <div className="p-6">
              {/* Alert when backend database connectivity is impaired */}
              {!connMeta.isHealthy && (
                <div
                  className={`mb-4 p-3 rounded-xl border text-xs flex items-center justify-between gap-2 ${connMeta.toneClass}`}
                  role="status"
                >
                  <span className="flex items-center gap-2 font-medium">
                    <WifiOff className="w-4 h-4 shrink-0" />
                    <span>{connMeta.label}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => checkFirestoreConnectivity()}
                    className="font-bold underline shrink-0"
                  >
                    Retry
                  </button>
                </div>
              )}

              {/* Email verification notice for signed-in unverified Firebase users */}
              {isLiveFirebaseUser && user && user.emailVerified === false && (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-2">
                  <div className="flex items-center gap-1.5 font-bold">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Verify your email address</span>
                  </div>
                  <p>Please check your inbox for a verification link so safeguarding notifications remain active.</p>
                  <button
                    type="button"
                    onClick={async () => {
                      await resendVerificationEmail();
                      setInfoNotice('Verification email resent.');
                    }}
                    className="text-xs font-bold text-[#005A9C] hover:underline"
                  >
                    Resend Verification Email
                  </button>
                </div>
              )}

              {authError && (
                <div
                  role="alert"
                  className="mb-4 p-3 bg-red-50 text-[#DC2626] rounded-xl text-xs border border-red-100 space-y-1.5"
                >
                  <p className="font-medium leading-relaxed">{authError.message}</p>
                  <div className="flex items-center justify-between text-[11px] text-red-700/80">
                    <span className="font-mono">Ref: {authError.diagnosticRef}</span>
                    <span>{connMeta.label}</span>
                  </div>
                </div>
              )}

              {infoNotice && (
                <div className="mb-4 p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-medium border border-emerald-200">
                  {infoNotice}
                </div>
              )}

              {/* 1. SIGN IN FORM */}
              {mode === 'signin' && (
                <form onSubmit={handleSignInSubmit(onSignIn)} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        {...registerSignIn('email')}
                        placeholder="name@example.com"
                        className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 focus:border-[#005A9C] min-h-[44px]"
                      />
                    </div>
                    {signInErrors.email && <p className="text-xs text-[#DC2626] mt-1">{signInErrors.email.message}</p>}
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
                    {signInErrors.password && <p className="text-xs text-[#DC2626] mt-1">{signInErrors.password.message}</p>}
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
                      <div className="w-full border-t border-slate-200" />
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
                    {signUpErrors.fullName && <p className="text-xs text-[#DC2626] mt-1">{signUpErrors.fullName.message}</p>}
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
                    {signUpErrors.email && <p className="text-xs text-[#DC2626] mt-1">{signUpErrors.email.message}</p>}
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
                    {signUpErrors.password && <p className="text-xs text-[#DC2626] mt-1">{signUpErrors.password.message}</p>}

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
                    {signUpErrors.confirmPassword && <p className="text-xs text-[#DC2626] mt-1">{signUpErrors.confirmPassword.message}</p>}
                  </div>

                  <div>
                    <label className="flex items-start gap-2 text-xs text-slate-600 cursor-pointer min-h-[44px]">
                      <input
                        type="checkbox"
                        {...registerSignUp('agreeToTerms')}
                        className="mt-0.5 w-4 h-4 rounded border-slate-300 text-[#005A9C] focus:ring-[#005A9C]"
                      />
                      <span>I agree to the BCA Terms of Service and Child Safeguarding Code of Conduct.</span>
                    </label>
                    {signUpErrors.agreeToTerms && <p className="text-xs text-[#DC2626] mt-1">{signUpErrors.agreeToTerms.message}</p>}
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingSignUp}
                    className="w-full py-3 bg-[#005A9C] hover:bg-[#004980] text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 min-h-[44px] disabled:opacity-50"
                  >
                    {isSubmittingSignUp ? 'Creating Account...' : 'Complete Registration'}
                    <ArrowRight className="w-4 h-4" />
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
                      <h3 className="font-heading text-lg font-bold text-[#1B365D]">Password Reset Link Sent</h3>
                      <p className="text-xs text-slate-600">
                        If an account matches that email, password reset instructions have been sent via Firebase Auth.
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
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                        <input
                          type="email"
                          {...registerReset('email')}
                          placeholder="name@example.com"
                          className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:border-[#005A9C] min-h-[44px]"
                        />
                        {resetErrors.email && <p className="text-xs text-[#DC2626] mt-1">{resetErrors.email.message}</p>}
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

              {/* 4. PHONE OTP SIGN IN */}
              {mode === 'phone' && (
                <div className="space-y-4">
                  {!confirmResult ? (
                    <form onSubmit={handleSendPhoneOtp} className="space-y-4">
                      <p className="text-xs text-slate-600">
                        Sign in using your Ugandan mobile number (MTN or Airtel). SMS OTP verification protects guardians and young members.
                      </p>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Uganda Mobile Number</label>
                        <input
                          type="text"
                          value={phoneInput}
                          onChange={(e) => setPhoneInput(e.target.value)}
                          placeholder="0772123456 or +256772123456"
                          className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:border-[#005A9C] min-h-[44px]"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={phoneBusy}
                        className="w-full py-3 bg-[#005A9C] hover:bg-[#004980] text-white font-bold text-xs rounded-xl min-h-[44px]"
                      >
                        {phoneBusy ? 'Sending OTP...' : 'Send SMS Code'}
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleVerifyOtp} className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Enter 6-Digit SMS Code</label>
                        <input
                          type="text"
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value)}
                          placeholder="123456"
                          className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:border-[#005A9C] min-h-[44px]"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={phoneBusy}
                        className="w-full py-3 bg-[#005A9C] hover:bg-[#004980] text-white font-bold text-xs rounded-xl min-h-[44px]"
                      >
                        {phoneBusy ? 'Verifying...' : 'Verify & Sign In'}
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-600">
          <ShieldCheck className="w-4 h-4 text-[#005A9C] shrink-0" />
          <span>Accounts for minors are guarded by parent or guardian verification.</span>
        </div>
      </div>
    </div>
  );
};
