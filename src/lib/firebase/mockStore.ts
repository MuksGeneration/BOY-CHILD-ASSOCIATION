import {
  AppUser,
  MemberProfile,
  MemberDirectoryEntry,
  GuardianLink,
  ConsentRecord,
  MembershipApplication,
  Programme,
  Circle,
  CircleMembership,
  CircleSession,
  AttendanceRecord,
  Goal,
  Question,
  ConcernReport,
  SafeguardingCase,
  SafeguardingFollowUp,
  MentorApplication,
  MentorReferee,
  PartnerOrganisation,
  PartnerApplication,
  BcaEvent,
  EventRegistration,
  MembershipVerificationRecord,
  GuardianVerificationMethod,
  LearningResource,
  AnnouncementItem,
  AppNotification,
  DppaRequest,
  AuditLogEntry,
  CmsSettingsBundle,
  CmsStatus,
  UserRole,
  UserStatus,
  AttachmentMeta,
  ContactMessage,
  MentorProgressReport,
  Course,
  CourseModule,
  CourseLesson,
  CourseAsset,
  InstructorAssignment,
  CourseEnrollment,
  LessonProgress,
  Assessment,
  AssessmentQuestion,
  AssessmentAnswerKey,
  AssessmentAttempt,
  AssignmentSubmission,
  CourseSession,
  ZoomMeetingRecord,
  AuthorizedMeetingAccess,
  SessionAttendance,
  CourseAnnouncement,
  CourseCertificate,
  CertificateVerificationRecord,
  LearningNotification,
  ZoomConfigStatus,
} from '../../types';

const INITIAL_PROGRAMMES: Programme[] = [
  {
    id: 'prog_mentorship',
    title: 'Brothers in Purpose (Circle Mentorship)',
    category: 'Mentorship',
    ageRange: 'Ages 10 – 19',
    shortDescription: 'Safe weekly peer circles guided by thoroughly vetted male role models and elder community mentors.',
    fullDescription: 'Our flagship mentorship initiative pairs boys in groups of 8–10 with two background-checked mentors. Sessions emphasize emotional regulation, integrity, accountability, positive masculinity, and coping with adversity in urban and rural Uganda.',
    outcomes: ['Self-esteem and confidence', 'Conflict resolution without violence', 'Career guidance and educational grit'],
    schedule: 'Every Saturday, 10:00 AM – 12:30 PM',
    districtLocations: ['Kampala', 'Wakiso', 'Mukono', 'Jinja', 'Gulu'],
    imagePath: '/images/programme_mentorship_1794461658375.jpg',
    activeBoysCount: 420,
    availablePlaces: 35,
    status: 'published',
  },
  {
    id: 'prog_skills',
    title: 'Digital Crafts & Solar Tinkering',
    category: 'Skills',
    ageRange: 'Ages 12 – 24',
    shortDescription: 'Hands-on electrical assembly, robotics, digital coding, and practical vocational craftsmanship.',
    fullDescription: 'Equipping boys with high-demand 21st-century vocational skills. Participants assemble solar lanterns, learn basic computer literacy, repair household appliances, and discover micro-entrepreneurship under certified technicians.',
    outcomes: ['Practical electrical safety and solar tech', 'Basic computer literacy & digital problem-solving', 'Micro-business basics'],
    schedule: 'Tuesdays & Thursdays, 4:30 PM – 6:30 PM',
    districtLocations: ['Kampala', 'Jinja', 'Mbarara', 'Arua'],
    imagePath: '/images/programme_skills_1794461658653.jpg',
    activeBoysCount: 290,
    availablePlaces: 18,
    status: 'published',
  },
  {
    id: 'prog_wellbeing',
    title: 'Safe Minds & Strong Hearts (Wellbeing)',
    category: 'Wellbeing',
    ageRange: 'Ages 7 – 22',
    shortDescription: 'Trauma-informed mental health, sports-based therapy, and safe spaces to speak without fear or judgment.',
    fullDescription: 'Breaking the silence around depression, grief, and family stress. Through non-contact physical sports, group processing, and professional counselling referrals, we help boys process difficult emotions before they turn into anger or self-harm.',
    outcomes: ['Emotional expression vocabulary', 'Stress and grief management', 'Reduction in school dropouts'],
    schedule: 'Fridays, 3:00 PM – 5:30 PM & Sunday Community Matches',
    districtLocations: ['Kampala', 'Wakiso', 'Gulu', 'Mbale'],
    imagePath: '/images/programme_wellbeing_1794461659186.jpg',
    activeBoysCount: 350,
    availablePlaces: 40,
    status: 'published',
  },
  {
    id: 'prog_clubs',
    title: 'School Vanguard Clubs',
    category: 'Clubs',
    ageRange: 'Ages 10 – 18',
    shortDescription: 'In-school character development, debate, anti-bullying patrols, and academic peer tutoring.',
    fullDescription: 'Partnered with primary and secondary schools across Uganda to establish boy-led leadership clubs that advocate for gender equality, respect for girls and women, peer academic tutoring, and drug-free school environments.',
    outcomes: ['Anti-bullying ambassadorship', 'Peer academic tutoring', 'Respect for women and girls advocacy'],
    schedule: 'Weekly club periods during term time',
    districtLocations: ['Kampala', 'Wakiso', 'Mukono', 'Masaka', 'Lira'],
    imagePath: '/images/hero_boys_circle_1794461657319.jpg',
    activeBoysCount: 680,
    availablePlaces: 75,
    status: 'published',
  },
  {
    id: 'prog_families',
    title: 'Fatherhood & Guardian Circles',
    category: 'Families',
    ageRange: 'Parents & Guardians',
    shortDescription: 'Monthly dialogue sessions helping parents communicate effectively with teenage boys without punitive violence.',
    fullDescription: 'Empowering fathers, single mothers, grandmothers, and foster guardians with non-violent discipline techniques, adolescent psychology insights, and community support networks.',
    outcomes: ['Positive parenting strategies', 'Stronger child-parent communication', 'Early detection of adolescent distress'],
    schedule: 'First Sunday of each month, 2:00 PM – 4:30 PM',
    districtLocations: ['All Uganda Chapters & Virtual Dial-in'],
    imagePath: '/images/programme_mentorship_1794461658375.jpg',
    activeBoysCount: 180,
    availablePlaces: 50,
    status: 'published',
  },
];

const INITIAL_CIRCLES: Circle[] = [
  {
    id: 'circle_kampala_central',
    name: 'Kampala Central Champions Circle',
    district: 'Kampala',
    locationName: 'Old Kampala Community Centre, Sector 3',
    meetingTime: 'Saturdays at 10:00 AM',
    leadMentorName: 'Emmanuel Okello',
    leadMentorId: 'usr_mentor_okello',
    coMentorIds: ['usr_coordinator_sarah'],
    maxMembers: 12,
    activeMembersCount: 9,
    safeguardingLeadName: 'Sister Sarah Nabirye',
    focusArea: 'Academic Grit & Integrity',
    status: 'active',
  },
  {
    id: 'circle_wakiso_builders',
    name: 'Wakiso Young Builders Circle',
    district: 'Wakiso',
    locationName: 'Kira Youth Vocational Hall',
    meetingTime: 'Saturdays at 2:00 PM',
    leadMentorName: 'Dennis Ssebagala',
    leadMentorId: 'usr_mentor_dennis',
    maxMembers: 12,
    activeMembersCount: 11,
    safeguardingLeadName: 'Sister Sarah Nabirye',
    focusArea: 'Solar Assembly & Practical Trades',
    status: 'active',
  },
  {
    id: 'circle_jinja_explorers',
    name: 'Jinja Riverine Leadership Circle',
    district: 'Jinja',
    locationName: 'Walukuba Community Library',
    meetingTime: 'Sundays at 2:30 PM',
    leadMentorName: 'Moses Waiswa',
    leadMentorId: 'usr_mentor_moses',
    maxMembers: 10,
    activeMembersCount: 6,
    safeguardingLeadName: 'Sister Sarah Nabirye',
    focusArea: 'Sports Leadership & Peer Support',
    status: 'forming',
  },
];

const INITIAL_USERS: Record<string, AppUser> = {
  usr_boy_pending: {
    uid: 'usr_boy_pending',
    email: 'john.ssemwo@boychild.demo',
    fullName: 'John Baptist Ssemwogerere',
    phone: '+256778901234',
    role: 'boy',
    status: 'pending_guardian_consent',
    ageCategory: 'child_5_17',
    emailVerified: true,
    district: 'Wakiso',
    town: 'Kira Town Council',
    calculatedAge: 15,
    guardianId: 'usr_guardian_grace',
    guardianName: 'Grace Mukasa',
    guardianPhone: '+256772334455',
    schoolOrOccupation: 'Kira Secondary School S.2',
    interests: ['Brothers in Purpose Mentorship', 'Digital Crafts & Solar Tinkering'],
    createdAt: '2026-11-10T10:00:00Z',
    updatedAt: '2026-11-10T10:00:00Z',
    createdBy: 'usr_boy_pending',
  },
  usr_boy_active: {
    uid: 'usr_boy_active',
    email: 'david.mukasa@boychild.demo',
    fullName: 'David Mukasa',
    phone: '+256782555111',
    role: 'boy',
    status: 'active',
    ageCategory: 'child_5_17',
    membershipNumber: 'BCA-UG-2026-0101',
    membershipIssuedAt: '2026-08-14T08:35:00Z',
    membershipQrToken: 'QR-BCA101UG',
    emailVerified: true,
    district: 'Kampala',
    town: 'Old Kampala',
    calculatedAge: 17,
    guardianId: 'usr_guardian_grace',
    guardianName: 'Grace Mukasa',
    guardianPhone: '+256772334455',
    circleId: 'circle_kampala_central',
    schoolOrOccupation: 'Old Kampala SS S.4',
    interests: ['Brothers in Purpose Mentorship', 'Robotics & Electronics'],
    createdAt: '2026-08-14T08:00:00Z',
    updatedAt: '2026-11-01T12:00:00Z',
    createdBy: 'system',
  },
  usr_young_adult: {
    uid: 'usr_young_adult',
    email: 'samuel.kiggundu@boychild.demo',
    fullName: 'Samuel Kiggundu',
    phone: '+256704221199',
    role: 'boy',
    status: 'active',
    ageCategory: 'young_adult_18_35',
    membershipNumber: 'BCA-UG-2026-0102',
    membershipIssuedAt: '2026-09-03T10:05:00Z',
    membershipQrToken: 'QR-BCA102UG',
    emailVerified: true,
    district: 'Kampala',
    town: 'Nakawa Division',
    calculatedAge: 21,
    circleId: 'circle_kampala_central',
    schoolOrOccupation: 'Nakawa Vocational Solar Apprentice',
    interests: ['Digital Crafts & Solar Tinkering', 'School Vanguard Leadership'],
    createdAt: '2026-09-02T09:00:00Z',
    updatedAt: '2026-11-05T11:00:00Z',
    createdBy: 'usr_young_adult',
  },
  usr_boy_wakiso: {
    uid: 'usr_boy_wakiso',
    email: 'brian.ssemogerere@boychild.demo',
    fullName: 'Brian Ssemogerere',
    phone: '+256774119988',
    role: 'boy',
    status: 'active',
    ageCategory: 'child_5_17',
    membershipNumber: 'BCA-UG-2026-0103',
    membershipIssuedAt: '2026-09-18T10:00:00Z',
    membershipQrToken: 'QR-BCA103UG',
    emailVerified: true,
    district: 'Wakiso',
    town: 'Kira Town Council',
    calculatedAge: 16,
    guardianId: 'usr_guardian_grace',
    guardianName: 'Grace Mukasa',
    guardianPhone: '+256772334455',
    circleId: 'circle_wakiso_builders',
    schoolOrOccupation: 'St. Lucia Kira SS S.3',
    interests: ['Digital Crafts & Solar Tinkering', 'Clean Energy Trades'],
    createdAt: '2026-09-18T09:00:00Z',
    updatedAt: '2026-11-02T10:00:00Z',
    createdBy: 'system',
  },
  usr_guardian_grace: {
    uid: 'usr_guardian_grace',
    email: 'grace.mukasa@boychild.demo',
    fullName: 'Grace Mukasa',
    phone: '+256772334455',
    role: 'guardian',
    status: 'active',
    ageCategory: 'adult',
    emailVerified: true,
    district: 'Wakiso',
    town: 'Kira Town Council',
    createdAt: '2026-08-10T09:00:00Z',
    updatedAt: '2026-11-10T10:00:00Z',
    createdBy: 'usr_guardian_grace',
  },
  usr_mentor_okello: {
    uid: 'usr_mentor_okello',
    email: 'emmanuel.okello@boychild.demo',
    fullName: 'Emmanuel Okello',
    phone: '+256772987654',
    role: 'mentor',
    status: 'active',
    ageCategory: 'adult',
    emailVerified: true,
    district: 'Kampala',
    town: 'Makerere / Old Kampala',
    circleId: 'circle_kampala_central',
    createdAt: '2026-06-01T08:00:00Z',
    updatedAt: '2026-10-15T10:00:00Z',
    createdBy: 'admin',
  },
  usr_partner_school: {
    uid: 'usr_partner_school',
    email: 'headteacher@mengohigh.ac.ug',
    fullName: 'Peter Ssempijja (Mengo Vanguard Partner)',
    phone: '+256752118899',
    role: 'partner',
    status: 'active',
    ageCategory: 'adult',
    emailVerified: true,
    district: 'Kampala',
    town: 'Mengo',
    createdAt: '2026-05-12T08:00:00Z',
    updatedAt: '2026-10-20T10:00:00Z',
    createdBy: 'admin',
  },
  usr_coordinator_events: {
    uid: 'usr_coordinator_events',
    email: 'joseph.wasswa@boychild.org',
    fullName: 'Joseph Wasswa (Events Coord)',
    phone: '+256752440011',
    role: 'coordinator',
    status: 'active',
    ageCategory: 'adult',
    safeguardingCleared: false,
    emailVerified: true,
    district: 'Wakiso',
    town: 'Kira Town Council',
    createdAt: '2026-04-12T08:00:00Z',
    updatedAt: '2026-11-02T09:00:00Z',
    createdBy: 'admin',
  },
  usr_coordinator_sarah: {
    uid: 'usr_coordinator_sarah',
    email: 'sarah.nabirye@boychild.org',
    fullName: 'Sister Sarah Nabirye',
    phone: '+256772001122',
    role: 'coordinator',
    status: 'active',
    ageCategory: 'adult',
    safeguardingCleared: true,
    emailVerified: true,
    district: 'Kampala',
    town: 'Kampala Central',
    createdAt: '2026-01-10T08:00:00Z',
    updatedAt: '2026-11-01T09:00:00Z',
    createdBy: 'admin',
  },
  usr_instructor_musoke: {
    uid: 'usr_instructor_musoke',
    email: 'isaac.musoke@boychild.org',
    fullName: 'Eng. Isaac Musoke',
    phone: '+256772550190',
    role: 'instructor',
    status: 'active',
    ageCategory: 'adult',
    instructorAuthorized: true,
    instructorSpecialty: 'Solar PV Engineering & Digital Electronics',
    instructorBio: 'Uganda certified solar technician and lead vocational instructor across Kampala and Wakiso circles.',
    emailVerified: true,
    district: 'Kampala',
    town: 'Nakawa',
    createdAt: '2026-03-01T08:00:00Z',
    updatedAt: '2026-11-05T08:00:00Z',
    createdBy: 'usr_admin_kato',
  },
  usr_learning_manager_namono: {
    uid: 'usr_learning_manager_namono',
    email: 'florence.namono@boychild.org',
    fullName: 'Florence Namono',
    phone: '+256752771188',
    role: 'learning_manager',
    status: 'active',
    ageCategory: 'adult',
    instructorAuthorized: true,
    emailVerified: true,
    district: 'Kampala',
    town: 'Old Kampala',
    createdAt: '2026-02-01T08:00:00Z',
    updatedAt: '2026-11-10T08:00:00Z',
    createdBy: 'usr_admin_kato',
  },
  usr_admin_kato: {
    uid: 'usr_admin_kato',
    email: 'mukasa.kato@boychild.org',
    fullName: 'Dr. Mukasa Kato',
    phone: '+256782000001',
    role: 'admin',
    status: 'active',
    ageCategory: 'adult',
    safeguardingCleared: true,
    instructorAuthorized: true,
    emailVerified: true,
    district: 'Kampala',
    town: 'Kololo',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2026-11-11T12:00:00Z',
    createdBy: 'system',
  },
};

const INITIAL_GUARDIAN_LINKS: GuardianLink[] = [
  {
    id: 'usr_guardian_grace_usr_boy_active',
    guardianId: 'usr_guardian_grace',
    guardianName: 'Grace Mukasa',
    guardianPhone: '+256772334455',
    boyId: 'usr_boy_active',
    boyName: 'David Mukasa',
    relationship: 'mother',
    verificationCode: 'BCA-841920',
    verificationMethod: 'coordinator_id_check',
    authorityEvidence: 'National ID verified at Old Kampala Circle Intake + Birth Certificate Ref #OK-418',
    verifiedBy: 'Sister Sarah Nabirye',
    status: 'verified',
    verifiedAt: '2026-08-14T08:20:00Z',
    createdAt: '2026-08-14T08:15:00Z',
    updatedAt: '2026-08-14T08:20:00Z',
    createdBy: 'usr_guardian_grace',
  },
  {
    id: 'usr_guardian_grace_usr_boy_pending',
    guardianId: 'usr_guardian_grace',
    guardianName: 'Grace Mukasa',
    guardianPhone: '+256772334455',
    boyId: 'usr_boy_pending',
    boyName: 'John Baptist Ssemwogerere',
    relationship: 'legal_guardian',
    verificationCode: 'BCA-552109',
    verificationMethod: 'child_code_confirmation',
    authorityEvidence: 'Kira SS Patron Attestation Letter #KSS-2026-09 + Child OTP Code BCA-552109',
    verifiedBy: 'Child Code Confirmation',
    status: 'verified',
    verifiedAt: '2026-11-10T10:05:00Z',
    createdAt: '2026-11-10T10:00:00Z',
    updatedAt: '2026-11-10T10:05:00Z',
    createdBy: 'usr_guardian_grace',
  },
];

const INITIAL_CONSENT_RECORDS: ConsentRecord[] = [
  {
    id: 'consent_01',
    boyId: 'usr_boy_active',
    boyName: 'David Mukasa',
    guardianId: 'usr_guardian_grace',
    guardianName: 'Grace Mukasa',
    action: 'granted',
    consentVersion: '2026.1',
    method: 'sms_otp',
    verificationMethod: 'coordinator_id_check',
    authorityEvidence: 'National ID verified in-person + Mother SMS OTP +256772334455',
    createdAt: '2026-08-14T08:30:00Z',
    createdBy: 'usr_guardian_grace',
  },
];

const INITIAL_MEMBERSHIP_APPS: MembershipApplication[] = [
  {
    id: 'mem_app_1',
    applicantUid: 'usr_boy_pending',
    fullName: 'John Baptist Ssemwogerere',
    dateOfBirth: '2011-05-19',
    calculatedAge: 15,
    ageCategory: 'child_5_17',
    district: 'Wakiso',
    town: 'Kira Town Council',
    schoolOrOccupation: 'Kira Secondary School S.2',
    interests: ['Brothers in Purpose Mentorship', 'Digital Crafts & Solar Tinkering'],
    guardianName: 'Grace Mukasa',
    guardianPhone: '+256772334455',
    status: 'pending',
    createdAt: '2026-11-10T10:00:00Z',
    updatedAt: '2026-11-10T10:00:00Z',
    createdBy: 'usr_boy_pending',
  },
  {
    id: 'mem_app_2',
    applicantUid: 'usr_young_adult',
    fullName: 'Samuel Kiggundu',
    dateOfBirth: '2005-03-11',
    calculatedAge: 21,
    ageCategory: 'young_adult_18_35',
    district: 'Kampala',
    town: 'Nakawa',
    schoolOrOccupation: 'Nakawa Vocational Solar Apprentice',
    interests: ['Digital Crafts & Solar Tinkering'],
    status: 'approved',
    reviewedBy: 'usr_coordinator_sarah',
    createdAt: '2026-09-02T09:00:00Z',
    updatedAt: '2026-09-03T10:00:00Z',
    createdBy: 'usr_young_adult',
  },
];

const INITIAL_CIRCLE_MEMBERSHIPS: CircleMembership[] = [
  {
    id: 'circle_kampala_central_usr_boy_active',
    circleId: 'circle_kampala_central',
    userId: 'usr_boy_active',
    memberName: 'David Mukasa',
    ageCategory: 'child_5_17',
    leadMentorId: 'usr_mentor_okello',
    status: 'active',
    createdAt: '2026-08-14T09:00:00Z',
    updatedAt: '2026-08-14T09:00:00Z',
  },
  {
    id: 'circle_kampala_central_usr_young_adult',
    circleId: 'circle_kampala_central',
    userId: 'usr_young_adult',
    memberName: 'Samuel Kiggundu',
    ageCategory: 'young_adult_18_35',
    leadMentorId: 'usr_mentor_okello',
    status: 'active',
    createdAt: '2026-09-03T11:00:00Z',
    updatedAt: '2026-09-03T11:00:00Z',
  },
  {
    id: 'circle_wakiso_builders_usr_boy_wakiso',
    circleId: 'circle_wakiso_builders',
    userId: 'usr_boy_wakiso',
    memberName: 'Brian Ssemogerere',
    ageCategory: 'child_5_17',
    leadMentorId: 'usr_mentor_dennis',
    status: 'active',
    createdAt: '2026-09-18T10:15:00Z',
    updatedAt: '2026-09-18T10:15:00Z',
  },
];

const INITIAL_SESSIONS: CircleSession[] = [
  {
    id: 'sess_1',
    circleId: 'circle_kampala_central',
    title: 'Module 4: Managing Anger and Peer Pressure',
    theme: 'Emotional Regulation',
    scheduledAt: '2026-11-14T10:00:00Z',
    location: 'Old Kampala Community Centre, Room 2',
    mentorId: 'usr_mentor_okello',
    mentorName: 'Emmanuel Okello',
    notes: 'Bring your reflection journal. We will role-play resisting dangerous peer bets.',
    completed: false,
  },
  {
    id: 'sess_2',
    circleId: 'circle_kampala_central',
    title: 'Module 5: Setting Real-World Academic & Craft Goals',
    theme: 'Future Pathways',
    scheduledAt: '2026-11-21T10:00:00Z',
    location: 'Old Kampala Community Centre, Room 2',
    mentorId: 'usr_mentor_okello',
    mentorName: 'Emmanuel Okello',
    notes: 'Guest speaker: Senior Solar Technician Patrick from Nakawa VTI.',
    completed: false,
  },
];

const INITIAL_ATTENDANCE: AttendanceRecord[] = [
  {
    id: 'att_1',
    sessionId: 'sess_prev_0',
    circleId: 'circle_kampala_central',
    memberId: 'usr_boy_active',
    memberName: 'David Mukasa',
    mentorId: 'usr_mentor_okello',
    status: 'present',
    date: '2026-11-07',
    createdAt: '2026-11-07T11:00:00Z',
  },
  {
    id: 'att_2',
    sessionId: 'sess_prev_0',
    circleId: 'circle_kampala_central',
    memberId: 'usr_young_adult',
    memberName: 'Samuel Kiggundu',
    mentorId: 'usr_mentor_okello',
    status: 'present',
    date: '2026-11-07',
    createdAt: '2026-11-07T11:00:00Z',
  },
];

const INITIAL_GOALS: Goal[] = [
  {
    id: 'goal_1',
    userId: 'usr_boy_active',
    circleId: 'circle_kampala_central',
    title: 'Improve O-Level Mathematics from C to B+',
    category: 'Education',
    progress: 75,
    targetDate: '2026-12-05',
    notes: 'Attending weekly Saturday study group with mentor Emmanuel. Finished past papers for 2022-2024.',
    completed: false,
    createdAt: '2026-10-01T08:00:00Z',
    updatedAt: '2026-11-08T14:30:00Z',
  },
  {
    id: 'goal_2',
    userId: 'usr_boy_active',
    circleId: 'circle_kampala_central',
    title: 'Complete Solar Inverter Wiring Certificate',
    category: 'Career & Craft',
    progress: 100,
    targetDate: '2026-11-01',
    notes: 'Passed practical test on household solar battery circuit assembly.',
    completed: true,
    createdAt: '2026-09-15T09:00:00Z',
    updatedAt: '2026-11-01T16:00:00Z',
  },
  {
    id: 'goal_3',
    userId: 'usr_young_adult',
    circleId: 'circle_kampala_central',
    title: 'Lead Peer Mentoring for 3 Younger Apprentices',
    category: 'Community Service',
    progress: 60,
    targetDate: '2026-12-10',
    notes: 'Co-facilitating Saturday vocational bench safety briefings.',
    completed: false,
    createdAt: '2026-10-18T11:00:00Z',
    updatedAt: '2026-11-10T15:00:00Z',
  },
];

const INITIAL_QUESTIONS: Question[] = [
  {
    id: 'q_1',
    circleId: 'circle_kampala_central',
    userId: 'usr_boy_active',
    authorAlias: 'Young Pioneer',
    isAnonymous: true,
    category: 'academic',
    question: 'How do I balance studying for final exams when I also have to help my family at the market after school?',
    mentorReply: 'Musa, this is a very common challenge for many hardworking young men. Focus on 45-minute focused blocks early in the morning before market hours. We will also help you create a realistic weekly timetable in Saturday’s circle.',
    repliedByMentorName: 'Emmanuel Okello',
    repliedAt: '2026-11-09T16:45:00Z',
    isModerated: true,
    createdAt: '2026-11-08T12:00:00Z',
  },
  {
    id: 'q_2',
    circleId: 'circle_kampala_central',
    userId: 'usr_boy_active',
    authorAlias: 'David Mukasa',
    isAnonymous: false,
    category: 'life_skills',
    question: 'What is the best way to handle friends who laugh at you when you refuse to drink alcohol or join street gambling?',
    mentorReply: 'True strength is saying no when everyone is drifting. When you stand firm with calm confidence, the same friends often privately ask you for advice later. Your circle always has your back.',
    repliedByMentorName: 'Emmanuel Okello',
    repliedAt: '2026-11-10T10:15:00Z',
    isModerated: true,
    createdAt: '2026-11-09T18:30:00Z',
  },
];

const INITIAL_CONCERN_REPORTS: ConcernReport[] = [
  {
    id: 'rep_101',
    refNumber: 'BCA-SG-2026-1010',
    isAnonymous: false,
    reporterName: 'Grace Mukasa',
    reporterContact: '+256772334455',
    boyName: 'Kato Ronald',
    district: 'Wakiso',
    concernCategory: 'bullying_or_violence',
    urgency: 'high',
    details: 'Older boys in the neighbourhood have been taking school fees from younger primary boys near the railway crossing. Kato came home visibly frightened and had his bag torn.',
    status: 'investigating',
    assignedCoordinator: 'Sister Sarah Nabirye',
    triageNotes: 'Contacted Wakiso community liaison officer and spoke to school headmaster. Safe transit escort arranged with parent committee.',
    createdAt: '2026-11-09T09:15:00Z',
    updatedAt: '2026-11-10T14:00:00Z',
  },
  {
    id: 'rep_102',
    refNumber: 'BCA-SG-2026-1024',
    isAnonymous: true,
    district: 'Kampala',
    concernCategory: 'emotional_distress',
    urgency: 'medium',
    details: 'A member of our circle has stopped attending school for 2 weeks after losing his older brother. He sits alone near the park and appears severely depressed.',
    status: 'new',
    assignedCoordinator: 'Sister Sarah Nabirye',
    triageNotes: 'Scheduled a home pastoral visit with local counselor for Friday morning.',
    createdAt: '2026-11-11T14:30:00Z',
    updatedAt: '2026-11-11T14:30:00Z',
  },
];

const INITIAL_SAFEGUARDING_CASES: SafeguardingCase[] = [
  {
    id: 'case_101',
    refNumber: 'BCA-SG-2026-1010',
    reportId: 'rep_101',
    urgency: 'high',
    district: 'Wakiso',
    concernCategory: 'bullying_or_violence',
    summary: 'Safety risk reported near Wakiso railway school route; guardian alerted.',
    status: 'under_review',
    assignedLeadId: 'usr_coordinator_sarah',
    assignedLeadName: 'Sister Sarah Nabirye',
    triageNotes: 'Contacted Wakiso community liaison officer and school headteacher. Transit escort group initiated.',
    escalationChannel: 'District Probation Officer',
    escalationRef: 'WAK-PO-2026-044',
    followUps: [
      {
        id: 'fu_101_1',
        timestamp: '2026-11-09T11:30:00Z',
        authorId: 'usr_coordinator_sarah',
        authorName: 'Sister Sarah Nabirye',
        actionTaken: 'Called school patron teacher and Wakiso LC1 Community Liaison Officer.',
        nextReviewDate: '2026-11-15',
        outcome: 'Morning/evening supervised student walking group established.',
      },
    ],
    createdAt: '2026-11-09T09:15:00Z',
    updatedAt: '2026-11-10T14:00:00Z',
    createdBy: 'system',
  },
  {
    id: 'case_102',
    refNumber: 'BCA-SG-2026-1024',
    reportId: 'rep_102',
    urgency: 'medium',
    district: 'Kampala',
    concernCategory: 'emotional_distress',
    summary: 'Bereavement and acute social withdrawal flagged in Kampala circle.',
    status: 'follow_up',
    assignedLeadId: 'usr_coordinator_sarah',
    assignedLeadName: 'Sister Sarah Nabirye',
    triageNotes: 'Home pastoral support and professional youth counselling referral initiated.',
    followUps: [
      {
        id: 'fu_102_1',
        timestamp: '2026-11-11T16:10:00Z',
        authorId: 'usr_coordinator_sarah',
        authorName: 'Sister Sarah Nabirye',
        actionTaken: 'Arranged pastoral home visit with Two-Adult accompaniment team.',
        nextReviewDate: '2026-11-18',
        outcome: 'Boy attended Saturday quiet check-in; grief counselling intake confirmed.',
      },
    ],
    createdAt: '2026-11-11T14:30:00Z',
    updatedAt: '2026-11-11T14:30:00Z',
    createdBy: 'system',
  },
];

const INITIAL_MENTOR_APPLICATIONS: MentorApplication[] = [
  {
    id: 'app_mentor_brian',
    fullName: 'Brian Mukwaya',
    email: 'brian.mukwaya@uganda.edu',
    phone: '+256701445566',
    district: 'Mukono',
    occupation: 'Secondary School Physics Teacher',
    motivation: 'I was raised by a single mother and know firsthand how young boys drift without elder guidance. I want to volunteer every Saturday to mentor young boys in academic persistence and solar electronics.',
    availability: 'weekends',
    safeguardingTrainingAccepted: true,
    referee1: { name: 'Rev. Samuel Kato', phone: '+256772889900', status: 'verified' },
    referee2: { name: 'Madam Beatrice Nansubuga', phone: '+256755112233', status: 'pending' },
    dbsSafeguardingCheck: 'cleared',
    status: 'pending_vetting',
    createdAt: '2026-11-08T11:20:00Z',
  },
];

const INITIAL_MENTOR_REFEREES: MentorReferee[] = [
  {
    id: 'app_mentor_brian_ref1',
    applicationId: 'app_mentor_brian',
    mentorUid: 'app_mentor_brian',
    refereeIndex: 1,
    name: 'Rev. Samuel Kato',
    phone: '+256772889900',
    relationship: 'Parish Community Leader',
    status: 'verified',
    verifiedBy: 'Sister Sarah Nabirye',
    notes: 'Confirmed 7 years of exemplary youth teaching in Mukono.',
    updatedAt: '2026-11-09T12:00:00Z',
  },
  {
    id: 'app_mentor_brian_ref2',
    applicationId: 'app_mentor_brian',
    mentorUid: 'app_mentor_brian',
    refereeIndex: 2,
    name: 'Madam Beatrice Nansubuga',
    phone: '+256755112233',
    relationship: 'Headmistress, Mukono High',
    status: 'pending',
    updatedAt: '2026-11-08T11:20:00Z',
  },
];

const INITIAL_PARTNERS: PartnerOrganisation[] = [
  {
    id: 'partner_mengo',
    ownerUid: 'usr_partner_school',
    orgName: 'Mengo High School Vanguard Chapter',
    orgType: 'school',
    contactPerson: 'Peter Ssempijja',
    phone: '+256752118899',
    email: 'headteacher@mengohigh.ac.ug',
    district: 'Kampala',
    status: 'verified',
    vanguardClubActive: true,
    approvedEventsCount: 4,
    createdAt: '2026-05-12T08:00:00Z',
  },
];

const INITIAL_PARTNER_APPS: PartnerApplication[] = [
  {
    id: 'papp_1',
    applicantUid: 'usr_partner_school',
    orgName: 'Mengo High School Vanguard Chapter',
    orgType: 'school',
    contactPerson: 'Peter Ssempijja',
    phone: '+256752118899',
    email: 'headteacher@mengohigh.ac.ug',
    district: 'Kampala',
    applicationType: 'vanguard_club',
    proposal: 'Establish a weekly Friday anti-bullying and peer tutoring Vanguard Club for 60 S.1–S.4 boys supervised by two senior teachers.',
    status: 'approved',
    activityNotes: 'Term 3 anti-bullying assembly scheduled for Nov 28.',
    createdAt: '2026-05-10T09:00:00Z',
    updatedAt: '2026-05-12T08:00:00Z',
  },
];

const INITIAL_EVENTS: BcaEvent[] = [
  {
    id: 'evt_1',
    title: 'Kampala Inter-Circle Solar & Career Clinic',
    category: 'Skills Workshop',
    district: 'Kampala',
    location: 'Nakawa Vocational Training Institute Hall',
    startsAt: '2026-11-28T09:30:00Z',
    description: 'Hands-on demonstration of off-grid solar installation, computer coding, and apprenticeship pathways for ages 13–24.',
    circleId: 'circle_kampala_central',
    capacity: 80,
    registeredCount: 46,
    status: 'published',
  },
  {
    id: 'evt_2',
    title: 'Parents & Guardians Positive Parenting Forum',
    category: 'Guardian Dialogue',
    district: 'Wakiso',
    location: 'Kira Community Hall',
    startsAt: '2026-12-06T14:00:00Z',
    description: 'Interactive workshop on emotional coaching, adolescent digital safety, and Uganda Children Act safeguarding.',
    capacity: 60,
    registeredCount: 34,
    status: 'published',
  },
  {
    id: 'evt_3',
    title: 'Mengo School Vanguard Anti-Bullying Day',
    category: 'School Vanguard',
    district: 'Kampala',
    location: 'Mengo High School Main Quadrangle',
    startsAt: '2026-11-29T10:00:00Z',
    description: 'Boy-led leadership showcase promoting dignity, respect for girls and women, and peer academic support.',
    partnerId: 'partner_mengo',
    capacity: 150,
    registeredCount: 112,
    status: 'published',
  },
];

const INITIAL_EVENT_REGISTRATIONS: EventRegistration[] = [
  {
    id: 'ereg_1',
    eventId: 'evt_1',
    userId: 'usr_boy_active',
    attendeeName: 'David Mukasa',
    attendeeEmail: 'david.mukasa@boychild.demo',
    attendeeRole: 'boy',
    district: 'Kampala',
    confirmationCode: 'BCA-EVT-4102',
    attendanceStatus: 'registered',
    registeredAt: '2026-11-10T09:00:00Z',
  },
  {
    id: 'ereg_2',
    eventId: 'evt_1',
    userId: 'usr_young_adult',
    attendeeName: 'Samuel Kiggundu',
    attendeeEmail: 'samuel.kiggundu@boychild.demo',
    attendeeRole: 'boy',
    district: 'Kampala',
    confirmationCode: 'BCA-EVT-4109',
    attendanceStatus: 'present',
    markedBy: 'Emmanuel Okello',
    registeredAt: '2026-11-10T11:30:00Z',
  },
];

const INITIAL_RESOURCES: LearningResource[] = [
  {
    id: 'res_1',
    title: 'BCA Uganda Child Safeguarding & Two-Adult Field Handbook',
    category: 'Safeguarding',
    audience: 'all',
    summary: 'Clear standards governing circle safety, zero private 1:1 minor messaging, and Sauti 116 emergency escalation.',
    readTimeMinutes: 8,
    contentBody: 'All BCA activities strictly enforce the Two-Adult Rule. Mentors and partners never conduct private one-on-one digital messaging or unapproved home visits with any minor under 18.',
    status: 'published',
    updatedAt: '2026-10-20T09:00:00Z',
  },
  {
    id: 'res_2',
    title: 'Standing Up As A Man: 8-Week Integrity & Character Curriculum',
    category: 'Mentorship Guide',
    audience: 'boys',
    summary: 'Reflective exercises on emotional honesty, handling peer pressure, academic grit, and respectful leadership.',
    readTimeMinutes: 12,
    contentBody: 'Module 1: Honouring Yourself & Others. Module 2: Naming Anger Before It Speaks. Module 3: Practical Stewardship & Time Habits.',
    status: 'published',
    updatedAt: '2026-11-01T12:00:00Z',
  },
  {
    id: 'res_3',
    title: 'Guardian Guide: Supporting Adolescent Boys Under Uganda DPPA 2019',
    category: 'Parenting',
    audience: 'guardians',
    summary: 'How consent verification, digital monitoring, and constructive dialogue protect teenage boys.',
    readTimeMinutes: 6,
    contentBody: 'Under Uganda’s Children Act and Data Protection Act 2019, parents and guardians retain full visibility over circle attendance and may revoke minor consent at any moment.',
    status: 'published',
    updatedAt: '2026-10-28T10:00:00Z',
  },
];

const INITIAL_ANNOUNCEMENTS: AnnouncementItem[] = [
  {
    id: 'ann_1',
    title: 'Gulu & Mbale Community Circles Expand to 3 New Schools',
    summary: 'Over 140 boys joined Saturday mentorship and solar tinkering cohorts across northern and eastern Uganda chapters.',
    body: 'Working alongside vetted school headteachers and district probation officers, Boy Child Association opened three new supervised neighbourhood circles this term.',
    type: 'news',
    district: 'Gulu',
    publishedDate: '2026-11-05',
    status: 'published',
  },
  {
    id: 'ann_2',
    title: 'Community Story: From Truancy to Solar Workshop Lead in Old Kampala',
    summary: 'How 19-year-old circle graduate Hassan now helps mentor younger apprentices in practical solar repair.',
    body: 'After two years in Kampala Central Champions Circle and passing his vocational assessment, Hassan co-leads basic multimeter training every Saturday.',
    type: 'story',
    district: 'Kampala',
    publishedDate: '2026-10-24',
    status: 'published',
  },
];

const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif_1',
    userId: 'usr_boy_active',
    title: 'Saturday Circle Session Confirmed',
    message: 'Kampala Central Champions Circle meets Saturday 10:00 AM at Old Kampala Community Centre.',
    category: 'circle',
    read: false,
    createdAt: '2026-11-11T08:00:00Z',
  },
  {
    id: 'notif_2',
    userId: 'usr_guardian_grace',
    title: 'Guardian Consent Action Pending',
    message: 'John Baptist Ssemwogerere is awaiting your formal safeguarding consent review in the Guardian Portal.',
    category: 'consent',
    read: false,
    createdAt: '2026-11-10T10:05:00Z',
  },
];

const INITIAL_DPPA_REQUESTS: DppaRequest[] = [
  {
    id: 'dppa_1',
    userId: 'usr_guardian_grace',
    userName: 'Grace Mukasa',
    type: 'export',
    reason: 'Requested personal and linked child attendance copy under Uganda DPPA 2019.',
    status: 'completed',
    createdAt: '2026-11-04T11:00:00Z',
  },
];

const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'log_01',
    action: 'GUARDIAN_CONSENT_APPROVED',
    performedBy: 'Grace Mukasa (Guardian)',
    performedByRole: 'guardian',
    targetEntity: 'users',
    targetId: 'usr_boy_active',
    details: 'Digital safeguarding consent verified with SMS authentication +256772334455',
    timestamp: '2026-08-14T08:30:00Z',
  },
  {
    id: 'log_02',
    action: 'CIRCLE_MEMBER_ASSIGNED',
    performedBy: 'Sister Sarah Nabirye',
    performedByRole: 'coordinator',
    targetEntity: 'mentorshipCircles',
    targetId: 'circle_kampala_central',
    details: 'Assigned David Mukasa to Kampala Central Champions Circle after parental consent',
    timestamp: '2026-08-14T09:00:00Z',
  },
  {
    id: 'log_03',
    action: 'SAFEGUARDING_TRIAGE_OPENED',
    performedBy: 'Sister Sarah Nabirye',
    performedByRole: 'coordinator',
    targetEntity: 'safeguardingCases',
    targetId: 'case_101',
    details: 'High-urgency case opened: Community liaison alerted regarding school route safety',
    timestamp: '2026-11-09T09:30:00Z',
  },
];

const INITIAL_CMS_SETTINGS: CmsSettingsBundle = {
  heroHeadline: 'Every boy deserves a circle that has his back.',
  heroSubheadline: 'The Boy Child Association unites, guides, and empowers boys and young men across Uganda. Through safe neighborhood circles, principled mentors, and practical vocational skills, we foster resilient, respectful, and purposeful leaders.',
  motto: 'Standing Up As A Man',
  whatsappNumber: '0732320190',
  helplineNumber: '116',
  email: 'safeguarding@boychild.org',
  headquartersAddress: 'Kampala Headquarters, Old Kampala Community Wing, Uganda',
  stats: {
    activeBoys: '1,200+',
    vettedMentors: '85+',
    districts: '14',
    partnerSchools: '28',
  },
  faqs: [
    {
      id: 'faq_1',
      question: 'Is parent or guardian consent mandatory for boys under 18?',
      answer: 'Yes. Under Uganda Children Act (Cap 59), every boy aged 5–17 remains locked in pending_guardian_consent until a verified guardian reviews and submits consent.',
    },
    {
      id: 'faq_2',
      question: 'Can mentors send private one-on-one messages to boys?',
      answer: 'No. Private 1-on-1 direct messaging between mentors and minors is strictly prohibited in policy and blocked technically on this platform.',
    },
    {
      id: 'faq_3',
      question: 'How do guardians verify or withdraw consent?',
      answer: 'Guardians link to their child via a unique verification code and can grant or withdraw consent at any time inside the Guardian Portal.',
    },
  ],
  retentionDays: {
    membershipApps: 365,
    auditLogs: 2555,
    safeguardingCasesYears: 25,
  },
  status: 'published',
  updatedAt: '2026-11-11T08:00:00Z',
};

const INITIAL_CONTACT_MESSAGES: ContactMessage[] = [
  {
    id: 'cmsg_1',
    fullName: 'Grace Nabukenya',
    email: 'grace.nabukenya@school.ug',
    phone: '+256772456789',
    subject: 'Establishing a Boys Vanguard Club in Mukono',
    message: 'Our secondary school has 140 boys in S.1–S.4 and would love to invite a BCA coordinator to orient teachers on Vanguard Club safeguarding standards.',
    status: 'new',
    createdAt: '2026-11-11T09:10:00Z',
    updatedAt: '2026-11-11T09:10:00Z',
  },
];

const INITIAL_PROGRESS_REPORTS: MentorProgressReport[] = [
  {
    id: 'prep_1',
    circleId: 'circle_kampala_central',
    circleName: 'Kampala Central Champions Circle',
    mentorId: 'usr_mentor_okello',
    mentorName: 'Emmanuel Okello',
    reportingPeriod: 'November 2026 — Week 2',
    attendanceSummary: '9 of 12 active boys attended Saturday session; 2 excused for UNEB mock revision.',
    keyMilestones: 'Boys completed Module 4 peer-pressure role plays and updated academic study timetables.',
    safeguardingObservations: 'Zero safeguarding incidents. Two-Adult rule maintained throughout; guardians notified of holiday clinic.',
    supportNeeded: 'Extra solar multimeter kits for next practical workshop.',
    createdAt: '2026-11-10T15:30:00Z',
    updatedAt: '2026-11-10T15:30:00Z',
  },
];

class MockStore {
  users: Record<string, AppUser>;
  memberProfiles: Record<string, MemberProfile>;
  guardianLinks: GuardianLink[];
  consentRecords: ConsentRecord[];
  membershipApplications: MembershipApplication[];
  programmes: Programme[];
  circles: Circle[];
  circleMemberships: CircleMembership[];
  sessions: CircleSession[];
  attendance: AttendanceRecord[];
  goals: Goal[];
  questions: Question[];
  concernReports: ConcernReport[];
  safeguardingCases: SafeguardingCase[];
  mentorApplications: MentorApplication[];
  mentorReferees: MentorReferee[];
  partners: PartnerOrganisation[];
  partnerApplications: PartnerApplication[];
  events: BcaEvent[];
  eventRegistrations: EventRegistration[];
  learningResources: LearningResource[];
  announcements: AnnouncementItem[];
  notifications: AppNotification[];
  dppaRequests: DppaRequest[];
  auditLogs: AuditLogEntry[];
  cmsSettings: CmsSettingsBundle;
  contactMessages: ContactMessage[];
  progressReports: MentorProgressReport[];
  courses: Course[];
  courseModules: CourseModule[];
  courseLessons: CourseLesson[];
  courseAssets: CourseAsset[];
  instructorAssignments: InstructorAssignment[];
  courseEnrollments: CourseEnrollment[];
  lessonProgress: LessonProgress[];
  assessments: Assessment[];
  assessmentQuestions: AssessmentQuestion[];
  assessmentAnswerKeys: AssessmentAnswerKey[];
  assessmentAttempts: AssessmentAttempt[];
  assignmentSubmissions: AssignmentSubmission[];
  courseSessions: CourseSession[];
  zoomMeetings: ZoomMeetingRecord[];
  zoomMeetingSecrets: Record<string, { joinUrl: string; startUrl: string; passcode: string }>;
  sessionAttendance: SessionAttendance[];
  courseAnnouncements: CourseAnnouncement[];
  certificates: CourseCertificate[];
  certificateVerifications: Record<string, CertificateVerificationRecord>;
  learningNotifications: LearningNotification[];
  zoomConfig: ZoomConfigStatus;
  courseCategories: string[];
  currentUserUid: string;

  constructor() {
    this.users = { ...INITIAL_USERS };
    this.memberProfiles = {
      usr_boy_active: {
        uid: 'usr_boy_active',
        fullName: 'David Mukasa',
        ageCategory: 'child_5_17',
        calculatedAge: 17,
        status: 'active',
        district: 'Kampala',
        town: 'Old Kampala',
        schoolOrOccupation: 'Old Kampala SS S.4',
        interests: ['Brothers in Purpose Mentorship', 'Robotics & Electronics'],
        circleId: 'circle_kampala_central',
        guardianId: 'usr_guardian_grace',
        membershipNumber: 'BCA-UG-2026-0101',
        achievements: [
          { id: 'ach_1', title: 'Solar Inverter Wiring Level 1', awardedAt: '2026-11-01', badgeType: 'Skills' },
          { id: 'ach_2', title: '90-Day Circle Attendance Champion', awardedAt: '2026-10-15', badgeType: 'Brotherhood' },
        ],
        attendanceCount: 14,
        createdAt: '2026-08-14T08:00:00Z',
        updatedAt: '2026-11-01T12:00:00Z',
        createdBy: 'system',
      },
      usr_young_adult: {
        uid: 'usr_young_adult',
        fullName: 'Samuel Kiggundu',
        ageCategory: 'young_adult_18_35',
        calculatedAge: 21,
        status: 'active',
        district: 'Kampala',
        town: 'Nakawa Division',
        schoolOrOccupation: 'Nakawa Vocational Solar Apprentice',
        interests: ['Digital Crafts & Solar Tinkering'],
        circleId: 'circle_kampala_central',
        membershipNumber: 'BCA-UG-2026-0102',
        achievements: [
          { id: 'ach_3', title: 'Young Adult Peer Steward', awardedAt: '2026-10-30', badgeType: 'Leadership' },
        ],
        attendanceCount: 10,
        createdAt: '2026-09-02T09:00:00Z',
        updatedAt: '2026-11-05T11:00:00Z',
        createdBy: 'usr_young_adult',
      },
      usr_boy_wakiso: {
        uid: 'usr_boy_wakiso',
        fullName: 'Brian Ssemogerere',
        ageCategory: 'child_5_17',
        calculatedAge: 16,
        status: 'active',
        district: 'Wakiso',
        town: 'Kira Town Council',
        schoolOrOccupation: 'St. Lucia Kira SS S.3',
        interests: ['Digital Crafts & Solar Tinkering', 'Clean Energy Trades'],
        circleId: 'circle_wakiso_builders',
        guardianId: 'usr_guardian_grace',
        membershipNumber: 'BCA-UG-2026-0103',
        achievements: [
          { id: 'ach_4', title: 'Wakiso Community Clean-Up Lead', awardedAt: '2026-10-20', badgeType: 'Service' },
        ],
        attendanceCount: 9,
        createdAt: '2026-09-18T09:00:00Z',
        updatedAt: '2026-11-02T10:00:00Z',
        createdBy: 'system',
      },
    };
    this.guardianLinks = [...INITIAL_GUARDIAN_LINKS];
    this.consentRecords = [...INITIAL_CONSENT_RECORDS];
    this.membershipApplications = [...INITIAL_MEMBERSHIP_APPS];
    this.programmes = [...INITIAL_PROGRAMMES];
    this.circles = [...INITIAL_CIRCLES];
    this.circleMemberships = [...INITIAL_CIRCLE_MEMBERSHIPS];
    this.sessions = [...INITIAL_SESSIONS];
    this.attendance = [...INITIAL_ATTENDANCE];
    this.goals = [...INITIAL_GOALS];
    this.questions = [...INITIAL_QUESTIONS];
    this.concernReports = [...INITIAL_CONCERN_REPORTS];
    this.safeguardingCases = [...INITIAL_SAFEGUARDING_CASES];
    this.mentorApplications = [...INITIAL_MENTOR_APPLICATIONS];
    this.mentorReferees = [...INITIAL_MENTOR_REFEREES];
    this.partners = [...INITIAL_PARTNERS];
    this.partnerApplications = [...INITIAL_PARTNER_APPS];
    this.events = [...INITIAL_EVENTS];
    this.eventRegistrations = [...INITIAL_EVENT_REGISTRATIONS];
    this.learningResources = [...INITIAL_RESOURCES];
    this.announcements = [...INITIAL_ANNOUNCEMENTS];
    this.notifications = [...INITIAL_NOTIFICATIONS];
    this.dppaRequests = [...INITIAL_DPPA_REQUESTS];
    this.auditLogs = [...INITIAL_AUDIT_LOGS];
    this.cmsSettings = { ...INITIAL_CMS_SETTINGS };
    this.contactMessages = [...INITIAL_CONTACT_MESSAGES];
    this.progressReports = [...INITIAL_PROGRESS_REPORTS];
    this.courseCategories = [
      'Solar & Clean Energy',
      'Digital Literacy & Coding',
      'Character & Leadership',
      'Financial Stewardship',
      'Vocational Trades',
    ];
    this.courses = [
      {
        id: 'course_solar_pv',
        title: 'Solar PV & Off-Grid Electronics Fundamentals',
        description:
          'Hands-on vocational skilling equipping Ugandan youth with safe DC wiring, solar charge controller sizing, battery maintenance, and household micro-enterprise skills.',
        thumbnailUrl: '/images/programme_skills_1794461658653.jpg',
        category: 'Solar & Clean Energy',
        learningObjectives: [
          'Calculate off-grid home solar panel and battery capacity safely',
          'Wire 12V charge controllers and DC lighting protection',
          'Troubleshoot common household solar lantern faults',
        ],
        targetAudience: 'Boys 13–17 (with guardian consent) and Young Adults 18–35',
        ageEligibility: 'all_5_35',
        level: 'beginner',
        durationHours: 12,
        prerequisites: ['Basic arithmetic literacy'],
        instructorIds: ['usr_instructor_musoke'],
        instructorNames: ['Eng. Isaac Musoke'],
        learningFormat: 'blended',
        startDate: '2026-11-01',
        endDate: '2027-01-31',
        enrolmentCapacity: 60,
        enrolledCount: 2,
        status: 'published',
        approvedBy: 'Florence Namono',
        createdBy: 'usr_instructor_musoke',
        createdAt: '2026-10-15T09:00:00Z',
        updatedAt: '2026-11-10T10:00:00Z',
      },
      {
        id: 'course_digital_literacy',
        title: 'Digital Literacy, Spreadsheets & Safe Internet Citizenship',
        description:
          'Self-paced foundation covering document creation, spreadsheets for small community enterprises, online child safeguarding, and cyber hygiene.',
        thumbnailUrl: '/images/hero_boys_circle_1794461657319.jpg',
        category: 'Digital Literacy & Coding',
        learningObjectives: [
          'Create formatted study documents and community budgets',
          'Recognise and report online grooming or cyberbullying via Sauti 116',
          'Use cloud collaboration responsibly on shared circle computers',
        ],
        targetAudience: 'All BCA boys and young men aged 10–35',
        ageEligibility: 'all_5_35',
        level: 'beginner',
        durationHours: 8,
        prerequisites: [],
        instructorIds: ['usr_instructor_musoke'],
        instructorNames: ['Eng. Isaac Musoke'],
        learningFormat: 'self_paced',
        startDate: '2026-10-20',
        endDate: '2027-03-31',
        enrolmentCapacity: 120,
        enrolledCount: 1,
        status: 'published',
        approvedBy: 'Florence Namono',
        createdBy: 'usr_instructor_musoke',
        createdAt: '2026-10-20T09:00:00Z',
        updatedAt: '2026-11-09T12:00:00Z',
      },
      {
        id: 'course_financial_stewardship',
        title: 'Young Adult Financial Stewardship & Agribusiness Accounting',
        description:
          'Instructor-led cohort focused on SACCO saving discipline, mobile money bookkeeping, poultry/horticulture costing, and ethical entrepreneurship in Uganda.',
        thumbnailUrl: '/images/programme_mentorship_1794461658375.jpg',
        category: 'Financial Stewardship',
        learningObjectives: [
          'Separate personal living expenses from micro-business cashflow',
          'Prepare a 3-month enterprise profit & loss ledger',
          'Evaluate SACCO and cooperative credit responsibly',
        ],
        targetAudience: 'Young Adults aged 18–35',
        ageEligibility: 'young_adults_18_35',
        level: 'intermediate',
        durationHours: 10,
        prerequisites: ['Completion of Basic Literacy or Secondary S.2'],
        instructorIds: ['usr_instructor_musoke'],
        instructorNames: ['Eng. Isaac Musoke'],
        learningFormat: 'instructor_led',
        startDate: '2026-11-10',
        endDate: '2027-02-15',
        enrolmentCapacity: 40,
        enrolledCount: 1,
        status: 'published',
        approvedBy: 'Florence Namono',
        createdBy: 'usr_instructor_musoke',
        createdAt: '2026-11-01T08:00:00Z',
        updatedAt: '2026-11-11T08:00:00Z',
      },
      {
        id: 'course_carpentry_draft',
        title: 'Sustainable Timber Joinery & Workshop Safety',
        description: 'Pending approval course covering hand tool sharpening, mortise joints, and safety goggles discipline.',
        thumbnailUrl: '/images/programme_wellbeing_1794461659186.jpg',
        category: 'Vocational Trades',
        learningObjectives: ['Apply workshop PPE safety rules consistently'],
        targetAudience: 'Boys and young men 14–28',
        ageEligibility: 'all_5_35',
        level: 'beginner',
        durationHours: 14,
        prerequisites: [],
        instructorIds: ['usr_instructor_musoke'],
        instructorNames: ['Eng. Isaac Musoke'],
        learningFormat: 'blended',
        startDate: '2026-12-01',
        endDate: '2027-03-01',
        enrolmentCapacity: 30,
        enrolledCount: 0,
        status: 'pending_approval',
        createdBy: 'usr_instructor_musoke',
        createdAt: '2026-11-11T09:00:00Z',
        updatedAt: '2026-11-11T09:00:00Z',
      },
    ];
    this.courseModules = [
      {
        id: 'mod_solar_1',
        courseId: 'course_solar_pv',
        title: 'Module 1: Electrical Safety & Solar Components',
        description: 'DC polarity, fuse protection, and multimeter fundamentals for Ugandan off-grid homes.',
        orderIndex: 1,
        status: 'published',
        createdBy: 'usr_instructor_musoke',
        createdAt: '2026-10-15T09:30:00Z',
        updatedAt: '2026-10-15T09:30:00Z',
      },
      {
        id: 'mod_solar_2',
        courseId: 'course_solar_pv',
        title: 'Module 2: System Sizing & Charge Controller Wiring',
        description: 'Matching 12V panels, AGM batteries, and PWM/MPPT controllers.',
        orderIndex: 2,
        status: 'published',
        createdBy: 'usr_instructor_musoke',
        createdAt: '2026-10-16T09:30:00Z',
        updatedAt: '2026-10-16T09:30:00Z',
      },
      {
        id: 'mod_dig_1',
        courseId: 'course_digital_literacy',
        title: 'Module 1: Cyber Safety & Responsible Digital Footprint',
        description: 'Protecting privacy under Uganda DPPA 2019 and staying safe online.',
        orderIndex: 1,
        status: 'published',
        createdBy: 'usr_instructor_musoke',
        createdAt: '2026-10-20T09:30:00Z',
        updatedAt: '2026-10-20T09:30:00Z',
      },
    ];
    this.courseLessons = [
      {
        id: 'les_solar_1',
        courseId: 'course_solar_pv',
        moduleId: 'mod_solar_1',
        title: '1.1 Why DC Polarity Matters in Home Solar Kits',
        lessonType: 'text',
        orderIndex: 1,
        durationMinutes: 15,
        isRequired: true,
        objectives: ['Distinguish positive (red) and negative (black) DC leads', 'Select inline blade fuses correctly'],
        instructorNotes: 'Low-bandwidth readable text version paired with diagram notes for rural learners.',
        textContent:
          'Before touching any battery terminal, always verify polarity with a multimeter set to DC Volts (20V range). Reversing leads on a charge controller damages MOSFET protection diodes instantly. Connect Battery -> Charge Controller FIRST, then Solar Panel, and finally DC Loads so the controller auto-detects 12V or 24V system voltage safely.',
        transcript:
          'Welcome brothers to Module 1. Today in Kampala Nakawa Workshop we demonstrate connecting a 12V 100Ah battery before the 150W solar panel...',
        status: 'published',
        createdBy: 'usr_instructor_musoke',
        createdAt: '2026-10-15T10:00:00Z',
        updatedAt: '2026-10-15T10:00:00Z',
      },
      {
        id: 'les_solar_2',
        courseId: 'course_solar_pv',
        moduleId: 'mod_solar_1',
        title: '1.2 Multimeter Voltage & Continuity Check Study Guide',
        lessonType: 'study_notes',
        orderIndex: 2,
        durationMinutes: 20,
        isRequired: true,
        prerequisiteLessonId: 'les_solar_1',
        objectives: ['Read resting battery state of charge safely'],
        textContent:
          'A healthy resting 12V lead-acid battery reads 12.6V–12.7V. Below 11.9V indicates deep discharge; avoid running DC inverters below 11.5V to preserve battery lifespan in rural solar installations.',
        transcript: 'Study notes summary: Resting voltage reference table (12.7V = 100%, 12.2V = 50%, 11.8V = recharge immediately).',
        status: 'published',
        createdBy: 'usr_instructor_musoke',
        createdAt: '2026-10-15T10:30:00Z',
        updatedAt: '2026-10-15T10:30:00Z',
      },
      {
        id: 'les_solar_3',
        courseId: 'course_solar_pv',
        moduleId: 'mod_solar_2',
        title: '2.1 Sizing Solar Panels for 4-Room Home Lighting',
        lessonType: 'text',
        orderIndex: 1,
        durationMinutes: 25,
        isRequired: true,
        objectives: ['Compute daily Watt-hours for 4 LED bulbs and phone charging'],
        textContent:
          'Example Uganda household load: 4 x 5W LED bulbs running 5 hours/night = 100 Wh, plus phone charging 20 Wh = 120 Wh/day. Dividing by 4.5 average peak sun hours in Uganda and accounting for 25% system losses gives ~36W minimum panel; a 50W–80W panel provides rainy-season margin.',
        status: 'published',
        createdBy: 'usr_instructor_musoke',
        createdAt: '2026-10-16T10:00:00Z',
        updatedAt: '2026-10-16T10:00:00Z',
      },
      {
        id: 'les_dig_1',
        courseId: 'course_digital_literacy',
        moduleId: 'mod_dig_1',
        title: '1.1 Digital Boundaries & Reporting Unsafe Contact',
        lessonType: 'text',
        orderIndex: 1,
        durationMinutes: 15,
        isRequired: true,
        objectives: ['Identify unsafe online requests and use BCA Sauti 116 channels'],
        textContent:
          'Never share home addresses, school timetables, or private photos online with unverified strangers. On the BCA platform, minors never use 1:1 direct messages with mentors — all supervision stays transparent in group circles or live classes with Waiting Room enabled.',
        status: 'published',
        createdBy: 'usr_instructor_musoke',
        createdAt: '2026-10-20T10:00:00Z',
        updatedAt: '2026-10-20T10:00:00Z',
      },
    ];
    this.courseAssets = [
      {
        id: 'asset_solar_notes',
        courseId: 'course_solar_pv',
        moduleId: 'mod_solar_1',
        lessonId: 'les_solar_2',
        fileName: 'Solar_Battery_Voltage_Chart_Ug_Edition.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 482000,
        assetKind: 'pdf',
        storagePath: 'lms/courses/course_solar_pv/modules/mod_solar_1/Solar_Battery_Voltage_Chart_Ug_Edition.pdf',
        provider: 'firebase_storage',
        visibility: 'private_enrolled',
        uploadedBy: 'usr_instructor_musoke',
        uploadedByName: 'Eng. Isaac Musoke',
        createdAt: '2026-10-15T10:30:00Z',
        updatedAt: '2026-10-15T10:30:00Z',
      },
    ];
    this.instructorAssignments = [
      {
        id: 'course_solar_pv_usr_instructor_musoke',
        courseId: 'course_solar_pv',
        courseTitle: 'Solar PV & Off-Grid Electronics Fundamentals',
        instructorUid: 'usr_instructor_musoke',
        instructorName: 'Eng. Isaac Musoke',
        roleType: 'lead_instructor',
        assignedBy: 'usr_learning_manager_namono',
        assignedByName: 'Florence Namono',
        status: 'active',
        createdAt: '2026-10-15T09:00:00Z',
        updatedAt: '2026-10-15T09:00:00Z',
      },
    ];
    this.courseEnrollments = [
      {
        id: 'course_solar_pv_usr_boy_active',
        courseId: 'course_solar_pv',
        courseTitle: 'Solar PV & Off-Grid Electronics Fundamentals',
        userId: 'usr_boy_active',
        learnerName: 'David Mukasa',
        learnerDistrict: 'Kampala',
        ageCategory: 'child_5_17',
        isMinor: true,
        guardianConsentVerified: true,
        status: 'enrolled',
        progressPercent: 67,
        completedLessonsCount: 2,
        totalLessonsCount: 3,
        learningMinutes: 35,
        enrolledAt: '2026-11-02T09:00:00Z',
        createdAt: '2026-11-02T09:00:00Z',
        updatedAt: '2026-11-10T11:00:00Z',
      },
      {
        id: 'course_solar_pv_usr_young_adult',
        courseId: 'course_solar_pv',
        courseTitle: 'Solar PV & Off-Grid Electronics Fundamentals',
        userId: 'usr_young_adult',
        learnerName: 'Samuel Kiggundu',
        learnerDistrict: 'Kampala',
        ageCategory: 'young_adult_18_35',
        isMinor: false,
        guardianConsentVerified: true,
        status: 'completed',
        progressPercent: 100,
        completedLessonsCount: 3,
        totalLessonsCount: 3,
        learningMinutes: 65,
        enrolledAt: '2026-10-25T08:00:00Z',
        completedAt: '2026-11-08T16:00:00Z',
        createdAt: '2026-10-25T08:00:00Z',
        updatedAt: '2026-11-08T16:00:00Z',
      },
      {
        id: 'course_digital_literacy_usr_boy_active',
        courseId: 'course_digital_literacy',
        courseTitle: 'Digital Literacy, Spreadsheets & Safe Internet Citizenship',
        userId: 'usr_boy_active',
        learnerName: 'David Mukasa',
        learnerDistrict: 'Kampala',
        ageCategory: 'child_5_17',
        isMinor: true,
        guardianConsentVerified: true,
        status: 'enrolled',
        progressPercent: 0,
        completedLessonsCount: 0,
        totalLessonsCount: 1,
        learningMinutes: 0,
        enrolledAt: '2026-11-11T08:00:00Z',
        createdAt: '2026-11-11T08:00:00Z',
        updatedAt: '2026-11-11T08:00:00Z',
      },
      {
        id: 'course_financial_stewardship_usr_young_adult',
        courseId: 'course_financial_stewardship',
        courseTitle: 'Young Adult Financial Stewardship & Agribusiness Accounting',
        userId: 'usr_young_adult',
        learnerName: 'Samuel Kiggundu',
        learnerDistrict: 'Kampala',
        ageCategory: 'young_adult_18_35',
        isMinor: false,
        guardianConsentVerified: true,
        status: 'pending',
        progressPercent: 0,
        completedLessonsCount: 0,
        totalLessonsCount: 0,
        learningMinutes: 0,
        enrolledAt: '2026-11-11T10:00:00Z',
        createdAt: '2026-11-11T10:00:00Z',
        updatedAt: '2026-11-11T10:00:00Z',
      },
    ];
    this.lessonProgress = [
      {
        id: 'course_solar_pv_les_solar_1_usr_boy_active',
        courseId: 'course_solar_pv',
        moduleId: 'mod_solar_1',
        lessonId: 'les_solar_1',
        userId: 'usr_boy_active',
        completed: true,
        lastPositionSeconds: 0,
        watchedSeconds: 900,
        playbackSpeed: 1,
        updatedAt: '2026-11-04T15:00:00Z',
      },
      {
        id: 'course_solar_pv_les_solar_2_usr_boy_active',
        courseId: 'course_solar_pv',
        moduleId: 'mod_solar_1',
        lessonId: 'les_solar_2',
        userId: 'usr_boy_active',
        completed: true,
        lastPositionSeconds: 0,
        watchedSeconds: 1200,
        playbackSpeed: 1,
        updatedAt: '2026-11-06T16:00:00Z',
      },
    ];
    this.assessments = [
      {
        id: 'assm_solar_quiz1',
        courseId: 'course_solar_pv',
        moduleId: 'mod_solar_1',
        title: 'Module 1 Solar Safety & Polarity Check',
        assessmentType: 'quiz',
        instructions: 'Answer all questions carefully. Minimum pass mark is 70%.',
        passMarkPercent: 70,
        maxAttempts: 3,
        releaseAnswersAfterSubmit: true,
        status: 'published',
        createdBy: 'usr_instructor_musoke',
        createdAt: '2026-10-16T08:00:00Z',
        updatedAt: '2026-10-16T08:00:00Z',
      },
      {
        id: 'assm_solar_project',
        courseId: 'course_solar_pv',
        moduleId: 'mod_solar_2',
        title: 'Household Solar Wiring Bill of Materials Assignment',
        assessmentType: 'written_assignment',
        instructions: 'List the panel wattage, fuse rating, and cable gauge needed for a 4-room Ugandan home kit.',
        passMarkPercent: 60,
        maxAttempts: 2,
        releaseAnswersAfterSubmit: false,
        status: 'published',
        createdBy: 'usr_instructor_musoke',
        createdAt: '2026-10-17T08:00:00Z',
        updatedAt: '2026-10-17T08:00:00Z',
      },
    ];
    this.assessmentQuestions = [
      {
        id: 'q_solar_1',
        assessmentId: 'assm_solar_quiz1',
        courseId: 'course_solar_pv',
        orderIndex: 1,
        questionType: 'mcq',
        prompt: 'Which component should be connected FIRST to a 12V solar charge controller?',
        options: ['The 150W Solar Panel', 'The 12V Battery Bank', 'The DC LED Light Bulbs', 'The AC Inverter'],
        points: 5,
        createdBy: 'usr_instructor_musoke',
        createdAt: '2026-10-16T08:10:00Z',
        updatedAt: '2026-10-16T08:10:00Z',
      },
      {
        id: 'q_solar_2',
        assessmentId: 'assm_solar_quiz1',
        courseId: 'course_solar_pv',
        orderIndex: 2,
        questionType: 'true_false',
        prompt: 'True or False: Reversing DC positive and negative leads can damage a solar charge controller.',
        points: 5,
        createdBy: 'usr_instructor_musoke',
        createdAt: '2026-10-16T08:12:00Z',
        updatedAt: '2026-10-16T08:12:00Z',
      },
    ];
    this.assessmentAnswerKeys = [
      {
        questionId: 'q_solar_1',
        assessmentId: 'assm_solar_quiz1',
        courseId: 'course_solar_pv',
        correctOptionIndex: 1,
        explanation: 'Connecting the battery first lets the charge controller detect 12V/24V system voltage safely.',
        updatedAt: '2026-10-16T08:10:00Z',
      },
      {
        questionId: 'q_solar_2',
        assessmentId: 'assm_solar_quiz1',
        courseId: 'course_solar_pv',
        correctBoolean: true,
        explanation: 'Always confirm DC polarity with a multimeter before tightening terminals.',
        updatedAt: '2026-10-16T08:12:00Z',
      },
    ];
    this.assessmentAttempts = [
      {
        id: 'att_1',
        assessmentId: 'assm_solar_quiz1',
        courseId: 'course_solar_pv',
        userId: 'usr_boy_active',
        learnerName: 'David Mukasa',
        attemptNumber: 1,
        answers: { q_solar_1: 1, q_solar_2: true },
        scorePercent: 100,
        earnedPoints: 10,
        totalPoints: 10,
        passed: true,
        status: 'graded',
        gradedBy: 'Auto-Grader',
        submittedAt: '2026-11-05T14:20:00Z',
        gradedAt: '2026-11-05T14:20:00Z',
      },
    ];
    this.assignmentSubmissions = [
      {
        id: 'sub_1',
        assessmentId: 'assm_solar_project',
        courseId: 'course_solar_pv',
        userId: 'usr_boy_active',
        learnerName: 'David Mukasa',
        submissionText: 'For 4 LED 5W bulbs + 1 phone charger: 1 x 80W 12V solar panel, 10A PWM controller, 12V 50Ah AGM battery, and 15A inline fuse.',
        status: 'submitted',
        submittedAt: '2026-11-10T16:40:00Z',
      },
    ];
    this.zoomConfig = {
      connected: false,
      secretsConfigured: false,
      hostUserIdOrEmail: 'training@boychild.org',
      defaultTimezone: 'Africa/Kampala',
      minorSafeguardingLock: true,
      statusMessage:
        'Zoom Server-to-Server OAuth secrets (ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET) are not configured in Cloud Functions Secret Manager yet. Live sessions use verified manual links until configured.',
      updatedAt: '2026-11-10T08:00:00Z',
    };
    this.courseSessions = [
      {
        id: 'csess_solar_live1',
        courseId: 'course_solar_pv',
        courseTitle: 'Solar PV & Off-Grid Electronics Fundamentals',
        moduleId: 'mod_solar_2',
        title: 'Live Wiring Clinic: Sizing Solar Inverters & Charge Controllers',
        description: 'Interactive demonstration from Old Kampala Workshop with guarded Q&A.',
        instructorUid: 'usr_instructor_musoke',
        instructorName: 'Eng. Isaac Musoke',
        scheduledDate: '2026-11-28',
        startTimeKampala: '10:00',
        startsAtIso: '2026-11-28T07:00:00.000Z',
        durationMinutes: 60,
        timezone: 'Africa/Kampala',
        zoomMeetingDocId: 'zm_solar_1',
        isRecurring: false,
        status: 'scheduled',
        createdBy: 'usr_instructor_musoke',
        createdAt: '2026-11-10T09:00:00Z',
        updatedAt: '2026-11-10T09:00:00Z',
      },
    ];
    this.zoomMeetings = [
      {
        id: 'zm_solar_1',
        courseId: 'course_solar_pv',
        sessionId: 'csess_solar_live1',
        zoomMeetingId: 'MANUAL-8492019481',
        topic: 'Live Wiring Clinic: Sizing Solar Inverters & Charge Controllers',
        startTimeUtc: '2026-11-28T07:00:00.000Z',
        durationMinutes: 60,
        timezone: 'Africa/Kampala',
        hostIdentity: 'Eng. Isaac Musoke',
        status: 'scheduled',
        waitingRoom: true,
        joinBeforeHost: false,
        recordingEnabled: false,
        participantRestrictionsApplied: true,
        passcodeProtected: true,
        mode: 'manual_fallback',
        createdBy: 'usr_instructor_musoke',
        createdAt: '2026-11-10T09:00:00Z',
        updatedAt: '2026-11-10T09:00:00Z',
      },
    ];
    this.zoomMeetingSecrets = {
      zm_solar_1: {
        joinUrl: 'https://zoom.us/j/8492019481',
        startUrl: 'https://zoom.us/s/8492019481',
        passcode: 'BCA2026',
      },
    };
    this.sessionAttendance = [
      {
        id: 'csess_solar_live1_usr_boy_active',
        sessionId: 'csess_solar_live1',
        courseId: 'course_solar_pv',
        userId: 'usr_boy_active',
        learnerName: 'David Mukasa',
        status: 'present',
        markedBy: 'usr_instructor_musoke',
        markedByName: 'Eng. Isaac Musoke',
        recordedAt: '2026-11-10T10:30:00Z',
      },
    ];
    this.courseAnnouncements = [
      {
        id: 'cann_1',
        courseId: 'course_solar_pv',
        title: 'Saturday Live Solar Clinic at 10:00 AM Kampala Time',
        message: 'Please review Module 1.2 voltage chart notes before joining Saturday’s live wiring walkthrough.',
        priority: 'normal',
        authorUid: 'usr_instructor_musoke',
        authorName: 'Eng. Isaac Musoke',
        createdAt: '2026-11-11T08:00:00Z',
      },
    ];
    this.certificates = [
      {
        id: 'course_solar_pv_usr_young_adult',
        certificateNumber: 'BCA-CERT-2026-4401',
        courseId: 'course_solar_pv',
        courseTitle: 'Solar PV & Off-Grid Electronics Fundamentals',
        userId: 'usr_young_adult',
        learnerDisplayName: 'Samuel Kiggundu',
        completionDate: '2026-11-08',
        instructorSignatory: 'Eng. Isaac Musoke',
        learningManagerSignatory: 'Florence Namono',
        qrToken: 'CERTQR-SOLAR4401',
        status: 'issued',
        issuedAt: '2026-11-08T16:05:00Z',
        updatedAt: '2026-11-08T16:05:00Z',
      },
    ];
    this.certificateVerifications = {
      'BCA-CERT-2026-4401': {
        certificateNumber: 'BCA-CERT-2026-4401',
        courseTitle: 'Solar PV & Off-Grid Electronics Fundamentals',
        learnerDisplayName: 'Samuel Kiggundu',
        completionDate: '2026-11-08',
        instructorSignatory: 'Eng. Isaac Musoke',
        status: 'issued',
        qrToken: 'CERTQR-SOLAR4401',
        updatedAt: '2026-11-08T16:05:00Z',
      },
    };
    this.learningNotifications = [
      {
        id: 'lnotif_1',
        userId: 'usr_boy_active',
        courseId: 'course_solar_pv',
        sessionId: 'csess_solar_live1',
        title: 'Upcoming Live Class (Kampala EAT)',
        message: 'Live Wiring Clinic starts 2026-11-28 at 10:00 EAT. Waiting room is enabled.',
        category: 'live_class_reminder',
        reminderLeadTime: '24h',
        read: false,
        createdAt: '2026-11-11T09:00:00Z',
      },
    ];
    this.currentUserUid = 'usr_boy_active';

    // Privacy cleanup: scrub any legacy sensitive keys from localStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('bca_concern_reports');
        localStorage.removeItem('bca_users');
        localStorage.removeItem('bca_goals');
        localStorage.removeItem('bca_questions');
        const savedUid = sessionStorage.getItem('bca_demo_persona_uid');
        if (savedUid && this.users[savedUid]) {
          this.currentUserUid = savedUid;
        }
      } catch {
        // Ignore storage restrictions
      }
    }
  }

  getCurrentUser(): AppUser {
    return this.users[this.currentUserUid] || this.users.usr_boy_active;
  }

  switchUser(uid: string) {
    if (this.users[uid]) {
      this.currentUserUid = uid;
      if (typeof window !== 'undefined') {
        try {
          sessionStorage.setItem('bca_demo_persona_uid', uid);
        } catch {
          // ignore
        }
      }
      this.notifyListeners();
    }
  }

  addUser(user: AppUser) {
    this.users[user.uid] = user;
    this.currentUserUid = user.uid;
    if (user.role === 'boy') {
      this.memberProfiles[user.uid] = {
        uid: user.uid,
        fullName: user.fullName,
        ageCategory: (user.calculatedAge || 16) < 18 ? 'child_5_17' : 'young_adult_18_35',
        calculatedAge: user.calculatedAge || 16,
        status: user.status,
        district: user.district || 'Kampala',
        town: user.town || 'Kampala Central',
        schoolOrOccupation: user.schoolOrOccupation,
        interests: user.interests || ['Brothers in Purpose Mentorship'],
        circleId: user.circleId,
        guardianId: user.guardianId,
        achievements: [],
        attendanceCount: 0,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        createdBy: user.uid,
      };
    }
    this.addAuditLog({
      action: 'USER_REGISTERED',
      performedBy: user.fullName,
      performedByRole: user.role,
      targetEntity: 'users',
      targetId: user.uid,
      details: `User registered with role ${user.role} and status ${user.status}`,
    });
    this.notifyListeners();
  }

  updateUserProfile(uid: string, patch: Partial<Pick<AppUser, 'fullName' | 'district' | 'town' | 'schoolOrOccupation' | 'interests'>>) {
    const existing = this.users[uid];
    if (!existing) return;
    this.users[uid] = {
      ...existing,
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    if (this.memberProfiles[uid]) {
      this.memberProfiles[uid] = {
        ...this.memberProfiles[uid],
        ...patch,
        updatedAt: new Date().toISOString(),
      };
    }
    this.notifyListeners();
  }

  private issueMembershipCard(uid: string) {
    const u = this.users[uid];
    if (!u || u.role !== 'boy') return;
    if (!u.membershipNumber) {
      const count = Object.values(this.users).filter((m) => m.membershipNumber).length + 101;
      u.membershipNumber = `BCA-UG-${new Date().getFullYear()}-${String(count).padStart(4, '0')}`;
      u.membershipIssuedAt = new Date().toISOString();
      u.membershipQrToken = `QR-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    }
    if (this.memberProfiles[uid]) {
      this.memberProfiles[uid].membershipNumber = u.membershipNumber;
    }
  }

  requestGuardianLink(
    guardianUid: string,
    boyIdentifier: string,
    relationship: GuardianLink['relationship'],
    verificationMethod: GuardianVerificationMethod = 'child_code_confirmation',
    authorityEvidence = 'Child verification code challenge pending'
  ): GuardianLink {
    const boy = Object.values(this.users).find(
      (u) => u.role === 'boy' && (u.uid === boyIdentifier || u.email.toLowerCase() === boyIdentifier.toLowerCase())
    );
    if (!boy) {
      throw new Error('No boy member record found matching that email or member ID.');
    }
    const code = `BCA-${Math.floor(100000 + Math.random() * 900000)}`;
    const link: GuardianLink = {
      id: `${guardianUid}_${boy.uid}`,
      guardianId: guardianUid,
      guardianName: this.users[guardianUid]?.fullName || 'Guardian',
      guardianPhone: this.users[guardianUid]?.phone,
      boyId: boy.uid,
      boyName: boy.fullName,
      relationship,
      verificationCode: code,
      verificationMethod,
      authorityEvidence,
      status: 'pending_verification',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: guardianUid,
    };
    this.guardianLinks = [link, ...this.guardianLinks.filter((l) => l.id !== link.id)];
    this.notifications.unshift({
      id: `notif_${Date.now()}`,
      userId: boy.uid,
      title: 'Guardian Link Verification Required',
      message: `${link.guardianName} requested to verify relationship (${verificationMethod.replace(/_/g, ' ')}). Code: ${code}`,
      category: 'consent',
      read: false,
      createdAt: new Date().toISOString(),
    });
    this.addAuditLog({
      action: 'GUARDIAN_LINK_REQUESTED',
      performedBy: link.guardianName,
      performedByRole: 'guardian',
      targetEntity: 'guardianLinks',
      targetId: link.id,
      details: `Pending ${verificationMethod} verification initiated for ${boy.fullName}`,
    });
    this.notifyListeners();
    return link;
  }

  verifyGuardianLink(linkId: string, code: string) {
    const link = this.guardianLinks.find((l) => l.id === linkId);
    if (!link) throw new Error('Guardian link not found.');
    if (link.verificationCode !== code.trim()) throw new Error('Verification code does not match.');
    link.status = 'verified';
    link.verifiedBy = this.getCurrentUser().fullName;
    link.verifiedAt = new Date().toISOString();
    link.updatedAt = new Date().toISOString();
    if (this.users[link.boyId]) {
      this.users[link.boyId].guardianId = link.guardianId;
      this.users[link.boyId].guardianName = link.guardianName;
    }
    this.addAuditLog({
      action: 'GUARDIAN_LINK_VERIFIED',
      performedBy: this.getCurrentUser().fullName,
      performedByRole: this.getCurrentUser().role,
      targetEntity: 'guardianLinks',
      targetId: linkId,
      details: `Verified link between ${link.guardianName} and ${link.boyName} via ${link.verificationMethod}`,
    });
    this.notifyListeners();
  }

  approveGuardianConsent(
    boyUid: string,
    guardianUid: string,
    version = '2026.1',
    verificationMethod: GuardianVerificationMethod = 'child_code_confirmation',
    authorityEvidence = 'Verified Guardian Link & Safeguarding Attestation'
  ) {
    const boyUser = this.users[boyUid];
    if (!boyUser) throw new Error('Member account not found.');

    const verifiedLink = this.guardianLinks.find(
      (l) => l.guardianId === guardianUid && l.boyId === boyUid && l.status === 'verified'
    );
    const caller = this.getCurrentUser();
    const isAdminOrCleared = caller.role === 'admin' || (caller.role === 'coordinator' && caller.safeguardingCleared);
    if (!verifiedLink && !isAdminOrCleared) {
      throw new Error('Verified guardian-child relationship is mandatory before consent can be recorded.');
    }
    if (!authorityEvidence || authorityEvidence.trim().length < 4) {
      throw new Error('Authority verification evidence note is required to record guardian consent.');
    }

    boyUser.status = 'active';
    boyUser.circleId = boyUser.circleId || 'circle_kampala_central';
    boyUser.updatedAt = new Date().toISOString();
    this.issueMembershipCard(boyUid);
    if (this.memberProfiles[boyUid]) {
      this.memberProfiles[boyUid] = {
        ...this.memberProfiles[boyUid],
        status: 'active',
        circleId: boyUser.circleId,
        updatedAt: boyUser.updatedAt,
      };
    }

    const rec: ConsentRecord = {
      id: `consent_${Date.now()}`,
      boyId: boyUid,
      boyName: boyUser.fullName,
      guardianId: guardianUid,
      guardianName: this.users[guardianUid]?.fullName || 'Guardian',
      action: 'granted',
      consentVersion: version,
      method: verificationMethod === 'guardian_sms_otp' ? 'sms_otp' : verificationMethod === 'coordinator_id_check' ? 'coordinator_verified' : 'guardian_portal',
      verificationMethod,
      authorityEvidence: authorityEvidence.trim(),
      createdAt: new Date().toISOString(),
      createdBy: guardianUid,
    };
    this.consentRecords.unshift(rec);
    this.addAuditLog({
      action: 'GUARDIAN_CONSENT_RECORDED',
      performedBy: rec.guardianName || 'Guardian',
      performedByRole: 'guardian',
      targetEntity: 'users',
      targetId: boyUid,
      details: `Consent v${version} verified via ${verificationMethod} (${authorityEvidence}). Card ${boyUser.membershipNumber} active.`,
    });
    this.notifyListeners();
  }

  withdrawGuardianConsent(boyUid: string, guardianUid: string, reason: string) {
    if (this.users[boyUid]) {
      this.users[boyUid].status = 'pending_guardian_consent';
      this.users[boyUid].updatedAt = new Date().toISOString();
      if (this.memberProfiles[boyUid]) {
        this.memberProfiles[boyUid] = {
          ...this.memberProfiles[boyUid],
          status: 'pending_guardian_consent',
          updatedAt: this.users[boyUid].updatedAt,
        };
      }
      const rec: ConsentRecord = {
        id: `consent_${Date.now()}`,
        boyId: boyUid,
        boyName: this.users[boyUid].fullName,
        guardianId: guardianUid,
        guardianName: this.users[guardianUid]?.fullName || 'Guardian',
        action: 'withdrawn',
        consentVersion: '2026.1',
        method: 'guardian_portal',
        verificationMethod: 'guardian_sms_otp',
        authorityEvidence: 'Verified Guardian Portal Session',
        reason,
        createdAt: new Date().toISOString(),
        createdBy: guardianUid,
      };
      this.consentRecords.unshift(rec);
      this.addAuditLog({
        action: 'GUARDIAN_CONSENT_WITHDRAWN',
        performedBy: rec.guardianName || 'Guardian',
        performedByRole: 'guardian',
        targetEntity: 'users',
        targetId: boyUid,
        details: `Consent withdrawn: ${reason}`,
      });
      this.notifyListeners();
    }
  }

  addMembershipApplication(app: Omit<MembershipApplication, 'id' | 'status' | 'createdAt' | 'updatedAt' | 'createdBy'>) {
    const newApp: MembershipApplication = {
      ...app,
      id: `mem_app_${Date.now()}`,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: app.applicantUid,
    };
    this.membershipApplications.unshift(newApp);
    this.notifyListeners();
    return newApp;
  }

  reviewMembershipApplication(appId: string, decision: 'approved' | 'rejected') {
    const app = this.membershipApplications.find((a) => a.id === appId);
    if (!app) return;
    app.status = decision;
    app.reviewedBy = this.getCurrentUser().uid;
    app.updatedAt = new Date().toISOString();
    if (decision === 'approved' && this.users[app.applicantUid]) {
      const nextStatus = app.ageCategory === 'child_5_17' ? 'pending_guardian_consent' : 'active';
      this.users[app.applicantUid].status = nextStatus;
      if (this.memberProfiles[app.applicantUid]) {
        this.memberProfiles[app.applicantUid] = {
          ...this.memberProfiles[app.applicantUid],
          status: nextStatus,
          updatedAt: new Date().toISOString(),
        };
      }
      if (nextStatus === 'active') {
        this.issueMembershipCard(app.applicantUid);
      }
    }
    this.addAuditLog({
      action: `MEMBERSHIP_APPLICATION_${decision.toUpperCase()}`,
      performedBy: this.getCurrentUser().fullName,
      performedByRole: this.getCurrentUser().role,
      targetEntity: 'membershipApplications',
      targetId: appId,
      details: `Application for ${app.fullName} marked ${decision}`,
    });
    this.notifyListeners();
  }

  addConcernReport(report: Omit<ConcernReport, 'id' | 'createdAt' | 'updatedAt' | 'status'>): ConcernReport {
    const refNumber = `BCA-SG-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const newReport: ConcernReport = {
      ...report,
      id: `rep_${Date.now()}`,
      refNumber,
      status: 'new',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.concernReports.unshift(newReport);

    const newCase: SafeguardingCase = {
      id: `case_${Date.now()}`,
      refNumber,
      reportId: newReport.id,
      urgency: report.urgency,
      district: report.district,
      concernCategory: report.concernCategory,
      summary: report.details.slice(0, 140),
      status: 'new',
      assignedLeadName: 'Unassigned',
      triageNotes: '',
      followUps: [],
      createdAt: newReport.createdAt,
      updatedAt: newReport.updatedAt,
      createdBy: report.isAnonymous ? 'anonymous' : report.reporterName || 'member',
    };
    this.safeguardingCases.unshift(newCase);

    this.addAuditLog({
      action: 'SAFEGUARDING_CONCERN_FILED',
      performedBy: report.isAnonymous ? 'Anonymous' : report.reporterName || 'Signed User',
      performedByRole: 'confidential',
      targetEntity: 'safeguardingCases',
      targetId: newCase.id,
      details: `Case ${refNumber} opened (${report.urgency}) in ${report.district}`,
    });
    this.notifyListeners();
    return newReport;
  }

  triageSafeguardingCase(
    caseId: string,
    status: SafeguardingCase['status'],
    triageNotes: string,
    assignedLeadName?: string,
    escalationChannel?: SafeguardingCase['escalationChannel'],
    escalationRef?: string
  ) {
    const c = this.safeguardingCases.find((item) => item.id === caseId);
    if (!c) return;
    c.status = status;
    c.triageNotes = triageNotes;
    if (assignedLeadName) {
      c.assignedLeadName = assignedLeadName;
      const leadUser = Object.values(this.users).find(
        (u) => u.fullName === assignedLeadName && (u.role === 'admin' || u.safeguardingCleared)
      );
      if (leadUser) c.assignedLeadId = leadUser.uid;
    }
    if (escalationChannel) c.escalationChannel = escalationChannel;
    if (escalationRef) c.escalationRef = escalationRef;
    c.updatedAt = new Date().toISOString();
    const currentUser = this.getCurrentUser();
    this.addAuditLog({
      action: 'SAFEGUARDING_CASE_TRIAGED',
      performedBy: currentUser.fullName,
      performedByRole: currentUser.role,
      targetEntity: 'safeguardingCases',
      targetId: caseId,
      details: `Case ${c.refNumber} updated to ${status}${escalationChannel ? ` (Escalated: ${escalationChannel})` : ''}`,
    });
    this.notifyListeners();
  }

  addSafeguardingFollowUp(
    caseId: string,
    payload: { actionTaken: string; outcome: string; nextReviewDate?: string }
  ): SafeguardingFollowUp {
    const c = this.safeguardingCases.find((item) => item.id === caseId);
    if (!c) throw new Error('Safeguarding case not found.');
    const currentUser = this.getCurrentUser();
    const entry: SafeguardingFollowUp = {
      id: `fu_${Date.now()}`,
      timestamp: new Date().toISOString(),
      authorId: currentUser.uid,
      authorName: currentUser.fullName,
      actionTaken: payload.actionTaken,
      outcome: payload.outcome,
      nextReviewDate: payload.nextReviewDate,
    };
    c.followUps = [entry, ...(c.followUps || [])];
    c.updatedAt = entry.timestamp;
    this.addAuditLog({
      action: 'SAFEGUARDING_FOLLOWUP_LOGGED',
      performedBy: currentUser.fullName,
      performedByRole: currentUser.role,
      targetEntity: 'safeguardingCases',
      targetId: caseId,
      details: `Follow-up added to ${c.refNumber}: ${payload.actionTaken}`,
    });
    this.notifyListeners();
    return entry;
  }

  verifyMembershipCard(cardOrToken: string): MembershipVerificationRecord | null {
    const clean = cardOrToken.trim().toUpperCase();
    if (!clean) return null;
    const found = Object.values(this.users).find(
      (u) =>
        (u.membershipNumber && u.membershipNumber.toUpperCase() === clean) ||
        (u.membershipQrToken && u.membershipQrToken.toUpperCase() === clean)
    );
    if (!found || !found.membershipNumber) return null;
    const circle = this.circles.find((c) => c.id === found.circleId);
    const isMinor = (found.calculatedAge ?? 16) < 18 || found.ageCategory === 'child_5_17';
    const parts = found.fullName.split(' ');
    const fullNameMasked = isMinor
      ? `Minor Member (${found.district || 'Uganda'} Chapter)`
      : `${parts[0]} ${parts[1] ? `${parts[1][0]}.` : ''}`.trim();

    return {
      membershipNumber: found.membershipNumber,
      uid: found.uid,
      status: found.status,
      ageCategory: found.ageCategory || 'child_5_17',
      district: found.district || 'Kampala',
      circleName: circle?.name,
      issuedAt: found.membershipIssuedAt || found.createdAt,
      qrToken: found.membershipQrToken || '',
      isMinor,
      fullNameMasked,
      fullNamePrivate: found.fullName,
    };
  }

  registerForEvent(
    eventId: string,
    payload: { userId?: string; attendeeName: string; attendeeEmail?: string; attendeeRole?: UserRole | 'guest'; district: string }
  ): EventRegistration {
    const evt = this.events.find((e) => e.id === eventId);
    if (!evt) throw new Error('Event not found.');
    if (evt.registeredCount >= evt.capacity) {
      throw new Error('This event has reached full capacity.');
    }
    const duplicate = this.eventRegistrations.find(
      (r) =>
        r.eventId === eventId &&
        ((payload.userId && r.userId === payload.userId) ||
          (payload.attendeeEmail && r.attendeeEmail?.toLowerCase() === payload.attendeeEmail.toLowerCase()))
    );
    if (duplicate) {
      throw new Error(`Already registered (${duplicate.confirmationCode}).`);
    }
    const reg: EventRegistration = {
      id: `ereg_${Date.now()}`,
      eventId,
      userId: payload.userId,
      attendeeName: payload.attendeeName,
      attendeeEmail: payload.attendeeEmail,
      attendeeRole: payload.attendeeRole || 'guest',
      district: payload.district,
      confirmationCode: `BCA-EVT-${Math.floor(1000 + Math.random() * 9000)}`,
      attendanceStatus: 'registered',
      registeredAt: new Date().toISOString(),
    };
    this.eventRegistrations.unshift(reg);
    evt.registeredCount += 1;
    this.addAuditLog({
      action: 'EVENT_REGISTERED',
      performedBy: payload.attendeeName,
      performedByRole: reg.attendeeRole,
      targetEntity: 'events',
      targetId: eventId,
      details: `Registered for ${evt.title} (${reg.confirmationCode})`,
    });
    this.notifyListeners();
    return reg;
  }

  recordEventAttendance(registrationId: string, attendanceStatus: EventRegistration['attendanceStatus']) {
    const reg = this.eventRegistrations.find((r) => r.id === registrationId);
    if (!reg) return;
    reg.attendanceStatus = attendanceStatus;
    reg.markedBy = this.getCurrentUser().fullName;
    this.addAuditLog({
      action: 'EVENT_ATTENDANCE_RECORDED',
      performedBy: this.getCurrentUser().fullName,
      performedByRole: this.getCurrentUser().role,
      targetEntity: 'eventRegistrations',
      targetId: registrationId,
      details: `Marked ${reg.attendeeName} as ${attendanceStatus}`,
    });
    this.notifyListeners();
  }

  updateConcernStatus(reportId: string, status: ConcernReport['status'], triageNotes?: string) {
    const report = this.concernReports.find((r) => r.id === reportId);
    if (report) {
      report.status = status;
      if (triageNotes) report.triageNotes = triageNotes;
      report.updatedAt = new Date().toISOString();
      const currentUser = this.getCurrentUser();
      this.addAuditLog({
        action: 'SAFEGUARDING_REPORT_UPDATED',
        performedBy: currentUser.fullName,
        performedByRole: currentUser.role,
        targetEntity: 'concernReports',
        targetId: reportId,
        details: `Status set to ${status}. Notes: ${triageNotes || 'None'}`,
      });
      this.notifyListeners();
    }
  }

  addGoal(goal: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>) {
    const newGoal: Goal = {
      ...goal,
      id: `goal_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.goals.unshift(newGoal);
    this.notifyListeners();
    return newGoal;
  }

  updateGoalProgress(goalId: string, progress: number) {
    const g = this.goals.find((item) => item.id === goalId);
    if (g) {
      g.progress = Math.min(100, Math.max(0, progress));
      g.completed = g.progress === 100;
      g.updatedAt = new Date().toISOString();
      this.notifyListeners();
    }
  }

  addQuestion(q: Omit<Question, 'id' | 'createdAt' | 'isModerated'>) {
    const newQ: Question = {
      ...q,
      id: `q_${Date.now()}`,
      isModerated: true,
      createdAt: new Date().toISOString(),
    };
    this.questions.unshift(newQ);
    this.notifyListeners();
    return newQ;
  }

  replyToQuestion(questionId: string, reply: string, mentorName: string) {
    const q = this.questions.find((item) => item.id === questionId);
    if (q) {
      q.mentorReply = reply;
      q.repliedByMentorName = mentorName;
      q.repliedAt = new Date().toISOString();
      this.notifyListeners();
    }
  }

  recordAttendance(rec: Omit<AttendanceRecord, 'id' | 'createdAt'>) {
    const id = `${rec.sessionId}_${rec.memberId}`;
    const existingIdx = this.attendance.findIndex((a) => a.id === id);
    const fullRec: AttendanceRecord = {
      ...rec,
      id,
      createdAt: new Date().toISOString(),
    };
    if (existingIdx >= 0) {
      this.attendance[existingIdx] = fullRec;
    } else {
      this.attendance.unshift(fullRec);
    }
    this.notifyListeners();
    return fullRec;
  }

  addCircleSession(sess: Omit<CircleSession, 'id' | 'completed'>) {
    const newSess: CircleSession = {
      ...sess,
      id: `sess_${Date.now()}`,
      completed: false,
    };
    this.sessions.unshift(newSess);
    this.notifyListeners();
    return newSess;
  }

  assignMemberToCircle(userId: string, circleId: string) {
    const user = this.users[userId];
    const circle = this.circles.find((c) => c.id === circleId);
    if (!user || !circle) return;
    if (user.status !== 'active') {
      throw new Error('Cannot assign member until account is active.');
    }
    user.circleId = circleId;
    if (this.memberProfiles[userId]) {
      this.memberProfiles[userId] = {
        ...this.memberProfiles[userId],
        circleId,
        status: user.status,
        updatedAt: new Date().toISOString(),
      };
    }
    const membership: CircleMembership = {
      id: `${circleId}_${userId}`,
      circleId,
      userId,
      memberName: user.fullName,
      ageCategory: (user.calculatedAge || 16) < 18 ? 'child_5_17' : 'young_adult_18_35',
      leadMentorId: circle.leadMentorId,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.circleMemberships = [membership, ...this.circleMemberships.filter((m) => m.id !== membership.id)];
    circle.activeMembersCount += 1;
    this.addAuditLog({
      action: 'CIRCLE_MEMBER_ASSIGNED',
      performedBy: this.getCurrentUser().fullName,
      performedByRole: this.getCurrentUser().role,
      targetEntity: 'mentorshipCircles',
      targetId: circleId,
      details: `Assigned ${user.fullName} to ${circle.name}`,
    });
    this.notifyListeners();
  }

  verifyReferee(appId: string, refereeIndex: 1 | 2, status: 'verified' | 'flagged') {
    const app = this.mentorApplications.find((a) => a.id === appId);
    if (app) {
      if (refereeIndex === 1) app.referee1.status = status;
      else app.referee2.status = status;
    }
    const refDoc = this.mentorReferees.find((r) => r.applicationId === appId && r.refereeIndex === refereeIndex);
    if (refDoc) {
      refDoc.status = status;
      refDoc.verifiedBy = this.getCurrentUser().fullName;
      refDoc.updatedAt = new Date().toISOString();
    }
    this.addAuditLog({
      action: 'MENTOR_REFEREE_VERIFIED',
      performedBy: this.getCurrentUser().fullName,
      performedByRole: this.getCurrentUser().role,
      targetEntity: 'mentorReferees',
      targetId: `${appId}_ref${refereeIndex}`,
      details: `Referee ${refereeIndex} marked ${status}`,
    });
    this.notifyListeners();
  }

  vetMentor(appId: string, approved: boolean) {
    const app = this.mentorApplications.find((a) => a.id === appId);
    if (app) {
      app.status = approved ? 'approved' : 'declined';
      app.dbsSafeguardingCheck = approved ? 'cleared' : 'flagged';
      const currentUser = this.getCurrentUser();
      this.addAuditLog({
        action: approved ? 'MENTOR_APPROVED' : 'MENTOR_DECLINED',
        performedBy: currentUser.fullName,
        performedByRole: currentUser.role,
        targetEntity: 'mentorApplications',
        targetId: appId,
        details: `Mentor application for ${app.fullName} was ${app.status}`,
      });
      this.notifyListeners();
    }
  }

  submitPartnerProposal(app: Omit<PartnerApplication, 'id' | 'status' | 'createdAt' | 'updatedAt'>) {
    const newApp: PartnerApplication = {
      ...app,
      id: `papp_${Date.now()}`,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.partnerApplications.unshift(newApp);
    this.notifyListeners();
    return newApp;
  }

  reviewPartnerApplication(appId: string, decision: 'approved' | 'declined') {
    const app = this.partnerApplications.find((p) => p.id === appId);
    if (!app) return;
    app.status = decision;
    app.updatedAt = new Date().toISOString();
    if (decision === 'approved') {
      this.partners.unshift({
        id: `partner_${Date.now()}`,
        ownerUid: app.applicantUid,
        orgName: app.orgName,
        orgType: app.orgType,
        contactPerson: app.contactPerson,
        phone: app.phone,
        email: app.email,
        district: app.district,
        status: 'verified',
        vanguardClubActive: app.applicationType === 'vanguard_club',
        approvedEventsCount: 0,
        createdAt: new Date().toISOString(),
      });
    }
    this.addAuditLog({
      action: `PARTNER_APPLICATION_${decision.toUpperCase()}`,
      performedBy: this.getCurrentUser().fullName,
      performedByRole: this.getCurrentUser().role,
      targetEntity: 'partnerApplications',
      targetId: appId,
      details: `${app.orgName} (${app.applicationType}) ${decision}`,
    });
    this.notifyListeners();
  }

  assignUserRole(
    targetUid: string,
    newRole: UserRole,
    safeguardingCleared?: boolean,
    instructorAuthorized?: boolean
  ) {
    const u = this.users[targetUid];
    if (!u) return;
    u.role = newRole;
    u.safeguardingCleared = newRole === 'admin' ? true : Boolean(safeguardingCleared);
    u.instructorAuthorized =
      newRole === 'instructor' || newRole === 'learning_manager' || newRole === 'admin'
        ? true
        : Boolean(instructorAuthorized);
    u.updatedAt = new Date().toISOString();
    this.addAuditLog({
      action: 'USER_ROLE_ASSIGNED',
      performedBy: this.getCurrentUser().fullName,
      performedByRole: this.getCurrentUser().role,
      targetEntity: 'users',
      targetId: targetUid,
      details: `Assigned role ${newRole}, safeguardingCleared=${u.safeguardingCleared}, instructorAuthorized=${u.instructorAuthorized}`,
    });
    this.notifyListeners();
  }

  suspendUser(targetUid: string, suspend: boolean, reason: string) {
    const u = this.users[targetUid];
    if (!u) return;
    u.status = suspend ? 'suspended' : 'active';
    u.suspensionReason = suspend ? reason : undefined;
    u.updatedAt = new Date().toISOString();
    if (this.memberProfiles[targetUid]) {
      this.memberProfiles[targetUid] = {
        ...this.memberProfiles[targetUid],
        status: u.status,
        updatedAt: u.updatedAt,
      };
    }
    this.addAuditLog({
      action: suspend ? 'USER_SUSPENDED' : 'USER_REACTIVATED',
      performedBy: this.getCurrentUser().fullName,
      performedByRole: this.getCurrentUser().role,
      targetEntity: 'users',
      targetId: targetUid,
      details: reason,
    });
    this.notifyListeners();
  }

  updateCmsStatus(type: 'programme' | 'event' | 'announcement' | 'resource', id: string, status: CmsStatus) {
    if (type === 'programme') {
      const p = this.programmes.find((i) => i.id === id);
      if (p) p.status = status;
    } else if (type === 'event') {
      const e = this.events.find((i) => i.id === id);
      if (e) e.status = status;
    } else if (type === 'announcement') {
      const a = this.announcements.find((i) => i.id === id);
      if (a) a.status = status;
    } else if (type === 'resource') {
      const r = this.learningResources.find((i) => i.id === id);
      if (r) r.status = status;
    }
    this.addAuditLog({
      action: 'CMS_CONTENT_STATUS_CHANGED',
      performedBy: this.getCurrentUser().fullName,
      performedByRole: this.getCurrentUser().role,
      targetEntity: type,
      targetId: id,
      details: `Set ${type} ${id} to ${status}`,
    });
    this.notifyListeners();
  }

  updateCmsHeroSettings(patch: Partial<CmsSettingsBundle>) {
    this.cmsSettings = {
      ...this.cmsSettings,
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    this.addAuditLog({
      action: 'CMS_SETTINGS_UPDATED',
      performedBy: this.getCurrentUser().fullName,
      performedByRole: this.getCurrentUser().role,
      targetEntity: 'systemSettings',
      targetId: 'cms_bundle',
      details: `Updated global CMS configuration (${this.cmsSettings.status})`,
    });
    this.notifyListeners();
  }

  addAnnouncement(item: Omit<AnnouncementItem, 'id'>) {
    const newItem: AnnouncementItem = { ...item, id: `ann_${Date.now()}` };
    this.announcements.unshift(newItem);
    this.notifyListeners();
    return newItem;
  }

  addProgramme(item: Omit<Programme, 'id'>) {
    const newProg: Programme = {
      ...item,
      id: `prog_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.programmes.unshift(newProg);
    this.notifyListeners();
    return newProg;
  }

  addMentorApplication(
    app: Omit<MentorApplication, 'id' | 'status' | 'dbsSafeguardingCheck' | 'createdAt' | 'referee1' | 'referee2'> & {
      referee1Name: string;
      referee1Phone: string;
      referee2Name: string;
      referee2Phone: string;
    }
  ): MentorApplication {
    const appId = `app_mentor_${Date.now()}`;
    const newApp: MentorApplication = {
      id: appId,
      applicantUid: app.applicantUid,
      fullName: app.fullName,
      email: app.email,
      phone: app.phone,
      district: app.district,
      occupation: app.occupation,
      motivation: app.motivation,
      availability: app.availability,
      safeguardingTrainingAccepted: app.safeguardingTrainingAccepted ?? true,
      referee1: { name: app.referee1Name, phone: app.referee1Phone, status: 'pending' },
      referee2: { name: app.referee2Name, phone: app.referee2Phone, status: 'pending' },
      dbsSafeguardingCheck: 'pending',
      status: 'pending_vetting',
      documentUrls: app.documentUrls,
      createdAt: new Date().toISOString(),
    };
    this.mentorApplications.unshift(newApp);
    const now = new Date().toISOString();
    this.mentorReferees.unshift(
      {
        id: `${appId}_ref1`,
        applicationId: appId,
        mentorUid: app.applicantUid || appId,
        refereeIndex: 1,
        name: app.referee1Name,
        phone: app.referee1Phone,
        relationship: 'Character Referee 1',
        status: 'pending',
        updatedAt: now,
      },
      {
        id: `${appId}_ref2`,
        applicationId: appId,
        mentorUid: app.applicantUid || appId,
        refereeIndex: 2,
        name: app.referee2Name,
        phone: app.referee2Phone,
        relationship: 'Character Referee 2',
        status: 'pending',
        updatedAt: now,
      }
    );
    this.notifyListeners();
    return newApp;
  }

  updateUserAvatar(uid: string, avatarUrl: string) {
    if (this.users[uid]) {
      this.users[uid] = { ...this.users[uid], avatarUrl, updatedAt: new Date().toISOString() };
    }
    if (this.memberProfiles[uid]) {
      this.memberProfiles[uid] = { ...this.memberProfiles[uid], avatarUrl, updatedAt: new Date().toISOString() };
    }
    this.notifyListeners();
  }

  attachSafeguardingEvidence(caseId: string, attachment: AttachmentMeta) {
    const c = this.safeguardingCases.find((item) => item.id === caseId);
    if (!c) return;
    c.attachments = [attachment, ...(c.attachments || [])];
    c.updatedAt = new Date().toISOString();
    const u = this.getCurrentUser();
    this.addAuditLog({
      action: 'SAFEGUARDING_EVIDENCE_ATTACHED',
      performedBy: u.fullName,
      performedByRole: u.role,
      targetEntity: 'safeguardingCases',
      targetId: caseId,
      details: `Attached evidence file ${attachment.name} (${attachment.contentType})`,
    });
    this.notifyListeners();
  }

  promoteConcernToCase(reportId: string): SafeguardingCase {
    const existing = this.safeguardingCases.find((c) => c.reportId === reportId);
    if (existing) return existing;
    const report = this.concernReports.find((r) => r.id === reportId);
    if (!report) throw new Error('Concern report not found.');
    const u = this.getCurrentUser();
    const now = new Date().toISOString();
    const newCase: SafeguardingCase = {
      id: `case_${Date.now()}`,
      refNumber: report.refNumber || `BCA-SG-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      reportId: report.id,
      urgency: report.urgency,
      district: report.district,
      concernCategory: report.concernCategory,
      summary: report.details.slice(0, 140),
      status: 'under_review',
      assignedLeadId: u.uid,
      assignedLeadName: u.fullName,
      triageNotes: `Case promoted from concern intake ${report.refNumber || report.id}.`,
      followUps: [],
      createdAt: now,
      updatedAt: now,
      createdBy: u.uid,
    };
    this.safeguardingCases.unshift(newCase);
    report.status = 'investigating';
    report.updatedAt = now;
    this.addAuditLog({
      action: 'SAFEGUARDING_CASE_OPENED_FROM_REPORT',
      performedBy: u.fullName,
      performedByRole: u.role,
      targetEntity: 'safeguardingCases',
      targetId: newCase.id,
      details: `Promoted report ${reportId} to case ${newCase.refNumber}`,
    });
    this.notifyListeners();
    return newCase;
  }

  addContactMessage(msg: Omit<ContactMessage, 'id' | 'status' | 'createdAt' | 'updatedAt'>): ContactMessage {
    const now = new Date().toISOString();
    const entry: ContactMessage = {
      ...msg,
      id: `cmsg_${Date.now()}`,
      status: 'new',
      createdAt: now,
      updatedAt: now,
    };
    this.contactMessages.unshift(entry);
    this.notifyListeners();
    return entry;
  }

  updateContactMessageStatus(msgId: string, status: ContactMessage['status'], handledBy?: string) {
    const item = this.contactMessages.find((m) => m.id === msgId);
    if (!item) return;
    item.status = status;
    if (handledBy) item.handledBy = handledBy;
    item.updatedAt = new Date().toISOString();
    this.notifyListeners();
  }

  addProgressReport(report: Omit<MentorProgressReport, 'id' | 'createdAt' | 'updatedAt'>): MentorProgressReport {
    const now = new Date().toISOString();
    const entry: MentorProgressReport = {
      ...report,
      id: `prep_${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };
    this.progressReports.unshift(entry);
    this.addAuditLog({
      action: 'MENTOR_PROGRESS_REPORT_SUBMITTED',
      performedBy: report.mentorName,
      performedByRole: 'mentor',
      targetEntity: 'progressReports',
      targetId: entry.id,
      details: `Submitted ${report.reportingPeriod} report for ${report.circleName}`,
    });
    this.notifyListeners();
    return entry;
  }

  addDppaRequest(userId: string, type: DppaRequest['type'], reason: string) {
    const req: DppaRequest = {
      id: `dppa_${Date.now()}`,
      userId,
      userName: this.users[userId]?.fullName || 'User',
      type,
      reason,
      status: type === 'export' ? 'completed' : 'pending',
      createdAt: new Date().toISOString(),
    };
    this.dppaRequests.unshift(req);
    this.addAuditLog({
      action: `DPPA_${type.toUpperCase()}_REQUESTED`,
      performedBy: req.userName,
      performedByRole: this.users[userId]?.role || 'user',
      targetEntity: 'dataProtectionRequests',
      targetId: req.id,
      details: reason,
    });
    this.notifyListeners();
    return req;
  }

  reviewDppaRequest(
    requestId: string,
    status: DppaRequest['status'],
    resolutionNotes?: string
  ) {
    const req = this.dppaRequests.find((r) => r.id === requestId);
    if (!req) return;
    const caller = this.getCurrentUser();
    req.status = status;
    req.reviewedBy = caller.fullName;
    req.reviewedAt = new Date().toISOString();
    if (resolutionNotes) req.resolutionNotes = resolutionNotes;
    this.addAuditLog({
      action: `DPPA_REQUEST_${status.toUpperCase()}`,
      performedBy: caller.fullName,
      performedByRole: caller.role,
      targetEntity: 'dataProtectionRequests',
      targetId: requestId,
      details: resolutionNotes || `Set DPPA SAR status to ${status}`,
    });
    this.notifyListeners();
  }

  markNotificationRead(notifId: string) {
    const n = this.notifications.find((item) => item.id === notifId);
    if (n) {
      n.read = true;
      this.notifyListeners();
    }
  }

  // ===================================================================
  // BCA ONLINE SKILLING LMS METHODS (Stateful Offline + Live Store Sync)
  // ===================================================================

  canUserInstructCourse(uid: string, courseId: string): boolean {
    const u = this.users[uid];
    if (!u || u.status !== 'active') return false;
    if (u.role === 'admin' || u.role === 'learning_manager') return true;
    const isAuthorizedInstructor =
      u.role === 'instructor' || (u.role === 'mentor' && u.instructorAuthorized === true);
    if (!isAuthorizedInstructor) return false;
    const c = this.courses.find((item) => item.id === courseId);
    const hasAssign = this.instructorAssignments.some(
      (a) => a.courseId === courseId && a.instructorUid === uid && a.status === 'active'
    );
    return hasAssign || Boolean(c && (c.createdBy === uid || c.instructorIds.includes(uid)));
  }

  upsertCourseDraft(
    courseInput: Partial<Course> & { id?: string; title: string; category: string },
    actorUid: string
  ): Course {
    const actor = this.users[actorUid];
    const now = new Date().toISOString();
    const existingIdx = courseInput.id ? this.courses.findIndex((c) => c.id === courseInput.id) : -1;
    if (existingIdx >= 0) {
      const existing = this.courses[existingIdx];
      const next: Course = {
        ...existing,
        ...courseInput,
        status: existing.status === 'published' && actor?.role === 'instructor' ? existing.status : (courseInput.status || existing.status),
        updatedAt: now,
      };
      this.courses[existingIdx] = next;
      this.notifyListeners();
      return next;
    }

    const newCourse: Course = {
      id: courseInput.id || `course_${Date.now()}`,
      title: courseInput.title,
      description: courseInput.description || '',
      thumbnailUrl: courseInput.thumbnailUrl || '/images/programme_skills_1794461658653.jpg',
      category: courseInput.category,
      learningObjectives: courseInput.learningObjectives || ['Apply core skilling principles safely'],
      targetAudience: courseInput.targetAudience || 'Boys & Young Men in Uganda',
      ageEligibility: courseInput.ageEligibility || 'all_5_35',
      level: courseInput.level || 'beginner',
      durationHours: Number(courseInput.durationHours || 6),
      prerequisites: courseInput.prerequisites || [],
      instructorIds: courseInput.instructorIds || [actorUid],
      instructorNames: courseInput.instructorNames || [actor?.fullName || 'BCA Instructor'],
      learningFormat: courseInput.learningFormat || 'blended',
      startDate: courseInput.startDate || now.slice(0, 10),
      endDate: courseInput.endDate || '2027-06-30',
      enrolmentCapacity: Number(courseInput.enrolmentCapacity || 50),
      enrolledCount: 0,
      status: courseInput.status || 'draft',
      createdBy: actorUid,
      createdAt: now,
      updatedAt: now,
    };
    this.courses.unshift(newCourse);
    this.addAuditLog({
      action: 'COURSE_DRAFT_SAVED',
      performedBy: actor?.fullName || 'Instructor',
      performedByRole: actor?.role || 'instructor',
      targetEntity: 'courses',
      targetId: newCourse.id,
      details: `Saved course "${newCourse.title}" (${newCourse.status})`,
    });
    this.notifyListeners();
    return newCourse;
  }

  reviewCoursePublication(courseId: string, status: Course['status'], actorUid: string, approvalNotes?: string) {
    const actor = this.users[actorUid];
    if (!actor || (actor.role !== 'learning_manager' && actor.role !== 'admin')) {
      throw new Error('Only a Learning Manager or Administrator may approve or publish courses.');
    }
    const course = this.courses.find((c) => c.id === courseId);
    if (!course) throw new Error('Course not found.');
    course.status = status;
    course.approvedBy = actor.fullName;
    if (approvalNotes) course.approvalNotes = approvalNotes;
    course.updatedAt = new Date().toISOString();
    this.learningNotifications.unshift({
      id: `lnotif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      userId: course.createdBy,
      courseId,
      title: `Course ${status.replace('_', ' ')}`,
      message: `Course "${course.title}" is now ${status}.${approvalNotes ? ` Notes: ${approvalNotes}` : ''}`,
      category: 'announcement',
      read: false,
      createdAt: course.updatedAt,
    });
    this.addAuditLog({
      action: `COURSE_${status.toUpperCase()}`,
      performedBy: actor.fullName,
      performedByRole: actor.role,
      targetEntity: 'courses',
      targetId: courseId,
      details: `Course "${course.title}" set to ${status}`,
    });
    this.notifyListeners();
  }

  assignInstructorToCourse(
    courseId: string,
    instructorUid: string,
    actorUid: string,
    roleType: 'lead_instructor' | 'co_instructor' = 'lead_instructor',
    authorizeMentor = false
  ): InstructorAssignment {
    const actor = this.users[actorUid];
    if (!actor || (actor.role !== 'learning_manager' && actor.role !== 'admin')) {
      throw new Error('Only Learning Managers or Admins may assign course instructors.');
    }
    const course = this.courses.find((c) => c.id === courseId);
    const target = this.users[instructorUid];
    if (!course || !target) throw new Error('Course or instructor user not found.');
    if (target.role === 'mentor' && !target.instructorAuthorized && !authorizeMentor) {
      throw new Error('Approved mentors require explicit instructor authorization before teaching LMS courses.');
    }
    if (target.role === 'mentor' && authorizeMentor) {
      target.instructorAuthorized = true;
      target.updatedAt = new Date().toISOString();
    }
    if (target.role !== 'instructor' && target.role !== 'learning_manager' && target.role !== 'admin' && !target.instructorAuthorized) {
      throw new Error('User role is not authorized for instruction.');
    }

    const now = new Date().toISOString();
    const assignment: InstructorAssignment = {
      id: `${courseId}_${instructorUid}`,
      courseId,
      courseTitle: course.title,
      instructorUid,
      instructorName: target.fullName,
      roleType,
      assignedBy: actorUid,
      assignedByName: actor.fullName,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    };
    this.instructorAssignments = [assignment, ...this.instructorAssignments.filter((a) => a.id !== assignment.id)];
    if (!course.instructorIds.includes(instructorUid)) course.instructorIds.push(instructorUid);
    if (!course.instructorNames.includes(target.fullName)) course.instructorNames.push(target.fullName);
    this.addAuditLog({
      action: 'INSTRUCTOR_ASSIGNED',
      performedBy: actor.fullName,
      performedByRole: actor.role,
      targetEntity: 'instructorAssignments',
      targetId: assignment.id,
      details: `Assigned ${target.fullName} (${roleType}) to ${course.title}`,
    });
    this.notifyListeners();
    return assignment;
  }

  upsertCourseModule(input: Omit<CourseModule, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): CourseModule {
    const now = new Date().toISOString();
    const existingIdx = input.id ? this.courseModules.findIndex((m) => m.id === input.id) : -1;
    if (existingIdx >= 0) {
      const updated = { ...this.courseModules[existingIdx], ...input, updatedAt: now };
      this.courseModules[existingIdx] = updated;
      this.notifyListeners();
      return updated;
    }
    const created: CourseModule = {
      ...input,
      id: input.id || `mod_${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };
    this.courseModules.push(created);
    this.notifyListeners();
    return created;
  }

  upsertCourseLesson(input: Omit<CourseLesson, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): CourseLesson {
    const now = new Date().toISOString();
    const existingIdx = input.id ? this.courseLessons.findIndex((l) => l.id === input.id) : -1;
    if (existingIdx >= 0) {
      const updated = { ...this.courseLessons[existingIdx], ...input, updatedAt: now };
      this.courseLessons[existingIdx] = updated;
      this.notifyListeners();
      return updated;
    }
    const created: CourseLesson = {
      ...input,
      id: input.id || `les_${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };
    this.courseLessons.push(created);
    this.notifyListeners();
    return created;
  }

  addCourseAsset(asset: Omit<CourseAsset, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): CourseAsset {
    const now = new Date().toISOString();
    const created: CourseAsset = {
      ...asset,
      id: asset.id || `asset_${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };
    this.courseAssets.unshift(created);
    if (created.visibility === 'course_thumbnail' && created.previewDataUrl) {
      const c = this.courses.find((item) => item.id === created.courseId);
      if (c) c.thumbnailUrl = created.previewDataUrl;
    }
    this.notifyListeners();
    return created;
  }

  deleteCourseAsset(assetId: string) {
    this.courseAssets = this.courseAssets.filter((a) => a.id !== assetId);
    this.notifyListeners();
  }

  enrollInCourse(courseId: string, userId: string): CourseEnrollment {
    const course = this.courses.find((c) => c.id === courseId);
    const user = this.users[userId];
    if (!course) throw new Error('Course not found.');
    if (!user) throw new Error('User account not found.');
    if (course.status !== 'published') throw new Error('Course is not published for enrolment.');

    const isMinor = user.ageCategory === 'child_5_17' || (user.calculatedAge !== undefined && user.calculatedAge < 18);
    if (isMinor && user.status !== 'active') {
      throw new Error('Verified guardian consent is mandatory before a minor aged 5–17 can enrol in courses.');
    }
    if (course.ageEligibility === 'children_5_17' && !isMinor) {
      throw new Error('This course is reserved for boys aged 5–17.');
    }
    if ((course.ageEligibility === 'young_adults_18_35' || course.ageEligibility === 'adults_18_plus') && isMinor) {
      throw new Error('Age eligibility requires participants to be 18 or older.');
    }

    const existing = this.courseEnrollments.find((e) => e.courseId === courseId && e.userId === userId);
    if (existing && ['enrolled', 'approved', 'completed', 'pending'].includes(existing.status)) {
      return existing;
    }
    if (course.enrolledCount >= course.enrolmentCapacity) {
      throw new Error('Course capacity is full.');
    }

    const now = new Date().toISOString();
    const status: CourseEnrollment['status'] = course.learningFormat === 'self_paced' ? 'enrolled' : 'pending';
    const totalLessons = this.courseLessons.filter((l) => l.courseId === courseId && l.status === 'published').length;
    const enrollment: CourseEnrollment = {
      id: `${courseId}_${userId}`,
      courseId,
      courseTitle: course.title,
      userId,
      learnerName: user.fullName,
      learnerDistrict: user.district || 'Kampala',
      ageCategory: user.ageCategory || 'young_adult_18_35',
      isMinor,
      guardianConsentVerified: isMinor ? user.status === 'active' : true,
      status,
      progressPercent: 0,
      completedLessonsCount: 0,
      totalLessonsCount: totalLessons,
      learningMinutes: 0,
      enrolledAt: now,
      createdAt: now,
      updatedAt: now,
    };
    this.courseEnrollments.unshift(enrollment);
    if (status === 'enrolled') course.enrolledCount += 1;
    this.learningNotifications.unshift({
      id: `lnotif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      userId,
      courseId,
      title: status === 'enrolled' ? 'Course Enrolment Confirmed' : 'Enrolment Request Pending Approval',
      message:
        status === 'enrolled'
          ? `You are enrolled in "${course.title}". Start learning anytime.`
          : `Your enrolment request for "${course.title}" is pending Learning Manager review.`,
      category: 'enrolment',
      read: false,
      createdAt: now,
    });
    this.notifyListeners();
    return enrollment;
  }

  reviewCourseEnrollment(enrollmentId: string, decision: 'approved' | 'rejected', reason?: string) {
    const enroll = this.courseEnrollments.find((e) => e.id === enrollmentId);
    if (!enroll) throw new Error('Enrolment record not found.');
    const wasPending = enroll.status === 'pending';
    enroll.status = decision === 'approved' ? 'enrolled' : 'rejected';
    if (reason) enroll.rejectionReason = reason;
    enroll.updatedAt = new Date().toISOString();
    if (decision === 'approved' && wasPending) {
      const c = this.courses.find((item) => item.id === enroll.courseId);
      if (c) c.enrolledCount += 1;
    }
    this.learningNotifications.unshift({
      id: `lnotif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      userId: enroll.userId,
      courseId: enroll.courseId,
      title: decision === 'approved' ? 'Course Enrolment Approved' : 'Enrolment Declined',
      message:
        decision === 'approved'
          ? `Your enrolment in "${enroll.courseTitle}" is approved.`
          : `Your enrolment in "${enroll.courseTitle}" was declined.${reason ? ` Reason: ${reason}` : ''}`,
      category: 'enrolment',
      read: false,
      createdAt: enroll.updatedAt,
    });
    this.notifyListeners();
  }

  recordLessonProgress(params: {
    courseId: string;
    moduleId: string;
    lessonId: string;
    userId: string;
    completed?: boolean;
    lastPositionSeconds?: number;
    watchedSecondsDelta?: number;
    playbackSpeed?: number;
  }): LessonProgress {
    const enroll = this.courseEnrollments.find((e) => e.courseId === params.courseId && e.userId === params.userId);
    if (!enroll || !['enrolled', 'approved', 'completed'].includes(enroll.status)) {
      throw new Error('Enrolment is required before tracking lesson progress.');
    }
    const id = `${params.courseId}_${params.lessonId}_${params.userId}`;
    const existing = this.lessonProgress.find((p) => p.id === id);
    const now = new Date().toISOString();
    let rec: LessonProgress;
    if (existing) {
      if (params.completed !== undefined) existing.completed = params.completed;
      if (params.lastPositionSeconds !== undefined) existing.lastPositionSeconds = params.lastPositionSeconds;
      if (params.watchedSecondsDelta) existing.watchedSeconds += params.watchedSecondsDelta;
      if (params.playbackSpeed !== undefined) existing.playbackSpeed = params.playbackSpeed;
      existing.updatedAt = now;
      rec = existing;
    } else {
      rec = {
        id,
        courseId: params.courseId,
        moduleId: params.moduleId,
        lessonId: params.lessonId,
        userId: params.userId,
        completed: Boolean(params.completed),
        lastPositionSeconds: params.lastPositionSeconds || 0,
        watchedSeconds: params.watchedSecondsDelta || 0,
        playbackSpeed: params.playbackSpeed || 1,
        updatedAt: now,
      };
      this.lessonProgress.push(rec);
    }

    this.recalculateEnrollmentAndCertificate(params.courseId, params.userId);
    this.notifyListeners();
    return rec;
  }

  recalculateEnrollmentAndCertificate(courseId: string, userId: string): number {
    const enroll = this.courseEnrollments.find((e) => e.courseId === courseId && e.userId === userId);
    if (!enroll) return 0;
    const lessons = this.courseLessons.filter((l) => l.courseId === courseId && l.status === 'published' && l.isRequired !== false);
    const total = lessons.length || this.courseLessons.filter((l) => l.courseId === courseId && l.status === 'published').length;
    const completedIds = new Set(
      this.lessonProgress.filter((p) => p.courseId === courseId && p.userId === userId && p.completed).map((p) => p.lessonId)
    );
    const completedCount = lessons.filter((l) => completedIds.has(l.id)).length;
    const watchedMin = Math.round(
      this.lessonProgress.filter((p) => p.courseId === courseId && p.userId === userId).reduce((s, p) => s + p.watchedSeconds, 0) / 60
    );
    enroll.completedLessonsCount = completedCount;
    enroll.totalLessonsCount = total;
    enroll.learningMinutes = Math.max(enroll.learningMinutes, watchedMin);
    enroll.progressPercent = total === 0 ? 0 : Math.min(100, Math.round((completedCount / total) * 100));
    if (enroll.progressPercent === 100) {
      enroll.status = 'completed';
      enroll.completedAt = enroll.completedAt || new Date().toISOString();
      this.issueCertificate(courseId, userId, 'Automated Completion Engine');
    }
    return enroll.progressPercent;
  }

  upsertAssessment(input: Omit<Assessment, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Assessment {
    const now = new Date().toISOString();
    const created: Assessment = {
      ...input,
      id: input.id || `assm_${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };
    const idx = this.assessments.findIndex((a) => a.id === created.id);
    if (idx >= 0) this.assessments[idx] = { ...this.assessments[idx], ...created, updatedAt: now };
    else this.assessments.push(created);
    this.notifyListeners();
    return created;
  }

  upsertAssessmentQuestion(params: {
    assessmentId: string;
    courseId: string;
    orderIndex: number;
    questionType: AssessmentQuestion['questionType'];
    prompt: string;
    options?: string[];
    points: number;
    correctOptionIndex?: number;
    correctBoolean?: boolean;
    expectedKeywords?: string[];
    explanation?: string;
    createdBy: string;
  }): AssessmentQuestion {
    const now = new Date().toISOString();
    const q: AssessmentQuestion = {
      id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      assessmentId: params.assessmentId,
      courseId: params.courseId,
      orderIndex: params.orderIndex,
      questionType: params.questionType,
      prompt: params.prompt,
      options: params.options,
      points: params.points,
      createdBy: params.createdBy,
      createdAt: now,
      updatedAt: now,
    };
    this.assessmentQuestions.push(q);
    this.assessmentAnswerKeys.push({
      questionId: q.id,
      assessmentId: params.assessmentId,
      courseId: params.courseId,
      correctOptionIndex: params.correctOptionIndex,
      correctBoolean: params.correctBoolean,
      expectedKeywords: params.expectedKeywords,
      explanation: params.explanation,
      updatedAt: now,
    });
    this.notifyListeners();
    return q;
  }

  submitAssessmentAttempt(
    assessmentId: string,
    courseId: string,
    userId: string,
    answers: Record<string, string | number | boolean>
  ): AssessmentAttempt {
    const enroll = this.courseEnrollments.find((e) => e.courseId === courseId && e.userId === userId);
    if (!enroll || !['enrolled', 'approved', 'completed'].includes(enroll.status)) {
      throw new Error('Enrolment in this course is required before taking assessments.');
    }
    const assessment = this.assessments.find((a) => a.id === assessmentId);
    if (!assessment) throw new Error('Assessment not found.');
    const prior = this.assessmentAttempts.filter((a) => a.assessmentId === assessmentId && a.userId === userId);
    if (prior.length >= assessment.maxAttempts) {
      throw new Error(`Maximum attempts (${assessment.maxAttempts}) reached.`);
    }

    const questions = this.assessmentQuestions.filter((q) => q.assessmentId === assessmentId);
    let totalPoints = 0;
    let earnedPoints = 0;
    let hasManual = false;
    for (const q of questions) {
      totalPoints += q.points;
      const key = this.assessmentAnswerKeys.find((k) => k.questionId === q.id);
      const ans = answers[q.id];
      if (q.questionType === 'mcq' && key && Number(ans) === Number(key.correctOptionIndex)) {
        earnedPoints += q.points;
      } else if (q.questionType === 'true_false' && key && Boolean(ans) === Boolean(key.correctBoolean)) {
        earnedPoints += q.points;
      } else if (q.questionType === 'short_answer' && key?.expectedKeywords && typeof ans === 'string') {
        const lower = ans.toLowerCase();
        if (key.expectedKeywords.some((kw) => lower.includes(kw.toLowerCase()))) earnedPoints += q.points;
      } else if (q.questionType === 'written') {
        hasManual = true;
      }
    }

    const scorePercent = totalPoints === 0 ? 100 : Math.round((earnedPoints / totalPoints) * 100);
    const passed = !hasManual && scorePercent >= assessment.passMarkPercent;
    const now = new Date().toISOString();
    const attempt: AssessmentAttempt = {
      id: `att_${Date.now()}`,
      assessmentId,
      courseId,
      userId,
      learnerName: this.users[userId]?.fullName || 'Learner',
      attemptNumber: prior.length + 1,
      answers,
      scorePercent,
      earnedPoints,
      totalPoints,
      passed,
      status: hasManual ? 'submitted' : 'graded',
      gradedBy: hasManual ? undefined : 'Auto-Grader',
      submittedAt: now,
      gradedAt: hasManual ? undefined : now,
    };
    this.assessmentAttempts.unshift(attempt);
    this.notifyListeners();
    return attempt;
  }

  submitAssignmentWork(params: {
    assessmentId: string;
    courseId: string;
    userId: string;
    submissionText: string;
    fileAssetPath?: string;
    fileName?: string;
  }): AssignmentSubmission {
    const enroll = this.courseEnrollments.find((e) => e.courseId === params.courseId && e.userId === params.userId);
    if (!enroll || !['enrolled', 'approved', 'completed'].includes(enroll.status)) {
      throw new Error('Enrolment in this course is required to submit assignments.');
    }
    const sub: AssignmentSubmission = {
      id: `sub_${Date.now()}`,
      assessmentId: params.assessmentId,
      courseId: params.courseId,
      userId: params.userId,
      learnerName: this.users[params.userId]?.fullName || 'Learner',
      submissionText: params.submissionText,
      fileAssetPath: params.fileAssetPath,
      fileName: params.fileName,
      status: 'submitted',
      submittedAt: new Date().toISOString(),
    };
    this.assignmentSubmissions.unshift(sub);
    this.notifyListeners();
    return sub;
  }

  gradeAssignmentSubmission(submissionId: string, scorePercent: number, feedback: string, graderName: string, resubmit = false) {
    const sub = this.assignmentSubmissions.find((s) => s.id === submissionId);
    if (!sub) throw new Error('Submission not found.');
    sub.status = resubmit ? 'resubmit_requested' : 'graded';
    sub.scorePercent = scorePercent;
    sub.instructorFeedback = feedback;
    sub.gradedBy = graderName;
    sub.gradedAt = new Date().toISOString();
    this.learningNotifications.unshift({
      id: `lnotif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      userId: sub.userId,
      courseId: sub.courseId,
      title: resubmit ? 'Assignment Resubmission Requested' : 'Assignment Graded',
      message: `Score: ${scorePercent}%. Instructor feedback: ${feedback}`,
      category: 'assessment',
      read: false,
      createdAt: sub.gradedAt,
    });
    this.notifyListeners();
  }

  updateZoomConfiguration(hostUserIdOrEmail: string, actorName: string): ZoomConfigStatus {
    this.zoomConfig = {
      ...this.zoomConfig,
      hostUserIdOrEmail,
      defaultTimezone: 'Africa/Kampala',
      minorSafeguardingLock: true,
      updatedBy: actorName,
      updatedAt: new Date().toISOString(),
    };
    this.notifyListeners();
    return this.zoomConfig;
  }

  testZoomConnectionOfflineHonest(): ZoomConfigStatus {
    this.zoomConfig = {
      ...this.zoomConfig,
      connected: false,
      secretsConfigured: false,
      lastTestedAt: new Date().toISOString(),
      statusMessage:
        'Zoom Server-to-Server OAuth credentials are not configured in Cloud Functions Secret Manager yet. Set ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, and ZOOM_CLIENT_SECRET to enable automated Zoom meeting creation.',
      updatedAt: new Date().toISOString(),
    };
    this.notifyListeners();
    return this.zoomConfig;
  }

  scheduleCourseSession(params: {
    courseId: string;
    title: string;
    description: string;
    instructorUid: string;
    scheduledDate: string;
    startTimeKampala: string;
    durationMinutes: number;
    isRecurring?: boolean;
    manualJoinUrl?: string;
    manualPasscode?: string;
  }): CourseSession {
    if (!this.zoomConfig.secretsConfigured && !params.manualJoinUrl) {
      throw new Error(
        'Zoom Server-to-Server OAuth credentials are not configured. Configure Zoom secrets in Learning Manager settings or supply a manual Zoom meeting URL fallback.'
      );
    }
    const utcDate = new Date(`${params.scheduledDate}T${params.startTimeKampala}:00+03:00`);
    if (Number.isNaN(utcDate.getTime())) {
      throw new Error('Invalid date or Kampala time.');
    }
    const course = this.courses.find((c) => c.id === params.courseId);
    const instructor = this.users[params.instructorUid];
    const now = new Date().toISOString();
    const sessionId = `csess_${Date.now()}`;
    const meetingDocId = `zm_${Date.now()}`;
    const session: CourseSession = {
      id: sessionId,
      courseId: params.courseId,
      courseTitle: course?.title || 'BCA Course',
      title: params.title,
      description: params.description,
      instructorUid: params.instructorUid,
      instructorName: instructor?.fullName || 'BCA Instructor',
      scheduledDate: params.scheduledDate,
      startTimeKampala: params.startTimeKampala,
      startsAtIso: utcDate.toISOString(),
      durationMinutes: params.durationMinutes,
      timezone: 'Africa/Kampala',
      zoomMeetingDocId: meetingDocId,
      manualJoinUrl: params.manualJoinUrl,
      isRecurring: Boolean(params.isRecurring),
      status: 'scheduled',
      createdBy: params.instructorUid,
      createdAt: now,
      updatedAt: now,
    };
    const meeting: ZoomMeetingRecord = {
      id: meetingDocId,
      courseId: params.courseId,
      sessionId,
      zoomMeetingId: this.zoomConfig.secretsConfigured ? String(Date.now()) : `MANUAL-${Date.now()}`,
      topic: params.title,
      startTimeUtc: utcDate.toISOString(),
      durationMinutes: params.durationMinutes,
      timezone: 'Africa/Kampala',
      hostIdentity: instructor?.fullName || 'BCA Instructor',
      status: 'scheduled',
      waitingRoom: true,
      joinBeforeHost: false,
      recordingEnabled: false,
      participantRestrictionsApplied: true,
      passcodeProtected: Boolean(params.manualPasscode),
      mode: this.zoomConfig.secretsConfigured ? 'zoom_api' : 'manual_fallback',
      createdBy: params.instructorUid,
      createdAt: now,
      updatedAt: now,
    };
    this.courseSessions.unshift(session);
    this.zoomMeetings.unshift(meeting);
    this.zoomMeetingSecrets[meetingDocId] = {
      joinUrl: params.manualJoinUrl || 'https://zoom.us/j/unconfigured',
      startUrl: params.manualJoinUrl || 'https://zoom.us/s/unconfigured',
      passcode: params.manualPasscode || '',
    };
    this.notifyListeners();
    return session;
  }

  getAuthorizedMeetingAccess(sessionId: string, callerUid: string): AuthorizedMeetingAccess {
    const session = this.courseSessions.find((s) => s.id === sessionId);
    if (!session) throw new Error('Live class session not found.');
    if (session.status === 'cancelled') throw new Error('This live class session has been cancelled.');

    const caller = this.users[callerUid];
    if (!caller) throw new Error('Sign in required to access live meetings.');
    const isHostOrManager =
      caller.role === 'admin' ||
      caller.role === 'learning_manager' ||
      this.canUserInstructCourse(callerUid, session.courseId);
    const isEnrolled = this.courseEnrollments.some(
      (e) => e.courseId === session.courseId && e.userId === callerUid && ['enrolled', 'approved', 'completed'].includes(e.status)
    );
    if (!isHostOrManager && !isEnrolled) {
      throw new Error('Only enrolled learners or assigned instructors can join this live class.');
    }
    const meeting = this.zoomMeetings.find((m) => m.id === session.zoomMeetingDocId);
    const secret = session.zoomMeetingDocId ? this.zoomMeetingSecrets[session.zoomMeetingDocId] : undefined;
    if (!meeting || !secret) throw new Error('Meeting link has not been configured yet.');

    return {
      sessionId: session.id,
      zoomMeetingId: meeting.zoomMeetingId,
      topic: session.title,
      startsAtIso: session.startsAtIso,
      durationMinutes: session.durationMinutes,
      timezone: 'Africa/Kampala',
      joinUrl: secret.joinUrl,
      passcode: secret.passcode,
      ...(isHostOrManager ? { startUrl: secret.startUrl } : {}),
      safeguardingNotice: 'Waiting Room is enabled and recording is disabled by default for minor safeguarding.',
    };
  }

  cancelCourseSession(sessionId: string) {
    const s = this.courseSessions.find((item) => item.id === sessionId);
    if (s) {
      s.status = 'cancelled';
      s.updatedAt = new Date().toISOString();
      const m = this.zoomMeetings.find((item) => item.id === s.zoomMeetingDocId);
      if (m) m.status = 'cancelled';
      this.notifyListeners();
    }
  }

  recordSessionAttendance(params: {
    sessionId: string;
    courseId: string;
    userId: string;
    learnerName: string;
    status: SessionAttendance['status'];
    markedBy: string;
    markedByName: string;
  }) {
    const id = `${params.sessionId}_${params.userId}`;
    const existing = this.sessionAttendance.find((a) => a.id === id);
    const now = new Date().toISOString();
    if (existing) {
      existing.status = params.status;
      existing.markedBy = params.markedBy;
      existing.markedByName = params.markedByName;
      existing.recordedAt = now;
    } else {
      this.sessionAttendance.unshift({ ...params, id, recordedAt: now });
    }
    this.notifyListeners();
  }

  addCourseAnnouncement(ann: Omit<CourseAnnouncement, 'id' | 'createdAt'>): CourseAnnouncement {
    const created: CourseAnnouncement = {
      ...ann,
      id: `cann_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    this.courseAnnouncements.unshift(created);
    this.notifyListeners();
    return created;
  }

  issueCertificate(courseId: string, userId: string, signatoryManager = 'Florence Namono'): CourseCertificate {
    const existing = this.certificates.find((c) => c.courseId === courseId && c.userId === userId);
    if (existing) return existing;
    const course = this.courses.find((c) => c.id === courseId);
    const user = this.users[userId];
    if (!course || !user) throw new Error('Course or learner not found.');
    const isMinor = user.ageCategory === 'child_5_17' || (user.calculatedAge !== undefined && user.calculatedAge < 18);
    const parts = user.fullName.split(' ').filter(Boolean);
    const displayName = isMinor
      ? parts.length > 1
        ? `${parts[0]} ${parts[parts.length - 1][0]}.`
        : `${parts[0]?.[0] || 'B'}.`
      : user.fullName;

    const certNumber = `BCA-CERT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const qrToken = `CERTQR-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    const completionDate = new Date().toISOString().slice(0, 10);
    const now = new Date().toISOString();
    const cert: CourseCertificate = {
      id: `${courseId}_${userId}`,
      certificateNumber: certNumber,
      courseId,
      courseTitle: course.title,
      userId,
      learnerDisplayName: displayName,
      completionDate,
      instructorSignatory: course.instructorNames[0] || 'BCA Lead Instructor',
      learningManagerSignatory: signatoryManager,
      qrToken,
      status: 'issued',
      issuedAt: now,
      updatedAt: now,
    };
    this.certificates.unshift(cert);
    this.certificateVerifications[certNumber] = {
      certificateNumber: certNumber,
      courseTitle: course.title,
      learnerDisplayName: displayName,
      completionDate,
      instructorSignatory: cert.instructorSignatory,
      status: 'issued',
      qrToken,
      updatedAt: now,
    };
    this.learningNotifications.unshift({
      id: `lnotif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      userId,
      courseId,
      title: 'Digital Certificate Issued',
      message: `Certificate ${certNumber} for "${course.title}" is now available.`,
      category: 'certificate',
      read: false,
      createdAt: now,
    });
    this.notifyListeners();
    return cert;
  }

  revokeCertificate(certificateId: string, reason: string, actorName: string) {
    const cert = this.certificates.find((c) => c.id === certificateId);
    if (!cert) throw new Error('Certificate not found.');
    const now = new Date().toISOString();
    cert.status = 'revoked';
    cert.revokedReason = reason;
    cert.revokedBy = actorName;
    cert.updatedAt = now;
    if (this.certificateVerifications[cert.certificateNumber]) {
      this.certificateVerifications[cert.certificateNumber].status = 'revoked';
      this.certificateVerifications[cert.certificateNumber].revokedAt = now;
      this.certificateVerifications[cert.certificateNumber].updatedAt = now;
    }
    this.addAuditLog({
      action: 'LMS_CERTIFICATE_REVOKED',
      performedBy: actorName,
      performedByRole: 'learning_manager',
      targetEntity: 'certificates',
      targetId: cert.certificateNumber,
      details: reason,
    });
    this.notifyListeners();
  }

  verifyCertificate(certNumberOrToken: string): CertificateVerificationRecord | null {
    const clean = certNumberOrToken.trim().toUpperCase();
    if (!clean) return null;
    if (this.certificateVerifications[clean]) return this.certificateVerifications[clean];
    return (
      Object.values(this.certificateVerifications).find(
        (v) => v.certificateNumber.toUpperCase() === clean || v.qrToken.toUpperCase() === clean
      ) || null
    );
  }

  markLearningNotificationRead(notifId: string) {
    const n = this.learningNotifications.find((item) => item.id === notifId);
    if (n) {
      n.read = true;
      this.notifyListeners();
    }
  }

  getMemberDirectoryEntries(viewerUid: string, viewerRole: UserRole): MemberDirectoryEntry[] {
    if (!viewerUid) return [];
    if (viewerRole !== 'mentor' && viewerRole !== 'coordinator' && viewerRole !== 'admin') {
      return [];
    }

    const assignedCircleIds =
      viewerRole === 'mentor'
        ? this.circles
            .filter((c) => c.leadMentorId === viewerUid || (c.coMentorIds && c.coMentorIds.includes(viewerUid)))
            .map((c) => c.id)
        : [];

    const circleById = new Map(this.circles.map((c) => [c.id, c]));
    const membershipByUserId = new Map<string, CircleMembership>();
    this.circleMemberships.forEach((m) => {
      if (!membershipByUserId.has(m.userId)) {
        membershipByUserId.set(m.userId, m);
      }
    });

    const entriesByUid = new Map<string, MemberDirectoryEntry>();

    const upsertEntry = (uid: string) => {
      const profile = this.memberProfiles[uid];
      const userDoc = viewerRole === 'coordinator' || viewerRole === 'admin' ? this.users[uid] : undefined;
      const membership = membershipByUserId.get(uid);

      if (!profile && !userDoc && !membership) return;
      if (userDoc && userDoc.role !== 'boy') return;

      const circleId = profile?.circleId || membership?.circleId || userDoc?.circleId;
      if (viewerRole === 'mentor') {
        if (!circleId || !assignedCircleIds.includes(circleId)) return;
      }

      const circle = circleId ? circleById.get(circleId) : undefined;
      const age = profile?.calculatedAge ?? userDoc?.calculatedAge ?? 16;
      const ageCategory: 'child_5_17' | 'young_adult_18_35' =
        profile?.ageCategory ||
        membership?.ageCategory ||
        (age < 18 ? 'child_5_17' : 'young_adult_18_35');
      const status: UserStatus =
        profile?.status ||
        userDoc?.status ||
        (membership?.status === 'active' ? 'active' : 'pending_guardian_consent');

      const guardianConsentStatus: MemberDirectoryEntry['guardianConsentStatus'] =
        ageCategory === 'young_adult_18_35'
          ? 'self_consent'
          : status === 'active'
            ? 'verified'
            : 'pending';

      entriesByUid.set(uid, {
        uid,
        fullName: profile?.fullName || userDoc?.fullName || membership?.memberName || 'BCA Member',
        ageCategory,
        calculatedAge: age,
        district: profile?.district || userDoc?.district || circle?.district || 'Kampala',
        town: profile?.town || userDoc?.town || 'District Chapter',
        status,
        membershipNumber: profile?.membershipNumber || userDoc?.membershipNumber,
        schoolOrOccupation: profile?.schoolOrOccupation || userDoc?.schoolOrOccupation,
        interests: profile?.interests || userDoc?.interests || [],
        circleId,
        circleName: circle?.name,
        circleDistrict: circle?.district,
        circleMeetingTime: circle?.meetingTime,
        leadMentorName: circle?.leadMentorName,
        circleMembershipStatus: membership?.status,
        attendanceCount: profile?.attendanceCount ?? 0,
        achievements: profile?.achievements || [],
        guardianConsentStatus,
      });
    };

    Object.keys(this.memberProfiles).forEach(upsertEntry);
    this.circleMemberships.forEach((m) => upsertEntry(m.userId));
    if (viewerRole === 'coordinator' || viewerRole === 'admin') {
      Object.values(this.users)
        .filter((u) => u.role === 'boy')
        .forEach((u) => upsertEntry(u.uid));
    }

    return Array.from(entriesByUid.values()).sort((a, b) => a.fullName.localeCompare(b.fullName));
  }

  notifyExternalSubscribers() {
    this.notifyListeners();
  }

  addAuditLog(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>) {
    const newEntry: AuditLogEntry = {
      ...entry,
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
    };
    this.auditLogs.unshift(newEntry);
  }

  private listeners: (() => void)[] = [];
  subscribe(fn: () => void) {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== fn);
    };
  }
  private notifyListeners() {
    this.listeners.forEach((fn) => fn());
  }
}

export const mockStore = new MockStore();
