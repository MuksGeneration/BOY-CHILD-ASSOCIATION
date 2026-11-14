import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppUser, UserRole } from '../types';
import { mockStore } from '../lib/firebase/mockStore';
import { firebaseService, isDemoModeEnabled, normalizeDoc } from '../lib/firebase/firebase';
import { auth, db, isFirebaseConfigured } from '../lib/firebase/config';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

interface AuthContextType {
  user: AppUser | null;
  role: UserRole;
  isUnder18Pending: boolean;
  isSuspended: boolean;
  isLiveFirebaseUser: boolean;
  authReady: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signUp: (email: string, password: string, userData: Partial<AppUser>) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  signOut: () => Promise<void>;
  switchPersona: (uid: string) => void;
  allDemoUsers: Record<string, AppUser>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function buildFallbackLiveUser(
  fbUser: FirebaseUser,
  claimRole?: UserRole,
  claimCleared = false,
  claimInstructorAuthorized = false
): AppUser {
  const isBootstrapAdmin = fbUser.email === 'mukuladavid6@gmail.com' && fbUser.emailVerified;
  const fallbackRole: UserRole = isBootstrapAdmin ? 'admin' : claimRole || 'boy';
  return {
    uid: fbUser.uid,
    email: fbUser.email || '',
    fullName: fbUser.displayName || 'BCA Member',
    role: fallbackRole,
    status: 'active',
    safeguardingCleared: fallbackRole === 'admin' || claimCleared,
    instructorAuthorized: fallbackRole === 'admin' || fallbackRole === 'instructor' || fallbackRole === 'learning_manager' || claimInstructorAuthorized,
    emailVerified: fbUser.emailVerified,
    district: 'Kampala',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: fbUser.uid,
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(() =>
    isDemoModeEnabled ? mockStore.getCurrentUser() : null
  );
  const [isLiveFirebaseUser, setIsLiveFirebaseUser] = useState(false);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    firebaseService.testConnection().catch(() => undefined);

    const unsubscribeStore = mockStore.subscribe(() => {
      if (isDemoModeEnabled && !auth?.currentUser) {
        setUser({ ...mockStore.getCurrentUser() });
      }
    });

    let unsubscribeFb = () => {};
    if (isFirebaseConfigured && auth && db) {
      unsubscribeFb = onAuthStateChanged(auth, async (fbUser) => {
        if (fbUser && db) {
          const tokenResult = await fbUser.getIdTokenResult().catch(() => null);
          const claimRole = tokenResult?.claims?.role as UserRole | undefined;
          const claimCleared = Boolean(tokenResult?.claims?.safeguardingCleared);
          const claimInstructorAuthorized = Boolean(tokenResult?.claims?.instructorAuthorized);

          try {
            const snap = await getDoc(doc(db, 'users', fbUser.uid));
            if (snap.exists()) {
              const data = normalizeDoc<AppUser>(snap.id, snap.data());
              const resolvedRole = claimRole || data.role;
              setUser({
                ...data,
                uid: fbUser.uid,
                role: resolvedRole,
                safeguardingCleared: resolvedRole === 'admin' || claimCleared || data.safeguardingCleared,
                instructorAuthorized:
                  resolvedRole === 'admin' ||
                  resolvedRole === 'instructor' ||
                  resolvedRole === 'learning_manager' ||
                  claimInstructorAuthorized ||
                  Boolean(data.instructorAuthorized),
                emailVerified: fbUser.emailVerified,
              });
            } else {
              setUser(buildFallbackLiveUser(fbUser, claimRole, claimCleared, claimInstructorAuthorized));
            }
          } catch (err) {
            console.warn('Firestore user profile read fallback to token claims:', err);
            setUser(buildFallbackLiveUser(fbUser, claimRole, claimCleared, claimInstructorAuthorized));
          }
          setIsLiveFirebaseUser(true);
        } else {
          setIsLiveFirebaseUser(false);
          setUser(isDemoModeEnabled ? { ...mockStore.getCurrentUser() } : null);
        }
        setAuthReady(true);
      });
    } else {
      setAuthReady(true);
    }

    return () => {
      unsubscribeStore();
      unsubscribeFb();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const loggedIn = await firebaseService.signIn(email, password);
    setUser({ ...loggedIn });
  };

  const signInWithGoogle = async () => {
    const loggedIn = await firebaseService.signInWithGoogle();
    setUser({ ...loggedIn });
  };

  const signUp = async (email: string, password: string, userData: Partial<AppUser>) => {
    const newUser = await firebaseService.signUp(email, password, userData);
    setUser({ ...newUser });
  };

  const resetPassword = async (email: string) => {
    await firebaseService.resetPassword(email);
  };

  const resendVerificationEmail = async () => {
    await firebaseService.resendVerificationEmail();
  };

  const signOut = async () => {
    await firebaseService.signOut();
    setIsLiveFirebaseUser(false);
    if (isDemoModeEnabled) {
      mockStore.switchUser('usr_boy_active');
      setUser({ ...mockStore.getCurrentUser() });
    } else {
      setUser(null);
    }
  };

  const switchPersona = (uid: string) => {
    if (!isDemoModeEnabled || isLiveFirebaseUser) return;
    mockStore.switchUser(uid);
    setUser({ ...mockStore.getCurrentUser() });
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
