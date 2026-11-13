import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useMemberData, usePublicCatalog } from '../../hooks/usePlatformData';
import { firebaseService } from '../../lib/firebase/firebase';
import { mockStore } from '../../lib/firebase/mockStore';
import { uploadAvatarFile } from '../../lib/firebase/storage';
import { SafeguardingConcernModal } from '../../components/common/SafeguardingConcernModal';
import { DigitalMembershipCard } from '../../components/common/DigitalMembershipCard';
import { detectSafeguardingBreachInText, validateImageFile } from '../../lib/validation/schemas';
import { UGANDA_DISTRICTS } from '../../lib/validation/ugandaDistricts';
import {
  Users,
  Calendar,
  Target,
  MessageSquare,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Plus,
  Send,
  Sparkles,
  PhoneCall,
  UserCheck,
  Award,
  BookOpen,
  Bell,
  Download,
  UserCog,
  Upload,
} from 'lucide-react';

type HubTab = 'overview' | 'goals' | 'attendance' | 'resources' | 'profile';

export const MemberHubPage: React.FC = () => {
  const { user, isUnder18Pending, isLiveFirebaseUser } = useAuth();
  usePublicCatalog(user?.role);
  useMemberData(user?.uid, user?.role);

  const [activeTab, setActiveTab] = useState<HubTab>('overview');
  const [concernModalOpen, setConcernModalOpen] = useState(false);

  const circles = firebaseService.getCircles();
  const userCircle = circles.find((c) => c.id === user?.circleId) || circles[0];
  const sessions = firebaseService.getSessions(userCircle?.id);
  const goals = firebaseService.getGoals(user?.uid || '');
  const questions = firebaseService.getQuestions(userCircle?.id);
  const attendance = firebaseService.getAttendance({ memberId: user?.uid || '' });
  const events = firebaseService.getEvents();
  const resources = firebaseService.getLearningResources().filter(
    (r) => r.audience === 'all' || r.audience === 'boys'
  );
  const notifications = firebaseService.getNotifications(user?.uid || '');
  const pendingLinks = firebaseService
    .getGuardianLinks()
    .filter((l) => l.boyId === user?.uid && l.status === 'pending_verification');
  const memberProfile = user ? mockStore.memberProfiles[user.uid] : undefined;

  // Ask Mentor Form
  const [questionText, setQuestionText] = useState('');
  const [askCategory, setAskCategory] = useState<'academic' | 'life_skills' | 'mental_wellbeing' | 'career'>('academic');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [askError, setAskError] = useState<string | null>(null);
  const [askSuccess, setAskSuccess] = useState(false);

  // Goal Modal
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalCategory, setGoalCategory] = useState<'Education' | 'Life Skills' | 'Emotional Wellbeing' | 'Career & Craft' | 'Community Service'>('Education');
  const [goalTargetDate, setGoalTargetDate] = useState('2026-12-15');

  // Profile Edit State (Never includes role!)
  const [profileDistrict, setProfileDistrict] = useState(user?.district || 'Kampala');
  const [profileTown, setProfileTown] = useState(user?.town || '');
  const [profileSchool, setProfileSchool] = useState(user?.schoolOrOccupation || '');
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  useEffect(() => {
    setProfileDistrict(user?.district || 'Kampala');
    setProfileTown(user?.town || '');
    setProfileSchool(user?.schoolOrOccupation || '');
  }, [user?.uid, user?.district, user?.town, user?.schoolOrOccupation]);

  // Avatar Upload State
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarNotice, setAvatarNotice] = useState<string | null>(null);

  // Guardian Link Code Verification State
  const [linkCodeInput, setLinkCodeInput] = useState('');
  const [linkStatusMsg, setLinkStatusMsg] = useState<string | null>(null);

  // DPPA Data Request State
  const [dppaReason, setDppaReason] = useState('');
  const [dppaNotice, setDppaNotice] = useState<string | null>(null);

  const safeguardingBreach = detectSafeguardingBreachInText(questionText);
  const isAdultMember = (user?.calculatedAge ?? 18) >= 18 || user?.ageCategory === 'young_adult_18_35';

  const handleAskMentor = async (e: React.FormEvent) => {
    e.preventDefault();
    setAskError(null);
    if (isUnder18Pending) {
      setAskError('Circle messaging is blocked while your account is awaiting parent or guardian consent.');
      return;
    }
    if (!userCircle) {
      setAskError('No mentorship circle assigned yet.');
      return;
    }
    if (questionText.trim().length < 10) {
      setAskError('Question must be at least 10 characters.');
      return;
    }
    if (safeguardingBreach.hasBreach) {
      setAskError(safeguardingBreach.reasons[0]);
      return;
    }
    try {
      await firebaseService.addQuestion({
        circleId: userCircle.id,
        userId: user?.uid || 'usr_unknown',
        authorAlias: isAnonymous ? 'Courageous Seeker' : user?.fullName || 'Boy Member',
        isAnonymous,
        category: askCategory,
        question: questionText.trim(),
      });
      setQuestionText('');
      setAskSuccess(true);
      setTimeout(() => setAskSuccess(false), 3000);
    } catch (err) {
      setAskError(err instanceof Error ? err.message : 'Unable to send question.');
    }
  };

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalTitle.trim() || !userCircle) return;
    try {
      await firebaseService.addGoal({
        userId: user?.uid || 'usr_unknown',
        circleId: userCircle.id,
        title: goalTitle.trim(),
        category: goalCategory,
        progress: 0,
        targetDate: goalTargetDate,
        notes: 'Personal milestone set in Member Hub',
        completed: false,
      });
      setGoalTitle('');
      setShowGoalModal(false);
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : 'Unable to save goal.');
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setProfileError(null);
    try {
      await firebaseService.updateProfile(user.uid, {
        district: profileDistrict,
        town: profileTown,
        schoolOrOccupation: profileSchool,
      });
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : 'Unable to update profile.');
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setProfileError(null);
    setAvatarNotice(null);
    const check = validateImageFile(file);
    if (!check.valid) {
      setProfileError(check.error || 'Invalid image selected.');
      return;
    }
    setAvatarUploading(true);
    try {
      const meta = await uploadAvatarFile(user.uid, file);
      await firebaseService.updateUserAvatar(user.uid, meta.url);
      setAvatarNotice('Profile photo updated.');
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : 'Could not upload profile photo.');
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleVerifyGuardianCode = async (linkId: string) => {
    setLinkStatusMsg(null);
    try {
      await firebaseService.verifyGuardianLink(linkId, linkCodeInput);
      setLinkCodeInput('');
      setLinkStatusMsg('Guardian relationship verified successfully.');
    } catch (err) {
      setLinkStatusMsg(err instanceof Error ? err.message : 'Invalid verification code.');
    }
  };

  const handleExportData = () => {
    if (!user) return;
    const bundle = firebaseService.exportMyData(user.uid);
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bca-personal-data-${user.uid}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setDppaNotice('Personal data export downloaded under Uganda DPPA 2019.');
  };

  const handleDppaRequest = async (type: 'correction' | 'deletion') => {
    if (!user || dppaReason.trim().length < 5) {
      setDppaNotice('Please enter at least 5 characters explaining your request.');
      return;
    }
    try {
      await firebaseService.requestDppaAction(user.uid, type, dppaReason.trim());
      setDppaReason('');
      setDppaNotice(`Your ${type} request has been logged with the BCA Data Protection Officer.`);
    } catch (err) {
      setDppaNotice(err instanceof Error ? err.message : 'Unable to log request.');
    }
  };

  return (
    <div className="bg-[#F8FAFC] min-h-screen py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
        {/* Header Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src={user?.avatarUrl || '/assets/aistudio/Screenshot_20260801_081145_WhatsApp__1__8a50926e.jpg'}
              alt={user?.avatarUrl ? `${user.fullName} profile photo` : 'Boy Child Association Official Logo'}
              className="w-14 h-14 object-cover rounded-full shadow-sm bg-white border border-slate-200 shrink-0 hidden sm:block"
              referrerPolicy="no-referrer"
            />
            <div>
              <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-[#005A9C] uppercase tracking-wider">
                <span>Member Hub</span>
                <span aria-hidden="true">·</span>
                <span className="px-2 py-0.5 rounded bg-blue-50 text-[#005A9C]">
                  {isAdultMember ? 'Young Adult (18–35)' : 'Child Cohort (5–17)'}
                </span>
                <span aria-hidden="true">·</span>
                <span className="text-slate-500">Standing Up As A Man</span>
              </div>
              <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-[#1B365D] mt-1">
                Welcome, {user?.fullName}
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                District: <span className="font-semibold text-slate-700">{user?.district || 'Kampala'}</span> ·
                Status: <span className="font-semibold text-[#005A9C] ml-1">{user?.status}</span>
              </p>
            </div>
          </div>

          <button
            onClick={() => setConcernModalOpen(true)}
            className="px-4 py-2.5 bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2 min-h-[44px]"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Report a Concern</span>
          </button>
        </div>

        {/* Under-18 Guardian Consent Hold Banner */}
        {isUnder18Pending && (
          <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-amber-100 text-amber-800 rounded-xl shrink-0">
                  <Lock className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="font-heading text-lg font-bold text-amber-950">
                    Circle Activities Locked — Awaiting Verified Guardian Consent
                  </h2>
                  <p className="mt-1 text-xs text-amber-900 leading-relaxed max-w-2xl">
                    Under Uganda’s Children Act (Cap 59), boys aged 5–17 cannot join peer circles or submit mentor Q&amp;A messages until a verified parent or guardian approves participation.
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-amber-950 font-medium">
                    <span className="bg-amber-100 px-2.5 py-1 rounded-md">
                      Guardian: <strong>{user?.guardianName || 'Grace Mukasa'}</strong>
                    </span>
                    <span className="bg-amber-100 px-2.5 py-1 rounded-md flex items-center gap-1.5">
                      <PhoneCall className="w-3.5 h-3.5 text-amber-700" />
                      <span>{user?.guardianPhone || '+256772334455'}</span>
                    </span>
                  </div>
                </div>
              </div>
              {!isLiveFirebaseUser && (
                <div className="shrink-0 w-full md:w-auto">
                  <button
                    onClick={() => {
                      if (!user) return;
                      firebaseService.approveGuardianConsent(user.uid, 'usr_guardian_grace').catch((err) => {
                        setAskError(err instanceof Error ? err.message : 'Unable to approve consent.');
                      });
                    }}
                    className="w-full md:w-auto px-5 py-3 bg-[#005A9C] hover:bg-[#004980] text-white font-bold text-xs rounded-xl shadow flex items-center justify-center gap-2 min-h-[44px]"
                  >
                    <UserCheck className="w-4 h-4 text-[#60C1E5]" />
                    <span>Simulate Guardian Consent (Preview)</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Pending Guardian Verification Code Prompts */}
        {pendingLinks.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 space-y-3">
            <div className="font-heading text-sm font-bold text-[#1B365D] flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-[#005A9C]" />
              <span>Pending Guardian Link Request</span>
            </div>
            {pendingLinks.map((lnk) => (
              <div key={lnk.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-blue-100">
                <div className="text-xs text-slate-700">
                  <strong>{lnk.guardianName}</strong> requested to verify as your <span className="capitalize">{lnk.relationship.replace(/_/g, ' ')}</span>.
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={linkCodeInput}
                    onChange={(e) => setLinkCodeInput(e.target.value)}
                    placeholder="Enter BCA-XXXXXX"
                    className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 min-h-[38px]"
                  />
                  <button
                    onClick={() => handleVerifyGuardianCode(lnk.id)}
                    className="px-3.5 py-1.5 bg-[#005A9C] text-white text-xs font-bold rounded-lg min-h-[38px]"
                  >
                    Confirm Code
                  </button>
                </div>
              </div>
            ))}
            {linkStatusMsg && <p className="text-xs font-semibold text-[#005A9C]">{linkStatusMsg}</p>}
          </div>
        )}

        {/* Member Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1">
          {[
            { id: 'overview' as HubTab, label: 'Circle & Ask Mentor', icon: Users },
            { id: 'goals' as HubTab, label: `Goals & Badges (${goals.length})`, icon: Target },
            { id: 'attendance' as HubTab, label: 'Calendar & Attendance', icon: Calendar },
            { id: 'resources' as HubTab, label: 'Learning Resources', icon: BookOpen },
            { id: 'profile' as HubTab, label: 'Profile & Privacy', icon: UserCog },
          ].map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold whitespace-nowrap min-h-[44px] transition-colors ${
                  activeTab === t.id
                    ? 'bg-white text-[#005A9C] border-t-2 border-[#005A9C] shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: OVERVIEW (Circle, Sessions, Ask a Mentor, Notifications) */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7 space-y-6">
              {/* Assigned Circle */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#005A9C]">
                    <Users className="w-4 h-4 text-[#005A9C]" />
                    <span>My Assigned Circle</span>
                  </div>
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                    isUnder18Pending ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {isUnder18Pending ? 'Pending Consent' : 'Active Member'}
                  </span>
                </div>

                {isUnder18Pending ? (
                  <div className="py-6 text-center text-slate-500 text-xs">
                    <Lock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <span>Circle details remain hidden until guardian consent is verified.</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-heading text-xl font-bold text-[#1B365D]">{userCircle.name}</h3>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {userCircle.locationName} · {userCircle.meetingTime}
                      </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-[#F4F8FC] rounded-xl border border-blue-100 text-xs text-slate-700">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Lead Mentor</span>
                        <span className="font-semibold text-[#1B365D]">{userCircle.leadMentorName}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Safeguarding Lead</span>
                        <span className="font-semibold text-[#1B365D]">{userCircle.safeguardingLeadName}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Cohort Size</span>
                        <span className="font-semibold text-[#1B365D] tabular-nums">
                          {userCircle.activeMembersCount} / {userCircle.maxMembers} Boys
                        </span>
                      </div>
                    </div>

                    <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="font-bold text-emerald-900">Boys WhatsApp Brotherhood Group (0732320190)</div>
                        <p className="text-[11px] text-emerald-800">Moderated brotherhood updates and circle reminders.</p>
                      </div>
                      <a
                        href="https://wa.me/256732320190?text=Hello%20Boy%20Child%20Association%2C%20I%20am%20a%20member%20connecting%20with%20the%20boys%20WhatsApp%20community"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs whitespace-nowrap text-center"
                      >
                        Open WhatsApp (0732320190)
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Supervised Ask a Mentor (No 1:1 Private Minor DMs) */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#005A9C]">
                    <MessageSquare className="w-4 h-4 text-[#005A9C]" />
                    <span>Supervised Circle Q&amp;A (Ask a Mentor)</span>
                  </div>
                  <span className="text-[11px] text-slate-500">Moderated · Zero 1:1 Private DMs</span>
                </div>

                <form onSubmit={handleAskMentor} className="space-y-3.5 mb-6">
                  {askError && (
                    <div className="p-3 bg-red-50 text-[#DC2626] rounded-xl text-xs font-medium border border-red-100 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{askError}</span>
                    </div>
                  )}
                  {askSuccess && (
                    <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-medium border border-emerald-100 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Your question was posted to the moderated circle thread.</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Topic</label>
                      <select
                        value={askCategory}
                        onChange={(e) => setAskCategory(e.target.value as any)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 min-h-[44px]"
                      >
                        <option value="academic">Academic &amp; Schooling</option>
                        <option value="life_skills">Life Skills &amp; Pressure</option>
                        <option value="mental_wellbeing">Mental Wellbeing &amp; Stress</option>
                        <option value="career">Vocational Trades &amp; Career</option>
                      </select>
                    </div>
                    <div className="flex items-end">
                      <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer min-h-[44px]">
                        <input
                          type="checkbox"
                          checked={isAnonymous}
                          onChange={(e) => setIsAnonymous(e.target.checked)}
                          className="w-4 h-4 rounded border-slate-300 text-[#005A9C]"
                        />
                        <span>Post question anonymously</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <textarea
                      rows={3}
                      value={questionText}
                      onChange={(e) => setQuestionText(e.target.value)}
                      placeholder="Ask about school, emotions, handling peer pressure, or craft skills..."
                      className={`w-full px-3 py-2 text-sm rounded-xl border ${
                        safeguardingBreach.hasBreach ? 'border-red-400 bg-red-50/40' : 'border-slate-300'
                      }`}
                    />
                    {safeguardingBreach.hasBreach && (
                      <div className="mt-1.5 p-2 bg-red-50 rounded-lg text-xs text-[#DC2626] flex items-start gap-1.5">
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{safeguardingBreach.reasons[0]}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">Protected by Two-Adult moderation rules.</span>
                    <button
                      type="submit"
                      disabled={isUnder18Pending || safeguardingBreach.hasBreach}
                      className="px-5 py-2.5 bg-[#005A9C] hover:bg-[#004980] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 min-h-[44px] disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                      <span>Send to Circle Thread</span>
                    </button>
                  </div>
                </form>

                <div className="space-y-3 pt-4 border-t border-slate-100">
                  {questions.map((q) => (
                    <div key={q.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-700">
                          {q.isAnonymous ? 'Anonymous Circle Member' : q.authorAlias}
                        </span>
                        <span className="text-[11px] text-slate-400">{new Date(q.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-xs text-slate-800 font-medium">&ldquo;{q.question}&rdquo;</p>
                      {q.mentorReply && (
                        <div className="p-3 rounded-lg bg-white border border-blue-100 text-xs space-y-1">
                          <div className="flex items-center gap-1.5 font-bold text-[#005A9C]">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Mentor Response ({q.repliedByMentorName})</span>
                          </div>
                          <p className="text-slate-700">{q.mentorReply}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Digital Membership Card, Notifications & Upcoming Sessions */}
            <div className="lg:col-span-5 space-y-6">
              {user && <DigitalMembershipCard user={user} circleName={userCircle?.name} />}

              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#005A9C]">
                  <Bell className="w-4 h-4" />
                  <span>Notifications ({notifications.filter((n) => !n.read).length} Unread)</span>
                </div>
                {notifications.length === 0 ? (
                  <p className="text-xs text-slate-500">All caught up! No pending notifications.</p>
                ) : (
                  <div className="space-y-2.5">
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`p-3 rounded-xl border text-xs ${
                          n.read ? 'bg-slate-50 border-slate-200' : 'bg-blue-50/60 border-blue-200'
                        }`}
                      >
                        <div className="flex items-center justify-between font-bold text-[#1B365D]">
                          <span>{n.title}</span>
                          {!n.read && (
                            <button
                              onClick={() => {
                                firebaseService.markNotificationRead(n.id).catch((err) => {
                                  setAskError(err instanceof Error ? err.message : 'Unable to mark notification read.');
                                });
                              }}
                              className="text-[11px] text-[#005A9C] hover:underline"
                            >
                              Mark read
                            </button>
                          )}
                        </div>
                        <p className="text-slate-600 mt-1">{n.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#005A9C]">
                  <Calendar className="w-4 h-4" />
                  <span>Upcoming Circle Sessions</span>
                </div>
                {isUnder18Pending ? (
                  <p className="text-xs text-slate-500">Locked pending guardian consent verification.</p>
                ) : (
                  <div className="space-y-3">
                    {sessions.map((s) => (
                      <div key={s.id} className="p-3.5 rounded-xl border border-slate-200 text-xs space-y-1">
                        <div className="font-bold text-[#1B365D]">{s.title}</div>
                        <div className="text-[#005A9C] font-semibold">{s.theme} · {s.mentorName}</div>
                        <div className="text-slate-500">{s.location}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: GOALS & ACHIEVEMENTS */}
        {activeTab === 'goals' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#005A9C]">
                  <Target className="w-4 h-4" />
                  <span>My Personal Growth Goals</span>
                </div>
                <button
                  onClick={() => setShowGoalModal(true)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#005A9C] text-white text-xs font-semibold min-h-[38px]"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Goal</span>
                </button>
              </div>
              {goals.length === 0 ? (
                <p className="text-xs text-slate-500 py-6 text-center">No goals created yet.</p>
              ) : (
                <div className="space-y-3">
                  {goals.map((g) => (
                    <div key={g.id} className="p-4 rounded-xl border border-slate-200 space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-bold uppercase text-[#005A9C]">{g.category}</span>
                          <h4 className="font-heading text-sm font-bold text-[#1B365D]">{g.title}</h4>
                        </div>
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100">{g.progress}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${g.completed ? 'bg-emerald-500' : 'bg-[#005A9C]'}`}
                          style={{ width: `${g.progress}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs pt-1">
                        <span className="text-slate-400">Target: {g.targetDate}</span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              firebaseService.updateGoalProgress(g.id, Math.max(0, g.progress - 10)).catch((err) => {
                                setProfileError(err instanceof Error ? err.message : 'Unable to update goal.');
                              });
                            }}
                            className="px-2 py-1 rounded border border-slate-200 font-bold"
                          >
                            -10%
                          </button>
                          <button
                            onClick={() => {
                              firebaseService.updateGoalProgress(g.id, Math.min(100, g.progress + 10)).catch((err) => {
                                setProfileError(err instanceof Error ? err.message : 'Unable to update goal.');
                              });
                            }}
                            className="px-2 py-1 rounded bg-[#005A9C] text-white font-bold"
                          >
                            +10%
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#005A9C]">
                <Award className="w-4 h-4" />
                <span>Achievements &amp; Certificates</span>
              </div>
              {(memberProfile?.achievements || []).length === 0 ? (
                <p className="text-xs text-slate-500 py-6 text-center">
                  Complete training modules and circle milestones to earn verified BCA certificates.
                </p>
              ) : (
                <div className="space-y-3">
                  {memberProfile!.achievements.map((ach) => (
                    <div key={ach.id} className="p-4 rounded-xl bg-[#F4F8FC] border border-blue-100 flex items-start gap-3">
                      <Award className="w-5 h-5 text-[#005A9C] shrink-0 mt-0.5" />
                      <div>
                        <div className="font-heading text-sm font-bold text-[#1B365D]">{ach.title}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Badge: {ach.badgeType} · Awarded {ach.awardedAt}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: CALENDAR & ATTENDANCE */}
        {activeTab === 'attendance' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <h2 className="font-heading text-lg font-bold text-[#1B365D]">My Attendance History</h2>
              {attendance.length === 0 ? (
                <p className="text-xs text-slate-500">No session attendance recorded yet.</p>
              ) : (
                <div className="space-y-2.5">
                  {attendance.map((a) => (
                    <div key={a.id} className="p-3.5 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-[#1B365D]">Date: {a.date}</div>
                        <div className="text-slate-500">Circle: {a.circleId}</div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold uppercase text-[11px]">
                        {a.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <h2 className="font-heading text-lg font-bold text-[#1B365D]">Published Programme Calendar</h2>
              <div className="space-y-3">
                {events.map((ev) => (
                  <div key={ev.id} className="p-3.5 rounded-xl border border-slate-200 text-xs space-y-1">
                    <div className="font-bold text-[#005A9C]">{ev.category} · {ev.district}</div>
                    <div className="font-heading text-sm font-bold text-[#1B365D]">{ev.title}</div>
                    <p className="text-slate-600">{ev.description}</p>
                    <div className="text-slate-500 pt-1">
                      {ev.location} · {new Date(ev.startsAt).toLocaleDateString('en-GB', { dateStyle: 'medium' })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: EDUCATIONAL & SAFEGUARDING RESOURCES */}
        {activeTab === 'resources' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resources.map((res) => (
              <div key={res.id} className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#005A9C] uppercase">{res.category}</span>
                  <span className="text-slate-400">{res.readTimeMinutes} min read</span>
                </div>
                <h3 className="font-heading text-base font-bold text-[#1B365D]">{res.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{res.summary}</p>
                <div className="p-3 rounded-xl bg-slate-50 text-xs text-slate-700 border border-slate-100">
                  {res.contentBody}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 5: PROFILE & UGANDA DPPA DATA RIGHTS */}
        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <h2 className="font-heading text-lg font-bold text-[#1B365D]">
                Update My Profile Details
              </h2>
              <p className="text-xs text-slate-500">
                Your role ({user?.role}) and safeguarding verification status are strictly controlled by administrators.
              </p>

              {/* Profile Photo Upload + Copyable Member UID */}
              <div className="p-4 rounded-xl bg-[#F4F8FC] border border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <img
                    src={user?.avatarUrl || '/assets/aistudio/Screenshot_20260801_081145_WhatsApp__1__8a50926e.jpg'}
                    alt="Profile avatar preview"
                    className="w-12 h-12 rounded-full object-cover border border-slate-200 bg-white shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div className="text-xs">
                    <div className="font-bold text-[#1B365D]">Profile Photo</div>
                    <div className="text-[11px] text-slate-500">JPEG, PNG or WebP (max 5 MB)</div>
                  </div>
                </div>
                <label className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl text-xs font-bold text-[#1B365D] cursor-pointer min-h-[40px]">
                  <Upload className="w-3.5 h-3.5 text-[#005A9C]" />
                  <span>{avatarUploading ? 'Uploading...' : 'Upload Photo'}</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleAvatarChange}
                    disabled={avatarUploading}
                    className="hidden"
                  />
                </label>
              </div>

              {user?.uid && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between gap-2">
                  <span className="text-slate-600">Member UID (for Guardian Verification):</span>
                  <code className="font-mono font-bold text-[#005A9C] select-all">{user.uid}</code>
                </div>
              )}

              {avatarNotice && (
                <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold">
                  {avatarNotice}
                </div>
              )}
              {profileSaved && (
                <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold">
                  Profile details updated.
                </div>
              )}
              {profileError && (
                <div className="p-3 rounded-xl bg-red-50 text-[#DC2626] text-xs font-semibold">
                  {profileError}
                </div>
              )}
              <form onSubmit={handleSaveProfile} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">District</label>
                  <select
                    value={profileDistrict}
                    onChange={(e) => setProfileDistrict(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 min-h-[44px]"
                  >
                    {UGANDA_DISTRICTS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Town / Village</label>
                  <input
                    type="text"
                    value={profileTown}
                    onChange={(e) => setProfileTown(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 min-h-[44px]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">School / Trade Focus</label>
                  <input
                    type="text"
                    value={profileSchool}
                    onChange={(e) => setProfileSchool(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 min-h-[44px]"
                  />
                </div>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#005A9C] hover:bg-[#004980] text-white text-xs font-bold rounded-xl min-h-[44px]"
                >
                  Save Profile Changes
                </button>
              </form>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <h2 className="font-heading text-lg font-bold text-[#1B365D]">
                Your Data Protection Rights (Uganda DPPA 2019)
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                Download a structured archive of your personal profile, goals, attendance, and consent records, or request correction/deletion. Note that active safeguarding records are retained securely under statutory child protection law.
              </p>
              <button
                onClick={handleExportData}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#1B365D] text-white text-xs font-bold rounded-xl min-h-[44px]"
              >
                <Download className="w-4 h-4 text-[#60C1E5]" />
                <span>Download My Data Archive (JSON)</span>
              </button>

              <div className="pt-4 border-t border-slate-100 space-y-3">
                <label className="block text-xs font-semibold text-slate-700">
                  Request Data Correction or Account Deletion
                </label>
                <textarea
                  rows={2}
                  value={dppaReason}
                  onChange={(e) => setDppaReason(e.target.value)}
                  placeholder="Specify fields to correct or reason for deletion request..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleDppaRequest('correction')}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl min-h-[40px]"
                  >
                    Submit Correction Request
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDppaRequest('deletion')}
                    className="px-4 py-2 bg-red-50 hover:bg-red-100 text-[#DC2626] text-xs font-bold rounded-xl min-h-[40px]"
                  >
                    Request Account Deletion
                  </button>
                </div>
                {dppaNotice && (
                  <p className="text-xs font-semibold text-emerald-700">{dppaNotice}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* New Goal Modal */}
        {showGoalModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl">
              <h3 className="font-heading text-lg font-bold text-[#1B365D] mb-3">
                Create a Personal Growth Goal
              </h3>
              <form onSubmit={handleAddGoal} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Goal Title <span className="text-[#DC2626]">*</span>
                  </label>
                  <input
                    type="text"
                    value={goalTitle}
                    onChange={(e) => setGoalTitle(e.target.value)}
                    placeholder="e.g. Master Solar Cell Soldering"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 min-h-[44px]"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Pillar Category</label>
                    <select
                      value={goalCategory}
                      onChange={(e) => setGoalCategory(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 min-h-[44px]"
                    >
                      <option value="Education">Education</option>
                      <option value="Career & Craft">Career &amp; Craft</option>
                      <option value="Life Skills">Life Skills</option>
                      <option value="Emotional Wellbeing">Emotional Wellbeing</option>
                      <option value="Community Service">Community Service</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Target Date</label>
                    <input
                      type="date"
                      value={goalTargetDate}
                      onChange={(e) => setGoalTargetDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 min-h-[44px]"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowGoalModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-[#005A9C] text-white text-xs font-bold rounded-xl min-h-[44px]"
                  >
                    Save Goal
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <SafeguardingConcernModal isOpen={concernModalOpen} onClose={() => setConcernModalOpen(false)} />
      </div>
    </div>
  );
};
