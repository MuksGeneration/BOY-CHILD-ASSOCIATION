import { z } from 'zod';
import { UGANDA_DISTRICTS } from './ugandaDistricts';

/**
 * Common sanitization and validation helper:
 * Trims leading/trailing whitespace, collapses internal repeated whitespace.
 * Checks for HTML or script tags to reject potentially dangerous inputs.
 */
export function hasHtmlOrScriptTags(val: string): boolean {
  return /<[^>]*>|javascript:|on\w+=/i.test(val);
}

export function sanitizeString(val: unknown): string {
  if (typeof val !== 'string') return '';
  return val
    .replace(/\s+/g, ' ') // Collapse multiple spaces/newlines
    .trim();
}

/**
 * Common passwords blacklisted for security
 */
export const COMMON_PASSWORDS = new Set([
  'password', 'password123', '12345678', '123456789', '1234567890',
  'qwerty1234', 'admin12345', 'welcome123', 'iloveyou12', 'secret1234',
  'kampala123', 'uganda2024', 'uganda2025', 'uganda2026', 'letmein123'
]);

/**
 * Normalise and validate Ugandan phone numbers.
 * Accepted formats:
 * - 07XXXXXXXX (10 digits)
 * - 7XXXXXXXX (9 digits)
 * - +2567XXXXXXXX (13 characters)
 * - 2567XXXXXXXX (12 digits)
 * Normalises strictly to E.164 (+2567XXXXXXXX).
 */
export function normaliseUgandanPhone(phone: string): { valid: boolean; e164: string; operator: 'MTN' | 'Airtel' | 'Other' | null; error?: string } {
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  let standardDigits = '';

  if (cleaned.startsWith('+256')) {
    standardDigits = cleaned.slice(4);
  } else if (cleaned.startsWith('256')) {
    standardDigits = cleaned.slice(3);
  } else if (cleaned.startsWith('0')) {
    standardDigits = cleaned.slice(1);
  } else {
    standardDigits = cleaned;
  }

  // A valid Ugandan mobile number must now be exactly 9 digits starting with 7
  if (!/^7\d{8}$/.test(standardDigits)) {
    return {
      valid: false,
      e164: '',
      operator: null,
      error: 'Please enter a valid Ugandan phone number (e.g. 0772123456 or +256772123456).'
    };
  }

  const prefix = standardDigits.slice(0, 2);
  let operator: 'MTN' | 'Airtel' | 'Other' = 'Other';
  if (['77', '78', '76'].includes(prefix)) {
    operator = 'MTN';
  } else if (['70', '75', '74'].includes(prefix)) {
    operator = 'Airtel';
  }

  return {
    valid: true,
    e164: `+256${standardDigits}`,
    operator
  };
}

export const ugandanPhoneSchema = z
  .string()
  .transform((val) => sanitizeString(val))
  .refine((val) => {
    const res = normaliseUgandanPhone(val);
    return res.valid;
  }, {
    message: 'Must be a valid Ugandan mobile number starting with 07 or +2567 (9 digits after country code).'
  });

/**
 * Full name schema
 * 2-80 chars, letters, spaces, apostrophes and hyphens only (Unicode letters allowed)
 */
export const fullNameSchema = z
  .string()
  .refine((val) => !hasHtmlOrScriptTags(val), { message: 'Names cannot contain HTML or script tags.' })
  .transform((val) => sanitizeString(val))
  .refine((val) => val.length >= 2, { message: 'Full name must be at least 2 characters.' })
  .refine((val) => val.length <= 80, { message: 'Full name cannot exceed 80 characters.' })
  .refine((val) => /^[\p{L}\s'\-]+$/u.test(val), {
    message: 'Full name may only contain letters, spaces, hyphens, and apostrophes.'
  });

/**
 * Email schema: lowercase, valid format, max 254 chars
 */
export const emailSchema = z
  .string()
  .transform((val) => sanitizeString(val).toLowerCase())
  .refine((val) => val.length <= 254, { message: 'Email address cannot exceed 254 characters.' })
  .pipe(z.string().email({ message: 'Please enter a valid email address.' }));

export const optionalEmailSchema = z
  .string()
  .optional()
  .refine((val) => !val || (val.length <= 254 && z.string().email().safeParse(val).success), {
    message: 'Please enter a valid email address or leave blank.'
  });

/**
 * Password Strength Evaluator
 */
export function calculatePasswordStrength(password: string): {
  score: number; // 0 to 4
  label: 'Very Weak' | 'Weak' | 'Fair' | 'Strong' | 'Very Strong';
  feedback: string[];
} {
  const feedback: string[] = [];
  if (!password) {
    return { score: 0, label: 'Very Weak', feedback: ['Password is required.'] };
  }

  let score = 0;
  if (password.length >= 10) score += 1;
  else feedback.push('Must be at least 10 characters long.');

  if (/[A-Z]/.test(password)) score += 1;
  else feedback.push('Include at least one uppercase letter (A-Z).');

  if (/[a-z]/.test(password)) score += 1;
  else feedback.push('Include at least one lowercase letter (a-z).');

  if (/[0-9]/.test(password)) score += 1;
  else feedback.push('Include at least one number (0-9).');

  if (/[^A-Za-z0-9]/.test(password) && password.length >= 12) {
    score = Math.min(4, score + 1);
  }

  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    score = 1;
    feedback.push('This password is too easily guessed. Choose a more unique phrase.');
  }

  const labels: ('Very Weak' | 'Weak' | 'Fair' | 'Strong' | 'Very Strong')[] = [
    'Very Weak',
    'Weak',
    'Fair',
    'Strong',
    'Very Strong'
  ];

  return {
    score: Math.min(4, Math.max(0, score)),
    label: labels[Math.min(4, score)],
    feedback
  };
}

/**
 * Strict Password schema
 */
export const passwordSchema = z
  .string()
  .min(10, { message: 'Password must be at least 10 characters.' })
  .max(128, { message: 'Password cannot exceed 128 characters.' })
  .refine((val) => /[A-Z]/.test(val), { message: 'Password must contain at least one uppercase letter.' })
  .refine((val) => /[a-z]/.test(val), { message: 'Password must contain at least one lowercase letter.' })
  .refine((val) => /[0-9]/.test(val), { message: 'Password must contain at least one digit.' })
  .refine((val) => !COMMON_PASSWORDS.has(val.toLowerCase()), {
    message: 'This password is too common or easily guessed. Please choose a safer password.'
  });

/**
 * Town or district schema
 */
export const districtSchema = z
  .string()
  .transform((val) => sanitizeString(val))
  .refine((val) => val.length >= 2, { message: 'District or town is required (min 2 characters).' })
  .refine((val) => val.length <= 60, { message: 'District or town cannot exceed 60 characters.' });

/**
 * Free text message schema
 */
export const freeTextMessageSchema = (min = 10, max = 1000) =>
  z
    .string()
    .refine((val) => !hasHtmlOrScriptTags(val), { message: 'Message cannot contain HTML or script tags.' })
    .transform((val) => sanitizeString(val))
    .refine((val) => val.length >= min, { message: `Message must be at least ${min} characters.` })
    .refine((val) => val.length <= max, { message: `Message cannot exceed ${max} characters.` });

/**
 * SAFEGUARDING SCANNER:
 * Detects private contact details (phone numbers, email addresses, social handles)
 * in messages written to or from minors to safeguard against off-platform grooming.
 */
export function detectSafeguardingBreachInText(content: string): {
  hasBreach: boolean;
  reasons: string[];
} {
  const reasons: string[] = [];

  // Phone number detector (e.g. 07XX..., +256..., digit strings >= 8 digits)
  const phoneRegex = /(\+?256|0)?\s?7\d{2}[\s\-]?\d{3}[\s\-]?\d{3}|\b\d{9,12}\b/;
  if (phoneRegex.test(content)) {
    reasons.push('Sharing personal phone numbers is prohibited in youth messages for your safety.');
  }

  // Email detector
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  if (emailRegex.test(content)) {
    reasons.push('Sharing personal email addresses is blocked by our child safeguarding policy.');
  }

  // Social handles detector (@username, whatsapp, snapchat, tiktok, instagram, telegram)
  const socialKeywords = /(whatsapp|whats\s?app|telegram|t\.me|instagram|insta|snapchat|snap|tiktok|dm\s+me\s+at)\b/i;
  const handleRegex = /@[a-zA-Z0-9_]{3,25}/;
  if (socialKeywords.test(content) || handleRegex.test(content)) {
    reasons.push('Directing members to private external social media is strictly blocked.');
  }

  return {
    hasBreach: reasons.length > 0,
    reasons
  };
}

/**
 * Join as Boy / Young Man Schema
 * If age < 18, guardianName, guardianPhone, and guardianConsentGiven are mandatory!
 */
export const joinBoySchema = z
  .object({
    role: z.literal('boy'),
    fullName: fullNameSchema,
    dateOfBirth: z.string().min(1, { message: 'Date of birth is required.' }),
    calculatedAge: z.number().int().min(5, { message: 'Members must be at least 5 years old.' }).max(35, { message: 'Young men programs are for ages 5 to 35.' }),
    district: districtSchema,
    town: z.string().transform((v) => sanitizeString(v)).refine((v) => v.length >= 2, { message: 'Town or village is required.' }),
    schoolOrOccupation: z.string().transform((v) => sanitizeString(v)).optional(),
    interests: z.array(z.string()).min(1, { message: 'Select at least one area of interest.' }),
    guardianName: z.string().optional(),
    guardianPhone: z.string().optional(),
    guardianEmail: z.string().optional(),
    guardianConsentGiven: z.boolean(),
    honeypot: z.string().max(0, { message: 'Bot detected.' }).optional()
  })
  .superRefine((data, ctx) => {
    // Under 18 guardian verification rule
    if (data.calculatedAge < 18) {
      const sanitizedGName = sanitizeString(data.guardianName || '');
      if (sanitizedGName.length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['guardianName'],
          message: 'Parent or Guardian full name is required for members under 18.'
        });
      }

      const gPhone = data.guardianPhone ? normaliseUgandanPhone(data.guardianPhone) : { valid: false };
      if (!gPhone.valid) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['guardianPhone'],
          message: 'Valid Ugandan phone number for Parent/Guardian is required (e.g. 0772123456).'
        });
      }

      if (data.guardianEmail && data.guardianEmail.trim() !== '') {
        const emailParsed = emailSchema.safeParse(data.guardianEmail);
        if (!emailParsed.success) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['guardianEmail'],
            message: 'Guardian email format is invalid.'
          });
        }
      }

      if (!data.guardianConsentGiven) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['guardianConsentGiven'],
          message: 'You must confirm that your parent or legal guardian has been informed and given consent.'
        });
      }
    }
  });

export type JoinBoyInput = z.infer<typeof joinBoySchema>;

/**
 * Join as Parent or Guardian Schema
 */
export const joinGuardianSchema = z.object({
  role: z.literal('guardian'),
  fullName: fullNameSchema,
  phone: ugandanPhoneSchema,
  email: optionalEmailSchema,
  district: districtSchema,
  numberOfBoys: z.number().int().min(1, { message: 'Please specify how many boys you are registering (at least 1).' }).max(12),
  relationship: z.enum(['father', 'mother', 'legal_guardian', 'elder_sibling', 'extended_family', 'other']),
  safeguardingAgreed: z.boolean().refine((v) => v === true, {
    message: 'You must accept the safeguarding and privacy agreement.'
  }),
  honeypot: z.string().max(0, { message: 'Bot detected.' }).optional()
});

export type JoinGuardianInput = z.infer<typeof joinGuardianSchema>;

/**
 * Join as Mentor Schema
 */
export const joinMentorSchema = z.object({
  role: z.literal('mentor'),
  fullName: fullNameSchema,
  phone: ugandanPhoneSchema,
  email: emailSchema,
  district: districtSchema,
  occupation: z.string().min(2, { message: 'Occupation/profession is required.' }),
  motivation: z
    .string()
    .transform((v) => sanitizeString(v))
    .refine((v) => v.length >= 50, { message: 'Please provide at least 50 characters describing your motivation.' })
    .refine((v) => v.length <= 800, { message: 'Motivation cannot exceed 800 characters.' }),
  availability: z.enum(['weekends', 'weekday_evenings', 'flexible', 'biweekly']),
  referee1Name: fullNameSchema,
  referee1Phone: ugandanPhoneSchema,
  referee2Name: fullNameSchema,
  referee2Phone: ugandanPhoneSchema,
  safeguardingAgreed: z.boolean().refine((v) => v === true, {
    message: 'You must read and strictly adhere to the Child Safeguarding Policy.'
  }),
  hasCleanRecordConfirmed: z.boolean().refine((v) => v === true, {
    message: 'You must confirm clean background clearance for working with children.'
  }),
  honeypot: z.string().max(0, { message: 'Bot detected.' }).optional()
});

export type JoinMentorInput = z.infer<typeof joinMentorSchema>;

/**
 * Join as Partner Schema
 */
export const joinPartnerSchema = z.object({
  role: z.literal('partner'),
  orgName: z.string().min(3, { message: 'Organisation name is required.' }),
  contactPerson: fullNameSchema,
  phone: ugandanPhoneSchema,
  email: emailSchema,
  orgType: z.enum(['school', 'church', 'business', 'ngo', 'community_cbo']),
  district: districtSchema,
  collaborationProposal: freeTextMessageSchema(30, 1000),
  safeguardingAgreed: z.boolean().refine((v) => v === true, {
    message: 'Partner organisations must commit to safeguarding principles.'
  }),
  honeypot: z.string().max(0, { message: 'Bot detected.' }).optional()
});

export type JoinPartnerInput = z.infer<typeof joinPartnerSchema>;

/**
 * Concern Report Schema (Safeguarding)
 * Can be anonymous or signed
 */
export const concernReportSchema = z
  .object({
    isAnonymous: z.boolean(),
    reporterName: z.string().optional(),
    reporterContact: z.string().optional(),
    boyName: z.string().optional(),
    district: districtSchema,
    concernCategory: z.enum([
      'emotional_distress',
      'physical_harm',
      'neglect',
      'bullying_or_violence',
      'exploitation_or_labour',
      'mental_health',
      'substance_abuse',
      'other'
    ]),
    urgency: z.enum(['low', 'medium', 'high', 'immediate']),
    details: freeTextMessageSchema(10, 2000),
    consentToInvestigation: z.boolean().refine((v) => v === true, {
      message: 'Consent to triage is required to submit a report.'
    })
  })
  .superRefine((data, ctx) => {
    if (!data.isAnonymous) {
      if (!data.reporterName || sanitizeString(data.reporterName).length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['reporterName'],
          message: 'Please provide your name or toggle "Submit Anonymously".'
        });
      }
      if (!data.reporterContact || sanitizeString(data.reporterContact).length < 5) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['reporterContact'],
          message: 'Please provide contact information (phone/email) so our safeguarding lead can follow up, or submit anonymously.'
        });
      }
    }
  });

export type ConcernReportInput = z.infer<typeof concernReportSchema>;

/**
 * Ask a Mentor Schema (hub question)
 */
export const askMentorSchema = z.object({
  circleId: z.string().min(1, { message: 'Please select a circle.' }),
  category: z.enum(['academic', 'life_skills', 'mental_wellbeing', 'career', 'relationships', 'spiritual']),
  question: freeTextMessageSchema(10, 1000),
  isAnonymous: z.boolean().default(false)
});

export type AskMentorInput = z.infer<typeof askMentorSchema>;

/**
 * Auth Sign In Schema
 */
export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, { message: 'Password is required.' })
});

export type SignInInput = z.infer<typeof signInSchema>;

/**
 * Auth Sign Up Schema
 */
export const signUpSchema = z
  .object({
    fullName: fullNameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    agreeToTerms: z.boolean().refine((v) => v === true, {
      message: 'You must agree to the Terms of Service & Privacy Policy.'
    })
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match.'
  });

export type SignUpInput = z.infer<typeof signUpSchema>;

/**
 * Password Reset Schema
 */
export const passwordResetSchema = z.object({
  email: emailSchema
});

export type PasswordResetInput = z.infer<typeof passwordResetSchema>;

/**
 * Guardian Link Request & Verification Schemas
 */
export const requestGuardianLinkSchema = z.object({
  boyIdentifier: z
    .string()
    .refine((val) => !hasHtmlOrScriptTags(val), { message: 'Invalid characters detected.' })
    .transform((val) => sanitizeString(val))
    .refine((val) => val.length >= 3, { message: 'Enter the child email or member ID.' }),
  relationship: z.enum(['father', 'mother', 'legal_guardian', 'elder_sibling', 'extended_family', 'other']),
  verificationMethod: z.enum(['child_code_confirmation', 'coordinator_id_check', 'guardian_sms_otp', 'school_patron_attestation']),
  authorityEvidence: freeTextMessageSchema(4, 240)
});

export const verifyGuardianLinkSchema = z.object({
  linkId: z.string().min(1),
  verificationCode: z
    .string()
    .transform((v) => sanitizeString(v))
    .refine((v) => /^BCA-\d{6}$/.test(v), { message: 'Enter valid 6-digit code in format BCA-XXXXXX.' })
});

export const submitGuardianConsentSchema = z.object({
  boyId: z.string().min(1),
  verificationMethod: z.enum(['child_code_confirmation', 'coordinator_id_check', 'guardian_sms_otp', 'school_patron_attestation']),
  authorityEvidence: freeTextMessageSchema(5, 240),
  authorityConfirmed: z.boolean().refine((v) => v === true, {
    message: 'You must attest parental or legal guardian authority under Uganda Children Act (Cap 59).'
  })
});

export const withdrawConsentSchema = z.object({
  boyId: z.string().min(1),
  reason: freeTextMessageSchema(5, 400)
});

/**
 * Attendance Recording Schema
 */
export const recordAttendanceSchema = z.object({
  sessionId: z.string().min(1),
  circleId: z.string().min(1),
  memberId: z.string().min(1),
  memberName: fullNameSchema,
  status: z.enum(['present', 'absent', 'excused']),
  date: z.string().min(4)
});

/**
 * Event Registration Schema
 */
export const eventRegistrationSchema = z.object({
  eventId: z.string().min(1),
  attendeeName: fullNameSchema,
  attendeeEmail: optionalEmailSchema,
  district: districtSchema
});

/**
 * Newsletter Subscription Schema (Explicit Uganda DPPA 2019 Consent)
 */
export const newsletterSchema = z.object({
  email: emailSchema,
  district: districtSchema.optional(),
  consentGiven: z.boolean().refine((v) => v === true, {
    message: 'You must explicitly consent to receive updates from Boy Child Association Uganda.'
  })
});

export type NewsletterInput = z.infer<typeof newsletterSchema>;

/**
 * Contact Message Schema
 */
export const contactMessageSchema = z.object({
  fullName: fullNameSchema,
  email: emailSchema,
  phone: ugandanPhoneSchema,
  subject: freeTextMessageSchema(4, 120),
  message: freeTextMessageSchema(15, 1200)
});

export type ContactMessageInput = z.infer<typeof contactMessageSchema>;

/**
 * DPPA Data Protection Request Schema
 */
export const dppaRequestSchema = z.object({
  type: z.enum(['export', 'correction', 'deletion']),
  reason: freeTextMessageSchema(5, 300)
});

/**
 * Safeguarding Case Triage & Follow-Up Schemas
 */
export const safeguardingTriageSchema = z.object({
  status: z.enum(['new', 'unassigned', 'under_review', 'follow_up', 'escalated', 'resolved']),
  triageNotes: freeTextMessageSchema(5, 2000),
  assignedLeadName: z.string().transform((v) => sanitizeString(v)).optional(),
  escalationChannel: z
    .enum(['Sauti 116', 'Uganda Police CFPU (0800 199 699)', 'District Probation Officer'])
    .optional(),
  escalationRef: z.string().transform((v) => sanitizeString(v)).optional()
});

export const safeguardingFollowUpSchema = z.object({
  caseId: z.string().min(1),
  actionTaken: freeTextMessageSchema(8, 800),
  outcome: freeTextMessageSchema(4, 500),
  nextReviewDate: z.string().optional()
});

/**
 * CMS Content Validation Schema
 */
export const cmsProgrammeSchema = z.object({
  title: freeTextMessageSchema(4, 120),
  category: z.enum(['Mentorship', 'Wellbeing', 'Skills', 'Clubs', 'Families']),
  ageRange: freeTextMessageSchema(3, 40),
  shortDescription: freeTextMessageSchema(10, 300),
  status: z.enum(['draft', 'published', 'archived'])
});

export const cmsAnnouncementSchema = z.object({
  title: freeTextMessageSchema(4, 140),
  summary: freeTextMessageSchema(10, 600),
  type: z.enum(['news', 'story', 'announcement']),
  district: districtSchema,
  status: z.enum(['draft', 'published', 'archived'])
});

export const mentorProgressReportSchema = z.object({
  circleId: z.string().min(1, { message: 'Please select an assigned mentorship circle.' }),
  reportingPeriod: freeTextMessageSchema(3, 60),
  attendanceSummary: freeTextMessageSchema(8, 500),
  keyMilestones: freeTextMessageSchema(10, 1000),
  safeguardingObservations: freeTextMessageSchema(5, 800),
  supportNeeded: z.string().transform((v) => sanitizeString(v)).optional()
});

export type MentorProgressReportInput = z.infer<typeof mentorProgressReportSchema>;

/**
 * Firebase Storage upload guards matching storage.rules
 */
export const ALLOWED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const ALLOWED_DOCUMENT_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'] as const;
export const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;

export function validateImageFile(file: { type: string; size: number; name?: string }): { valid: boolean; error?: string } {
  if (!(ALLOWED_IMAGE_MIME_TYPES as readonly string[]).includes(file.type)) {
    return { valid: false, error: 'Profile photo must be a JPEG, PNG, or WebP image.' };
  }
  if (file.size <= 0 || file.size > MAX_AVATAR_BYTES) {
    return { valid: false, error: 'Profile photo must be 5 MB or smaller.' };
  }
  return { valid: true };
}

export function validateDocumentFile(file: { type: string; size: number; name?: string }): { valid: boolean; error?: string } {
  if (!(ALLOWED_DOCUMENT_MIME_TYPES as readonly string[]).includes(file.type)) {
    return { valid: false, error: 'Document must be a PDF, JPEG, PNG, or WebP file.' };
  }
  if (file.size <= 0 || file.size > MAX_DOCUMENT_BYTES) {
    return { valid: false, error: 'Document must be 10 MB or smaller.' };
  }
  return { valid: true };
}

/**
 * LMS Media Validation (separate from 5 MB avatar limit — supports Video, Audio, Slides, Docs, Captions)
 */
export const LMS_MEDIA_LIMITS_BYTES = {
  video: 500 * 1024 * 1024, // 500 MB resumable video upload
  low_bandwidth_video: 120 * 1024 * 1024, // 120 MB compressed video
  audio: 80 * 1024 * 1024, // 80 MB
  presentation: 50 * 1024 * 1024, // 50 MB PPT/PPTX
  pdf: 40 * 1024 * 1024, // 40 MB PDF
  document: 30 * 1024 * 1024, // 30 MB DOC/DOCX
  image: 10 * 1024 * 1024, // 10 MB thumbnail/diagram
  captions: 2 * 1024 * 1024, // 2 MB VTT/TXT
} as const;

export const ALLOWED_LMS_MIME_MAP: Record<string, keyof typeof LMS_MEDIA_LIMITS_BYTES> = {
  'video/mp4': 'video',
  'video/webm': 'video',
  'audio/mpeg': 'audio',
  'audio/mp3': 'audio',
  'audio/wav': 'audio',
  'audio/ogg': 'audio',
  'audio/aac': 'audio',
  'audio/mp4': 'audio',
  'audio/webm': 'audio',
  'application/pdf': 'pdf',
  'application/vnd.ms-powerpoint': 'presentation',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'presentation',
  'application/msword': 'document',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'document',
  'image/jpeg': 'image',
  'image/png': 'image',
  'image/webp': 'image',
  'text/vtt': 'captions',
  'text/plain': 'captions',
};

export function validateLmsMediaFile(
  file: { type: string; size: number; name?: string },
  preferredKind?: keyof typeof LMS_MEDIA_LIMITS_BYTES
): { valid: boolean; detectedKind?: keyof typeof LMS_MEDIA_LIMITS_BYTES; error?: string } {
  const mime = file.type || '';
  const detected = ALLOWED_LMS_MIME_MAP[mime];
  const ext = (file.name || '').split('.').pop()?.toLowerCase();

  let resolvedKind = detected;
  if (!resolvedKind && ext === 'vtt') resolvedKind = 'captions';
  if (!resolvedKind && (ext === 'ppt' || ext === 'pptx')) resolvedKind = 'presentation';
  if (!resolvedKind && (ext === 'doc' || ext === 'docx')) resolvedKind = 'document';

  if (!resolvedKind) {
    return {
      valid: false,
      error: 'Unsupported format. Allowed: MP4, WebM, PDF, PPT/PPTX, DOC/DOCX, MP3/WAV/OGG/AAC, JPG/PNG/WebP, or WebVTT captions.',
    };
  }

  const limitKey = preferredKind === 'low_bandwidth_video' && resolvedKind === 'video' ? 'low_bandwidth_video' : resolvedKind;
  const maxBytes = LMS_MEDIA_LIMITS_BYTES[limitKey];
  if (file.size <= 0 || file.size > maxBytes) {
    return {
      valid: false,
      error: `File exceeds the ${Math.round(maxBytes / (1024 * 1024))} MB limit for ${limitKey.replace('_', ' ')} files.`,
    };
  }

  return { valid: true, detectedKind: limitKey };
}

export const lmsCourseSchema = z.object({
  title: freeTextMessageSchema(5, 140),
  description: freeTextMessageSchema(20, 2500),
  category: z.string().transform(sanitizeString).refine((v) => v.length >= 2 && v.length <= 60, {
    message: 'Select a valid course category.',
  }),
  targetAudience: freeTextMessageSchema(5, 200),
  ageEligibility: z.enum(['all_5_35', 'children_5_17', 'young_adults_18_35', 'adults_18_plus']),
  level: z.enum(['beginner', 'intermediate', 'advanced']),
  durationHours: z.number().min(0.5).max(500),
  learningFormat: z.enum(['self_paced', 'instructor_led', 'blended']),
  startDate: z.string().min(4),
  endDate: z.string().min(4),
  enrolmentCapacity: z.number().int().min(1).max(2000),
  learningObjectives: z.array(z.string().min(3).max(200)).min(1, { message: 'Add at least one learning objective.' }),
});

export const lmsModuleSchema = z.object({
  courseId: z.string().min(1),
  title: freeTextMessageSchema(3, 120),
  description: freeTextMessageSchema(5, 600),
  orderIndex: z.number().int().min(1).max(200),
});

export const lmsLessonSchema = z.object({
  courseId: z.string().min(1),
  moduleId: z.string().min(1),
  title: freeTextMessageSchema(3, 140),
  lessonType: z.enum(['video', 'pdf', 'presentation', 'audio', 'text', 'practical_demo', 'external_resource', 'study_notes']),
  durationMinutes: z.number().int().min(1).max(360),
  isRequired: z.boolean(),
  textContent: z.string().max(12000).optional(),
  transcript: z.string().max(15000).optional(),
});

export const lmsZoomSessionSchema = z.object({
  courseId: z.string().min(1, { message: 'Course selection is required.' }),
  moduleId: z.string().optional(),
  title: freeTextMessageSchema(4, 140),
  description: freeTextMessageSchema(8, 800),
  scheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Use YYYY-MM-DD date format.' }),
  startTimeKampala: z.string().regex(/^\d{2}:\d{2}$/, { message: 'Use HH:mm time in Africa/Kampala.' }),
  durationMinutes: z.number().int().min(15).max(300),
  capacity: z.number().int().min(2).max(500).optional(),
  isRecurring: z.boolean().default(false),
});

export const lmsAssessmentSchema = z.object({
  courseId: z.string().min(1),
  title: freeTextMessageSchema(4, 140),
  assessmentType: z.enum(['pre_course', 'post_course', 'quiz', 'written_assignment', 'file_assignment']),
  instructions: freeTextMessageSchema(8, 1200),
  passMarkPercent: z.number().int().min(10).max(100),
  maxAttempts: z.number().int().min(1).max(20),
});

export const lmsQuestionSchema = z.object({
  assessmentId: z.string().min(1),
  courseId: z.string().min(1),
  questionType: z.enum(['mcq', 'true_false', 'short_answer', 'written']),
  prompt: freeTextMessageSchema(5, 600),
  points: z.number().int().min(1).max(100),
});



