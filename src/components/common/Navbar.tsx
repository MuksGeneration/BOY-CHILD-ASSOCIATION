import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { PWAInstallButton } from './PWAInstallButton';
import { SafeguardingConcernModal } from './SafeguardingConcernModal';
import {
  ShieldAlert,
  UserCheck,
  Menu,
  X,
  ChevronDown,
  LogOut,
  Sparkles,
  Users
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, role, switchPersona, signOut, allDemoUsers } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [personaMenuOpen, setPersonaMenuOpen] = useState(false);
  const [concernModalOpen, setConcernModalOpen] = useState(false);

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Programmes', path: '/programmes' },
    { label: 'Join BCA', path: '/join' },
    { label: 'Member Hub', path: '/hub' },
    ...(role === 'guardian' ? [{ label: 'Guardian Area', path: '/guardian' }] : []),
    ...(role === 'coordinator' || role === 'admin' ? [{ label: 'Console', path: '/admin' }] : []),
    { label: 'Safeguarding', path: '/safeguarding' }
  ];

  const roleBadgeStyles: Record<string, string> = {
    boy: 'bg-blue-50 text-[#005A9C] border-blue-200',
    guardian: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    mentor: 'bg-purple-50 text-purple-800 border-purple-200',
    coordinator: 'bg-amber-50 text-amber-900 border-amber-200',
    admin: 'bg-indigo-50 text-indigo-900 border-indigo-200',
    partner: 'bg-cyan-50 text-cyan-900 border-cyan-200'
  };

  return (
    <>
      {/* Top Urgent Safeguarding Alert Bar */}
      <div className="bg-[#1B365D] text-white border-b border-white/10 text-xs py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap text-slate-200">
            <span className="font-semibold text-[#60C1E5]">Child Protection Hotline:</span>
            <span>Toll-free 116</span>
            <span className="hidden sm:inline text-slate-400">·</span>
            <span className="hidden md:inline text-slate-300">Social Organisation to Unite Boys</span>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {/* WhatsApp Community Group Link */}
            <a
              href="https://wa.me/256732320190?text=Hello%20Boy%20Child%20Association%2C%20I%20would%20like%20to%20join%20the%20boys%20WhatsApp%20group"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-md text-[11px] transition-colors shadow-xs"
              title="Connect with our boys WhatsApp group at 0732320190"
            >
              <span>WhatsApp: 0732320190</span>
            </a>

            {/* Direct Report Action Button - strictly styled in safeguarding red */}
            <button
              onClick={() => setConcernModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold rounded-md text-[11px] transition-colors shadow-sm"
              aria-label="Report a private child protection concern"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Report a Concern</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Top Bar adhering to strict Top Bar Contract: Brand - Nav - 1 Primary Action */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-6 px-4 sm:px-6 py-3">
          {/* Zone 1: Brand Wordmark element */}
          <Link to="/" className="flex items-center gap-3 shrink-0 group">
            <img
              src="/assets/aistudio/Screenshot_20260801_081145_WhatsApp__1__8a50926e.jpg"
              alt="Boy Child Association Official Logo"
              className="w-10 h-10 object-contain rounded-full shadow-xs bg-white border border-slate-200 shrink-0 group-hover:scale-105 transition-transform"
            />
            <div>
              <span className="font-heading text-lg font-extrabold tracking-tight text-[#1B365D] block leading-none">
                BOY CHILD
              </span>
              <span className="text-[10px] tracking-wider font-bold uppercase text-[#005A9C]">
                Standing Up As A Man
              </span>
            </div>
          </Link>

          {/* Zone 2: Concise single-line navigation links */}
          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-700">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`transition-colors whitespace-nowrap py-1 border-b-2 ${
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

          {/* Zone 3: Primary Action & Role Switcher */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* PWA Install Button */}
            <div className="hidden sm:block">
              <PWAInstallButton />
            </div>

            {/* Quick Demo Persona Switcher (For evaluators and multi-role testing) */}
            <div className="relative">
              <button
                onClick={() => setPersonaMenuOpen(!personaMenuOpen)}
                className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all min-h-[44px] ${
                  roleBadgeStyles[role] || 'bg-slate-100 text-slate-800 border-slate-200'
                }`}
                title="Switch persona to test permissions and safeguarding flows"
              >
                <div className="text-left hidden sm:block">
                  <div className="text-[10px] uppercase font-bold opacity-75">Demo Persona</div>
                  <div className="truncate max-w-[120px] font-bold text-[#1B365D]">
                    {user?.fullName.split(' ')[0]} ({role})
                  </div>
                </div>
                <div className="sm:hidden font-bold uppercase text-[11px]">{role}</div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              </button>

              {personaMenuOpen && (
                <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white p-2 shadow-2xl border border-slate-200 z-50">
                  <div className="px-3 py-2 border-b border-slate-100 text-xs">
                    <span className="font-bold text-[#1B365D] flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#005A9C]" />
                      Interactive Role Switcher
                    </span>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Switch personas to test role guards &amp; safeguarding constraints:
                    </p>
                  </div>

                  <div className="py-1 space-y-1 max-h-80 overflow-y-auto">
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
                              Role: <span className="uppercase font-bold">{u.role}</span>
                              {u.status === 'pending_guardian_consent' && ' · Under-18 Pending'}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="p-2 border-t border-slate-100 text-center">
                    <Link
                      to="/auth"
                      onClick={() => setPersonaMenuOpen(false)}
                      className="inline-block text-xs font-semibold text-[#005A9C] hover:underline"
                    >
                      Sign In / Sign Up with Custom Account
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Menu Toggle Button */}
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
          <div className="lg:hidden px-4 pt-2 pb-6 border-t border-slate-100 bg-white space-y-2">
            {navLinks.map((link) => (
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
              <a
                href="https://wa.me/256732320190?text=Hello%20Boy%20Child%20Association%2C%20I%20would%20like%20to%20join%20the%20boys%20WhatsApp%20group"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
              >
                <span>Join Boys WhatsApp Group (0732320190)</span>
              </a>
              <button
                onClick={() => {
                  setConcernModalOpen(true);
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#DC2626] text-white font-bold text-xs"
              >
                <ShieldAlert className="w-4 h-4" />
                <span>Report Safeguarding Concern</span>
              </button>
              <button
                onClick={() => {
                  signOut();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                <LogOut className="w-4 h-4" />
                <span>Reset / Sign Out</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Render Safeguarding Concern Modal */}
      <SafeguardingConcernModal
        isOpen={concernModalOpen}
        onClose={() => setConcernModalOpen(false)}
      />
    </>
  );
};
