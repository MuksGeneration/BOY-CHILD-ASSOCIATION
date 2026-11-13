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
const MentorDashboardPage = lazy(() => import('./features/mentor/MentorDashboardPage').then((m) => ({ default: m.MentorDashboardPage })));
const PartnerDashboardPage = lazy(() => import('./features/partner/PartnerDashboardPage').then((m) => ({ default: m.PartnerDashboardPage })));
const AdminConsolePage = lazy(() => import('./features/admin/AdminConsolePage').then((m) => ({ default: m.AdminConsolePage })));
const SafeguardingPage = lazy(() => import('./features/safeguarding/SafeguardingPage').then((m) => ({ default: m.SafeguardingPage })));
const PrivacyPage = lazy(() => import('./features/legal/PrivacyPage').then((m) => ({ default: m.PrivacyPage })));
const TermsPage = lazy(() => import('./features/legal/TermsPage').then((m) => ({ default: m.TermsPage })));
const ReportConcernPage = lazy(() => import('./features/public/ReportConcernPage').then((m) => ({ default: m.ReportConcernPage })));
const NotFoundPage = lazy(() => import('./components/common/NotFoundPage').then((m) => ({ default: m.NotFoundPage })));

// Public info & CMS pages
const AboutPage = lazy(() => import('./features/public/PublicPages').then((m) => ({ default: m.AboutPage })));
const MissionVisionPage = lazy(() => import('./features/public/PublicPages').then((m) => ({ default: m.MissionVisionPage })));
const MentorshipCirclesPage = lazy(() => import('./features/public/PublicPages').then((m) => ({ default: m.MentorshipCirclesPage })));
const PillarDetailPage = lazy(() => import('./features/public/PublicPages').then((m) => ({ default: m.PillarDetailPage })));
const SchoolPartnershipsPage = lazy(() => import('./features/public/PublicPages').then((m) => ({ default: m.SchoolPartnershipsPage })));
const VolunteerMentorPage = lazy(() => import('./features/public/PublicPages').then((m) => ({ default: m.VolunteerMentorPage })));
const EventsActivitiesPage = lazy(() => import('./features/events/EventsActivitiesPage').then((m) => ({ default: m.EventsActivitiesPage })));
const NationalDashboardPage = lazy(() => import('./features/national/NationalDashboardPage').then((m) => ({ default: m.NationalDashboardPage })));
const VerifyMemberPage = lazy(() => import('./features/public/VerifyMemberPage').then((m) => ({ default: m.VerifyMemberPage })));
const SafeguardingCommandPage = lazy(() => import('./features/safeguarding/SafeguardingCommandPage').then((m) => ({ default: m.SafeguardingCommandPage })));
const ResourcesPage = lazy(() => import('./features/public/PublicPages').then((m) => ({ default: m.ResourcesPage })));
const ContactPage = lazy(() => import('./features/public/PublicPages').then((m) => ({ default: m.ContactPage })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5,
    },
  },
});

const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  allowedRoles?: string[];
}> = ({ children, allowedRoles }) => {
  const { user, role, isSuspended, signOut } = useAuth();

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (isSuspended) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6 bg-[#F8FAFC]">
        <div className="max-w-md bg-white rounded-2xl p-8 border border-red-200 text-center space-y-3">
          <h2 className="font-heading text-lg font-bold text-[#DC2626]">Account Suspended</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            {user.suspensionReason || 'Your account access has been paused by an administrator pending a safeguarding or compliance review.'}
          </p>
          <button
            onClick={() => signOut()}
            className="px-4 py-2 bg-[#1B365D] text-white text-xs font-bold rounded-xl min-h-[40px]"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/hub" replace />;
  }

  return <>{children}</>;
};

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
                    {/* Public Routes */}
                    <Route path="/" element={<HomePage />} />
                    <Route path="/about" element={<AboutPage />} />
                    <Route path="/mission-vision" element={<MissionVisionPage />} />
                    <Route path="/programmes" element={<ProgrammesPage />} />
                    <Route path="/mentorship-circles" element={<MentorshipCirclesPage />} />
                    <Route
                      path="/life-skills"
                      element={
                        <PillarDetailPage
                          kicker="Practical Resilience & Integrity"
                          title="Life Skills & Positive Masculinity"
                          subtitle="Helping boys manage anger, communicate honestly, resist bullying, and treat women and girls with respect."
                          highlights={[
                            { heading: 'Emotional Literacy', detail: 'Structured group reflection naming grief, exam pressure, and anxiety constructively.' },
                            { heading: 'Peer Pressure Defence', detail: 'Practical role-play equipping boys to walk away from substance abuse and truancy.' },
                            { heading: 'Personal Discipline', detail: 'Weekly habit tracking for punctual school attendance, hygiene, and household stewardship.' },
                          ]}
                          ctaPath="/programmes"
                          ctaLabel="Explore Life Skills Programmes"
                        />
                      }
                    />
                    <Route
                      path="/leadership"
                      element={
                        <PillarDetailPage
                          kicker="Servant Leadership Track"
                          title="Youth Leadership & Civic Responsibility"
                          subtitle="Preparing boys and young men to lead anti-bullying patrols, academic study circles, and community projects."
                          highlights={[
                            { heading: 'School Vanguard Prefects', detail: 'Boy-led peer accountability champions supported by vetted teachers.' },
                            { heading: 'Public Speaking & Debate', detail: 'Confidence building through structured community dialogue forums.' },
                            { heading: 'Young Adult Peer Stewards', detail: 'Members 18–35 assisting elders under full safeguarding supervision.' },
                          ]}
                          ctaPath="/join"
                          ctaLabel="Apply for Leadership Track"
                        />
                      }
                    />
                    <Route
                      path="/education-career"
                      element={
                        <PillarDetailPage
                          kicker="Vocational & Academic Pathways"
                          title="Education Support & Career Craftsmanship"
                          subtitle="Hands-on solar electronics, computing, electrical diagnostics, and STEM tutoring across Uganda chapters."
                          highlights={[
                            { heading: 'Saturday Study Circles', detail: 'Mathematics and physics peer tutoring reducing O-Level and P-Level dropouts.' },
                            { heading: 'Solar & Clean Energy Kits', detail: 'Practical assembly of household lighting circuits and battery diagnostics.' },
                            { heading: 'Apprenticeship Links', detail: 'Bridging ages 18–35 to vetted local technicians and community workshops.' },
                          ]}
                          ctaPath="/programmes"
                          ctaLabel="Browse Skills Programmes"
                        />
                      }
                    />
                    <Route
                      path="/community-activities"
                      element={
                        <PillarDetailPage
                          kicker="Sports, Dialogue & Neighbourhood Service"
                          title="Community & Sports Wellbeing Activities"
                          subtitle="Non-violent football tournaments, clean-up drives, and trauma-informed group recreation."
                          highlights={[
                            { heading: 'Safe Minds Sports Days', detail: 'Team sports reinforcing teamwork, respect, and emotional release.' },
                            { heading: 'District Clean-Up Campaigns', detail: 'Joint community stewardship connecting boys with local elders.' },
                            { heading: 'Guardian Dialogue Sundays', detail: 'Monthly open forums strengthening father-son and guardian communication.' },
                          ]}
                          ctaPath="/events-news"
                          ctaLabel="View Upcoming Community Events"
                        />
                      }
                    />
                    <Route path="/school-partnerships" element={<SchoolPartnershipsPage />} />
                    <Route path="/volunteer" element={<VolunteerMentorPage />} />
                    <Route path="/events-news" element={<EventsActivitiesPage />} />
                    <Route path="/national-dashboard" element={<NationalDashboardPage />} />
                    <Route path="/verify" element={<VerifyMemberPage />} />
                    <Route path="/verify/:cardNumber" element={<VerifyMemberPage />} />
                    <Route path="/resources" element={<ResourcesPage />} />
                    <Route path="/contact" element={<ContactPage />} />
                    <Route path="/join" element={<JoinPage />} />
                    <Route path="/auth" element={<AuthPage />} />
                    <Route path="/safeguarding" element={<SafeguardingPage />} />
                    <Route path="/report-concern" element={<ReportConcernPage />} />
                    <Route path="/privacy" element={<PrivacyPage />} />
                    <Route path="/terms" element={<TermsPage />} />

                    {/* Role-Protected Dashboards */}
                    <Route
                      path="/hub"
                      element={
                        <ProtectedRoute>
                          <MemberHubPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/guardian"
                      element={
                        <ProtectedRoute allowedRoles={['guardian', 'admin', 'coordinator']}>
                          <GuardianPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/mentor"
                      element={
                        <ProtectedRoute allowedRoles={['mentor', 'coordinator', 'admin']}>
                          <MentorDashboardPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/partner"
                      element={
                        <ProtectedRoute allowedRoles={['partner', 'coordinator', 'admin']}>
                          <PartnerDashboardPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/coordinator"
                      element={
                        <ProtectedRoute allowedRoles={['coordinator', 'admin']}>
                          <AdminConsolePage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin"
                      element={
                        <ProtectedRoute allowedRoles={['coordinator', 'admin']}>
                          <AdminConsolePage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/safeguarding-command"
                      element={
                        <ProtectedRoute allowedRoles={['coordinator', 'admin']}>
                          <SafeguardingCommandPage />
                        </ProtectedRoute>
                      }
                    />

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
