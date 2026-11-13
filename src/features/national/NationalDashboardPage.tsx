import React from 'react';
import { Link } from 'react-router-dom';
import { mockStore } from '../../lib/firebase/mockStore';
import { firebaseService } from '../../lib/firebase/firebase';
import { useAuth } from '../../hooks/useAuth';
import { usePublicCatalog } from '../../hooks/usePlatformData';
import {
  MapPin,
  Users,
  ShieldCheck,
  Building2,
  Calendar,
  TrendingUp,
  Lock,
  ArrowRight,
  GraduationCap,
} from 'lucide-react';

const BASELINE_DISTRICT_COUNTS: Record<string, { activeBoys: number; circles: number; partners: number }> = {
  Kampala: { activeBoys: 410, circles: 11, partners: 10 },
  Wakiso: { activeBoys: 285, circles: 8, partners: 6 },
  Mukono: { activeBoys: 140, circles: 4, partners: 4 },
  Jinja: { activeBoys: 120, circles: 4, partners: 3 },
  Gulu: { activeBoys: 95, circles: 3, partners: 2 },
  Mbale: { activeBoys: 72, circles: 2, partners: 1 },
  Mbarara: { activeBoys: 64, circles: 2, partners: 1 },
  Lira: { activeBoys: 48, circles: 2, partners: 1 },
};

export const NationalDashboardPage: React.FC = () => {
  const { role } = useAuth();
  usePublicCatalog(role);

  const cms = firebaseService.getCmsSettings();
  const circles = firebaseService.getCircles();
  const programmes = firebaseService.getProgrammes();
  const partners = firebaseService.getPartners();
  const events = firebaseService.getEvents();
  const attendance = firebaseService.getAttendance();

  const totalBoysRegistered = Object.values(mockStore.users).filter((u) => u.role === 'boy').length;
  const minorCount = Object.values(mockStore.users).filter(
    (u) => u.role === 'boy' && ((u.calculatedAge ?? 16) < 18 || u.ageCategory === 'child_5_17')
  ).length;
  const youngAdultCount = totalBoysRegistered - minorCount;

  const presentMarks = attendance.filter((a) => a.status === 'present').length;
  const attendanceRate = attendance.length > 0 ? Math.round((presentMarks / attendance.length) * 100) : 100;

  // Aggregate live circle seats and verified partner counts per district (zero minor PII)
  const districtNames = Array.from(
    new Set([
      ...Object.keys(BASELINE_DISTRICT_COUNTS),
      ...circles.map((c) => c.district),
      ...partners.map((p) => p.district),
    ])
  );

  const districtRows = districtNames
    .map((district) => {
      const base = BASELINE_DISTRICT_COUNTS[district] || { activeBoys: 0, circles: 0, partners: 0 };
      const liveCircles = circles.filter((c) => c.district === district);
      const livePartners = partners.filter((p) => p.district === district && p.status === 'verified');
      const liveCircleMembers = liveCircles.reduce((sum, c) => sum + (c.activeMembersCount || 0), 0);
      return {
        district,
        activeBoys: Math.max(base.activeBoys, liveCircleMembers),
        circles: Math.max(base.circles, liveCircles.length),
        partners: Math.max(base.partners, livePartners.length),
      };
    })
    .sort((a, b) => b.activeBoys - a.activeBoys)
    .slice(0, 10);

  const maxDistrictMembers = Math.max(1, ...districtRows.map((r) => r.activeBoys));

  return (
    <div className="bg-[#F8FAFC] min-h-screen pb-16">
      {/* National Overview Header */}
      <div className="bg-[#1B365D] text-white py-12 sm:py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-3xl">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-[#60C1E5] uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" />
              <span>National BCA Uganda Operations Overview</span>
            </div>
            <h1 className="font-heading text-3xl sm:text-4xl font-extrabold text-white text-balance">
              Uganda National Membership, Circles &amp; Impact Dashboard
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Aggregated operational visibility across Uganda’s mentorship chapters, verified partner schools, and programme participation. Individual child details and safeguarding records remain strictly isolated.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 shrink-0">
            <Link
              to="/events-news"
              className="px-4 py-2.5 rounded-xl bg-[#005A9C] hover:bg-[#004980] text-white text-xs font-bold inline-flex items-center gap-1.5 min-h-[44px]"
            >
              <span>National Events</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/verify"
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold inline-flex items-center gap-1.5 min-h-[44px]"
            >
              <span>Verify Member Card QR</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 -mt-6 space-y-8">
        {/* KPI Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>National Boys &amp; Young Men</span>
              <Users className="w-4 h-4 text-[#005A9C]" />
            </div>
            <div className="font-heading text-3xl font-extrabold text-[#1B365D] mt-2 tabular-nums">
              {cms.stats.activeBoys}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Active Directory Sample: {minorCount} Ages 5–17 · {youngAdultCount} Ages 18–35
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Districts Covered</span>
              <MapPin className="w-4 h-4 text-[#005A9C]" />
            </div>
            <div className="font-heading text-3xl font-extrabold text-[#1B365D] mt-2 tabular-nums">
              {cms.stats.districts} Districts
            </div>
            <div className="text-[11px] text-emerald-700 font-semibold mt-1">
              Central · Eastern · Northern · Western Uganda
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Active Mentorship Circles</span>
              <GraduationCap className="w-4 h-4 text-[#005A9C]" />
            </div>
            <div className="font-heading text-3xl font-extrabold text-[#1B365D] mt-2 tabular-nums">
              {circles.length} Active Chapters ({cms.stats.vettedMentors} Mentors)
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Session Attendance Rate: <strong className="text-emerald-700">{attendanceRate}%</strong>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Institutional Partners</span>
              <Building2 className="w-4 h-4 text-[#005A9C]" />
            </div>
            <div className="font-heading text-3xl font-extrabold text-[#1B365D] mt-2 tabular-nums">
              {cms.stats.partnerSchools} Schools &amp; CBOs
            </div>
            <div className="text-[11px] text-[#005A9C] mt-1">
              {partners.filter((p) => p.vanguardClubActive).length} Active Vanguard Clubs Verified
            </div>
          </div>
        </div>

        {/* District Coverage + Active Mentorship Circles */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="font-heading text-lg font-bold text-[#1B365D]">
                  Uganda District Reach &amp; Circle Density
                </h2>
                <p className="text-xs text-slate-500">
                  Aggregated membership distribution across primary regional hubs (zero minor PII)
                </p>
              </div>
              <TrendingUp className="w-5 h-5 text-[#005A9C]" />
            </div>

            <div className="space-y-3.5 text-xs">
              {districtRows.map((row) => {
                const widthPct = Math.round((row.activeBoys / maxDistrictMembers) * 100);
                return (
                  <div key={row.district} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#1B365D]">{row.district}</span>
                      <span className="font-mono text-slate-600 tabular-nums">
                        {row.activeBoys} members · {row.circles} circles · {row.partners} partners
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#005A9C] rounded-full transition-all"
                        style={{ width: `${Math.max(10, widthPct)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
              <h2 className="font-heading text-lg font-bold text-[#1B365D]">
                Supervised Mentorship Circles
              </h2>
              <div className="space-y-3">
                {circles.map((c) => {
                  const capPct = Math.min(100, Math.round((c.activeMembersCount / c.maxMembers) * 100));
                  return (
                    <div key={c.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#1B365D]">{c.name}</span>
                        <span className="font-mono font-bold text-[#005A9C] tabular-nums">
                          {c.activeMembersCount}/{c.maxMembers}
                        </span>
                      </div>
                      <div className="text-slate-500">
                        {c.district} · Lead Mentor: {c.leadMentorName}
                      </div>
                      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${capPct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 flex items-start gap-3 text-xs text-slate-700">
              <Lock className="w-5 h-5 text-[#005A9C] shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-bold text-[#1B365D]">Child Privacy &amp; Legal Review Notice</div>
                <p className="leading-relaxed">
                  In accordance with Uganda’s Children Act (Cap 59) and Data Protection and Privacy Act 2019, this national dashboard outputs only district-level totals. Child-protection incident data is held separately in our restricted Safeguarding Command Centre. Technical architecture should undergo formal review by a qualified Ugandan legal or child-protection professional before national launch.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Programme Participation + Upcoming National Events */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <h2 className="font-heading text-lg font-bold text-[#1B365D]">
              National Programme Participation
            </h2>
            <div className="space-y-3 text-xs">
              {programmes.map((p) => (
                <div key={p.id} className="p-3.5 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-[#005A9C]">{p.category} · {p.ageRange}</span>
                    <div className="font-bold text-[#1B365D] text-sm">{p.title}</div>
                  </div>
                  <div className="text-right shrink-0 font-mono tabular-nums">
                    <div className="font-bold text-[#005A9C]">{p.activeBoysCount} enrolled</div>
                    <div className="text-[11px] text-slate-500">{p.availablePlaces} open seats</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-lg font-bold text-[#1B365D] flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#005A9C]" />
                <span>Active National Events Calendar</span>
              </h2>
              <Link to="/events-news" className="text-xs font-bold text-[#005A9C] hover:underline">
                Register / Manage &rarr;
              </Link>
            </div>
            <div className="space-y-3 text-xs">
              {events.map((ev) => (
                <div key={ev.id} className="p-3.5 rounded-xl border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#005A9C]">{ev.category} · {ev.district}</span>
                    <span className="font-mono font-bold text-slate-600 tabular-nums">
                      {ev.registeredCount}/{ev.capacity} registered
                    </span>
                  </div>
                  <div className="font-bold text-[#1B365D] text-sm">{ev.title}</div>
                  <div className="text-slate-500">
                    {ev.location} · {new Date(ev.startsAt).toLocaleDateString('en-GB', { dateStyle: 'medium' })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
