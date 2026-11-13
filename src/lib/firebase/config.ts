import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, Firestore, doc, getDocFromServer } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getFunctions, Functions } from 'firebase/functions';
import { initializeAppCheck, ReCaptchaEnterpriseProvider, AppCheck } from 'firebase/app-check';
import { getAnalytics, isSupported as isAnalyticsSupported, Analytics } from 'firebase/analytics';
import appletConfig from '../../../firebase-applet-config.json';

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || appletConfig.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || appletConfig.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || appletConfig.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || appletConfig.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || appletConfig.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || appletConfig.appId,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || appletConfig.measurementId,
  firestoreDatabaseId:
    import.meta.env.VITE_FIREBASE_DATABASE_ID || appletConfig.firestoreDatabaseId || '(default)',
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    firebaseConfig.apiKey !== 'MY_FIREBASE_API_KEY'
);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;
let functions: Functions | null = null;
let appCheck: AppCheck | null = null;
let analytics: Analytics | null = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    // CRITICAL: Connect to the named Firestore database ID from firebase-applet-config.json
    db =
      firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
        ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
        : getFirestore(app);
    storage = getStorage(app);
    functions = getFunctions(app);

    if (typeof window !== 'undefined') {
      isAnalyticsSupported()
        .then((supported) => {
          if (supported && app) {
            try {
              analytics = getAnalytics(app);
            } catch (err) {
              console.warn('Firebase Analytics skipped:', err);
            }
          }
        })
        .catch(() => {
          // Analytics unsupported in restricted environments
        });
    }

    const recaptchaSiteKey =
      import.meta.env.VITE_FIREBASE_RECAPTCHA_SITE_KEY || appletConfig.recaptchaSiteKey;
    if (recaptchaSiteKey && typeof window !== 'undefined') {
      try {
        appCheck = initializeAppCheck(app, {
          provider: new ReCaptchaEnterpriseProvider(recaptchaSiteKey),
          isTokenAutoRefreshEnabled: true,
        });
      } catch (err) {
        console.warn('App Check skipped in local preview:', err);
      }
    }
  } catch (error) {
    console.error('Error initializing Firebase SDK:', error);
  }
}

export async function testFirestoreConnection(): Promise<boolean> {
  if (!db) return false;
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore appears offline or unreachable; continuing gracefully.');
    }
    return false;
  }
}

export const googleProvider = new GoogleAuthProvider();
export { app, auth, db, storage, functions, appCheck, analytics };
