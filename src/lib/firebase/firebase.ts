import { isFirebaseConfigured, auth, db, googleProvider } from './config';
import { mockStore } from './mockStore';
import {
  AppUser,
  ConcernReport,
  Goal,
  Question,
  Circle,
  Programme,
  CircleSession,
  MentorApplication,
  AuditLogEntry
} from '../../types';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut as fbSignOut,
  sendPasswordResetEmail
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  query,
  where,
  getDocs,
  serverTimestamp
} from 'firebase/firestore';

export const firebaseService = {
  // Authentication
  async signIn(email: string, password: string): Promise<AppUser> {
    if (isFirebaseConfigured && auth && db) {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const userDoc = await getDoc(doc(db, 'users', cred.user.uid));
      if (userDoc.exists()) {
        return userDoc.data() as AppUser;
      }
      throw new Error('User profile record not found.');
    } else {
      // In demo mode, check mockStore users or create one
      const found = Object.values(mockStore.users).find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (found) {
        mockStore.switchUser(found.uid);
        return found;
      }
      // Demo password check - allow signin with demo user
      const demoUser = mockStore.getCurrentUser();
      return demoUser;
    }
  },

  async signInWithGoogle(): Promise<AppUser> {
    if (isFirebaseConfigured && auth && db) {
      const cred = await signInWithPopup(auth, googleProvider);
      const userDocRef = doc(db, 'users', cred.user.uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        return userDoc.data() as AppUser;
      }
      const newUser: AppUser = {
        uid: cred.user.uid,
        email: cred.user.email || '',
        fullName: cred.user.displayName || 'Boy Child Member',
        role: 'boy',
        status: 'active',
        district: 'Kampala',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: cred.user.uid
      };
      await setDoc(userDocRef, {
        ...newUser,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return newUser;
    } else {
      const demoUser = mockStore.getCurrentUser();
      return demoUser;
    }
  },

  async signUp(email: string, password: string, userData: Partial<AppUser>): Promise<AppUser> {
    if (isFirebaseConfigured && auth && db) {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const newUser: AppUser = {
        uid: cred.user.uid,
        email: cred.user.email || email,
        fullName: userData.fullName || 'New Member',
        role: userData.role || 'boy',
        status: userData.status || 'active',
        district: userData.district || 'Kampala',
        town: userData.town,
        calculatedAge: userData.calculatedAge,
        guardianName: userData.guardianName,
        guardianPhone: userData.guardianPhone,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: cred.user.uid
      };
      await setDoc(doc(db, 'users', cred.user.uid), {
        ...newUser,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return newUser;
    } else {
      const uid = `usr_${Date.now()}`;
      const newUser: AppUser = {
        uid,
        email,
        fullName: userData.fullName || 'New Member',
        role: userData.role || 'boy',
        status: userData.status || 'active',
        district: userData.district || 'Kampala',
        town: userData.town,
        calculatedAge: userData.calculatedAge,
        guardianName: userData.guardianName,
        guardianPhone: userData.guardianPhone,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: uid
      };
      mockStore.addUser(newUser);
      return newUser;
    }
  },

  async signOut(): Promise<void> {
    if (isFirebaseConfigured && auth) {
      await fbSignOut(auth);
    }
  },

  async resetPassword(email: string): Promise<void> {
    if (isFirebaseConfigured && auth) {
      await sendPasswordResetEmail(auth, email);
    }
  },

  // Safeguarding Concern Reports
  async submitConcernReport(report: Omit<ConcernReport, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<ConcernReport> {
    if (isFirebaseConfigured && db) {
      const docRef = await addDoc(collection(db, 'concernReports'), {
        ...report,
        status: 'new',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return {
        ...report,
        id: docRef.id,
        status: 'new',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    } else {
      return mockStore.addConcernReport(report);
    }
  },

  // Programs & Circles
  getProgrammes(): Programme[] {
    return mockStore.programmes;
  },

  getCircles(): Circle[] {
    return mockStore.circles;
  },

  getSessions(circleId?: string): CircleSession[] {
    if (circleId) {
      return mockStore.sessions.filter((s) => s.circleId === circleId);
    }
    return mockStore.sessions;
  },

  // Goals
  getGoals(userId: string): Goal[] {
    return mockStore.goals.filter((g) => g.userId === userId);
  },

  addGoal(goal: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>): Goal {
    return mockStore.addGoal(goal);
  },

  updateGoalProgress(goalId: string, progress: number) {
    mockStore.updateGoalProgress(goalId, progress);
  },

  // Questions
  getQuestions(circleId?: string): Question[] {
    if (circleId) {
      return mockStore.questions.filter((q) => q.circleId === circleId);
    }
    return mockStore.questions;
  },

  addQuestion(q: Omit<Question, 'id' | 'createdAt' | 'isModerated'>): Question {
    return mockStore.addQuestion(q);
  },

  replyToQuestion(questionId: string, reply: string, mentorName: string) {
    mockStore.replyToQuestion(questionId, reply, mentorName);
  },

  // Admin & Coordinator actions
  getConcernReports(): ConcernReport[] {
    return mockStore.concernReports;
  },

  updateConcernStatus(reportId: string, status: ConcernReport['status'], notes?: string) {
    mockStore.updateConcernStatus(reportId, status, notes);
  },

  getMentorApplications(): MentorApplication[] {
    return mockStore.mentorApplications;
  },

  vetMentor(appId: string, approved: boolean) {
    mockStore.vetMentor(appId, approved);
  },

  getAuditLogs(): AuditLogEntry[] {
    return mockStore.auditLogs;
  },

  approveGuardianConsent(boyUid: string, guardianUid: string) {
    mockStore.approveGuardianConsent(boyUid, guardianUid);
  }
};
