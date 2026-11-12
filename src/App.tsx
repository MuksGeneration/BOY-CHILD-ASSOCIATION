import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { OfflineIndicator } from './components/common/OfflineIndicator';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import './lib/i18n';

// Lazy-loaded routes for minimal initial bundle size
const HomePage = lazy(() => import('./features/home/HomePage').then((m) => ({ default: m.HomePage })));
const ProgrammesPage = lazy(() => import('./features/programmes/ProgrammesPage').then((m) => ({ default: m.ProgrammesPage })));
const JoinPage = lazy(() => import('./features/join/JoinPage').then((m) => ({ default: m.JoinPage })));
const AuthPage = lazy(() => import('./features/auth/AuthPage').then((m) => ({ default: m.AuthPage })));
const MemberHubPage = lazy(() => import('./features/hub/MemberHubPage').then((m) => ({ default: m.MemberHubPage })));
const GuardianPage = lazy(() => import('./features/guardian/GuardianPage').then((m) => ({ default: m.GuardianPage })));
const AdminConsolePage = lazy(() => import('./features/admin/AdminConsolePage').then((m) => ({ default: m.AdminConsolePage })));
const SafeguardingPage = lazy(() => import('./features/safeguarding/SafeguardingPage').then((m) => ({ default: m.SafeguardingPage })));
const PrivacyPage = lazy(() => import('./features/legal/PrivacyPage').then((m) => ({ default: m.PrivacyPage })));
const TermsPage = lazy(() => import('./features/legal/TermsPage').then((m) => ({ default: m.TermsPage })));
const NotFoundPage = lazy(() => import('./components/common/NotFoundPage').then((m) => ({ default: m.NotFoundPage })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5 // 5 minutes
    }
  }
});

// Route Guard component for role protection
const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  allowedRoles?: string[];
}> = ({ children, allowedRoles }) => {
  const { user, role } = useAuth();

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    // If not in allowed role, redirect to hub
    return <Navigate to="/hub" replace />;
  }

  return <>{children}</>;
};

// Loading Skeleton
const RouteLoadingSkeleton = () => (
  <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 space-y-6">
    <div className="h-8 w-48 bg-slate-200 rounded-lg animate-pulse" />
    <div className="h-4 w-72 bg-slate-100 rounded-lg animate-pulse" />
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
      <div className="h-64 bg-slate-100 rounded-2xl animate-pulse" />
      <div className="h-64 bg-slate-100 rounded-2xl animate-pulse" />
      <div className="h-64 bg-slate-100 rounded-2xl animate-pulse" />
    </div>
  </div>
);

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BrowserRouter>
            <div className="flex flex-col min-h-screen bg-[#F8FAFC] text-[#1E293B]">
              <Navbar />
              <main className="flex-1">
                <Suspense fallback={<RouteLoadingSkeleton />}>
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/programmes" element={<ProgrammesPage />} />
                    <Route path="/join" element={<JoinPage />} />
                    <Route path="/auth" element={<AuthPage />} />

                    {/* Protected Member Hub */}
                    <Route
                      path="/hub"
                      element={
                        <ProtectedRoute>
                          <MemberHubPage />
                        </ProtectedRoute>
                      }
                    />

                    {/* Protected Guardian Area */}
                    <Route
                      path="/guardian"
                      element={
                        <ProtectedRoute allowedRoles={['guardian', 'admin', 'coordinator']}>
                          <GuardianPage />
                        </ProtectedRoute>
                      }
                    />

                    {/* Protected Admin & Coordinator Console */}
                    <Route
                      path="/admin"
                      element={
                        <ProtectedRoute allowedRoles={['coordinator', 'admin']}>
                          <AdminConsolePage />
                        </ProtectedRoute>
                      }
                    />

                    {/* Public Safeguarding & Legal Pages */}
                    <Route path="/safeguarding" element={<SafeguardingPage />} />
                    <Route path="/privacy" element={<PrivacyPage />} />
                    <Route path="/terms" element={<TermsPage />} />

                    {/* 404 Catch-All */}
                    <Route path="*" element={<NotFoundPage />} />
                  </Routes>
                </Suspense>
              </main>
              <Footer />
              <OfflineIndicator />
            </div>
          </BrowserRouter>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
