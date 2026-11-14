import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useLmsData, useMemberData, usePublicCatalog } from '../../hooks/usePlatformData';
import { firebaseService } from '../../lib/firebase/firebase';
import { requestGuardianLinkSchema, submitGuardianConsentSchema } from '../../lib/validation/schemas';
import { AppUser, GuardianVerificationMethod } from '../../types';
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  UserCheck,
  FileCheck,
  Calendar,
  Link2,
  AlertTriangle,
  Bell,
  FileWarning,
  GraduationCap,
  Award,
  Video,
} from 'lucide-react';

const VERIFICATION_METHOD_LABELS: Record<GuardianVerificationMethod, string> = {
  child_code_confirmation: 'Child Verification Code (BCA-XXXXXX)',
  coordinator_id_check: 'Coordinator In-Person ID Check',
  guardian_sms_otp: 'Verified Guardian SMS OTP',
  school_patron_attestation: 'Partner School Patron Attestation',
};

export const GuardianPage: React.FC = () => {
  const { user, role } = useAuth();
  usePublicCatalog(role);
  const tick = useMemberData(user?.uid, role);
  const lmsTick = useLmsData(user?.uid, role, user?.instructorAuthorized);

  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [linkedBoys, setLinkedBoys] = useState<AppUser[]>([]);

  // Verified Guardian Link Form
  const [boyIdentifier, setBoyIdentifier] = useState('');
  const [relationship, setRelationship] = useState<'mother' | 'father' | 'legal_guardian' | 'elder_sibling' | 'extended_family' | 'other'>('mother');
  const [linkVerificationMethod, setLinkVerificationMethod] = useState<GuardianVerificationMethod>('child_code_confirmation');
  const [linkAuthorityEvidence, setLinkAuthorityEvidence] = useState('');

  // Verified Consent Modal/Prompt State
  const [consentTarget, setConsentTarget] = useState<{ uid: string; name: string } | null>(null);
  const [consentMethod, setConsentMethod] = useState<GuardianVerificationMethod>('child_code_confirmation');
  const [consentEvidence, setConsentEvidence] = useState('');
  const [consentAttested, setConsentAttested] = useState(false);

  // Withdraw Consent Modal State
  const [withdrawTarget, setWithdrawTarget] = useState<{ uid: string; name: string } | null>(null);
  const [withdrawReason, setWithdrawReason] = useState('');

  // Data Correction Request State
  const [correctionText, setCorrectionText] = useState('');

  const guardianLinks = firebaseService.getGuardianLinks(user?.uid);
  const consentHistory = firebaseService.getConsentRecords().filter((c) => c.guardianId === user?.uid);
  const notifications = firebaseService.getNotifications(user?.uid || '');
  const circles = firebaseService.getCircles();
  const courses = firebaseService.getCourses();
  const allSessions = firebaseService.getCourseSessions();
  void lmsTick;

  useEffect(() => {
    let cancelled = false;
    if (!user?.uid) {
      setLinkedBoys([]);
      return;
    }
    firebaseService.getLinkedBoysForGuardianAsync(user.uid).then((list) => {
      if (!cancelled) setLinkedBoys(list);
    });
    return () => {
      cancelled = true;
    };
  }, [user?.uid, tick, guardianLinks.length]);

  const handleRequestLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setFeedbackMsg(null);
    if (!user) return;
    const parsed = requestGuardianLinkSchema.safeParse({
      boyIdentifier,
      relationship,
      verificationMethod: linkVerificationMethod,
      authorityEvidence: linkAuthorityEvidence,
    });
    if (!parsed.success) {
      setErrorMsg(parsed.error.issues[0]?.message || 'Provide child identifier and relationship verification evidence.');
      return;
    }
    try {
      const link = await firebaseService.requestGuardianLink(
        user.uid,
        parsed.data.boyIdentifier,
        parsed.data.relationship,
        parsed.data.verificationMethod,
        parsed.data.authorityEvidence
      );
      setBoyIdentifier('');
      setLinkAuthorityEvidence('');
      setFeedbackMsg(
        `Verification code ${link.verificationCode} dispatched via ${VERIFICATION_METHOD_LABELS[parsed.data.verificationMethod]} for ${link.boyName}. Arbitrary linking remains blocked until verified.`
      );
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not initiate guardian link.');
    }
  };

  const openConsentPrompt = (boyUid: string, boyName: string) => {
    const existingLink = guardianLinks.find((l) => l.boyId === boyUid && l.status === 'verified');
    setErrorMsg(null);
    setConsentTarget({ uid: boyUid, name: boyName });
    setConsentMethod(existingLink?.verificationMethod || 'child_code_confirmation');
    setConsentEvidence(existingLink?.authorityEvidence || '');
    setConsentAttested(false);
  };

  const handleSubmitConsent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consentTarget || !user) return;
    setErrorMsg(null);
    const parsed = submitGuardianConsentSchema.safeParse({
      boyId: consentTarget.uid,
      verificationMethod: consentMethod,
      authorityEvidence: consentEvidence,
      authorityConfirmed: consentAttested,
    });
    if (!parsed.success) {
      setErrorMsg(parsed.error.issues[0]?.message || 'Verify authority evidence and confirm attestation.');
      return;
    }
    try {
      await firebaseService.approveGuardianConsent(
        consentTarget.uid,
        user.uid,
        parsed.data.verificationMethod,
        parsed.data.authorityEvidence
      );
      setFeedbackMsg(
        `Verified Consent v2026.1 recorded for ${consentTarget.name} (${VERIFICATION_METHOD_LABELS[parsed.data.verificationMethod]}). Digital Membership Card issued.`
      );
      setConsentTarget(null);
      setTimeout(() => setFeedbackMsg(null), 5000);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to record verified consent.');
    }
  };

  const handleWithdrawConsent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!withdrawTarget || withdrawReason.trim().length < 5) return;
    setErrorMsg(null);
    try {
      await firebaseService.withdrawGuardianConsent(
        withdrawTarget.uid,
        user?.uid || 'usr_guardian_grace',
        withdrawReason.trim()
      );
      setFeedbackMsg(`Consent withdrawn for ${withdrawTarget.name}. Child account has been locked.`);
      setWithdrawTarget(null);
      setWithdrawReason('');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to withdraw consent.');
    }
  };

  const handleSubmitCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || correctionText.trim().length < 5) return;
    setErrorMsg(null);
    try {
      await firebaseService.requestDppaAction(user.uid, 'correction', correctionText.trim());
      setCorrectionText('');
      setFeedbackMsg('Personal information correction request forwarded to BCA Data Protection team.');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to submit correction request.');
    }
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
                <ShieldCheck className="w-4 h-4 text-[#005A9C]" />
                <span>Parent &amp; Guardian Safeguarding Console</span>
                <span aria-hidden="true">·</span>
                <span className="text-slate-500">Standing Up As A Man</span>
              </div>
              <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-[#1B365D] mt-1">
                Guardian Portal: {user?.fullName}
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Verify child relationships, grant or withdraw consent, and review circle attendance under Uganda Children Act (Cap 59).
              </p>
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-200 px-3.5 py-1.5 rounded-xl text-xs font-bold text-[#005A9C]">
            {linkedBoys.length} Linked {linkedBoys.length === 1 ? 'Child' : 'Children'}
          </div>
        </div>

        {feedbackMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{feedbackMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-[#DC2626] text-xs font-bold flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Linked Boys Overview */}
        <div className="space-y-4">
          <h2 className="font-heading text-lg font-bold text-[#1B365D]">
            Verified Children, Consent &amp; Attendance
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {linkedBoys.map((boy) => {
              const boyCircle = circles.find((c) => c.id === boy.circleId);
              const boyAttendance = firebaseService.getAttendance({ memberId: boy.uid });
              const boyEnrollments = firebaseService.getEnrollments({ userId: boy.uid });
              const boyCertificates = firebaseService.getCertificates(boy.uid).filter((c) => c.status === 'issued');
              const enrolledCourseIds = new Set(boyEnrollments.map((en) => en.courseId));
              const boyUpcomingClasses = allSessions
                .filter((s) => enrolledCourseIds.has(s.courseId) && s.status !== 'cancelled' && s.status !== 'completed')
                .slice(0, 2);
              const isPending = boy.status === 'pending_guardian_consent';

              return (
                <div
                  key={boy.uid}
                  className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4"
                >
                  <div>
                    <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                      <div>
                        <h3 className="font-heading text-base font-bold text-[#1B365D]">{boy.fullName}</h3>
                        <p className="text-xs text-slate-500">
                          Age: {boy.calculatedAge || 15} yrs · District: {boy.district || 'Wakiso'}
                        </p>
                      </div>
                      <span
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          isPending
                            ? 'bg-amber-100 text-amber-900 border border-amber-200'
                            : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                        }`}
                      >
                        {isPending ? 'Consent Pending / Withdrawn' : 'Consent Active'}
                      </span>
                    </div>

                    <div className="py-3 space-y-3 text-xs">
                      {isPending ? (
                        <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 space-y-1.5">
                          <div className="flex items-center gap-2 font-bold">
                            <Clock className="w-4 h-4 text-amber-700" />
                            <span>Guardian Consent Required</span>
                          </div>
                          <p>
                            {boy.fullName.split(' ')[0]} cannot access circles, online skilling courses, or Q&amp;A threads until you submit consent below.
                          </p>
                        </div>
                      ) : (
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">
                            Assigned Circle &amp; Lead Mentor
                          </span>
                          <div className="font-bold text-[#1B365D]">
                            {boyCircle ? boyCircle.name : 'Kampala Central Champions Circle'}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {boyCircle?.meetingTime || 'Saturdays 10:00 AM'} · Lead: {boyCircle?.leadMentorName || 'Emmanuel Okello'}
                          </div>
                        </div>
                      )}

                      <div>
                        <div className="font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-[#005A9C]" />
                          <span>Recent Attendance ({boyAttendance.length} logged)</span>
                        </div>
                        {boyAttendance.length === 0 ? (
                          <p className="text-[11px] text-slate-400">No session logs recorded yet.</p>
                        ) : (
                          <div className="space-y-1">
                            {boyAttendance.slice(0, 3).map((att) => (
                              <div key={att.id} className="flex justify-between text-[11px] bg-slate-50 px-2.5 py-1 rounded">
                                <span>{att.date}</span>
                                <span className="font-bold uppercase text-emerald-700">{att.status}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Online Skilling Progress & Safeguarding Oversight */}
                      <div className="pt-2 border-t border-slate-100 space-y-2">
                        <div className="font-semibold text-slate-700 flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <GraduationCap className="w-3.5 h-3.5 text-[#005A9C]" />
                            <span>Online Skilling Progress ({boyEnrollments.length})</span>
                          </span>
                          <Link to="/learn" className="text-[11px] font-bold text-[#005A9C] hover:underline">
                            View Academy &rarr;
                          </Link>
                        </div>
                        {boyEnrollments.length === 0 ? (
                          <p className="text-[11px] text-slate-400">Not enrolled in any online skilling courses yet.</p>
                        ) : (
                          <div className="space-y-1.5">
                            {boyEnrollments.slice(0, 3).map((enr) => {
                              const courseTitle = courses.find((c) => c.id === enr.courseId)?.title || enr.courseTitle;
                              return (
                                <div key={enr.id} className="bg-slate-50 px-2.5 py-1.5 rounded-lg space-y-1">
                                  <div className="flex items-center justify-between gap-2 text-[11px]">
                                    <span className="font-semibold text-[#1B365D] truncate">{courseTitle}</span>
                                    <span className="font-mono font-bold text-[#005A9C] shrink-0">{enr.progressPercent}%</span>
                                  </div>
                                  <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-[#005A9C]"
                                      style={{ width: `${Math.min(100, Math.max(0, enr.progressPercent))}%` }}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {boyUpcomingClasses.length > 0 && (
                          <div className="space-y-1 pt-1">
                            <div className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
                              <Video className="w-3 h-3 text-[#005A9C]" />
                              <span>Upcoming Live Classes (Africa/Kampala)</span>
                            </div>
                            {boyUpcomingClasses.map((sess) => (
                              <div key={sess.id} className="text-[11px] text-slate-600 bg-blue-50/60 px-2.5 py-1 rounded flex justify-between gap-2">
                                <span className="truncate font-medium text-[#1B365D]">{sess.title}</span>
                                <span className="font-mono text-[10px] shrink-0">
                                  {new Date(sess.startsAtIso).toLocaleDateString('en-UG', { timeZone: 'Africa/Kampala', month: 'short', day: 'numeric' })}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                        {boyCertificates.length > 0 && (
                          <div className="flex items-center justify-between text-[11px] bg-emerald-50 text-emerald-900 px-2.5 py-1.5 rounded-lg">
                            <span className="flex items-center gap-1.5 font-semibold">
                              <Award className="w-3.5 h-3.5 text-emerald-700" />
                              <span>{boyCertificates.length} Course Certificate(s) Earned</span>
                            </span>
                            <Link
                              to={`/verify-certificate/${boyCertificates[0].certificateNumber}`}
                              className="font-mono font-bold underline"
                            >
                              {boyCertificates[0].certificateNumber}
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100">
                    {isPending ? (
                      <button
                        onClick={() => openConsentPrompt(boy.uid, boy.fullName)}
                        className="w-full py-3 bg-[#005A9C] hover:bg-[#004980] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 min-h-[44px]"
                      >
                        <UserCheck className="w-4 h-4 text-[#60C1E5]" />
                        <span>Verify Authority &amp; Grant Consent (v2026.1)</span>
                      </button>
                    ) : (
                      <div className="flex items-center justify-between text-xs gap-2">
                        <span className="text-emerald-700 font-semibold flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Active &amp; Monitored</span>
                        </span>
                        <button
                          onClick={() => setWithdrawTarget({ uid: boy.uid, name: boy.fullName })}
                          className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-[#DC2626] font-bold rounded-lg min-h-[38px]"
                        >
                          Withdraw Consent
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Request Verified Child Link + Notifications + Consent Ledger */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#005A9C]">
              <Link2 className="w-4 h-4" />
              <span>Link Another Child (Verified Flow)</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              For child safeguarding, guardians cannot link arbitrarily to any account. Initiate a link request below to send a 6-digit verification code to your child’s account.
            </p>
            <form onSubmit={handleRequestLink} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Child Email or Member ID</label>
                <input
                  type="text"
                  value={boyIdentifier}
                  onChange={(e) => setBoyIdentifier(e.target.value)}
                  placeholder="e.g. john.ssemwo@boychild.demo"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 min-h-[44px]"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Relationship</label>
                <select
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value as any)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 min-h-[44px]"
                >
                  <option value="mother">Mother</option>
                  <option value="father">Father</option>
                  <option value="legal_guardian">Legal Guardian</option>
                  <option value="elder_sibling">Elder Sibling (Adult)</option>
                  <option value="extended_family">Extended Family</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Verification Method</label>
                <select
                  value={linkVerificationMethod}
                  onChange={(e) => setLinkVerificationMethod(e.target.value as GuardianVerificationMethod)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 min-h-[44px]"
                >
                  {Object.entries(VERIFICATION_METHOD_LABELS).map(([k, lbl]) => (
                    <option key={k} value={k}>
                      {lbl}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Relationship / Authority Evidence Reference
                </label>
                <input
                  type="text"
                  value={linkAuthorityEvidence}
                  onChange={(e) => setLinkAuthorityEvidence(e.target.value)}
                  placeholder="e.g. Kira Parish ID check / Birth Cert ref / School Patron note"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 min-h-[44px]"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-[#005A9C] hover:bg-[#004980] text-white text-xs font-bold rounded-xl min-h-[44px]"
              >
                Send Verification Link Request
              </button>
            </form>
          </div>

          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex items-center gap-2 font-heading font-bold text-base text-[#1B365D]">
                <FileCheck className="w-5 h-5 text-[#005A9C]" />
                <span>Immutable Consent Ledger ({consentHistory.length})</span>
              </div>
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {consentHistory.map((rec) => (
                  <div key={rec.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between gap-3">
                    <div>
                      <span className="font-bold text-[#1B365D]">{rec.boyName || rec.boyId}</span>
                      <span className="ml-2 text-slate-500">
                        v{rec.consentVersion} · {VERIFICATION_METHOD_LABELS[rec.verificationMethod] || rec.method}
                      </span>
                      {rec.authorityEvidence && (
                        <p className="text-[11px] text-slate-500 mt-0.5">Evidence: {rec.authorityEvidence}</p>
                      )}
                      {rec.reason && <p className="text-[11px] text-slate-600 mt-0.5">Reason: {rec.reason}</p>}
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                        rec.action === 'granted' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-[#DC2626]'
                      }`}
                    >
                      {rec.action}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex items-center gap-2 font-heading font-bold text-base text-[#1B365D]">
                <Bell className="w-5 h-5 text-[#005A9C]" />
                <span>Guardian Notifications &amp; Information Updates</span>
              </div>
              {notifications.map((n) => (
                <div key={n.id} className="p-3 rounded-xl bg-blue-50/50 border border-blue-100 text-xs">
                  <div className="font-bold text-[#1B365D]">{n.title}</div>
                  <p className="text-slate-600 mt-0.5">{n.message}</p>
                </div>
              ))}
              <form onSubmit={handleSubmitCorrection} className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={correctionText}
                  onChange={(e) => setCorrectionText(e.target.value)}
                  placeholder="Request update to inaccurate child or guardian details..."
                  className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-300 min-h-[40px]"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1B365D] text-white text-xs font-bold rounded-xl min-h-[40px]"
                >
                  Submit DPPA Update
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Verified Guardian Authority & Consent Modal */}
        {consentTarget && (
          <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-lg bg-white rounded-2xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center gap-2 text-[#1B365D] font-heading font-bold text-lg">
                <UserCheck className="w-5 h-5 text-[#005A9C]" />
                <span>Verify Authority &amp; Submit Consent</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                A simple checkbox does not establish legal authority over <strong>{consentTarget.name}</strong>. Record how your guardianship relationship was verified under Uganda Children Act (Cap 59).
              </p>
              <form onSubmit={handleSubmitConsent} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Verification Method</label>
                  <select
                    value={consentMethod}
                    onChange={(e) => setConsentMethod(e.target.value as GuardianVerificationMethod)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 min-h-[44px]"
                  >
                    {Object.entries(VERIFICATION_METHOD_LABELS).map(([k, lbl]) => (
                      <option key={k} value={k}>
                        {lbl}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Verification Evidence / Document Reference
                  </label>
                  <input
                    type="text"
                    value={consentEvidence}
                    onChange={(e) => setConsentEvidence(e.target.value)}
                    placeholder="e.g. National ID check by Coordinator Sarah / Child code BCA-482910"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 min-h-[44px]"
                    required
                  />
                </div>
                <label className="flex items-start gap-2 cursor-pointer text-slate-700 pt-1">
                  <input
                    type="checkbox"
                    checked={consentAttested}
                    onChange={(e) => setConsentAttested(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-slate-300 text-[#005A9C]"
                  />
                  <span>
                    I solemnly attest that I hold lawful parental or guardian responsibility for {consentTarget.name} and consent to supervised circle participation and Uganda DPPA 2019 data handling.
                  </span>
                </label>
                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setConsentTarget(null)}
                    className="px-4 py-2 font-semibold text-slate-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-[#005A9C] hover:bg-[#004980] text-white font-bold rounded-xl min-h-[44px]"
                  >
                    Confirm Verified Consent
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Withdraw Consent Confirmation Modal */}
        {withdrawTarget && (
          <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center gap-2 text-[#DC2626] font-heading font-bold text-lg">
                <FileWarning className="w-5 h-5" />
                <span>Withdraw Guardian Consent</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Withdrawing consent for <strong>{withdrawTarget.name}</strong> will immediately pause their circle access and set their account back to <code className="bg-slate-100 px-1">pending_guardian_consent</code>.
              </p>
              <form onSubmit={handleWithdrawConsent} className="space-y-3">
                <textarea
                  rows={3}
                  value={withdrawReason}
                  onChange={(e) => setWithdrawReason(e.target.value)}
                  placeholder="Reason for withdrawing consent (min 5 characters)..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                  required
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setWithdrawTarget(null)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#DC2626] text-white text-xs font-bold rounded-xl min-h-[40px]"
                  >
                    Confirm Withdrawal
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="p-4 bg-white rounded-2xl border border-slate-200 text-xs text-slate-600">
          <strong className="text-[#1B365D]">Uganda Legal &amp; Safeguarding Review Notice:</strong> Safeguards align with Uganda’s Children Act (Cap 59) and DPPA 2019; final deployment workflows must be reviewed by a qualified Ugandan legal or child-protection professional.
        </div>
      </div>
    </div>
  );
};
