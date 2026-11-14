import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { AppUser, UserRole } from '../types';
import { mockStore } from '../lib/firebase/mockStore';
import { firebaseService, isDemoModeEnabled } from '../lib/firebase/firebase';
import {
  auth,
  db,
  isFirebaseConfigured,
  ensureFirestoreNetworkEnabled,
  getFirebaseDiagnosticSnapshot,
} from '../lib/firebase/config';
import {
  classifyFirestoreError,
  FirestoreConnectivityState,
  FirestoreDiagnosticResult,
  FirestoreErrorCategory,
} from '../lib/firebase/diagnostics';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

export type ProfileLoadStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface ProfileLoadError {
  category: FirestoreErrorCategory;
  diagnosticRef: string;
  message: string;
  retryable: boolean;
}

interface AuthContextType {
  user: AppUser | null;
  role: UserRole;
  isUnder18Pending: boolean;
  isSuspended: boolean;
  isLiveFirebaseUser: boolean;
  authReady: boolean;
  profileStatus: ProfileLoadStatus;
  profileError: ProfileLoadError | null;
  connectivityStatus: FirestoreConnectivityState;
  connectivityLatencyMs: number | null;
  firebaseConfigDiagnostic: ReturnType<typeof getFirebaseDiagnosticSnapshot>;
  checkFirestoreConnectivity: () => Promise<FirestoreDiagnosticResult>;
  retryProfileLoad: () => Promise<AppUser | null>;
  signIn: (email: string, password: string) => Promise<AppUser>;
  signInWithGoogle: () => Promise<AppUser>;
  signUp: (email: string, password: string, userData: Partial<AppUser>) => Promise<AppUser>;
  resetPassword: (email: string) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  signOut: () => Promise<void>;
  switchPersona: (uid: string) => void;
  allDemoUsers: Record<string, AppUser>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(() =>
    isDemoModeEnabled ? mockStore.getCurrentUser() : null
  );
  const [isLiveFirebaseUser, setIsLiveFirebaseUser] = useState(false);
  const [authReady, setAuthReady] = useState(() => isDemoModeEnabled);
  const [profileStatus, setProfileStatus] = useState<ProfileLoadStatus>(() =>
    isDemoModeEnabled ? 'ready' : 'idle'
  );
  const [profileError, setProfileError] = useState<ProfileLoadError | null>(null);
  const [connectivityStatus, setConnectivityStatus] = useState<FirestoreConnectivityState>(
    isFirebaseConfigured ? 'checking' : 'misconfigured'
  );
  const [connectivityLatencyMs, setConnectivityLatencyMs] = useState<number | null>(null);

  const profileStatusRef = useRef<ProfileLoadStatus>(profileStatus);
  profileStatusRef.current = profileStatus;
  const syncSeqRef = useRef(0);

  const checkFirestoreConnectivity = useCallback(async (): Promise<FirestoreDiagnosticResult> => {
    setConnectivityStatus('checking');
    const result = await firebaseService.diagnoseConnectivity();
    setConnectivityStatus(result.state);
    setConnectivityLatencyMs(result.latencyMs);
    return result;
  }, []);

  const syncFirebaseUserProfile = useCallback(async (fbUser: FirebaseUser): Promise<AppUser | null> => {
    const seq = ++syncSeqRef.current;
    setIsLiveFirebaseUser(true);
    setProfileStatus('loading');
    setProfileError(null);

    try {
      const loadedProfile = await firebaseService.loadOrEnsureUserProfile(fbUser);
      if (seq !== syncSeqRef.current) return null;

      setUser(loadedProfile);
      setProfileStatus('ready');
      setProfileError(null);
      setConnectivityStatus('connected');
      return loadedProfile;
    } catch (err) {
      if (seq !== syncSeqRef.current) return null;

      const msg = err instanceof Error ? err.message : String(err || '');
      if (msg.toLowerCase().includes('suspended')) {
        setIsLiveFirebaseUser(false);
        setUser(null);
        setProfileStatus('idle');
        setProfileError({
          category: 'permission-denied',
          diagnosticRef: 'BCA-ACCT-SUSPENDED',
          message: 'This account has been suspended pending an administrative or safeguarding review.',
          retryable: false,
        });
        return null;
      }

      const classified = classifyFirestoreError(err);
      setUser(null);
      setProfileStatus('error');
      setConnectivityStatus(classified.connectivityState);
      setProfileError({
        category: classified.category,
        diagnosticRef: classified.diagnosticRef,
        message: classified.userMessage,
        retryable: classified.retryable,
      });
      return null;
    }
  }, []);

  const retryProfileLoad = useCallback(async (): Promise<AppUser | null> => {
    if (!auth?.currentUser) return null;
    await ensureFirestoreNetworkEnabled();
    await checkFirestoreConnectivity();
    return syncFirebaseUserProfile(auth.currentUser);
  }, [checkFirestoreConnectivity, syncFirebaseUserProfile]);

  useEffect(() => {
    if (!isDemoModeEnabled) {
      checkFirestoreConnectivity().catch(() => undefined);
    }

    const unsubscribeStore = mockStore.subscribe(() => {
      if (isDemoModeEnabled && !auth?.currentUser) {
        setUser({ ...mockStore.getCurrentUser() });
      }
    });

    let unsubscribeFb = () => {};
    if (!isDemoModeEnabled && isFirebaseConfigured && auth && db) {
      unsubscribeFb = onAuthStateChanged(auth, async (fbUser) => {
        if (fbUser) {
          await syncFirebaseUserProfile(fbUser);
        } else {
          syncSeqRef.current += 1;
          setIsLiveFirebaseUser(false);
          setUser(null);
          setProfileStatus('idle');
          setProfileError(null);
        }
        setAuthReady(true);
      });
    } else {
      setAuthReady(true);
    }

    const handleOnline = async () => {
      await ensureFirestoreNetworkEnabled();
      if (!isDemoModeEnabled) {
        await checkFirestoreConnectivity().catch(() => undefined);
      }
      if (auth?.currentUser && profileStatusRef.current === 'error') {
        await syncFirebaseUserProfile(auth.currentUser);
      }
    };

    const handleOffline = () => {
      setConnectivityStatus('unreachable');
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
    }

    return () => {
      unsubscribeStore();
      unsubscribeFb();
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      }
    };
  }, [checkFirestoreConnectivity, syncFirebaseUserProfile]);

  const signIn = async (email: string, password: string): Promise<AppUser> => {
    try {
      const loggedIn = await firebaseService.signIn(email, password);
      syncSeqRef.current += 1;
      setUser({ ...loggedIn });
      setProfileStatus('ready');
      setProfileError(null);
      if (!isDemoModeEnabled && auth?.currentUser) {
        setIsLiveFirebaseUser(true);
        setConnectivityStatus('connected');
      }
      return loggedIn;
    } catch (err) {
      if (!isDemoModeEnabled && auth?.currentUser) {
        const classified = classifyFirestoreError(err);
        setIsLiveFirebaseUser(true);
        setUser(null);
        setProfileStatus('error');
        setConnectivityStatus(classified.connectivityState);
        setProfileError({
          category: classified.category,
          diagnosticRef: classified.diagnosticRef,
          message: classified.userMessage,
          retryable: classified.retryable,
        });
      }
      throw err;
    }
  };

  const signInWithGoogle = async (): Promise<AppUser> => {
    try {
      const loggedIn = await firebaseService.signInWithGoogle();
      syncSeqRef.current += 1;
      setUser({ ...loggedIn });
      setProfileStatus('ready');
      setProfileError(null);
      if (!isDemoModeEnabled && auth?.currentUser) {
        setIsLiveFirebaseUser(true);
        setConnectivityStatus('connected');
      }
      return loggedIn;
    } catch (err) {
      if (!isDemoModeEnabled && auth?.currentUser) {
        const classified = classifyFirestoreError(err);
        setIsLiveFirebaseUser(true);
        setUser(null);
        setProfileStatus('error');
        setConnectivityStatus(classified.connectivityState);
        setProfileError({
          category: classified.category,
          diagnosticRef: classified.diagnosticRef,
          message: classified.userMessage,
          retryable: classified.retryable,
        });
      }
      throw err;
    }
  };

  const signUp = async (email: string, password: string, userData: Partial<AppUser>): Promise<AppUser> => {
    try {
      const newUser = await firebaseService.signUp(email, password, userData);
      syncSeqRef.current += 1;
      setUser({ ...newUser });
      setProfileStatus('ready');
      setProfileError(null);
      if (!isDemoModeEnabled && auth?.currentUser) {
        setIsLiveFirebaseUser(true);
        setConnectivityStatus('connected');
      }
      return newUser;
    } catch (err) {
      if (!isDemoModeEnabled && auth?.currentUser) {
        const classified = classifyFirestoreError(err);
        setIsLiveFirebaseUser(true);
        setUser(null);
        setProfileStatus('error');
        setConnectivityStatus(classified.connectivityState);
        setProfileError({
          category: classified.category,
          diagnosticRef: classified.diagnosticRef,
          message: classified.userMessage,
          retryable: classified.retryable,
        });
      }
      throw err;
    }
  };

  const resetPassword = async (email: string) => {
    await firebaseService.resetPassword(email);
  };

  const resendVerificationEmail = async () => {
    await firebaseService.resendVerificationEmail();
  };

  const signOut = async () => {
    syncSeqRef.current += 1;
    await firebaseService.signOut();
    setIsLiveFirebaseUser(false);
    setProfileError(null);
    if (isDemoModeEnabled) {
      mockStore.switchUser('usr_boy_active');
      setUser({ ...mockStore.getCurrentUser() });
      setProfileStatus('ready');
    } else {
      setUser(null);
      setProfileStatus('idle');
    }
  };

  const switchPersona = (uid: string) => {
    if (!isDemoModeEnabled || isLiveFirebaseUser) return;
    mockStore.switchUser(uid);
    setUser({ ...mockStore.getCurrentUser() });
    setProfileStatus('ready');
  };

  const isUnder18Pending = user?.role === 'boy' && user?.status === 'pending_guardian_consent';
  const isSuspended = user?.status === 'suspended';

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || 'boy',
        isUnder18Pending,
        isSuspended,
        isLiveFirebaseUser,
        authReady,
        profileStatus,
        profileError,
        connectivityStatus,
        connectivityLatencyMs,
        firebaseConfigDiagnostic: getFirebaseDiagnosticSnapshot(),
        checkFirestoreConnectivity,
        retryProfileLoad,
        signIn,
        signInWithGoogle,
        signUp,
        resetPassword,
        resendVerificationEmail,
        signOut,
        switchPersona,
        allDemoUsers: mockStore.users,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
