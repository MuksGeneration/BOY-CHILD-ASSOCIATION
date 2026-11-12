import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { firebaseService } from '../../lib/firebase/firebase';
import { SafeguardingConcernModal } from '../../components/common/SafeguardingConcernModal';
import { detectSafeguardingBreachInText } from '../../lib/validation/schemas';
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
  UserCheck
} from 'lucide-react';

export const MemberHubPage: React.FC = () => {
  const { user, isUnder18Pending } = useAuth();
  const [concernModalOpen, setConcernModalOpen] = useState(false);

  // Data
  const circles = firebaseService.getCircles();
  const userCircle = circles.find((c) => c.id === user?.circleId) || circles[0];
  const sessions = firebaseService.getSessions(userCircle?.id);
  const goals = firebaseService.getGoals(user?.uid || '');
  const questions = firebaseService.getQuestions(userCircle?.id);

  // Ask Mentor Form State
  const [questionText, setQuestionText] = useState('');
  const [askCategory, setAskCategory] = useState<'academic' | 'life_skills' | 'mental_wellbeing' | 'career'>('academic');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [askError, setAskError] = useState<string | null>(null);
  const [askSuccess, setAskSuccess] = useState(false);

  // New Goal Modal State
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalCategory, setGoalCategory] = useState<'Education' | 'Life Skills' | 'Emotional Wellbeing' | 'Career & Craft' | 'Community Service'>('Education');
  const [goalTargetDate, setGoalTargetDate] = useState('2026-12-15');

  // Real-time Safeguarding breach check in message
  const safeguardingBreach = detectSafeguardingBreachInText(questionText);

  const handleAskMentor = (e: React.FormEvent) => {
    e.preventDefault();
    setAskError(null);

    if (isUnder18Pending) {
      setAskError('Circle messaging is blocked while your account is awaiting parent or guardian consent.');
      return;
    }

    if (questionText.trim().length < 10) {
      setAskError('Question must be at least 10 characters.');
      return;
    }

    // Strict safeguarding check
    if (safeguardingBreach.hasBreach) {
      setAskError(safeguardingBreach.reasons[0]);
      return;
    }

    firebaseService.addQuestion({
      circleId: userCircle.id,
      userId: user?.uid || 'usr_unknown',
      authorAlias: isAnonymous ? 'Courageous Seeker' : (user?.fullName || 'Boy Member'),
      isAnonymous,
      category: askCategory,
      question: questionText.trim()
    });

    setQuestionText('');
    setAskSuccess(true);
    setTimeout(() => setAskSuccess(false), 3000);
  };

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalTitle.trim()) return;

    firebaseService.addGoal({
      userId: user?.uid || 'usr_unknown',
      title: goalTitle.trim(),
      category: goalCategory,
      progress: 0,
      targetDate: goalTargetDate,
      notes: 'New goal set in Member Hub',
      completed: false
    });

    setGoalTitle('');
    setShowGoalModal(false);
  };

  const handleProgressChange = (goalId: string, currentProgress: number, delta: number) => {
    const newProgress = Math.min(100, Math.max(0, currentProgress + delta));
    firebaseService.updateGoalProgress(goalId, newProgress);
  };

  return (
    <div className="bg-[#F8FAFC] min-h-screen py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
        {/* Hub Header */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src="/assets/aistudio/Screenshot_20260801_081145_WhatsApp__1__8a50926e.jpg"
              alt="Boy Child Association Official Logo"
              className="w-14 h-14 object-contain rounded-full shadow-sm bg-white border border-slate-200 shrink-0 hidden sm:block"
            />
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-[#005A9C] uppercase tracking-wider">
                <span>Personal Brotherhood Hub</span>
                <span aria-hidden="true">·</span>
                <span className="capitalize">{user?.role} Portal</span>
                <span aria-hidden="true">·</span>
                <span className="text-slate-500">Standing Up As A Man</span>
              </div>
              <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-[#1B365D] mt-1">
                Welcome, {user?.fullName}
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                District: <span className="font-semibold text-slate-700">{user?.district || 'Kampala'}</span> · 
                Status: <span className="font-semibold text-[#005A9C]">{user?.status}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setConcernModalOpen(true)}
              className="px-4 py-2.5 bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2 min-h-[44px]"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Report a Concern</span>
            </button>
          </div>
        </div>

        {/* CRITICAL ACCEPTANCE CHECK: Minor Pending Guardian Consent Guard */}
        {isUnder18Pending && (
          <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-amber-100 text-amber-800 rounded-xl shrink-0">
                  <Lock className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="font-heading text-lg font-bold text-amber-950 flex items-center gap-2">
                    Circle Activities Locked — Awaiting Guardian Consent
                  </h2>
                  <p className="mt-1 text-xs text-amber-900 leading-relaxed max-w-2xl">
                    Under Uganda’s Child Protection laws, boys under 18 cannot join circles or exchange messages with mentors until parent or guardian consent is recorded.
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

              {/* Demo Override button to simulate parent SMS consent */}
              <div className="shrink-0 w-full md:w-auto">
                <button
                  onClick={() => {
                    if (user) {
                      firebaseService.approveGuardianConsent(user.uid, 'usr_guardian_grace');
                    }
                  }}
                  className="w-full md:w-auto px-5 py-3 bg-[#005A9C] hover:bg-[#004980] text-white font-bold text-xs rounded-xl shadow flex items-center justify-center gap-2 min-h-[44px]"
                >
                  <UserCheck className="w-4 h-4 text-[#60C1E5]" />
                  <span>Verify Guardian Consent (Demo)</span>
                </button>
                <div className="text-[11px] text-amber-800 text-center md:text-right mt-1">
                  Or switch to Guardian persona to review
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Grid: My Circle, Upcoming Sessions, Goals, Ask Mentor */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Circle & Upcoming Sessions */}
          <div className="lg:col-span-7 space-y-8">
            {/* My Circle Overview Card */}
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
                  <span>Circle details hidden until guardian consent is registered.</span>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-heading text-xl font-bold text-[#1B365D]">
                      {userCircle.name}
                    </h3>
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
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Circle Size</span>
                      <span className="font-semibold text-[#1B365D] tabular-nums">{userCircle.activeMembersCount} of {userCircle.maxMembers} Boys</span>
                    </div>
                  </div>

                  <div className="text-xs text-slate-600 bg-white p-3 rounded-lg border border-slate-200">
                    <span className="font-bold text-slate-800">Circle Pledge: </span>
                    &ldquo;We respect one another, protect each other’s dignity, speak with honesty, and never leave a brother behind.&rdquo;
                  </div>

                  {/* Boys WhatsApp Brotherhood Community Group */}
                  <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="font-bold flex items-center gap-1.5 text-emerald-900">
                        <span>Boys WhatsApp Brotherhood Group</span>
                        <span className="font-mono text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded text-[10px]">0732320190</span>
                      </div>
                      <p className="text-[11px] text-emerald-800">
                        Daily positive encouragement, brotherhood updates, and circle reminders.
                      </p>
                    </div>
                    <a
                      href="https://wa.me/256732320190?text=Hello%20Boy%20Child%20Association%2C%20I%20am%20a%20member%20connecting%20with%20the%20boys%20WhatsApp%20community"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs whitespace-nowrap text-center transition-colors shadow-xs"
                    >
                      Open WhatsApp (0732320190)
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Upcoming Circle Sessions */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#005A9C]">
                  <Calendar className="w-4 h-4 text-[#005A9C]" />
                  <span>Upcoming Circle Sessions</span>
                </div>
                <span className="text-xs text-slate-400 font-mono">Kampala Chapter</span>
              </div>

              {isUnder18Pending ? (
                <p className="text-xs text-slate-500 py-4 text-center">
                  Session attendance schedule is locked until consent verification.
                </p>
              ) : (
                <div className="space-y-3">
                  {sessions.map((sess) => (
                    <div
                      key={sess.id}
                      className="p-4 rounded-xl border border-slate-200/80 hover:border-[#005A9C]/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-[#005A9C] font-semibold">
                          <span>{sess.theme}</span>
                          <span aria-hidden="true">·</span>
                          <span>Mentor: {sess.mentorName}</span>
                        </div>
                        <h4 className="font-heading text-sm font-bold text-[#1B365D]">
                          {sess.title}
                        </h4>
                        <p className="text-xs text-slate-500">
                          {sess.location} · Scheduled: {new Date(sess.scheduledAt).toLocaleDateString('en-GB', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                        {sess.notes && (
                          <p className="text-[11px] text-slate-600 italic bg-slate-50 p-2 rounded">
                            Note: {sess.notes}
                          </p>
                        )}
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        <span className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-semibold">
                          Confirmed
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Ask a Mentor Q&A (Can be Anonymous, Safeguarding Breached Checked) */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#005A9C]">
                  <MessageSquare className="w-4 h-4 text-[#005A9C]" />
                  <span>Ask a Mentor (Safe Advice)</span>
                </div>
                <span className="text-[11px] text-slate-500">
                  Moderated · Confidential
                </span>
              </div>

              {/* Form */}
              <form onSubmit={handleAskMentor} className="space-y-3.5 mb-6">
                {askError && (
                  <div className="p-3 bg-red-50 text-[#DC2626] rounded-xl text-xs font-medium border border-red-100 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-[#DC2626] shrink-0 mt-0.5" />
                    <span>{askError}</span>
                  </div>
                )}

                {askSuccess && (
                  <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-medium border border-emerald-100 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Your question was posted to your circle mentor thread.</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Topic</label>
                    <select
                      value={askCategory}
                      onChange={(e) => setAskCategory(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-[#005A9C] min-h-[44px]"
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
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      Your Question (Min 10 chars)
                    </label>
                    <span className="text-[11px] font-mono text-slate-400">
                      {questionText.length}/1000
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    value={questionText}
                    onChange={(e) => setQuestionText(e.target.value)}
                    placeholder="Ask about school, handling tough emotions, dealing with peer pressure, or skills..."
                    className={`w-full px-3 py-2 text-sm rounded-xl border ${
                      safeguardingBreach.hasBreach
                        ? 'border-red-400 bg-red-50/40 focus:border-red-500'
                        : 'border-slate-300 focus:border-[#005A9C]'
                    }`}
                  />
                  {/* Real-time Safeguarding Scanner Feedback */}
                  {safeguardingBreach.hasBreach && (
                    <div className="mt-1.5 p-2 bg-red-50 rounded-lg text-xs text-[#DC2626] flex items-start gap-1.5">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{safeguardingBreach.reasons[0]}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-400">
                    Mentors cannot see phone numbers or private profiles.
                  </span>
                  <button
                    type="submit"
                    disabled={isUnder18Pending || safeguardingBreach.hasBreach}
                    className="px-5 py-2.5 bg-[#005A9C] hover:bg-[#004980] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 min-h-[44px] disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    <span>Send to Circle Mentors</span>
                  </button>
                </div>
              </form>

              {/* Existing Q&A Thread */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Circle Guidance Log
                </div>
                {questions.map((q) => (
                  <div key={q.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700">
                        {q.isAnonymous ? 'Anonymous Circle Member' : q.authorAlias}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {new Date(q.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-800 leading-relaxed font-medium">
                      &ldquo;{q.question}&rdquo;
                    </p>

                    {q.mentorReply ? (
                      <div className="mt-2.5 p-3 rounded-lg bg-white border border-blue-100 text-xs space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-[#005A9C]">
                          <Sparkles className="w-3.5 h-3.5 text-[#005A9C]" />
                          <span>Mentor Response ({q.repliedByMentorName})</span>
                        </div>
                        <p className="text-slate-700 leading-relaxed">
                          {q.mentorReply}
                        </p>
                      </div>
                    ) : (
                      <div className="text-[11px] text-amber-700 italic">
                        Awaiting mentor review in Saturday’s circle...
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Personal Goals & Milestones */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#005A9C]">
                  <Target className="w-4 h-4 text-[#005A9C]" />
                  <span>My Personal Goals</span>
                </div>
                <button
                  onClick={() => setShowGoalModal(true)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#005A9C] text-white text-xs font-semibold hover:bg-[#004980] min-h-[38px]"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Goal</span>
                </button>
              </div>

              <div className="space-y-4">
                {goals.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 text-xs">
                    No active goals set yet. Click &quot;New Goal&quot; to set an academic, craft or wellbeing target.
                  </div>
                ) : (
                  goals.map((g) => (
                    <div
                      key={g.id}
                      className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#005A9C] block">
                            {g.category}
                          </span>
                          <h4 className="font-heading text-sm font-bold text-[#1B365D]">
                            {g.title}
                          </h4>
                        </div>
                        <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                          g.completed ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {g.progress}%
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            g.completed ? 'bg-emerald-500' : 'bg-[#005A9C]'
                          }`}
                          style={{ width: `${g.progress}%` }}
                        />
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed">
                        {g.notes}
                      </p>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-[11px] text-slate-400">
                          Target: {g.targetDate}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleProgressChange(g.id, g.progress, -10)}
                            className="px-2 py-1 rounded border border-slate-200 text-slate-600 hover:bg-slate-100 text-[11px] font-bold"
                            title="Decrease 10%"
                          >
                            -10%
                          </button>
                          <button
                            onClick={() => handleProgressChange(g.id, g.progress, 10)}
                            className="px-2 py-1 rounded bg-[#005A9C] text-white hover:bg-[#004980] text-[11px] font-bold"
                            title="Increase 10%"
                          >
                            +10%
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

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
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:border-[#005A9C] min-h-[44px]"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Pillar Category
                    </label>
                    <select
                      value={goalCategory}
                      onChange={(e) => setGoalCategory(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:border-[#005A9C] min-h-[44px]"
                    >
                      <option value="Education">Education</option>
                      <option value="Career & Craft">Career &amp; Craft</option>
                      <option value="Life Skills">Life Skills</option>
                      <option value="Emotional Wellbeing">Emotional Wellbeing</option>
                      <option value="Community Service">Community Service</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Target Date
                    </label>
                    <input
                      type="date"
                      value={goalTargetDate}
                      onChange={(e) => setGoalTargetDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:border-[#005A9C] min-h-[44px]"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowGoalModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
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

        <SafeguardingConcernModal
          isOpen={concernModalOpen}
          onClose={() => setConcernModalOpen(false)}
        />
      </div>
    </div>
  );
};
