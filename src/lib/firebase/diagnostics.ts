import { doc, getDocFromServer } from 'firebase/firestore';
import { db, ensureFirestoreNetworkEnabled, isFirebaseConfigured, firebaseValidation } from './config';

export type FirestoreConnectivityState =
  | 'checking'
  | 'connected'
  | 'unreachable'
  | 'permission_denied'
  | 'unauthenticated'
  | 'misconfigured';

export type FirestoreErrorCategory =
  | 'unavailable'
  | 'permission-denied'
  | 'unauthenticated'
  | 'not-found'
  | 'invalid-argument'
  | 'failed-precondition'
  | 'misconfigured'
  | 'unknown';

export interface ClassifiedFirestoreError {
  category: FirestoreErrorCategory;
  connectivityState: FirestoreConnectivityState;
  retryable: boolean;
  diagnosticRef: string;
  userMessage: string;
}

export interface FirestoreDiagnosticResult {
  reachable: boolean;
  state: FirestoreConnectivityState;
  latencyMs: number;
  diagnosticRef: string;
  userMessage: string;
}

export function extractFirebaseErrorCode(err: unknown): string {
  if (err && typeof err === 'object') {
    const maybeCode = (err as { code?: unknown }).code;
    if (typeof maybeCode === 'string' && maybeCode.trim()) {
      return maybeCode.trim().toLowerCase();
    }
  }
  const msg = err instanceof Error ? err.message : String(err || '');
  const lower = msg.toLowerCase();

  if (
    lower.includes('client is offline') ||
    lower.includes('network-request-failed') ||
    lower.includes('unavailable') ||
    lower.includes('deadline-exceeded')
  ) {
    return 'unavailable';
  }
  if (lower.includes('permission-denied') || lower.includes('insufficient permissions')) {
    return 'permission-denied';
  }
  if (lower.includes('unauthenticated')) {
    return 'unauthenticated';
  }
  if (lower.includes('not-found')) {
    return 'not-found';
  }
  if (lower.includes('invalid-argument')) {
    return 'invalid-argument';
  }
  if (lower.includes('failed-precondition')) {
    return 'failed-precondition';
  }
  return 'unknown';
}

export function classifyFirestoreError(err: unknown): ClassifiedFirestoreError {
  if (!isFirebaseConfigured || !firebaseValidation.valid) {
    return {
      category: 'misconfigured',
      connectivityState: 'misconfigured',
      retryable: false,
      diagnosticRef: 'BCA-CFG-INVALID',
      userMessage:
        'Firebase database configuration is incomplete for this environment. Please contact your system administrator.',
    };
  }

  const rawCode = extractFirebaseErrorCode(err);
  const normalized = rawCode.replace(/^firestore\//, '').replace(/^functions\//, '');

  switch (normalized) {
    case 'unavailable':
    case 'deadline-exceeded':
    case 'aborted':
    case 'resource-exhausted':
      return {
        category: 'unavailable',
        connectivityState: 'unreachable',
        retryable: true,
        diagnosticRef: 'BCA-NET-UNAVAILABLE',
        userMessage:
          'Your account has been authenticated, but we could not reach the BCA database server. Please check your connection and try again.',
      };
    case 'permission-denied':
      return {
        category: 'permission-denied',
        connectivityState: 'permission_denied',
        retryable: false,
        diagnosticRef: 'BCA-PERM-DENIED',
        userMessage:
          'Your account was authenticated, but access to this profile record was denied by security rules.',
      };
    case 'unauthenticated':
      return {
        category: 'unauthenticated',
        connectivityState: 'unauthenticated',
        retryable: false,
        diagnosticRef: 'BCA-AUTH-REQUIRED',
        userMessage:
          'Your authentication session expired or could not be verified. Please sign in again.',
      };
    case 'not-found':
      return {
        category: 'not-found',
        connectivityState: 'connected',
        retryable: false,
        diagnosticRef: 'BCA-PROFILE-MISSING',
        userMessage:
          'Your account has been authenticated, and your BCA profile record is being initialized.',
      };
    case 'invalid-argument':
      return {
        category: 'invalid-argument',
        connectivityState: 'misconfigured',
        retryable: false,
        diagnosticRef: 'BCA-REQ-INVALID',
        userMessage:
          'A database configuration or request parameter could not be validated. Please contact support.',
      };
    case 'failed-precondition':
      return {
        category: 'failed-precondition',
        connectivityState: 'unreachable',
        retryable: true,
        diagnosticRef: 'BCA-DB-PRECONDITION',
        userMessage:
          'The BCA database is completing setup or network synchronization. Please retry in a moment.',
      };
    default:
      return {
        category: 'unknown',
        connectivityState: 'unreachable',
        retryable: true,
        diagnosticRef: 'BCA-PROFILE-SYNC',
        userMessage:
          'Your account has been authenticated, but we could not load your BCA profile. Please check your connection and try again.',
      };
  }
}

export function mapAuthErrorToUserMessage(err: unknown): {
  message: string;
  diagnosticRef: string;
} {
  if (err && typeof err === 'object') {
    const code = String((err as { code?: unknown }).code || '').toLowerCase();
    if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
      return {
        message: 'Invalid email address or password. Please check your credentials and try again.',
        diagnosticRef: 'BCA-AUTH-CREDENTIALS',
      };
    }
    if (code === 'auth/too-many-requests') {
      return {
        message: 'Too many sign-in attempts. Please wait a few minutes or reset your password.',
        diagnosticRef: 'BCA-AUTH-RATELIMIT',
      };
    }
    if (code === 'auth/email-already-in-use') {
      return {
        message: 'An account with this email address already exists. Please sign in instead.',
        diagnosticRef: 'BCA-AUTH-EXISTS',
      };
    }
    if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
      return {
        message: 'Google sign-in was cancelled before completion.',
        diagnosticRef: 'BCA-AUTH-CANCELLED',
      };
    }
    if (code === 'auth/network-request-failed') {
      return {
        message: 'Network connection interrupted during authentication. Please check your internet connection and retry.',
        diagnosticRef: 'BCA-NET-AUTH',
      };
    }
  }

  const rawMsg = err instanceof Error ? err.message : String(err || '');
  // Guard: never leak raw FirestoreErrorInfo JSON or authInfo payloads to users
  if (rawMsg.trim().startsWith('{') && rawMsg.includes('authInfo')) {
    const classified = classifyFirestoreError(err);
    return { message: classified.userMessage, diagnosticRef: classified.diagnosticRef };
  }

  if (rawMsg.toLowerCase().includes('suspended')) {
    return {
      message: 'This account has been suspended pending an administrative or safeguarding review.',
      diagnosticRef: 'BCA-ACCT-SUSPENDED',
    };
  }

  const classified = classifyFirestoreError(err);
  if (classified.category !== 'unknown') {
    return { message: classified.userMessage, diagnosticRef: classified.diagnosticRef };
  }

  return {
    message: rawMsg || 'Unable to complete authentication. Please verify your details and try again.',
    diagnosticRef: 'BCA-AUTH-ERROR',
  };
}

export async function runFirestoreConnectivityDiagnostic(
  probeFn?: () => Promise<unknown>
): Promise<FirestoreDiagnosticResult> {
  const start = Date.now();
  if (!isFirebaseConfigured || !db) {
    return {
      reachable: false,
      state: 'misconfigured',
      latencyMs: Date.now() - start,
      diagnosticRef: 'BCA-CFG-INVALID',
      userMessage: 'Firebase client configuration is missing or incomplete.',
    };
  }

  try {
    await ensureFirestoreNetworkEnabled();
    await (probeFn ? probeFn() : getDocFromServer(doc(db, 'test', 'connection')));
    return {
      reachable: true,
      state: 'connected',
      latencyMs: Date.now() - start,
      diagnosticRef: 'BCA-DB-ONLINE',
      userMessage: 'Connected to BCA Cloud Firestore.',
    };
  } catch (err) {
    const classified = classifyFirestoreError(err);
    return {
      reachable: false,
      state: classified.connectivityState,
      latencyMs: Date.now() - start,
      diagnosticRef: classified.diagnosticRef,
      userMessage: classified.userMessage,
    };
  }
}

export async function withFirestoreRetry<T>(
  operation: () => Promise<T>,
  options: { maxAttempts?: number; baseDelayMs?: number } = {}
): Promise<T> {
  const maxAttempts = options.maxAttempts ?? 3;
  const baseDelayMs = options.baseDelayMs ?? 300;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await operation();
    } catch (err) {
      lastError = err;
      const classified = classifyFirestoreError(err);
      if (!classified.retryable || attempt >= maxAttempts) {
        throw err;
      }
      await ensureFirestoreNetworkEnabled();
      const waitMs = baseDelayMs * Math.pow(2, attempt - 1);
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }
  }

  throw lastError;
}
