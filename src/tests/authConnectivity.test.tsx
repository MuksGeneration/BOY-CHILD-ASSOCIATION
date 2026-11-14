// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../hooks/useAuth';
import * as UseAuthModule from '../hooks/useAuth';
import { AuthPage, getPostAuthRoute } from '../features/auth/AuthPage';
import { ProtectedRoute } from '../App';
import { validateFirebaseConfig } from '../lib/firebase/config';
import {
  classifyFirestoreError,
  mapAuthErrorToUserMessage,
  withFirestoreRetry,
  runFirestoreConnectivityDiagnostic,
} from '../lib/firebase/diagnostics';
import { handleFirestoreError, OperationType } from '../lib/firebase/errors';
import { isDemoModeEnabled } from '../lib/firebase/firebase';
import { mockStore } from '../lib/firebase/mockStore';

function renderWithRouter(ui: React.ReactElement, initialEntries: string[] = ['/auth']) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <AuthProvider>
        <MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

afterEach(() => {
  vi.restoreAllMocks();
  cleanup();
  mockStore.switchUser('usr_boy_active');
});

describe('Firebase Configuration, Error Classification & Retry Resilience', () => {
  it('validates Firebase configuration and catches missing or placeholder settings', () => {
    const valid = validateFirebaseConfig({
      apiKey: 'AIzaTestKey123456',
      authDomain: 'bca-test.firebaseapp.com',
      projectId: 'bca-test',
      storageBucket: 'bca-test.appspot.com',
      messagingSenderId: '12345',
      appId: '1:12345:web:abc',
      measurementId: '',
      firestoreDatabaseId: 'bca-db',
    });
    expect(valid.valid).toBe(true);
    expect(valid.issues).toHaveLength(0);

    const invalid = validateFirebaseConfig({
      apiKey: 'MY_FIREBASE_API_KEY',
      authDomain: '',
      projectId: 'remixed-project-id',
      storageBucket: '',
      messagingSenderId: '',
      appId: '',
      measurementId: '',
      firestoreDatabaseId: '',
    });
    expect(invalid.valid).toBe(false);
    expect(invalid.issues.length).toBeGreaterThanOrEqual(5);
  });

  it('distinguishes unavailable, permission-denied, unauthenticated, not-found, invalid-argument, and failed-precondition errors', () => {
    const offlineErr = classifyFirestoreError(
      Object.assign(new Error('Failed to get document because the client is offline.'), { code: 'unavailable' })
    );
    expect(offlineErr.category).toBe('unavailable');
    expect(offlineErr.connectivityState).toBe('unreachable');
    expect(offlineErr.retryable).toBe(true);
    expect(offlineErr.diagnosticRef).toBe('BCA-NET-UNAVAILABLE');

    const permErr = classifyFirestoreError({ code: 'permission-denied', message: 'Missing or insufficient permissions.' });
    expect(permErr.category).toBe('permission-denied');
    expect(permErr.connectivityState).toBe('permission_denied');
    expect(permErr.retryable).toBe(false);

    const unauthErr = classifyFirestoreError({ code: 'unauthenticated', message: 'Token expired' });
    expect(unauthErr.category).toBe('unauthenticated');
    expect(unauthErr.connectivityState).toBe('unauthenticated');
    expect(unauthErr.retryable).toBe(false);

    const notFoundErr = classifyFirestoreError({ code: 'not-found', message: 'Document missing' });
    expect(notFoundErr.category).toBe('not-found');
    expect(notFoundErr.retryable).toBe(false);

    const invalidArgErr = classifyFirestoreError({ code: 'invalid-argument', message: 'Invalid field' });
    expect(invalidArgErr.category).toBe('invalid-argument');
    expect(invalidArgErr.retryable).toBe(false);

    const preconditionErr = classifyFirestoreError({ code: 'failed-precondition', message: 'Missing index' });
    expect(preconditionErr.category).toBe('failed-precondition');
    expect(preconditionErr.retryable).toBe(true);
  });

  it('strips legacy authInfo JSON dumps and UIDs from client error messages', () => {
    const leakedJson = JSON.stringify({
      error: 'Failed to get document because the client is offline.',
      operationType: 'get',
      path: 'users/uid_secret_123',
      authInfo: {
        userId: 'uid_secret_123',
        email: 'mukuladavid6@gmail.com',
        providerInfo: [{ providerId: 'password', email: 'mukuladavid6@gmail.com' }],
      },
    });
    const sanitized = mapAuthErrorToUserMessage(new Error(leakedJson));
    expect(sanitized.diagnosticRef).toBe('BCA-NET-UNAVAILABLE');
    expect(sanitized.message).not.toContain('authInfo');
    expect(sanitized.message).not.toContain('uid_secret_123');
    expect(sanitized.message).not.toContain('mukuladavid6@gmail.com');
    expect(sanitized.message).not.toContain('{');

    expect(() => {
      handleFirestoreError(
        Object.assign(new Error('Failed to get document because the client is offline.'), { code: 'unavailable' }),
        OperationType.GET,
        'users/test_uid'
      );
    }).toThrow(/Unable to reach the BCA database server/i);
  });

  it('retries transient unavailable Firestore failures with backoff and stops immediately on permission-denied', async () => {
    let attempts = 0;
    const result = await withFirestoreRetry(
      async () => {
        attempts += 1;
        if (attempts < 3) {
          throw Object.assign(new Error('Failed to get document because the client is offline.'), {
            code: 'unavailable',
          });
        }
        return 'ok';
      },
      { maxAttempts: 3, baseDelayMs: 5 }
    );
    expect(result).toBe('ok');
    expect(attempts).toBe(3);

    let permAttempts = 0;
    await expect(
      withFirestoreRetry(
        async () => {
          permAttempts += 1;
          throw Object.assign(new Error('Permission denied'), { code: 'permission-denied' });
        },
        { maxAttempts: 3, baseDelayMs: 5 }
      )
    ).rejects.toThrow(/Permission denied/);
    expect(permAttempts).toBe(1);
  });

  it('reports live diagnostic states cleanly via runFirestoreConnectivityDiagnostic', async () => {
    const healthy = await runFirestoreConnectivityDiagnostic(async () => ({ exists: () => false }));
    expect(healthy.reachable).toBe(true);
    expect(healthy.state).toBe('connected');
    expect(healthy.diagnosticRef).toBe('BCA-DB-ONLINE');

    const offline = await runFirestoreConnectivityDiagnostic(async () => {
      throw Object.assign(new Error('Failed to get document because the client is offline.'), { code: 'unavailable' });
    });
    expect(offline.reachable).toBe(false);
    expect(offline.state).toBe('unreachable');
    expect(offline.diagnosticRef).toBe('BCA-NET-UNAVAILABLE');

    const denied = await runFirestoreConnectivityDiagnostic(async () => {
      throw Object.assign(new Error('Missing or insufficient permissions.'), { code: 'permission-denied' });
    });
    expect(denied.reachable).toBe(false);
    expect(denied.state).toBe('permission_denied');
    expect(denied.diagnosticRef).toBe('BCA-PERM-DENIED');
  });
});

describe('Role-Based Routing, Recovery UI & Pending Account RBAC', () => {
  it('routes every active role to its designated portal and holds pending accounts in /hub', () => {
    expect(getPostAuthRoute({ role: 'admin', status: 'active' })).toBe('/admin');
    expect(getPostAuthRoute({ role: 'coordinator', status: 'active' })).toBe('/coordinator');
    expect(getPostAuthRoute({ role: 'mentor', status: 'active' })).toBe('/mentor');
    expect(getPostAuthRoute({ role: 'guardian', status: 'active' })).toBe('/guardian');
    expect(getPostAuthRoute({ role: 'partner', status: 'active' })).toBe('/partner');
    expect(getPostAuthRoute({ role: 'instructor', status: 'active' })).toBe('/instructor');
    expect(getPostAuthRoute({ role: 'learning_manager', status: 'active' })).toBe('/learning-manager');
    expect(getPostAuthRoute({ role: 'boy', status: 'active' })).toBe('/hub');
    expect(getPostAuthRoute({ role: 'boy', status: 'pending_guardian_consent' })).toBe('/hub');
    expect(getPostAuthRoute({ role: 'mentor', status: 'pending_vetting' })).toBe('/hub');
  });

  it('allows signing in across demo personas (admin, member, guardian, mentor, coordinator) and redirects correctly', async () => {
    const rolesToTest = [
      { email: mockStore.users.usr_admin_kato.email, expectedRoute: '/admin', heading: 'Admin Portal Reached' },
      { email: mockStore.users.usr_boy_active.email, expectedRoute: '/hub', heading: 'Member Hub Reached' },
      { email: mockStore.users.usr_guardian_grace.email, expectedRoute: '/guardian', heading: 'Guardian Portal Reached' },
      { email: mockStore.users.usr_mentor_okello.email, expectedRoute: '/mentor', heading: 'Mentor Portal Reached' },
      { email: mockStore.users.usr_coordinator_sarah.email, expectedRoute: '/coordinator', heading: 'Coordinator Portal Reached' },
    ];

    for (const tc of rolesToTest) {
      renderWithRouter(
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path={tc.expectedRoute} element={<div>{tc.heading}</div>} />
        </Routes>,
        ['/auth']
      );

      fireEvent.change(screen.getByPlaceholderText('name@example.com'), { target: { value: tc.email } });
      fireEvent.change(screen.getByPlaceholderText('Enter your password'), { target: { value: 'Password123!' } });
      const submitBtn = screen
        .getAllByRole('button', { name: /^Sign In$/i })
        .find((el) => el.getAttribute('type') === 'submit');
      expect(submitBtn).toBeTruthy();
      fireEvent.click(submitBtn!);

      await waitFor(() => {
        expect(screen.getByText(tc.heading)).toBeTruthy();
      });
      cleanup();
    }
  });

  it('displays recovery UI with Retry, Connection Status, Sign Out and zero PII/JSON when profile fails to load', async () => {
    const retrySpy = vi.fn().mockResolvedValue(null);
    const checkConnSpy = vi.fn().mockResolvedValue({
      reachable: false,
      state: 'unreachable',
      latencyMs: 120,
      diagnosticRef: 'BCA-NET-UNAVAILABLE',
      userMessage: 'Unreachable',
    });
    const signOutSpy = vi.fn().mockResolvedValue(undefined);

    vi.spyOn(UseAuthModule, 'useAuth').mockReturnValue({
      user: null,
      role: 'boy',
      isUnder18Pending: false,
      isSuspended: false,
      isLiveFirebaseUser: true,
      authReady: true,
      profileStatus: 'error',
      profileError: {
        category: 'unavailable',
        diagnosticRef: 'BCA-NET-UNAVAILABLE',
        message:
          'Your account has been authenticated, but we could not reach the BCA database server. Please check your connection and try again.',
        retryable: true,
      },
      connectivityStatus: 'unreachable',
      connectivityLatencyMs: 120,
      firebaseConfigDiagnostic: {
        configured: true,
        configIssues: [],
        projectId: 'boy-child-association-9a36f',
        databaseId: 'test-db',
        appCheckStatus: 'unconfigured',
        emulatorActive: false,
      },
      checkFirestoreConnectivity: checkConnSpy,
      retryProfileLoad: retrySpy,
      signIn: vi.fn(),
      signInWithGoogle: vi.fn(),
      signUp: vi.fn(),
      resetPassword: vi.fn(),
      resendVerificationEmail: vi.fn(),
      signOut: signOutSpy,
      switchPersona: vi.fn(),
      allDemoUsers: {},
    });

    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { container } = render(
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={['/auth']}>
          <AuthPage />
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(screen.getByText(/Profile Connection Interrupted/i)).toBeTruthy();
    expect(screen.getByText(/Database Temporarily Unreachable/i)).toBeTruthy();
    expect(screen.getByText(/BCA-NET-UNAVAILABLE/)).toBeTruthy();
    expect(container.textContent).not.toContain('authInfo');
    expect(container.textContent).not.toContain('mukuladavid6');

    fireEvent.click(screen.getByRole('button', { name: /Retry Loading Profile/i }));
    await waitFor(() => expect(retrySpy).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByRole('button', { name: /Test Connection/i }));
    await waitFor(() => expect(checkConnSpy).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByRole('button', { name: /Sign Out/i }));
    await waitFor(() => expect(signOutSpy).toHaveBeenCalledTimes(1));
  });

  it('isolates Demo Mode strictly out of production builds', () => {
    expect(import.meta.env.PROD).toBe(false);
    expect(isDemoModeEnabled).toBe(true);
  });

  it('blocks unapproved or non-matching roles in ProtectedRoute while granting active authorized admins', () => {
    // 1. Unauthenticated -> /auth
    vi.spyOn(UseAuthModule, 'useAuth').mockReturnValueOnce({
      user: null,
      role: 'boy',
      isUnder18Pending: false,
      isSuspended: false,
      isLiveFirebaseUser: false,
      authReady: true,
      profileStatus: 'idle',
      profileError: null,
      connectivityStatus: 'connected',
      connectivityLatencyMs: 50,
      firebaseConfigDiagnostic: {
        configured: true,
        configIssues: [],
        projectId: 'boy-child-association-9a36f',
        databaseId: 'test-db',
        appCheckStatus: 'unconfigured',
        emulatorActive: false,
      },
      checkFirestoreConnectivity: vi.fn(),
      retryProfileLoad: vi.fn(),
      signIn: vi.fn(),
      signInWithGoogle: vi.fn(),
      signUp: vi.fn(),
      resetPassword: vi.fn(),
      resendVerificationEmail: vi.fn(),
      signOut: vi.fn(),
      switchPersona: vi.fn(),
      allDemoUsers: {},
    });

    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={['/admin']}>
          <Routes>
            <Route path="/auth" element={<div>Login Gate</div>} />
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <div>Secret Admin Area</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );
    expect(screen.getByText('Login Gate')).toBeTruthy();
    cleanup();

    // 2. Pending mentor attempting restricted /mentor portal -> Account Pending Approval
    vi.spyOn(UseAuthModule, 'useAuth').mockReturnValueOnce({
      user: { ...mockStore.users.usr_mentor_okello, status: 'pending_vetting' },
      role: 'mentor',
      isUnder18Pending: false,
      isSuspended: false,
      isLiveFirebaseUser: true,
      authReady: true,
      profileStatus: 'ready',
      profileError: null,
      connectivityStatus: 'connected',
      connectivityLatencyMs: 50,
      firebaseConfigDiagnostic: {
        configured: true,
        configIssues: [],
        projectId: 'boy-child-association-9a36f',
        databaseId: 'test-db',
        appCheckStatus: 'unconfigured',
        emulatorActive: false,
      },
      checkFirestoreConnectivity: vi.fn(),
      retryProfileLoad: vi.fn(),
      signIn: vi.fn(),
      signInWithGoogle: vi.fn(),
      signUp: vi.fn(),
      resetPassword: vi.fn(),
      resendVerificationEmail: vi.fn(),
      signOut: vi.fn(),
      switchPersona: vi.fn(),
      allDemoUsers: {},
    });

    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={['/mentor']}>
          <Routes>
            <Route
              path="/mentor"
              element={
                <ProtectedRoute allowedRoles={['mentor', 'admin']}>
                  <div>Mentor Operations</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );
    expect(screen.getByText(/Account Pending Approval/i)).toBeTruthy();
    expect(screen.queryByText('Mentor Operations')).toBeNull();
  });
});
