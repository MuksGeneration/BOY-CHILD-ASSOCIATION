import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Users,
  ShieldCheck,
  MapPin,
  Calendar,
  Award,
  Lock,
  Filter,
  RotateCcw,
  UserCheck,
  BookOpen,
  IdCard,
  X,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useMemberDirectoryData, usePublicCatalog } from '../../hooks/usePlatformData';
import { firebaseService } from '../../lib/firebase/firebase';
import { MemberDirectoryEntry, UserStatus } from '../../types';

interface MemberDirectoryProps {
  embedded?: boolean;
  initialCircleFilter?: string;
}

const STATUS_LABELS: Record<UserStatus, string> = {
  active: 'Active',
  pending_guardian_consent: 'Pending Guardian Consent',
  pending_vetting: 'Pending Vetting',
  suspended: 'Suspended',
};

const STATUS_BADGE_CLASSES: Record<UserStatus, string> = {
  active: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  pending_guardian_consent: 'bg-amber-50 text-amber-900 border-amber-200',
  pending_vetting: 'bg-slate-100 text-slate-700 border-slate-200',
  suspended: 'bg-red-50 text-[#DC2626] border-red-200',
};

const CONSENT_LABELS: Record<MemberDirectoryEntry['guardianConsentStatus'], string> = {
  verified: 'Guardian Consent Active',
  pending: 'Guardian Consent Pending',
  self_consent: 'Adult Self-Consent (18–35)',
};

export const MemberDirectory: React.FC<MemberDirectoryProps> = ({
  embedded = false,
  initialCircleFilter = 'all',
}) => {
  const { user, role } = useAuth();
  const isAuthorized = role === 'mentor' || role === 'coordinator' || role === 'admin';

  usePublicCatalog(role);
  useMemberDirectoryData(isAuthorized ? user?.uid : undefined, isAuthorized ? role : undefined);

  const [searchQuery, setSearchQuery] = useState('');
  const [circleFilter, setCircleFilter] = useState<string>(initialCircleFilter);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [cohortFilter, setCohortFilter] = useState<string>('all');
  const [selectedUid, setSelectedUid] = useState<string | null>(null);

  const allCircles = firebaseService.getCircles();
  const visibleCircles = useMemo(() => {
    if (!user || !isAuthorized) return [];
    if (role === 'coordinator' || role === 'admin') return allCircles;
    return allCircles.filter(
      (c) => c.leadMentorId === user.uid || (c.coMentorIds && c.coMentorIds.includes(user.uid))
    );
  }, [allCircles, isAuthorized, role, user]);

  const entries = useMemo(() => {
    if (!user || !isAuthorized) return [];
    return firebaseService.getMemberDirectoryEntries(user.uid, role);
  }, [user, role, isAuthorized, allCircles]);

  const filteredEntries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return entries.filter((entry) => {
      if (circleFilter === 'unassigned') {
        if (entry.circleId) return false;
      } else if (circleFilter !== 'all' && entry.circleId !== circleFilter) {
        return false;
      }

      if (statusFilter !== 'all' && entry.status !== statusFilter) {
        return false;
      }

      if (cohortFilter !== 'all' && entry.ageCategory !== cohortFilter) {
        return false;
      }

      if (!q) return true;
      const haystack = [
        entry.fullName,
        entry.membershipNumber || '',
        entry.district,
        entry.town,
        entry.schoolOrOccupation || '',
        entry.circleName || '',
        entry.leadMentorName || '',
        ...entry.interests,
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [entries, searchQuery, circleFilter, statusFilter, cohortFilter]);

  const selectedMember = useMemo(() => {
    if (filteredEntries.length === 0) return null;
    if (selectedUid) {
      const match = filteredEntries.find((m) => m.uid === selectedUid);
      if (match) return match;
    }
    return filteredEntries[0];
  }, [filteredEntries, selectedUid]);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    circleFilter !== 'all' ||
    statusFilter !== 'all' ||
    cohortFilter !== 'all';

  const resetFilters = () => {
    setSearchQuery('');
    setCircleFilter('all');
    setStatusFilter('all');
    setCohortFilter('all');
  };

  if (!isAuthorized) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center max-w-lg mx-auto my-8">
        <div className="w-12 h-12 rounded-full bg-red-50 text-[#DC2626] flex items-center justify-center mx-auto mb-3">
          <Lock className="w-6 h-6" />
        </div>
        <h2 className="font-heading text-lg font-bold text-[#1B365D]">
          Member Directory Restricted
        </h2>
        <p className="text-xs text-slate-600 mt-2 leading-relaxed">
          Under Uganda Child Protection &amp; DPPA privacy rules, member profiles and circle placements are strictly restricted to vetted Mentors (assigned circles only), District Coordinators, and Administrators. Children never appear in public directories.
        </p>
        <Link
          to="/hub"
          className="inline-flex items-center justify-center mt-5 px-4 py-2.5 rounded-xl bg-[#005A9C] hover:bg-[#004980] text-white text-xs font-semibold min-h-[44px]"
        >
          Return to Member Hub
        </Link>
      </div>
    );
  }

  const activeCount = entries.filter((e) => e.status === 'active').length;
  const pendingOrUnassignedCount = entries.filter(
    (e) => e.status !== 'active' || !e.circleId
  ).length;

  return (
    <div className={embedded ? 'space-y-6' : 'space-y-6'}>
      {/* Directory Scope & Summary Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className="font-bold text-[#005A9C]">
                {role === 'mentor'
                  ? 'Mentor Circle Directory'
                  : 'National Operational Member Directory'}
              </span>
              <span aria-hidden="true">·</span>
              <span>
                {role === 'mentor'
                  ? `Scoped to ${visibleCircles.length} assigned ${visibleCircles.length === 1 ? 'circle' : 'circles'}`
                  : 'All active & pending Uganda members'}
              </span>
              <span aria-hidden="true">·</span>
              <span className="text-emerald-700 font-semibold">Contact PII Redacted</span>
            </div>
            <h2 className="font-heading text-xl sm:text-2xl font-extrabold text-[#1B365D]">
              Mentorship Member Directory
            </h2>
            <p className="text-xs text-slate-600 max-w-3xl">
              Search and inspect basic member profiles, digital membership status, and current mentorship circle allocations. Private phone numbers, email addresses, guardian contacts, and safeguarding reports remain excluded.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 shrink-0">
            <ShieldCheck className="w-4 h-4 text-[#005A9C] shrink-0" />
            <span>
              {role === 'mentor'
                ? 'Assigned Circles Scope Only'
                : 'Coordinator & Admin Directory Access'}
            </span>
          </div>
        </div>

        {/* Summary Metrics Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
            <div className="text-[11px] font-medium text-slate-500">Visible Members</div>
            <div className="font-heading text-2xl font-extrabold text-[#1B365D] mt-0.5 tabular-nums">
              {entries.length}
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
            <div className="text-[11px] font-medium text-slate-500">Active Membership</div>
            <div className="font-heading text-2xl font-extrabold text-emerald-700 mt-0.5 tabular-nums">
              {activeCount}
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
            <div className="text-[11px] font-medium text-slate-500">
              {role === 'mentor' ? 'Paused / Review' : 'Pending Consent / Unassigned'}
            </div>
            <div className="font-heading text-2xl font-extrabold text-amber-700 mt-0.5 tabular-nums">
              {pendingOrUnassignedCount}
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
            <div className="text-[11px] font-medium text-slate-500">Visible Circles</div>
            <div className="font-heading text-2xl font-extrabold text-[#005A9C] mt-0.5 tabular-nums">
              {visibleCircles.length}
            </div>
          </div>
        </div>

        {/* Search & Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 pt-2 border-t border-slate-100">
          <div className="sm:col-span-2 lg:col-span-5">
            <label htmlFor="directory-search-input" className="block text-[11px] font-bold text-slate-600 mb-1">
              Search Basic Profiles
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="directory-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Name, BCA card #, district, school, or interest..."
                className="w-full pl-9 pr-9 py-2 text-xs rounded-xl border border-slate-300 bg-white text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#005A9C] min-h-[44px]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search query"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="lg:col-span-3">
            <label htmlFor="directory-circle-filter" className="block text-[11px] font-bold text-slate-600 mb-1">
              Mentorship Circle
            </label>
            <select
              id="directory-circle-filter"
              value={circleFilter}
              onChange={(e) => setCircleFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#005A9C] min-h-[44px]"
            >
              <option value="all">
                {role === 'mentor' ? 'All My Assigned Circles' : 'All Mentorship Circles'}
              </option>
              {visibleCircles.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.district})
                </option>
              ))}
              {(role === 'coordinator' || role === 'admin') && (
                <option value="unassigned">Unassigned / Awaiting Circle</option>
              )}
            </select>
          </div>

          <div className="lg:col-span-2">
            <label htmlFor="directory-status-filter" className="block text-[11px] font-bold text-slate-600 mb-1">
              Membership Status
            </label>
            <select
              id="directory-status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#005A9C] min-h-[44px]"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="pending_guardian_consent">Pending Consent</option>
              <option value="pending_vetting">Pending Vetting</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>

          <div className="lg:col-span-2">
            <label htmlFor="directory-cohort-filter" className="block text-[11px] font-bold text-slate-600 mb-1">
              Age Cohort
            </label>
            <select
              id="directory-cohort-filter"
              value={cohortFilter}
              onChange={(e) => setCohortFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#005A9C] min-h-[44px]"
            >
              <option value="all">All Cohorts</option>
              <option value="child_5_17">Ages 5–17 (Minor)</option>
              <option value="young_adult_18_35">Ages 18–35 (Adult)</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>
              Showing <strong className="text-[#1B365D] tabular-nums">{filteredEntries.length}</strong> of{' '}
              <strong className="text-[#1B365D] tabular-nums">{entries.length}</strong> visible members
            </span>
          </div>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#005A9C] hover:underline whitespace-nowrap"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Master-Detail Content */}
      {entries.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-2">
          <Users className="w-8 h-8 text-slate-400 mx-auto" />
          <h3 className="font-heading text-base font-bold text-[#1B365D]">
            No Assigned Circle Members Yet
          </h3>
          <p className="text-xs text-slate-600 max-w-md mx-auto">
            {role === 'mentor'
              ? 'You will see active members placed into mentorship circles where you are Lead Mentor or Co-Mentor once assigned by a District Coordinator.'
              : 'No member profiles have been registered yet.'}
          </p>
        </div>
      ) : filteredEntries.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-3">
          <Search className="w-8 h-8 text-slate-400 mx-auto" />
          <h3 className="font-heading text-base font-bold text-[#1B365D]">
            No Members Match Current Filters
          </h3>
          <p className="text-xs text-slate-600 max-w-md mx-auto">
            Try clearing your search keyword or adjusting the mentorship circle, status, or age cohort filter.
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#005A9C] hover:bg-[#004980] text-white text-xs font-semibold min-h-[44px]"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All Filters</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Directory Table / Roster */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                    <th className="py-3 px-4">Member &amp; Cohort</th>
                    <th className="py-3 px-4">Current Circle</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Profile</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredEntries.map((member) => {
                    const isSelected = selectedMember?.uid === member.uid;
                    return (
                      <tr
                        key={member.uid}
                        onClick={() => setSelectedUid(member.uid)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-[#F4F8FC]' : 'hover:bg-slate-50/80'
                        }`}
                      >
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-[#1B365D] text-sm">{member.fullName}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                            <span className="tabular-nums">Age {member.calculatedAge}</span>
                            <span aria-hidden="true">·</span>
                            <span>
                              {member.ageCategory === 'child_5_17' ? '5–17 yrs' : '18–35 yrs'}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span>{member.district}</span>
                            {member.membershipNumber && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="font-mono tabular-nums text-[#005A9C]">
                                  {member.membershipNumber}
                                </span>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          {member.circleName ? (
                            <div>
                              <div className="font-semibold text-[#1B365D]">{member.circleName}</div>
                              <div className="text-[11px] text-slate-500 mt-0.5">
                                {member.circleDistrict} · {member.leadMentorName}
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-500 italic">Unassigned</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border ${STATUS_BADGE_CLASSES[member.status]}`}
                          >
                            {STATUS_LABELS[member.status]}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedUid(member.uid);
                            }}
                            aria-pressed={isSelected}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold min-h-[36px] transition-colors ${
                              isSelected
                                ? 'bg-[#005A9C] text-white'
                                : 'border border-slate-300 text-[#1B365D] hover:bg-slate-100'
                            }`}
                          >
                            {isSelected ? 'Viewing' : 'View Profile'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Selected Member Basic Profile Detail Panel */}
          {selectedMember && (
            <aside
              aria-label="Selected Member Profile"
              className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 space-y-5 lg:sticky lg:top-24"
            >
              <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#005A9C]">
                    Basic Member Profile
                  </div>
                  <h3 className="font-heading text-xl font-extrabold text-[#1B365D] mt-0.5">
                    {selectedMember.fullName}
                  </h3>
                  <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-x-2">
                    <span className="tabular-nums">Age {selectedMember.calculatedAge}</span>
                    <span aria-hidden="true">·</span>
                    <span>
                      {selectedMember.ageCategory === 'child_5_17'
                        ? 'Child Cohort (5–17)'
                        : 'Young Adult Cohort (18–35)'}
                    </span>
                  </div>
                </div>
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border shrink-0 ${STATUS_BADGE_CLASSES[selectedMember.status]}`}
                >
                  {STATUS_LABELS[selectedMember.status]}
                </span>
              </div>

              {/* Key Operational Metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                    <IdCard className="w-3.5 h-3.5 text-[#005A9C]" />
                    <span>BCA Membership ID</span>
                  </div>
                  <div className="font-mono font-bold text-[#1B365D] mt-1 tabular-nums">
                    {selectedMember.membershipNumber || 'Pending card issuance'}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-[#005A9C]" />
                    <span>Consent Verification</span>
                  </div>
                  <div className="font-semibold text-[#1B365D] mt-1">
                    {CONSENT_LABELS[selectedMember.guardianConsentStatus]}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#005A9C]" />
                    <span>Chapter Location</span>
                  </div>
                  <div className="font-semibold text-[#1B365D] mt-1">
                    {selectedMember.district} · {selectedMember.town}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-[#005A9C]" />
                    <span>School / Track</span>
                  </div>
                  <div className="font-semibold text-[#1B365D] mt-1">
                    {selectedMember.schoolOrOccupation || 'Not specified'}
                  </div>
                </div>
              </div>

              {/* Current Mentorship Circle Card */}
              <div className="p-4 rounded-xl bg-[#F4F8FC] border border-blue-100 space-y-2 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-[#005A9C] flex items-center gap-1.5">
                    <Users className="w-4 h-4" />
                    <span>Current Mentorship Circle</span>
                  </span>
                  {selectedMember.circleMembershipStatus && (
                    <span className="font-mono text-[11px] uppercase font-bold text-[#1B365D]">
                      {selectedMember.circleMembershipStatus}
                    </span>
                  )}
                </div>

                {selectedMember.circleName ? (
                  <div className="space-y-1">
                    <div className="font-heading text-sm font-bold text-[#1B365D]">
                      {selectedMember.circleName}
                    </div>
                    <div className="text-slate-600 flex flex-wrap items-center gap-x-2">
                      <span>District: {selectedMember.circleDistrict}</span>
                      <span aria-hidden="true">·</span>
                      <span>Lead Mentor: {selectedMember.leadMentorName}</span>
                    </div>
                    {selectedMember.circleMeetingTime && (
                      <div className="text-slate-600 flex items-center gap-1.5 pt-0.5">
                        <Calendar className="w-3.5 h-3.5 text-[#005A9C]" />
                        <span>{selectedMember.circleMeetingTime}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-slate-600">
                    Not assigned to a mentorship circle yet. Active membership &amp; guardian consent verification are required prior to circle placement.
                  </p>
                )}
              </div>

              {/* Participation & Programme Interests */}
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-600 font-medium">Verified Circle Sessions Attended</span>
                  <span className="font-mono font-bold text-[#1B365D] tabular-nums">
                    {selectedMember.attendanceCount} sessions
                  </span>
                </div>

                {selectedMember.interests.length > 0 && (
                  <div>
                    <div className="font-semibold text-slate-600 mb-1.5">Programme Interests</div>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedMember.interests.map((interest) => (
                        <span
                          key={interest}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-medium"
                        >
                          {interest}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedMember.achievements.length > 0 && (
                  <div>
                    <div className="font-semibold text-slate-600 mb-1.5 flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-[#005A9C]" />
                      <span>Recognised Milestones</span>
                    </div>
                    <ul className="space-y-1.5">
                      {selectedMember.achievements.map((ach) => (
                        <li
                          key={ach.id}
                          className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
                        >
                          <span className="font-medium text-[#1B365D]">{ach.title}</span>
                          <span className="font-mono text-[11px] text-slate-500 tabular-nums shrink-0">
                            {ach.awardedAt}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Safeguarding Notice */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 leading-relaxed flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-[#005A9C] shrink-0 mt-0.5" />
                <span>
                  Safeguarding Privacy Scope: Private phone numbers, email addresses, guardian contacts, and confidential safeguarding files are intentionally excluded from directory views.
                </span>
              </div>
            </aside>
          )}
        </div>
      )}
    </div>
  );
};
