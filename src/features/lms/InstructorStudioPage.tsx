import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useCourseWorkspaceData, useLmsData } from '../../hooks/usePlatformData';
import { firebaseService } from '../../lib/firebase/firebase';
import {
  lmsAssessmentSchema,
  lmsLessonSchema,
  lmsModuleSchema,
  lmsQuestionSchema,
  lmsZoomSessionSchema,
} from '../../lib/validation/schemas';
import { AssessmentType, Course, LessonType, SessionAttendance } from '../../types';
import { CourseWizardModal } from './CourseWizardModal';
import { CourseMediaUploader } from '../../components/lms/CourseMediaUploader';
import {
  AlertTriangle,
  BellRing,
  BookOpen,
  Calendar,
  CheckCircle2,
  ClipboardCheck,
  Edit3,
  FolderPlus,
  Lock,
  Megaphone,
  Plus,
  RefreshCw,
  UploadCloud,
  Users,
  Video,
} from 'lucide-react';

type StudioTab = 'courses' | 'curriculum' | 'media' | 'zoom' | 'assessments' | 'announcements';

export const InstructorStudioPage: React.FC = () => {
  const { user, role } = useAuth();
  useLmsData(user?.uid, role, user?.instructorAuthorized);

  const canTeach =
    role === 'instructor' ||
    role === 'learning_manager' ||
    role === 'admin' ||
    (role === 'mentor' && user?.instructorAuthorized === true);

  const allCourses = firebaseService.getCourses(true);
  const myCourses =
    role === 'learning_manager' || role === 'admin'
      ? allCourses
      : allCourses.filter(
          (c) => user && (c.createdBy === user.uid || c.instructorIds.includes(user.uid))
        );

  const [selectedCourseId, setSelectedCourseId] = useState<string>(myCourses[0]?.id || '');
  const activeCourse = myCourses.find((c) => c.id === selectedCourseId) || myCourses[0];
  useCourseWorkspaceData(activeCourse?.id, user?.uid, role);

  const [activeTab, setActiveTab] = useState<StudioTab>('courses');
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Module & Lesson Form States
  const [modTitle, setModTitle] = useState('');
  const [modDesc, setModDesc] = useState('');
  const [lesModuleId, setLesModuleId] = useState('');
  const [lesTitle, setLesTitle] = useState('');
  const [lesType, setLesType] = useState<LessonType>('video');
  const [lesDuration, setLesDuration] = useState(20);
  const [lesText, setLesText] = useState('');
  const [lesTranscript, setLesTranscript] = useState('');
  const [lesPrimaryAssetId, setLesPrimaryAssetId] = useState('');
  const [lesNotesAssetId, setLesNotesAssetId] = useState('');

  // Zoom Live Session Form State
  const [sessTitle, setSessTitle] = useState('');
  const [sessDesc, setSessDesc] = useState('');
  const [sessDate, setSessDate] = useState('2026-12-05');
  const [sessTime, setSessTime] = useState('10:00');
  const [sessDuration, setSessDuration] = useState(60);
  const [sessRecurring, setSessRecurring] = useState(false);
  const [manualJoinUrl, setManualJoinUrl] = useState('');
  const [manualPasscode, setManualPasscode] = useState('');

  // Assessment & Question Form State
  const [assmTitle, setAssmTitle] = useState('');
  const [assmType, setAssmType] = useState<AssessmentType>('quiz');
  const [assmInstructions, setAssmInstructions] = useState('Complete all questions honestly.');
  const [assmPassMark, setAssmPassMark] = useState(70);
  const [qAssmId, setQAssmId] = useState('');
  const [qType, setQType] = useState<'mcq' | 'true_false' | 'short_answer' | 'written'>('mcq');
  const [qPrompt, setQPrompt] = useState('');
  const [qOptionsText, setQOptionsText] = useState('Option A, Option B, Option C, Option D');
  const [qCorrectIdx, setQCorrectIdx] = useState(0);
  const [qCorrectBool, setQCorrectBool] = useState(true);
  const [qKeywords, setQKeywords] = useState('');
  const [qPoints, setQPoints] = useState(5);
  const [gradeInputs, setGradeInputs] = useState<Record<string, { score: number; feedback: string }>>({});

  // Announcement Form State
  const [annTitle, setAnnTitle] = useState('');
  const [annBody, setAnnBody] = useState('');
  const [annPriority, setAnnPriority] = useState<'normal' | 'urgent'>('normal');

  if (!user || !canTeach) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6 bg-[#F8FAFC]">
        <div className="max-w-lg bg-white rounded-2xl p-8 border border-amber-200 text-center space-y-3">
          <Lock className="w-8 h-8 text-amber-700 mx-auto" />
          <h2 className="font-heading text-lg font-extrabold text-[#1B365D]">
            Explicit Instructor Authorization Required
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            Access to the Instructor Studio is reserved for assigned LMS Instructors, Learning Managers, or vetted Mentors who have received explicit <code className="bg-slate-100 px-1">instructorAuthorized</code> clearance from the Learning Manager or Administrator.
          </p>
        </div>
      </div>
    );
  }

  const courseId = activeCourse?.id || '';
  const modules = courseId ? firebaseService.getCourseModules(courseId) : [];
  const lessons = courseId ? firebaseService.getCourseLessons(courseId) : [];
  const assets = courseId ? firebaseService.getCourseAssets(courseId) : [];
  const sessions = courseId ? firebaseService.getCourseSessions(courseId) : [];
  const assessments = courseId ? firebaseService.getAssessments(courseId) : [];
  const submissions = courseId ? firebaseService.getAssignmentSubmissions({ courseId }) : [];
  const enrollments = courseId ? firebaseService.getEnrollments({ courseId }) : [];
  const announcements = courseId ? firebaseService.getCourseAnnouncements(courseId) : [];
  const zoomConfig = firebaseService.getZoomConfig();

  const notify = (msg: string) => {
    setErrorMsg(null);
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 4500);
  };

  const handleAddModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId) return;
    const parsed = lmsModuleSchema.safeParse({
      courseId,
      title: modTitle,
      description: modDesc,
      orderIndex: modules.length + 1,
    });
    if (!parsed.success) {
      setErrorMsg(parsed.error.issues[0]?.message || 'Check module details.');
      return;
    }
    try {
      await firebaseService.saveCourseModule({
        ...parsed.data,
        status: 'published',
        createdBy: user.uid,
      });
      setModTitle('');
      setModDesc('');
      notify('Course module added cleanly.');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to save module.');
    }
  };

  const handleAddLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId) return;
    const targetMod = lesModuleId || modules[0]?.id || '';
    const parsed = lmsLessonSchema.safeParse({
      courseId,
      moduleId: targetMod,
      title: lesTitle,
      lessonType: lesType,
      durationMinutes: Number(lesDuration),
      isRequired: true,
      textContent: lesText,
      transcript: lesTranscript,
    });
    if (!parsed.success) {
      setErrorMsg(parsed.error.issues[0]?.message || 'Please complete required lesson fields.');
      return;
    }
    try {
      const modLessonsCount = lessons.filter((l) => l.moduleId === targetMod).length;
      await firebaseService.saveCourseLesson({
        ...parsed.data,
        orderIndex: modLessonsCount + 1,
        objectives: ['Complete core module objective safely'],
        primaryAssetId: lesPrimaryAssetId || undefined,
        studyNotesAssetId: lesNotesAssetId || undefined,
        status: 'published',
        createdBy: user.uid,
      });
      setLesTitle('');
      setLesText('');
      setLesTranscript('');
      notify('Lesson published to module.');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to add lesson.');
    }
  };

  const handleScheduleSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId) return;
    const parsed = lmsZoomSessionSchema.safeParse({
      courseId,
      title: sessTitle,
      description: sessDesc,
      scheduledDate: sessDate,
      startTimeKampala: sessTime,
      durationMinutes: Number(sessDuration),
      isRecurring: sessRecurring,
    });
    if (!parsed.success) {
      setErrorMsg(parsed.error.issues[0]?.message || 'Verify Zoom session time in Africa/Kampala.');
      return;
    }
    try {
      await firebaseService.scheduleLiveSession({
        ...parsed.data,
        instructorUid: user.uid,
        manualJoinUrl: manualJoinUrl.trim() || undefined,
        manualPasscode: manualPasscode.trim() || undefined,
      });
      setSessTitle('');
      setSessDesc('');
      setManualJoinUrl('');
      setManualPasscode('');
      notify('Live Zoom session scheduled in Africa/Kampala time with Waiting Room safeguarding.');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to schedule live class.');
    }
  };

  const handleCreateAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId) return;
    const parsed = lmsAssessmentSchema.safeParse({
      courseId,
      title: assmTitle,
      assessmentType: assmType,
      instructions: assmInstructions,
      passMarkPercent: Number(assmPassMark),
      maxAttempts: 3,
    });
    if (!parsed.success) {
      setErrorMsg(parsed.error.issues[0]?.message || 'Check assessment details.');
      return;
    }
    try {
      const created = await firebaseService.saveAssessment({
        ...parsed.data,
        releaseAnswersAfterSubmit: true,
        status: 'published',
        createdBy: user.uid,
      });
      setQAssmId(created.id);
      setAssmTitle('');
      notify('Assessment created. Add questions below.');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to save assessment.');
    }
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetAssm = qAssmId || assessments[0]?.id || '';
    if (!targetAssm || !courseId) return;
    const parsed = lmsQuestionSchema.safeParse({
      assessmentId: targetAssm,
      courseId,
      questionType: qType,
      prompt: qPrompt,
      points: Number(qPoints),
    });
    if (!parsed.success) {
      setErrorMsg(parsed.error.issues[0]?.message || 'Review question fields.');
      return;
    }
    try {
      const opts =
        qType === 'mcq'
          ? qOptionsText
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean)
          : undefined;
      await firebaseService.saveAssessmentQuestion({
        assessmentId: targetAssm,
        courseId,
        orderIndex: firebaseService.getAssessmentQuestions(targetAssm).length + 1,
        questionType: qType,
        prompt: parsed.data.prompt,
        options: opts,
        points: parsed.data.points,
        correctOptionIndex: qType === 'mcq' ? Number(qCorrectIdx) : undefined,
        correctBoolean: qType === 'true_false' ? qCorrectBool : undefined,
        expectedKeywords:
          qType === 'short_answer'
            ? qKeywords
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean)
            : undefined,
        createdBy: user.uid,
      });
      setQPrompt('');
      notify('Question and confidential backend answer key saved.');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to save question.');
    }
  };

  const handlePublishAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId || annTitle.trim().length < 4 || annBody.trim().length < 10) return;
    await firebaseService.publishCourseAnnouncement({
      courseId,
      title: annTitle.trim(),
      message: annBody.trim(),
      priority: annPriority,
      authorUid: user.uid,
      authorName: user.fullName,
    });
    setAnnTitle('');
    setAnnBody('');
    notify('Course announcement posted to enrolled learners.');
  };

  return (
    <div className="bg-[#F8FAFC] min-h-screen py-10 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-[#005A9C]">
              BCA Instructor Teaching Workspace · {user.fullName}
            </div>
            <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-[#1B365D] mt-1">
              Instructor Studio &amp; Live Class Console
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {myCourses.length > 0 && (
              <select
                aria-label="Select active course"
                value={activeCourse?.id || ''}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold text-[#1B365D] min-h-[44px] bg-white"
              >
                {myCourses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title} ({c.status})
                  </option>
                ))}
              </select>
            )}
            <button
              type="button"
              onClick={() => {
                setEditingCourse(null);
                setWizardOpen(true);
              }}
              className="px-4 py-2.5 bg-[#005A9C] hover:bg-[#004980] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 min-h-[44px]"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Course</span>
            </button>
          </div>
        </div>

        {feedback && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{feedback}</span>
          </div>
        )}
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-[#DC2626] text-xs font-bold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 border-b border-slate-200 overflow-x-auto pb-1">
          {[
            { id: 'courses' as const, label: `Assigned Courses (${myCourses.length})`, icon: BookOpen },
            { id: 'curriculum' as const, label: `Modules & Lessons (${lessons.length})`, icon: FolderPlus },
            { id: 'media' as const, label: `Media Uploads (${assets.length})`, icon: UploadCloud },
            { id: 'zoom' as const, label: `Live Zoom & Attendance (${sessions.length})`, icon: Video },
            { id: 'assessments' as const, label: `Assessments & Grading (${submissions.length})`, icon: ClipboardCheck },
            { id: 'announcements' as const, label: `Roster & Announcements (${enrollments.length})`, icon: Megaphone },
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

        {/* 1. Assigned Courses */}
        {activeTab === 'courses' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {myCourses.map((c) => (
              <div key={c.id} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3 text-xs">
                <div className="flex items-start justify-between gap-2 pb-2 border-b border-slate-100">
                  <div>
                    <span className="font-bold uppercase text-[#005A9C]">{c.category}</span>
                    <h3 className="font-heading text-base font-extrabold text-[#1B365D] mt-0.5">{c.title}</h3>
                  </div>
                  <span className="font-mono font-bold uppercase text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 text-[#1B365D]">
                    {c.status.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-slate-600 leading-relaxed">{c.description}</p>
                <div className="font-mono text-slate-500">
                  {c.learningFormat.replace('_', ' ')} · {c.enrolledCount}/{c.enrolmentCapacity} enrolled · {c.durationHours}h
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCourseId(c.id);
                      setEditingCourse(c);
                      setWizardOpen(true);
                    }}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-[#1B365D] font-bold rounded-xl flex items-center gap-1.5"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Course</span>
                  </button>
                  {c.status === 'draft' && (
                    <button
                      type="button"
                      onClick={() =>
                        firebaseService
                          .submitCourseForApproval(c.id, user.uid)
                          .then(() => notify(`Submitted "${c.title}" for Learning Manager review.`))
                      }
                      className="px-3.5 py-2 bg-[#005A9C] text-white font-bold rounded-xl"
                    >
                      Submit for Approval
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 2. Modules & Lessons Builder */}
        {activeTab === 'curriculum' && activeCourse && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs">
            <div className="lg:col-span-5 space-y-6">
              <form onSubmit={handleAddModule} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
                <h3 className="font-heading text-base font-bold text-[#1B365D]">Add Course Module</h3>
                <input
                  type="text"
                  value={modTitle}
                  onChange={(e) => setModTitle(e.target.value)}
                  placeholder="Module title (e.g. Module 3: Solar Maintenance)"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 min-h-[42px]"
                  required
                />
                <textarea
                  rows={2}
                  value={modDesc}
                  onChange={(e) => setModDesc(e.target.value)}
                  placeholder="Module description..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  required
                />
                <button type="submit" className="w-full py-2.5 bg-[#1B365D] text-white font-bold rounded-xl min-h-[42px]">
                  Create Module
                </button>
              </form>

              <form onSubmit={handleAddLesson} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
                <h3 className="font-heading text-base font-bold text-[#1B365D]">Add Lesson to Module</h3>
                <select
                  value={lesModuleId || modules[0]?.id || ''}
                  onChange={(e) => setLesModuleId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 min-h-[42px] bg-white"
                >
                  {modules.map((m) => (
                    <option key={m.id} value={m.id}>{m.title}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={lesTitle}
                  onChange={(e) => setLesTitle(e.target.value)}
                  placeholder="Lesson title"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 min-h-[42px]"
                  required
                />
                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={lesType}
                    onChange={(e) => setLesType(e.target.value as LessonType)}
                    className="px-3 py-2 rounded-xl border border-slate-300 min-h-[42px] bg-white"
                  >
                    <option value="video">Video Lesson</option>
                    <option value="practical_demo">Practical Demo</option>
                    <option value="pdf">PDF Document</option>
                    <option value="presentation">PowerPoint Slides</option>
                    <option value="audio">Audio Lesson</option>
                    <option value="text">Text / Low-Bandwidth</option>
                    <option value="study_notes">Study Notes</option>
                    <option value="external_resource">External Resource</option>
                  </select>
                  <input
                    type="number"
                    min={1}
                    max={360}
                    value={lesDuration}
                    onChange={(e) => setLesDuration(Number(e.target.value))}
                    className="px-3 py-2 rounded-xl border border-slate-300 min-h-[42px]"
                  />
                </div>
                <select
                  value={lesPrimaryAssetId}
                  onChange={(e) => setLesPrimaryAssetId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 min-h-[42px] bg-white"
                >
                  <option value="">Optional Primary Uploaded Media Asset...</option>
                  {assets.map((a) => (
                    <option key={a.id} value={a.id}>{a.fileName} ({a.assetKind})</option>
                  ))}
                </select>
                <select
                  value={lesNotesAssetId}
                  onChange={(e) => setLesNotesAssetId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 min-h-[42px] bg-white"
                >
                  <option value="">Optional Downloadable Study Notes Asset...</option>
                  {assets.map((a) => (
                    <option key={a.id} value={a.id}>{a.fileName}</option>
                  ))}
                </select>
                <textarea
                  rows={3}
                  value={lesText}
                  onChange={(e) => setLesText(e.target.value)}
                  placeholder="Written lesson content (supports low-bandwidth rural learners)..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
                <textarea
                  rows={2}
                  value={lesTranscript}
                  onChange={(e) => setLesTranscript(e.target.value)}
                  placeholder="Accessible transcript (optional)..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
                <button type="submit" className="w-full py-2.5 bg-[#005A9C] text-white font-bold rounded-xl min-h-[42px]">
                  Publish Lesson
                </button>
              </form>
            </div>

            <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
              <h3 className="font-heading text-base font-bold text-[#1B365D]">
                Curriculum Structure ({modules.length} modules · {lessons.length} lessons)
              </h3>
              {modules.map((m) => (
                <div key={m.id} className="p-4 rounded-xl border border-slate-200 space-y-2">
                  <div className="font-bold text-[#1B365D] text-sm">{m.title}</div>
                  <p className="text-slate-600">{m.description}</p>
                  <div className="space-y-1.5 pt-2">
                    {lessons
                      .filter((l) => l.moduleId === m.id)
                      .map((l) => (
                        <div key={l.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex justify-between">
                          <span className="font-semibold text-[#1B365D]">{l.title}</span>
                          <span className="font-mono text-slate-500">{l.lessonType} · {l.durationMinutes}m</span>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. Media Upload Library */}
        {activeTab === 'media' && activeCourse && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <CourseMediaUploader
              courseId={activeCourse.id}
              modules={modules}
              lessons={lessons}
              assets={assets}
              uploaderUid={user.uid}
              uploaderName={user.fullName}
              onAssetSaved={(a) => notify(`Uploaded "${a.fileName}" cleanly.`)}
            />
          </div>
        )}

        {/* 4. Live Zoom Scheduling & Attendance */}
        {activeTab === 'zoom' && activeCourse && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs">
            <form onSubmit={handleScheduleSession} className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 space-y-3.5">
              <h3 className="font-heading text-base font-bold text-[#1B365D]">
                Schedule Live Zoom Class (Africa/Kampala)
              </h3>
              {!zoomConfig.secretsConfigured && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 leading-relaxed">
                  <strong>Zoom OAuth Not Configured Yet:</strong> Cloud Functions Secret Manager does not have <code className="font-mono">ZOOM_ACCOUNT_ID</code>/<code className="font-mono">ZOOM_CLIENT_ID</code>/<code className="font-mono">ZOOM_CLIENT_SECRET</code>. Supply a verified manual Zoom meeting link fallback below until the Learning Manager configures Zoom OAuth secrets.
                </div>
              )}
              <input
                type="text"
                value={sessTitle}
                onChange={(e) => setSessTitle(e.target.value)}
                placeholder="Live session topic..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 min-h-[42px]"
                required
              />
              <textarea
                rows={2}
                value={sessDesc}
                onChange={(e) => setSessDesc(e.target.value)}
                placeholder="Session agenda and safeguarding guidelines..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300"
                required
              />
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Date</label>
                  <input
                    type="date"
                    value={sessDate}
                    onChange={(e) => setSessDate(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-300 min-h-[42px]"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Kampala Time</label>
                  <input
                    type="time"
                    value={sessTime}
                    onChange={(e) => setSessTime(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-300 min-h-[42px]"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Mins</label>
                  <input
                    type="number"
                    min={15}
                    max={300}
                    value={sessDuration}
                    onChange={(e) => setSessDuration(Number(e.target.value))}
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-300 min-h-[42px]"
                    required
                  />
                </div>
              </div>
              <input
                type="url"
                value={manualJoinUrl}
                onChange={(e) => setManualJoinUrl(e.target.value)}
                placeholder="Manual Zoom Meeting URL fallback (required until Zoom API configured)"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 min-h-[42px]"
              />
              <input
                type="text"
                value={manualPasscode}
                onChange={(e) => setManualPasscode(e.target.value)}
                placeholder="Optional Zoom Passcode"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 min-h-[42px]"
              />
              <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                <input
                  type="checkbox"
                  checked={sessRecurring}
                  onChange={(e) => setSessRecurring(e.target.checked)}
                />
                <span>Recurring weekly cohort session</span>
              </label>
              <button type="submit" className="w-full py-2.5 bg-[#005A9C] text-white font-bold rounded-xl min-h-[44px]">
                Schedule Live Session
              </button>
            </form>

            <div className="lg:col-span-7 space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
                <h3 className="font-heading text-base font-bold text-[#1B365D]">
                  Scheduled Live Sessions &amp; Attendance Register
                </h3>
                {sessions.length === 0 ? (
                  <p className="text-slate-500">No live classes scheduled yet.</p>
                ) : (
                  sessions.map((s) => (
                    <div key={s.id} className="p-4 rounded-xl border border-slate-200 space-y-3">
                      <div className="flex flex-wrap justify-between gap-2">
                        <div>
                          <div className="font-bold text-[#1B365D] text-sm">{s.title}</div>
                          <div className="font-mono text-[#005A9C] flex items-center gap-1.5 mt-0.5">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{s.scheduledDate} · {s.startTimeKampala} EAT · {s.status.toUpperCase()}</span>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              firebaseService
                                .dispatchLiveClassReminders(s.id, '1h')
                                .then((cnt) => notify(`Dispatched live class reminders to ${cnt} enrolled learners.`))
                            }
                            className="px-2.5 py-1.5 bg-blue-50 text-[#005A9C] font-bold rounded-lg flex items-center gap-1"
                          >
                            <BellRing className="w-3.5 h-3.5" />
                            <span>Send 1h Reminder</span>
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              firebaseService
                                .syncLiveSessionStatus(s.id)
                                .then((r) => notify(`Session status synced: ${r.status}`))
                            }
                            className="px-2.5 py-1.5 bg-slate-100 text-slate-700 font-bold rounded-lg flex items-center gap-1"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>Sync</span>
                          </button>
                          {s.status !== 'cancelled' && (
                            <button
                              type="button"
                              onClick={() =>
                                firebaseService
                                  .cancelLiveSession(s.id)
                                  .then(() => notify('Live session cancelled.'))
                              }
                              className="px-2.5 py-1.5 bg-red-50 text-[#DC2626] font-bold rounded-lg"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Attendance Roster */}
                      {enrollments.length > 0 && (
                        <div className="pt-2 border-t border-slate-100 space-y-1.5">
                          <div className="font-semibold text-slate-500">Attendance Register</div>
                          {enrollments.map((enr) => {
                            const att = firebaseService
                              .getSessionAttendance(s.id)
                              .find((a) => a.userId === enr.userId);
                            return (
                              <div key={enr.id} className="flex items-center justify-between bg-slate-50 px-3 py-1.5 rounded-lg">
                                <span className="font-semibold text-[#1B365D]">{enr.learnerName}</span>
                                <div className="flex items-center gap-1">
                                  {(['present', 'absent', 'excused'] as SessionAttendance['status'][]).map((st) => (
                                    <button
                                      key={st}
                                      type="button"
                                      onClick={() =>
                                        firebaseService.recordSessionAttendance({
                                          sessionId: s.id,
                                          courseId: activeCourse.id,
                                          userId: enr.userId,
                                          learnerName: enr.learnerName,
                                          status: st,
                                          markedBy: user.uid,
                                          markedByName: user.fullName,
                                        })
                                      }
                                      className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                                        att?.status === st
                                          ? 'bg-[#005A9C] text-white'
                                          : 'bg-white border border-slate-200 text-slate-600'
                                      }`}
                                    >
                                      {st}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* 5. Assessments & Assignment Grading */}
        {activeTab === 'assessments' && activeCourse && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs">
            <div className="lg:col-span-5 space-y-6">
              <form onSubmit={handleCreateAssessment} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
                <h3 className="font-heading text-base font-bold text-[#1B365D]">Create Quiz or Assignment</h3>
                <input
                  type="text"
                  value={assmTitle}
                  onChange={(e) => setAssmTitle(e.target.value)}
                  placeholder="Assessment title..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 min-h-[42px]"
                  required
                />
                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={assmType}
                    onChange={(e) => setAssmType(e.target.value as AssessmentType)}
                    className="px-3 py-2 rounded-xl border border-slate-300 min-h-[42px] bg-white"
                  >
                    <option value="quiz">Module Quiz</option>
                    <option value="pre_course">Pre-Course Check</option>
                    <option value="post_course">Final Post-Course Exam</option>
                    <option value="written_assignment">Written Assignment</option>
                    <option value="file_assignment">File Upload Project</option>
                  </select>
                  <input
                    type="number"
                    min={10}
                    max={100}
                    value={assmPassMark}
                    onChange={(e) => setAssmPassMark(Number(e.target.value))}
                    className="px-3 py-2 rounded-xl border border-slate-300 min-h-[42px]"
                  />
                </div>
                <textarea
                  rows={2}
                  value={assmInstructions}
                  onChange={(e) => setAssmInstructions(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
                <button type="submit" className="w-full py-2.5 bg-[#1B365D] text-white font-bold rounded-xl">
                  Create Assessment
                </button>
              </form>

              <form onSubmit={handleAddQuestion} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
                <h3 className="font-heading text-base font-bold text-[#1B365D]">Add Question &amp; Answer Key</h3>
                <select
                  value={qAssmId || assessments[0]?.id || ''}
                  onChange={(e) => setQAssmId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 min-h-[42px] bg-white"
                >
                  {assessments.map((a) => (
                    <option key={a.id} value={a.id}>{a.title}</option>
                  ))}
                </select>
                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={qType}
                    onChange={(e) => setQType(e.target.value as any)}
                    className="px-3 py-2 rounded-xl border border-slate-300 min-h-[42px] bg-white"
                  >
                    <option value="mcq">Multiple Choice</option>
                    <option value="true_false">True / False</option>
                    <option value="short_answer">Short Answer (Keywords)</option>
                    <option value="written">Written (Manual Grade)</option>
                  </select>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={qPoints}
                    onChange={(e) => setQPoints(Number(e.target.value))}
                    className="px-3 py-2 rounded-xl border border-slate-300 min-h-[42px]"
                  />
                </div>
                <textarea
                  rows={2}
                  value={qPrompt}
                  onChange={(e) => setQPrompt(e.target.value)}
                  placeholder="Question prompt..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  required
                />
                {qType === 'mcq' && (
                  <>
                    <input
                      type="text"
                      value={qOptionsText}
                      onChange={(e) => setQOptionsText(e.target.value)}
                      placeholder="Comma-separated options"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300"
                    />
                    <input
                      type="number"
                      min={0}
                      max={5}
                      value={qCorrectIdx}
                      onChange={(e) => setQCorrectIdx(Number(e.target.value))}
                      placeholder="Correct option index (0-based)"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300"
                    />
                  </>
                )}
                {qType === 'true_false' && (
                  <select
                    value={String(qCorrectBool)}
                    onChange={(e) => setQCorrectBool(e.target.value === 'true')}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="true">Correct Answer: True</option>
                    <option value="false">Correct Answer: False</option>
                  </select>
                )}
                {qType === 'short_answer' && (
                  <input
                    type="text"
                    value={qKeywords}
                    onChange={(e) => setQKeywords(e.target.value)}
                    placeholder="Accepted keywords (comma-separated)"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                )}
                <button type="submit" className="w-full py-2.5 bg-[#005A9C] text-white font-bold rounded-xl">
                  Save Question &amp; Confidential Key
                </button>
              </form>
            </div>

            <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
              <h3 className="font-heading text-base font-bold text-[#1B365D]">
                Submitted Learner Assignments ({submissions.length})
              </h3>
              {submissions.length === 0 ? (
                <p className="text-slate-500">No learner assignment submissions pending review.</p>
              ) : (
                submissions.map((sub) => {
                  const val = gradeInputs[sub.id] || {
                    score: sub.scorePercent ?? 80,
                    feedback: sub.instructorFeedback || 'Well structured practical submission.',
                  };
                  return (
                    <div key={sub.id} className="p-4 rounded-xl border border-slate-200 space-y-3">
                      <div className="flex justify-between font-bold text-[#1B365D]">
                        <span>{sub.learnerName}</span>
                        <span className="uppercase text-[#005A9C]">{sub.status.replace('_', ' ')}</span>
                      </div>
                      <p className="text-slate-700 bg-slate-50 p-3 rounded-lg">{sub.submissionText}</p>
                      {sub.fileName && (
                        <div className="font-mono text-[11px] text-slate-500">Attachment: {sub.fileName}</div>
                      )}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={val.score}
                          onChange={(e) =>
                            setGradeInputs({
                              ...gradeInputs,
                              [sub.id]: { ...val, score: Number(e.target.value) },
                            })
                          }
                          className="px-3 py-2 rounded-xl border border-slate-300"
                        />
                        <input
                          type="text"
                          value={val.feedback}
                          onChange={(e) =>
                            setGradeInputs({
                              ...gradeInputs,
                              [sub.id]: { ...val, feedback: e.target.value },
                            })
                          }
                          placeholder="Feedback note..."
                          className="sm:col-span-2 px-3 py-2 rounded-xl border border-slate-300"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            firebaseService
                              .gradeAssignmentSubmission(sub.id, val.score, val.feedback, user.fullName, false)
                              .then(() => notify(`Graded assignment for ${sub.learnerName}.`))
                          }
                          className="px-3.5 py-2 bg-emerald-600 text-white font-bold rounded-lg"
                        >
                          Save Grade
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            firebaseService
                              .gradeAssignmentSubmission(sub.id, val.score, val.feedback, user.fullName, true)
                              .then(() => notify(`Requested resubmission from ${sub.learnerName}.`))
                          }
                          className="px-3.5 py-2 bg-amber-100 text-amber-900 font-bold rounded-lg"
                        >
                          Request Resubmit
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* 6. Course Roster & Announcements */}
        {activeTab === 'announcements' && activeCourse && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs">
            <form onSubmit={handlePublishAnnouncement} className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
              <h3 className="font-heading text-base font-bold text-[#1B365D]">Post Course Announcement</h3>
              <input
                type="text"
                value={annTitle}
                onChange={(e) => setAnnTitle(e.target.value)}
                placeholder="Announcement headline..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 min-h-[42px]"
                required
              />
              <select
                value={annPriority}
                onChange={(e) => setAnnPriority(e.target.value as 'normal' | 'urgent')}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 min-h-[42px] bg-white"
              >
                <option value="normal">Normal Update</option>
                <option value="urgent">Urgent Schedule Notice</option>
              </select>
              <textarea
                rows={4}
                value={annBody}
                onChange={(e) => setAnnBody(e.target.value)}
                placeholder="Write instructions for learners..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300"
                required
              />
              <button type="submit" className="w-full py-2.5 bg-[#005A9C] text-white font-bold rounded-xl">
                Publish Announcement
              </button>
            </form>

            <div className="lg:col-span-7 space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
                <h3 className="font-heading text-base font-bold text-[#1B365D] flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#005A9C]" />
                  <span>Enrolled Course Learners ({enrollments.length})</span>
                </h3>
                {enrollments.map((enr) => (
                  <div key={enr.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center">
                    <div>
                      <strong className="text-[#1B365D]">{enr.learnerName}</strong>
                      <div className="text-[11px] text-slate-500">
                        {enr.learnerDistrict} · {enr.isMinor ? 'Minor (Consent Verified)' : 'Young Adult'}
                      </div>
                    </div>
                    <span className="font-mono font-bold text-[#005A9C] tabular-nums">
                      {enr.progressPercent}% ({enr.status})
                    </span>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-2.5">
                <h3 className="font-heading text-base font-bold text-[#1B365D]">
                  Recent Course Announcements ({announcements.length})
                </h3>
                {announcements.map((a) => (
                  <div key={a.id} className="p-3 rounded-xl border border-slate-200">
                    <div className="font-bold text-[#1B365D]">{a.title}</div>
                    <p className="text-slate-600 mt-1">{a.message}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <CourseWizardModal
          isOpen={wizardOpen}
          existingCourse={editingCourse}
          actorUid={user.uid}
          onClose={() => setWizardOpen(false)}
          onSaved={(saved) => {
            setSelectedCourseId(saved.id);
            notify(`Saved course "${saved.title}".`);
          }}
        />
      </div>
    </div>
  );
};
