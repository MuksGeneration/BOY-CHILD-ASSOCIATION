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
