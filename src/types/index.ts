export type UserRole =
  | 'boy'
  | 'guardian'
  | 'mentor'
  | 'partner'
  | 'coordinator'
  | 'instructor'
  | 'learning_manager'
  | 'admin';

export type UserStatus = 'active' | 'pending_guardian_consent' | 'pending_vetting' | 'suspended';

export type AgeCategory = 'child_5_17' | 'young_adult_18_35' | 'adult';

export type CmsStatus = 'draft' | 'published' | 'archived';

export type GuardianVerificationMethod =
  | 'child_code_confirmation'
  | 'coordinator_id_check'
  | 'guardian_sms_otp'
  | 'school_patron_attestation';

export interface AppUser {
  uid: string;
  email: string;
  fullName: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  ageCategory?: AgeCategory;
  safeguardingCleared?: boolean;
  instructorAuthorized?: boolean;
  instructorBio?: string;
  instructorSpecialty?: string;
  assignedCaseIds?: string[];
  membershipNumber?: string;
  membershipIssuedAt?: string;
  membershipQrToken?: string;
  emailVerified?: boolean;
  district?: string;
  town?: string;
  calculatedAge?: number;
  guardianId?: string;
  guardianName?: string;
  guardianPhone?: string;
  circleId?: string;
  schoolOrOccupation?: string;
  interests?: string[];
  avatarUrl?: string;
  suspensionReason?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface AttachmentMeta {
  name: string;
  url: string;
  storagePath: string;
  contentType: string;
  sizeBytes: number;
  uploadedAt: string;
  uploadedBy: string;
}

export interface MemberProfile {
  uid: string;
  fullName: string;
  ageCategory: 'child_5_17' | 'young_adult_18_35';
  calculatedAge: number;
  district: string;
  town: string;
  schoolOrOccupation?: string;
  interests: string[];
  avatarUrl?: string;
  circleId?: string;
  guardianId?: string;
  membershipNumber?: string;
  achievements: { id: string; title: string; awardedAt: string; badgeType: string }[];
  attendanceCount: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface GuardianLink {
  id: string;
  guardianId: string;
  guardianName: string;
  guardianPhone?: string;
  boyId: string;
  boyName: string;
  relationship: 'father' | 'mother' | 'legal_guardian' | 'elder_sibling' | 'extended_family' | 'other';
  verificationCode: string;
  verificationMethod: GuardianVerificationMethod;
  authorityEvidence?: string;
  verifiedBy?: string;
  status: 'pending_verification' | 'verified' | 'revoked';
  verifiedAt?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface ConsentRecord {
  id: string;
  boyId: string;
  boyName?: string;
  guardianId: string;
  guardianName?: string;
  action: 'granted' | 'withdrawn';
  consentVersion: string;
  method: 'guardian_portal' | 'sms_otp' | 'coordinator_verified';
  verificationMethod: GuardianVerificationMethod;
  authorityEvidence: string;
  reason?: string;
  createdAt: string;
  createdBy: string;
}

export interface MembershipApplication {
  id: string;
  applicantUid: string;
  fullName: string;
  dateOfBirth: string;
  calculatedAge: number;
  ageCategory: 'child_5_17' | 'young_adult_18_35';
  district: string;
  town: string;
  schoolOrOccupation?: string;
  interests: string[];
  guardianName?: string;
  guardianPhone?: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewNotes?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface Programme {
  id: string;
  title: string;
  category: 'Mentorship' | 'Wellbeing' | 'Skills' | 'Clubs' | 'Families';
  ageRange: string;
  shortDescription: string;
  fullDescription: string;
  outcomes: string[];
  schedule: string;
  districtLocations: string[];
  imagePath?: string;
  activeBoysCount: number;
  availablePlaces: number;
  status: CmsStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface Circle {
  id: string;
  name: string;
  district: string;
  locationName: string;
  meetingTime: string;
  leadMentorName: string;
  leadMentorId: string;
  coMentorIds?: string[];
  maxMembers: number;
  activeMembersCount: number;
  safeguardingLeadName: string;
  focusArea: string;
  status: 'active' | 'forming' | 'full';
}

export interface CircleMembership {
  id: string;
  circleId: string;
  userId: string;
  memberName: string;
  ageCategory: 'child_5_17' | 'young_adult_18_35';
  leadMentorId: string;
  status: 'active' | 'paused' | 'completed';
  createdAt: string;
  updatedAt: string;
}

export interface CircleSession {
  id: string;
  circleId: string;
  title: string;
  theme: string;
  scheduledAt: string;
  location: string;
  mentorId?: string;
  mentorName: string;
  notes?: string;
  completed: boolean;
}

export interface AttendanceRecord {
  id: string;
  sessionId: string;
  circleId: string;
  memberId: string;
  memberName: string;
  mentorId: string;
  status: 'present' | 'absent' | 'excused';
  date: string;
  notes?: string;
  createdAt: string;
}

export interface Goal {
  id: string;
  userId: string;
  circleId?: string;
  title: string;
  category: 'Education' | 'Life Skills' | 'Emotional Wellbeing' | 'Career & Craft' | 'Community Service';
  progress: number;
  targetDate: string;
  notes: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Question {
  id: string;
  circleId: string;
  userId: string;
  authorAlias: string;
  isAnonymous: boolean;
  category: string;
  question: string;
  mentorReply?: string;
  repliedByMentorName?: string;
  repliedAt?: string;
  isModerated: boolean;
  createdAt: string;
}

export interface ConcernReport {
  id: string;
  refNumber?: string;
  isAnonymous: boolean;
  reporterName?: string;
  reporterContact?: string;
  boyName?: string;
  district: string;
  concernCategory: string;
  urgency: 'low' | 'medium' | 'high' | 'immediate';
  details: string;
  status: 'new' | 'investigating' | 'escalated_to_local_authorities' | 'resolved';
  assignedCoordinator?: string;
  triageNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SafeguardingFollowUp {
  id: string;
  timestamp: string;
  authorId: string;
  authorName: string;
  actionTaken: string;
  nextReviewDate?: string;
  outcome: string;
}

export interface SafeguardingCase {
  id: string;
  refNumber: string;
  reportId: string;
  urgency: 'low' | 'medium' | 'high' | 'immediate';
  district: string;
  concernCategory: string;
  summary: string;
  status: 'new' | 'unassigned' | 'under_review' | 'follow_up' | 'escalated' | 'resolved';
  assignedLeadId?: string;
  assignedLeadName: string;
  triageNotes: string;
  escalationChannel?: 'Sauti 116' | 'Uganda Police CFPU (0800 199 699)' | 'District Probation Officer';
  escalationRef?: string;
  followUps: SafeguardingFollowUp[];
  attachments?: AttachmentMeta[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface JoinRequest {
  id: string;
  role: UserRole;
  fullName: string;
  phone: string;
  email?: string;
  district: string;
  status: 'pending' | 'approved' | 'rejected';
  details: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface MentorReferee {
  id: string;
  applicationId: string;
  mentorUid: string;
  refereeIndex: 1 | 2;
  name: string;
  phone: string;
  relationship: string;
  status: 'pending' | 'verified' | 'flagged';
  verifiedBy?: string;
  notes?: string;
  updatedAt: string;
}

export interface MentorApplication {
  id: string;
  applicantUid?: string;
  fullName: string;
  email: string;
  phone: string;
  district: string;
  occupation: string;
  motivation: string;
  availability: string;
  safeguardingTrainingAccepted?: boolean;
  referee1: { name: string; phone: string; status: 'pending' | 'verified' | 'flagged' };
  referee2: { name: string; phone: string; status: 'pending' | 'verified' | 'flagged' };
  dbsSafeguardingCheck: 'pending' | 'cleared' | 'flagged';
  status: 'pending_vetting' | 'approved' | 'declined';
  vettedBy?: string;
  documentUrls?: AttachmentMeta[];
  createdAt: string;
}

export interface PartnerOrganisation {
  id: string;
  ownerUid: string;
  orgName: string;
  orgType: 'school' | 'church' | 'business' | 'ngo' | 'community_cbo';
  contactPerson: string;
  phone: string;
  email: string;
  district: string;
  status: 'pending' | 'verified' | 'suspended';
  vanguardClubActive: boolean;
  approvedEventsCount: number;
  createdAt: string;
}

export interface PartnerApplication {
  id: string;
  applicantUid: string;
  orgName: string;
  orgType: 'school' | 'church' | 'business' | 'ngo' | 'community_cbo';
  contactPerson: string;
  phone: string;
  email: string;
  district: string;
  applicationType: 'institutional_partner' | 'vanguard_club' | 'event_collaboration';
  proposal: string;
  status: 'pending' | 'approved' | 'declined';
  activityNotes?: string;
  documentUrls?: AttachmentMeta[];
  createdAt: string;
  updatedAt: string;
}

export interface BcaEvent {
  id: string;
  title: string;
  category: 'Circle Gathering' | 'Skills Workshop' | 'School Vanguard' | 'Guardian Dialogue' | 'Sports Wellbeing';
  district: string;
  location: string;
  startsAt: string;
  description: string;
  circleId?: string;
  partnerId?: string;
  capacity: number;
  registeredCount: number;
  status: CmsStatus;
}

export interface EventRegistration {
  id: string;
  eventId: string;
  userId?: string;
  attendeeName: string;
  attendeeEmail?: string;
  attendeeRole: UserRole | 'guest';
  district: string;
  confirmationCode: string;
  attendanceStatus: 'registered' | 'present' | 'absent' | 'excused';
  markedBy?: string;
  registeredAt: string;
}

export interface MembershipVerificationRecord {
  membershipNumber: string;
  uid: string;
  status: UserStatus;
  ageCategory: AgeCategory;
  district: string;
  circleName?: string;
  issuedAt: string;
  qrToken: string;
  isMinor: boolean;
  fullNameMasked: string;
  fullNamePrivate: string;
}

export interface LearningResource {
  id: string;
  title: string;
  category: 'Safeguarding' | 'Mentorship Guide' | 'Life Skills' | 'Academic Grit' | 'Vocational Tech' | 'Parenting';
  audience: 'all' | 'boys' | 'guardians' | 'mentors' | 'partners';
  summary: string;
  readTimeMinutes: number;
  contentBody: string;
  status: CmsStatus;
  updatedAt: string;
}

export interface AnnouncementItem {
  id: string;
  title: string;
  summary: string;
  body: string;
  type: 'news' | 'story' | 'announcement';
  district: string;
  publishedDate: string;
  status: CmsStatus;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  category: 'general' | 'circle' | 'consent' | 'programme';
  read: boolean;
  createdAt: string;
}

export interface DppaRequest {
  id: string;
  userId: string;
  userName: string;
  type: 'export' | 'correction' | 'deletion';
  reason: string;
  status: 'pending' | 'completed' | 'held_for_safeguarding' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: string;
  resolutionNotes?: string;
  createdAt: string;
}

export interface ContactMessage {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  status: 'new' | 'in_progress' | 'resolved';
  handledBy?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface MentorProgressReport {
  id: string;
  circleId: string;
  circleName: string;
  mentorId: string;
  mentorName: string;
  reportingPeriod: string;
  attendanceSummary: string;
  keyMilestones: string;
  safeguardingObservations: string;
  supportNeeded?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  performedBy: string;
  performedByRole: string;
  targetEntity: string;
  targetId: string;
  details: string;
  timestamp: string;
}

export interface CmsSettingsBundle {
  heroHeadline: string;
  heroSubheadline: string;
  motto: string;
  whatsappNumber: string;
  helplineNumber: string;
  email: string;
  headquartersAddress: string;
  stats: {
    activeBoys: string;
    vettedMentors: string;
    districts: string;
    partnerSchools: string;
  };
  faqs: { id: string; question: string; answer: string }[];
  retentionDays: {
    membershipApps: number;
    auditLogs: number;
    safeguardingCasesYears: number;
  };
  status: CmsStatus;
  updatedAt: string;
}

// =========================================================================
// BCA ONLINE SKILLING & DIGITAL LEARNING MANAGEMENT SYSTEM (LMS)
// =========================================================================

export type CourseStatus = 'draft' | 'pending_approval' | 'published' | 'unpublished' | 'archived';
export type CourseFormat = 'self_paced' | 'instructor_led' | 'blended';
export type CourseLevel = 'beginner' | 'intermediate' | 'advanced';
export type CourseAgeEligibility = 'all_5_35' | 'children_5_17' | 'young_adults_18_35' | 'adults_18_plus';

export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnailUrl?: string;
  category: string;
  learningObjectives: string[];
  targetAudience: string;
  ageEligibility: CourseAgeEligibility;
  level: CourseLevel;
  durationHours: number;
  prerequisites: string[];
  instructorIds: string[];
  instructorNames: string[];
  learningFormat: CourseFormat;
  startDate: string;
  endDate: string;
  enrolmentCapacity: number;
  enrolledCount: number;
  status: CourseStatus;
  approvalNotes?: string;
  approvedBy?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CourseModule {
  id: string;
  courseId: string;
  title: string;
  description: string;
  orderIndex: number;
  status: 'draft' | 'published';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export type LessonType =
  | 'video'
  | 'pdf'
  | 'presentation'
  | 'audio'
  | 'text'
  | 'practical_demo'
  | 'external_resource'
  | 'study_notes';

export interface CourseLesson {
  id: string;
  courseId: string;
  moduleId: string;
  title: string;
  lessonType: LessonType;
  orderIndex: number;
  durationMinutes: number;
  isRequired: boolean;
  prerequisiteLessonId?: string;
  objectives: string[];
  instructorNotes?: string;
  textContent?: string;
  transcript?: string;
  externalUrl?: string;
  primaryAssetId?: string;
  lowBandwidthAssetId?: string;
  captionsAssetId?: string;
  studyNotesAssetId?: string;
  status: 'draft' | 'published';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export type CourseAssetKind =
  | 'video'
  | 'low_bandwidth_video'
  | 'pdf'
  | 'presentation'
  | 'document'
  | 'audio'
  | 'image'
  | 'captions';

export interface CourseAsset {
  id: string;
  courseId: string;
  moduleId?: string;
  lessonId?: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  assetKind: CourseAssetKind;
  storagePath: string;
  provider: 'firebase_storage' | 'external_stream';
  visibility: 'private_enrolled' | 'course_thumbnail';
  previewDataUrl?: string;
  uploadedBy: string;
  uploadedByName: string;
  createdAt: string;
  updatedAt: string;
}

export interface InstructorAssignment {
  id: string;
  courseId: string;
  courseTitle: string;
  instructorUid: string;
  instructorName: string;
  roleType: 'lead_instructor' | 'co_instructor';
  assignedBy: string;
  assignedByName: string;
  status: 'active' | 'revoked';
  createdAt: string;
  updatedAt: string;
}

export type EnrollmentStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'enrolled'
  | 'completed'
  | 'withdrawn';

export interface CourseEnrollment {
  id: string;
  courseId: string;
  courseTitle: string;
  userId: string;
  learnerName: string;
  learnerDistrict: string;
  ageCategory: AgeCategory;
  isMinor: boolean;
  guardianConsentVerified: boolean;
  status: EnrollmentStatus;
  rejectionReason?: string;
  progressPercent: number;
  completedLessonsCount: number;
  totalLessonsCount: number;
  learningMinutes: number;
  enrolledAt: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LessonProgress {
  id: string;
  courseId: string;
  moduleId: string;
  lessonId: string;
  userId: string;
  completed: boolean;
  lastPositionSeconds: number;
  watchedSeconds: number;
  playbackSpeed: number;
  updatedAt: string;
}

export type AssessmentType =
  | 'pre_course'
  | 'post_course'
  | 'quiz'
  | 'written_assignment'
  | 'file_assignment';

export interface Assessment {
  id: string;
  courseId: string;
  moduleId?: string;
  title: string;
  assessmentType: AssessmentType;
  instructions: string;
  passMarkPercent: number;
  maxAttempts: number;
  availableFrom?: string;
  dueAt?: string;
  releaseAnswersAfterSubmit: boolean;
  status: 'draft' | 'published';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export type AssessmentQuestionType = 'mcq' | 'true_false' | 'short_answer' | 'written';

export interface AssessmentQuestion {
  id: string;
  assessmentId: string;
  courseId: string;
  orderIndex: number;
  questionType: AssessmentQuestionType;
  prompt: string;
  options?: string[];
  points: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface AssessmentAnswerKey {
  questionId: string;
  assessmentId: string;
  courseId: string;
  correctOptionIndex?: number;
  correctBoolean?: boolean;
  expectedKeywords?: string[];
  explanation?: string;
  updatedAt: string;
}

export interface AssessmentAttempt {
  id: string;
  assessmentId: string;
  courseId: string;
  userId: string;
  learnerName: string;
  attemptNumber: number;
  answers: Record<string, string | number | boolean>;
  scorePercent: number;
  earnedPoints: number;
  totalPoints: number;
  passed: boolean;
  status: 'submitted' | 'graded';
  feedback?: string;
  gradedBy?: string;
  submittedAt: string;
  gradedAt?: string;
}

export interface AssignmentSubmission {
  id: string;
  assessmentId: string;
  courseId: string;
  userId: string;
  learnerName: string;
  submissionText: string;
  fileAssetPath?: string;
  fileName?: string;
  status: 'submitted' | 'graded' | 'resubmit_requested';
  scorePercent?: number;
  instructorFeedback?: string;
  gradedBy?: string;
  submittedAt: string;
  gradedAt?: string;
}

export interface CourseSession {
  id: string;
  courseId: string;
  courseTitle: string;
  moduleId?: string;
  title: string;
  description: string;
  instructorUid: string;
  instructorName: string;
  scheduledDate: string; // YYYY-MM-DD (Africa/Kampala)
  startTimeKampala: string; // HH:mm (Africa/Kampala)
  startsAtIso: string; // Converted UTC ISO timestamp
  durationMinutes: number;
  timezone: 'Africa/Kampala';
  zoomMeetingDocId?: string;
  manualJoinUrl?: string;
  capacity?: number;
  isRecurring: boolean;
  recurrenceRule?: string;
  status: 'scheduled' | 'live' | 'completed' | 'cancelled';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ZoomMeetingRecord {
  id: string;
  courseId: string;
  sessionId: string;
  zoomMeetingId: string; // String to preserve full 64-bit precision
  topic: string;
  startTimeUtc: string;
  durationMinutes: number;
  timezone: 'Africa/Kampala';
  hostIdentity: string;
  status: 'scheduled' | 'started' | 'ended' | 'cancelled';
  waitingRoom: boolean;
  joinBeforeHost: boolean;
  recordingEnabled: boolean;
  participantRestrictionsApplied: boolean;
  passcodeProtected: boolean;
  mode: 'zoom_api' | 'manual_fallback';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthorizedMeetingAccess {
  sessionId: string;
  zoomMeetingId: string;
  topic: string;
  startsAtIso: string;
  durationMinutes: number;
  timezone: string;
  joinUrl: string;
  passcode?: string;
  startUrl?: string; // Returned ONLY to assigned host/instructor/manager/admin
  safeguardingNotice: string;
}

export interface SessionAttendance {
  id: string;
  sessionId: string;
  courseId: string;
  userId: string;
  learnerName: string;
  status: 'present' | 'absent' | 'excused';
  markedBy: string;
  markedByName: string;
  notes?: string;
  recordedAt: string;
}

export interface CourseAnnouncement {
  id: string;
  courseId: string;
  title: string;
  message: string;
  priority: 'normal' | 'urgent';
  authorUid: string;
  authorName: string;
  createdAt: string;
}

export interface CourseCertificate {
  id: string;
  certificateNumber: string;
  courseId: string;
  courseTitle: string;
  userId: string;
  learnerDisplayName: string;
  completionDate: string;
  instructorSignatory: string;
  learningManagerSignatory: string;
  qrToken: string;
  status: 'issued' | 'revoked';
  revokedReason?: string;
  revokedBy?: string;
  issuedAt: string;
  updatedAt: string;
}

export interface CertificateVerificationRecord {
  certificateNumber: string;
  courseTitle: string;
  learnerDisplayName: string;
  completionDate: string;
  instructorSignatory: string;
  status: 'issued' | 'revoked';
  revokedAt?: string;
  qrToken: string;
  updatedAt: string;
}

export interface LearningNotification {
  id: string;
  userId: string;
  courseId?: string;
  sessionId?: string;
  title: string;
  message: string;
  category: 'enrolment' | 'live_class_reminder' | 'assessment' | 'certificate' | 'announcement';
  reminderLeadTime?: '24h' | '1h' | 'immediate';
  read: boolean;
  createdAt: string;
}

export interface ZoomConfigStatus {
  connected: boolean;
  secretsConfigured: boolean;
  hostUserIdOrEmail: string;
  verifiedHostDisplayName?: string;
  defaultTimezone: 'Africa/Kampala';
  minorSafeguardingLock: boolean;
  lastTestedAt?: string;
  statusMessage: string;
  updatedBy?: string;
  updatedAt: string;
}

