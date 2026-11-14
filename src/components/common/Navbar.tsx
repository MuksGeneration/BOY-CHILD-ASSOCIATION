import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { isDemoModeEnabled } from '../../lib/firebase/firebase';
import { PWAInstallButton } from './PWAInstallButton';
import { SafeguardingConcernModal } from './SafeguardingConcernModal';
import {
  ShieldAlert,
  UserCheck,
  Menu,
  X,
  ChevronDown,
  LogOut,
  LogIn,
  Sparkles,
  Users,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, role, isLiveFirebaseUser, switchPersona, signOut, allDemoUsers } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [personaMenuOpen, setPersonaMenuOpen] = useState(false);
  const [concernModalOpen, setConcernModalOpen] = useState(false);

  const showDemoSwitcher = isDemoModeEnabled && !isLiveFirebaseUser;

  const canInstruct =
    role === 'instructor' ||
    role === 'learning_manager' ||
    role === 'admin' ||
    (role === 'mentor' && Boolean(user?.instructorAuthorized));

  const roleDashboardLink = (() => {
    if (role === 'guardian') return { label: 'Guardian Portal', path: '/guardian' };
    if (role === 'mentor') return { label: 'Mentor Portal', path: '/mentor' };
    if (role === 'instructor') return { label: 'Instructor Studio', path: '/instructor' };
    if (role === 'learning_manager') return { label: 'Learning Dept', path: '/learning-manager' };
    if (role === 'partner') return { label: 'Partner Portal', path: '/partner' };
    if (role === 'coordinator') return { label: 'Coordinator', path: '/coordinator' };
    if (role === 'admin') return { label: 'Admin Console', path: '/admin' };
    return { label: 'Member Hub', path: '/hub' };
  })();

  const navLinks = [
    { label: 'Programmes', path: '/programmes' },
    { label: 'Online Skilling', path: '/learn' },
    { label: 'Join BCA', path: '/join' },
    { label: 'Events', path: '/events-news' },
    ...(user ? [roleDashboardLink] : [{ label: 'National Overview', path: '/national-dashboard' }]),
  ];

  const exploreLinks = [
    { label: 'Mentorship Circles', path: '/mentorship-circles' },
    ...(role === 'mentor' || role === 'coordinator' || role === 'admin'
      ? [{ label: 'Member Directory', path: '/directory' }]
      : []),
    { label: 'National Overview', path: '/national-dashboard' },
    { label: 'Verify Member QR', path: '/verify' },
    { label: 'Verify Certificate', path: '/verify-certificate' },
    ...(canInstruct ? [{ label: 'Instructor Studio', path: '/instructor' }] : []),
    ...(role === 'learning_manager' || role === 'admin'
      ? [{ label: 'Learning Department', path: '/learning-manager' }]
      : []),
    { label: 'About BCA', path: '/about' },
    { label: 'Mission & Pillars', path: '/mission-vision' },
    { label: 'School Partnerships', path: '/school-partnerships' },
    { label: 'Volunteer & Mentor', path: '/volunteer' },
    { label: 'Resources', path: '/resources' },
    { label: 'Safeguarding', path: '/safeguarding' },
    ...(role === 'admin' || (role === 'coordinator' && user?.safeguardingCleared)
      ? [{ label: 'Safeguarding Command', path: '/safeguarding-command' }]
      : []),
    { label: 'Contact', path: '/contact' },
  ];

  const roleBadgeStyles: Record<string, string> = {
    boy: 'bg-blue-50 text-[#005A9C] border-blue-200',
    guardian: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    mentor: 'bg-purple-50 text-purple-800 border-purple-200',
    instructor: 'bg-teal-50 text-teal-900 border-teal-200',
    learning_manager: 'bg-sky-50 text-sky-900 border-sky-200',
    coordinator: 'bg-amber-50 text-amber-900 border-amber-200',
    admin: 'bg-indigo-50 text-indigo-900 border-indigo-200',
    partner: 'bg-cyan-50 text-cyan-900 border-cyan-200',
  };

  return (
    <>
      {/* Top Urgent Safeguarding Alert Bar */}
      <div className="bg-[#1B365D] text-white border-b border-white/10 text-xs py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap text-slate-200">
            <span className="font-semibold text-[#60C1E5]">Child Protection Helpline:</span>
            <span>Sauti 116</span>
            <span className="hidden sm:inline text-slate-400">·</span>
            <span className="hidden md:inline text-slate-300">Boy Child Association Uganda</span>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <a
              href="https://wa.me/256732320190?text=Hello%20Boy%20Child%20Association%2C%20I%20would%20like%20to%20join%20the%20boys%20WhatsApp%20group"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-md text-[11px] transition-colors whitespace-nowrap"
              title="Connect with our boys WhatsApp group at 0732320190"
            >
              <span>WhatsApp: 0732320190</span>
            </a>

            <button
              onClick={() => setConcernModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold rounded-md text-[11px] transition-colors whitespace-nowrap"
              aria-label="Report a private child protection concern"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Report a Concern</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Top Bar: Strictly 3 Zones */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-8 px-4 sm:px-6 py-3">
          {/* Zone 1: Brand Wordmark */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0 whitespace-nowrap">
            <img
              src="/assets/aistudio/Screenshot_20260801_081145_WhatsApp__1__8a50926e.jpg"
              alt="Boy Child Association Official Logo"
              className="w-9 h-9 object-contain rounded-full bg-white border border-slate-200 shrink-0"
            />
            <span className="font-heading text-base sm:text-lg font-extrabold tracking-tight text-[#1B365D] whitespace-nowrap shrink-0">
              BOY CHILD ASSOCIATION
            </span>
          </Link>

          {/* Zone 2: 5 concise single-line navigation links */}
          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-700">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
                    isActive
                      ? 'border-[#005A9C] text-[#005A9C] font-semibold'
                      : 'border-transparent hover:text-[#005A9C] hover:border-slate-300'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Zone 3: Account / Auth / Demo Persona Control */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden xl:block">
              <PWAInstallButton />
            </div>

            {!user && !showDemoSwitcher ? (
              <Link
                to="/auth"
                className="flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-[#005A9C] hover:bg-[#004980] text-white transition-colors min-h-[44px] whitespace-nowrap shrink-0"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
              </Link>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setPersonaMenuOpen(!personaMenuOpen)}
                  className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors min-h-[44px] whitespace-nowrap shrink-0 ${
                    roleBadgeStyles[role] || 'bg-slate-100 text-slate-800 border-slate-200'
                  }`}
                  title={showDemoSwitcher ? 'Switch persona or sign in to test role permissions' : 'Account & portal menu'}
                >
                  {user?.avatarUrl && (
                    <img src={user.avatarUrl} alt={user.fullName} className="w-5 h-5 rounded-full object-cover" />
                  )}
                  <span className="truncate max-w-[130px] font-bold text-[#1B365D]">
                    {user?.fullName.split(' ')[0]} ({role})
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                </button>

                {personaMenuOpen && (
                  <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white p-2 shadow-2xl border border-slate-200 z-50">
                    {showDemoSwitcher ? (
                      <>
                        <div className="px-3 py-2 border-b border-slate-100 text-xs">
                          <span className="font-bold text-[#1B365D] flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-[#005A9C]" />
                            Role &amp; Safeguarding Switcher
                          </span>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Preview permissions across Member, Guardian, Mentor, Partner, Coordinator, and Admin:
                          </p>
                        </div>

                        <div className="py-1 space-y-1 max-h-72 overflow-y-auto">
                          {Object.values(allDemoUsers).map((u) => {
                            const isSelected = u.uid === user?.uid;
                            return (
                              <button
                                key={u.uid}
                                onClick={() => {
                                  switchPersona(u.uid);
                                  setPersonaMenuOpen(false);
                                }}
                                className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-start gap-2.5 transition-colors ${
                                  isSelected
                                    ? 'bg-[#005A9C] text-white font-semibold'
                                    : 'hover:bg-slate-50 text-slate-800'
                                }`}
                              >
                                <div className="mt-0.5">
                                  {isSelected ? (
                                    <UserCheck className="w-4 h-4 text-[#60C1E5]" />
                                  ) : (
                                    <Users className="w-4 h-4 text-slate-400" />
                                  )}
                                </div>
                                <div>
                                  <div className="font-semibold">{u.fullName}</div>
                                  <div className={`text-[10px] ${isSelected ? 'text-white/80' : 'text-slate-500'}`}>
                                    {u.role.toUpperCase()}
                                    {u.ageCategory === 'child_5_17' && ' · Ages 5–17'}
                                    {u.ageCategory === 'young_adult_18_35' && ' · Ages 18–35'}
                                    {u.status === 'pending_guardian_consent' && ' · Pending Consent'}
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </>
                    ) : (
                      <div className="px-3 py-2.5 border-b border-slate-100 text-xs">
                        <div className="font-bold text-[#1B365D] truncate">{user?.fullName}</div>
                        <div className="text-[11px] text-slate-500 truncate">{user?.email}</div>
                        <div className="text-[10px] font-bold uppercase text-[#005A9C] mt-1">
                          Role: {role}
                          {user?.district ? ` · ${user.district}` : ''}
                        </div>
                      </div>
                    )}

                    <div className="p-2 border-t border-slate-100 space-y-1 text-center">
                      <Link
                        to={roleDashboardLink.path}
                        onClick={() => setPersonaMenuOpen(false)}
                        className="block py-1.5 text-xs font-bold text-[#1B365D] hover:text-[#005A9C]"
                      >
                        Open {roleDashboardLink.label} &rarr;
                      </Link>
                      {(role === 'mentor' || role === 'coordinator' || role === 'admin') && (
                        <Link
                          to="/directory"
                          onClick={() => setPersonaMenuOpen(false)}
                          className="block py-1 text-xs font-semibold text-[#005A9C] hover:underline"
                        >
                          Member Directory &rarr;
                        </Link>
                      )}
                      <Link
                        to="/learn"
                        onClick={() => setPersonaMenuOpen(false)}
                        className="block py-1 text-xs font-semibold text-[#005A9C] hover:underline"
                      >
                        Online Skilling Academy &rarr;
                      </Link>
                      {canInstruct && role !== 'instructor' && (
                        <Link
                          to="/instructor"
                          onClick={() => setPersonaMenuOpen(false)}
                          className="block py-1 text-xs font-semibold text-teal-800 hover:underline"
                        >
                          Instructor Studio &rarr;
                        </Link>
                      )}
                      {(role === 'learning_manager' || role === 'admin') && role !== 'learning_manager' && (
                        <Link
                          to="/learning-manager"
                          onClick={() => setPersonaMenuOpen(false)}
                          className="block py-1 text-xs font-semibold text-sky-800 hover:underline"
                        >
                          Learning Department &rarr;
                        </Link>
                      )}
                      {(role === 'admin' || (role === 'coordinator' && user?.safeguardingCleared)) && (
                        <Link
                          to="/safeguarding-command"
                          onClick={() => setPersonaMenuOpen(false)}
                          className="block py-1 text-xs font-bold text-[#DC2626] hover:underline"
                        >
                          Safeguarding Command Centre &rarr;
                        </Link>
                      )}
                      <div className="flex items-center justify-center gap-2.5 pt-1 flex-wrap">
                        <Link
                          to="/national-dashboard"
                          onClick={() => setPersonaMenuOpen(false)}
                          className="text-[11px] font-semibold text-slate-600 hover:text-[#005A9C]"
                        >
                          National Stats
                        </Link>
                        <span className="text-slate-300">·</span>
                        <Link
                          to="/verify"
                          onClick={() => setPersonaMenuOpen(false)}
                          className="text-[11px] font-semibold text-slate-600 hover:text-[#005A9C]"
                        >
                          Verify Card
                        </Link>
                        <span className="text-slate-300">·</span>
                        <Link
                          to="/verify-certificate"
                          onClick={() => setPersonaMenuOpen(false)}
                          className="text-[11px] font-semibold text-slate-600 hover:text-[#005A9C]"
                        >
                          Verify Cert
                        </Link>
                      </div>
                      {showDemoSwitcher ? (
                        <Link
                          to="/auth"
                          onClick={() => setPersonaMenuOpen(false)}
                          className="block pt-1 text-xs font-semibold text-[#005A9C] hover:underline"
                        >
                          Sign In / Register Custom Account
                        </Link>
                      ) : (
                        <button
                          onClick={() => {
                            setPersonaMenuOpen(false);
                            signOut();
                          }}
                          className="w-full mt-1.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Sign Out</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-700 hover:bg-slate-100 min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden px-4 pt-2 pb-6 border-t border-slate-100 bg-white space-y-2 max-h-[80vh] overflow-y-auto">
            {[...navLinks, ...exploreLinks].map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2.5 rounded-lg text-sm font-medium ${
                  location.pathname === link.path
                    ? 'bg-[#005A9C] text-white font-semibold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                {link.label}
              </Link>
            ))}

            <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
              <PWAInstallButton />
              <Link
                to="/report-concern"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#DC2626] text-white font-bold text-xs min-h-[44px]"
              >
                <ShieldAlert className="w-4 h-4" />
                <span>Report Safeguarding Concern</span>
              </Link>
              {user ? (
                <button
                  onClick={() => {
                    signOut();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{showDemoSwitcher ? 'Reset / Sign Out' : 'Sign Out'}</span>
                </button>
              ) : (
                <Link
                  to="/auth"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#005A9C] text-white font-bold text-xs min-h-[44px]"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign In / Register</span>
                </Link>
              )}
            </div>
          </div>
        )}
      </header>

      <SafeguardingConcernModal
        isOpen={concernModalOpen}
        onClose={() => setConcernModalOpen(false)}
      />
    </>
  );
};
