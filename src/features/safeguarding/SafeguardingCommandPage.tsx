import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useSafeguardingData } from '../../hooks/usePlatformData';
import { firebaseService } from '../../lib/firebase/firebase';
import { mockStore } from '../../lib/firebase/mockStore';
import { uploadSafeguardingEvidence } from '../../lib/firebase/storage';
import { safeguardingFollowUpSchema, safeguardingTriageSchema, validateDocumentFile } from '../../lib/validation/schemas';
import { SafeguardingCase } from '../../types';
import {
  ShieldAlert,
  Lock,
  Search,
  PhoneCall,
  XCircle,
  CheckCircle2,
  ClipboardCheck,
  History,
  UserCheck,
  AlertTriangle,
  Upload,
  Paperclip,
  ArrowUpRight,
} from 'lucide-react';

export const SafeguardingCommandView: React.FC<{ onNotice?: (msg: string) => void }> = ({ onNotice }) => {
  const { user, role } = useAuth();
  const isAdmin = role === 'admin';
  const hasSafeguardingClearance = isAdmin || (role === 'coordinator' && Boolean(user?.safeguardingCleared));
  useSafeguardingData(hasSafeguardingClearance);

  const [searchQuery, setSearchQuery] = useState('');
  const [urgencyFilter, setUrgencyFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [localNotice, setLocalNotice] = useState('');
  const [localError, setLocalError] = useState('');

  // Active Case Detail Modal
  const [activeCaseId, setActiveCaseId] = useState<string | null>(null);
  const [caseStatus, setCaseStatus] = useState<SafeguardingCase['status']>('under_review');
  const [caseLead, setCaseLead] = useState('');
  const [caseNotes, setCaseNotes] = useState('');
  const [escalationChannel, setEscalationChannel] = useState<string>('');
  const [escalationRef, setEscalationRef] = useState('');
  const [evidenceUploading, setEvidenceUploading] = useState(false);

  // Follow-up Form
  const [followAction, setFollowAction] = useState('');
  const [followOutcome, setFollowOutcome] = useState('');
  const [followReviewDate, setFollowReviewDate] = useState('');

  const cases = firebaseService.getSafeguardingCases();
  const concernReports = firebaseService.getConcernReports();
  const unpromotedReports = concernReports.filter((r) => !cases.some((c) => c.reportId === r.id));
  const auditLogs = firebaseService.getAuditLogs();
  const clearedLeads = Object.values(mockStore.users).filter(
    (u) => u.role === 'admin' || (u.role === 'coordinator' && Boolean(u.safeguardingCleared))
  );

  const activeCase = activeCaseId ? cases.find((c) => c.id === activeCaseId) || null : null;

  if (!hasSafeguardingClearance) {
    return (
      <div className="bg-white rounded-2xl border border-red-200 p-8 text-center max-w-2xl mx-auto space-y-3">
        <div className="w-12 h-12 rounded-full bg-red-50 text-[#DC2626] flex items-center justify-center mx-auto">
          <Lock className="w-6 h-6" />
        </div>
        <h2 className="font-heading text-lg font-bold text-[#1B365D]">
          Safeguarding Clearance Required
        </h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          Under Uganda Children Act (Cap 59) child protection segregation, confidential incident reports and triage follow-ups are isolated from general event/circle coordinators and restricted strictly to Administrators and explicitly cleared Safeguarding Leads (<code className="font-mono">safeguardingCleared === true</code>).
        </p>
        <p className="text-[11px] text-slate-500">
          Urgent concerns can always be reported directly through Sauti 116 or the confidential Report a Concern form without accessing historical case files.
        </p>
      </div>
    );
  }

  const pushNotice = (msg: string) => {
    setLocalError('');
    setLocalNotice(msg);
    onNotice?.(msg);
    setTimeout(() => setLocalNotice(''), 4000);
  };

  const openSafeguardingCase = (sc: SafeguardingCase) => {
    firebaseService.logSafeguardingAccess(sc.id, 'viewed_case');
    setActiveCaseId(sc.id);
    setCaseStatus(sc.status);
    setCaseLead(sc.assignedLeadName || user?.fullName || '');
    setCaseNotes(sc.triageNotes || '');
    setEscalationChannel(sc.escalationChannel || '');
    setEscalationRef(sc.escalationRef || '');
    setLocalError('');
  };

  const handlePromoteReport = async (reportId: string) => {
    setLocalError('');
    try {
      const promoted = await firebaseService.promoteConcernToCase(reportId);
      pushNotice(`Concern report promoted to safeguarding case ${promoted.refNumber}.`);
      openSafeguardingCase(promoted);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Unable to promote concern report.');
    }
  };

  const handleSaveCaseTriage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCase) return;
    const parsed = safeguardingTriageSchema.safeParse({
      status: caseStatus,
      triageNotes: caseNotes,
      assignedLeadName: caseLead,
      escalationChannel: escalationChannel ? escalationChannel : undefined,
      escalationRef: escalationRef || undefined,
    });
    if (!parsed.success) {
      setLocalError(parsed.error.issues[0]?.message || 'Check triage details.');
      return;
    }
    try {
      await firebaseService.triageSafeguardingCase(
        activeCase.id,
        parsed.data.status,
        parsed.data.triageNotes,
        parsed.data.assignedLeadName,
        parsed.data.escalationChannel,
        parsed.data.escalationRef
      );
      if (parsed.data.escalationChannel) {
        firebaseService.logSafeguardingAccess(activeCase.id, 'escalated_case');
      }
      pushNotice(`Safeguarding case ${activeCase.refNumber} updated.`);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Unable to save case action.');
    }
  };

  const handleAddFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCase) return;
    const parsed = safeguardingFollowUpSchema.safeParse({
      caseId: activeCase.id,
      actionTaken: followAction,
      outcome: followOutcome,
      nextReviewDate: followReviewDate || undefined,
    });
    if (!parsed.success) {
      setLocalError(parsed.error.issues[0]?.message || 'Provide follow-up action and outcome.');
      return;
    }
    try {
      await firebaseService.addSafeguardingFollowUp(activeCase.id, {
        actionTaken: parsed.data.actionTaken,
        outcome: parsed.data.outcome,
        nextReviewDate: parsed.data.nextReviewDate,
      });
      setFollowAction('');
      setFollowOutcome('');
      setFollowReviewDate('');
      pushNotice(`Follow-up action logged on ${activeCase.refNumber}.`);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Unable to log follow-up action.');
    }
  };

  const handleUploadEvidence = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeCase) return;
    setLocalError('');
    const check = validateDocumentFile(file);
    if (!check.valid) {
      setLocalError(check.error || 'Invalid safeguarding evidence file.');
      return;
    }
    setEvidenceUploading(true);
    try {
      const meta = await uploadSafeguardingEvidence(activeCase.id, file);
      await firebaseService.attachSafeguardingEvidence(activeCase.id, meta);
      pushNotice(`Evidence file attached to ${activeCase.refNumber}.`);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Unable to upload safeguarding evidence.');
    } finally {
      setEvidenceUploading(false);
    }
  };

  const filteredCases = cases.filter((c) => {
    const matchesUrgency = urgencyFilter === 'all' || c.urgency === urgencyFilter;
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    const q = searchQuery.toLowerCase();
    const matchesQuery =
      !q ||
      c.refNumber.toLowerCase().includes(q) ||
      c.district.toLowerCase().includes(q) ||
      c.concernCategory.toLowerCase().includes(q) ||
      c.assignedLeadName.toLowerCase().includes(q);
    return matchesUrgency && matchesStatus && matchesQuery;
  });

  const urgencyStyles: Record<string, string> = {
    low: 'bg-slate-100 text-slate-800',
    medium: 'bg-amber-100 text-amber-900 border border-amber-200',
    high: 'bg-orange-100 text-orange-900 border border-orange-200',
    immediate: 'bg-red-100 text-red-900 font-bold border border-red-300',
  };

  const caseAuditHistory = activeCase
    ? auditLogs.filter((l) => l.targetId === activeCase.id || l.targetId === activeCase.reportId)
    : [];

  return (
    <div className="space-y-4">
      <div className="bg-red-50/70 border border-red-200 rounded-2xl p-4 text-xs text-red-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <ShieldAlert className="w-5 h-5 text-[#DC2626] shrink-0 mt-0.5" />
          <div>
            <strong>Safeguarding Command Centre (Independent Clearance):</strong> Every view, assignment, follow-up, and escalation writes an immutable record to <code className="font-mono">auditLogs</code>. Statutory protocols should be reviewed by a qualified Ugandan legal or child-protection professional prior to production launch.
          </div>
        </div>
        <div className="flex items-center gap-2 text-[#DC2626] font-bold shrink-0">
          <PhoneCall className="w-4 h-4" />
          <span>Sauti 116 · CFPU 0800 199 699</span>
        </div>
      </div>

      {localNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-700" />
          <span>{localNotice}</span>
        </div>
      )}
      {localError && !activeCase && (
        <div className="p-3 bg-red-50 border border-red-200 text-[#DC2626] rounded-xl text-xs font-semibold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{localError}</span>
        </div>
      )}

      {/* Incoming Unpromoted Concern Reports Queue */}
      {unpromotedReports.length > 0 && (
        <div className="bg-amber-50/70 border border-amber-300 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-heading text-sm font-bold text-amber-950 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-700" />
              <span>Unpromoted Concern Reports Queue ({unpromotedReports.length})</span>
            </h3>
            <span className="text-[11px] font-semibold text-amber-800">Immediate intake awaiting case open</span>
          </div>
          <div className="space-y-2.5 text-xs">
            {unpromotedReports.map((rep) => (
              <div
                key={rep.id}
                className="bg-white p-3.5 rounded-xl border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-bold text-[#005A9C]">{rep.refNumber}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase ${urgencyStyles[rep.urgency]}`}>
                      {rep.urgency}
                    </span>
                    <span className="capitalize font-semibold text-[#1B365D]">
                      {rep.concernCategory.replace(/_/g, ' ')}
                    </span>
                    <span className="text-slate-500">· {rep.district}</span>
                  </div>
                  <p className="text-slate-700 line-clamp-2">{rep.details}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handlePromoteReport(rep.id)}
                  className="px-3.5 py-2 bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold rounded-xl shrink-0 min-h-[38px]"
                >
                  Open Case from Report
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter cases by reference number, district, lead, or category..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 min-h-[40px]"
          />
        </div>
        <select
          value={urgencyFilter}
          onChange={(e) => setUrgencyFilter(e.target.value)}
          className="px-3 py-2 text-xs rounded-xl border border-slate-200 min-h-[40px]"
        >
          <option value="all">All Urgency Levels</option>
          <option value="immediate">Immediate</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-xs rounded-xl border border-slate-200 min-h-[40px]"
        >
          <option value="all">All Workflow Statuses</option>
          <option value="new">New</option>
          <option value="unassigned">Unassigned</option>
          <option value="under_review">Under Review</option>
          <option value="follow_up">Follow Up</option>
          <option value="escalated">Escalated</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      {/* Cases Queue Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                <th className="py-3 px-4">Reference</th>
                <th className="py-3 px-4">Urgency</th>
                <th className="py-3 px-4">Category &amp; District</th>
                <th className="py-3 px-4">Assigned Lead</th>
                <th className="py-3 px-4">Follow-Ups &amp; Escalation</th>
                <th className="py-3 px-4">Workflow Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCases.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No safeguarding cases match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredCases.map((sc) => (
                  <tr key={sc.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono font-bold text-[#005A9C]">{sc.refNumber}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[11px] uppercase ${urgencyStyles[sc.urgency]}`}>
                        {sc.urgency}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      <span className="capitalize font-semibold">{sc.concernCategory.replace(/_/g, ' ')}</span>
                      <span className="block text-slate-500">{sc.district}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-medium">{sc.assignedLeadName}</td>
                    <td className="py-3 px-4 text-slate-600 tabular-nums">
                      <span>{(sc.followUps || []).length} logged</span>
                      {sc.escalationChannel && (
                        <span className="block text-[11px] text-[#DC2626] font-semibold">{sc.escalationChannel}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 capitalize font-semibold text-[#1B365D]">
                      {sc.status.replace(/_/g, ' ')}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => openSafeguardingCase(sc)}
                        className="px-3 py-1.5 bg-[#005A9C] hover:bg-[#004980] text-white rounded-lg text-xs font-semibold min-h-[36px] whitespace-nowrap"
                      >
                        Open &amp; Triage
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Case Triage, Follow-Up & Audit History Modal */}
      {activeCase && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 overflow-y-auto">
          <div className="w-full max-w-3xl bg-white rounded-2xl p-6 shadow-2xl space-y-5 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-heading text-lg font-bold text-[#DC2626]">
                  Safeguarding Case Triage: {activeCase.refNumber}
                </h3>
                <p className="text-xs text-slate-500">
                  Opened {new Date(activeCase.createdAt).toLocaleString()} · District: {activeCase.district}
                </p>
              </div>
              <button
                onClick={() => setActiveCaseId(null)}
                className="p-1 text-slate-400 hover:text-slate-700"
                aria-label="Close triage modal"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {localError && (
              <div className="p-3 bg-red-50 border border-red-200 text-[#DC2626] rounded-xl text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{localError}</span>
              </div>
            )}

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
              <div className="flex flex-wrap gap-4">
                <span>
                  <strong>Urgency:</strong> <span className="uppercase font-bold text-[#DC2626]">{activeCase.urgency}</span>
                </span>
                <span>
                  <strong>Category:</strong> <span className="capitalize">{activeCase.concernCategory.replace(/_/g, ' ')}</span>
                </span>
                {activeCase.escalationChannel && (
                  <span>
                    <strong>Escalated:</strong> <span className="font-bold text-[#DC2626]">{activeCase.escalationChannel}</span> {activeCase.escalationRef ? `(${activeCase.escalationRef})` : ''}
                  </span>
                )}
              </div>
              <div>
                <strong>Incident Summary:</strong>
                <p className="mt-1 p-3 bg-white rounded-lg border border-slate-200 text-slate-700 leading-relaxed">
                  {activeCase.summary}
                </p>
              </div>
            </div>

            {/* Triage, Lead Assignment & Statutory Escalation */}
            <form onSubmit={handleSaveCaseTriage} className="space-y-3 text-xs border-b border-slate-100 pb-5">
              <div className="font-heading text-sm font-bold text-[#1B365D] flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-[#005A9C]" />
                <span>Assignment, Status &amp; Statutory Escalation</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Workflow Status</label>
                  <select
                    value={caseStatus}
                    onChange={(e) => setCaseStatus(e.target.value as SafeguardingCase['status'])}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 min-h-[44px]"
                  >
                    <option value="new">New</option>
                    <option value="unassigned">Unassigned</option>
                    <option value="under_review">Under Review</option>
                    <option value="follow_up">Follow Up Active</option>
                    <option value="escalated">Escalated to Sauti 116 / Police CFPU</option>
                    <option value="resolved">Resolved / Child Safe</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Assigned Cleared Lead</label>
                  <select
                    value={caseLead}
                    onChange={(e) => setCaseLead(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 min-h-[44px]"
                  >
                    {clearedLeads.map((ld) => (
                      <option key={ld.uid} value={ld.fullName}>
                        {ld.fullName} ({ld.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Statutory Escalation Channel</label>
                  <select
                    value={escalationChannel}
                    onChange={(e) => setEscalationChannel(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 min-h-[44px]"
                  >
                    <option value="">Internal BCA Follow-Up Only</option>
                    <option value="Sauti 116">Sauti 116 (National Child Helpline)</option>
                    <option value="Uganda Police CFPU (0800 199 699)">Uganda Police CFPU (0800 199 699)</option>
                    <option value="District Probation Officer">District Probation Officer</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">External Escalation Reference</label>
                  <input
                    type="text"
                    value={escalationRef}
                    onChange={(e) => setEscalationRef(e.target.value)}
                    placeholder="e.g. SAUTI-2026-4410 or CFPU-KLA-09"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 min-h-[44px]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Confidential Case Triage Notes</label>
                <textarea
                  rows={2}
                  value={caseNotes}
                  onChange={(e) => setCaseNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#005A9C] hover:bg-[#004980] text-white font-bold rounded-xl min-h-[44px]"
                >
                  Save Case Action
                </button>
              </div>
            </form>

            {/* Confidential Evidence Attachments */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="font-heading text-sm font-bold text-[#1B365D] flex items-center gap-1.5">
                  <Paperclip className="w-4 h-4 text-[#005A9C]" />
                  <span>Case Evidence &amp; Field Documents ({(activeCase.attachments || []).length})</span>
                </div>
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg font-bold text-[#1B365D] cursor-pointer">
                  <Upload className="w-3.5 h-3.5 text-[#005A9C]" />
                  <span>{evidenceUploading ? 'Uploading...' : 'Attach Evidence (PDF/Image)'}</span>
                  <input
                    type="file"
                    accept="application/pdf,image/jpeg,image/png,image/webp"
                    onChange={handleUploadEvidence}
                    disabled={evidenceUploading}
                    className="hidden"
                  />
                </label>
              </div>
              {(activeCase.attachments || []).length === 0 ? (
                <p className="text-slate-500">No encrypted evidence documents attached yet.</p>
              ) : (
                <div className="space-y-1.5">
                  {activeCase.attachments!.map((att, idx) => (
                    <a
                      key={`${att.storagePath}_${idx}`}
                      href={att.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-slate-200 hover:border-[#005A9C] text-[#005A9C] font-semibold"
                    >
                      <span className="truncate">{att.name}</span>
                      <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Chronological Follow-Ups */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div className="space-y-3">
                <div className="font-heading text-sm font-bold text-[#1B365D] flex items-center gap-1.5">
                  <ClipboardCheck className="w-4 h-4 text-[#005A9C]" />
                  <span>Log Safeguarding Follow-Up</span>
                </div>
                <form onSubmit={handleAddFollowUp} className="space-y-2.5">
                  <input
                    type="text"
                    value={followAction}
                    onChange={(e) => setFollowAction(e.target.value)}
                    placeholder="Action taken (e.g. Guardian home visit conducted)"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 min-h-[40px]"
                    required
                  />
                  <input
                    type="text"
                    value={followOutcome}
                    onChange={(e) => setFollowOutcome(e.target.value)}
                    placeholder="Immediate child safety outcome..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 min-h-[40px]"
                    required
                  />
                  <div className="flex items-center gap-2">
                    <label className="text-[11px] text-slate-500 whitespace-nowrap">Next Review:</label>
                    <input
                      type="date"
                      value={followReviewDate}
                      onChange={(e) => setFollowReviewDate(e.target.value)}
                      className="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 min-h-[38px]"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-[#1B365D] hover:bg-[#12243E] text-white font-bold rounded-xl min-h-[40px]"
                  >
                    Append Chronological Follow-Up
                  </button>
                </form>

                <div className="space-y-2 max-h-48 overflow-y-auto pt-1">
                  {(activeCase.followUps || []).length === 0 ? (
                    <p className="text-slate-400">No follow-up visits recorded yet.</p>
                  ) : (
                    activeCase.followUps.map((fu) => (
                      <div key={fu.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                        <div className="flex justify-between text-[11px] text-slate-500 font-mono tabular-nums">
                          <span>{fu.authorName}</span>
                          <span>{new Date(fu.timestamp).toLocaleDateString()}</span>
                        </div>
                        <div className="font-bold text-[#1B365D]">{fu.actionTaken}</div>
                        <div className="text-slate-600">{fu.outcome}</div>
                        {fu.nextReviewDate && (
                          <div className="text-[11px] text-[#005A9C]">Next review: {fu.nextReviewDate}</div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Per-Case Immutable Audit History */}
              <div className="space-y-3">
                <div className="font-heading text-sm font-bold text-[#1B365D] flex items-center gap-1.5">
                  <History className="w-4 h-4 text-[#005A9C]" />
                  <span>Case Audit Trail ({caseAuditHistory.length})</span>
                </div>
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {caseAuditHistory.length === 0 ? (
                    <p className="text-slate-400">Access and triage events for this case appear here.</p>
                  ) : (
                    caseAuditHistory.map((log) => (
                      <div key={log.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                        <div className="flex justify-between font-mono text-[11px]">
                          <span className="font-bold text-[#005A9C]">{log.action}</span>
                          <span className="text-slate-400 tabular-nums">{new Date(log.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <div className="text-slate-700">{log.details}</div>
                        <div className="text-[11px] text-slate-500">
                          {log.performedBy} ({log.performedByRole})
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const SafeguardingCommandPage: React.FC = () => {
  return (
    <div className="bg-[#F8FAFC] min-h-screen py-10 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
        <div className="bg-white rounded-2xl p-6 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src="/assets/aistudio/Screenshot_20260801_081145_WhatsApp__1__8a50926e.jpg"
              alt="Boy Child Association Official Logo"
              className="w-12 h-12 object-contain rounded-full bg-white border border-slate-200 shrink-0"
            />
            <div>
              <div className="text-xs font-bold text-[#DC2626] uppercase tracking-wider">
                Independent Child Protection Operations
              </div>
              <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-[#1B365D]">
                Safeguarding Command Centre
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Restricted triage, statutory escalation (Sauti 116 / CFPU), chronological follow-ups, and immutable case audit history.
              </p>
            </div>
          </div>
        </div>

        <SafeguardingCommandView />
      </div>
    </div>
  );
};
