import { isFirebaseConfigured, auth, db, functions, googleProvider, testFirestoreConnection } from './config';
import { handleFirestoreError, OperationType } from './errors';
import { mockStore } from './mockStore';
import {
  AppUser,
  AttachmentMeta,
  ConcernReport,
  SafeguardingCase,
  Goal,
  Question,
  Circle,
  Programme,
  CircleSession,
  AttendanceRecord,
  MentorApplication,
  MentorReferee,
  PartnerApplication,
  PartnerOrganisation,
  BcaEvent,
  EventRegistration,
  MembershipVerificationRecord,
  GuardianVerificationMethod,
  LearningResource,
  AnnouncementItem,
  AppNotification,
  GuardianLink,
  ConsentRecord,
  MembershipApplication,
  DppaRequest,
  AuditLogEntry,
  CmsSettingsBundle,
  CmsStatus,
  ContactMessage,
  MentorProgressReport,
  UserRole,
} from '../../types';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut as fbSignOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  ConfirmationResult,
} from 'firebase/auth';
import {
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Unsubscribe,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

export const isDemoModeEnabled =
  !isFirebaseConfigured ||
  import.meta.env.MODE === 'test' ||
  import.meta.env.VITE_USE_DEMO_STORE === 'true';

function stripUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v;
  }
  return out as Partial<T>;
}

function normalizeValue(val: unknown): unknown {
  if (val && typeof val === 'object') {
    const maybeTs = val as { toDate?: () => Date; seconds?: number };
    if (typeof maybeTs.toDate === 'function') {
      return maybeTs.toDate().toISOString();
    }
    if (Array.isArray(val)) {
      return val.map(normalizeValue);
    }
    const obj: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
      obj[k] = normalizeValue(v);
    }
    return obj;
  }
  return val;
}

export function normalizeDoc<T>(id: string, data: Record<string, unknown>): T {
  const normalized = normalizeValue(data) as Record<string, unknown>;
  return { ...normalized, id: (normalized.id as string) || id } as T;
}

async function tryCallable<TReq, TRes>(name: string, payload: TReq): Promise<TRes | null> {
  if (!functions || !auth?.currentUser) return null;
  try {
    const fn = httpsCallable<TReq, TRes>(functions, name);
    const res = await fn(payload);
    return res.data;
  } catch (err) {
    console.warn(`Cloud Function ${name} unavailable in client preview, falling back to Firestore SDK:`, err);
    return null;
  }
}

export const firebaseService = {
  testConnection: testFirestoreConnection,

  // ------------------------------------------------------------------
  // Authentication & Verification
  // ------------------------------------------------------------------
  async signIn(email: string, password: string): Promise<AppUser> {
    if (isFirebaseConfigured && auth && db) {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      try {
        const userDoc = await getDoc(doc(db, 'users', cred.user.uid));
        if (userDoc.exists()) {
          const data = normalizeDoc<AppUser>(userDoc.id, userDoc.data());
          if (data.status === 'suspended') {
            await fbSignOut(auth);
            throw new Error('This account has been suspended by an administrator.');
          }
          return { ...data, uid: cred.user.uid, emailVerified: cred.user.emailVerified };
        }
      } catch (err) {
        if (err instanceof Error && err.message.includes('suspended')) throw err;
        handleFirestoreError(err, OperationType.GET, `users/${cred.user.uid}`);
      }
      throw new Error('User profile record not found.');
    }

    const found = Object.values(mockStore.users).find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (found) {
      if (found.status === 'suspended') {
        throw new Error('This account has been suspended.');
      }
      mockStore.switchUser(found.uid);
      return found;
    }
    return mockStore.getCurrentUser();
  },

  async signInWithGoogle(): Promise<AppUser> {
    if (isFirebaseConfigured && auth && db) {
      const cred = await signInWithPopup(auth, googleProvider);
      const userDocRef = doc(db, 'users', cred.user.uid);
      try {
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const data = normalizeDoc<AppUser>(userDoc.id, userDoc.data());
          if (data.status === 'suspended') {
            await fbSignOut(auth);
            throw new Error('This account is currently suspended.');
          }
          return { ...data, uid: cred.user.uid, emailVerified: cred.user.emailVerified };
        }
        const newUser: AppUser = {
          uid: cred.user.uid,
          email: cred.user.email || '',
          fullName: cred.user.displayName || 'Boy Child Member',
          role: 'boy',
          status: 'active',
          ageCategory: 'young_adult_18_35',
          emailVerified: cred.user.emailVerified,
          district: 'Kampala',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: cred.user.uid,
        };
        await setDoc(userDocRef, {
          ...stripUndefined(newUser as unknown as Record<string, unknown>),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        return newUser;
      } catch (err) {
        if (err instanceof Error && err.message.includes('suspended')) throw err;
        handleFirestoreError(err, OperationType.WRITE, `users/${cred.user.uid}`);
      }
    }
    return mockStore.getCurrentUser();
  },

  async signUp(email: string, password: string, userData: Partial<AppUser>): Promise<AppUser> {
    if (isFirebaseConfigured && auth && db) {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      sendEmailVerification(cred.user).catch(() => undefined);

      const safeRole: AppUser['role'] = userData.role === 'guardian' ? 'guardian' : 'boy';
      const isMinor = (userData.calculatedAge ?? 18) < 18;
      const safeStatus: AppUser['status'] =
        safeRole === 'boy' && isMinor ? 'pending_guardian_consent' : 'active';

      const newUser: AppUser = {
        uid: cred.user.uid,
        email: cred.user.email || email,
        fullName: userData.fullName || 'New Member',
        phone: userData.phone,
        role: safeRole,
        status: safeStatus,
        ageCategory: isMinor ? 'child_5_17' : safeRole === 'boy' ? 'young_adult_18_35' : 'adult',
        emailVerified: cred.user.emailVerified,
        district: userData.district || 'Kampala',
        town: userData.town,
        calculatedAge: userData.calculatedAge,
        guardianName: userData.guardianName,
        guardianPhone: userData.guardianPhone,
        schoolOrOccupation: userData.schoolOrOccupation,
        interests: userData.interests,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: cred.user.uid,
      };
      try {
        await setDoc(doc(db, 'users', cred.user.uid), {
          ...stripUndefined(newUser as unknown as Record<string, unknown>),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        if (safeRole === 'boy') {
          await setDoc(doc(db, 'memberProfiles', cred.user.uid), {
            uid: cred.user.uid,
            fullName: newUser.fullName,
            ageCategory: isMinor ? 'child_5_17' : 'young_adult_18_35',
            calculatedAge: newUser.calculatedAge || 18,
            district: newUser.district || 'Kampala',
            town: newUser.town || 'Kampala',
            interests: newUser.interests || ['Brothers in Purpose Mentorship'],
            attendanceCount: 0,
            achievements: [],
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            createdBy: cred.user.uid,
          });
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `users/${cred.user.uid}`);
      }
      mockStore.addUser(newUser);
      return newUser;
    }

    const uid = `usr_${Date.now()}`;
    const isMinor = (userData.calculatedAge ?? 18) < 18;
    const newUser: AppUser = {
      uid,
      email,
      fullName: userData.fullName || 'New Member',
      phone: userData.phone,
      role: userData.role || 'boy',
      status: userData.status || (userData.role === 'boy' && isMinor ? 'pending_guardian_consent' : 'active'),
      ageCategory: isMinor ? 'child_5_17' : userData.role === 'boy' ? 'young_adult_18_35' : 'adult',
      emailVerified: false,
      district: userData.district || 'Kampala',
      town: userData.town,
      calculatedAge: userData.calculatedAge,
      guardianName: userData.guardianName,
      guardianPhone: userData.guardianPhone,
      schoolOrOccupation: userData.schoolOrOccupation,
      interests: userData.interests,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: uid,
    };
    mockStore.addUser(newUser);
    return newUser;
  },

  async startPhoneSignIn(phoneE164: string, containerId: string): Promise<ConfirmationResult | null> {
    if (!isFirebaseConfigured || !auth || typeof window === 'undefined') return null;
    const verifier = new RecaptchaVerifier(auth, containerId, { size: 'invisible' });
    return signInWithPhoneNumber(auth, phoneE164, verifier);
  },

  async resendVerificationEmail(): Promise<void> {
    if (isFirebaseConfigured && auth?.currentUser) {
      await sendEmailVerification(auth.currentUser);
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

  async updateProfile(
    uid: string,
    patch: Partial<Pick<AppUser, 'fullName' | 'district' | 'town' | 'schoolOrOccupation' | 'interests' | 'avatarUrl'>>
  ) {
    mockStore.updateUserProfile(uid, patch);
    if (isFirebaseConfigured && db && auth?.currentUser?.uid === uid) {
      try {
        await updateDoc(doc(db, 'users', uid), {
          ...stripUndefined(patch as Record<string, unknown>),
          updatedAt: serverTimestamp(),
        });
        const profRef = doc(db, 'memberProfiles', uid);
        const profSnap = await getDoc(profRef).catch(() => null);
        if (profSnap?.exists()) {
          await updateDoc(profRef, {
            ...stripUndefined(patch as Record<string, unknown>),
            updatedAt: serverTimestamp(),
          }).catch(() => undefined);
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${uid}`);
      }
    }
  },

  async updateUserAvatar(uid: string, avatarUrl: string) {
    mockStore.updateUserAvatar(uid, avatarUrl);
    if (isFirebaseConfigured && db && auth?.currentUser?.uid === uid) {
      try {
        await updateDoc(doc(db, 'users', uid), {
          avatarUrl,
          updatedAt: serverTimestamp(),
        });
        const profSnap = await getDoc(doc(db, 'memberProfiles', uid)).catch(() => null);
        if (profSnap?.exists()) {
          await updateDoc(doc(db, 'memberProfiles', uid), {
            avatarUrl,
            updatedAt: serverTimestamp(),
          }).catch(() => undefined);
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${uid}`);
      }
    }
  },

  // ------------------------------------------------------------------
  // Live Firestore Subscriptions (with safe public/role query scoping)
  // ------------------------------------------------------------------
  subscribePublicCatalog(role?: UserRole): Unsubscribe {
    if (!isFirebaseConfigured || !db) return () => undefined;

    const unsubs: Unsubscribe[] = [];
    const canViewAllCms = role === 'admin';
    const canViewCoordinatorProgrammes = role === 'admin' || role === 'coordinator';
    const canViewPartnerEvents = role === 'admin' || role === 'coordinator' || role === 'partner';
    const canViewMentorResources = role === 'admin' || role === 'coordinator' || role === 'mentor';

    // 1. systemSettings/cms
    unsubs.push(
      onSnapshot(
        doc(db, 'systemSettings', 'cms'),
        (snap) => {
          if (snap.exists()) {
            const raw = snap.data() as Record<string, unknown>;
            const payload = (raw.payload || raw) as Record<string, unknown>;
            const normalized = normalizeDoc<CmsSettingsBundle>(snap.id, {
              ...mockStore.cmsSettings,
              ...payload,
              status: (raw.status as CmsStatus) || (payload.status as CmsStatus) || 'published',
              updatedAt: raw.updatedAt || payload.updatedAt || mockStore.cmsSettings.updatedAt,
            });
            mockStore.cmsSettings = normalized;
            mockStore.notifyExternalSubscribers();
          }
        },
        (err) => console.warn('CMS settings listener skipped:', err.message)
      )
    );

    // 2. programmes
    const progQuery = canViewCoordinatorProgrammes
      ? collection(db, 'programmes')
      : query(collection(db, 'programmes'), where('status', '==', 'published'));
    unsubs.push(
      onSnapshot(
        progQuery,
        (snap) => {
          if (!snap.empty) {
            mockStore.programmes = snap.docs.map((d) => normalizeDoc<Programme>(d.id, d.data()));
            mockStore.notifyExternalSubscribers();
          }
        },
        (err) => console.warn('Programmes listener skipped:', err.message)
      )
    );

    // 3. events
    const evtQuery = canViewPartnerEvents
      ? collection(db, 'events')
      : query(collection(db, 'events'), where('status', '==', 'published'));
    unsubs.push(
      onSnapshot(
        evtQuery,
        (snap) => {
          if (!snap.empty) {
            mockStore.events = snap.docs.map((d) => normalizeDoc<BcaEvent>(d.id, d.data()));
            mockStore.notifyExternalSubscribers();
          }
        },
        (err) => console.warn('Events listener skipped:', err.message)
      )
    );

    // 4. announcements
    const annQuery = canViewAllCms
      ? collection(db, 'announcements')
      : query(collection(db, 'announcements'), where('status', '==', 'published'));
    unsubs.push(
      onSnapshot(
        annQuery,
        (snap) => {
          if (!snap.empty) {
            mockStore.announcements = snap.docs.map((d) => normalizeDoc<AnnouncementItem>(d.id, d.data()));
            mockStore.notifyExternalSubscribers();
          }
        },
        (err) => console.warn('Announcements listener skipped:', err.message)
      )
    );

    // 5. learningResources
    const resQuery = canViewMentorResources
      ? collection(db, 'learningResources')
      : query(collection(db, 'learningResources'), where('status', '==', 'published'));
    unsubs.push(
      onSnapshot(
        resQuery,
        (snap) => {
          if (!snap.empty) {
            mockStore.learningResources = snap.docs.map((d) => normalizeDoc<LearningResource>(d.id, d.data()));
            mockStore.notifyExternalSubscribers();
          }
        },
        (err) => console.warn('Learning resources listener skipped:', err.message)
      )
    );

    // 6. mentorshipCircles (public read allowed for active/forming/full)
    unsubs.push(
      onSnapshot(
        query(collection(db, 'mentorshipCircles'), where('status', 'in', ['active', 'forming', 'full'])),
        (snap) => {
          if (!snap.empty) {
            mockStore.circles = snap.docs.map((d) => normalizeDoc<Circle>(d.id, d.data()));
            mockStore.notifyExternalSubscribers();
          }
        },
        (err) => console.warn('Circles listener skipped:', err.message)
      )
    );

    // 7. verified partners
    const partnerQuery = canViewCoordinatorProgrammes
      ? collection(db, 'partners')
      : query(collection(db, 'partners'), where('status', '==', 'verified'));
    unsubs.push(
      onSnapshot(
        partnerQuery,
        (snap) => {
          if (!snap.empty) {
            mockStore.partners = snap.docs.map((d) => normalizeDoc<PartnerOrganisation>(d.id, d.data()));
            mockStore.notifyExternalSubscribers();
          }
        },
        (err) => console.warn('Partners listener skipped:', err.message)
      )
    );

    return () => {
      unsubs.forEach((u) => u());
    };
  },

  subscribeMemberData(uid: string, role: UserRole): Unsubscribe {
    if (!isFirebaseConfigured || !db || !auth?.currentUser) return () => undefined;
    const unsubs: Unsubscribe[] = [];

    if (role === 'boy') {
      unsubs.push(
        onSnapshot(
          query(collection(db, 'goals'), where('userId', '==', uid)),
          (snap) => {
            mockStore.goals = snap.docs.map((d) => normalizeDoc<Goal>(d.id, d.data()));
            mockStore.notifyExternalSubscribers();
          },
          (err) => console.warn('Goals listener error:', err.message)
        ),
        onSnapshot(
          query(collection(db, 'attendance'), where('memberId', '==', uid)),
          (snap) => {
            mockStore.attendance = snap.docs.map((d) => normalizeDoc<AttendanceRecord>(d.id, d.data()));
            mockStore.notifyExternalSubscribers();
          },
          (err) => console.warn('Attendance listener error:', err.message)
        ),
        onSnapshot(
          query(collection(db, 'questions'), where('userId', '==', uid)),
          (snap) => {
            mockStore.questions = snap.docs.map((d) => normalizeDoc<Question>(d.id, d.data()));
            mockStore.notifyExternalSubscribers();
          },
          (err) => console.warn('Questions listener error:', err.message)
        ),
        onSnapshot(
          query(collection(db, 'guardianLinks'), where('boyId', '==', uid)),
          (snap) => {
            mockStore.guardianLinks = snap.docs.map((d) => normalizeDoc<GuardianLink>(d.id, d.data()));
            mockStore.notifyExternalSubscribers();
          },
          (err) => console.warn('Boy guardianLinks listener error:', err.message)
        ),
        onSnapshot(
          query(collection(db, 'consentRecords'), where('boyId', '==', uid)),
          (snap) => {
            mockStore.consentRecords = snap.docs.map((d) => normalizeDoc<ConsentRecord>(d.id, d.data()));
            mockStore.notifyExternalSubscribers();
          },
          (err) => console.warn('Boy consentRecords listener error:', err.message)
        )
      );
    }

    if (role === 'guardian') {
      unsubs.push(
        onSnapshot(
          query(collection(db, 'guardianLinks'), where('guardianId', '==', uid)),
          (snap) => {
            mockStore.guardianLinks = snap.docs.map((d) => normalizeDoc<GuardianLink>(d.id, d.data()));
            mockStore.notifyExternalSubscribers();
          },
          (err) => console.warn('Guardian links listener error:', err.message)
        ),
        onSnapshot(
          query(collection(db, 'consentRecords'), where('guardianId', '==', uid)),
          (snap) => {
            mockStore.consentRecords = snap.docs.map((d) => normalizeDoc<ConsentRecord>(d.id, d.data()));
            mockStore.notifyExternalSubscribers();
          },
          (err) => console.warn('Guardian consent listener error:', err.message)
        )
      );
    }

    unsubs.push(
      onSnapshot(
        query(collection(db, 'notifications'), where('userId', '==', uid)),
        (snap) => {
          mockStore.notifications = snap.docs.map((d) => normalizeDoc<AppNotification>(d.id, d.data()));
          mockStore.notifyExternalSubscribers();
        },
        (err) => console.warn('Notifications listener error:', err.message)
      ),
      onSnapshot(
        query(collection(db, 'dataProtectionRequests'), where('userId', '==', uid)),
        (snap) => {
          mockStore.dppaRequests = snap.docs.map((d) => normalizeDoc<DppaRequest>(d.id, d.data()));
          mockStore.notifyExternalSubscribers();
        },
        (err) => console.warn('DPPA requests listener error:', err.message)
      ),
      onSnapshot(
        query(collection(db, 'eventRegistrations'), where('userId', '==', uid)),
        (snap) => {
          mockStore.eventRegistrations = snap.docs.map((d) => normalizeDoc<EventRegistration>(d.id, d.data()));
          mockStore.notifyExternalSubscribers();
        },
        (err) => console.warn('Event registrations listener error:', err.message)
      ),
      onSnapshot(
        collection(db, 'sessions'),
        (snap) => {
          if (!snap.empty) {
            mockStore.sessions = snap.docs.map((d) => normalizeDoc<CircleSession>(d.id, d.data()));
            mockStore.notifyExternalSubscribers();
          }
        },
        (err) => console.warn('Sessions listener error:', err.message)
      )
    );

    return () => unsubs.forEach((u) => u());
  },

  subscribeMentorData(uid: string): Unsubscribe {
    if (!isFirebaseConfigured || !db || !auth?.currentUser) return () => undefined;
    const unsubs: Unsubscribe[] = [
      onSnapshot(
        query(collection(db, 'circleMemberships'), where('leadMentorId', '==', uid)),
        (snap) => {
          mockStore.circleMemberships = snap.docs.map((d) =>
            normalizeDoc<MockCircleMembership>(d.id, d.data())
          );
          mockStore.notifyExternalSubscribers();
        },
        (err) => console.warn('Mentor circle memberships listener error:', err.message)
      ),
      onSnapshot(
        collection(db, 'questions'),
        (snap) => {
          mockStore.questions = snap.docs.map((d) => normalizeDoc<Question>(d.id, d.data()));
          mockStore.notifyExternalSubscribers();
        },
        (err) => console.warn('Mentor questions listener error:', err.message)
      ),
      onSnapshot(
        query(collection(db, 'attendance'), where('mentorId', '==', uid)),
        (snap) => {
          mockStore.attendance = snap.docs.map((d) => normalizeDoc<AttendanceRecord>(d.id, d.data()));
          mockStore.notifyExternalSubscribers();
        },
        (err) => console.warn('Mentor attendance listener error:', err.message)
      ),
      onSnapshot(
        query(collection(db, 'progressReports'), where('mentorId', '==', uid)),
        (snap) => {
          mockStore.progressReports = snap.docs.map((d) =>
            normalizeDoc<MentorProgressReport>(d.id, d.data())
          );
          mockStore.notifyExternalSubscribers();
        },
        (err) => console.warn('Mentor progressReports listener error:', err.message)
      ),
      onSnapshot(
        collection(db, 'eventRegistrations'),
        (snap) => {
          mockStore.eventRegistrations = snap.docs.map((d) => normalizeDoc<EventRegistration>(d.id, d.data()));
          mockStore.notifyExternalSubscribers();
        },
        (err) => console.warn('Mentor eventRegistrations listener error:', err.message)
      ),
    ];
    return () => unsubs.forEach((u) => u());
  },

  subscribePartnerData(uid: string): Unsubscribe {
    if (!isFirebaseConfigured || !db || !auth?.currentUser) return () => undefined;
    const unsubs: Unsubscribe[] = [
      onSnapshot(
        query(collection(db, 'partners'), where('ownerUid', '==', uid)),
        (snap) => {
          const mine = snap.docs.map((d) => normalizeDoc<PartnerOrganisation>(d.id, d.data()));
          if (mine.length > 0) {
            const others = mockStore.partners.filter((p) => p.ownerUid !== uid);
            mockStore.partners = [...mine, ...others];
            mockStore.notifyExternalSubscribers();
          }
        },
        (err) => console.warn('Partner org listener error:', err.message)
      ),
      onSnapshot(
        query(collection(db, 'partnerApplications'), where('applicantUid', '==', uid)),
        (snap) => {
          mockStore.partnerApplications = snap.docs.map((d) =>
            normalizeDoc<PartnerApplication>(d.id, d.data())
          );
          mockStore.notifyExternalSubscribers();
        },
        (err) => console.warn('Partner apps listener error:', err.message)
      ),
    ];
    return () => unsubs.forEach((u) => u());
  },

  subscribeCoordinatorData(role: UserRole): Unsubscribe {
    if (!isFirebaseConfigured || !db || !auth?.currentUser) return () => undefined;
    if (role !== 'coordinator' && role !== 'admin') return () => undefined;
    const unsubs: Unsubscribe[] = [
      onSnapshot(
        collection(db, 'users'),
        (snap) => {
          const map: Record<string, AppUser> = {};
          snap.docs.forEach((d) => {
            const u = normalizeDoc<AppUser>(d.id, d.data());
            map[d.id] = { ...u, uid: u.uid || d.id };
          });
          mockStore.users = map;
          mockStore.notifyExternalSubscribers();
        },
        (err) => console.warn('Coordinator users listener error:', err.message)
      ),
      onSnapshot(
        collection(db, 'membershipApplications'),
        (snap) => {
          mockStore.membershipApplications = snap.docs.map((d) =>
            normalizeDoc<MembershipApplication>(d.id, d.data())
          );
          mockStore.notifyExternalSubscribers();
        },
        (err) => console.warn('Membership apps listener error:', err.message)
      ),
      onSnapshot(
        collection(db, 'mentorApplications'),
        (snap) => {
          mockStore.mentorApplications = snap.docs.map((d) =>
            normalizeDoc<MentorApplication>(d.id, d.data())
          );
          mockStore.notifyExternalSubscribers();
        },
        (err) => console.warn('Mentor apps listener error:', err.message)
      ),
      onSnapshot(
        collection(db, 'mentorReferees'),
        (snap) => {
          mockStore.mentorReferees = snap.docs.map((d) => normalizeDoc<MentorReferee>(d.id, d.data()));
          mockStore.notifyExternalSubscribers();
        },
        (err) => console.warn('Mentor referees listener error:', err.message)
      ),
      onSnapshot(
        collection(db, 'partnerApplications'),
        (snap) => {
          mockStore.partnerApplications = snap.docs.map((d) =>
            normalizeDoc<PartnerApplication>(d.id, d.data())
          );
          mockStore.notifyExternalSubscribers();
        },
        (err) => console.warn('Partner apps listener error:', err.message)
      ),
      onSnapshot(
        collection(db, 'guardianLinks'),
        (snap) => {
          mockStore.guardianLinks = snap.docs.map((d) => normalizeDoc<GuardianLink>(d.id, d.data()));
          mockStore.notifyExternalSubscribers();
        },
        (err) => console.warn('Coordinator guardianLinks listener error:', err.message)
      ),
      onSnapshot(
        collection(db, 'consentRecords'),
        (snap) => {
          mockStore.consentRecords = snap.docs.map((d) => normalizeDoc<ConsentRecord>(d.id, d.data()));
          mockStore.notifyExternalSubscribers();
        },
        (err) => console.warn('Coordinator consentRecords listener error:', err.message)
      ),
      onSnapshot(
        collection(db, 'contactMessages'),
        (snap) => {
          mockStore.contactMessages = snap.docs.map((d) => normalizeDoc<ContactMessage>(d.id, d.data()));
          mockStore.notifyExternalSubscribers();
        },
        (err) => console.warn('Contact messages listener error:', err.message)
      ),
      onSnapshot(
        collection(db, 'progressReports'),
        (snap) => {
          mockStore.progressReports = snap.docs.map((d) =>
            normalizeDoc<MentorProgressReport>(d.id, d.data())
          );
          mockStore.notifyExternalSubscribers();
        },
        (err) => console.warn('Progress reports listener error:', err.message)
      ),
      onSnapshot(
        collection(db, 'eventRegistrations'),
        (snap) => {
          mockStore.eventRegistrations = snap.docs.map((d) => normalizeDoc<EventRegistration>(d.id, d.data()));
          mockStore.notifyExternalSubscribers();
        },
        (err) => console.warn('Event registrations listener error:', err.message)
      ),
    ];

    if (role === 'admin') {
      unsubs.push(
        onSnapshot(
          collection(db, 'auditLogs'),
          (snap) => {
            mockStore.auditLogs = snap.docs
              .map((d) => normalizeDoc<AuditLogEntry>(d.id, d.data()))
              .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            mockStore.notifyExternalSubscribers();
          },
          (err) => console.warn('Audit logs listener error:', err.message)
        ),
        onSnapshot(
          collection(db, 'dataProtectionRequests'),
          (snap) => {
            mockStore.dppaRequests = snap.docs.map((d) => normalizeDoc<DppaRequest>(d.id, d.data()));
            mockStore.notifyExternalSubscribers();
          },
          (err) => console.warn('Admin DPPA requests listener error:', err.message)
        )
      );
    }

    return () => unsubs.forEach((u) => u());
  },

  subscribeSafeguardingData(hasClearance: boolean): Unsubscribe {
    if (!isFirebaseConfigured || !db || !auth?.currentUser || !hasClearance) return () => undefined;
    const unsubs: Unsubscribe[] = [
      onSnapshot(
        collection(db, 'safeguardingCases'),
        (snap) => {
          mockStore.safeguardingCases = snap.docs.map((d) => normalizeDoc<SafeguardingCase>(d.id, d.data()));
          mockStore.notifyExternalSubscribers();
        },
        (err) => console.warn('Safeguarding cases listener error:', err.message)
      ),
      onSnapshot(
        collection(db, 'concernReports'),
        (snap) => {
          mockStore.concernReports = snap.docs.map((d) => normalizeDoc<ConcernReport>(d.id, d.data()));
          mockStore.notifyExternalSubscribers();
        },
        (err) => console.warn('Concern reports listener error:', err.message)
      ),
    ];
    return () => unsubs.forEach((u) => u());
  },

  async getLinkedBoysForGuardianAsync(guardianUid: string): Promise<AppUser[]> {
    const links = mockStore.guardianLinks.filter((l) => l.guardianId === guardianUid);
    if (!isFirebaseConfigured || !db || !auth?.currentUser || isDemoModeEnabled) {
      return links.map((l) => mockStore.users[l.boyId]).filter(Boolean);
    }

    const uniqueBoyIds = Array.from(new Set(links.map((l) => l.boyId)));
    const results = await Promise.all(
      uniqueBoyIds.map(async (boyId) => {
        try {
          const snap = await getDoc(doc(db!, 'users', boyId));
          if (snap.exists()) {
            const u = normalizeDoc<AppUser>(snap.id, snap.data());
            mockStore.users[boyId] = { ...u, uid: boyId };
            return mockStore.users[boyId];
          }
        } catch {
          // Guardian only has users/{boyId} get permission once link is verified
        }
        const link = links.find((l) => l.boyId === boyId);
        return {
          uid: boyId,
          email: '',
          fullName: link?.boyName || 'Linked Child',
          role: 'boy',
          status: 'pending_guardian_consent',
          ageCategory: 'child_5_17',
          createdAt: link?.createdAt || new Date().toISOString(),
          updatedAt: link?.updatedAt || new Date().toISOString(),
          createdBy: boyId,
        } as AppUser;
      })
    );
    return results;
  },

  // ------------------------------------------------------------------
  // Safeguarding Concern Reports & Cases
  // ------------------------------------------------------------------
  async submitConcernReport(
    report: Omit<ConcernReport, 'id' | 'createdAt' | 'updatedAt' | 'status'>
  ): Promise<ConcernReport> {
    const cloudRes = await tryCallable<typeof report, { reportId: string; refNumber: string }>(
      'submitConcernReport',
      report
    );
    if (cloudRes) {
      return mockStore.addConcernReport({ ...report, refNumber: cloudRes.refNumber });
    }
    if (isFirebaseConfigured && db) {
      const refNumber = report.refNumber || `BCA-SG-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const newRef = doc(collection(db, 'concernReports'));
      try {
        await setDoc(newRef, {
          ...stripUndefined(report as Record<string, unknown>),
          id: newRef.id,
          refNumber,
          status: 'new',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        const created = mockStore.addConcernReport({ ...report, refNumber });
        return { ...created, id: newRef.id, refNumber };
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `concernReports/${newRef.id}`);
      }
    }
    return mockStore.addConcernReport(report);
  },

  getConcernReports(): ConcernReport[] {
    return mockStore.concernReports;
  },

  getSafeguardingCases(): SafeguardingCase[] {
    return mockStore.safeguardingCases;
  },

  async promoteConcernToCase(reportId: string): Promise<SafeguardingCase> {
    const promoted = mockStore.promoteConcernToCase(reportId);
    if (isFirebaseConfigured && db && auth?.currentUser) {
      try {
        const batch = writeBatch(db);
        const caseRef = doc(db, 'safeguardingCases', promoted.id);
        batch.set(caseRef, {
          ...stripUndefined(promoted as unknown as Record<string, unknown>),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        batch.update(doc(db, 'concernReports', reportId), {
          status: 'investigating',
          updatedAt: serverTimestamp(),
        });
        await batch.commit();
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `safeguardingCases/${promoted.id}`);
      }
    }
    return promoted;
  },

  async triageSafeguardingCase(
    caseId: string,
    status: SafeguardingCase['status'],
    triageNotes: string,
    assignedLeadName?: string,
    escalationChannel?: SafeguardingCase['escalationChannel'],
    escalationRef?: string
  ) {
    mockStore.triageSafeguardingCase(caseId, status, triageNotes, assignedLeadName, escalationChannel, escalationRef);
    const cloudRes = await tryCallable('triageSafeguardingCase', {
      caseId,
      status,
      triageNotes,
      assignedLeadName,
      escalationChannel,
      escalationRef,
    });
    if (!cloudRes && isFirebaseConfigured && db && auth?.currentUser) {
      try {
        await updateDoc(doc(db, 'safeguardingCases', caseId), {
          status,
          triageNotes,
          ...(assignedLeadName ? { assignedLeadName } : {}),
          ...(escalationChannel ? { escalationChannel } : {}),
          ...(escalationRef ? { escalationRef } : {}),
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `safeguardingCases/${caseId}`);
      }
    }
  },

  async addSafeguardingFollowUp(
    caseId: string,
    payload: { actionTaken: string; outcome: string; nextReviewDate?: string }
  ) {
    const entry = mockStore.addSafeguardingFollowUp(caseId, payload);
    const cloudRes = await tryCallable('addSafeguardingFollowUp', { caseId, ...payload });
    if (!cloudRes && isFirebaseConfigured && db && auth?.currentUser) {
      try {
        await updateDoc(doc(db, 'safeguardingCases', caseId), {
          followUps: arrayUnion(stripUndefined(entry as unknown as Record<string, unknown>)),
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `safeguardingCases/${caseId}`);
      }
    }
    return entry;
  },

  async attachSafeguardingEvidence(caseId: string, attachment: AttachmentMeta) {
    mockStore.attachSafeguardingEvidence(caseId, attachment);
    if (isFirebaseConfigured && db && auth?.currentUser) {
      try {
        await updateDoc(doc(db, 'safeguardingCases', caseId), {
          attachments: arrayUnion(attachment),
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `safeguardingCases/${caseId}`);
      }
    }
  },

  logSafeguardingAccess(caseId: string, action: 'viewed_case' | 'exported_case' | 'escalated_case' = 'viewed_case') {
    tryCallable('logSafeguardingAccess', { caseId, action });
    const u = mockStore.getCurrentUser();
    mockStore.addAuditLog({
      action: `SAFEGUARDING_CASE_${action.toUpperCase()}`,
      performedBy: u.fullName,
      performedByRole: u.role,
      targetEntity: 'safeguardingCases',
      targetId: caseId,
      details: `Accessed confidential safeguarding case (${action})`,
    });
  },

  async updateConcernStatus(reportId: string, status: ConcernReport['status'], notes?: string) {
    mockStore.updateConcernStatus(reportId, status, notes);
    if (isFirebaseConfigured && db && auth?.currentUser) {
      try {
        await updateDoc(doc(db, 'concernReports', reportId), {
          status,
          ...(notes ? { triageNotes: notes } : {}),
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `concernReports/${reportId}`);
      }
    }
  },

  // ------------------------------------------------------------------
  // Programmes, Events, Learning Resources & CMS Content
  // ------------------------------------------------------------------
  getProgrammes(includeUnpublished = false): Programme[] {
    return includeUnpublished ? mockStore.programmes : mockStore.programmes.filter((p) => p.status === 'published');
  },

  getEvents(includeUnpublished = false): BcaEvent[] {
    return includeUnpublished ? mockStore.events : mockStore.events.filter((e) => e.status === 'published');
  },

  getLearningResources(includeUnpublished = false): LearningResource[] {
    return includeUnpublished
      ? mockStore.learningResources
      : mockStore.learningResources.filter((r) => r.status === 'published');
  },

  getAnnouncements(includeUnpublished = false): AnnouncementItem[] {
    return includeUnpublished
      ? mockStore.announcements
      : mockStore.announcements.filter((a) => a.status === 'published');
  },

  getCmsSettings(): CmsSettingsBundle {
    return mockStore.cmsSettings;
  },

  async updateCmsStatus(type: 'programme' | 'event' | 'announcement' | 'resource', id: string, status: CmsStatus) {
    mockStore.updateCmsStatus(type, id, status);
    const colMap = {
      programme: 'programmes',
      event: 'events',
      announcement: 'announcements',
      resource: 'learningResources',
    } as const;
    const cloudRes = await tryCallable('publishCmsContent', {
      collectionName: colMap[type],
      docId: id,
      status,
      payload: {},
    });
    if (!cloudRes && isFirebaseConfigured && db && auth?.currentUser) {
      try {
        await setDoc(
          doc(db, colMap[type], id),
          { status, updatedAt: serverTimestamp(), updatedBy: auth.currentUser.uid },
          { merge: true }
        );
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `${colMap[type]}/${id}`);
      }
    }
  },

  async updateCmsHeroSettings(patch: Partial<CmsSettingsBundle>) {
    mockStore.updateCmsHeroSettings(patch);
    const merged = mockStore.cmsSettings;
    const cloudRes = await tryCallable('publishCmsContent', {
      collectionName: 'systemSettings',
      docId: 'cms',
      status: merged.status,
      payload: { key: 'cms', payload: merged },
    });
    if (!cloudRes && isFirebaseConfigured && db && auth?.currentUser) {
      try {
        await setDoc(
          doc(db, 'systemSettings', 'cms'),
          {
            key: 'cms',
            status: merged.status,
            payload: merged,
            updatedAt: serverTimestamp(),
            updatedBy: auth.currentUser.uid,
          },
          { merge: true }
        );
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, 'systemSettings/cms');
      }
    }
  },

  async createProgramme(item: Omit<Programme, 'id'>): Promise<Programme> {
    const created = mockStore.addProgramme(item);
    const cloudRes = await tryCallable('publishCmsContent', {
      collectionName: 'programmes',
      docId: created.id,
      status: created.status,
      payload: created,
    });
    if (!cloudRes && isFirebaseConfigured && db && auth?.currentUser) {
      try {
        await setDoc(doc(db, 'programmes', created.id), {
          ...stripUndefined(created as unknown as Record<string, unknown>),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `programmes/${created.id}`);
      }
    }
    return created;
  },

  async createAnnouncement(item: Omit<AnnouncementItem, 'id'>): Promise<AnnouncementItem> {
    const created = mockStore.addAnnouncement(item);
    const cloudRes = await tryCallable('publishCmsContent', {
      collectionName: 'announcements',
      docId: created.id,
      status: created.status,
      payload: created,
    });
    if (!cloudRes && isFirebaseConfigured && db && auth?.currentUser) {
      try {
        await setDoc(doc(db, 'announcements', created.id), {
          ...stripUndefined(created as unknown as Record<string, unknown>),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `announcements/${created.id}`);
      }
    }
    return created;
  },

  async seedDefaultFirestoreData(): Promise<{ count: number }> {
    if (!isFirebaseConfigured || !db || !auth?.currentUser) {
      throw new Error('Must be signed in as Administrator to publish starter data to Firestore.');
    }
    const batch = writeBatch(db);
    let count = 0;

    batch.set(
      doc(db, 'systemSettings', 'cms'),
      {
        key: 'cms',
        status: mockStore.cmsSettings.status,
        payload: mockStore.cmsSettings,
        updatedAt: serverTimestamp(),
        updatedBy: auth.currentUser.uid,
      },
      { merge: true }
    );
    count += 1;

    for (const p of mockStore.programmes) {
      batch.set(
        doc(db, 'programmes', p.id),
        { ...stripUndefined(p as unknown as Record<string, unknown>), updatedAt: serverTimestamp() },
        { merge: true }
      );
      count += 1;
    }
    for (const e of mockStore.events) {
      batch.set(
        doc(db, 'events', e.id),
        { ...stripUndefined(e as unknown as Record<string, unknown>), updatedAt: serverTimestamp() },
        { merge: true }
      );
      count += 1;
    }
    for (const a of mockStore.announcements) {
      batch.set(
        doc(db, 'announcements', a.id),
        { ...stripUndefined(a as unknown as Record<string, unknown>), updatedAt: serverTimestamp() },
        { merge: true }
      );
      count += 1;
    }
    for (const r of mockStore.learningResources) {
      batch.set(
        doc(db, 'learningResources', r.id),
        { ...stripUndefined(r as unknown as Record<string, unknown>), updatedAt: serverTimestamp() },
        { merge: true }
      );
      count += 1;
    }
    for (const c of mockStore.circles) {
      batch.set(
        doc(db, 'mentorshipCircles', c.id),
        { ...stripUndefined(c as unknown as Record<string, unknown>), updatedAt: serverTimestamp() },
        { merge: true }
      );
      count += 1;
    }

    try {
      await batch.commit();
      return { count };
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'batch_seed_public_catalog');
    }
  },

  // ------------------------------------------------------------------
  // Circles, Memberships, Sessions & Attendance
  // ------------------------------------------------------------------
  getCircles(): Circle[] {
    return mockStore.circles;
  },

  getCircleMemberships(circleId?: string) {
    if (circleId) return mockStore.circleMemberships.filter((m) => m.circleId === circleId);
    return mockStore.circleMemberships;
  },

  async assignMemberToCircle(userId: string, circleId: string) {
    mockStore.assignMemberToCircle(userId, circleId);
    const cloudRes = await tryCallable('assignMemberToCircle', { userId, circleId });
    if (!cloudRes && isFirebaseConfigured && db && auth?.currentUser) {
      const user = mockStore.users[userId];
      const circle = mockStore.circles.find((c) => c.id === circleId);
      if (!user || !circle) return;
      try {
        const batch = writeBatch(db);
        batch.set(doc(db, 'circleMemberships', `${circleId}_${userId}`), {
          id: `${circleId}_${userId}`,
          circleId,
          userId,
          memberName: user.fullName,
          ageCategory: (user.calculatedAge || 16) < 18 ? 'child_5_17' : 'young_adult_18_35',
          leadMentorId: circle.leadMentorId,
          status: 'active',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        batch.update(doc(db, 'users', userId), { circleId, updatedAt: serverTimestamp() });
        batch.update(doc(db, 'mentorshipCircles', circleId), {
          activeMembersCount: increment(1),
          updatedAt: serverTimestamp(),
        });
        await batch.commit();
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `circleMemberships/${circleId}_${userId}`);
      }
    }
  },

  getSessions(circleId?: string): CircleSession[] {
    if (circleId) return mockStore.sessions.filter((s) => s.circleId === circleId);
    return mockStore.sessions;
  },

  async addCircleSession(sess: Omit<CircleSession, 'id' | 'completed'>) {
    const newSess = mockStore.addCircleSession(sess);
    if (isFirebaseConfigured && db && auth?.currentUser) {
      try {
        await setDoc(doc(db, 'sessions', newSess.id), {
          ...stripUndefined(newSess as unknown as Record<string, unknown>),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `sessions/${newSess.id}`);
      }
    }
    return newSess;
  },

  getAttendance(filters?: { circleId?: string; memberId?: string }): AttendanceRecord[] {
    return mockStore.attendance.filter((a) => {
      if (filters?.circleId && a.circleId !== filters.circleId) return false;
      if (filters?.memberId && a.memberId !== filters.memberId) return false;
      return true;
    });
  },

  async recordAttendance(rec: Omit<AttendanceRecord, 'id' | 'createdAt'>) {
    const saved = mockStore.recordAttendance(rec);
    const cloudRes = await tryCallable('recordAttendance', rec);
    if (!cloudRes && isFirebaseConfigured && db && auth?.currentUser) {
      try {
        await setDoc(doc(db, 'attendance', saved.id), {
          ...stripUndefined(saved as unknown as Record<string, unknown>),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `attendance/${saved.id}`);
      }
    }
    return saved;
  },

  getProgressReports(circleId?: string): MentorProgressReport[] {
    if (circleId) return mockStore.progressReports.filter((r) => r.circleId === circleId);
    return mockStore.progressReports;
  },

  async submitProgressReport(
    report: Omit<MentorProgressReport, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<MentorProgressReport> {
    const saved = mockStore.addProgressReport(report);
    const cloudRes = await tryCallable('submitProgressReport', report);
    if (!cloudRes && isFirebaseConfigured && db && auth?.currentUser) {
      try {
        await setDoc(doc(db, 'progressReports', saved.id), {
          ...stripUndefined({
            id: saved.id,
            circleId: saved.circleId,
            circleName: saved.circleName,
            mentorId: saved.mentorId,
            mentorName: saved.mentorName,
            reportingPeriod: saved.reportingPeriod,
            attendanceSummary: saved.attendanceSummary,
            keyMilestones: saved.keyMilestones,
            safeguardingObservations: saved.safeguardingObservations,
            supportNeeded: saved.supportNeeded || undefined,
          }),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `progressReports/${saved.id}`);
      }
    }
    return saved;
  },

  // ------------------------------------------------------------------
  // Goals & Supervised Circle Q&A
  // ------------------------------------------------------------------
  getGoals(userId: string): Goal[] {
    return mockStore.goals.filter((g) => g.userId === userId);
  },

  async addGoal(goal: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>): Promise<Goal> {
    const created = mockStore.addGoal(goal);
    if (isFirebaseConfigured && db && auth?.currentUser) {
      try {
        await setDoc(doc(db, 'goals', created.id), {
          ...stripUndefined(created as unknown as Record<string, unknown>),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `goals/${created.id}`);
      }
    }
    return created;
  },

  async updateGoalProgress(goalId: string, progress: number) {
    mockStore.updateGoalProgress(goalId, progress);
    if (isFirebaseConfigured && db && auth?.currentUser) {
      const clamped = Math.min(100, Math.max(0, progress));
      try {
        await updateDoc(doc(db, 'goals', goalId), {
          progress: clamped,
          completed: clamped === 100,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `goals/${goalId}`);
      }
    }
  },

  getQuestions(circleId?: string): Question[] {
    if (circleId) return mockStore.questions.filter((q) => q.circleId === circleId);
    return mockStore.questions;
  },

  async addQuestion(q: Omit<Question, 'id' | 'createdAt' | 'isModerated'>): Promise<Question> {
    const created = mockStore.addQuestion(q);
    if (isFirebaseConfigured && db && auth?.currentUser) {
      try {
        await setDoc(doc(db, 'questions', created.id), {
          ...stripUndefined(created as unknown as Record<string, unknown>),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `questions/${created.id}`);
      }
    }
    return created;
  },

  async replyToQuestion(questionId: string, reply: string, mentorName: string) {
    mockStore.replyToQuestion(questionId, reply, mentorName);
    if (isFirebaseConfigured && db && auth?.currentUser) {
      try {
        await updateDoc(doc(db, 'questions', questionId), {
          mentorReply: reply,
          repliedByMentorName: mentorName,
          repliedAt: new Date().toISOString(),
          isModerated: true,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `questions/${questionId}`);
      }
    }
  },

  // ------------------------------------------------------------------
  // Guardian Links & Versioned Consent
  // ------------------------------------------------------------------
  getGuardianLinks(guardianUid?: string): GuardianLink[] {
    if (guardianUid) return mockStore.guardianLinks.filter((l) => l.guardianId === guardianUid);
    return mockStore.guardianLinks;
  },

  getConsentRecords(boyUid?: string): ConsentRecord[] {
    if (boyUid) return mockStore.consentRecords.filter((c) => c.boyId === boyUid);
    return mockStore.consentRecords;
  },

  async requestGuardianLink(
    guardianUid: string,
    boyIdentifier: string,
    relationship: GuardianLink['relationship'],
    verificationMethod: GuardianVerificationMethod = 'child_code_confirmation',
    authorityEvidence = 'Child verification code challenge pending'
  ) {
    const cloudRes = await tryCallable<
      {
        boyEmailOrUid: string;
        relationship: GuardianLink['relationship'];
        verificationMethod: GuardianVerificationMethod;
        authorityEvidence: string;
      },
      { linkId: string; verificationCode: string; boyId: string }
    >('requestGuardianLink', {
      boyEmailOrUid: boyIdentifier,
      relationship,
      verificationMethod,
      authorityEvidence,
    });

    if (cloudRes) {
      if (isDemoModeEnabled) {
        return mockStore.requestGuardianLink(guardianUid, boyIdentifier, relationship, verificationMethod, authorityEvidence);
      }
      const link: GuardianLink = {
        id: cloudRes.linkId,
        guardianId: guardianUid,
        guardianName: mockStore.users[guardianUid]?.fullName || 'Guardian',
        boyId: cloudRes.boyId,
        boyName: 'Pending Verification',
        relationship,
        verificationCode: cloudRes.verificationCode,
        verificationMethod,
        authorityEvidence,
        status: 'pending_verification',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: guardianUid,
      };
      mockStore.guardianLinks.unshift(link);
      mockStore.notifyExternalSubscribers();
      return link;
    }

    if (isDemoModeEnabled) {
      return mockStore.requestGuardianLink(guardianUid, boyIdentifier, relationship, verificationMethod, authorityEvidence);
    }

    // Live Firestore fallback when caller knows the boy UID directly
    if (isFirebaseConfigured && db && auth?.currentUser) {
      const cleanId = boyIdentifier.trim();
      if (!/^[A-Za-z0-9_-]{4,128}$/.test(cleanId) || cleanId.includes('@')) {
        throw new Error(
          'In live mode without Cloud Functions, enter the child member UID directly (copied from the Member Hub) to initiate verification.'
        );
      }
      const code = `BCA-${Math.floor(100000 + Math.random() * 900000)}`;
      const linkId = `${guardianUid}_${cleanId}`;
      const link: GuardianLink = {
        id: linkId,
        guardianId: guardianUid,
        guardianName: auth.currentUser.displayName || 'Guardian',
        boyId: cleanId,
        boyName: 'Child Member (Pending Verification)',
        relationship,
        verificationCode: code,
        verificationMethod,
        authorityEvidence,
        status: 'pending_verification',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: guardianUid,
      };
      try {
        await setDoc(doc(db, 'guardianLinks', linkId), {
          ...stripUndefined(link as unknown as Record<string, unknown>),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        mockStore.guardianLinks.unshift(link);
        mockStore.notifyExternalSubscribers();
        return link;
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `guardianLinks/${linkId}`);
      }
    }
    throw new Error('Unable to request guardian link.');
  },

  async verifyGuardianLink(linkId: string, code: string) {
    if (isDemoModeEnabled) {
      mockStore.verifyGuardianLink(linkId, code);
      return;
    }
    const cloudRes = await tryCallable('verifyGuardianLink', { linkId, verificationCode: code });
    if (!cloudRes && isFirebaseConfigured && db && auth?.currentUser) {
      try {
        await updateDoc(doc(db, 'guardianLinks', linkId), {
          status: 'verified',
          verificationCode: code.trim(),
          verifiedBy: auth.currentUser.displayName || auth.currentUser.uid,
          verifiedAt: new Date().toISOString(),
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `guardianLinks/${linkId}`);
      }
    }
  },

  async approveGuardianConsent(
    boyUid: string,
    guardianUid: string,
    verificationMethod: GuardianVerificationMethod = 'child_code_confirmation',
    authorityEvidence = 'Verified Guardian Link & Safeguarding Attestation'
  ) {
    if (isDemoModeEnabled) {
      mockStore.approveGuardianConsent(boyUid, guardianUid, '2026.1', verificationMethod, authorityEvidence);
      return;
    }
    const cloudRes = await tryCallable('submitGuardianConsent', {
      boyId: boyUid,
      consentVersion: '2026.1',
      method:
        verificationMethod === 'guardian_sms_otp'
          ? 'sms_otp'
          : verificationMethod === 'coordinator_id_check'
          ? 'coordinator_verified'
          : 'guardian_portal',
      verificationMethod,
      authorityEvidence,
    });
    if (!cloudRes && isFirebaseConfigured && db && auth?.currentUser) {
      const consentId = `consent_${Date.now()}`;
      try {
        await setDoc(doc(db, 'consentRecords', consentId), {
          id: consentId,
          boyId: boyUid,
          guardianId: guardianUid,
          guardianName: auth.currentUser.displayName || 'Guardian',
          action: 'granted',
          consentVersion: '2026.1',
          method:
            verificationMethod === 'guardian_sms_otp'
              ? 'sms_otp'
              : verificationMethod === 'coordinator_id_check'
              ? 'coordinator_verified'
              : 'guardian_portal',
          verificationMethod,
          authorityEvidence: authorityEvidence.trim(),
          createdAt: serverTimestamp(),
          createdBy: guardianUid,
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `consentRecords/${consentId}`);
      }
    }
  },

  async withdrawGuardianConsent(boyUid: string, guardianUid: string, reason: string) {
    if (isDemoModeEnabled) {
      mockStore.withdrawGuardianConsent(boyUid, guardianUid, reason);
      return;
    }
    const cloudRes = await tryCallable('withdrawGuardianConsent', { boyId: boyUid, reason });
    if (!cloudRes && isFirebaseConfigured && db && auth?.currentUser) {
      const consentId = `consent_${Date.now()}`;
      try {
        await setDoc(doc(db, 'consentRecords', consentId), {
          id: consentId,
          boyId: boyUid,
          guardianId: guardianUid,
          guardianName: auth.currentUser.displayName || 'Guardian',
          action: 'withdrawn',
          consentVersion: '2026.1',
          method: 'guardian_portal',
          verificationMethod: 'guardian_sms_otp',
          authorityEvidence: 'Verified Guardian Portal Session',
          reason,
          createdAt: serverTimestamp(),
          createdBy: guardianUid,
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `consentRecords/${consentId}`);
      }
    }
  },

  verifyMembershipCard(cardOrToken: string): MembershipVerificationRecord | null {
    return mockStore.verifyMembershipCard(cardOrToken);
  },

  async verifyMembershipCardAsync(cardOrToken: string): Promise<MembershipVerificationRecord | null> {
    const clean = cardOrToken.trim().toUpperCase();
    if (!clean) return null;
    if (isFirebaseConfigured && db) {
      try {
        const snap = await getDoc(doc(db, 'membershipVerifications', clean));
        if (snap.exists()) {
          return normalizeDoc<MembershipVerificationRecord>(snap.id, snap.data());
        }
      } catch (err) {
        console.warn('Firestore card lookup fallback:', err);
      }
    }
    return isDemoModeEnabled ? mockStore.verifyMembershipCard(clean) : null;
  },

  getEventRegistrations(eventId?: string): EventRegistration[] {
    if (eventId) return mockStore.eventRegistrations.filter((r) => r.eventId === eventId);
    return mockStore.eventRegistrations;
  },

  async registerForEvent(
    eventId: string,
    payload: { userId?: string; attendeeName: string; attendeeEmail?: string; attendeeRole?: UserRole | 'guest'; district: string }
  ): Promise<EventRegistration> {
    const reg = mockStore.registerForEvent(eventId, payload);
    const cloudRes = await tryCallable('registerForEvent', {
      eventId,
      attendeeName: payload.attendeeName,
      attendeeEmail: payload.attendeeEmail,
      district: payload.district,
    });
    if (!cloudRes && isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'eventRegistrations', reg.id), {
          ...stripUndefined({
            id: reg.id,
            eventId: reg.eventId,
            userId: reg.userId || auth?.currentUser?.uid || null,
            attendeeName: reg.attendeeName,
            attendeeEmail: reg.attendeeEmail || null,
            attendeeRole: reg.attendeeRole,
            district: reg.district,
            confirmationCode: reg.confirmationCode,
            attendanceStatus: 'registered',
            registeredAt: reg.registeredAt,
          }),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `eventRegistrations/${reg.id}`);
      }
    }
    return reg;
  },

  async recordEventAttendance(registrationId: string, attendanceStatus: EventRegistration['attendanceStatus']) {
    mockStore.recordEventAttendance(registrationId, attendanceStatus);
    const cloudRes = await tryCallable('recordEventAttendance', { registrationId, attendanceStatus });
    if (!cloudRes && isFirebaseConfigured && db && auth?.currentUser) {
      try {
        await updateDoc(doc(db, 'eventRegistrations', registrationId), {
          attendanceStatus,
          markedBy: auth.currentUser.displayName || auth.currentUser.uid,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `eventRegistrations/${registrationId}`);
      }
    }
  },

  // ------------------------------------------------------------------
  // Membership, Mentor & Partner Applications
  // ------------------------------------------------------------------
  getMembershipApplications(): MembershipApplication[] {
    return mockStore.membershipApplications;
  },

  async submitMembershipApplication(
    app: Omit<MembershipApplication, 'id' | 'status' | 'createdAt' | 'updatedAt' | 'createdBy'>
  ) {
    const created = mockStore.addMembershipApplication(app);
    const cloudRes = await tryCallable('submitMembershipApplication', app);
    if (!cloudRes && isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'membershipApplications', created.id), {
          ...stripUndefined(created as unknown as Record<string, unknown>),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `membershipApplications/${created.id}`);
      }
    }
    return created;
  },

  async reviewMembershipApplication(appId: string, decision: 'approved' | 'rejected') {
    mockStore.reviewMembershipApplication(appId, decision);
    const cloudRes = await tryCallable('approveMembershipApplication', { applicationId: appId, decision });
    if (!cloudRes && isFirebaseConfigured && db && auth?.currentUser) {
      try {
        await updateDoc(doc(db, 'membershipApplications', appId), {
          status: decision,
          reviewedBy: auth.currentUser.uid,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `membershipApplications/${appId}`);
      }
    }
  },

  getMentorApplications(): MentorApplication[] {
    return mockStore.mentorApplications;
  },

  getMentorReferees(appId?: string) {
    if (appId) return mockStore.mentorReferees.filter((r) => r.applicationId === appId);
    return mockStore.mentorReferees;
  },

  async submitMentorApplication(
    app: Omit<MentorApplication, 'id' | 'status' | 'dbsSafeguardingCheck' | 'createdAt' | 'referee1' | 'referee2'> & {
      referee1Name: string;
      referee1Phone: string;
      referee2Name: string;
      referee2Phone: string;
    }
  ): Promise<MentorApplication> {
    const created = mockStore.addMentorApplication(app);
    const cloudRes = await tryCallable('submitMentorApplication', {
      fullName: app.fullName,
      email: app.email,
      phone: app.phone,
      district: app.district,
      occupation: app.occupation,
      motivation: app.motivation,
      availability: app.availability,
      referee1Name: app.referee1Name,
      referee1Phone: app.referee1Phone,
      referee2Name: app.referee2Name,
      referee2Phone: app.referee2Phone,
    });
    if (!cloudRes && isFirebaseConfigured && db) {
      try {
        const batch = writeBatch(db);
        batch.set(doc(db, 'mentorApplications', created.id), {
          ...stripUndefined(created as unknown as Record<string, unknown>),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        const refs = mockStore.mentorReferees.filter((r) => r.applicationId === created.id);
        for (const r of refs) {
          batch.set(doc(db, 'mentorReferees', r.id), {
            ...stripUndefined(r as unknown as Record<string, unknown>),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
        await batch.commit();
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `mentorApplications/${created.id}`);
      }
    }
    return created;
  },

  async verifyReferee(appId: string, refereeIndex: 1 | 2, status: 'verified' | 'flagged') {
    mockStore.verifyReferee(appId, refereeIndex, status);
    const cloudRes = await tryCallable('verifyMentorReferee', {
      refereeId: `${appId}_ref${refereeIndex}`,
      status,
    });
    if (!cloudRes && isFirebaseConfigured && db && auth?.currentUser) {
      try {
        await updateDoc(doc(db, 'mentorReferees', `${appId}_ref${refereeIndex}`), {
          status,
          verifiedBy: auth.currentUser.displayName || auth.currentUser.uid,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `mentorReferees/${appId}_ref${refereeIndex}`);
      }
    }
  },

  async vetMentor(appId: string, approved: boolean) {
    mockStore.vetMentor(appId, approved);
    const cloudRes = await tryCallable('approveMentorApplication', {
      applicationId: appId,
      decision: approved ? 'approved' : 'declined',
    });
    if (!cloudRes && isFirebaseConfigured && db && auth?.currentUser) {
      try {
        await updateDoc(doc(db, 'mentorApplications', appId), {
          status: approved ? 'approved' : 'declined',
          dbsSafeguardingCheck: approved ? 'cleared' : 'flagged',
          vettedBy: auth.currentUser.uid,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `mentorApplications/${appId}`);
      }
    }
  },

  getPartners(): PartnerOrganisation[] {
    return mockStore.partners;
  },

  getPartnerApplications(): PartnerApplication[] {
    return mockStore.partnerApplications;
  },

  async submitPartnerApplication(app: Omit<PartnerApplication, 'id' | 'status' | 'createdAt' | 'updatedAt'>) {
    const created = mockStore.submitPartnerProposal(app);
    const cloudRes = await tryCallable('submitPartnerApplication', app);
    if (!cloudRes && isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'partnerApplications', created.id), {
          ...stripUndefined(created as unknown as Record<string, unknown>),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `partnerApplications/${created.id}`);
      }
    }
    return created;
  },

  async reviewPartnerApplication(appId: string, decision: 'approved' | 'declined') {
    mockStore.reviewPartnerApplication(appId, decision);
    const cloudRes = await tryCallable('approvePartnerApplication', { applicationId: appId, decision });
    if (!cloudRes && isFirebaseConfigured && db && auth?.currentUser) {
      try {
        await updateDoc(doc(db, 'partnerApplications', appId), {
          status: decision,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `partnerApplications/${appId}`);
      }
    }
  },

  // ------------------------------------------------------------------
  // Contact Messages
  // ------------------------------------------------------------------
  getContactMessages(): ContactMessage[] {
    return mockStore.contactMessages;
  },

  async submitContactMessage(
    msg: Omit<ContactMessage, 'id' | 'status' | 'createdAt' | 'updatedAt'>
  ): Promise<ContactMessage> {
    const created = mockStore.addContactMessage(msg);
    const cloudRes = await tryCallable('submitContactMessage', msg);
    if (!cloudRes && isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'contactMessages', created.id), {
          id: created.id,
          fullName: created.fullName,
          email: created.email,
          phone: created.phone,
          subject: created.subject,
          message: created.message,
          status: 'new',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `contactMessages/${created.id}`);
      }
    }
    return created;
  },

  async updateContactMessageStatus(msgId: string, status: ContactMessage['status'], handledBy?: string) {
    mockStore.updateContactMessageStatus(msgId, status, handledBy);
    if (isFirebaseConfigured && db && auth?.currentUser) {
      try {
        await updateDoc(doc(db, 'contactMessages', msgId), {
          status,
          ...(handledBy ? { handledBy } : {}),
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `contactMessages/${msgId}`);
      }
    }
  },

  // ------------------------------------------------------------------
  // Admin, DPPA Data Protection & Notifications
  // ------------------------------------------------------------------
  async assignUserRole(targetUid: string, newRole: UserRole, safeguardingCleared?: boolean) {
    mockStore.assignUserRole(targetUid, newRole, safeguardingCleared);
    const cloudRes = await tryCallable('assignUserRole', { targetUid, newRole, safeguardingCleared });
    if (!cloudRes && isFirebaseConfigured && db && auth?.currentUser) {
      const cleared = newRole === 'admin' ? true : Boolean(safeguardingCleared);
      try {
        await updateDoc(doc(db, 'users', targetUid), {
          role: newRole,
          safeguardingCleared: cleared,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${targetUid}`);
      }
    }
  },

  async suspendUser(targetUid: string, suspend: boolean, reason: string) {
    mockStore.suspendUser(targetUid, suspend, reason);
    const cloudRes = await tryCallable('suspendUserAccount', { targetUid, suspend, reason });
    if (!cloudRes && isFirebaseConfigured && db && auth?.currentUser) {
      try {
        await updateDoc(doc(db, 'users', targetUid), {
          status: suspend ? 'suspended' : 'active',
          suspensionReason: suspend ? reason : null,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${targetUid}`);
      }
    }
  },

  getDppaRequests(): DppaRequest[] {
    return mockStore.dppaRequests;
  },

  async reviewDppaRequest(requestId: string, status: DppaRequest['status'], resolutionNotes?: string) {
    mockStore.reviewDppaRequest(requestId, status, resolutionNotes);
    const cloudRes = await tryCallable('reviewDppaRequest', { requestId, status, resolutionNotes });
    if (!cloudRes && isFirebaseConfigured && db && auth?.currentUser) {
      try {
        await updateDoc(doc(db, 'dataProtectionRequests', requestId), {
          status,
          reviewedBy: auth.currentUser.displayName || auth.currentUser.uid,
          reviewedAt: new Date().toISOString(),
          ...(resolutionNotes ? { resolutionNotes } : {}),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `dataProtectionRequests/${requestId}`);
      }
    }
  },

  exportMyData(userId: string) {
    tryCallable('exportUserData', { targetUid: userId });
    mockStore.addDppaRequest(userId, 'export', 'User downloaded DPPA personal record archive.');
    return {
      exportedAt: new Date().toISOString(),
      user: mockStore.users[userId] || null,
      memberProfile: mockStore.memberProfiles[userId] || null,
      goals: mockStore.goals.filter((g) => g.userId === userId),
      attendance: mockStore.attendance.filter((a) => a.memberId === userId),
      consentRecords: mockStore.consentRecords.filter((c) => c.boyId === userId || c.guardianId === userId),
    };
  },

  async requestDppaAction(userId: string, type: DppaRequest['type'], reason: string) {
    const req = mockStore.addDppaRequest(userId, type, reason);
    const cloudRes =
      type === 'deletion'
        ? await tryCallable('requestAccountDeletion', { targetUid: userId, reason })
        : null;
    if (!cloudRes && isFirebaseConfigured && db && auth?.currentUser) {
      try {
        await setDoc(doc(db, 'dataProtectionRequests', req.id), {
          id: req.id,
          userId,
          userName: req.userName,
          type,
          reason,
          status: 'pending',
          createdAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `dataProtectionRequests/${req.id}`);
      }
    }
    return req;
  },

  async subscribeNewsletter(email: string, district = 'Kampala'): Promise<void> {
    await tryCallable('subscribeNewsletter', { email, consentGiven: true, district });
    if (isFirebaseConfigured && db) {
      const subId = `sub_${Date.now()}`;
      try {
        await setDoc(doc(db, 'newsletterSubscribers', subId), {
          email: email.toLowerCase(),
          district,
          consentGiven: true,
          createdAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `newsletterSubscribers/${subId}`);
      }
    }
  },

  getNotifications(userId: string): AppNotification[] {
    return mockStore.notifications.filter((n) => n.userId === userId);
  },

  async markNotificationRead(notifId: string) {
    mockStore.markNotificationRead(notifId);
    if (isFirebaseConfigured && db && auth?.currentUser) {
      try {
        await updateDoc(doc(db, 'notifications', notifId), { read: true });
      } catch (err) {
        console.warn('Notification read sync skipped:', err);
      }
    }
  },

  getAuditLogs(): AuditLogEntry[] {
    return mockStore.auditLogs;
  },
};

export async function runOneShotHealthQuery(): Promise<number> {
  if (!isFirebaseConfigured || !db) return 0;
  try {
    const snap = await getDocs(query(collection(db, 'programmes'), where('status', '==', 'published')));
    return snap.size;
  } catch {
    return 0;
  }
}
