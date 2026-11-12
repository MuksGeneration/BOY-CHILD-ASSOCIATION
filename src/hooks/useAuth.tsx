import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppUser, UserRole } from '../types';
import { mockStore } from '../lib/firebase/mockStore';
import { firebaseService } from '../lib/firebase/firebase';

interface AuthContextType {
  user: AppUser | null;
  role: UserRole;
  isUnder18Pending: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signUp: (email: string, password: string, userData: Partial<AppUser>) => Promise<void>;
  signOut: () => Promise<void>;
  switchPersona: (uid: string) => void;
  allDemoUsers: Record<string, AppUser>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser>(() => mockStore.getCurrentUser());

  useEffect(() => {
    const unsubscribe = mockStore.subscribe(() => {
      setUser({ ...mockStore.getCurrentUser() });
    });
    return unsubscribe;
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

  const signOut = async () => {
    await firebaseService.signOut();
    mockStore.switchUser('usr_boy_active');
    setUser({ ...mockStore.getCurrentUser() });
  };

  const switchPersona = (uid: string) => {
    mockStore.switchUser(uid);
    setUser({ ...mockStore.getCurrentUser() });
  };

  const isUnder18Pending =
    user?.role === 'boy' &&
    user?.status === 'pending_guardian_consent';

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || 'boy',
        isUnder18Pending,
        signIn,
        signInWithGoogle,
        signUp,
        signOut,
        switchPersona,
        allDemoUsers: mockStore.users
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
