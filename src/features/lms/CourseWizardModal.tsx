import React, { useEffect, useState } from 'react';
import {
  Course,
  CourseAgeEligibility,
  CourseFormat,
  CourseLevel,
} from '../../types';
import { firebaseService } from '../../lib/firebase/firebase';
import { lmsCourseSchema } from '../../lib/validation/schemas';
import { CheckCircle2, Clock, Plus, Save, Trash2, X } from 'lucide-react';

interface CourseWizardModalProps {
  isOpen: boolean;
  existingCourse?: Course | null;
  actorUid: string;
  onClose: () => void;
  onSaved?: (course: Course) => void;
}

const THUMBNAIL_PRESETS = [
  { label: 'Solar & Clean Energy Workshop', url: '/images/programme_skills_1794461658653.jpg' },
  { label: 'Mentorship & Leadership Circle', url: '/images/programme_mentorship_1794461658375.jpg' },
  { label: 'Boys Digital & Peer Circle', url: '/images/hero_boys_circle_1794461657319.jpg' },
  { label: 'Wellbeing & Life Skills', url: '/images/programme_wellbeing_1794461659186.jpg' },
];

export const CourseWizardModal: React.FC<CourseWizardModalProps> = ({
  isOpen,
  existingCourse,
  actorUid,
  onClose,
  onSaved,
}) => {
  const categories = firebaseService.getCourseCategories();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [courseId, setCourseId] = useState<string | undefined>(existingCourse?.id);

  const [title, setTitle] = useState(existingCourse?.title || '');
  const [category, setCategory] = useState(existingCourse?.category || categories[0] || 'Solar & Clean Energy');
  const [description, setDescription] = useState(existingCourse?.description || '');
  const [thumbnailUrl, setThumbnailUrl] = useState(
    existingCourse?.thumbnailUrl || '/images/programme_skills_1794461658653.jpg'
  );
  const [targetAudience, setTargetAudience] = useState(
    existingCourse?.targetAudience || 'Boys aged 10–17 (with guardian consent) and young adults 18–35'
  );
  const [ageEligibility, setAgeEligibility] = useState<CourseAgeEligibility>(
    existingCourse?.ageEligibility || 'all_5_35'
  );
  const [level, setLevel] = useState<CourseLevel>(existingCourse?.level || 'beginner');
  const [durationHours, setDurationHours] = useState<number>(existingCourse?.durationHours || 8);
  const [learningFormat, setLearningFormat] = useState<CourseFormat>(
    existingCourse?.learningFormat || 'blended'
  );
  const [startDate, setStartDate] = useState(existingCourse?.startDate || '2026-12-01');
  const [endDate, setEndDate] = useState(existingCourse?.endDate || '2027-03-31');
  const [enrolmentCapacity, setEnrolmentCapacity] = useState<number>(
    existingCourse?.enrolmentCapacity || 50
  );
  const [learningObjectives, setLearningObjectives] = useState<string[]>(
    existingCourse?.learningObjectives?.length
      ? existingCourse.learningObjectives
      : ['Apply core practical concepts with safeguarding discipline']
  );
  const [newObjective, setNewObjective] = useState('');
  const [prerequisites, setPrerequisites] = useState<string[]>(existingCourse?.prerequisites || []);
  const [newPrereq, setNewPrereq] = useState('');

  const [autoSaveStatus, setAutoSaveStatus] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Debounced auto-save draft whenever valid title + description are edited
  useEffect(() => {
    if (!isOpen) return;
    if (title.trim().length < 5 || description.trim().length < 20) return;

    const timer = setTimeout(async () => {
      try {
        const saved = await firebaseService.saveCourseDraft(
          {
            id: courseId,
            title: title.trim(),
            category,
            description: description.trim(),
            thumbnailUrl,
            targetAudience: targetAudience.trim(),
            ageEligibility,
            level,
            durationHours: Number(durationHours),
            learningFormat,
            startDate,
            endDate,
            enrolmentCapacity: Number(enrolmentCapacity),
            learningObjectives: learningObjectives.filter((o) => o.trim().length >= 3),
            prerequisites: prerequisites.filter((p) => p.trim().length > 0),
          },
          actorUid
        );
        if (!courseId) setCourseId(saved.id);
        setAutoSaveStatus(`Draft auto-saved at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`);
      } catch {
        // Silent background draft save guard
      }
    }, 1100);

    return () => clearTimeout(timer);
  }, [
    isOpen,
    title,
    category,
    description,
    thumbnailUrl,
    targetAudience,
    ageEligibility,
    level,
    durationHours,
    learningFormat,
    startDate,
    endDate,
    enrolmentCapacity,
    learningObjectives,
    prerequisites,
  ]);

  if (!isOpen) return null;

  const handleAddObjective = () => {
    const clean = newObjective.trim();
    if (clean.length < 3) return;
    setLearningObjectives([...learningObjectives, clean]);
    setNewObjective('');
  };

  const handleAddPrereq = () => {
    const clean = newPrereq.trim();
    if (clean.length < 2) return;
    setPrerequisites([...prerequisites, clean]);
    setNewPrereq('');
  };

  const handleFinalSave = async (submitForApproval: boolean) => {
    setErrorMsg(null);
    const parsed = lmsCourseSchema.safeParse({
      title,
      description,
      category,
      targetAudience,
      ageEligibility,
      level,
      durationHours: Number(durationHours),
      learningFormat,
      startDate,
      endDate,
      enrolmentCapacity: Number(enrolmentCapacity),
      learningObjectives: learningObjectives.filter((o) => o.trim().length >= 3),
    });
    if (!parsed.success) {
      setErrorMsg(parsed.error.issues[0]?.message || 'Please review all required course fields.');
      return;
    }

    setIsSaving(true);
    try {
      const saved = await firebaseService.saveCourseDraft(
        {
          id: courseId,
          ...parsed.data,
          thumbnailUrl,
          prerequisites,
          status: submitForApproval ? 'pending_approval' : existingCourse?.status || 'draft',
        },
        actorUid
      );
      if (submitForApproval) {
        await firebaseService.submitCourseForApproval(saved.id, actorUid);
      }
      onSaved?.(saved);
      onClose();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to save course.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        <div className="bg-[#1B365D] text-white px-6 py-4 flex items-center justify-between gap-4">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#60C1E5]">
              BCA Online Skilling · Step {step} of 4
            </div>
            <h2 className="font-heading text-lg font-extrabold">
              {existingCourse ? `Edit Course: ${existingCourse.title}` : 'Create New Skilling Course'}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            {autoSaveStatus && (
              <span className="text-[11px] text-emerald-300 flex items-center gap-1 font-mono">
                <Clock className="w-3.5 h-3.5" />
                <span>{autoSaveStatus}</span>
              </span>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close course wizard"
              className="p-1.5 text-slate-300 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Stepper Tabs */}
        <div className="grid grid-cols-4 border-b border-slate-200 bg-slate-50 text-xs font-semibold">
          {[
            { num: 1 as const, label: '1. Basics' },
            { num: 2 as const, label: '2. Format & Eligibility' },
            { num: 3 as const, label: '3. Objectives' },
            { num: 4 as const, label: '4. Review & Submit' },
          ].map((s) => (
            <button
              key={s.num}
              type="button"
              onClick={() => setStep(s.num)}
              className={`py-3 px-2 text-center border-b-2 transition-colors ${
                step === s.num
                  ? 'border-[#005A9C] text-[#005A9C] bg-white font-bold'
                  : 'border-transparent text-slate-500 hover:text-[#1B365D]'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto text-xs">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-[#DC2626] font-semibold">
              {errorMsg}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Course Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Solar PV Installation & Off-Grid Repair"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm min-h-[44px]"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm min-h-[44px] bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Cover Thumbnail Preset</label>
                  <select
                    value={thumbnailUrl}
                    onChange={(e) => setThumbnailUrl(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm min-h-[44px] bg-white"
                  >
                    {THUMBNAIL_PRESETS.map((p) => (
                      <option key={p.url} value={p.url}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Course Description (min 20 characters)
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what boys and young men across Uganda will master in this programme..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Learning Format</label>
                  <select
                    value={learningFormat}
                    onChange={(e) => setLearningFormat(e.target.value as CourseFormat)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 min-h-[44px] bg-white"
                  >
                    <option value="self_paced">Self-Paced</option>
                    <option value="instructor_led">Instructor-Led (Zoom)</option>
                    <option value="blended">Blended Learning</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Course Level</label>
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value as CourseLevel)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 min-h-[44px] bg-white"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Age Eligibility</label>
                  <select
                    value={ageEligibility}
                    onChange={(e) => setAgeEligibility(e.target.value as CourseAgeEligibility)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 min-h-[44px] bg-white"
                  >
                    <option value="all_5_35">All BCA Members (5–35)</option>
                    <option value="children_5_17">Children Only (5–17 · Consent Required)</option>
                    <option value="young_adults_18_35">Young Adults (18–35)</option>
                    <option value="adults_18_plus">Adults Only (18+)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Audience</label>
                <input
                  type="text"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 min-h-[44px]"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Duration (Hours)</label>
                  <input
                    type="number"
                    min={1}
                    max={500}
                    value={durationHours}
                    onChange={(e) => setDurationHours(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 min-h-[44px]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Capacity</label>
                  <input
                    type="number"
                    min={1}
                    max={2000}
                    value={enrolmentCapacity}
                    onChange={(e) => setEnrolmentCapacity(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 min-h-[44px]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 min-h-[44px]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Completion Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 min-h-[44px]"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="block font-semibold text-slate-700">Learning Objectives (At least 1)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newObjective}
                    onChange={(e) => setNewObjective(e.target.value)}
                    placeholder="Add measurable learner outcome..."
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-300 min-h-[42px]"
                  />
                  <button
                    type="button"
                    onClick={handleAddObjective}
                    className="px-4 py-2 bg-[#005A9C] text-white font-bold rounded-xl flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add</span>
                  </button>
                </div>
                <div className="space-y-1.5">
                  {learningObjectives.map((obj, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200"
                    >
                      <span className="text-slate-700">{obj}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setLearningObjectives(learningObjectives.filter((_, i) => i !== idx))
                        }
                        className="text-red-600 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block font-semibold text-slate-700">Course Prerequisites (Optional)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newPrereq}
                    onChange={(e) => setNewPrereq(e.target.value)}
                    placeholder="e.g. Basic arithmetic or Completed Digital Literacy"
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-300 min-h-[42px]"
                  />
                  <button
                    type="button"
                    onClick={handleAddPrereq}
                    className="px-4 py-2 bg-[#1B365D] text-white font-bold rounded-xl flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add</span>
                  </button>
                </div>
                <div className="space-y-1.5">
                  {prerequisites.map((p, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200"
                    >
                      <span className="text-slate-700">{p}</span>
                      <button
                        type="button"
                        onClick={() => setPrerequisites(prerequisites.filter((_, i) => i !== idx))}
                        className="text-red-600 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="font-heading text-base font-bold text-[#1B365D]">{title || 'Untitled Course'}</div>
                <div className="text-slate-500 font-mono">
                  {category} · {learningFormat.replace('_', ' ')} · {level} · {durationHours} hrs · Capacity {enrolmentCapacity}
                </div>
                <p className="text-slate-700 leading-relaxed">{description}</p>
              </div>
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-[#1B365D]">
                <strong>Approval Workflow:</strong> Saving as Draft keeps the course private in your Instructor Studio. Submitting for Approval routes the course to the BCA Learning Manager for safeguarding &amp; quality verification before learners can enrol.
              </div>
            </div>
          )}
        </div>

        {/* Footer Controls */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep((step - 1) as 1 | 2 | 3 | 4)}
                className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-xl min-h-[42px]"
              >
                Previous
              </button>
            )}
            {step < 4 && (
              <button
                type="button"
                onClick={() => setStep((step + 1) as 1 | 2 | 3 | 4)}
                className="px-4 py-2 text-xs font-bold bg-[#1B365D] text-white rounded-xl min-h-[42px]"
              >
                Next Step
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isSaving}
              onClick={() => handleFinalSave(false)}
              className="px-4 py-2 text-xs font-bold bg-white border border-slate-300 text-[#1B365D] rounded-xl flex items-center gap-1.5 min-h-[42px]"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Draft</span>
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={() => handleFinalSave(true)}
              className="px-5 py-2 text-xs font-bold bg-[#005A9C] hover:bg-[#004980] text-white rounded-xl flex items-center gap-1.5 min-h-[42px]"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Submit for Approval</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
