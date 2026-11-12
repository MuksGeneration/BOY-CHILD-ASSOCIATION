import { describe, it, expect } from 'vitest';
import {
  normaliseUgandanPhone,
  calculatePasswordStrength,
  passwordSchema,
  detectSafeguardingBreachInText,
  joinBoySchema,
  fullNameSchema
} from '../lib/validation/schemas';

describe('Ugandan Phone Normalisation & Validation', () => {
  it('accepts 077... MTN format and normalises to +25677...', () => {
    const res = normaliseUgandanPhone('0772123456');
    expect(res.valid).toBe(true);
    expect(res.e164).toBe('+256772123456');
    expect(res.operator).toBe('MTN');
  });

  it('accepts 70... Airtel format and normalises to +25670...', () => {
    const res = normaliseUgandanPhone('701987654');
    expect(res.valid).toBe(true);
    expect(res.e164).toBe('+256701987654');
    expect(res.operator).toBe('Airtel');
  });

  it('accepts numbers with spaces or dashes', () => {
    const res = normaliseUgandanPhone('+256 782-555-111');
    expect(res.valid).toBe(true);
    expect(res.e164).toBe('+256782555111');
    expect(res.operator).toBe('MTN');
  });

  it('accepts 0732320190 (community WhatsApp number) and normalises to +256732320190', () => {
    const res = normaliseUgandanPhone('0732320190');
    expect(res.valid).toBe(true);
    expect(res.e164).toBe('+256732320190');
  });

  it('rejects numbers that do not have 9 digits after 256', () => {
    const res = normaliseUgandanPhone('077212');
    expect(res.valid).toBe(false);
  });

  it('rejects numbers that do not start with 7', () => {
    const res = normaliseUgandanPhone('0312123456');
    expect(res.valid).toBe(false);
  });
});

describe('Password Complexity & Common Password Rejection', () => {
  it('rejects common passwords even if they meet length', () => {
    expect(passwordSchema.safeParse('password123').success).toBe(false);
    expect(passwordSchema.safeParse('1234567890').success).toBe(false);
    expect(passwordSchema.safeParse('kampala123').success).toBe(false);
  });

  it('rejects passwords under 10 chars', () => {
    expect(passwordSchema.safeParse('BoyUg24!').success).toBe(false);
  });

  it('accepts strong compliant passwords', () => {
    expect(passwordSchema.safeParse('EmpowerUganda#2026').success).toBe(true);
    const strength = calculatePasswordStrength('EmpowerUganda#2026');
    expect(strength.score).toBeGreaterThanOrEqual(3);
  });
});

describe('Full Name Validation', () => {
  it('accepts valid African names with spaces, apostrophes and hyphens', () => {
    expect(fullNameSchema.safeParse('Mukula David').success).toBe(true);
    expect(fullNameSchema.safeParse("Kato O'Connor").success).toBe(true);
    expect(fullNameSchema.safeParse('Jean-Paul Nsubuga').success).toBe(true);
  });

  it('rejects names with HTML tags or numbers', () => {
    expect(fullNameSchema.safeParse('David <script>alert(1)</script>').success).toBe(false);
    expect(fullNameSchema.safeParse('David123').success).toBe(false);
  });
});

describe('Age & Guardian Consent Rules (Age 17 vs 18)', () => {
  const baseValidData = {
    role: 'boy' as const,
    fullName: 'David Mukasa',
    dateOfBirth: '2009-04-12',
    district: 'Wakiso',
    town: 'Kira Town Council',
    interests: ['Mentorship', 'Robotics and Solar Skills'],
    guardianConsentGiven: false,
    honeypot: ''
  };

  it('FAILS for a 16-year-old if guardian fields are missing', () => {
    const result = joinBoySchema.safeParse({
      ...baseValidData,
      calculatedAge: 16
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path[0]);
      expect(paths).toContain('guardianName');
      expect(paths).toContain('guardianPhone');
      expect(paths).toContain('guardianConsentGiven');
    }
  });

  it('SUCCEEDS for a 16-year-old when valid guardian details and consent are provided', () => {
    const result = joinBoySchema.safeParse({
      ...baseValidData,
      calculatedAge: 16,
      guardianName: 'Grace Mukasa',
      guardianPhone: '0772334455',
      guardianConsentGiven: true
    });
    expect(result.success).toBe(true);
  });

  it('SUCCEEDS for an 18-year-old young man WITHOUT requiring guardian details', () => {
    const result = joinBoySchema.safeParse({
      ...baseValidData,
      calculatedAge: 18,
      dateOfBirth: '2008-01-01'
    });
    expect(result.success).toBe(true);
  });
});

describe('Safeguarding Text Breach Detection', () => {
  it('flags phone numbers embedded in messages to protect minors', () => {
    const res = detectSafeguardingBreachInText('Hey call me on 0782123456 after class');
    expect(res.hasBreach).toBe(true);
    expect(res.reasons.length).toBeGreaterThan(0);
  });

  it('flags social handles or invitations to Instagram or WhatsApp', () => {
    const res = detectSafeguardingBreachInText('Add me on WhatsApp or my IG @bca_youth');
    expect(res.hasBreach).toBe(true);
  });

  it('passes normal respectful mentorship questions', () => {
    const res = detectSafeguardingBreachInText(
      'How can I improve my grades in mathematics and stay motivated during exam preparation?'
    );
    expect(res.hasBreach).toBe(false);
  });
});
