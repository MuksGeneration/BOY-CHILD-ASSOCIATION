import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { initializeAppCheck, ReCaptchaEnterpriseProvider, AppCheck } from 'firebase/app-check';
import { getAnalytics, isSupported as isAnalyticsSupported, Analytics } from 'firebase/analytics';

// Client-side environment configuration with fallback defaults
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDi_V6W0ZVDiviL7CqeImd8ekv3dc5vXpw',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'boy-child-association-9a36f.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'boy-child-association-9a36f',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'boy-child-association-9a36f.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '600186815524',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:600186815524:web:3627de8914e21129ab44b1',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-T50E0E299X'
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
let appCheck: AppCheck | null = null;
let analytics: Analytics | null = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);

    // Initialise Analytics defensively (only when supported in browser environment)
    if (typeof window !== 'undefined') {
      isAnalyticsSupported().then((supported) => {
        if (supported && app) {
          try {
            analytics = getAnalytics(app);
          } catch (err) {
            console.warn('Firebase Analytics initialization skipped:', err);
          }
        }
      }).catch(() => {
        // Analytics unsupported (e.g. cookies disabled or sandboxed iframe)
      });
    }

    // Initialise App Check with reCAPTCHA Enterprise if key is provided
    const recaptchaSiteKey = import.meta.env.VITE_FIREBASE_RECAPTCHA_SITE_KEY;
    if (recaptchaSiteKey && typeof window !== 'undefined') {
      try {
        appCheck = initializeAppCheck(app, {
          provider: new ReCaptchaEnterpriseProvider(recaptchaSiteKey),
          isTokenAutoRefreshEnabled: true
        });
      } catch (err) {
        console.warn('App Check initialization failed or bypassed in dev environment:', err);
      }
    }
  } catch (error) {
    console.error('Error initializing Firebase SDK:', error);
  }
}

export const googleProvider = new GoogleAuthProvider();
export { app, auth, db, storage, appCheck, analytics };

