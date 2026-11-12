import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { firebaseService } from '../../lib/firebase/firebase';
import { mockStore } from '../../lib/firebase/mockStore';
import { ConcernReport } from '../../types';
import {
  ShieldAlert,
  UserCheck,
  GraduationCap,
  Users,
  FileText,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  Eye,
  Lock
} from 'lucide-react';

type AdminTab = 'safeguarding' | 'mentors' | 'circles' | 'audit';

export const AdminConsolePage: React.FC = () => {
  const { user, role } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('safeguarding');

  // Reports
  const reports = firebaseService.getConcernReports();
  const mentorApps = firebaseService.getMentorApplications();
  const circles = firebaseService.getCircles();
  const auditLogs = firebaseService.getAuditLogs();
  const allUsers = Object.values(mockStore.users);

  // Selected report triage modal
  const [activeReport, setActiveReport] = useState<ConcernReport | null>(null);
  const [triageStatus, setTriageStatus] = useState<ConcernReport['status']>('investigating');
  const [triageNotes, setTriageNotes] = useState('');

  // Access check
  if (role !== 'coordinator' && role !== 'admin') {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6 bg-[#F8FAFC]">
        <div className="max-w-md bg-white rounded-2xl p-8 border border-red-200 text-center shadow-md">
          <div className="w-12 h-12 bg-red-100 text-[#DC2626] rounded-full flex items-center justify-center mx-auto mb-3">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="font-heading text-lg font-bold text-[#1B365D]">
            Restricted Safeguarding Console
          </h2>
          <p className="text-xs text-slate-600 mt-2">
            Access to this area requires certified Coordinator or Administrator privileges to safeguard children&apos;s confidential records.
          </p>
          <div className="mt-4 p-3 bg-slate-50 rounded-xl text-xs text-slate-500">
            Use the <strong>Demo Persona Switcher</strong> in the top header to switch to <strong>Sister Sarah (Coordinator)</strong> or <strong>Dr. Kato (Admin)</strong>.
          </div>
        </div>
      </div>
    );
  }

  const handleSaveTriage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeReport) return;
    firebaseService.updateConcernStatus(activeReport.id, triageStatus, triageNotes);
    setActiveReport(null);
  };

  const handleVetMentor = (appId: string, approved: boolean) => {
    firebaseService.vetMentor(appId, approved);
  };

  const urgencyStyles: Record<string, string> = {
    low: 'bg-slate-100 text-slate-800',
    medium: 'bg-amber-100 text-amber-900 border border-amber-200',
    high: 'bg-orange-100 text-orange-900 border border-orange-200',
    immediate: 'bg-red-100 text-red-900 font-bold border border-red-300'
  };

  return (
    <div className="bg-[#F8FAFC] min-h-screen py-10 sm:py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
        {/* Header */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src="/assets/aistudio/Screenshot_20260801_081145_WhatsApp__1__8a50926e.jpg"
              alt="Boy Child Association Official Logo"
              className="w-14 h-14 object-contain rounded-full shadow-sm bg-white border border-slate-200 shrink-0 hidden sm:block"
            />
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#005A9C]">
                <ShieldAlert className="w-4 h-4 text-[#DC2626]" />
                <span>Uganda Safeguarding &amp; Coordination Console</span>
                <span aria-hidden="true">·</span>
                <span className="text-slate-500">Standing Up As A Man</span>
              </div>
              <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-[#1B365D] mt-1">
                Admin &amp; Safeguarding Leads
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Logged in as: <strong className="text-slate-800">{user?.fullName}</strong> ({role.toUpperCase()})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-red-50 text-[#DC2626] border border-red-200 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{reports.filter((r) => r.status === 'new').length} New Concerns</span>
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab('safeguarding')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-colors whitespace-nowrap min-h-[44px] ${
              activeTab === 'safeguarding'
                ? 'bg-white text-[#DC2626] border-t-2 border-[#DC2626] shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Concern Reports ({reports.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('mentors')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-colors whitespace-nowrap min-h-[44px] ${
              activeTab === 'mentors'
                ? 'bg-white text-[#005A9C] border-t-2 border-[#005A9C] shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Mentor Vetting ({mentorApps.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('circles')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-colors whitespace-nowrap min-h-[44px] ${
              activeTab === 'circles'
                ? 'bg-white text-[#005A9C] border-t-2 border-[#005A9C] shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Circle Matching ({circles.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-colors whitespace-nowrap min-h-[44px] ${
              activeTab === 'audit'
                ? 'bg-white text-[#1B365D] border-t-2 border-[#1B365D] shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Audit Trail ({auditLogs.length})</span>
          </button>
        </div>

        {/* 1. SAFEGUARDING CONCERN REPORTS TAB */}
        {activeTab === 'safeguarding' && (
          <div className="space-y-4">
            <div className="bg-red-50/70 border border-red-200 rounded-2xl p-4 text-xs text-red-950 flex items-start gap-2.5">
              <ShieldAlert className="w-5 h-5 text-[#DC2626] shrink-0 mt-0.5" />
              <div>
                <strong>Confidential Safeguarding Queue:</strong> Only certified child protection leads can view these reports. Never disclose reporter details outside legal investigation channels.
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                      <th className="py-3 px-4">Ref ID</th>
                      <th className="py-3 px-4">Urgency</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">District</th>
                      <th className="py-3 px-4">Reporter Type</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Triage Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {reports.map((rep) => (
                      <tr key={rep.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-[#005A9C]">{rep.id}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[11px] uppercase ${urgencyStyles[rep.urgency]}`}>
                            {rep.urgency}
                          </span>
                        </td>
                        <td className="py-3 px-4 capitalize font-medium text-slate-800">
                          {rep.concernCategory.replace(/_/g, ' ')}
                        </td>
                        <td className="py-3 px-4 text-slate-600">{rep.district}</td>
                        <td className="py-3 px-4 text-slate-600">
                          {rep.isAnonymous ? 'Anonymous' : rep.reporterName}
                        </td>
                        <td className="py-3 px-4">
                          <span className="capitalize px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-800">
                            {rep.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => {
                              setActiveReport(rep);
                              setTriageStatus(rep.status);
                              setTriageNotes(rep.triageNotes || '');
                            }}
                            className="px-3 py-1.5 bg-[#005A9C] text-white rounded-lg text-xs font-semibold hover:bg-[#004980]"
                          >
                            Inspect &amp; Triage
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 2. MENTOR VETTING TAB */}
        {activeTab === 'mentors' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-6">
              <h2 className="font-heading text-lg font-bold text-[#1B365D]">
                Pending Mentor Background &amp; Referee Vetting
              </h2>

              <div className="space-y-6">
                {mentorApps.map((m) => (
                  <div
                    key={m.id}
                    className="p-5 rounded-2xl border border-slate-200 bg-white space-y-4 shadow-2xs"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                      <div>
                        <h3 className="font-heading text-base font-bold text-[#1B365D]">
                          {m.fullName}
                        </h3>
                        <p className="text-xs text-slate-500">
                          {m.occupation} · District: {m.district} · Availability: {m.availability}
                        </p>
                      </div>
                      <span className="text-xs font-semibold text-purple-800 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200">
                        Status: {m.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="text-xs text-slate-700 bg-[#F4F8FC] p-3 rounded-xl border border-blue-100">
                      <strong className="block text-[#005A9C] mb-1">Motivation Statement:</strong>
                      &ldquo;{m.motivation}&rdquo;
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="font-bold text-slate-800 block">Referee 1:</span>
                        <div>{m.referee1.name} · {m.referee1.phone}</div>
                        <div className="text-[11px] text-emerald-700 font-semibold mt-1">
                          Verification: {m.referee1.status}
                        </div>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="font-bold text-slate-800 block">Referee 2:</span>
                        <div>{m.referee2.name} · {m.referee2.phone}</div>
                        <div className="text-[11px] text-amber-700 font-semibold mt-1">
                          Verification: {m.referee2.status}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                      <span className="text-slate-500">
                        Clearance check: <strong>{m.dbsSafeguardingCheck}</strong>
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleVetMentor(m.id, false)}
                          className="px-3 py-1.5 bg-red-100 text-red-800 hover:bg-red-200 font-semibold rounded-lg"
                        >
                          Decline
                        </button>
                        <button
                          onClick={() => handleVetMentor(m.id, true)}
                          className="px-4 py-1.5 bg-[#005A9C] text-white hover:bg-[#004980] font-semibold rounded-lg shadow-xs"
                        >
                          Approve Mentor
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 3. CIRCLE MATCHING TAB */}
        {activeTab === 'circles' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {circles.map((c) => (
                <div key={c.id} className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-xs font-bold text-[#005A9C] uppercase">{c.district}</span>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800">
                      {c.status}
                    </span>
                  </div>
                  <h3 className="font-heading text-base font-bold text-[#1B365D]">{c.name}</h3>
                  <div className="text-xs text-slate-600 space-y-1">
                    <div>Lead Mentor: <strong>{c.leadMentorName}</strong></div>
                    <div>Meeting: {c.meetingTime}</div>
                    <div>Location: {c.locationName}</div>
                    <div className="pt-2 font-mono font-bold text-[#005A9C]">
                      Enrolled: {c.activeMembersCount} / {c.maxMembers} Boys
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. AUDIT LOG TAB */}
        {activeTab === 'audit' && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="font-heading text-lg font-bold text-[#1B365D]">
                Tamper-Evident Administrative Audit Log
              </h2>
              <span className="text-xs text-slate-400 font-mono">Immutable append-only ledger</span>
            </div>

            <div className="space-y-3">
              {auditLogs.map((log) => (
                <div key={log.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-[#005A9C]">{log.action}</span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-slate-800 font-medium">
                    {log.details}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    By: <strong>{log.performedBy}</strong> ({log.performedByRole}) · Target: {log.targetEntity}/{log.targetId}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Triage Modal for Safeguarding Reports */}
        {activeReport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="w-full max-w-xl bg-white rounded-2xl p-6 shadow-2xl relative space-y-4">
              <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-heading text-lg font-bold text-[#DC2626]">
                    Triage Safeguarding Report: {activeReport.id}
                  </h3>
                  <div className="text-xs text-slate-500">
                    Filed: {new Date(activeReport.createdAt).toLocaleString()} · District: {activeReport.district}
                  </div>
                </div>
                <button
                  onClick={() => setActiveReport(null)}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-700"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-800 space-y-2">
                <div>
                  <strong>Category:</strong> <span className="capitalize">{activeReport.concernCategory.replace(/_/g, ' ')}</span>
                </div>
                <div>
                  <strong>Urgency:</strong> <span className="font-bold uppercase text-red-700">{activeReport.urgency}</span>
                </div>
                <div>
                  <strong>Reporter:</strong> {activeReport.isAnonymous ? 'Anonymous' : `${activeReport.reporterName} (${activeReport.reporterContact})`}
                </div>
                {activeReport.boyName && (
                  <div><strong>Affected Boy:</strong> {activeReport.boyName}</div>
                )}
                <div className="pt-2 border-t border-slate-200">
                  <strong>Details:</strong>
                  <p className="mt-1 leading-relaxed bg-white p-3 rounded-lg border border-slate-200 font-sans">
                    {activeReport.details}
                  </p>
                </div>
              </div>

              <form onSubmit={handleSaveTriage} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Update Investigation Status
                  </label>
                  <select
                    value={triageStatus}
                    onChange={(e) => setTriageStatus(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-[#005A9C] min-h-[44px]"
                  >
                    <option value="new">New (Unreviewed)</option>
                    <option value="investigating">Investigating / Coordinator Contacted</option>
                    <option value="escalated_to_local_authorities">Escalated to Uganda Police CFPU</option>
                    <option value="resolved">Resolved / Child Safe in Circle</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Triage Notes &amp; Action Plan (Confidential)
                  </label>
                  <textarea
                    rows={3}
                    value={triageNotes}
                    onChange={(e) => setTriageNotes(e.target.value)}
                    placeholder="Record notes on pastoral visits, parent interviews, or official authority escalations..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-[#005A9C]"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setActiveReport(null)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-[#005A9C] hover:bg-[#004980] text-white text-xs font-bold rounded-xl"
                  >
                    Save Triage Notes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
