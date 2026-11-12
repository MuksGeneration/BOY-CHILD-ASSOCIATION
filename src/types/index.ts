export type UserRole = 'boy' | 'guardian' | 'mentor' | 'partner' | 'coordinator' | 'admin';

export type UserStatus = 'active' | 'pending_guardian_consent' | 'pending_vetting' | 'suspended';

export interface AppUser {
  uid: string;
  email: string;
  fullName: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  district?: string;
  town?: string;
  calculatedAge?: number;
  guardianId?: string;
  guardianName?: string;
  guardianPhone?: string;
  circleId?: string;
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
}

export interface Circle {
  id: string;
  name: string;
  district: string;
  locationName: string;
  meetingTime: string;
  leadMentorName: string;
  leadMentorId: string;
  maxMembers: number;
  activeMembersCount: number;
  safeguardingLeadName: string;
  focusArea: string;
  status: 'active' | 'forming' | 'full';
}

export interface CircleSession {
  id: string;
  circleId: string;
  title: string;
  theme: string;
  scheduledAt: string;
  location: string;
  mentorName: string;
  notes?: string;
  completed: boolean;
}

export interface Goal {
  id: string;
  userId: string;
  title: string;
  category: 'Education' | 'Life Skills' | 'Emotional Wellbeing' | 'Career & Craft' | 'Community Service';
  progress: number; // 0 to 100
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

export interface MentorApplication {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  district: string;
  occupation: string;
  motivation: string;
  availability: string;
  referee1: { name: string; phone: string; status: 'pending' | 'verified' };
  referee2: { name: string; phone: string; status: 'pending' | 'verified' };
  dbsSafeguardingCheck: 'pending' | 'cleared' | 'flagged';
  status: 'pending_vetting' | 'approved' | 'declined';
  vettedBy?: string;
  createdAt: string;
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
