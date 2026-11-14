import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useLmsData } from '../../hooks/usePlatformData';
import { firebaseService } from '../../lib/firebase/firebase';
import { AuthorizedMeetingAccess, Course, CourseCertificate } from '../../types';
import { DigitalCertificateCard } from '../../components/lms/DigitalCertificateCard';
import {
  Award,
  Bell,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  GraduationCap,
  Lock,
  Play,
  Search,
  ShieldCheck,
  Video,
  X,
} from 'lucide-react';

export const LmsLearningDashboardPage: React.FC = () => {
  const { user, role, isUnder18Pending } = useAuth();
  const navigate = useNavigate();
  useLmsData(user?.uid, role, user?.instructorAuthorized);

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [formatFilter, setFormatFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState('all');
  const [previewCourse, setPreviewCourse] = useState<Course | null>(null);
  const [activeCertificate, setActiveCertificate] = useState<CourseCertificate | null>(null);
  const [meetingAccess, setMeetingAccess] = useState<AuthorizedMeetingAccess | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const publishedCourses = firebaseService.getCourses(false);
  const categories = firebaseService.getCourseCategories();
  const myEnrollments = user ? firebaseService.getEnrollments({ userId: user.uid }) : [];
  const allSessions = firebaseService.getCourseSessions();
  const myCertificates = user ? firebaseService.getCertificates(user.uid) : [];
  const myNotifications = user ? firebaseService.getLearningNotifications(user.uid) : [];

  const activeEnrolledIds = new Set(
    myEnrollments
      .filter((e) => ['enrolled', 'approved', 'completed'].includes(e.status))
      .map((e) => e.courseId)
  );
  const upcomingSessions = allSessions.filter(
    (s) => s.status !== 'cancelled' && (activeEnrolledIds.has(s.courseId) || role === 'instructor' || role === 'learning_manager' || role === 'admin')
  );

  const filteredCourses = useMemo(() => {
    return publishedCourses.filter((c) => {
      if (categoryFilter !== 'All' && c.category !== categoryFilter) return false;
      if (formatFilter !== 'all' && c.learningFormat !== formatFilter) return false;
      if (levelFilter !== 'all' && c.level !== levelFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          c.title.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [publishedCourses, categoryFilter, formatFilter, levelFilter, searchQuery]);

  const handleEnrol = async (course: Course) => {
    setErrorMsg(null);
    setFeedbackMsg(null);
    if (!user) {
      navigate('/auth');
      return;
    }
    if (isUnder18Pending) {
      setErrorMsg(
        'Your guardian must verify consent in the Guardian Portal before you can enrol in BCA Online Skilling courses.'
      );
      return;
    }
    try {
      const res = await firebaseService.enrollInCourse(course.id, user.uid);
      setPreviewCourse(null);
      if (res.status === 'enrolled') {
        setFeedbackMsg(`Enrolled in "${course.title}". You can begin Lesson 1 immediately.`);
      } else {
        setFeedbackMsg(`Enrolment request submitted for "${course.title}" and is awaiting Learning Manager review.`);
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to complete course enrolment.');
    }
  };

  const handleJoinSession = async (sessionId: string) => {
    if (!user) return;
    setErrorMsg(null);
    try {
      const access = await firebaseService.getAuthorizedMeetingAccess(sessionId, user.uid);
      setMeetingAccess(access);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to resolve authorized Zoom class link.');
    }
  };

  const formatEligibility = (elig: Course['ageEligibility']) => {
    if (elig === 'children_5_17') return 'Ages 5–17 (Guardian Consent)';
    if (elig === 'young_adults_18_35') return 'Young Adults 18–35';
    if (elig === 'adults_18_plus') return 'Ages 18+';
    return 'All Members 5–35';
  };

  const canTeach =
    role === 'instructor' ||
    role === 'learning_manager' ||
    role === 'admin' ||
    (role === 'mentor' && user?.instructorAuthorized === true);

  return (
    <div className="bg-[#F8FAFC] min-h-screen py-10 sm:py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-10">
        {/* Header */}
        <div className="bg-[#1B365D] text-white rounded-2xl p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="text-xs font-bold uppercase tracking-wider text-[#60C1E5] flex items-center gap-2">
              <GraduationCap className="w-4 h-4" />
              <span>BCA Uganda Online Skilling &amp; Digital LMS</span>
              <span aria-hidden="true">·</span>
              <span>Standing Up As A Man</span>
            </div>
            <h1 className="font-heading text-2xl sm:text-4xl font-extrabold tracking-tight">
              {user ? `Welcome back, ${user.fullName.split(' ')[0]}` : 'National Online Skilling Academy'}
            </h1>
            <p className="text-sm text-slate-200 leading-relaxed">
              Interactive vocational workshops, life-skills video modules, low-bandwidth study guides, live Africa/Kampala Zoom classes, and verifiable digital certificates.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {canTeach && (
              <Link
                to="/instructor"
                className="px-4 py-2.5 bg-[#60C1E5] hover:bg-sky-300 text-[#1B365D] text-xs font-extrabold rounded-xl min-h-[44px] flex items-center"
              >
                Open Instructor Studio &rarr;
              </Link>
            )}
            {(role === 'learning_manager' || role === 'admin') && (
              <Link
                to="/learning-manager"
                className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold rounded-xl min-h-[44px] flex items-center"
              >
                Learning Dept Console
              </Link>
            )}
            <Link
              to="/verify-certificate"
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold rounded-xl min-h-[44px] flex items-center"
            >
              Verify Certificate QR
            </Link>
          </div>
        </div>

        {/* Minor Pending Consent Lock Banner */}
        {isUnder18Pending && (
          <div className="bg-amber-50 border border-amber-300 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
            <div className="flex items-start gap-3">
              <Lock className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <strong className="text-amber-950 block text-sm">
                  Guardian Consent Required Before Course Enrolment (Ages 5–17)
                </strong>
                <p className="text-amber-900 mt-0.5">
                  Under Uganda’s Children Act (Cap 59), minor members can browse the public course catalogue below, while enrolment, interactive assessments, and live Zoom classes unlock once your verified guardian submits consent.
                </p>
              </div>
            </div>
            <Link
              to="/hub"
              className="px-4 py-2 bg-amber-900 text-white font-bold rounded-xl shrink-0 text-center"
            >
              View Consent Code in Hub
            </Link>
          </div>
        )}

        {feedbackMsg && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{feedbackMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-[#DC2626] text-xs font-bold">
            {errorMsg}
          </div>
        )}

        {/* Signed-in Student Dashboard Workspace */}
        {user && (myEnrollments.length > 0 || upcomingSessions.length > 0 || myCertificates.length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 8 Cols: Enrolled Courses & Continue Learning */}
            <div className="lg:col-span-8 space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-heading text-lg font-bold text-[#1B365D] flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-[#005A9C]" />
                    <span>My Enrolled Courses ({myEnrollments.length})</span>
                  </h2>
                </div>

                {myEnrollments.length === 0 ? (
                  <p className="text-xs text-slate-500">
                    You have not enrolled in any online skilling course yet. Browse the catalogue below to start learning.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {myEnrollments.map((enr) => {
                      const canLaunch = ['enrolled', 'approved', 'completed'].includes(enr.status);
                      return (
                        <div
                          key={enr.id}
                          className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                        >
                          <div className="space-y-1.5 flex-1">
                            <div className="font-heading text-sm font-bold text-[#1B365D]">
                              {enr.courseTitle}
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono tabular-nums">
                              Status: <strong className="uppercase text-[#005A9C]">{enr.status}</strong> · {enr.completedLessonsCount}/{enr.totalLessonsCount || 0} lessons · {enr.learningMinutes} mins logged
                            </div>
                            <div className="w-full max-w-md h-2 bg-slate-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-[#005A9C] transition-all"
                                style={{ width: `${enr.progressPercent}%` }}
                              />
                            </div>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <span className="font-mono text-sm font-extrabold text-[#1B365D] tabular-nums">
                              {enr.progressPercent}%
                            </span>
                            {canLaunch && (
                              <Link
                                to={`/learn/course/${enr.courseId}`}
                                className="px-4 py-2 bg-[#005A9C] hover:bg-[#004980] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 min-h-[40px]"
                              >
                                <Play className="w-3.5 h-3.5" />
                                <span>{enr.progressPercent > 0 ? 'Resume' : 'Start Learning'}</span>
                              </Link>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Upcoming Live Zoom Classes (Africa/Kampala) */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="font-heading text-lg font-bold text-[#1B365D] flex items-center gap-2">
                    <Video className="w-5 h-5 text-[#005A9C]" />
                    <span>Upcoming Live Zoom Classes ({upcomingSessions.length})</span>
                  </h2>
                  <span className="text-[11px] font-mono text-slate-500">Timezone: Africa/Kampala (EAT)</span>
                </div>
                {upcomingSessions.length === 0 ? (
                  <p className="text-xs text-slate-500">No upcoming live sessions scheduled for your courses yet.</p>
                ) : (
                  <div className="space-y-3 text-xs">
                    {upcomingSessions.map((sess) => (
                      <div
                        key={sess.id}
                        className="p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="font-bold text-[#1B365D] text-sm">{sess.title}</div>
                          <div className="text-slate-600">
                            {sess.courseTitle} · Instructor: {sess.instructorName}
                          </div>
                          <div className="font-mono text-[11px] text-[#005A9C] flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>
                              {sess.scheduledDate} at {sess.startTimeKampala} EAT ({sess.durationMinutes} min)
                            </span>
                          </div>
                          <div className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Safeguarding: Waiting Room ON · Default Recording OFF</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleJoinSession(sess.id)}
                          className="px-4 py-2.5 bg-[#1B365D] hover:bg-[#005A9C] text-white font-bold rounded-xl min-h-[42px] shrink-0"
                        >
                          Access Join Link
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right 4 Cols: Certificates & Notifications */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
                <h2 className="font-heading text-base font-bold text-[#1B365D] flex items-center gap-2">
                  <Award className="w-5 h-5 text-[#005A9C]" />
                  <span>My Skilling Certificates ({myCertificates.length})</span>
                </h2>
                {myCertificates.length === 0 ? (
                  <p className="text-xs text-slate-500">
                    Complete all required lessons and pass course assessments to earn your QR-verified BCA Uganda certificate.
                  </p>
                ) : (
                  <div className="space-y-2.5 text-xs">
                    {myCertificates.map((cert) => (
                      <div key={cert.id} className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 space-y-2">
                        <div className="font-bold text-[#1B365D]">{cert.courseTitle}</div>
                        <div className="font-mono text-[11px] text-[#005A9C]">
                          {cert.certificateNumber} · {cert.status.toUpperCase()}
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveCertificate(cert)}
                          className="w-full py-2 bg-[#005A9C] hover:bg-[#004980] text-white font-bold rounded-lg text-xs"
                        >
                          Open &amp; Print Certificate
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
                <h2 className="font-heading text-base font-bold text-[#1B365D] flex items-center gap-2">
                  <Bell className="w-5 h-5 text-[#005A9C]" />
                  <span>Learning Notifications ({myNotifications.filter((n) => !n.read).length} unread)</span>
                </h2>
                {myNotifications.length === 0 ? (
                  <p className="text-xs text-slate-500">No new learning alerts.</p>
                ) : (
                  <div className="space-y-2 max-h-72 overflow-y-auto text-xs">
                    {myNotifications.map((n) => (
                      <div
                        key={n.id}
                        className={`p-3 rounded-xl border ${
                          n.read ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-blue-50 border-blue-200 text-[#1B365D]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <strong className="block">{n.title}</strong>
                          {!n.read && (
                            <button
                              type="button"
                              onClick={() => firebaseService.markLearningNotificationRead(n.id)}
                              className="text-[10px] font-bold text-[#005A9C] hover:underline shrink-0"
                            >
                              Mark read
                            </button>
                          )}
                        </div>
                        <p className="mt-1 leading-snug">{n.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Course Catalogue Section */}
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h2 className="font-heading text-2xl font-extrabold text-[#1B365D]">
                Online Skilling Course Catalogue
              </h2>
              <p className="text-xs text-slate-600 mt-1">
                Explore Ugandan vocational trades, digital safety, financial stewardship, and mentorship courses.
              </p>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search courses..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 min-h-[42px]"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-300 min-h-[42px] bg-white"
            >
              <option value="All">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <select
              value={formatFilter}
              onChange={(e) => setFormatFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-300 min-h-[42px] bg-white"
            >
              <option value="all">All Learning Formats</option>
              <option value="self_paced">Self-Paced</option>
              <option value="instructor_led">Instructor-Led (Zoom)</option>
              <option value="blended">Blended Learning</option>
            </select>
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-300 min-h-[42px] bg-white"
            >
              <option value="all">All Skill Levels</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => {
              const myEnr = myEnrollments.find((e) => e.courseId === course.id);
              return (
                <div
                  key={course.id}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <img
                      src={course.thumbnailUrl || '/images/programme_skills_1794461658653.jpg'}
                      alt={course.title}
                      className="w-full h-44 object-cover border-b border-slate-100"
                    />
                    <div className="p-5 space-y-2.5">
                      <div className="text-[11px] font-bold text-[#005A9C] uppercase tracking-wider">
                        {course.category} · {course.learningFormat.replace('_', ' ')}
                      </div>
                      <h3 className="font-heading text-base font-extrabold text-[#1B365D] leading-snug">
                        {course.title}
                      </h3>
                      <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                        {course.description}
                      </p>
                      <div className="pt-1 text-[11px] text-slate-500 font-mono tabular-nums space-y-0.5">
                        <div>
                          Level: {course.level} · <Clock className="inline w-3 h-3" /> {course.durationHours}h · Seats {course.enrolledCount}/{course.enrolmentCapacity}
                        </div>
                        <div>Eligibility: {formatEligibility(course.ageEligibility)}</div>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 pt-0 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPreviewCourse(course)}
                      className="flex-1 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-[#1B365D] text-xs font-bold rounded-xl min-h-[42px]"
                    >
                      Syllabus &amp; Details
                    </button>
                    {myEnr && ['enrolled', 'approved', 'completed'].includes(myEnr.status) ? (
                      <Link
                        to={`/learn/course/${course.id}`}
                        className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl min-h-[42px] flex items-center justify-center"
                      >
                        Open Course
                      </Link>
                    ) : myEnr?.status === 'pending' ? (
                      <span className="flex-1 py-2.5 px-3 bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold rounded-xl text-center">
                        Pending Approval
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleEnrol(course)}
                        className="flex-1 py-2.5 px-3 bg-[#005A9C] hover:bg-[#004980] text-white text-xs font-bold rounded-xl min-h-[42px]"
                      >
                        {course.learningFormat === 'self_paced' ? 'Enrol Now' : 'Apply to Enrol'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Course Syllabus & Prerequisites Modal */}
        {previewCourse && (
          <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
            <div className="w-full max-w-2xl bg-white rounded-2xl p-6 shadow-2xl space-y-4 my-6">
              <div className="flex items-start justify-between gap-4 pb-3 border-b border-slate-100">
                <div>
                  <span className="text-[11px] font-bold uppercase text-[#005A9C]">
                    {previewCourse.category} · {previewCourse.learningFormat.replace('_', ' ')}
                  </span>
                  <h3 className="font-heading text-xl font-extrabold text-[#1B365D]">
                    {previewCourse.title}
                  </h3>
                </div>
                <button type="button" onClick={() => setPreviewCourse(null)} className="p-1 text-slate-500">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 text-xs max-h-[65vh] overflow-y-auto pr-1">
                <p className="text-slate-700 text-sm leading-relaxed">{previewCourse.description}</p>
                <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div>
                    <span className="text-slate-400 uppercase font-bold text-[10px] block">Lead Instructors</span>
                    <strong className="text-[#1B365D]">{previewCourse.instructorNames.join(', ')}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase font-bold text-[10px] block">Schedule Window</span>
                    <strong className="font-mono text-[#1B365D]">{previewCourse.startDate} to {previewCourse.endDate}</strong>
                  </div>
                </div>

                <div>
                  <strong className="text-[#1B365D] block mb-1">Learning Objectives</strong>
                  <ul className="list-disc pl-5 space-y-1 text-slate-700">
                    {previewCourse.learningObjectives.map((obj, idx) => (
                      <li key={idx}>{obj}</li>
                    ))}
                  </ul>
                </div>

                {previewCourse.prerequisites.length > 0 && (
                  <div>
                    <strong className="text-[#1B365D] block mb-1">Prerequisites</strong>
                    <ul className="list-disc pl-5 space-y-1 text-slate-600">
                      {previewCourse.prerequisites.map((p, idx) => (
                        <li key={idx}>{p}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div>
                  <strong className="text-[#1B365D] block mb-1.5">Course Syllabus Modules</strong>
                  <div className="space-y-2">
                    {firebaseService.getCourseModules(previewCourse.id).map((m) => (
                      <div key={m.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50">
                        <div className="font-bold text-[#1B365D]">{m.title}</div>
                        <p className="text-slate-600 mt-0.5">{m.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewCourse(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => handleEnrol(previewCourse)}
                  className="px-5 py-2.5 bg-[#005A9C] hover:bg-[#004980] text-white text-xs font-bold rounded-xl min-h-[42px]"
                >
                  {previewCourse.learningFormat === 'self_paced' ? 'Enrol in Course' : 'Submit Enrolment Application'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Authorized Zoom Meeting Join Modal */}
        {meetingAccess && (
          <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl space-y-4 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <strong className="font-heading text-base text-[#1B365D]">Live Class Meeting Access</strong>
                <button type="button" onClick={() => setMeetingAccess(null)} className="text-slate-500">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-2">
                <div className="font-bold text-[#1B365D] text-sm">{meetingAccess.topic}</div>
                <div className="font-mono text-slate-600">
                  Meeting ID: {meetingAccess.zoomMeetingId}
                  {meetingAccess.passcode ? ` · Passcode: ${meetingAccess.passcode}` : ''}
                </div>
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900">
                  {meetingAccess.safeguardingNotice}
                </div>
              </div>
              <div className="flex flex-col gap-2 pt-2">
                <a
                  href={meetingAccess.joinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 bg-[#005A9C] hover:bg-[#004980] text-white font-bold rounded-xl flex items-center justify-center gap-2 min-h-[44px]"
                >
                  <span>Join Zoom Class Now</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
                {meetingAccess.startUrl && (
                  <a
                    href={meetingAccess.startUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 bg-[#1B365D] text-white font-bold rounded-xl flex items-center justify-center gap-2 min-h-[42px]"
                  >
                    <span>Start Class as Host</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Digital Certificate Preview Modal */}
        {activeCertificate && (
          <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 overflow-y-auto">
            <div className="w-full max-w-3xl my-6">
              <DigitalCertificateCard
                certificate={activeCertificate}
                onClose={() => setActiveCertificate(null)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
