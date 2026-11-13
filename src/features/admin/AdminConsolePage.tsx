import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useCoordinatorData, usePublicCatalog, useSafeguardingData } from '../../hooks/usePlatformData';
import { firebaseService } from '../../lib/firebase/firebase';
import { mockStore } from '../../lib/firebase/mockStore';
import { UserRole } from '../../types';
import { CmsEditorTab } from './CmsEditorTab';
import { SafeguardingCommandView } from '../safeguarding/SafeguardingCommandPage';
import {
  ShieldAlert,
  GraduationCap,
  Users,
  FileText,
  AlertTriangle,
  Lock,
  BarChart3,
  UserCog,
  Globe,
  Download,
  CheckCircle2,
  Search,
  QrCode,
  Mail,
} from 'lucide-react';

type ConsoleTab =
  | 'safeguarding'
  | 'applications'
  | 'circles'
  | 'analytics'
  | 'users_dppa'
  | 'cms'
  | 'audit';

export const AdminConsolePage: React.FC = () => {
  const { user, role } = useAuth();
  const isAdmin = role === 'admin';
  const hasSafeguardingClearance = isAdmin || Boolean(user?.safeguardingCleared);

  usePublicCatalog(role);
  useCoordinatorData(role);
  useSafeguardingData(hasSafeguardingClearance);

  const [activeTab, setActiveTab] = useState<ConsoleTab>(
    hasSafeguardingClearance ? 'safeguarding' : 'applications'
  );
  const [searchQuery, setSearchQuery] = useState('');

  // Data feeds
  const cases = firebaseService.getSafeguardingCases();
  const membershipApps = firebaseService.getMembershipApplications();
  const mentorApps = firebaseService.getMentorApplications();
  const partnerApps = firebaseService.getPartnerApplications();
  const circles = firebaseService.getCircles();
  const attendance = firebaseService.getAttendance();
  const progressReports = firebaseService.getProgressReports();
  const auditLogs = firebaseService.getAuditLogs();
  const dppaRequests = firebaseService.getDppaRequests();
  const contactMessages = firebaseService.getContactMessages();
  const cmsSettings = firebaseService.getCmsSettings();
  const allUsers = Object.values(mockStore.users);

  // Quick Card Lookup
  const [cardQuery, setCardQuery] = useState('');

  // Circle matching state
  const [assignMemberId, setAssignMemberId] = useState('');
  const [assignCircleId, setAssignCircleId] = useState(circles[0]?.id || '');
  const [actionNotice, setActionNotice] = useState('');
  const [actionError, setActionError] = useState('');

  if (role !== 'coordinator' && role !== 'admin') {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6 bg-[#F8FAFC]">
        <div className="max-w-md bg-white rounded-2xl p-8 border border-red-200 text-center">
          <div className="w-12 h-12 bg-red-100 text-[#DC2626] rounded-full flex items-center justify-center mx-auto mb-3">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="font-heading text-lg font-bold text-[#1B365D]">
            Restricted Coordinator &amp; Admin Console
          </h2>
          <p className="text-xs text-slate-600 mt-2 leading-relaxed">
            Access to this console requires certified Coordinator or Administrator credentials. Use the Demo Persona Switcher to inspect role-based views.
          </p>
        </div>
      </div>
    );
  }

  const notify = (msg: string) => {
    setActionError('');
    setActionNotice(msg);
    setTimeout(() => setActionNotice(''), 3500);
  };

  const runAction = async (fn: () => Promise<unknown>, successMsg: string) => {
    setActionError('');
    try {
      await fn();
      notify(successMsg);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to complete administrative action.');
    }
  };

  const handleAssignToCircle = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError('');
    if (!assignMemberId || !assignCircleId) return;
    try {
      await firebaseService.assignMemberToCircle(assignMemberId, assignCircleId);
      notify('Member assigned to circle and membership audit logged.');
      setAssignMemberId('');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to assign member.');
    }
  };

  const exportAuditData = (format: 'csv' | 'json') => {
    const content =
      format === 'json'
        ? JSON.stringify(auditLogs, null, 2)
        : [
            'id,timestamp,action,performedBy,performedByRole,targetEntity,targetId,details',
            ...auditLogs.map(
              (l) =>
                `"${l.id}","${l.timestamp}","${l.action}","${l.performedBy}","${l.performedByRole}","${l.targetEntity}","${l.targetId}","${l.details.replace(/"/g, '""')}"`
            ),
          ].join('\n');

    const blob = new Blob([content], { type: format === 'json' ? 'application/json' : 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bca-audit-logs.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Analytics derivations (strictly aggregated — zero minor PII)
  const boyMembers = allUsers.filter((u) => u.role === 'boy');
  const childCohortCount = boyMembers.filter((u) => (u.calculatedAge ?? 16) < 18).length;
  const adultCohortCount = boyMembers.filter((u) => (u.calculatedAge ?? 16) >= 18).length;
  const presentCount = attendance.filter((a) => a.status === 'present').length;
  const attendanceRate = attendance.length > 0 ? Math.round((presentCount / attendance.length) * 100) : 100;

  const districtCounts = allUsers.reduce<Record<string, number>>((acc, u) => {
    const d = u.district || 'Kampala';
    acc[d] = (acc[d] || 0) + 1;
    return acc;
  }, {});

  const filteredLogs = auditLogs.filter(
    (l) =>
      !searchQuery ||
      l.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.performedBy.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.details.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const cardLookupResult = cardQuery.trim() ? firebaseService.verifyMembershipCard(cardQuery) : null;

  const tabs: { id: ConsoleTab; label: string; icon: React.ComponentType<{ className?: string }>; adminOnly?: boolean }[] = [
    { id: 'safeguarding', label: `Safeguarding Cases (${cases.length})`, icon: ShieldAlert },
    { id: 'applications', label: 'Applications & Vetting', icon: GraduationCap },
    { id: 'circles', label: `Circles & Attendance (${circles.length})`, icon: Users },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'users_dppa', label: 'Users, RBAC & DPPA', icon: UserCog, adminOnly: true },
    { id: 'cms', label: 'Admin CMS', icon: Globe, adminOnly: true },
    { id: 'audit', label: `Audit Logs (${auditLogs.length})`, icon: FileText, adminOnly: true },
  ];

  const activeEligibleBoys = boyMembers.filter((b) => b.status === 'active');

  return (
    <div className="bg-[#F8FAFC] min-h-screen py-10 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
        {/* Console Header */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src="/assets/aistudio/Screenshot_20260801_081145_WhatsApp__1__8a50926e.jpg"
              alt="Boy Child Association Official Logo"
              className="w-12 h-12 object-contain rounded-full bg-white border border-slate-200 shrink-0 hidden sm:block"
            />
            <div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span className="font-bold text-[#005A9C]">
                  {isAdmin ? 'Administrator Governance Console' : 'District Coordinator Console'}
                </span>
                <span aria-hidden="true">·</span>
                <span>{user?.fullName}</span>
                <span aria-hidden="true">·</span>
                <span>{hasSafeguardingClearance ? 'Safeguarding Cleared' : 'Operational Access Only'}</span>
              </div>
              <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-[#1B365D] mt-0.5">
                {isAdmin ? 'Admin, CMS & Safeguarding Control' : 'Coordinator Operations Console'}
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Link
              to="/national-dashboard"
              className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#1B365D] transition-colors whitespace-nowrap"
            >
              National Overview
            </Link>
            {hasSafeguardingClearance && (
              <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-red-50 text-[#DC2626] border border-red-200 flex items-center gap-1.5 tabular-nums">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{cases.filter((c) => c.status === 'new' || c.status === 'unassigned').length} New Cases</span>
              </span>
            )}
          </div>
        </div>

        {actionNotice && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            <span>{actionNotice}</span>
          </div>
        )}
        {actionError && (
          <div className="p-3 bg-red-50 border border-red-200 text-[#DC2626] rounded-xl text-xs font-medium">
            {actionError}
          </div>
        )}

        {/* Segmented Navigation Bar */}
        <div className="flex items-center gap-1.5 border-b border-slate-200 overflow-x-auto pb-1">
          {tabs
            .filter((t) => !t.adminOnly || isAdmin)
            .map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2.5 rounded-t-xl text-xs font-semibold transition-colors whitespace-nowrap shrink-0 min-h-[44px] ${
                    isActive
                      ? 'bg-white text-[#005A9C] border border-b-0 border-slate-200'
                      : 'text-slate-600 hover:text-[#1B365D]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
        </div>

        {/* 1. SAFEGUARDING COMMAND CENTRE */}
        {activeTab === 'safeguarding' && <SafeguardingCommandView onNotice={notify} />}

        {/* 2. MEMBERSHIP, MENTOR REFEREE VETTING & PARTNER APPROVALS */}
        {activeTab === 'applications' && (
          <div className="space-y-6">
            {/* Membership Applications (5-17 vs 18-35) */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
              <h2 className="font-heading text-lg font-bold text-[#1B365D]">
                Membership Applications (Age 5–17 Minor Lock vs 18–35 Young Adults)
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-bold">
                      <th className="py-2.5 pr-4">Applicant</th>
                      <th className="py-2.5 px-4">Cohort &amp; District</th>
                      <th className="py-2.5 px-4">Guardian Requirement</th>
                      <th className="py-2.5 px-4">Status</th>
                      <th className="py-2.5 pl-4 text-right">Coordinator Review</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {membershipApps.map((app) => (
                      <tr key={app.id}>
                        <td className="py-3 pr-4 font-bold text-[#1B365D]">{app.fullName}</td>
                        <td className="py-3 px-4 text-slate-600 tabular-nums">
                          Age {app.calculatedAge} ({app.ageCategory === 'child_5_17' ? '5–17 Minor' : '18–35 Adult'}) · {app.district}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {app.ageCategory === 'child_5_17'
                            ? `Required (${app.guardianName || 'Pending'})`
                            : 'Self-consent (Adult)'}
                        </td>
                        <td className="py-3 px-4 capitalize font-semibold text-[#005A9C]">{app.status}</td>
                        <td className="py-3 pl-4 text-right space-x-2">
                          {app.status === 'pending' ? (
                            <>
                              <button
                                onClick={() =>
                                  runAction(
                                    () => firebaseService.reviewMembershipApplication(app.id, 'approved'),
                                    `Membership application approved for ${app.fullName}.`
                                  )
                                }
                                className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg font-semibold"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() =>
                                  runAction(
                                    () => firebaseService.reviewMembershipApplication(app.id, 'rejected'),
                                    `Membership application declined for ${app.fullName}.`
                                  )
                                }
                                className="px-3 py-1.5 bg-red-100 text-red-800 rounded-lg font-semibold"
                              >
                                Reject
                              </button>
                            </>
                          ) : (
                            <span className="text-slate-400">Reviewed</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mentor Vetting with Two-Referee Verification */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
              <h2 className="font-heading text-lg font-bold text-[#1B365D]">
                Mentor Vetting &amp; Mandatory Two-Referee Verification
              </h2>
              <div className="space-y-4">
                {mentorApps.map((m) => {
                  const bothRefereesVerified =
                    m.referee1.status === 'verified' && m.referee2.status === 'verified';
                  return (
                    <div key={m.id} className="p-5 rounded-xl border border-slate-200 space-y-4 text-xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                        <div>
                          <h3 className="font-heading text-base font-bold text-[#1B365D]">{m.fullName}</h3>
                          <p className="text-slate-500">
                            {m.occupation} · {m.district} · {m.availability}
                          </p>
                        </div>
                        <span className="font-bold text-[#005A9C] capitalize">
                          Status: {m.status.replace(/_/g, ' ')}
                        </span>
                      </div>

                      <p className="p-3 bg-[#F4F8FC] rounded-xl text-slate-700">{m.motivation}</p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
                          <div>
                            <strong className="block text-[#1B365D]">Referee 1: {m.referee1.name}</strong>
                            <span className="text-slate-500">{m.referee1.phone} · Status: {m.referee1.status}</span>
                          </div>
                          {m.referee1.status !== 'verified' && (
                            <button
                              onClick={() =>
                                runAction(
                                  () => firebaseService.verifyReferee(m.id, 1, 'verified'),
                                  'Referee 1 marked verified.'
                                )
                              }
                              className="px-2.5 py-1.5 bg-[#005A9C] text-white rounded-lg font-semibold"
                            >
                              Verify Ref 1
                            </button>
                          )}
                        </div>
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
                          <div>
                            <strong className="block text-[#1B365D]">Referee 2: {m.referee2.name}</strong>
                            <span className="text-slate-500">{m.referee2.phone} · Status: {m.referee2.status}</span>
                          </div>
                          {m.referee2.status !== 'verified' && (
                            <button
                              onClick={() =>
                                runAction(
                                  () => firebaseService.verifyReferee(m.id, 2, 'verified'),
                                  'Referee 2 marked verified.'
                                )
                              }
                              className="px-2.5 py-1.5 bg-[#005A9C] text-white rounded-lg font-semibold"
                            >
                              Verify Ref 2
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
                        <span className="text-slate-600">
                          {bothRefereesVerified
                            ? 'Both independent referees verified — eligible for approval.'
                            : 'Verification lock: Both Referee 1 and Referee 2 must be verified before mentor approval.'}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              runAction(
                                () => firebaseService.vetMentor(m.id, false),
                                `Mentor application declined for ${m.fullName}.`
                              )
                            }
                            className="px-3 py-1.5 bg-red-100 text-red-800 rounded-lg font-semibold min-h-[38px]"
                          >
                            Decline
                          </button>
                          <button
                            disabled={!bothRefereesVerified}
                            onClick={() =>
                              runAction(
                                () => firebaseService.vetMentor(m.id, true),
                                `Mentor approved: ${m.fullName}`
                              )
                            }
                            className="px-4 py-1.5 bg-[#005A9C] disabled:bg-slate-300 text-white rounded-lg font-semibold min-h-[38px]"
                          >
                            Approve Mentor
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Partner & Vanguard Club Applications */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
              <h2 className="font-heading text-lg font-bold text-[#1B365D]">
                School Vanguard &amp; Partner Applications
              </h2>
              <div className="space-y-3 text-xs">
                {partnerApps.map((p) => (
                  <div key={p.id} className="p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="font-bold text-[#1B365D]">{p.orgName}</div>
                      <div className="text-slate-500">
                        {p.applicationType.replace(/_/g, ' ')} · {p.district} · Contact: {p.contactPerson}
                      </div>
                      <p className="text-slate-700 mt-1">{p.proposal}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {p.status === 'pending' ? (
                        <>
                          <button
                            onClick={() =>
                              runAction(
                                () => firebaseService.reviewPartnerApplication(p.id, 'approved'),
                                `Approved partner application for ${p.orgName}.`
                              )
                            }
                            className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg font-semibold"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() =>
                              runAction(
                                () => firebaseService.reviewPartnerApplication(p.id, 'declined'),
                                `Declined partner application for ${p.orgName}.`
                              )
                            }
                            className="px-3 py-1.5 bg-red-100 text-red-800 rounded-lg font-semibold"
                          >
                            Decline
                          </button>
                        </>
                      ) : (
                        <span className="font-bold capitalize text-emerald-700">{p.status}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 3. CIRCLES MATCHING & ATTENDANCE LOGS */}
        {activeTab === 'circles' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
              <h2 className="font-heading text-lg font-bold text-[#1B365D]">
                Assign Active Member to Mentorship Circle
              </h2>
              <form onSubmit={handleAssignToCircle} className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <select
                  value={assignMemberId}
                  onChange={(e) => setAssignMemberId(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-300 min-h-[44px]"
                  required
                >
                  <option value="">Select Verified Active Member...</option>
                  {activeEligibleBoys.map((b) => (
                    <option key={b.uid} value={b.uid}>
                      {b.fullName} ({b.district})
                    </option>
                  ))}
                </select>
                <select
                  value={assignCircleId}
                  onChange={(e) => setAssignCircleId(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-300 min-h-[44px]"
                  required
                >
                  {circles.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.activeMembersCount}/{c.maxMembers})
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#005A9C] hover:bg-[#004980] text-white font-bold rounded-xl min-h-[44px]"
                >
                  Assign Member to Circle
                </button>
              </form>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {circles.map((c) => (
                <div key={c.id} className="bg-white rounded-2xl p-6 border border-slate-200 space-y-2 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="font-bold text-[#005A9C] uppercase">{c.district}</span>
                    <span className="font-semibold capitalize text-emerald-700">{c.status}</span>
                  </div>
                  <h3 className="font-heading text-base font-bold text-[#1B365D]">{c.name}</h3>
                  <div className="text-slate-600">Lead Mentor: <strong>{c.leadMentorName}</strong></div>
                  <div className="text-slate-600">{c.meetingTime} · {c.locationName}</div>
                  <div className="pt-2 font-mono font-bold text-[#005A9C] tabular-nums">
                    {c.activeMembersCount} / {c.maxMembers} Members Enrolled
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h3 className="font-heading text-base font-bold text-[#1B365D] flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-[#005A9C]" />
                  <span>Quick Digital Membership Card Verification</span>
                </h3>
                <Link to="/verify" className="text-[#005A9C] font-bold hover:underline">
                  Open Public QR Scanner Page &rarr;
                </Link>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={cardQuery}
                    onChange={(e) => setCardQuery(e.target.value)}
                    placeholder="Enter Membership ID (e.g. BCA-UG-2026-0101)..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 min-h-[40px] font-mono"
                  />
                </div>
              </div>
              {cardQuery.trim() && (
                cardLookupResult ? (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <strong>{cardLookupResult.fullNamePrivate}</strong> ·{' '}
                      <span className="font-mono">{cardLookupResult.membershipNumber}</span> · {cardLookupResult.district}
                    </div>
                    <span className="font-bold uppercase text-emerald-800">{cardLookupResult.status}</span>
                  </div>
                ) : (
                  <p className="text-[#DC2626] font-semibold">No matching digital membership card found.</p>
                )
              )}
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3 text-xs">
              <h3 className="font-heading text-base font-bold text-[#1B365D]">
                Recent Mentor Circle Progress Reports ({progressReports.length})
              </h3>
              {progressReports.length === 0 ? (
                <p className="text-slate-500">No mentor progress reports submitted yet.</p>
              ) : (
                <div className="space-y-2.5">
                  {progressReports.slice(0, 6).map((rep) => (
                    <div key={rep.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                      <div className="flex justify-between font-bold text-[#1B365D]">
                        <span>{rep.circleName} · {rep.reportingPeriod}</span>
                        <span className="text-[#005A9C]">{rep.mentorName}</span>
                      </div>
                      <div className="text-slate-700">{rep.attendanceSummary}</div>
                      <div className="text-slate-600">{rep.keyMilestones}</div>
                      <div className="text-emerald-800">Safeguarding: {rep.safeguardingObservations}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 4. AGGREGATED ANALYTICS (ZERO MINOR PII) */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <div className="text-xs text-slate-500">Ages 5–17 Minor Members</div>
                <div className="font-heading text-3xl font-extrabold text-[#1B365D] mt-1 tabular-nums">
                  {childCohortCount}
                </div>
                <div className="text-[11px] text-[#005A9C] mt-1">Guardian consent enforced</div>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <div className="text-xs text-slate-500">Ages 18–35 Young Adults</div>
                <div className="font-heading text-3xl font-extrabold text-[#1B365D] mt-1 tabular-nums">
                  {adultCohortCount}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">Self-consent vocational track</div>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <div className="text-xs text-slate-500">Verified Session Attendance Rate</div>
                <div className="font-heading text-3xl font-extrabold text-emerald-700 mt-1 tabular-nums">
                  {attendanceRate}%
                </div>
                <div className="text-[11px] text-slate-500 mt-1">Across {attendance.length} logged marks</div>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <div className="text-xs text-slate-500">Active Safeguarding Cases</div>
                <div className="font-heading text-3xl font-extrabold text-[#DC2626] mt-1 tabular-nums">
                  {cases.filter((c) => c.status !== 'resolved').length}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">Zero minor PII exposed in analytics</div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
                <h3 className="font-heading text-base font-bold text-[#1B365D]">
                  Member &amp; Volunteer Distribution by Uganda District
                </h3>
                <div className="space-y-3 text-xs">
                  {Object.entries(districtCounts).map(([dist, count]) => {
                    const pct = Math.max(12, Math.round((count / allUsers.length) * 100));
                    return (
                      <div key={dist} className="space-y-1">
                        <div className="flex justify-between font-medium text-slate-700">
                          <span>{dist}</span>
                          <span className="font-mono tabular-nums">{count} accounts</span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-[#005A9C] rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
                <h3 className="font-heading text-base font-bold text-[#1B365D]">
                  Safeguarding Case Workflow Breakdown
                </h3>
                <div className="space-y-3 text-xs">
                  {(['new', 'under_review', 'follow_up', 'escalated', 'resolved'] as const).map((st) => {
                    const cnt = cases.filter((c) => c.status === st).length;
                    const pct = cases.length > 0 ? Math.round((cnt / cases.length) * 100) : 0;
                    return (
                      <div key={st} className="space-y-1">
                        <div className="flex justify-between font-medium text-slate-700 capitalize">
                          <span>{st.replace(/_/g, ' ')}</span>
                          <span className="font-mono tabular-nums">{cnt}</span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${st === 'resolved' ? 'bg-emerald-600' : 'bg-[#60C1E5]'}`}
                            style={{ width: `${Math.max(8, pct)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 5. ADMIN USER MANAGEMENT, RBAC & DPPA COMPLIANCE */}
        {activeTab === 'users_dppa' && isAdmin && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
              <h2 className="font-heading text-lg font-bold text-[#1B365D]">
                User Directory, Role Assignment &amp; Safeguarding Clearance
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-bold">
                      <th className="py-2.5 pr-4">User &amp; District</th>
                      <th className="py-2.5 px-4">Current Status</th>
                      <th className="py-2.5 px-4">Role Assignment</th>
                      <th className="py-2.5 px-4">Safeguarding Cleared</th>
                      <th className="py-2.5 pl-4 text-right">Account State</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {allUsers.map((u) => (
                      <tr key={u.uid}>
                        <td className="py-3 pr-4">
                          <div className="font-bold text-[#1B365D]">{u.fullName}</div>
                          <div className="text-slate-500">{u.email} · {u.district}</div>
                        </td>
                        <td className="py-3 px-4 capitalize font-semibold text-slate-700">
                          {u.status.replace(/_/g, ' ')}
                        </td>
                        <td className="py-3 px-4">
                          <select
                            aria-label={`Assign role for ${u.fullName}`}
                            value={u.role}
                            onChange={(e) => {
                              const nextRole = e.target.value as UserRole;
                              runAction(
                                () => firebaseService.assignUserRole(u.uid, nextRole, u.safeguardingCleared),
                                `Updated role for ${u.fullName} to ${nextRole}.`
                              );
                            }}
                            className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs"
                          >
                            <option value="boy">boy</option>
                            <option value="guardian">guardian</option>
                            <option value="mentor">mentor</option>
                            <option value="partner">partner</option>
                            <option value="coordinator">coordinator</option>
                            <option value="admin">admin</option>
                          </select>
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() =>
                              runAction(
                                () => firebaseService.assignUserRole(u.uid, u.role, !u.safeguardingCleared),
                                `Updated safeguarding clearance for ${u.fullName}.`
                              )
                            }
                            className={`px-2.5 py-1 rounded-lg font-semibold ${
                              u.safeguardingCleared || u.role === 'admin'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {u.safeguardingCleared || u.role === 'admin' ? 'Cleared' : 'Standard'}
                          </button>
                        </td>
                        <td className="py-3 pl-4 text-right">
                          {u.uid !== user?.uid && (
                            <button
                              onClick={() => {
                                const shouldSuspend = u.status !== 'suspended';
                                runAction(
                                  () =>
                                    firebaseService.suspendUser(
                                      u.uid,
                                      shouldSuspend,
                                      shouldSuspend ? 'Suspended during administrative review.' : 'Reactivated by admin.'
                                    ),
                                  `${u.fullName} ${shouldSuspend ? 'suspended' : 'reactivated'}.`
                                );
                              }}
                              className={`px-3 py-1.5 rounded-lg font-semibold ${
                                u.status === 'suspended'
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-red-100 text-red-800 hover:bg-red-200'
                              }`}
                            >
                              {u.status === 'suspended' ? 'Reactivate' : 'Suspend'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <h2 className="font-heading text-lg font-bold text-[#1B365D]">
                  Uganda DPPA 2019 SAR &amp; Retention Queue
                </h2>
                <span className="text-xs font-mono text-slate-500 tabular-nums">
                  Retention Policy: Apps {cmsSettings.retentionDays.membershipApps}d · Logs {cmsSettings.retentionDays.auditLogs}d · Cases {cmsSettings.retentionDays.safeguardingCasesYears}y
                </span>
              </div>
              <div className="space-y-2.5 text-xs">
                {dppaRequests.length === 0 ? (
                  <p className="text-slate-500">No DPPA requests in queue.</p>
                ) : (
                  dppaRequests.map((req) => (
                    <div
                      key={req.id}
                      className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <strong className="text-[#1B365D]">
                          {req.userName} · {req.type.toUpperCase()}
                        </strong>
                        <p className="text-slate-600">{req.reason}</p>
                        {req.resolutionNotes && (
                          <p className="text-[11px] text-slate-500 mt-0.5">Resolution: {req.resolutionNotes}</p>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                        <span className="font-bold capitalize text-[#005A9C] mr-2">
                          {req.status.replace(/_/g, ' ')}
                        </span>
                        {req.status === 'pending' && (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                runAction(
                                  () =>
                                    firebaseService.reviewDppaRequest(
                                      req.id,
                                      'completed',
                                      'Fulfilled under Uganda DPPA 2019.'
                                    ),
                                  `Marked DPPA request ${req.id} completed.`
                                )
                              }
                              className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg font-semibold"
                            >
                              Complete
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                runAction(
                                  () =>
                                    firebaseService.reviewDppaRequest(
                                      req.id,
                                      'held_for_safeguarding',
                                      'Retained under Children Act child protection exemption.'
                                    ),
                                  `Placed statutory child-protection hold on DPPA request ${req.id}.`
                                )
                              }
                              className="px-2.5 py-1 bg-amber-100 text-amber-900 rounded-lg font-semibold"
                            >
                              Hold (Safeguarding)
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                runAction(
                                  () =>
                                    firebaseService.reviewDppaRequest(
                                      req.id,
                                      'rejected',
                                      'Insufficient identity verification or invalid request.'
                                    ),
                                  `Rejected DPPA request ${req.id}.`
                                )
                              }
                              className="px-2.5 py-1 bg-red-100 text-red-800 rounded-lg font-semibold"
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
              <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <h2 className="font-heading text-lg font-bold text-[#1B365D] flex items-center gap-2">
                  <Mail className="w-4 h-4 text-[#005A9C]" />
                  <span>Public Contact Inquiries ({contactMessages.length})</span>
                </h2>
              </div>
              <div className="space-y-2.5 text-xs">
                {contactMessages.length === 0 ? (
                  <p className="text-slate-500">No contact inquiries received yet.</p>
                ) : (
                  contactMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="font-bold text-[#1B365D]">
                          {msg.subject} · <span className="text-[#005A9C]">{msg.fullName}</span>
                        </div>
                        <div className="text-slate-500">
                          {msg.email} · {msg.phone}
                        </div>
                        <p className="text-slate-700">{msg.message}</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {(['new', 'in_progress', 'resolved'] as const).map((st) => (
                          <button
                            key={st}
                            type="button"
                            onClick={() =>
                              runAction(
                                () => firebaseService.updateContactMessageStatus(msg.id, st, user?.fullName),
                                `Inquiry updated to ${st.replace(/_/g, ' ')}.`
                              )
                            }
                            className={`px-2.5 py-1 rounded-lg font-semibold capitalize ${
                              msg.status === st
                                ? 'bg-[#005A9C] text-white'
                                : 'bg-white border border-slate-200 text-slate-600'
                            }`}
                          >
                            {st.replace(/_/g, ' ')}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* 6. ADMIN CMS */}
        {activeTab === 'cms' && isAdmin && <CmsEditorTab />}

        {/* 7. AUDIT LOGS & EXPORT */}
        {activeTab === 'audit' && isAdmin && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h2 className="font-heading text-lg font-bold text-[#1B365D]">
                  Immutable Safeguarding &amp; Admin Audit Logs
                </h2>
                <p className="text-xs text-slate-500">
                  Every consent signature, withdrawal, safeguarding case open, role assignment, and CMS publish action is recorded.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filter audit logs..."
                    className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs min-h-[40px]"
                  />
                </div>
                <button
                  onClick={() => exportAuditData('csv')}
                  className="px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-[#1B365D] hover:bg-slate-50 flex items-center gap-1.5 min-h-[40px]"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>
                <button
                  onClick={() => exportAuditData('json')}
                  className="px-3.5 py-2 rounded-xl bg-[#005A9C] text-white text-xs font-semibold hover:bg-[#004980] flex items-center gap-1.5 min-h-[40px]"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export JSON</span>
                </button>
              </div>
            </div>

            <div className="space-y-2.5">
              {filteredLogs.map((log) => (
                <div key={log.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-bold text-[#005A9C]">{log.action}</span>
                    <span className="text-[11px] text-slate-500 font-mono tabular-nums">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-slate-800 font-medium">{log.details}</div>
                  <div className="text-[11px] text-slate-500">
                    Actor: <strong>{log.performedBy}</strong> ({log.performedByRole}) · Entity: {log.targetEntity}/{log.targetId}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
