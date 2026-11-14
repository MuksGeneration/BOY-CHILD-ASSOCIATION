// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { mockStore } from '../lib/firebase/mockStore';
import {
  lmsCourseSchema,
  lmsZoomSessionSchema,
  lmsAssessmentSchema,
  validateLmsMediaFile,
} from '../lib/validation/schemas';
import { AuthProvider } from '../hooks/useAuth';
import { LmsLearningDashboardPage } from '../features/lms/LmsLearningDashboardPage';
import { InstructorStudioPage } from '../features/lms/InstructorStudioPage';
import { LearningManagerPage } from '../features/lms/LearningManagerPage';
import { VerifyCertificatePage } from '../features/lms/VerifyCertificatePage';

function renderWithProviders(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <AuthProvider>
        <MemoryRouter>{ui}</MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

afterEach(() => {
  cleanup();
  mockStore.switchUser('usr_boy_active');
});

describe('BCA Online Skilling LMS: Security, Zoom, Media & Learning Invariants', () => {
  it('validates course metadata schemas, media file limits, and rejects disallowed executables', () => {
    expect(
      lmsCourseSchema.safeParse({
        title: 'Uganda Borehole Solar Pumping Basics',
        description: 'Practical vocational course teaching safe solar DC pump sizing and maintenance across rural chapters.',
        category: 'Solar & Clean Energy',
        targetAudience: 'Boys and Young Men 14-35',
        ageEligibility: 'all_5_35',
        level: 'beginner',
        durationHours: 10,
        learningFormat: 'blended',
        startDate: '2026-12-01',
        endDate: '2027-03-01',
        enrolmentCapacity: 40,
        learningObjectives: ['Size a 12V borehole solar array safely'],
      }).success
    ).toBe(true);

    // Media upload size and MIME guards
    expect(validateLmsMediaFile({ name: 'lesson1.mp4', type: 'video/mp4', size: 120 * 1024 * 1024 }, 'video').valid).toBe(true);
    expect(validateLmsMediaFile({ name: 'too_big.mp4', type: 'video/mp4', size: 600 * 1024 * 1024 }, 'video').valid).toBe(false);
    expect(validateLmsMediaFile({ name: 'notes.pdf', type: 'application/pdf', size: 5 * 1024 * 1024 }, 'pdf').valid).toBe(true);
    expect(
      validateLmsMediaFile(
        {
          name: 'deck.pptx',
          type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          size: 8 * 1024 * 1024,
        },
        'presentation'
      ).valid
    ).toBe(true);
    expect(validateLmsMediaFile({ name: 'captions.vtt', type: 'text/vtt', size: 8000 }, 'captions').valid).toBe(true);
    expect(validateLmsMediaFile({ name: 'malware.exe', type: 'application/x-msdownload', size: 4096 }, 'video').valid).toBe(false);
  });

  it('enforces course creation workflow & role isolation (only Learning Manager or Admin can publish courses)', () => {
    const draft = mockStore.upsertCourseDraft(
      {
        title: 'Electrical House Wiring Safety',
        description: 'Step-by-step domestic earthing, circuit breaker protection, and safe inspection in Uganda.',
        category: 'Vocational Trades',
        status: 'pending_approval',
      },
      'usr_instructor_musoke'
    );
    expect(draft.status).toBe('pending_approval');

    expect(() => {
      mockStore.reviewCoursePublication(draft.id, 'published', 'usr_instructor_musoke');
    }).toThrow(/Learning Manager or Administrator/i);

    mockStore.reviewCoursePublication(draft.id, 'published', 'usr_learning_manager_namono', 'Approved for Term 1.');
    const updated = mockStore.courses.find((c) => c.id === draft.id);
    expect(updated?.status).toBe('published');
    expect(updated?.approvedBy).toBe('Florence Namono');
  });

  it('blocks un-authorized mentors from teaching courses until explicitly authorized by Learning Manager/Admin', () => {
    // usr_mentor_okello starts with instructorAuthorized: false
    expect(mockStore.canUserInstructCourse('usr_mentor_okello', 'course_solar_pv')).toBe(false);
    expect(() => {
      mockStore.assignInstructorToCourse('course_solar_pv', 'usr_mentor_okello', 'usr_learning_manager_namono', 'co_instructor', false);
    }).toThrow(/explicit instructor authorization/i);

    // Explicit authorization unlocks teaching
    const assignment = mockStore.assignInstructorToCourse(
      'course_solar_pv',
      'usr_mentor_okello',
      'usr_learning_manager_namono',
      'co_instructor',
      true
    );
    expect(assignment.status).toBe('active');
    expect(mockStore.canUserInstructCourse('usr_mentor_okello', 'course_solar_pv')).toBe(true);

    // Revert mentor explicit authorization so downstream demo state remains consistent
    mockStore.assignUserRole('usr_mentor_okello', 'mentor', true, false);
  });

  it('enforces guardian consent gate and age eligibility during course enrolment', () => {
    // Pending minor cannot enrol in published course
    expect(() => {
      mockStore.enrollInCourse('course_digital_literacy', 'usr_boy_pending');
    }).toThrow(/Verified guardian consent is mandatory/i);

    // Verified minor cannot enrol in 18–35 Young Adult course
    expect(() => {
      mockStore.enrollInCourse('course_financial_stewardship', 'usr_boy_active');
    }).toThrow(/18 or older/i);

    // Adult member can enrol in 18–35 course
    const adultEnrol = mockStore.enrollInCourse('course_financial_stewardship', 'usr_young_adult');
    expect(['enrolled', 'pending']).toContain(adultEnrol.status);
  });

  it('handles honest unconfigured Zoom state, Africa/Kampala (+03:00) scheduling, safeguarding locks, and role-safe join links', () => {
    const zoomStatus = mockStore.testZoomConnectionOfflineHonest();
    expect(zoomStatus.connected).toBe(false);
    expect(zoomStatus.statusMessage).toMatch(/ZOOM_ACCOUNT_ID/);

    expect(() => {
      mockStore.scheduleCourseSession({
        courseId: 'course_solar_pv',
        title: 'Live DC Protection Session',
        description: 'Hands-on fuse protection briefing.',
        instructorUid: 'usr_instructor_musoke',
        scheduledDate: '2026-12-10',
        startTimeKampala: '14:00',
        durationMinutes: 60,
      });
    }).toThrow(/Zoom Server-to-Server OAuth credentials are not configured/i);

    expect(
      lmsZoomSessionSchema.safeParse({
        courseId: 'course_solar_pv',
        title: 'Live DC Protection Session',
        description: 'Hands-on fuse protection briefing.',
        scheduledDate: '2026-12-10',
        startTimeKampala: '14:00',
        durationMinutes: 60,
        manualJoinUrl: 'https://zoom.us/j/9988776655',
      }).success
    ).toBe(true);

    const session = mockStore.scheduleCourseSession({
      courseId: 'course_solar_pv',
      title: 'Live DC Protection Session',
      description: 'Hands-on fuse protection briefing.',
      instructorUid: 'usr_instructor_musoke',
      scheduledDate: '2026-12-10',
      startTimeKampala: '14:00',
      durationMinutes: 60,
      manualJoinUrl: 'https://zoom.us/j/9988776655',
      manualPasscode: 'SAFE26',
    });

    // 14:00 Africa/Kampala (+03:00) must equal 11:00 UTC
    expect(session.timezone).toBe('Africa/Kampala');
    expect(session.startsAtIso).toBe('2026-12-10T11:00:00.000Z');

    const meeting = mockStore.zoomMeetings.find((m) => m.id === session.zoomMeetingDocId);
    expect(meeting?.waitingRoom).toBe(true);
    expect(meeting?.joinBeforeHost).toBe(false);
    expect(meeting?.recordingEnabled).toBe(false);

    // Enrolled learner sees joinUrl but NOT host startUrl
    const learnerAccess = mockStore.getAuthorizedMeetingAccess(session.id, 'usr_boy_active');
    expect(learnerAccess.joinUrl).toBe('https://zoom.us/j/9988776655');
    expect(learnerAccess.startUrl).toBeUndefined();

    // Assigned instructor sees host startUrl
    const instructorAccess = mockStore.getAuthorizedMeetingAccess(session.id, 'usr_instructor_musoke');
    expect(instructorAccess.startUrl).toBe('https://zoom.us/j/9988776655');
  });

  it('auto-grades assessments, grades written assignments, auto-issues minor-safe certificates on 100% completion, and supports revocation', () => {
    expect(
      lmsAssessmentSchema.safeParse({
        courseId: 'course_solar_pv',
        title: 'DC Safety Quiz',
        assessmentType: 'quiz',
        instructions: 'Select the safest sequence for wiring.',
        passMarkPercent: 70,
        maxAttempts: 3,
        releaseAnswersAfterSubmit: true,
      }).success
    ).toBe(true);

    const attempt = mockStore.submitAssessmentAttempt('assm_solar_quiz1', 'course_solar_pv', 'usr_boy_active', {
      q_solar_1: 1,
      q_solar_2: true,
    });
    expect(attempt.scorePercent).toBe(100);
    expect(attempt.passed).toBe(true);

    const sub = mockStore.submitAssignmentWork({
      assessmentId: 'assm_solar_project',
      courseId: 'course_solar_pv',
      userId: 'usr_boy_active',
      submissionText: '2 x 80W panels, 20A MPPT, 12V 100Ah AGM, 20A inline blade fuse.',
    });
    mockStore.gradeAssignmentSubmission(sub.id, 92, 'Well calculated cable gauge and fuse sizing.', 'Eng. Isaac Musoke');
    expect(mockStore.assignmentSubmissions.find((s) => s.id === sub.id)?.scorePercent).toBe(92);

    // Complete remaining required lesson les_solar_3 for usr_boy_active -> 100% + auto certificate
    mockStore.recordLessonProgress({
      courseId: 'course_solar_pv',
      moduleId: 'mod_solar_2',
      lessonId: 'les_solar_3',
      userId: 'usr_boy_active',
      completed: true,
      watchedSecondsDelta: 1500,
    });

    const boyEnroll = mockStore.courseEnrollments.find(
      (e) => e.courseId === 'course_solar_pv' && e.userId === 'usr_boy_active'
    );
    expect(boyEnroll?.progressPercent).toBe(100);
    expect(boyEnroll?.status).toBe('completed');

    const boyCert = mockStore.certificates.find(
      (c) => c.courseId === 'course_solar_pv' && c.userId === 'usr_boy_active'
    );
    expect(boyCert).toBeTruthy();
    expect(boyCert?.certificateNumber).toMatch(/^BCA-CERT-\d{4}-\d{4}$/);
    // Minor display name must mask surname for child privacy
    expect(boyCert?.learnerDisplayName).toBe('David M.');

    if (boyCert) {
      const publicBefore = mockStore.verifyCertificate(boyCert.certificateNumber);
      expect(publicBefore?.status).toBe('issued');
      expect(publicBefore?.learnerDisplayName).toBe('David M.');

      mockStore.revokeCertificate(boyCert.id, 'Audit test revocation', 'Florence Namono');
      const publicAfter = mockStore.verifyCertificate(boyCert.certificateNumber);
      expect(publicAfter?.status).toBe('revoked');
    }
  });
});

describe('BCA Online Skilling LMS UI Smoke Tests', () => {
  it('renders LmsLearningDashboardPage for active boy and allows filtering course catalogue', () => {
    mockStore.switchUser('usr_boy_active');
    renderWithProviders(<LmsLearningDashboardPage />);
    expect(screen.getByText(/BCA Uganda Online Skilling & Digital LMS/i)).toBeTruthy();
    expect(screen.getAllByText(/Solar PV & Off-Grid Electronics Fundamentals/i).length).toBeGreaterThan(0);

    const search = screen.getByPlaceholderText(/Search courses\.\.\./i);
    fireEvent.change(search, { target: { value: 'Digital Literacy' } });
    expect(screen.getAllByText(/Digital Literacy, Spreadsheets/i).length).toBeGreaterThan(0);
  });

  it('enforces explicit teaching authorization guard inside InstructorStudioPage and renders for authorized instructor', () => {
    // Un-authorized mentor sees explicit restriction screen
    mockStore.switchUser('usr_mentor_okello');
    renderWithProviders(<InstructorStudioPage />);
    expect(screen.getByText(/Explicit Instructor Authorization Required/i)).toBeTruthy();
    cleanup();

    // Authorized instructor sees studio workspace
    mockStore.switchUser('usr_instructor_musoke');
    renderWithProviders(<InstructorStudioPage />);
    expect(screen.getByText(/Instructor Studio & Live Class Console/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /Create New Course/i })).toBeTruthy();
  });

  it('renders LearningManagerPage with course approval queue and honest Zoom configuration panel', () => {
    mockStore.switchUser('usr_learning_manager_namono');
    renderWithProviders(<LearningManagerPage />);
    expect(screen.getByText(/Learning Manager Governance Console/i)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Zoom Integration Settings/i }));
    expect(screen.getByText(/Zoom Server-to-Server OAuth Integration/i)).toBeTruthy();
    expect(screen.getByText(/Minor Safeguarding Lock/i)).toBeTruthy();
  });

  it('renders public VerifyCertificatePage and verifies existing adult certificate code', async () => {
    renderWithProviders(<VerifyCertificatePage />);
    expect(screen.getByText(/Verify Digital Course Certificate/i)).toBeTruthy();
    const input = screen.getByPlaceholderText(/BCA-CERT-2026-4401/i);
    fireEvent.change(input, { target: { value: 'BCA-CERT-2026-4401' } });
    fireEvent.click(screen.getByRole('button', { name: /Verify Credential/i }));
    expect(await screen.findByText(/Samuel Kiggundu/)).toBeTruthy();
  });
});
