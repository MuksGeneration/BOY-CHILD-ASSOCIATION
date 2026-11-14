import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useLmsData } from '../../hooks/usePlatformData';
import { firebaseService } from '../../lib/firebase/firebase';
import { mockStore } from '../../lib/firebase/mockStore';
import { Course } from '../../types';
import {
  AlertTriangle,
  Award,
  BarChart3,
  BookOpen,
  CheckCircle2,
  Download,
  Lock,
  Printer,
  ShieldCheck,
  UserCheck,
  Users,
  Video,
} from 'lucide-react';

type ManagerTab =
  | 'overview'
  | 'approvals'
  | 'instructors'
  | 'enrolments'
  | 'zoom'
  | 'certificates';

export const LearningManagerPage: React.FC = () => {
  const { user, role } = useAuth();
  useLmsData(user?.uid, role, user?.instructorAuthorized);

  const [activeTab, setActiveTab] = useState<ManagerTab>('overview');
  const [notice, setNotice] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const allCourses = firebaseService.getCourses(true);
  const allEnrollments = firebaseService.getEnrollments();
  const allSessions = firebaseService.getCourseSessions();
  const allCertificates = firebaseService.getCertificates();
  const zoomConfig = firebaseService.getZoomConfig();
  const allUsers = Object.values(mockStore.users);

  // Form states
  const [approvalNotes, setApprovalNotes] = useState<Record<string, string>>({});
  const [assignCourseId, setAssignCourseId] = useState(allCourses[0]?.id || '');
  const [assignInstructorUid, setAssignInstructorUid] = useState('');
  const [hostEmailInput, setHostEmailInput] = useState(zoomConfig.hostUserIdOrEmail);
  const [revokeReasonMap, setRevokeReasonMap] = useState<Record<string, string>>({});

  if (role !== 'learning_manager' && role !== 'admin') {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6 bg-[#F8FAFC]">
        <div className="max-w-md bg-white rounded-2xl p-8 border border-red-200 text-center space-y-3">
          <Lock className="w-8 h-8 text-[#DC2626] mx-auto" />
          <h2 className="font-heading text-lg font-extrabold text-[#1B365D]">
            Restricted Learning Department Console
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            This management portal requires Learning Manager or Administrator authorization.
          </p>
        </div>
      </div>
    );
  }

  const runAction = async (fn: () => Promise<unknown>, successMessage: string) => {
    setErrorMsg(null);
    try {
      await fn();
      setNotice(successMessage);
      setTimeout(() => setNotice(null), 4000);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to execute Learning Manager action.');
    }
  };

  const publishedCount = allCourses.filter((c) => c.status === 'published').length;
  const completedEnrollmentsCount = allEnrollments.filter((e) => e.status === 'completed').length;
  const completionRate =
    allEnrollments.length > 0 ? Math.round((completedEnrollmentsCount / allEnrollments.length) * 100) : 0;

  const districtBreakdown = allEnrollments.reduce<Record<string, number>>((acc, e) => {
    const d = e.learnerDistrict || 'Kampala';
    acc[d] = (acc[d] || 0) + 1;
    return acc;
  }, {});

  const handleDownloadCsvReport = () => {
    const rows = [
      'enrollmentId,courseTitle,learnerDistrict,ageCategory,isMinor,status,progressPercent,learningMinutes',
      ...allEnrollments.map(
        (e) =>
          `"${e.id}","${e.courseTitle.replace(/"/g, '""')}","${e.learnerDistrict}","${e.ageCategory}",${e.isMinor},"${e.status}",${e.progressPercent},${e.learningMinutes}`
      ),
    ].join('\n');
    const blob = new Blob([rows], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bca-lms-learning-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const mentorsList = allUsers.filter((u) => u.role === 'mentor');
  const eligibleInstructors = allUsers.filter(
    (u) =>
      u.role === 'instructor' ||
      u.role === 'learning_manager' ||
      u.role === 'admin' ||
      (u.role === 'mentor' && u.instructorAuthorized === true)
  );

  return (
    <div className="bg-[#F8FAFC] min-h-screen py-10 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-[#005A9C]">
              BCA Uganda Online Skilling Department · {user?.fullName}
            </div>
            <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-[#1B365D] mt-1">
              Learning Manager Governance Console
            </h1>
          </div>
          <div className="flex flex-wrap gap-2 print:hidden">
            <button
              type="button"
              onClick={handleDownloadCsvReport}
              className="px-4 py-2 bg-[#1B365D] hover:bg-[#005A9C] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 min-h-[42px]"
            >
              <Download className="w-4 h-4" />
              <span>Export Learning CSV</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-[#1B365D] text-xs font-bold rounded-xl flex items-center gap-1.5 min-h-[42px]"
            >
              <Printer className="w-4 h-4" />
              <span>Print Summary PDF</span>
            </button>
          </div>
        </div>

        {notice && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{notice}</span>
          </div>
        )}
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-[#DC2626] text-xs font-bold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 border-b border-slate-200 overflow-x-auto pb-1 print:hidden">
          {[
            { id: 'overview' as const, label: 'Overview & Analytics', icon: BarChart3 },
            {
              id: 'approvals' as const,
              label: `Course Approvals (${allCourses.filter((c) => c.status === 'pending_approval').length})`,
              icon: BookOpen,
            },
            { id: 'instructors' as const, label: 'Instructors & Mentors', icon: UserCheck },
            {
              id: 'enrolments' as const,
              label: `Enrolments (${allEnrollments.filter((e) => e.status === 'pending').length} pending)`,
              icon: Users,
            },
            { id: 'zoom' as const, label: 'Zoom Integration Settings', icon: Video },
            { id: 'certificates' as const, label: `Certificates (${allCertificates.length})`, icon: Award },
          ].map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={`px-3.5 py-2.5 rounded-t-xl text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap shrink-0 min-h-[44px] ${
                  activeTab === t.id
                    ? 'bg-white text-[#005A9C] border border-b-0 border-slate-200'
                    : 'text-slate-600 hover:text-[#1B365D]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* 1. Department Overview & Analytics */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <div className="text-xs text-slate-500">Published Courses</div>
                <div className="font-heading text-3xl font-extrabold text-[#1B365D] mt-1 font-mono tabular-nums">
                  {publishedCount} / {allCourses.length}
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <div className="text-xs text-slate-500">Active &amp; Completed Enrolments</div>
                <div className="font-heading text-3xl font-extrabold text-[#005A9C] mt-1 font-mono tabular-nums">
                  {allEnrollments.length}
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <div className="text-xs text-slate-500">Course Completion Rate</div>
                <div className="font-heading text-3xl font-extrabold text-emerald-700 mt-1 font-mono tabular-nums">
                  {completionRate}%
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <div className="text-xs text-slate-500">Scheduled Live Classes</div>
                <div className="font-heading text-3xl font-extrabold text-[#1B365D] mt-1 font-mono tabular-nums">
                  {allSessions.length}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3 text-xs">
              <h3 className="font-heading text-base font-bold text-[#1B365D]">
                Learner Enrolment Distribution by Uganda District (Aggregated)
              </h3>
              <div className="space-y-2.5">
                {Object.entries(districtBreakdown).map(([dist, cnt]) => {
                  const pct = Math.max(10, Math.round((cnt / Math.max(1, allEnrollments.length)) * 100));
                  return (
                    <div key={dist} className="space-y-1">
                      <div className="flex justify-between font-medium">
                        <span>{dist}</span>
                        <span className="font-mono tabular-nums">{cnt} learners</span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-[#005A9C] rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* 2. Course Approval Queue */}
        {activeTab === 'approvals' && (
          <div className="space-y-4 text-xs">
            {allCourses.map((course) => (
              <div key={course.id} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div>
                    <span className="font-bold uppercase text-[#005A9C]">{course.category}</span>
                    <h3 className="font-heading text-lg font-extrabold text-[#1B365D]">{course.title}</h3>
                    <div className="text-slate-500">
                      Instructors: {course.instructorNames.join(', ')} · {course.learningFormat.replace('_', ' ')}
                    </div>
                  </div>
                  <span className="font-mono font-bold uppercase px-3 py-1 rounded-lg bg-slate-100 text-[#1B365D]">
                    {course.status.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-slate-700 leading-relaxed">{course.description}</p>
                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  <input
                    type="text"
                    value={approvalNotes[course.id] || ''}
                    onChange={(e) => setApprovalNotes({ ...approvalNotes, [course.id]: e.target.value })}
                    placeholder="Optional safeguarding or curriculum review notes..."
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-300"
                  />
                  {(['published', 'unpublished', 'archived'] as Course['status'][]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() =>
                        runAction(
                          () =>
                            firebaseService.reviewCoursePublication(
                              course.id,
                              st,
                              user!.uid,
                              approvalNotes[course.id]
                            ),
                          `Course "${course.title}" updated to ${st}.`
                        )
                      }
                      className={`px-3.5 py-2 rounded-xl font-bold capitalize min-h-[40px] ${
                        st === 'published'
                          ? 'bg-emerald-600 text-white'
                          : st === 'unpublished'
                          ? 'bg-amber-100 text-amber-900'
                          : 'bg-slate-200 text-slate-800'
                      }`}
                    >
                      {st === 'published' ? 'Approve & Publish' : st}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 3. Instructor & Mentor Explicit Authorization */}
        {activeTab === 'instructors' && (
          <div className="space-y-6 text-xs">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
              <h3 className="font-heading text-base font-bold text-[#1B365D]">
                Explicit Mentor Instructor Authorization (Safeguarding Control)
              </h3>
              <p className="text-slate-600">
                Approved mentors do not automatically gain LMS course creation or instruction privileges. Grant explicit <code className="font-mono bg-slate-100 px-1">instructorAuthorized</code> permission below.
              </p>
              <div className="divide-y divide-slate-100">
                {mentorsList.map((m) => (
                  <div key={m.uid} className="py-3 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <strong className="text-[#1B365D] text-sm">{m.fullName}</strong>
                      <div className="text-slate-500">{m.email} · {m.district}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        runAction(
                          () =>
                            firebaseService.assignUserRole(
                              m.uid,
                              m.role,
                              m.safeguardingCleared,
                              !m.instructorAuthorized
                            ),
                          `Updated LMS instructor authorization for ${m.fullName}.`
                        )
                      }
                      className={`px-4 py-2 rounded-xl font-bold min-h-[40px] ${
                        m.instructorAuthorized
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-[#005A9C] text-white'
                      }`}
                    >
                      {m.instructorAuthorized ? 'Authorized (Click to Revoke)' : 'Authorize Mentor to Teach'}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
              <h3 className="font-heading text-base font-bold text-[#1B365D]">
                Assign Authorized Instructor to Course
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <select
                  value={assignCourseId}
                  onChange={(e) => setAssignCourseId(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-300 min-h-[44px] bg-white"
                >
                  {allCourses.map((c) => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
                <select
                  value={assignInstructorUid}
                  onChange={(e) => setAssignInstructorUid(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-300 min-h-[44px] bg-white"
                >
                  <option value="">Select Authorized Instructor...</option>
                  {eligibleInstructors.map((inst) => (
                    <option key={inst.uid} value={inst.uid}>
                      {inst.fullName} ({inst.role})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={!assignCourseId || !assignInstructorUid}
                  onClick={() =>
                    runAction(
                      () =>
                        firebaseService.assignCourseInstructor(
                          assignCourseId,
                          assignInstructorUid,
                          user!.uid,
                          'lead_instructor',
                          true
                        ),
                      'Instructor assigned to course and audit logged.'
                    )
                  }
                  className="px-4 py-2 bg-[#005A9C] disabled:bg-slate-300 text-white font-bold rounded-xl min-h-[44px]"
                >
                  Assign to Course
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 4. Enrolment Approvals */}
        {activeTab === 'enrolments' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3 text-xs">
            <h3 className="font-heading text-base font-bold text-[#1B365D]">
              Learner Course Enrolments ({allEnrollments.length})
            </h3>
            {allEnrollments.map((enr) => (
              <div key={enr.id} className="p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <strong className="text-[#1B365D] text-sm">{enr.learnerName}</strong>
                  <div className="text-slate-600">{enr.courseTitle} · {enr.learnerDistrict}</div>
                  <div className="text-[11px] font-mono text-slate-500">
                    {enr.isMinor ? 'Minor (Guardian Consent Verified)' : 'Young Adult 18–35'} · Progress {enr.progressPercent}% · Status: <strong className="uppercase">{enr.status}</strong>
                  </div>
                </div>
                {enr.status === 'pending' && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        runAction(
                          () => firebaseService.reviewCourseEnrollment(enr.id, 'approved'),
                          `Approved enrolment for ${enr.learnerName}.`
                        )
                      }
                      className="px-3.5 py-2 bg-emerald-600 text-white font-bold rounded-xl"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        runAction(
                          () => firebaseService.reviewCourseEnrollment(enr.id, 'rejected', 'Cohort capacity full'),
                          `Declined enrolment for ${enr.learnerName}.`
                        )
                      }
                      className="px-3.5 py-2 bg-red-100 text-red-800 font-bold rounded-xl"
                    >
                      Decline
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 5. Official Zoom Server-to-Server OAuth Integration Settings */}
        {activeTab === 'zoom' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-heading text-lg font-extrabold text-[#1B365D]">
                  Zoom Server-to-Server OAuth Integration
                </h3>
                <p className="text-slate-600 mt-0.5">
                  Configure institutional Zoom host defaults and verify Cloud Functions Secret Manager credentials honestly.
                </p>
              </div>
              <span
                className={`px-3 py-1.5 rounded-lg font-bold ${
                  zoomConfig.connected
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-amber-50 text-amber-900 border border-amber-200'
                }`}
              >
                {zoomConfig.connected ? 'Zoom API Connected' : 'Setup Required (Secrets Pending)'}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="font-bold text-[#1B365D]">Current Integration Diagnostic</div>
              <p className="text-slate-700 leading-relaxed">{zoomConfig.statusMessage}</p>
              <div className="text-[11px] font-mono text-slate-500">
                Timezone Lock: {zoomConfig.defaultTimezone} · Minor Safeguarding Lock: {zoomConfig.minorSafeguardingLock ? 'ACTIVE (Waiting Room ON, No Host-Before-Join, Default Recording OFF)' : 'Custom'}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 space-y-1.5 text-[#1B365D]">
              <strong>Cloud Functions Secret Manager Provisioning Steps:</strong>
              <p className="font-mono text-[11px]">
                firebase functions:secrets:set ZOOM_ACCOUNT_ID ZOOM_CLIENT_ID ZOOM_CLIENT_SECRET ZOOM_WEBHOOK_SECRET_TOKEN
              </p>
              <p className="text-slate-700">
                Never enter Zoom Client Secrets in browser frontend forms. Server-side Cloud Functions securely exchange OAuth tokens once configured in Firebase Secret Manager.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 items-end">
              <div className="flex-1 w-full">
                <label className="block font-semibold text-slate-700 mb-1">
                  Institutional Zoom Host Email / User ID
                </label>
                <input
                  type="text"
                  value={hostEmailInput}
                  onChange={(e) => setHostEmailInput(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 min-h-[44px]"
                />
              </div>
              <button
                type="button"
                onClick={() =>
                  runAction(
                    () => firebaseService.connectZoomConfiguration(hostEmailInput, user!.fullName),
                    'Updated Zoom host configuration.'
                  )
                }
                className="px-4 py-2.5 bg-[#1B365D] text-white font-bold rounded-xl min-h-[44px]"
              >
                Save Host Settings
              </button>
              <button
                type="button"
                onClick={() =>
                  runAction(
                    () => firebaseService.testZoomConnection(),
                    'Zoom connectivity check completed.'
                  )
                }
                className="px-4 py-2.5 bg-[#005A9C] text-white font-bold rounded-xl min-h-[44px]"
              >
                Test Zoom Connection
              </button>
            </div>
          </div>
        )}

        {/* 6. Certificates Registry */}
        {activeTab === 'certificates' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 text-xs">
            <h3 className="font-heading text-base font-bold text-[#1B365D] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#005A9C]" />
              <span>Issued Digital Skilling Certificates ({allCertificates.length})</span>
            </h3>
            {allCertificates.map((cert) => (
              <div key={cert.id} className="p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="font-mono font-bold text-[#005A9C]">{cert.certificateNumber}</div>
                  <div className="font-bold text-[#1B365D] text-sm">{cert.learnerDisplayName}</div>
                  <div className="text-slate-600">
                    {cert.courseTitle} · Issued {cert.completionDate} · Status: <strong className="uppercase">{cert.status}</strong>
                  </div>
                  {cert.revokedReason && (
                    <div className="text-[#DC2626] mt-0.5">Revoked: {cert.revokedReason}</div>
                  )}
                </div>
                {cert.status === 'issued' && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={revokeReasonMap[cert.id] || ''}
                      onChange={(e) => setRevokeReasonMap({ ...revokeReasonMap, [cert.id]: e.target.value })}
                      placeholder="Revocation reason..."
                      className="px-3 py-1.5 rounded-lg border border-slate-300"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const rsn = revokeReasonMap[cert.id]?.trim() || 'Administrative compliance review';
                        runAction(
                          () => firebaseService.revokeCourseCertificate(cert.id, rsn, user!.fullName),
                          `Revoked certificate ${cert.certificateNumber}.`
                        );
                      }}
                      className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-[#DC2626] font-bold rounded-lg"
                    >
                      Revoke
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
