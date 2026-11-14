import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, GoogleAuthProvider, connectAuthEmulator } from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  Firestore,
  doc,
  getDocFromServer,
  enableNetwork,
  connectFirestoreEmulator,
} from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getFunctions, Functions } from 'firebase/functions';
import { initializeAppCheck, ReCaptchaEnterpriseProvider, AppCheck } from 'firebase/app-check';
import { getAnalytics, isSupported as isAnalyticsSupported, Analytics } from 'firebase/analytics';
import appletConfig from '../../../firebase-applet-config.json';

export const firebaseConfig = {
  apiKey: (import.meta.env.VITE_FIREBASE_API_KEY || appletConfig.apiKey || '').trim(),
  authDomain: (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || appletConfig.authDomain || '').trim(),
  projectId: (import.meta.env.VITE_FIREBASE_PROJECT_ID || appletConfig.projectId || '').trim(),
  storageBucket: (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || appletConfig.storageBucket || '').trim(),
  messagingSenderId: (
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ||
    appletConfig.messagingSenderId ||
    ''
  ).trim(),
  appId: (import.meta.env.VITE_FIREBASE_APP_ID || appletConfig.appId || '').trim(),
  measurementId: (import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || appletConfig.measurementId || '').trim(),
  firestoreDatabaseId: (
    import.meta.env.VITE_FIREBASE_DATABASE_ID ||
    appletConfig.firestoreDatabaseId ||
    '(default)'
  ).trim(),
};

export interface FirebaseConfigValidation {
  valid: boolean;
  issues: string[];
  projectId: string;
  databaseId: string;
}

export function validateFirebaseConfig(cfg = firebaseConfig): FirebaseConfigValidation {
  const issues: string[] = [];
  if (!cfg.apiKey || cfg.apiKey === 'MY_FIREBASE_API_KEY') {
    issues.push('Missing or placeholder Firebase API key.');
  }
  if (!cfg.authDomain) {
    issues.push('Missing Firebase authDomain.');
  }
  if (!cfg.projectId || cfg.projectId === 'remixed-project-id') {
    issues.push('Missing or placeholder Firebase projectId.');
  }
  if (!cfg.storageBucket) {
    issues.push('Missing Firebase storageBucket.');
  }
  if (!cfg.appId) {
    issues.push('Missing Firebase appId.');
  }
  if (!cfg.firestoreDatabaseId) {
    issues.push('Missing Firestore databaseId.');
  }
  return {
    valid: issues.length === 0,
    issues,
    projectId: cfg.projectId,
    databaseId: cfg.firestoreDatabaseId,
  };
}

export const firebaseValidation = validateFirebaseConfig(firebaseConfig);
export const isFirebaseConfigured = firebaseValidation.valid;

export const isEmulatorEnabled =
  import.meta.env.DEV &&
  import.meta.env.MODE !== 'test' &&
  import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true';

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;
let functions: Functions | null = null;
let appCheck: AppCheck | null = null;
let analytics: Analytics | null = null;
let appCheckStatus: 'unconfigured' | 'initialized' | 'error' = 'unconfigured';
let emulatorConnected = false;

function initFirestoreSingleton(firebaseApp: FirebaseApp, databaseId: string): Firestore {
  const targetDbId = databaseId && databaseId !== '(default)' ? databaseId : undefined;
  try {
    // experimentalAutoDetectLongPolling prevents silent "client is offline" errors
    // when WebChannel HTTP/2 streaming is blocked in iframes, proxies, or mobile networks.
    return initializeFirestore(
      firebaseApp,
      {
        experimentalAutoDetectLongPolling: true,
      },
      targetDbId
    );
  } catch {
    return targetDbId ? getFirestore(firebaseApp, targetDbId) : getFirestore(firebaseApp);
  }
}

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = initFirestoreSingleton(app, firebaseConfig.firestoreDatabaseId);
    storage = getStorage(app);
    functions = getFunctions(app);

    if (isEmulatorEnabled && !emulatorConnected && import.meta.env.MODE !== 'test') {
      try {
        connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
        connectFirestoreEmulator(db, '127.0.0.1', 8080);
        emulatorConnected = true;
      } catch (emuErr) {
        console.warn('Explicit Firebase emulator connection skipped:', emuErr);
      }
    }

    if (typeof window !== 'undefined' && import.meta.env.MODE !== 'test') {
      isAnalyticsSupported()
        .then((supported) => {
          if (supported && app) {
            try {
              analytics = getAnalytics(app);
            } catch {
              // Analytics skipped in restricted preview contexts
            }
          }
        })
        .catch(() => {
          // Analytics unsupported in restricted environments
        });
    }

    const recaptchaSiteKey = (
      import.meta.env.VITE_FIREBASE_RECAPTCHA_SITE_KEY ||
      appletConfig.recaptchaSiteKey ||
      ''
    ).trim();

    if (recaptchaSiteKey && typeof window !== 'undefined' && import.meta.env.MODE !== 'test') {
      try {
        appCheck = initializeAppCheck(app, {
          provider: new ReCaptchaEnterpriseProvider(recaptchaSiteKey),
          isTokenAutoRefreshEnabled: true,
        });
        appCheckStatus = 'initialized';
      } catch {
        appCheckStatus = 'error';
      }
    }
  } catch (error) {
    console.error('Error initializing Firebase SDK:', error);
  }
}

export async function ensureFirestoreNetworkEnabled(): Promise<void> {
  if (!db) return;
  try {
    await enableNetwork(db);
  } catch {
    // Ignore transient errors while bringing network back online
  }
}

export function getFirebaseDiagnosticSnapshot() {
  return {
    configured: isFirebaseConfigured,
    configIssues: firebaseValidation.issues,
    projectId: firebaseConfig.projectId,
    databaseId: firebaseConfig.firestoreDatabaseId,
    appCheckStatus,
    emulatorActive: emulatorConnected,
  };
}

export async function testFirestoreConnection(): Promise<boolean> {
  if (!db || !isFirebaseConfigured) return false;
  try {
    await ensureFirestoreNetworkEnabled();
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch {
    return false;
  }
}

export const googleProvider = new GoogleAuthProvider();
export { app, auth, db, storage, functions, appCheck, analytics };
