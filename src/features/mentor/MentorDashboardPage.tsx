import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useMentorData, usePublicCatalog } from '../../hooks/usePlatformData';
import { firebaseService } from '../../lib/firebase/firebase';
import { mockStore } from '../../lib/firebase/mockStore';
import { detectSafeguardingBreachInText, mentorProgressReportSchema } from '../../lib/validation/schemas';
import { MemberDirectory } from '../../components/directory/MemberDirectory';
import {
  ShieldCheck,
  Users,
  Calendar,
  CheckCircle2,
  ClipboardList,
  MessageSquare,
  BookOpen,
  Bell,
  AlertTriangle,
  Plus,
  Send,
  Lock,
  UserCheck,
  FileText,
  Search,
} from 'lucide-react';

type MentorTab = 'circles' | 'directory' | 'attendance' | 'sessions' | 'reports' | 'qa' | 'resources' | 'vetting';

export const MentorDashboardPage: React.FC = () => {
  const { user, role } = useAuth();
  usePublicCatalog(role);
  useMentorData(user?.uid);

  const [activeTab, setActiveTab] = useState<MentorTab>('circles');

  // Assigned circles only (strictly scoped to leadMentorId / coMentorIds or coordinator preview)
  const allCircles = firebaseService.getCircles();
  const assignedCircles =
    role === 'admin' || role === 'coordinator'
      ? allCircles
      : allCircles.filter(
          (c) => c.leadMentorId === user?.uid || (c.coMentorIds && c.coMentorIds.includes(user?.uid || ''))
        );

  const [selectedCircleId, setSelectedCircleId] = useState<string>(
    assignedCircles[0]?.id || user?.circleId || allCircles[0]?.id || ''
  );

  const activeCircle = assignedCircles.find((c) => c.id === selectedCircleId) || assignedCircles[0];
  const roster = activeCircle ? firebaseService.getCircleMemberships(activeCircle.id) : [];
  const sessions = activeCircle ? firebaseService.getSessions(activeCircle.id) : [];
  const attendanceRecords = activeCircle ? firebaseService.getAttendance({ circleId: activeCircle.id }) : [];
  const questions = activeCircle ? firebaseService.getQuestions(activeCircle.id) : [];
  const progressReports = activeCircle ? firebaseService.getProgressReports(activeCircle.id) : [];
  const resources = firebaseService.getLearningResources().filter((r) => r.audience === 'all' || r.audience === 'mentors');
  const notifications = user ? firebaseService.getNotifications(user.uid) : [];
  const mentorApp = firebaseService
    .getMentorApplications()
    .find((m) => m.applicantUid === user?.uid || m.email.toLowerCase() === (user?.email || '').toLowerCase());

  // Attendance form state
  const [attSessionId, setAttSessionId] = useState(sessions[0]?.id || 'sess_1');
  const [attDate, setAttDate] = useState(new Date().toISOString().slice(0, 10));
  const [attFeedback, setAttFeedback] = useState('');

  // Session planner form state
  const [sessTitle, setSessTitle] = useState('');
  const [sessTheme, setSessTheme] = useState('');
  const [sessLocation, setSessLocation] = useState(activeCircle?.locationName || '');
  const [sessDateTime, setSessDateTime] = useState('2026-11-28T10:00');
  const [sessNotes, setSessNotes] = useState('');
  const [sessSuccess, setSessSuccess] = useState('');

  // Structured Progress Report form state
  const [reportingPeriod, setReportingPeriod] = useState('November 2026');
  const [attendanceSummary, setAttendanceSummary] = useState('');
  const [keyMilestones, setKeyMilestones] = useState('');
  const [safeguardingObservations, setSafeguardingObservations] = useState('No safeguarding incidents; Two-Adult Rule observed across all meetings.');
  const [supportNeeded, setSupportNeeded] = useState('');
  const [reportMsg, setReportMsg] = useState('');
  const [reportErr, setReportErr] = useState('');
  const [reportBusy, setReportBusy] = useState(false);

  // Question reply state
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [replyError, setReplyError] = useState('');

  if (role !== 'mentor' && role !== 'coordinator' && role !== 'admin') {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6 bg-[#F8FAFC]">
        <div className="max-w-md bg-white rounded-2xl p-8 border border-slate-200 text-center">
          <div className="w-12 h-12 bg-blue-50 text-[#005A9C] rounded-full flex items-center justify-center mx-auto mb-3">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="font-heading text-lg font-bold text-[#1B365D]">Mentor Portal Restricted</h2>
          <p className="text-xs text-slate-600 mt-2 leading-relaxed">
            Access requires a vetted Mentor account cleared by two referees and BCA Child Safeguarding leads.
          </p>
        </div>
      </div>
    );
  }

  const handleMarkAttendance = async (memberId: string, memberName: string, status: 'present' | 'absent' | 'excused') => {
    if (!activeCircle || !user) return;
    try {
      await firebaseService.recordAttendance({
        sessionId: attSessionId || 'sess_1',
        circleId: activeCircle.id,
        memberId,
        memberName,
        mentorId: user.uid,
        status,
        date: attDate,
      });
      setAttFeedback(`Attendance saved for ${memberName}: ${status}.`);
      setTimeout(() => setAttFeedback(''), 3000);
    } catch (err) {
      setAttFeedback(err instanceof Error ? err.message : 'Unable to save attendance.');
    }
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCircle || sessTitle.trim().length < 4) return;
    try {
      await firebaseService.addCircleSession({
        circleId: activeCircle.id,
        title: sessTitle.trim(),
        theme: sessTheme.trim() || 'Character & Leadership',
        scheduledAt: new Date(sessDateTime).toISOString(),
        location: sessLocation.trim() || activeCircle.locationName,
        mentorId: user?.uid,
        mentorName: user?.fullName || activeCircle.leadMentorName,
        notes: sessNotes.trim(),
      });
      setSessTitle('');
      setSessTheme('');
      setSessNotes('');
      setSessSuccess('Session scheduled and added to circle calendar.');
      setTimeout(() => setSessSuccess(''), 3500);
    } catch (err) {
      setReplyError(err instanceof Error ? err.message : 'Unable to create session.');
    }
  };

  const handleSubmitProgressReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCircle || !user) return;
    setReportErr('');
    setReportMsg('');
    const parsed = mentorProgressReportSchema.safeParse({
      circleId: activeCircle.id,
      reportingPeriod,
      attendanceSummary,
      keyMilestones,
      safeguardingObservations,
      supportNeeded: supportNeeded.trim() || undefined,
    });
    if (!parsed.success) {
      setReportErr(parsed.error.issues[0]?.message || 'Check progress report fields.');
      return;
    }
    setReportBusy(true);
    try {
      await firebaseService.submitProgressReport({
        circleId: activeCircle.id,
        circleName: activeCircle.name,
        mentorId: user.uid,
        mentorName: user.fullName,
        reportingPeriod: parsed.data.reportingPeriod,
        attendanceSummary: parsed.data.attendanceSummary,
        keyMilestones: parsed.data.keyMilestones,
        safeguardingObservations: parsed.data.safeguardingObservations,
        supportNeeded: parsed.data.supportNeeded,
      });
      setAttendanceSummary('');
      setKeyMilestones('');
      setSupportNeeded('');
      setReportMsg('Monthly circle progress report submitted to District Coordinators.');
      setTimeout(() => setReportMsg(''), 4000);
    } catch (err) {
      setReportErr(err instanceof Error ? err.message : 'Unable to submit progress report.');
    } finally {
      setReportBusy(false);
    }
  };

  const handleReplySubmit = async (questionId: string) => {
    setReplyError('');
    const text = (replyDrafts[questionId] || '').trim();
    if (text.length < 10) {
      setReplyError('Mentor guidance reply must be at least 10 characters.');
      return;
    }
    const scan = detectSafeguardingBreachInText(text);
    if (scan.hasBreach) {
      setReplyError(scan.reasons.join(' '));
      return;
    }
    try {
      await firebaseService.replyToQuestion(questionId, text, user?.fullName || 'Vetted Mentor');
      setReplyDrafts((prev) => ({ ...prev, [questionId]: '' }));
    } catch (err) {
      setReplyError(err instanceof Error ? err.message : 'Unable to post guidance reply.');
    }
  };

  const tabs: { id: MentorTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'circles', label: 'Assigned Circles & Roster', icon: Users },
    { id: 'directory', label: 'Member Directory', icon: Search },
    { id: 'attendance', label: 'Attendance Register', icon: ClipboardList },
    { id: 'sessions', label: 'Activity Planner', icon: Calendar },
    { id: 'reports', label: `Progress Reports (${progressReports.length})`, icon: FileText },
    { id: 'qa', label: `Supervised Q&A (${questions.length})`, icon: MessageSquare },
    { id: 'resources', label: 'Mentor Resources', icon: BookOpen },
    { id: 'vetting', label: 'Vetting & Safeguarding', icon: ShieldCheck },
  ];

  return (
    <div className="bg-[#F8FAFC] min-h-screen py-10 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
        {/* Header Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className="font-bold text-[#005A9C]">Mentorship Portal</span>
              <span aria-hidden="true">·</span>
              <span>{user?.district || 'Kampala'} Chapter</span>
              <span aria-hidden="true">·</span>
              <span className="text-emerald-700 font-semibold">Two-Adult Rule Enforced</span>
            </div>
            <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-[#1B365D]">
              Welcome, {user?.fullName}
            </h1>
            <p className="text-xs text-slate-600 max-w-2xl">
              Manage your assigned mentorship circles, record attendance, schedule supervised activities, and answer circle Q&amp;A. Direct one-on-one messaging with minors is technically disabled.
            </p>
          </div>

          {assignedCircles.length > 0 && (
            <div className="shrink-0">
              <label htmlFor="mentor-circle-select" className="block text-[11px] font-bold text-slate-500 mb-1">
                Active Assigned Circle
              </label>
              <select
                id="mentor-circle-select"
                value={activeCircle?.id || ''}
                onChange={(e) => setSelectedCircleId(e.target.value)}
                className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-white text-[#1B365D] min-h-[44px]"
              >
                {assignedCircles.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.district})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Safeguarding & Two-Adult Policy Banner */}
        <div className="bg-[#1B365D] text-white rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-[#60C1E5] shrink-0 mt-0.5" />
            <div className="text-xs space-y-0.5">
              <p className="font-bold text-white">
                Safeguarding Boundary: Zero Private Minor Contact
              </p>
              <p className="text-slate-300">
                Roster views exclude minor phone numbers, home addresses, and guardian contacts. All Q&amp;A replies are visible to circle safeguarding leads and filtered against contact sharing.
              </p>
            </div>
          </div>
          <div className="text-xs text-[#A0E0EF] font-mono tabular-nums shrink-0">
            Vetting: CLEARED
          </div>
        </div>

        {/* Segmented Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-t-xl text-xs font-semibold transition-colors whitespace-nowrap shrink-0 min-h-[44px] ${
                  active
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

        {/* TAB 1: ASSIGNED CIRCLES & SCOPED ROSTER */}
        {activeTab === 'circles' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
                <div>
                  <h2 className="font-heading text-lg font-bold text-[#1B365D]">
                    {activeCircle ? activeCircle.name : 'No Assigned Circle Yet'}
                  </h2>
                  {activeCircle && (
                    <p className="text-xs text-slate-500 mt-0.5">
                      {activeCircle.district} · {activeCircle.locationName} · {activeCircle.meetingTime}
                    </p>
                  )}
                </div>
                {activeCircle && (
                  <span className="text-xs font-mono font-bold text-[#005A9C] tabular-nums">
                    {roster.length} Active / {activeCircle.maxMembers} Max
                  </span>
                )}
              </div>

              {roster.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-500">
                  No members are currently assigned to this circle. Coordinators match verified members here after safeguarding approval.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 font-bold">
                        <th className="py-2.5 pr-4">Member Name</th>
                        <th className="py-2.5 px-4">Age Cohort</th>
                        <th className="py-2.5 px-4">Membership Status</th>
                        <th className="py-2.5 pl-4 text-right">Contact Access</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {roster.map((m) => (
                        <tr key={m.id} className="hover:bg-slate-50">
                          <td className="py-3 pr-4 font-semibold text-[#1B365D]">{m.memberName}</td>
                          <td className="py-3 px-4 text-slate-600">
                            {m.ageCategory === 'child_5_17' ? 'Ages 5–17 (Minor Protected)' : 'Ages 18–35 (Young Adult)'}
                          </td>
                          <td className="py-3 px-4 capitalize text-emerald-700 font-semibold">{m.status}</td>
                          <td className="py-3 pl-4 text-right text-slate-500">
                            {m.ageCategory === 'child_5_17' ? 'Guardian / Circle Only' : 'Circle Session Only'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
                <h3 className="font-heading text-sm font-bold text-[#1B365D] flex items-center gap-2">
                  <Bell className="w-4 h-4 text-[#005A9C]" />
                  <span>Mentor Notifications</span>
                </h3>
                {notifications.length === 0 ? (
                  <p className="text-xs text-slate-500">
                    All assigned circle updates and referee alerts are up to date.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {notifications.map((n) => (
                      <li key={n.id} className="p-3 bg-slate-50 rounded-xl text-xs border border-slate-100">
                        <div className="font-semibold text-[#1B365D]">{n.title}</div>
                        <p className="text-slate-600 mt-0.5">{n.message}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-2 text-xs">
                <h3 className="font-heading text-sm font-bold text-[#1B365D]">Co-Facilitator &amp; Lead</h3>
                <p className="text-slate-600">
                  Safeguarding Lead: <strong className="text-[#1B365D]">{activeCircle?.safeguardingLeadName || 'Sister Sarah Nabirye'}</strong>
                </p>
                <p className="text-slate-600">
                  Focus Area: <strong className="text-[#005A9C]">{activeCircle?.focusArea || 'General Mentorship'}</strong>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 1B: SCOPED MEMBER DIRECTORY */}
        {activeTab === 'directory' && <MemberDirectory embedded />}

        {/* TAB 2: ATTENDANCE REGISTER */}
        {activeTab === 'attendance' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h2 className="font-heading text-lg font-bold text-[#1B365D]">Circle Attendance Register</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Guardians of minor members receive automatic visibility of verified attendance marks.{' '}
                  <Link to="/events-news" className="text-[#005A9C] font-semibold hover:underline">
                    Open Event Attendance Roster &rarr;
                  </Link>
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Session</label>
                  <select
                    value={attSessionId}
                    onChange={(e) => setAttSessionId(e.target.value)}
                    className="px-3 py-2 text-xs rounded-xl border border-slate-300 min-h-[40px]"
                  >
                    {sessions.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.title}
                      </option>
                    ))}
                    <option value="sess_adhoc">Saturday Regular Circle</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Date</label>
                  <input
                    type="date"
                    value={attDate}
                    onChange={(e) => setAttDate(e.target.value)}
                    className="px-3 py-2 text-xs rounded-xl border border-slate-300 min-h-[40px]"
                  />
                </div>
              </div>
            </div>

            {attFeedback && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                <span>{attFeedback}</span>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-bold">
                    <th className="py-2.5 pr-4">Member</th>
                    <th className="py-2.5 px-4">Latest Recorded Status</th>
                    <th className="py-2.5 pl-4 text-right">Mark Attendance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {roster.map((m) => {
                    const latest = attendanceRecords.find((a) => a.memberId === m.userId && a.date === attDate);
                    return (
                      <tr key={m.id}>
                        <td className="py-3 pr-4 font-semibold text-[#1B365D]">{m.memberName}</td>
                        <td className="py-3 px-4 capitalize text-slate-600">
                          {latest ? `${latest.status} (${latest.date})` : 'Not marked for selected date'}
                        </td>
                        <td className="py-3 pl-4 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => handleMarkAttendance(m.userId, m.memberName, 'present')}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs min-h-[36px]"
                            >
                              Present
                            </button>
                            <button
                              onClick={() => handleMarkAttendance(m.userId, m.memberName, 'excused')}
                              className="px-3 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 font-semibold text-xs min-h-[36px]"
                            >
                              Excused
                            </button>
                            <button
                              onClick={() => handleMarkAttendance(m.userId, m.memberName, 'absent')}
                              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs min-h-[36px]"
                            >
                              Absent
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: SESSION & ACTIVITY PLANNER */}
        {activeTab === 'sessions' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="font-heading text-lg font-bold text-[#1B365D] mb-4 flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#005A9C]" />
                <span>Schedule Circle Activity</span>
              </h2>
              {sessSuccess && (
                <div className="mb-3 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl">
                  {sessSuccess}
                </div>
              )}
              <form onSubmit={handleCreateSession} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Session Title</label>
                  <input
                    type="text"
                    value={sessTitle}
                    onChange={(e) => setSessTitle(e.target.value)}
                    placeholder="e.g. Module 6: Managing Finances & Integrity"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 min-h-[44px]"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Core Theme</label>
                  <input
                    type="text"
                    value={sessTheme}
                    onChange={(e) => setSessTheme(e.target.value)}
                    placeholder="e.g. Responsibility & Grit"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 min-h-[44px]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Date &amp; Time</label>
                  <input
                    type="datetime-local"
                    value={sessDateTime}
                    onChange={(e) => setSessDateTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 min-h-[44px]"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Safe Public Venue</label>
                  <input
                    type="text"
                    value={sessLocation}
                    onChange={(e) => setSessLocation(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 min-h-[44px]"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Preparation Notes</label>
                  <textarea
                    rows={2}
                    value={sessNotes}
                    onChange={(e) => setSessNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                    placeholder="Ensure co-mentor or safeguarding supervisor is confirmed."
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-[#005A9C] hover:bg-[#004980] text-white font-bold rounded-xl min-h-[44px]"
                >
                  Publish Session to Circle
                </button>
              </form>
            </div>

            <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
              <h2 className="font-heading text-lg font-bold text-[#1B365D]">Upcoming Circle Sessions</h2>
              <div className="space-y-3">
                {sessions.map((s) => (
                  <div key={s.id} className="p-4 rounded-xl border border-slate-200 space-y-1 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-[#005A9C]">{s.theme}</span>
                      <span className="font-mono text-slate-500 tabular-nums">
                        {new Date(s.scheduledAt).toLocaleString()}
                      </span>
                    </div>
                    <h3 className="font-heading text-sm font-bold text-[#1B365D]">{s.title}</h3>
                    <p className="text-slate-600">{s.location}</p>
                    {s.notes && <p className="text-slate-500 pt-1">{s.notes}</p>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3B: STRUCTURED CIRCLE PROGRESS REPORTS */}
        {activeTab === 'reports' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
              <h2 className="font-heading text-lg font-bold text-[#1B365D] flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#005A9C]" />
                <span>Submit Circle Progress Report</span>
              </h2>
              {reportMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl">
                  {reportMsg}
                </div>
              )}
              {reportErr && (
                <div className="p-3 bg-red-50 border border-red-200 text-[#DC2626] text-xs rounded-xl">
                  {reportErr}
                </div>
              )}
              <form onSubmit={handleSubmitProgressReport} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Reporting Period</label>
                  <input
                    type="text"
                    value={reportingPeriod}
                    onChange={(e) => setReportingPeriod(e.target.value)}
                    placeholder="e.g. November 2026"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 min-h-[40px]"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Attendance Summary</label>
                  <input
                    type="text"
                    value={attendanceSummary}
                    onChange={(e) => setAttendanceSummary(e.target.value)}
                    placeholder="e.g. 11/12 active boys attended 4 Saturday circles"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 min-h-[40px]"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Key Youth Milestones</label>
                  <textarea
                    rows={3}
                    value={keyMilestones}
                    onChange={(e) => setKeyMilestones(e.target.value)}
                    placeholder="Summarise curriculum progress, life skills mastery, and peer stewardship..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Safeguarding Observations</label>
                  <textarea
                    rows={2}
                    value={safeguardingObservations}
                    onChange={(e) => setSafeguardingObservations(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Support / Resources Needed (Optional)</label>
                  <input
                    type="text"
                    value={supportNeeded}
                    onChange={(e) => setSupportNeeded(e.target.value)}
                    placeholder="e.g. Additional solar lab multimeter kits"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 min-h-[40px]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={reportBusy}
                  className="w-full py-2.5 bg-[#005A9C] hover:bg-[#004980] text-white font-bold rounded-xl min-h-[44px] disabled:opacity-50"
                >
                  {reportBusy ? 'Submitting Report...' : 'Submit Monthly Progress Report'}
                </button>
              </form>
            </div>

            <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
              <h2 className="font-heading text-lg font-bold text-[#1B365D]">
                Submitted Circle Reports ({progressReports.length})
              </h2>
              {progressReports.length === 0 ? (
                <p className="text-xs text-slate-500">No progress reports submitted for this circle yet.</p>
              ) : (
                <div className="space-y-3 text-xs">
                  {progressReports.map((rep) => (
                    <div key={rep.id} className="p-4 rounded-xl border border-slate-200 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-[#005A9C]">{rep.reportingPeriod}</span>
                        <span className="font-mono text-[11px] text-slate-400">
                          {new Date(rep.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="font-bold text-[#1B365D]">{rep.attendanceSummary}</div>
                      <p className="text-slate-700 leading-relaxed">{rep.keyMilestones}</p>
                      <p className="text-emerald-800 bg-emerald-50 px-2.5 py-1.5 rounded-lg">
                        Safeguarding: {rep.safeguardingObservations}
                      </p>
                      {rep.supportNeeded && (
                        <p className="text-amber-900 bg-amber-50 px-2.5 py-1 rounded-lg">
                          Requested Support: {rep.supportNeeded}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: SUPERVISED Q&A */}
        {activeTab === 'qa' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <div className="pb-3 border-b border-slate-100">
              <h2 className="font-heading text-lg font-bold text-[#1B365D]">Supervised Circle Q&amp;A</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                All replies are logged publicly inside the circle and screened automatically against phone numbers, emails, or off-platform social handles.
              </p>
            </div>

            {replyError && (
              <div className="p-3 bg-red-50 border border-red-200 text-[#DC2626] rounded-xl text-xs font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{replyError}</span>
              </div>
            )}

            <div className="space-y-4">
              {questions.map((q) => (
                <div key={q.id} className="p-4 rounded-xl border border-slate-200 space-y-3 text-xs">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="font-semibold text-[#1B365D]">
                      {q.isAnonymous ? 'Anonymous Circle Member' : q.authorAlias} · {q.category.replace(/_/g, ' ')}
                    </span>
                    <span className="font-mono tabular-nums">{new Date(q.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm font-medium text-slate-800">{q.question}</p>
                  {q.mentorReply ? (
                    <div className="p-3 bg-[#F4F8FC] rounded-xl border border-blue-100 text-slate-700">
                      <span className="font-bold text-[#005A9C] block mb-1">
                        Reply from {q.repliedByMentorName}:
                      </span>
                      {q.mentorReply}
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={replyDrafts[q.id] || ''}
                        onChange={(e) => setReplyDrafts((prev) => ({ ...prev, [q.id]: e.target.value }))}
                        placeholder="Write supportive, educational guidance (no private contact details)..."
                        className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs min-h-[44px]"
                      />
                      <button
                        onClick={() => handleReplySubmit(q.id)}
                        className="px-4 py-2 bg-[#005A9C] hover:bg-[#004980] text-white font-semibold rounded-xl flex items-center justify-center gap-1.5 min-h-[44px] whitespace-nowrap"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Post Guidance</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: MENTOR RESOURCES */}
        {activeTab === 'resources' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {resources.map((res) => (
              <div key={res.id} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-2">
                <div className="text-xs text-[#005A9C] font-bold">
                  {res.category} · {res.readTimeMinutes} min read
                </div>
                <h3 className="font-heading text-base font-bold text-[#1B365D]">{res.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{res.summary}</p>
                <p className="text-xs text-slate-700 pt-2 border-t border-slate-100 leading-relaxed">
                  {res.contentBody}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* TAB 6: VETTING & REFEREE STATUS */}
        {activeTab === 'vetting' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <h2 className="font-heading text-lg font-bold text-[#1B365D] flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-[#005A9C]" />
              <span>Mentor Safeguarding Vetting &amp; Two-Referee Record</span>
            </h2>
            <p className="text-xs text-slate-600">
              Every BCA mentor requires two independently verified referees, clean safeguarding screening, and annual refresher training.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                <div className="font-bold text-emerald-900">Account Role &amp; Status</div>
                <div className="mt-1 text-emerald-800 capitalize">
                  {user?.role} · {user?.status}
                </div>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="font-bold text-[#1B365D]">Referee 1 Verification</div>
                <div className="mt-1 text-slate-600">
                  {mentorApp ? `${mentorApp.referee1.name} (${mentorApp.referee1.status})` : 'Verified on file (Rev. Community Lead)'}
                </div>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="font-bold text-[#1B365D]">Referee 2 Verification</div>
                <div className="mt-1 text-slate-600">
                  {mentorApp ? `${mentorApp.referee2.name} (${mentorApp.referee2.status})` : 'Verified on file (School Headteacher)'}
                </div>
              </div>
            </div>
            <div className="text-xs text-slate-500 pt-2">
              Coordinator records on file: {mockStore.mentorReferees.length} audited referee checks.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
