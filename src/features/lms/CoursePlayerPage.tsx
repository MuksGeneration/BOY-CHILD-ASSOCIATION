import React, { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useCourseWorkspaceData, useLmsData } from '../../hooks/usePlatformData';
import { firebaseService } from '../../lib/firebase/firebase';
import { uploadLmsSubmissionFile } from '../../lib/firebase/storage';
import { AuthorizedMeetingAccess, CourseCertificate } from '../../types';
import { LessonMediaPlayer } from '../../components/lms/LessonMediaPlayer';
import { DigitalCertificateCard } from '../../components/lms/DigitalCertificateCard';
import {
  ArrowLeft,
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  ClipboardCheck,
  ExternalLink,
  FileUp,
  Lock,
  Megaphone,
  ShieldCheck,
  Video,
  X,
} from 'lucide-react';

type WorkspaceTab = 'lesson' | 'assessments' | 'live_classes' | 'announcements';

export const CoursePlayerPage: React.FC = () => {
  const { courseId = '' } = useParams();
  const { user, role } = useAuth();
  useLmsData(user?.uid, role, user?.instructorAuthorized);
  useCourseWorkspaceData(courseId, user?.uid, role);

  const courses = firebaseService.getCourses(true);
  const course = courses.find((c) => c.id === courseId);
  const modules = firebaseService.getCourseModules(courseId);
  const lessons = firebaseService.getCourseLessons(courseId);
  const assets = firebaseService.getCourseAssets(courseId);
  const assessments = firebaseService.getAssessments(courseId);
  const sessions = firebaseService.getCourseSessions(courseId);
  const announcements = firebaseService.getCourseAnnouncements(courseId);

  const enrollments = user ? firebaseService.getEnrollments({ courseId, userId: user.uid }) : [];
  const enrollment = enrollments[0];
  const isStaff =
    role === 'admin' ||
    role === 'learning_manager' ||
    (user ? (role === 'instructor' || (role === 'mentor' && user.instructorAuthorized === true)) && course?.instructorIds.includes(user.uid) : false);
  const hasCourseAccess =
    Boolean(isStaff) ||
    Boolean(enrollment && ['enrolled', 'approved', 'completed'].includes(enrollment.status));

  const progressRecords = user ? firebaseService.getLessonProgress(courseId, user.uid) : [];
  const completedLessonIds = new Set(progressRecords.filter((p) => p.completed).map((p) => p.lessonId));

  const [selectedLessonId, setSelectedLessonId] = useState<string>(lessons[0]?.id || '');
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('lesson');

  // Assessment Runner State
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string>(assessments[0]?.id || '');
  const [answersMap, setAnswersMap] = useState<Record<string, string | number | boolean>>({});
  const [submissionText, setSubmissionText] = useState('');
  const [submissionFile, setSubmissionFile] = useState<File | null>(null);
  const [submittingWork, setSubmittingWork] = useState(false);

  // Live Zoom Access & Certificate State
  const [meetingAccess, setMeetingAccess] = useState<AuthorizedMeetingAccess | null>(null);
  const [earnedCert, setEarnedCert] = useState<CourseCertificate | null>(null);
  const [noticeMsg, setNoticeMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const currentLesson = useMemo(
    () => lessons.find((l) => l.id === selectedLessonId) || lessons[0],
    [lessons, selectedLessonId]
  );

  const myCertificates = user
    ? firebaseService.getCertificates(user.uid).filter((c) => c.courseId === courseId)
    : [];

  const activeAssessment = assessments.find((a) => a.id === selectedAssessmentId) || assessments[0];
  const assessmentQuestions = activeAssessment
    ? firebaseService.getAssessmentQuestions(activeAssessment.id)
    : [];
  const myAttempts =
    user && activeAssessment
      ? firebaseService.getAssessmentAttempts({
          assessmentId: activeAssessment.id,
          userId: user.uid,
        })
      : [];
  const mySubmissions =
    user && activeAssessment
      ? firebaseService.getAssignmentSubmissions({
          assessmentId: activeAssessment.id,
          userId: user.uid,
        })
      : [];

  if (!course) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center space-y-3">
        <h2 className="font-heading text-xl font-bold text-[#1B365D]">Course Not Found</h2>
        <Link to="/learn" className="text-xs font-bold text-[#005A9C] hover:underline">
          &larr; Return to BCA Online Skilling Catalogue
        </Link>
      </div>
    );
  }

  if (!user || !hasCourseAccess) {
    return (
      <div className="min-h-[65vh] flex items-center justify-center p-6 bg-[#F8FAFC]">
        <div className="max-w-md bg-white rounded-2xl p-8 border border-amber-200 text-center space-y-4">
          <Lock className="w-8 h-8 text-amber-700 mx-auto" />
          <h2 className="font-heading text-lg font-extrabold text-[#1B365D]">
            Active Enrolment Required
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            Private course lessons, study materials, and live Zoom classes in <strong>{course.title}</strong> are restricted to approved learners and assigned instructors.
          </p>
          <Link
            to="/learn"
            className="inline-block px-5 py-2.5 bg-[#005A9C] text-white text-xs font-bold rounded-xl"
          >
            Back to Course Catalogue
          </Link>
        </div>
      </div>
    );
  }

  const handleSaveLessonProgress = async (params: {
    lastPositionSeconds?: number;
    watchedSecondsDelta?: number;
    playbackSpeed?: number;
    completed?: boolean;
  }) => {
    if (!currentLesson || !user || !enrollment) return;
    setErrorMsg(null);
    try {
      await firebaseService.saveLessonProgress({
        courseId: course.id,
        moduleId: currentLesson.moduleId,
        lessonId: currentLesson.id,
        userId: user.uid,
        ...params,
      });
      if (params.completed !== undefined) {
        setNoticeMsg(
          params.completed
            ? `Completed "${currentLesson.title}". Course progress updated.`
            : `Updated progress for "${currentLesson.title}".`
        );
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to save lesson progress.');
    }
  };

  const handleSubmitQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAssessment || !user) return;
    setErrorMsg(null);
    setNoticeMsg(null);
    try {
      const attempt = await firebaseService.submitAssessmentAttempt(
        activeAssessment.id,
        course.id,
        user.uid,
        answersMap
      );
      setNoticeMsg(
        attempt.status === 'graded'
          ? `Assessment scored ${attempt.scorePercent}% (${attempt.passed ? 'PASSED' : 'Below Pass Mark'}).`
          : 'Written responses submitted for instructor grading.'
      );
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to submit assessment.');
    }
  };

  const handleSubmitAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAssessment || !user) return;
    if (submissionText.trim().length < 10) {
      setErrorMsg('Please enter at least 10 characters explaining your assignment work.');
      return;
    }
    setSubmittingWork(true);
    setErrorMsg(null);
    setNoticeMsg(null);
    try {
      let uploadedMeta: { storagePath: string; fileName: string } | undefined;
      if (submissionFile) {
        uploadedMeta = await uploadLmsSubmissionFile(course.id, user.uid, submissionFile);
      }
      await firebaseService.submitAssignmentWork({
        assessmentId: activeAssessment.id,
        courseId: course.id,
        userId: user.uid,
        submissionText: submissionText.trim(),
        fileAssetPath: uploadedMeta?.storagePath,
        fileName: uploadedMeta?.fileName,
      });
      setSubmissionText('');
      setSubmissionFile(null);
      setNoticeMsg('Assignment submitted cleanly to your instructor.');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to upload assignment submission.');
    } finally {
      setSubmittingWork(false);
    }
  };

  const handleJoinMeeting = async (sessionId: string) => {
    setErrorMsg(null);
    try {
      const access = await firebaseService.getAuthorizedMeetingAccess(sessionId, user.uid);
      setMeetingAccess(access);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to access meeting details.');
    }
  };

  const isLessonLocked = (prereqId?: string) =>
    Boolean(prereqId && !isStaff && !completedLessonIds.has(prereqId));

  return (
    <div className="bg-[#F8FAFC] min-h-screen py-8 sm:py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
        {/* Top Bar */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <Link to="/learn" className="text-xs font-bold text-[#005A9C] inline-flex items-center gap-1 hover:underline">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to My Learning</span>
            </Link>
            <h1 className="font-heading text-xl sm:text-2xl font-extrabold text-[#1B365D]">
              {course.title}
            </h1>
            <div className="text-xs text-slate-500">
              Instructors: {course.instructorNames.join(', ')} · {course.category}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 shrink-0">
            {enrollment && (
              <div className="text-right">
                <div className="text-[11px] font-bold uppercase text-slate-400">Course Progress</div>
                <div className="font-mono text-lg font-extrabold text-[#005A9C] tabular-nums">
                  {enrollment.progressPercent}% ({enrollment.completedLessonsCount}/{enrollment.totalLessonsCount})
                </div>
              </div>
            )}
            {myCertificates[0] && (
              <button
                type="button"
                onClick={() => setEarnedCert(myCertificates[0])}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 min-h-[42px]"
              >
                <Award className="w-4 h-4" />
                <span>View Certificate</span>
              </button>
            )}
          </div>
        </div>

        {noticeMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{noticeMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-[#DC2626] text-xs font-bold">
            {errorMsg}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Curriculum Sidebar */}
          <aside className="lg:col-span-4 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="font-heading text-sm font-extrabold uppercase tracking-wider text-[#1B365D]">
                  Course Curriculum
                </h2>
                <span className="font-mono text-xs text-slate-500">{lessons.length} lessons</span>
              </div>

              {modules.length === 0 ? (
                <p className="text-xs text-slate-500">Instructor is assembling curriculum modules.</p>
              ) : (
                <div className="space-y-4">
                  {modules.map((mod) => {
                    const modLessons = lessons.filter((l) => l.moduleId === mod.id);
                    const doneCount = modLessons.filter((l) => completedLessonIds.has(l.id)).length;
                    return (
                      <div key={mod.id} className="space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold text-[#1B365D]">
                          <span>{mod.title}</span>
                          <span className="font-mono text-[11px] text-[#005A9C] tabular-nums">
                            {doneCount}/{modLessons.length}
                          </span>
                        </div>
                        <div className="space-y-1.5">
                          {modLessons.map((les) => {
                            const done = completedLessonIds.has(les.id);
                            const locked = isLessonLocked(les.prerequisiteLessonId);
                            const isCurrent = currentLesson?.id === les.id && activeTab === 'lesson';
                            return (
                              <button
                                key={les.id}
                                type="button"
                                disabled={locked}
                                onClick={() => {
                                  setSelectedLessonId(les.id);
                                  setActiveTab('lesson');
                                }}
                                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs border transition-colors flex items-center justify-between gap-2 min-h-[42px] ${
                                  isCurrent
                                    ? 'bg-[#005A9C] text-white border-[#005A9C] font-semibold'
                                    : locked
                                    ? 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed'
                                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                                }`}
                              >
                                <span className="truncate">{les.title}</span>
                                <span className="shrink-0">
                                  {locked ? (
                                    <Lock className="w-3.5 h-3.5" />
                                  ) : done ? (
                                    <CheckCircle2 className={`w-4 h-4 ${isCurrent ? 'text-[#60C1E5]' : 'text-emerald-600'}`} />
                                  ) : (
                                    <span className="font-mono text-[10px] opacity-80">{les.durationMinutes}m</span>
                                  )}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </aside>

          {/* Main Workspace */}
          <div className="lg:col-span-8 space-y-5">
            <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-200 pb-1">
              {[
                { id: 'lesson' as const, label: 'Lesson Material', icon: BookOpen },
                { id: 'assessments' as const, label: `Assessments (${assessments.length})`, icon: ClipboardCheck },
                { id: 'live_classes' as const, label: `Live Zoom Classes (${sessions.length})`, icon: Video },
                { id: 'announcements' as const, label: `Announcements (${announcements.length})`, icon: Megaphone },
              ].map((t) => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setActiveTab(t.id)}
                    className={`px-4 py-2.5 rounded-t-xl text-xs font-semibold flex items-center gap-1.5 min-h-[44px] ${
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

            {activeTab === 'lesson' && (
              currentLesson ? (
                <div className="space-y-4">
                  <div className="bg-white rounded-2xl border border-slate-200 p-5">
                    <h2 className="font-heading text-lg font-extrabold text-[#1B365D]">
                      {currentLesson.title}
                    </h2>
                  </div>
                  <LessonMediaPlayer
                    lesson={currentLesson}
                    assets={assets}
                    progress={progressRecords.find((p) => p.lessonId === currentLesson.id)}
                    isCompleted={completedLessonIds.has(currentLesson.id)}
                    onSaveProgress={handleSaveLessonProgress}
                  />
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-xs text-slate-500">
                  Select a lesson from the left curriculum sidebar to start learning.
                </div>
              )
            )}

            {activeTab === 'assessments' && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5 text-xs">
                {assessments.length === 0 ? (
                  <p className="text-slate-500">No quizzes or assignments published for this course yet.</p>
                ) : (
                  <>
                    <div className="flex flex-wrap gap-2">
                      {assessments.map((a) => (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() => {
                            setSelectedAssessmentId(a.id);
                            setAnswersMap({});
                          }}
                          className={`px-3.5 py-2 rounded-xl font-bold border ${
                            activeAssessment?.id === a.id
                              ? 'bg-[#005A9C] text-white border-[#005A9C]'
                              : 'bg-slate-50 text-slate-700 border-slate-200'
                          }`}
                        >
                          {a.title} ({a.assessmentType.replace(/_/g, ' ')})
                        </button>
                      ))}
                    </div>

                    {activeAssessment && (
                      <div className="space-y-5 pt-2 border-t border-slate-100">
                        <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 space-y-1">
                          <div className="font-heading text-base font-bold text-[#1B365D]">
                            {activeAssessment.title}
                          </div>
                          <p className="text-slate-700">{activeAssessment.instructions}</p>
                          <div className="font-mono text-[11px] text-[#005A9C]">
                            Pass Mark: {activeAssessment.passMarkPercent}% · Max Attempts: {activeAssessment.maxAttempts} · Your Attempts: {myAttempts.length}
                          </div>
                        </div>

                        {activeAssessment.assessmentType === 'written_assignment' ||
                        activeAssessment.assessmentType === 'file_assignment' ? (
                          <form onSubmit={handleSubmitAssignment} className="space-y-4">
                            <div>
                              <label className="block font-bold text-[#1B365D] mb-1">
                                Written Assignment Response
                              </label>
                              <textarea
                                rows={4}
                                value={submissionText}
                                onChange={(e) => setSubmissionText(e.target.value)}
                                placeholder="Write your practical solution, calculations, or reflection..."
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                                required
                              />
                            </div>
                            <div>
                              <label className="block font-bold text-[#1B365D] mb-1">
                                Optional Attachment (PDF, Word, Slides, or Photo up to 30 MB)
                              </label>
                              <label className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold cursor-pointer">
                                <FileUp className="w-4 h-4 text-[#005A9C]" />
                                <span>{submissionFile ? submissionFile.name : 'Attach Supporting File'}</span>
                                <input
                                  type="file"
                                  className="sr-only"
                                  onChange={(e) => setSubmissionFile(e.target.files?.[0] || null)}
                                />
                              </label>
                            </div>
                            <button
                              type="submit"
                              disabled={submittingWork}
                              className="px-5 py-2.5 bg-[#005A9C] hover:bg-[#004980] text-white font-bold rounded-xl min-h-[44px]"
                            >
                              {submittingWork ? 'Submitting...' : 'Submit Assignment'}
                            </button>

                            {mySubmissions.length > 0 && (
                              <div className="space-y-2 pt-3 border-t border-slate-100">
                                <strong className="text-[#1B365D] block">Previous Assignment Submissions</strong>
                                {mySubmissions.map((s) => (
                                  <div key={s.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                                    <div className="flex justify-between font-bold">
                                      <span className="capitalize">{s.status.replace('_', ' ')}</span>
                                      {s.scorePercent !== undefined && (
                                        <span className="font-mono text-[#005A9C]">{s.scorePercent}%</span>
                                      )}
                                    </div>
                                    <p className="text-slate-700">{s.submissionText}</p>
                                    {s.instructorFeedback && (
                                      <p className="text-emerald-800 font-semibold">
                                        Instructor Feedback: {s.instructorFeedback}
                                      </p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </form>
                        ) : (
                          <form onSubmit={handleSubmitQuiz} className="space-y-4">
                            {assessmentQuestions.map((q, idx) => (
                              <div key={q.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2.5">
                                <div className="font-bold text-[#1B365D]">
                                  Q{idx + 1}. {q.prompt} <span className="font-mono text-[11px] text-slate-500">({q.points} pts)</span>
                                </div>
                                {q.questionType === 'mcq' && q.options && (
                                  <div className="space-y-1.5">
                                    {q.options.map((opt, oIdx) => (
                                      <label key={oIdx} className="flex items-center gap-2 cursor-pointer text-slate-700">
                                        <input
                                          type="radio"
                                          name={q.id}
                                          checked={answersMap[q.id] === oIdx}
                                          onChange={() => setAnswersMap({ ...answersMap, [q.id]: oIdx })}
                                        />
                                        <span>{opt}</span>
                                      </label>
                                    ))}
                                  </div>
                                )}
                                {q.questionType === 'true_false' && (
                                  <div className="flex items-center gap-4">
                                    {[true, false].map((val) => (
                                      <label key={String(val)} className="flex items-center gap-1.5 cursor-pointer">
                                        <input
                                          type="radio"
                                          name={q.id}
                                          checked={answersMap[q.id] === val}
                                          onChange={() => setAnswersMap({ ...answersMap, [q.id]: val })}
                                        />
                                        <span>{val ? 'True' : 'False'}</span>
                                      </label>
                                    ))}
                                  </div>
                                )}
                                {(q.questionType === 'short_answer' || q.questionType === 'written') && (
                                  <textarea
                                    rows={2}
                                    value={String(answersMap[q.id] || '')}
                                    onChange={(e) => setAnswersMap({ ...answersMap, [q.id]: e.target.value })}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                                    placeholder="Type your answer..."
                                  />
                                )}
                              </div>
                            ))}
                            <button
                              type="submit"
                              disabled={assessmentQuestions.length === 0}
                              className="px-5 py-2.5 bg-[#005A9C] hover:bg-[#004980] text-white font-bold rounded-xl min-h-[44px]"
                            >
                              Submit Quiz Attempt
                            </button>

                            {myAttempts.length > 0 && (
                              <div className="space-y-2 pt-3 border-t border-slate-100">
                                <strong className="text-[#1B365D] block">Recorded Attempts</strong>
                                {myAttempts.map((att) => (
                                  <div key={att.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex justify-between font-mono">
                                    <span>Attempt #{att.attemptNumber} · {att.earnedPoints}/{att.totalPoints} pts</span>
                                    <span className={att.passed ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}>
                                      {att.scorePercent}% ({att.passed ? 'PASS' : att.status.toUpperCase()})
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </form>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {activeTab === 'live_classes' && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 text-xs">
                <div className="flex justify-between items-center">
                  <h3 className="font-heading text-base font-bold text-[#1B365D]">
                    Scheduled Live Classes (Africa/Kampala)
                  </h3>
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Waiting Room Enforced</span>
                  </span>
                </div>
                {sessions.length === 0 ? (
                  <p className="text-slate-500">No live sessions scheduled for this course yet.</p>
                ) : (
                  sessions.map((s) => (
                    <div key={s.id} className="p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="font-bold text-[#1B365D] text-sm">{s.title}</div>
                        <p className="text-slate-600">{s.description}</p>
                        <div className="font-mono text-[#005A9C] flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{s.scheduledDate} · {s.startTimeKampala} EAT ({s.durationMinutes} min) · Status: {s.status}</span>
                        </div>
                      </div>
                      {s.status !== 'cancelled' && (
                        <button
                          type="button"
                          onClick={() => handleJoinMeeting(s.id)}
                          className="px-4 py-2 bg-[#1B365D] hover:bg-[#005A9C] text-white font-bold rounded-xl min-h-[42px] shrink-0"
                        >
                          Access Zoom Link
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'announcements' && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3 text-xs">
                <h3 className="font-heading text-base font-bold text-[#1B365D]">
                  Instructor Course Announcements
                </h3>
                {announcements.length === 0 ? (
                  <p className="text-slate-500">No announcements posted for this course.</p>
                ) : (
                  announcements.map((a) => (
                    <div key={a.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                      <div className="flex justify-between font-bold text-[#1B365D]">
                        <span>{a.title}</span>
                        <span className="text-[10px] uppercase text-[#005A9C]">{a.priority}</span>
                      </div>
                      <p className="text-slate-700 leading-relaxed">{a.message}</p>
                      <div className="text-[11px] text-slate-400">Posted by {a.authorName}</div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Zoom Meeting Access Modal */}
        {meetingAccess && (
          <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl space-y-4 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <strong className="font-heading text-base text-[#1B365D]">Authorized Zoom Classroom</strong>
                <button type="button" onClick={() => setMeetingAccess(null)}><X className="w-4 h-4" /></button>
              </div>
              <div className="space-y-2">
                <div className="font-bold text-[#1B365D]">{meetingAccess.topic}</div>
                <div className="font-mono text-slate-600">
                  Meeting ID: {meetingAccess.zoomMeetingId}
                  {meetingAccess.passcode ? ` · Passcode: ${meetingAccess.passcode}` : ''}
                </div>
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900">
                  {meetingAccess.safeguardingNotice}
                </div>
              </div>
              <a
                href={meetingAccess.joinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 bg-[#005A9C] text-white font-bold rounded-xl flex items-center justify-center gap-2 min-h-[44px]"
              >
                <span>Launch Zoom Session</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        )}

        {/* Certificate Modal */}
        {earnedCert && (
          <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 overflow-y-auto">
            <div className="w-full max-w-3xl my-6">
              <DigitalCertificateCard certificate={earnedCert} onClose={() => setEarnedCert(null)} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
