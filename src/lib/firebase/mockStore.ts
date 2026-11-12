import {
  AppUser,
  Programme,
  Circle,
  CircleSession,
  Goal,
  Question,
  ConcernReport,
  JoinRequest,
  MentorApplication,
  AuditLogEntry,
  UserRole
} from '../../types';

// Initial pre-seeded realistic Uganda safeguarding and mentorship data
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
    imagePath: '/src/assets/images/programme_mentorship_1794461658375.jpg',
    activeBoysCount: 420,
    availablePlaces: 35
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
    imagePath: '/src/assets/images/programme_skills_1794461658653.jpg',
    activeBoysCount: 290,
    availablePlaces: 18
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
    imagePath: '/src/assets/images/programme_wellbeing_1794461659186.jpg',
    activeBoysCount: 350,
    availablePlaces: 40
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
    imagePath: '/src/assets/images/hero_boys_circle_1794461657319.jpg',
    activeBoysCount: 680,
    availablePlaces: 75
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
    activeBoysCount: 180,
    availablePlaces: 50
  }
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
    maxMembers: 12,
    activeMembersCount: 9,
    safeguardingLeadName: 'Sister Sarah Nabirye',
    focusArea: 'Academic Grit & Integrity',
    status: 'active'
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
    status: 'active'
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
    status: 'forming'
  }
];

const INITIAL_SESSIONS: CircleSession[] = [
  {
    id: 'sess_1',
    circleId: 'circle_kampala_central',
    title: 'Module 4: Managing Anger and Peer Pressure',
    theme: 'Emotional Regulation',
    scheduledAt: '2026-11-14T10:00:00Z',
    location: 'Old Kampala Community Centre, Room 2',
    mentorName: 'Emmanuel Okello',
    notes: 'Bring your reflection journal. We will role-play resisting dangerous peer bets.',
    completed: false
  },
  {
    id: 'sess_2',
    circleId: 'circle_kampala_central',
    title: 'Module 5: Setting Real-World Academic & Craft Goals',
    theme: 'Future Pathways',
    scheduledAt: '2026-11-21T10:00:00Z',
    location: 'Old Kampala Community Centre, Room 2',
    mentorName: 'Emmanuel Okello',
    notes: 'Guest speaker: Senior Solar Technician Patrick from Nakawa VTI.',
    completed: false
  }
];

const INITIAL_GOALS: Goal[] = [
  {
    id: 'goal_1',
    userId: 'usr_boy_active',
    title: 'Improve O-Level Mathematics from C to B+',
    category: 'Education',
    progress: 75,
    targetDate: '2026-12-05',
    notes: 'Attending weekly Saturday study group with mentor Emmanuel. Finished past papers for 2022-2024.',
    completed: false,
    createdAt: '2026-10-01T08:00:00Z',
    updatedAt: '2026-11-08T14:30:00Z'
  },
  {
    id: 'goal_2',
    userId: 'usr_boy_active',
    title: 'Complete Solar Inverter Wiring Certificate',
    category: 'Career & Craft',
    progress: 100,
    targetDate: '2026-11-01',
    notes: 'Passed practical test on household solar battery circuit assembly.',
    completed: true,
    createdAt: '2026-09-15T09:00:00Z',
    updatedAt: '2026-11-01T16:00:00Z'
  },
  {
    id: 'goal_3',
    userId: 'usr_boy_active',
    title: 'Daily 15-Minute Journaling for Stress Management',
    category: 'Emotional Wellbeing',
    progress: 50,
    targetDate: '2026-11-30',
    notes: 'Keeping a notebook before sleep to write down three things I am grateful for.',
    completed: false,
    createdAt: '2026-10-15T11:00:00Z',
    updatedAt: '2026-11-10T19:00:00Z'
  }
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
    createdAt: '2026-11-08T12:00:00Z'
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
    createdAt: '2026-11-09T18:30:00Z'
  }
];

const INITIAL_CONCERN_REPORTS: ConcernReport[] = [
  {
    id: 'rep_101',
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
    updatedAt: '2026-11-10T14:00:00Z'
  },
  {
    id: 'rep_102',
    isAnonymous: true,
    district: 'Kampala',
    concernCategory: 'emotional_distress',
    urgency: 'medium',
    details: 'A member of our circle has stopped attending school for 2 weeks after losing his older brother. He sits alone near the park and appears severely depressed.',
    status: 'new',
    assignedCoordinator: 'Sister Sarah Nabirye',
    triageNotes: 'Scheduled a home pastoral visit with local counselor for Friday morning.',
    createdAt: '2026-11-11T14:30:00Z',
    updatedAt: '2026-11-11T14:30:00Z'
  }
];

const INITIAL_USERS: Record<string, AppUser> = {
  usr_boy_pending: {
    uid: 'usr_boy_pending',
    email: 'john.ssemwo@boychild.demo',
    fullName: 'John Baptist Ssemwogerere',
    phone: '+256778901234',
    role: 'boy',
    status: 'pending_guardian_consent',
    district: 'Wakiso',
    town: 'Kira Town Council',
    calculatedAge: 15,
    guardianId: 'usr_guardian_grace',
    guardianName: 'Grace Mukasa',
    guardianPhone: '+256772334455',
    createdAt: '2026-11-10T10:00:00Z',
    updatedAt: '2026-11-10T10:00:00Z',
    createdBy: 'usr_boy_pending'
  },
  usr_boy_active: {
    uid: 'usr_boy_active',
    email: 'david.mukasa@boychild.demo',
    fullName: 'David Mukasa',
    phone: '+256782555111',
    role: 'boy',
    status: 'active',
    district: 'Kampala',
    town: 'Old Kampala',
    calculatedAge: 17,
    guardianId: 'usr_guardian_grace',
    guardianName: 'Grace Mukasa',
    guardianPhone: '+256772334455',
    circleId: 'circle_kampala_central',
    createdAt: '2026-08-14T08:00:00Z',
    updatedAt: '2026-11-01T12:00:00Z',
    createdBy: 'system'
  },
  usr_guardian_grace: {
    uid: 'usr_guardian_grace',
    email: 'grace.mukasa@boychild.demo',
    fullName: 'Grace Mukasa',
    phone: '+256772334455',
    role: 'guardian',
    status: 'active',
    district: 'Wakiso',
    town: 'Kira Town Council',
    createdAt: '2026-08-10T09:00:00Z',
    updatedAt: '2026-11-10T10:00:00Z',
    createdBy: 'usr_guardian_grace'
  },
  usr_mentor_okello: {
    uid: 'usr_mentor_okello',
    email: 'emmanuel.okello@boychild.demo',
    fullName: 'Emmanuel Okello',
    phone: '+256772987654',
    role: 'mentor',
    status: 'active',
    district: 'Kampala',
    town: 'Makerere / Old Kampala',
    circleId: 'circle_kampala_central',
    createdAt: '2026-06-01T08:00:00Z',
    updatedAt: '2026-10-15T10:00:00Z',
    createdBy: 'admin'
  },
  usr_coordinator_sarah: {
    uid: 'usr_coordinator_sarah',
    email: 'sarah.nabirye@boychild.org',
    fullName: 'Sister Sarah Nabirye',
    phone: '+256772001122',
    role: 'coordinator',
    status: 'active',
    district: 'Kampala',
    town: 'Kampala Central',
    createdAt: '2026-01-10T08:00:00Z',
    updatedAt: '2026-11-01T09:00:00Z',
    createdBy: 'admin'
  },
  usr_admin_kato: {
    uid: 'usr_admin_kato',
    email: 'mukasa.kato@boychild.org',
    fullName: 'Dr. Mukasa Kato',
    phone: '+256782000001',
    role: 'admin',
    status: 'active',
    district: 'Kampala',
    town: 'Kololo',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2026-11-11T12:00:00Z',
    createdBy: 'system'
  }
};

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
    referee1: { name: 'Rev. Samuel Kato', phone: '+256772889900', status: 'verified' },
    referee2: { name: 'Madam Beatrice Nansubuga', phone: '+256755112233', status: 'pending' },
    dbsSafeguardingCheck: 'cleared',
    status: 'pending_vetting',
    createdAt: '2026-11-08T11:20:00Z'
  }
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
    timestamp: '2026-08-14T08:30:00Z'
  },
  {
    id: 'log_02',
    action: 'CIRCLE_MEMBER_ASSIGNED',
    performedBy: 'Sister Sarah Nabirye',
    performedByRole: 'coordinator',
    targetEntity: 'circles',
    targetId: 'circle_kampala_central',
    details: 'Assigned David Mukasa to Kampala Central Champions Circle after parental consent',
    timestamp: '2026-08-14T09:00:00Z'
  },
  {
    id: 'log_03',
    action: 'SAFEGUARDING_TRIAGE_OPENED',
    performedBy: 'Sister Sarah Nabirye',
    performedByRole: 'coordinator',
    targetEntity: 'concernReports',
    targetId: 'rep_101',
    details: 'High-urgency report triaged: Community liaison alerted regarding neighbourhood school crossing',
    timestamp: '2026-11-09T09:30:00Z'
  }
];

// In-Memory & LocalStorage persistent reactive state
class MockStore {
  users: Record<string, AppUser>;
  programmes: Programme[];
  circles: Circle[];
  sessions: CircleSession[];
  goals: Goal[];
  questions: Question[];
  concernReports: ConcernReport[];
  mentorApplications: MentorApplication[];
  auditLogs: AuditLogEntry[];
  currentUserUid: string;

  constructor() {
    this.users = { ...INITIAL_USERS };
    this.programmes = [...INITIAL_PROGRAMMES];
    this.circles = [...INITIAL_CIRCLES];
    this.sessions = [...INITIAL_SESSIONS];
    this.goals = [...INITIAL_GOALS];
    this.questions = [...INITIAL_QUESTIONS];
    this.concernReports = [...INITIAL_CONCERN_REPORTS];
    this.mentorApplications = [...INITIAL_MENTOR_APPLICATIONS];
    this.auditLogs = [...INITIAL_AUDIT_LOGS];
    this.currentUserUid = 'usr_boy_active'; // Default active boy persona

    // Load from localStorage if present
    this.loadState();
  }

  private loadState() {
    if (typeof window === 'undefined') return;
    try {
      const savedUser = localStorage.getItem('bca_current_user_uid');
      if (savedUser && this.users[savedUser]) {
        this.currentUserUid = savedUser;
      }
      const savedReports = localStorage.getItem('bca_concern_reports');
      if (savedReports) {
        this.concernReports = JSON.parse(savedReports);
      }
      const savedGoals = localStorage.getItem('bca_goals');
      if (savedGoals) {
        this.goals = JSON.parse(savedGoals);
      }
      const savedQuestions = localStorage.getItem('bca_questions');
      if (savedQuestions) {
        this.questions = JSON.parse(savedQuestions);
      }
      const savedUsers = localStorage.getItem('bca_users');
      if (savedUsers) {
        this.users = { ...this.users, ...JSON.parse(savedUsers) };
      }
    } catch {
      // Ignore parse errors
    }
  }

  private saveState() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('bca_current_user_uid', this.currentUserUid);
      localStorage.setItem('bca_concern_reports', JSON.stringify(this.concernReports));
      localStorage.setItem('bca_goals', JSON.stringify(this.goals));
      localStorage.setItem('bca_questions', JSON.stringify(this.questions));
      localStorage.setItem('bca_users', JSON.stringify(this.users));
    } catch {
      // Storage quota or private mode
    }
  }

  getCurrentUser(): AppUser {
    return this.users[this.currentUserUid] || this.users.usr_boy_active;
  }

  switchUser(uid: string) {
    if (this.users[uid]) {
      this.currentUserUid = uid;
      this.saveState();
      this.notifyListeners();
    }
  }

  addUser(user: AppUser) {
    this.users[user.uid] = user;
    this.currentUserUid = user.uid;
    this.addAuditLog({
      action: 'USER_REGISTERED',
      performedBy: user.fullName,
      performedByRole: user.role,
      targetEntity: 'users',
      targetId: user.uid,
      details: `User registered with role ${user.role} and status ${user.status}`
    });
    this.saveState();
    this.notifyListeners();
  }

  approveGuardianConsent(boyUid: string, guardianUid: string) {
    if (this.users[boyUid]) {
      this.users[boyUid].status = 'active';
      this.users[boyUid].circleId = 'circle_kampala_central';
      this.addAuditLog({
        action: 'GUARDIAN_CONSENT_RECORDED',
        performedBy: this.users[guardianUid]?.fullName || 'Guardian',
        performedByRole: 'guardian',
        targetEntity: 'users',
        targetId: boyUid,
        details: 'Uganda Child Safeguarding consent legally registered. Minor activated.'
      });
      this.saveState();
      this.notifyListeners();
    }
  }

  addConcernReport(report: Omit<ConcernReport, 'id' | 'createdAt' | 'updatedAt' | 'status'>): ConcernReport {
    const newReport: ConcernReport = {
      ...report,
      id: `rep_${Date.now()}`,
      status: 'new',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.concernReports.unshift(newReport);
    this.addAuditLog({
      action: 'SAFEGUARDING_CONCERN_FILED',
      performedBy: report.isAnonymous ? 'Anonymous' : (report.reporterName || 'Signed User'),
      performedByRole: 'confidential',
      targetEntity: 'concernReports',
      targetId: newReport.id,
      details: `Urgency: ${report.urgency}, Category: ${report.concernCategory}, District: ${report.district}`
    });
    this.saveState();
    this.notifyListeners();
    return newReport;
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
        details: `Status set to ${status}. Notes: ${triageNotes || 'None'}`
      });
      this.saveState();
      this.notifyListeners();
    }
  }

  addGoal(goal: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>) {
    const newGoal: Goal = {
      ...goal,
      id: `goal_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.goals.unshift(newGoal);
    this.saveState();
    this.notifyListeners();
    return newGoal;
  }

  updateGoalProgress(goalId: string, progress: number) {
    const g = this.goals.find((item) => item.id === goalId);
    if (g) {
      g.progress = Math.min(100, Math.max(0, progress));
      g.completed = g.progress === 100;
      g.updatedAt = new Date().toISOString();
      this.saveState();
      this.notifyListeners();
    }
  }

  addQuestion(q: Omit<Question, 'id' | 'createdAt' | 'isModerated'>) {
    const newQ: Question = {
      ...q,
      id: `q_${Date.now()}`,
      isModerated: true,
      createdAt: new Date().toISOString()
    };
    this.questions.unshift(newQ);
    this.saveState();
    this.notifyListeners();
    return newQ;
  }

  replyToQuestion(questionId: string, reply: string, mentorName: string) {
    const q = this.questions.find((item) => item.id === questionId);
    if (q) {
      q.mentorReply = reply;
      q.repliedByMentorName = mentorName;
      q.repliedAt = new Date().toISOString();
      this.saveState();
      this.notifyListeners();
    }
  }

  vetMentor(appId: string, approved: boolean) {
    const app = this.mentorApplications.find((a) => a.id === appId);
    if (app) {
      app.status = approved ? 'approved' : 'declined';
      const currentUser = this.getCurrentUser();
      this.addAuditLog({
        action: approved ? 'MENTOR_APPROVED' : 'MENTOR_DECLINED',
        performedBy: currentUser.fullName,
        performedByRole: currentUser.role,
        targetEntity: 'mentorApplications',
        targetId: appId,
        details: `Mentor application for ${app.fullName} was ${app.status}`
      });
      this.saveState();
      this.notifyListeners();
    }
  }

  addAuditLog(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>) {
    const newEntry: AuditLogEntry = {
      ...entry,
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString()
    };
    this.auditLogs.unshift(newEntry);
  }

  // Reactive subscription
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
