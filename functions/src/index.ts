import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { onCall, onRequest, HttpsError, CallableRequest } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { createHmac, timingSafeEqual } from 'crypto';
import { z } from 'zod';

initializeApp();

const DATABASE_ID = 'ai-studio-boychildassociat-e2cf5f8e-ec8b-4c04-89e0-7eec41b5c3d0';
const db = getFirestore(DATABASE_ID);
const adminAuth = getAuth();

const ZOOM_ACCOUNT_ID = defineSecret('ZOOM_ACCOUNT_ID');
const ZOOM_CLIENT_ID = defineSecret('ZOOM_CLIENT_ID');
const ZOOM_CLIENT_SECRET = defineSecret('ZOOM_CLIENT_SECRET');
const ZOOM_WEBHOOK_SECRET_TOKEN = defineSecret('ZOOM_WEBHOOK_SECRET_TOKEN');

type UserRole =
  | 'boy'
  | 'guardian'
  | 'mentor'
  | 'partner'
  | 'coordinator'
  | 'instructor'
  | 'learning_manager'
  | 'admin';

const sanitize = (val: string) => val.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

const ugandaPhoneSchema = z.string().transform(sanitize).refine((v) => {
  const cleaned = v.replace(/[\s\-\(\)]/g, '');
  const digits = cleaned.startsWith('+256')
    ? cleaned.slice(4)
    : cleaned.startsWith('256')
    ? cleaned.slice(3)
    : cleaned.startsWith('0')
    ? cleaned.slice(1)
    : cleaned;
  return /^7\d{8}$/.test(digits);
}, 'Invalid Ugandan phone number');

function normalizePhone(v: string): string {
  const cleaned = sanitize(v).replace(/[\s\-\(\)]/g, '');
  const digits = cleaned.startsWith('+256')
    ? cleaned.slice(4)
    : cleaned.startsWith('256')
    ? cleaned.slice(3)
    : cleaned.startsWith('0')
    ? cleaned.slice(1)
    : cleaned;
  return `+256${digits}`;
}

async function getCallerContext(request: CallableRequest) {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Authentication is required.');
  }
  const uid = request.auth.uid;
  const userSnap = await db.collection('users').doc(uid).get();
  const userData = userSnap.data() || {};
  const tokenRole = (request.auth.token.role as UserRole | undefined) || (userData.role as UserRole | undefined) || 'boy';
  const status = (userData.status as string | undefined) || 'active';

  if (request.auth.token.suspended === true || status === 'suspended') {
    throw new HttpsError('permission-denied', 'Account is suspended.');
  }

  return {
    uid,
    role: tokenRole,
    fullName: (userData.fullName as string) || request.auth.token.name || 'BCA User',
    safeguardingCleared:
      tokenRole === 'admin' || Boolean(request.auth.token.safeguardingCleared || userData.safeguardingCleared),
    instructorAuthorized:
      tokenRole === 'instructor' ||
      tokenRole === 'learning_manager' ||
      tokenRole === 'admin' ||
      Boolean(request.auth.token.instructorAuthorized || userData.instructorAuthorized),
    assignedCaseIds: Array.isArray(userData.assignedCaseIds) ? (userData.assignedCaseIds as string[]) : [],
  };
}

function generateMembershipNumber(uid: string): { membershipNumber: string; qrToken: string } {
  const suffix = uid.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(-4).padStart(4, '0');
  const rand = Math.floor(100 + Math.random() * 900);
  const membershipNumber = `BCA-UG-${new Date().getFullYear()}-${suffix}${rand}`.slice(0, 18);
  const qrToken = `QR-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
  return { membershipNumber, qrToken };
}

function assertRole(role: UserRole, allowed: UserRole[]) {
  if (!allowed.includes(role)) {
    throw new HttpsError('permission-denied', `Role ${role} is not authorized for this action.`);
  }
}

async function writeAuditLog(params: {
  action: string;
  performedBy: string;
  performedByRole: string;
  targetEntity: string;
  targetId: string;
  details: string;
}) {
  await db.collection('auditLogs').add({
    ...params,
    timestamp: FieldValue.serverTimestamp(),
  });
}

async function checkRateLimit(bucketKey: string, limit: number, windowSeconds: number) {
  const ref = db.collection('systemSettings').doc(`ratelimit_${bucketKey}`);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const now = Date.now();
    const data = snap.data();
    if (!data || now - (data.windowStartMs || 0) > windowSeconds * 1000) {
      tx.set(ref, {
        key: bucketKey,
        status: 'archived',
        payload: {},
        count: 1,
        windowStartMs: now,
        updatedAt: FieldValue.serverTimestamp(),
      });
      return;
    }
    if ((data.count || 0) >= limit) {
      throw new HttpsError('resource-exhausted', 'Rate limit exceeded. Please wait before retrying.');
    }
    tx.update(ref, {
      count: FieldValue.increment(1),
      updatedAt: FieldValue.serverTimestamp(),
    });
  });
}

// 1. submitMembershipApplication
export const submitMembershipApplication = onCall(async (request) => {
  const schema = z.object({
    fullName: z.string().min(2).max(80).transform(sanitize),
    dateOfBirth: z.string().min(4),
    calculatedAge: z.number().int().min(5).max(35),
    district: z.string().min(2).max(60).transform(sanitize),
    town: z.string().min(2).max(80).transform(sanitize),
    schoolOrOccupation: z.string().max(120).optional().transform((v) => (v ? sanitize(v) : '')),
    interests: z.array(z.string().max(60)).min(1).max(10),
    guardianName: z.string().max(80).optional(),
    guardianPhone: z.string().optional(),
  });
  const parsed = schema.safeParse(request.data);
  if (!parsed.success) {
    throw new HttpsError('invalid-argument', parsed.error.issues[0]?.message || 'Invalid membership application.');
  }
  const d = parsed.data;
  const ageCategory = d.calculatedAge < 18 ? 'child_5_17' : 'young_adult_18_35';
  if (ageCategory === 'child_5_17' && (!d.guardianName || !d.guardianPhone || !ugandaPhoneSchema.safeParse(d.guardianPhone).success)) {
    throw new HttpsError('failed-precondition', 'Verified guardian details are mandatory for applicants under 18.');
  }

  const applicantUid = request.auth?.uid || `anon_${Date.now()}`;
  const docRef = await db.collection('membershipApplications').add({
    applicantUid,
    fullName: d.fullName,
    dateOfBirth: d.dateOfBirth,
    calculatedAge: d.calculatedAge,
    ageCategory,
    district: d.district,
    town: d.town,
    schoolOrOccupation: d.schoolOrOccupation || '',
    interests: d.interests,
    guardianName: d.guardianName ? sanitize(d.guardianName) : null,
    guardianPhone: d.guardianPhone ? normalizePhone(d.guardianPhone) : null,
    status: 'pending',
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    createdBy: applicantUid,
  });

  await writeAuditLog({
    action: 'MEMBERSHIP_APPLICATION_SUBMITTED',
    performedBy: d.fullName,
    performedByRole: request.auth ? 'applicant' : 'public',
    targetEntity: 'membershipApplications',
    targetId: docRef.id,
    details: `Submitted ${ageCategory} application in ${d.district}`,
  });

  return { applicationId: docRef.id, ageCategory, status: 'pending' };
});

// 2. approveMembershipApplication
export const approveMembershipApplication = onCall(async (request) => {
  const caller = await getCallerContext(request);
  assertRole(caller.role, ['coordinator', 'admin']);
  const schema = z.object({
    applicationId: z.string().min(1),
    decision: z.enum(['approved', 'rejected']),
    notes: z.string().max(500).optional(),
  });
  const parsed = schema.safeParse(request.data);
  if (!parsed.success) throw new HttpsError('invalid-argument', 'Invalid parameters.');
  const { applicationId, decision, notes } = parsed.data;

  const appRef = db.collection('membershipApplications').doc(applicationId);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(appRef);
    if (!snap.exists) throw new HttpsError('not-found', 'Application not found.');
    const appData = snap.data()!;
    tx.update(appRef, {
      status: decision,
      reviewedBy: caller.uid,
      reviewNotes: notes ? sanitize(notes) : '',
      updatedAt: FieldValue.serverTimestamp(),
    });
    if (decision === 'approved' && appData.applicantUid && !String(appData.applicantUid).startsWith('anon_')) {
      const nextStatus = appData.ageCategory === 'child_5_17' ? 'pending_guardian_consent' : 'active';
      const userUpdate: Record<string, unknown> = {
        status: nextStatus,
        ageCategory: appData.ageCategory,
        updatedAt: FieldValue.serverTimestamp(),
      };
      if (nextStatus === 'active') {
        const { membershipNumber, qrToken } = generateMembershipNumber(String(appData.applicantUid));
        userUpdate.membershipNumber = membershipNumber;
        userUpdate.membershipIssuedAt = new Date().toISOString();
        userUpdate.membershipQrToken = qrToken;
        tx.set(db.collection('membershipVerifications').doc(membershipNumber), {
          membershipNumber,
          uid: appData.applicantUid,
          status: 'active',
          ageCategory: appData.ageCategory,
          district: appData.district || 'Kampala',
          issuedAt: userUpdate.membershipIssuedAt,
          qrToken,
          isMinor: false,
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
      tx.set(db.collection('users').doc(appData.applicantUid), userUpdate, { merge: true });
    }
  });

  await writeAuditLog({
    action: `MEMBERSHIP_APPLICATION_${decision.toUpperCase()}`,
    performedBy: caller.fullName,
    performedByRole: caller.role,
    targetEntity: 'membershipApplications',
    targetId: applicationId,
    details: `Membership application ${decision}. ${notes ? sanitize(notes) : ''}`,
  });

  return { ok: true, applicationId, decision };
});

// 3. requestGuardianLink
export const requestGuardianLink = onCall(async (request) => {
  const caller = await getCallerContext(request);
  assertRole(caller.role, ['guardian', 'coordinator', 'admin']);
  const schema = z.object({
    boyEmailOrUid: z.string().min(3).max(254).transform(sanitize),
    relationship: z.enum(['father', 'mother', 'legal_guardian', 'elder_sibling', 'extended_family', 'other']),
    verificationMethod: z
      .enum(['child_code_confirmation', 'coordinator_id_check', 'guardian_sms_otp', 'school_patron_attestation'])
      .default('child_code_confirmation'),
    authorityEvidence: z.string().min(4).max(240).transform(sanitize).default('Guardian portal code challenge'),
  });
  const parsed = schema.safeParse(request.data);
  if (!parsed.success) throw new HttpsError('invalid-argument', 'Valid boy UID or email, relationship, and verification method are required.');

  const boyQuery = parsed.data.boyEmailOrUid.includes('@')
    ? await db.collection('users').where('email', '==', parsed.data.boyEmailOrUid.toLowerCase()).limit(1).get()
    : await db.collection('users').where('uid', '==', parsed.data.boyEmailOrUid).limit(1).get();

  if (boyQuery.empty) {
    throw new HttpsError('not-found', 'No member record found matching that identifier.');
  }
  const boyDoc = boyQuery.docs[0].data();
  const verificationCode = `BCA-${Math.floor(100000 + Math.random() * 900000)}`;
  const linkId = `${caller.uid}_${boyDoc.uid}`;

  await db.collection('guardianLinks').doc(linkId).set({
    id: linkId,
    guardianId: caller.uid,
    guardianName: caller.fullName,
    boyId: boyDoc.uid,
    boyName: boyDoc.fullName || 'Member',
    relationship: parsed.data.relationship,
    verificationCode,
    verificationMethod: parsed.data.verificationMethod,
    authorityEvidence: parsed.data.authorityEvidence,
    status: 'pending_verification',
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    createdBy: caller.uid,
  });

  await db.collection('notifications').add({
    userId: boyDoc.uid,
    title: 'Guardian Link Verification Requested',
    message: `${caller.fullName} requested to link as your ${parsed.data.relationship}. Share code ${verificationCode} only if you recognise this guardian.`,
    category: 'safeguarding',
    read: false,
    createdAt: FieldValue.serverTimestamp(),
    createdBy: caller.uid,
  });

  await writeAuditLog({
    action: 'GUARDIAN_LINK_REQUESTED',
    performedBy: caller.fullName,
    performedByRole: caller.role,
    targetEntity: 'guardianLinks',
    targetId: linkId,
    details: `Pending verification guardian link created for ${boyDoc.uid}`,
  });

  return { linkId, status: 'pending_verification', verificationCode };
});

// 4. verifyGuardianLink
export const verifyGuardianLink = onCall(async (request) => {
  const caller = await getCallerContext(request);
  const schema = z.object({
    linkId: z.string().min(3),
    verificationCode: z.string().min(6).max(16),
  });
  const parsed = schema.safeParse(request.data);
  if (!parsed.success) throw new HttpsError('invalid-argument', 'Valid link ID and verification code required.');

  const linkRef = db.collection('guardianLinks').doc(parsed.data.linkId);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(linkRef);
    if (!snap.exists) throw new HttpsError('not-found', 'Link request not found.');
    const data = snap.data()!;
    const isAllowed = caller.role === 'admin' || caller.role === 'coordinator' || data.boyId === caller.uid;
    if (!isAllowed) throw new HttpsError('permission-denied', 'Only the child member or coordinator can verify this link.');
    if (data.verificationCode !== parsed.data.verificationCode.trim()) {
      throw new HttpsError('failed-precondition', 'Verification code does not match.');
    }
    tx.update(linkRef, {
      status: 'verified',
      verifiedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    tx.update(db.collection('users').doc(data.boyId), {
      guardianId: data.guardianId,
      updatedAt: FieldValue.serverTimestamp(),
    });
  });

  await writeAuditLog({
    action: 'GUARDIAN_LINK_VERIFIED',
    performedBy: caller.fullName,
    performedByRole: caller.role,
    targetEntity: 'guardianLinks',
    targetId: parsed.data.linkId,
    details: 'Guardian-child relationship verified with code.',
  });

  return { ok: true, status: 'verified' };
});

// 5. submitGuardianConsent
export const submitGuardianConsent = onCall(async (request) => {
  const caller = await getCallerContext(request);
  assertRole(caller.role, ['guardian', 'coordinator', 'admin']);
  const schema = z.object({
    boyId: z.string().min(1),
    consentVersion: z.string().min(1).max(20).default('2026.1'),
    method: z.enum(['guardian_portal', 'sms_otp', 'coordinator_verified']).default('guardian_portal'),
    verificationMethod: z.enum(['child_code_confirmation', 'coordinator_id_check', 'guardian_sms_otp', 'school_patron_attestation']),
    authorityEvidence: z.string().min(4).max(240).transform(sanitize),
  });
  const parsed = schema.safeParse(request.data);
  if (!parsed.success) throw new HttpsError('invalid-argument', 'Valid verificationMethod and authorityEvidence are required.');
  const { boyId, consentVersion, method, verificationMethod, authorityEvidence } = parsed.data;

  if (caller.role === 'guardian') {
    const linkSnap = await db.collection('guardianLinks').doc(`${caller.uid}_${boyId}`).get();
    if (!linkSnap.exists || linkSnap.data()?.status !== 'verified') {
      throw new HttpsError('permission-denied', 'A verified guardian link is required before granting consent.');
    }
  }

  const boySnap = await db.collection('users').doc(boyId).get();
  if (!boySnap.exists) throw new HttpsError('not-found', 'Child member account not found.');
  const boyData = boySnap.data()!;
  const existingCard = boyData.membershipNumber as string | undefined;
  const generated = generateMembershipNumber(boyId);
  const membershipNumber = existingCard || generated.membershipNumber;
  const qrToken = (boyData.membershipQrToken as string | undefined) || generated.qrToken;
  const issuedAt = (boyData.membershipIssuedAt as string | undefined) || new Date().toISOString();

  const consentRef = db.collection('consentRecords').doc();
  await db.runTransaction(async (tx) => {
    tx.set(consentRef, {
      id: consentRef.id,
      boyId,
      guardianId: caller.uid,
      action: 'granted',
      consentVersion,
      method,
      verificationMethod,
      authorityEvidence,
      createdAt: FieldValue.serverTimestamp(),
      createdBy: caller.uid,
    });
    tx.update(db.collection('users').doc(boyId), {
      status: 'active',
      membershipNumber,
      membershipIssuedAt: issuedAt,
      membershipQrToken: qrToken,
      updatedAt: FieldValue.serverTimestamp(),
    });
    tx.set(db.collection('membershipVerifications').doc(membershipNumber), {
      membershipNumber,
      uid: boyId,
      status: 'active',
      ageCategory: boyData.ageCategory || 'child_5_17',
      district: boyData.district || 'Kampala',
      issuedAt,
      qrToken,
      isMinor: (boyData.calculatedAge ?? 16) < 18 || boyData.ageCategory === 'child_5_17',
      updatedAt: FieldValue.serverTimestamp(),
    });
  });

  await writeAuditLog({
    action: 'GUARDIAN_CONSENT_GRANTED',
    performedBy: caller.fullName,
    performedByRole: caller.role,
    targetEntity: 'users',
    targetId: boyId,
    details: `Consent v${consentVersion} verified via ${verificationMethod} (${authorityEvidence}). Card ${membershipNumber} issued.`,
  });

  return { consentId: consentRef.id, status: 'active', membershipNumber };
});

// 6. withdrawGuardianConsent
export const withdrawGuardianConsent = onCall(async (request) => {
  const caller = await getCallerContext(request);
  assertRole(caller.role, ['guardian', 'coordinator', 'admin']);
  const schema = z.object({
    boyId: z.string().min(1),
    reason: z.string().min(5).max(400).transform(sanitize),
  });
  const parsed = schema.safeParse(request.data);
  if (!parsed.success) throw new HttpsError('invalid-argument', 'Reason for consent withdrawal is required.');
  const { boyId, reason } = parsed.data;

  if (caller.role === 'guardian') {
    const linkSnap = await db.collection('guardianLinks').doc(`${caller.uid}_${boyId}`).get();
    if (!linkSnap.exists || linkSnap.data()?.status !== 'verified') {
      throw new HttpsError('permission-denied', 'Verified guardian relationship required.');
    }
  }

  const consentRef = db.collection('consentRecords').doc();
  await db.runTransaction(async (tx) => {
    tx.set(consentRef, {
      id: consentRef.id,
      boyId,
      guardianId: caller.uid,
      action: 'withdrawn',
      consentVersion: '2026.1',
      reason,
      createdAt: FieldValue.serverTimestamp(),
      createdBy: caller.uid,
    });
    tx.update(db.collection('users').doc(boyId), {
      status: 'pending_guardian_consent',
      updatedAt: FieldValue.serverTimestamp(),
    });
  });

  await writeAuditLog({
    action: 'GUARDIAN_CONSENT_WITHDRAWN',
    performedBy: caller.fullName,
    performedByRole: caller.role,
    targetEntity: 'users',
    targetId: boyId,
    details: `Guardian withdrew consent: ${reason}`,
  });

  return { consentId: consentRef.id, childStatus: 'pending_guardian_consent' };
});

// 7. submitMentorApplication
export const submitMentorApplication = onCall(async (request) => {
  const schema = z.object({
    fullName: z.string().min(2).max(80).transform(sanitize),
    email: z.string().email().max(254).transform((v) => v.toLowerCase()),
    phone: ugandaPhoneSchema,
    district: z.string().min(2).max(60).transform(sanitize),
    occupation: z.string().min(2).max(100).transform(sanitize),
    motivation: z.string().min(50).max(800).transform(sanitize),
    referee1Name: z.string().min(2).max(80).transform(sanitize),
    referee1Phone: ugandaPhoneSchema,
    referee2Name: z.string().min(2).max(80).transform(sanitize),
    referee2Phone: ugandaPhoneSchema,
  });
  const parsed = schema.safeParse(request.data);
  if (!parsed.success) throw new HttpsError('invalid-argument', parsed.error.issues[0]?.message || 'Invalid mentor application.');
  const d = parsed.data;
  const uid = request.auth?.uid || `mentor_cand_${Date.now()}`;

  const appRef = db.collection('mentorApplications').doc();
  const batch = db.batch();
  batch.set(appRef, {
    id: appRef.id,
    applicantUid: uid,
    fullName: d.fullName,
    email: d.email,
    phone: normalizePhone(d.phone),
    district: d.district,
    occupation: d.occupation,
    motivation: d.motivation,
    status: 'pending_vetting',
    dbsSafeguardingCheck: 'pending',
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    createdBy: uid,
  });

  batch.set(db.collection('mentorReferees').doc(`${appRef.id}_ref1`), {
    applicationId: appRef.id,
    mentorUid: uid,
    refereeIndex: 1,
    name: d.referee1Name,
    phone: normalizePhone(d.referee1Phone),
    status: 'pending',
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    createdBy: uid,
  });

  batch.set(db.collection('mentorReferees').doc(`${appRef.id}_ref2`), {
    applicationId: appRef.id,
    mentorUid: uid,
    refereeIndex: 2,
    name: d.referee2Name,
    phone: normalizePhone(d.referee2Phone),
    status: 'pending',
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    createdBy: uid,
  });

  await batch.commit();
  return { applicationId: appRef.id, status: 'pending_vetting' };
});

// 8. verifyMentorReferee
export const verifyMentorReferee = onCall(async (request) => {
  const caller = await getCallerContext(request);
  assertRole(caller.role, ['coordinator', 'admin']);
  const schema = z.object({
    refereeId: z.string().min(1),
    status: z.enum(['verified', 'flagged']),
    notes: z.string().max(400).optional(),
  });
  const parsed = schema.safeParse(request.data);
  if (!parsed.success) throw new HttpsError('invalid-argument', 'Invalid referee verification payload.');

  await db.collection('mentorReferees').doc(parsed.data.refereeId).update({
    status: parsed.data.status,
    verifiedBy: caller.uid,
    notes: parsed.data.notes ? sanitize(parsed.data.notes) : '',
    updatedAt: FieldValue.serverTimestamp(),
  });

  await writeAuditLog({
    action: 'MENTOR_REFEREE_VERIFIED',
    performedBy: caller.fullName,
    performedByRole: caller.role,
    targetEntity: 'mentorReferees',
    targetId: parsed.data.refereeId,
    details: `Referee marked ${parsed.data.status}`,
  });

  return { ok: true };
});

// 9. approveMentorApplication
export const approveMentorApplication = onCall(async (request) => {
  const caller = await getCallerContext(request);
  assertRole(caller.role, ['coordinator', 'admin']);
  const schema = z.object({
    applicationId: z.string().min(1),
    decision: z.enum(['approved', 'declined']),
  });
  const parsed = schema.safeParse(request.data);
  if (!parsed.success) throw new HttpsError('invalid-argument', 'Invalid decision.');

  const appRef = db.collection('mentorApplications').doc(parsed.data.applicationId);
  const appSnap = await appRef.get();
  if (!appSnap.exists) throw new HttpsError('not-found', 'Mentor application not found.');
  const appData = appSnap.data()!;

  if (parsed.data.decision === 'approved') {
    const refs = await db.collection('mentorReferees').where('applicationId', '==', parsed.data.applicationId).get();
    const verifiedCount = refs.docs.filter((d) => d.data().status === 'verified').length;
    if (verifiedCount < 2) {
      throw new HttpsError('failed-precondition', 'Both community referees must be verified before mentor approval.');
    }
  }

  await appRef.update({
    status: parsed.data.decision,
    dbsSafeguardingCheck: parsed.data.decision === 'approved' ? 'cleared' : 'flagged',
    vettedBy: caller.uid,
    updatedAt: FieldValue.serverTimestamp(),
  });

  if (parsed.data.decision === 'approved' && appData.applicantUid && !String(appData.applicantUid).startsWith('mentor_cand_')) {
    await db.collection('users').doc(appData.applicantUid).set({ role: 'mentor', status: 'active', updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    await adminAuth.setCustomUserClaims(appData.applicantUid, { role: 'mentor' }).catch(() => undefined);
  }

  await writeAuditLog({
    action: parsed.data.decision === 'approved' ? 'MENTOR_APPROVED' : 'MENTOR_DECLINED',
    performedBy: caller.fullName,
    performedByRole: caller.role,
    targetEntity: 'mentorApplications',
    targetId: parsed.data.applicationId,
    details: `Mentor application ${parsed.data.decision}`,
  });

  return { ok: true, decision: parsed.data.decision };
});

// 10. submitPartnerApplication
export const submitPartnerApplication = onCall(async (request) => {
  const schema = z.object({
    orgName: z.string().min(3).max(120).transform(sanitize),
    orgType: z.enum(['school', 'church', 'business', 'ngo', 'community_cbo']),
    contactPerson: z.string().min(2).max(80).transform(sanitize),
    email: z.string().email().max(254),
    phone: ugandaPhoneSchema,
    district: z.string().min(2).max(60).transform(sanitize),
    applicationType: z.enum(['institutional_partner', 'vanguard_club', 'event_collaboration']).default('institutional_partner'),
    proposal: z.string().min(30).max(1200).transform(sanitize),
  });
  const parsed = schema.safeParse(request.data);
  if (!parsed.success) throw new HttpsError('invalid-argument', parsed.error.issues[0]?.message || 'Invalid partner application.');
  const d = parsed.data;
  const uid = request.auth?.uid || `partner_${Date.now()}`;

  const docRef = await db.collection('partnerApplications').add({
    ...d,
    phone: normalizePhone(d.phone),
    applicantUid: uid,
    status: 'pending',
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    createdBy: uid,
  });

  return { applicationId: docRef.id, status: 'pending' };
});

// 11. approvePartnerApplication
export const approvePartnerApplication = onCall(async (request) => {
  const caller = await getCallerContext(request);
  assertRole(caller.role, ['coordinator', 'admin']);
  const schema = z.object({ applicationId: z.string().min(1), decision: z.enum(['approved', 'declined']) });
  const parsed = schema.safeParse(request.data);
  if (!parsed.success) throw new HttpsError('invalid-argument', 'Invalid partner approval request.');

  const appRef = db.collection('partnerApplications').doc(parsed.data.applicationId);
  const snap = await appRef.get();
  if (!snap.exists) throw new HttpsError('not-found', 'Partner application not found.');
  const data = snap.data()!;

  await appRef.update({ status: parsed.data.decision, updatedAt: FieldValue.serverTimestamp() });
  if (parsed.data.decision === 'approved') {
    await db.collection('partners').add({
      ownerUid: data.applicantUid,
      orgName: data.orgName,
      orgType: data.orgType,
      district: data.district,
      status: 'verified',
      vanguardClubActive: data.applicationType === 'vanguard_club',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      createdBy: caller.uid,
    });
  }

  await writeAuditLog({
    action: `PARTNER_APPLICATION_${parsed.data.decision.toUpperCase()}`,
    performedBy: caller.fullName,
    performedByRole: caller.role,
    targetEntity: 'partnerApplications',
    targetId: parsed.data.applicationId,
    details: `Partner ${data.orgName} ${parsed.data.decision}`,
  });
  return { ok: true };
});

// 12. assignMemberToCircle
export const assignMemberToCircle = onCall(async (request) => {
  const caller = await getCallerContext(request);
  assertRole(caller.role, ['coordinator', 'admin']);
  const schema = z.object({ userId: z.string().min(1), circleId: z.string().min(1) });
  const parsed = schema.safeParse(request.data);
  if (!parsed.success) throw new HttpsError('invalid-argument', 'userId and circleId are required.');

  const { userId, circleId } = parsed.data;
  await db.runTransaction(async (tx) => {
    const userSnap = await tx.get(db.collection('users').doc(userId));
    const circleSnap = await tx.get(db.collection('mentorshipCircles').doc(circleId));
    if (!userSnap.exists || !circleSnap.exists) throw new HttpsError('not-found', 'User or circle not found.');
    const userData = userSnap.data()!;
    const circleData = circleSnap.data()!;
    if (userData.status !== 'active') {
      throw new HttpsError('failed-precondition', 'Cannot assign a minor or pending account until active consent is verified.');
    }

    const membershipRef = db.collection('circleMemberships').doc(`${circleId}_${userId}`);
    tx.set(membershipRef, {
      id: `${circleId}_${userId}`,
      circleId,
      userId,
      memberName: userData.fullName,
      ageCategory: userData.ageCategory || 'child_5_17',
      leadMentorId: circleData.leadMentorId,
      status: 'active',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      createdBy: caller.uid,
    });
    tx.update(db.collection('users').doc(userId), { circleId, updatedAt: FieldValue.serverTimestamp() });
    tx.update(db.collection('mentorshipCircles').doc(circleId), {
      activeMembersCount: FieldValue.increment(1),
      updatedAt: FieldValue.serverTimestamp(),
    });
  });

  await writeAuditLog({
    action: 'CIRCLE_MEMBER_ASSIGNED',
    performedBy: caller.fullName,
    performedByRole: caller.role,
    targetEntity: 'mentorshipCircles',
    targetId: circleId,
    details: `Assigned member ${userId} to circle ${circleId}`,
  });

  return { ok: true };
});

// 13. recordAttendance
export const recordAttendance = onCall(async (request) => {
  const caller = await getCallerContext(request);
  assertRole(caller.role, ['mentor', 'coordinator', 'admin']);
  const schema = z.object({
    sessionId: z.string().min(1),
    circleId: z.string().min(1),
    memberId: z.string().min(1),
    memberName: z.string().min(2).max(80),
    status: z.enum(['present', 'absent', 'excused']),
    date: z.string().min(4),
  });
  const parsed = schema.safeParse(request.data);
  if (!parsed.success) throw new HttpsError('invalid-argument', 'Invalid attendance payload.');

  const d = parsed.data;
  if (caller.role === 'mentor') {
    const circleSnap = await db.collection('mentorshipCircles').doc(d.circleId).get();
    if (!circleSnap.exists || circleSnap.data()?.leadMentorId !== caller.uid) {
      throw new HttpsError('permission-denied', 'Mentors may only record attendance for their assigned circles.');
    }
  }

  const recordId = `${d.sessionId}_${d.memberId}`;
  await db.collection('attendance').doc(recordId).set({
    id: recordId,
    ...d,
    mentorId: caller.uid,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    createdBy: caller.uid,
  });

  return { ok: true, recordId };
});

// 14. submitConcernReport
export const submitConcernReport = onCall(async (request) => {
  const rateKey = request.auth?.uid || 'public_intake';
  await checkRateLimit(`concern_${rateKey}`, 8, 3600);

  const schema = z.object({
    isAnonymous: z.boolean(),
    reporterName: z.string().max(80).optional(),
    reporterContact: z.string().max(80).optional(),
    boyName: z.string().max(80).optional(),
    district: z.string().min(2).max(60).transform(sanitize),
    concernCategory: z.string().min(2).max(60).transform(sanitize),
    urgency: z.enum(['low', 'medium', 'high', 'immediate']),
    details: z.string().min(10).max(2000).transform(sanitize),
  });
  const parsed = schema.safeParse(request.data);
  if (!parsed.success) throw new HttpsError('invalid-argument', parsed.error.issues[0]?.message || 'Invalid concern report.');

  const d = parsed.data;
  const refNumber = `BCA-SG-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const reportRef = db.collection('concernReports').doc();
  const caseRef = db.collection('safeguardingCases').doc();

  const batch = db.batch();
  batch.set(reportRef, {
    id: reportRef.id,
    refNumber,
    isAnonymous: d.isAnonymous,
    reporterName: d.isAnonymous ? null : d.reporterName ? sanitize(d.reporterName) : null,
    reporterContact: d.isAnonymous ? null : d.reporterContact ? sanitize(d.reporterContact) : null,
    boyName: d.boyName ? sanitize(d.boyName) : null,
    district: d.district,
    concernCategory: d.concernCategory,
    urgency: d.urgency,
    details: d.details,
    status: 'new',
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  batch.set(caseRef, {
    id: caseRef.id,
    refNumber,
    reportId: reportRef.id,
    urgency: d.urgency,
    district: d.district,
    concernCategory: d.concernCategory,
    status: 'new',
    assignedLeadId: null,
    assignedLeadName: 'Unassigned',
    triageNotes: '',
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    createdBy: request.auth?.uid || 'anonymous_intake',
  });

  await batch.commit();
  await writeAuditLog({
    action: 'SAFEGUARDING_CONCERN_FILED',
    performedBy: d.isAnonymous ? 'Anonymous' : d.reporterName || 'Signed Reporter',
    performedByRole: 'confidential',
    targetEntity: 'safeguardingCases',
    targetId: caseRef.id,
    details: `Case ${refNumber} opened (${d.urgency}) in ${d.district}`,
  });

  return { reportId: reportRef.id, caseId: caseRef.id, refNumber };
});

// 15. triageSafeguardingCase
export const triageSafeguardingCase = onCall(async (request) => {
  const caller = await getCallerContext(request);
  if (caller.role !== 'admin' && !(caller.role === 'coordinator' && caller.safeguardingCleared)) {
    throw new HttpsError('permission-denied', 'Independent safeguarding clearance required.');
  }

  const schema = z.object({
    caseId: z.string().min(1),
    status: z.enum(['new', 'unassigned', 'under_review', 'follow_up', 'escalated', 'resolved']),
    triageNotes: z.string().max(2000).transform(sanitize),
    assignedLeadId: z.string().optional(),
    assignedLeadName: z.string().optional(),
    escalationChannel: z.enum(['Sauti 116', 'Uganda Police CFPU (0800 199 699)', 'District Probation Officer']).optional(),
    escalationRef: z.string().max(120).optional(),
  });
  const parsed = schema.safeParse(request.data);
  if (!parsed.success) throw new HttpsError('invalid-argument', 'Invalid triage update.');

  const d = parsed.data;
  await db.collection('safeguardingCases').doc(d.caseId).update({
    status: d.status,
    triageNotes: d.triageNotes,
    ...(d.assignedLeadId ? { assignedLeadId: d.assignedLeadId } : {}),
    ...(d.assignedLeadName ? { assignedLeadName: sanitize(d.assignedLeadName) } : {}),
    ...(d.escalationChannel ? { escalationChannel: d.escalationChannel } : {}),
    ...(d.escalationRef ? { escalationRef: sanitize(d.escalationRef) } : {}),
    updatedAt: FieldValue.serverTimestamp(),
  });

  await writeAuditLog({
    action: 'SAFEGUARDING_CASE_TRIAGED',
    performedBy: caller.fullName,
    performedByRole: caller.role,
    targetEntity: 'safeguardingCases',
    targetId: d.caseId,
    details: `Case status updated to ${d.status}${d.escalationChannel ? ` via ${d.escalationChannel}` : ''}`,
  });

  return { ok: true };
});

// 16. publishCmsContent
export const publishCmsContent = onCall(async (request) => {
  const caller = await getCallerContext(request);
  assertRole(caller.role, ['admin']);
  const schema = z.object({
    collectionName: z.enum(['programmes', 'events', 'learningResources', 'announcements', 'systemSettings']),
    docId: z.string().min(1),
    status: z.enum(['draft', 'published', 'archived']),
    payload: z.record(z.string(), z.unknown()),
  });
  const parsed = schema.safeParse(request.data);
  if (!parsed.success) throw new HttpsError('invalid-argument', 'Invalid CMS payload.');

  const { collectionName, docId, status, payload } = parsed.data;
  await db.collection(collectionName).doc(docId).set(
    {
      ...payload,
      status,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: caller.uid,
    },
    { merge: true }
  );

  await writeAuditLog({
    action: 'CMS_CONTENT_UPDATED',
    performedBy: caller.fullName,
    performedByRole: caller.role,
    targetEntity: collectionName,
    targetId: docId,
    details: `CMS item set to ${status}`,
  });
  return { ok: true };
});

// 17. assignUserRole
export const assignUserRole = onCall(async (request) => {
  const caller = await getCallerContext(request);
  assertRole(caller.role, ['admin']);
  const schema = z.object({
    targetUid: z.string().min(1),
    newRole: z.enum(['boy', 'guardian', 'mentor', 'partner', 'coordinator', 'instructor', 'learning_manager', 'admin']),
    safeguardingCleared: z.boolean().optional(),
    instructorAuthorized: z.boolean().optional(),
  });
  const parsed = schema.safeParse(request.data);
  if (!parsed.success) throw new HttpsError('invalid-argument', 'Invalid role assignment.');

  const { targetUid, newRole, safeguardingCleared, instructorAuthorized } = parsed.data;
  const cleared = newRole === 'admin' ? true : Boolean(safeguardingCleared);
  const canInstruct =
    newRole === 'instructor' || newRole === 'learning_manager' || newRole === 'admin'
      ? true
      : Boolean(instructorAuthorized);

  await db.collection('users').doc(targetUid).update({
    role: newRole,
    safeguardingCleared: cleared,
    instructorAuthorized: canInstruct,
    updatedAt: FieldValue.serverTimestamp(),
  });
  await adminAuth
    .setCustomUserClaims(targetUid, {
      role: newRole,
      safeguardingCleared: cleared,
      instructorAuthorized: canInstruct,
    })
    .catch(() => undefined);

  await writeAuditLog({
    action: 'USER_ROLE_ASSIGNED',
    performedBy: caller.fullName,
    performedByRole: caller.role,
    targetEntity: 'users',
    targetId: targetUid,
    details: `Role assigned: ${newRole}, safeguardingCleared=${cleared}, instructorAuthorized=${canInstruct}`,
  });

  return { ok: true };
});

// 18. suspendUserAccount
export const suspendUserAccount = onCall(async (request) => {
  const caller = await getCallerContext(request);
  assertRole(caller.role, ['admin']);
  const schema = z.object({
    targetUid: z.string().min(1),
    suspend: z.boolean(),
    reason: z.string().min(5).max(300).transform(sanitize),
  });
  const parsed = schema.safeParse(request.data);
  if (!parsed.success) throw new HttpsError('invalid-argument', 'Reason required to change suspension status.');

  const { targetUid, suspend, reason } = parsed.data;
  const nextStatus = suspend ? 'suspended' : 'active';
  const targetUserSnap = await db.collection('users').doc(targetUid).get();
  const targetData = targetUserSnap.data() || {};
  await db.collection('users').doc(targetUid).update({
    status: nextStatus,
    suspensionReason: suspend ? reason : null,
    updatedAt: FieldValue.serverTimestamp(),
  });
  await adminAuth.setCustomUserClaims(targetUid, {
    role: targetData.role || 'boy',
    safeguardingCleared: Boolean(targetData.safeguardingCleared),
    suspended: suspend,
  }).catch(() => undefined);
  await adminAuth.updateUser(targetUid, { disabled: suspend }).catch(() => undefined);

  await writeAuditLog({
    action: suspend ? 'USER_SUSPENDED' : 'USER_REACTIVATED',
    performedBy: caller.fullName,
    performedByRole: caller.role,
    targetEntity: 'users',
    targetId: targetUid,
    details: reason,
  });

  return { ok: true, status: nextStatus };
});

// 19. exportUserData (DPPA Subject Access Request)
export const exportUserData = onCall(async (request) => {
  const caller = await getCallerContext(request);
  const schema = z.object({ targetUid: z.string().optional() });
  const parsed = schema.safeParse(request.data || {});
  const targetUid = parsed.success && parsed.data.targetUid ? parsed.data.targetUid : caller.uid;

  if (targetUid !== caller.uid && caller.role !== 'admin') {
    throw new HttpsError('permission-denied', 'Cannot export another user’s personal data.');
  }

  const [userSnap, profileSnap, goalsSnap, attendanceSnap, consentsSnap] = await Promise.all([
    db.collection('users').doc(targetUid).get(),
    db.collection('memberProfiles').doc(targetUid).get(),
    db.collection('goals').where('userId', '==', targetUid).get(),
    db.collection('attendance').where('memberId', '==', targetUid).get(),
    db.collection('consentRecords').where('boyId', '==', targetUid).get(),
  ]);

  await writeAuditLog({
    action: 'DPPA_SAR_DATA_EXPORTED',
    performedBy: caller.fullName,
    performedByRole: caller.role,
    targetEntity: 'users',
    targetId: targetUid,
    details: 'User personal record archive generated under DPPA 2019.',
  });

  return {
    exportedAt: new Date().toISOString(),
    user: userSnap.data() || null,
    memberProfile: profileSnap.data() || null,
    goals: goalsSnap.docs.map((d) => d.data()),
    attendance: attendanceSnap.docs.map((d) => d.data()),
    consentRecords: consentsSnap.docs.map((d) => d.data()),
  };
});

// 20. requestAccountDeletion
export const requestAccountDeletion = onCall(async (request) => {
  const caller = await getCallerContext(request);
  const schema = z.object({
    targetUid: z.string().optional(),
    reason: z.string().min(5).max(300).transform(sanitize),
  });
  const parsed = schema.safeParse(request.data);
  if (!parsed.success) throw new HttpsError('invalid-argument', 'Deletion reason required.');
  const targetUid = parsed.data.targetUid || caller.uid;
  if (targetUid !== caller.uid && caller.role !== 'admin') {
    throw new HttpsError('permission-denied', 'Unauthorized deletion request.');
  }

  const reqRef = await db.collection('dataProtectionRequests').add({
    userId: targetUid,
    requestedBy: caller.uid,
    type: 'deletion',
    reason: parsed.data.reason,
    status: 'pending',
    safeguardingRetentionCheck: 'required',
    createdAt: FieldValue.serverTimestamp(),
  });

  await writeAuditLog({
    action: 'DPPA_DELETION_REQUESTED',
    performedBy: caller.fullName,
    performedByRole: caller.role,
    targetEntity: 'dataProtectionRequests',
    targetId: reqRef.id,
    details: `Deletion queued with safeguarding retention check for ${targetUid}`,
  });

  return { requestId: reqRef.id, status: 'pending' };
});

// 21. subscribeNewsletter
export const subscribeNewsletter = onCall(async (request) => {
  await checkRateLimit('newsletter_public', 25, 3600);
  const schema = z.object({
    email: z.string().email().max(254).transform((v) => v.toLowerCase()),
    consentGiven: z.literal(true),
    district: z.string().max(60).optional(),
  });
  const parsed = schema.safeParse(request.data);
  if (!parsed.success) throw new HttpsError('invalid-argument', 'Valid email and explicit consent required.');

  const id = Buffer.from(parsed.data.email).toString('base64url').slice(0, 64);
  await db.collection('newsletterSubscribers').doc(id).set({
    email: parsed.data.email,
    consentGiven: true,
    district: parsed.data.district ? sanitize(parsed.data.district) : 'Kampala',
    status: 'subscribed',
    updatedAt: FieldValue.serverTimestamp(),
  });
  return { ok: true };
});

// 22. sendNotification
export const sendNotification = onCall(async (request) => {
  const caller = await getCallerContext(request);
  assertRole(caller.role, ['coordinator', 'admin']);
  const schema = z.object({
    userId: z.string().min(1),
    title: z.string().min(2).max(120).transform(sanitize),
    message: z.string().min(2).max(500).transform(sanitize),
    category: z.enum(['general', 'circle', 'consent', 'programme']).default('general'),
  });
  const parsed = schema.safeParse(request.data);
  if (!parsed.success) throw new HttpsError('invalid-argument', 'Invalid notification payload.');

  const ref = await db.collection('notifications').add({
    ...parsed.data,
    read: false,
    createdAt: FieldValue.serverTimestamp(),
    createdBy: caller.uid,
  });
  return { notificationId: ref.id };
});

// 23. logSafeguardingAccess
export const logSafeguardingAccess = onCall(async (request) => {
  const caller = await getCallerContext(request);
  if (caller.role !== 'admin' && !(caller.role === 'coordinator' && caller.safeguardingCleared)) {
    throw new HttpsError('permission-denied', 'Safeguarding clearance required.');
  }
  const schema = z.object({
    caseId: z.string().min(1),
    action: z.enum(['viewed_case', 'exported_case', 'escalated_case']).default('viewed_case'),
  });
  const parsed = schema.safeParse(request.data);
  if (!parsed.success) throw new HttpsError('invalid-argument', 'caseId required.');

  await writeAuditLog({
    action: `SAFEGUARDING_CASE_${parsed.data.action.toUpperCase()}`,
    performedBy: caller.fullName,
    performedByRole: caller.role,
    targetEntity: 'safeguardingCases',
    targetId: parsed.data.caseId,
    details: `Confidential safeguarding record accessed at ${Timestamp.now().toDate().toISOString()}`,
  });

  return { ok: true };
});

// 24. addSafeguardingFollowUp
export const addSafeguardingFollowUp = onCall(async (request) => {
  const caller = await getCallerContext(request);
  if (caller.role !== 'admin' && !(caller.role === 'coordinator' && caller.safeguardingCleared)) {
    throw new HttpsError('permission-denied', 'Independent safeguarding clearance required.');
  }
  const schema = z.object({
    caseId: z.string().min(1),
    actionTaken: z.string().min(8).max(800).transform(sanitize),
    outcome: z.string().min(4).max(500).transform(sanitize),
    nextReviewDate: z.string().max(40).optional(),
  });
  const parsed = schema.safeParse(request.data);
  if (!parsed.success) throw new HttpsError('invalid-argument', 'Action taken and outcome are required.');

  const followUp = {
    id: `fu_${Date.now()}`,
    timestamp: new Date().toISOString(),
    authorId: caller.uid,
    authorName: caller.fullName,
    actionTaken: parsed.data.actionTaken,
    outcome: parsed.data.outcome,
    nextReviewDate: parsed.data.nextReviewDate || null,
  };

  await db.collection('safeguardingCases').doc(parsed.data.caseId).update({
    followUps: FieldValue.arrayUnion(followUp),
    updatedAt: FieldValue.serverTimestamp(),
  });

  await writeAuditLog({
    action: 'SAFEGUARDING_FOLLOWUP_LOGGED',
    performedBy: caller.fullName,
    performedByRole: caller.role,
    targetEntity: 'safeguardingCases',
    targetId: parsed.data.caseId,
    details: `Follow-up recorded: ${parsed.data.actionTaken}`,
  });

  return { ok: true, followUp };
});

// 25. registerForEvent
export const registerForEvent = onCall(async (request) => {
  const schema = z.object({
    eventId: z.string().min(1),
    attendeeName: z.string().min(2).max(80).transform(sanitize),
    attendeeEmail: z.string().email().max(254).optional(),
    district: z.string().min(2).max(60).transform(sanitize),
  });
  const parsed = schema.safeParse(request.data);
  if (!parsed.success) throw new HttpsError('invalid-argument', 'Valid event registration details required.');

  const { eventId, attendeeName, attendeeEmail, district } = parsed.data;
  const confirmationCode = `BCA-EVT-${Math.floor(1000 + Math.random() * 9000)}`;
  const regRef = db.collection('eventRegistrations').doc();

  await db.runTransaction(async (tx) => {
    const evtRef = db.collection('events').doc(eventId);
    const evtSnap = await tx.get(evtRef);
    if (!evtSnap.exists) throw new HttpsError('not-found', 'Event not found.');
    const evtData = evtSnap.data()!;
    if ((evtData.registeredCount || 0) >= (evtData.capacity || 0)) {
      throw new HttpsError('failed-precondition', 'Event has reached capacity.');
    }
    tx.set(regRef, {
      id: regRef.id,
      eventId,
      userId: request.auth?.uid || null,
      attendeeName,
      attendeeEmail: attendeeEmail || null,
      district,
      confirmationCode,
      attendanceStatus: 'registered',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    tx.update(evtRef, {
      registeredCount: FieldValue.increment(1),
      updatedAt: FieldValue.serverTimestamp(),
    });
  });

  return { registrationId: regRef.id, confirmationCode };
});

// 26. recordEventAttendance
export const recordEventAttendance = onCall(async (request) => {
  const caller = await getCallerContext(request);
  assertRole(caller.role, ['mentor', 'coordinator', 'admin']);
  const schema = z.object({
    registrationId: z.string().min(1),
    attendanceStatus: z.enum(['registered', 'present', 'absent', 'excused']),
  });
  const parsed = schema.safeParse(request.data);
  if (!parsed.success) throw new HttpsError('invalid-argument', 'Invalid attendance status.');

  await db.collection('eventRegistrations').doc(parsed.data.registrationId).update({
    attendanceStatus: parsed.data.attendanceStatus,
    markedBy: caller.fullName,
    updatedAt: FieldValue.serverTimestamp(),
  });

  return { ok: true };
});

// 27. submitContactMessage
export const submitContactMessage = onCall(async (request) => {
  await checkRateLimit('contact_public', 20, 3600);
  const schema = z.object({
    fullName: z.string().min(2).max(80).transform(sanitize),
    email: z.string().email().max(254).transform((v) => v.toLowerCase()),
    phone: ugandaPhoneSchema,
    subject: z.string().min(4).max(140).transform(sanitize),
    message: z.string().min(10).max(1500).transform(sanitize),
  });
  const parsed = schema.safeParse(request.data);
  if (!parsed.success) throw new HttpsError('invalid-argument', parsed.error.issues[0]?.message || 'Invalid contact inquiry.');

  const ref = db.collection('contactMessages').doc();
  await ref.set({
    id: ref.id,
    fullName: parsed.data.fullName,
    email: parsed.data.email,
    phone: normalizePhone(parsed.data.phone),
    subject: parsed.data.subject,
    message: parsed.data.message,
    status: 'new',
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  return { messageId: ref.id };
});

// 28. submitProgressReport
export const submitProgressReport = onCall(async (request) => {
  const caller = await getCallerContext(request);
  assertRole(caller.role, ['mentor', 'coordinator', 'admin']);
  const schema = z.object({
    circleId: z.string().min(1),
    circleName: z.string().min(2).max(120).transform(sanitize),
    reportingPeriod: z.string().min(3).max(60).transform(sanitize),
    attendanceSummary: z.string().min(5).max(500).transform(sanitize),
    keyMilestones: z.string().min(10).max(1200).transform(sanitize),
    safeguardingObservations: z.string().min(5).max(800).transform(sanitize),
    supportNeeded: z.string().max(500).transform(sanitize).optional(),
  });
  const parsed = schema.safeParse(request.data);
  if (!parsed.success) throw new HttpsError('invalid-argument', parsed.error.issues[0]?.message || 'Invalid progress report.');

  if (caller.role === 'mentor') {
    const circleSnap = await db.collection('mentorshipCircles').doc(parsed.data.circleId).get();
    if (!circleSnap.exists || circleSnap.data()?.leadMentorId !== caller.uid) {
      throw new HttpsError('permission-denied', 'Mentors may only submit progress reports for their assigned circle.');
    }
  }

  const ref = db.collection('progressReports').doc();
  await ref.set({
    id: ref.id,
    circleId: parsed.data.circleId,
    circleName: parsed.data.circleName,
    mentorId: caller.uid,
    mentorName: caller.fullName,
    reportingPeriod: parsed.data.reportingPeriod,
    attendanceSummary: parsed.data.attendanceSummary,
    keyMilestones: parsed.data.keyMilestones,
    safeguardingObservations: parsed.data.safeguardingObservations,
    ...(parsed.data.supportNeeded ? { supportNeeded: parsed.data.supportNeeded } : {}),
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  await writeAuditLog({
    action: 'MENTOR_PROGRESS_REPORT_SUBMITTED',
    performedBy: caller.fullName,
    performedByRole: caller.role,
    targetEntity: 'progressReports',
    targetId: ref.id,
    details: `${parsed.data.reportingPeriod} report for ${parsed.data.circleName}`,
  });

  return { reportId: ref.id };
});

// 29. reviewDppaRequest
export const reviewDppaRequest = onCall(async (request) => {
  const caller = await getCallerContext(request);
  assertRole(caller.role, ['admin']);
  const schema = z.object({
    requestId: z.string().min(1),
    status: z.enum(['pending', 'completed', 'held_for_safeguarding', 'rejected']),
    resolutionNotes: z.string().max(400).transform(sanitize).optional(),
  });
  const parsed = schema.safeParse(request.data);
  if (!parsed.success) throw new HttpsError('invalid-argument', 'Invalid DPPA SAR review payload.');

  await db.collection('dataProtectionRequests').doc(parsed.data.requestId).update({
    status: parsed.data.status,
    reviewedBy: caller.fullName,
    reviewedAt: new Date().toISOString(),
    ...(parsed.data.resolutionNotes ? { resolutionNotes: parsed.data.resolutionNotes } : {}),
  });

  await writeAuditLog({
    action: `DPPA_REQUEST_${parsed.data.status.toUpperCase()}`,
    performedBy: caller.fullName,
    performedByRole: caller.role,
    targetEntity: 'dataProtectionRequests',
    targetId: parsed.data.requestId,
    details: parsed.data.resolutionNotes || `SAR status set to ${parsed.data.status}`,
  });

  return { ok: true };
});

// 30. purgeExpiredRetentionRecords
export const purgeExpiredRetentionRecords = onCall(async (request) => {
  const caller = await getCallerContext(request);
  assertRole(caller.role, ['admin']);
  const settingsSnap = await db.collection('systemSettings').doc('cms').get();
  const settingsData = settingsSnap.data()?.payload || {};
  const membershipDays = Number(settingsData?.retentionDays?.membershipApps || 365);
  const cutoffMs = Date.now() - membershipDays * 24 * 60 * 60 * 1000;
  const cutoffTs = Timestamp.fromMillis(cutoffMs);

  const expiredApps = await db
    .collection('membershipApplications')
    .where('status', 'in', ['approved', 'rejected'])
    .where('updatedAt', '<', cutoffTs)
    .limit(50)
    .get();

  const batch = db.batch();
  expiredApps.docs.forEach((d) => batch.delete(d.ref));
  if (!expiredApps.empty) {
    await batch.commit();
  }

  await writeAuditLog({
    action: 'DPPA_RETENTION_SWEEP',
    performedBy: caller.fullName,
    performedByRole: caller.role,
    targetEntity: 'membershipApplications',
    targetId: 'batch_sweep',
    details: `Purged ${expiredApps.size} archived membership applications older than ${membershipDays} days (safeguarding cases strictly retained).`,
  });

  return { purgedMembershipApplications: expiredApps.size };
});

// =========================================================================
// BCA ONLINE SKILLING LMS & ZOOM SERVER-TO-SERVER INTEGRATION
// =========================================================================

let cachedZoomToken: { token: string; expiresAtMs: number } | null = null;

function areZoomSecretsConfigured(): boolean {
  return Boolean(
    process.env.ZOOM_ACCOUNT_ID?.trim() &&
      process.env.ZOOM_CLIENT_ID?.trim() &&
      process.env.ZOOM_CLIENT_SECRET?.trim()
  );
}

async function getZoomAccessToken(): Promise<string> {
  if (!areZoomSecretsConfigured()) {
    throw new HttpsError(
      'failed-precondition',
      'Zoom Server-to-Server OAuth credentials are not configured in Cloud Functions Secret Manager.'
    );
  }
  if (cachedZoomToken && Date.now() < cachedZoomToken.expiresAtMs - 60_000) {
    return cachedZoomToken.token;
  }
  const accountId = ZOOM_ACCOUNT_ID.value().trim();
  const clientId = ZOOM_CLIENT_ID.value().trim();
  const clientSecret = ZOOM_CLIENT_SECRET.value().trim();
  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch(
    `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${encodeURIComponent(accountId)}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  );
  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new HttpsError('unavailable', `Zoom OAuth authentication failed (${response.status}): ${errText.slice(0, 180)}`);
  }
  const payload = (await response.json()) as { access_token: string; expires_in: number };
  cachedZoomToken = {
    token: payload.access_token,
    expiresAtMs: Date.now() + (payload.expires_in || 3600) * 1000,
  };
  return payload.access_token;
}

function toUtcFromKampala(scheduledDate: string, startTimeKampala: string): string {
  // Uganda observes East Africa Time (UTC+03:00 year-round, no DST)
  const parsed = new Date(`${scheduledDate}T${startTimeKampala}:00+03:00`);
  if (Number.isNaN(parsed.getTime())) {
    throw new HttpsError('invalid-argument', 'Invalid Kampala date or time format.');
  }
  return parsed.toISOString();
}

function maskDisplayNameForMinorCertificate(fullName: string, isMinor: boolean): string {
  const clean = sanitize(fullName);
  if (!isMinor) return clean;
  const parts = clean.split(' ').filter(Boolean);
  if (parts.length <= 1) return `${parts[0]?.[0] || 'B'}.`;
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}

async function assertCourseInstructorOrManager(caller: Awaited<ReturnType<typeof getCallerContext>>, courseId: string) {
  if (caller.role === 'admin' || caller.role === 'learning_manager') return;
  if (!caller.instructorAuthorized) {
    throw new HttpsError('permission-denied', 'Instructor authorization required.');
  }
  const [assignSnap, courseSnap] = await Promise.all([
    db.collection('instructorAssignments').doc(`${courseId}_${caller.uid}`).get(),
    db.collection('courses').doc(courseId).get(),
  ]);
  const isAssignedDoc = assignSnap.exists && assignSnap.data()?.status === 'active';
  const courseData = courseSnap.data();
  const isCourseOwner =
    courseSnap.exists &&
    (courseData?.createdBy === caller.uid ||
      (Array.isArray(courseData?.instructorIds) && courseData.instructorIds.includes(caller.uid)));
  if (!isAssignedDoc && !isCourseOwner) {
    throw new HttpsError('permission-denied', 'You are not assigned as an instructor on this course.');
  }
}

async function recalculateCourseProgressAndIssue(courseId: string, userId: string) {
  const [lessonsSnap, progressSnap, enrollSnap, courseSnap, userSnap] = await Promise.all([
    db.collection('courseLessons').where('courseId', '==', courseId).where('status', '==', 'published').get(),
    db.collection('lessonProgress').where('courseId', '==', courseId).where('userId', '==', userId).get(),
    db.collection('courseEnrollments').doc(`${courseId}_${userId}`).get(),
    db.collection('courses').doc(courseId).get(),
    db.collection('users').doc(userId).get(),
  ]);
  if (!enrollSnap.exists) return { progressPercent: 0 };

  const requiredLessons = lessonsSnap.docs.filter((d) => d.data().isRequired !== false);
  const targetLessons = requiredLessons.length > 0 ? requiredLessons : lessonsSnap.docs;
  const totalCount = targetLessons.length;
  const completedLessonIds = new Set(progressSnap.docs.filter((d) => d.data().completed === true).map((d) => d.data().lessonId));
  const completedCount = targetLessons.filter((d) => completedLessonIds.has(d.id)).length;
  const totalMinutes = Math.round(
    progressSnap.docs.reduce((sum, d) => sum + Number(d.data().watchedSeconds || 0), 0) / 60
  );
  const progressPercent = totalCount === 0 ? 0 : Math.min(100, Math.round((completedCount / totalCount) * 100));

  const updatePayload: Record<string, unknown> = {
    progressPercent,
    completedLessonsCount: completedCount,
    totalLessonsCount: totalCount,
    learningMinutes: totalMinutes,
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (progressPercent === 100 && enrollSnap.data()?.status !== 'completed') {
    updatePayload.status = 'completed';
    updatePayload.completedAt = new Date().toISOString();
  }
  await enrollSnap.ref.update(updatePayload);

  if (progressPercent === 100) {
    const existingCert = await db.collection('certificates').doc(`${courseId}_${userId}`).get();
    if (!existingCert.exists && courseSnap.exists && userSnap.exists) {
      const courseData = courseSnap.data()!;
      const userData = userSnap.data()!;
      const isMinor = userData.ageCategory === 'child_5_17' || Number(userData.calculatedAge || 18) < 18;
      const year = new Date().getFullYear();
      const rand = Math.floor(1000 + Math.random() * 9000);
      const certificateNumber = `BCA-CERT-${year}-${rand}`;
      const qrToken = `CERTQR-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
      const completionDate = new Date().toISOString().slice(0, 10);
      const learnerDisplayName = maskDisplayNameForMinorCertificate(userData.fullName || 'BCA Learner', isMinor);
      const instructorSignatory = Array.isArray(courseData.instructorNames) && courseData.instructorNames[0]
        ? String(courseData.instructorNames[0])
        : 'BCA Lead Instructor';

      await db.runTransaction(async (tx) => {
        tx.set(db.collection('certificates').doc(`${courseId}_${userId}`), {
          id: `${courseId}_${userId}`,
          certificateNumber,
          courseId,
          courseTitle: courseData.title,
          userId,
          learnerDisplayName,
          completionDate,
          instructorSignatory,
          learningManagerSignatory: 'BCA Uganda Learning Department',
          qrToken,
          status: 'issued',
          issuedAt: new Date().toISOString(),
          updatedAt: FieldValue.serverTimestamp(),
        });
        tx.set(db.collection('certificateVerifications').doc(certificateNumber), {
          certificateNumber,
          courseTitle: courseData.title,
          learnerDisplayName,
          completionDate,
          instructorSignatory,
          status: 'issued',
          qrToken,
          updatedAt: FieldValue.serverTimestamp(),
        });
      });

      await db.collection('learningNotifications').add({
        userId,
        courseId,
        title: 'Digital Certificate Issued',
        message: `Congratulations! Your certificate ${certificateNumber} for ${courseData.title} is ready to download.`,
        category: 'certificate',
        read: false,
        createdAt: FieldValue.serverTimestamp(),
      });
    }
  }

  return { progressPercent, completedCount, totalCount };
}

// 31. connectZoomConfiguration
export const connectZoomConfiguration = onCall(
  { secrets: [ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET] },
  async (request) => {
    const caller = await getCallerContext(request);
    assertRole(caller.role, ['learning_manager', 'admin']);
    const schema = z.object({
      hostUserIdOrEmail: z.string().min(2).max(160).transform(sanitize),
      defaultTimezone: z.literal('Africa/Kampala').default('Africa/Kampala'),
      minorSafeguardingLock: z.boolean().default(true),
    });
    const parsed = schema.safeParse(request.data);
    if (!parsed.success) throw new HttpsError('invalid-argument', 'Valid Zoom host user ID or email is required.');

    const secretsConfigured = areZoomSecretsConfigured();
    const payload = {
      connected: secretsConfigured,
      secretsConfigured,
      hostUserIdOrEmail: parsed.data.hostUserIdOrEmail,
      defaultTimezone: 'Africa/Kampala',
      minorSafeguardingLock: parsed.data.minorSafeguardingLock,
      statusMessage: secretsConfigured
        ? 'Zoom Server-to-Server OAuth secrets detected. Run Test Connection to verify the host account.'
        : 'Zoom Server-to-Server OAuth secrets (ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET) are not configured in Cloud Functions Secret Manager yet.',
      updatedBy: caller.fullName,
      updatedAt: new Date().toISOString(),
    };

    await db.collection('systemSettings').doc('zoomIntegration').set(
      {
        key: 'zoomIntegration',
        status: 'published',
        payload,
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: caller.uid,
      },
      { merge: true }
    );

    await writeAuditLog({
      action: 'ZOOM_CONFIG_UPDATED',
      performedBy: caller.fullName,
      performedByRole: caller.role,
      targetEntity: 'systemSettings',
      targetId: 'zoomIntegration',
      details: `Zoom host set to ${parsed.data.hostUserIdOrEmail}. Secrets configured: ${secretsConfigured}`,
    });

    return payload;
  }
);

// 32. testZoomConnection
export const testZoomConnection = onCall(
  { secrets: [ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET] },
  async (request) => {
    const caller = await getCallerContext(request);
    assertRole(caller.role, ['learning_manager', 'admin']);

    const secretsConfigured = areZoomSecretsConfigured();
    const settingSnap = await db.collection('systemSettings').doc('zoomIntegration').get();
    const existingPayload = (settingSnap.data()?.payload as Record<string, unknown>) || {};
    const hostUser = String(existingPayload.hostUserIdOrEmail || 'me');

    if (!secretsConfigured) {
      const payload = {
        ...existingPayload,
        connected: false,
        secretsConfigured: false,
        hostUserIdOrEmail: hostUser,
        defaultTimezone: 'Africa/Kampala',
        minorSafeguardingLock: true,
        lastTestedAt: new Date().toISOString(),
        statusMessage: 'Zoom API integration is not configured. Missing Cloud Functions Secret Manager keys (ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET).',
        updatedAt: new Date().toISOString(),
      };
      await db.collection('systemSettings').doc('zoomIntegration').set(
        { key: 'zoomIntegration', status: 'published', payload, updatedAt: FieldValue.serverTimestamp(), updatedBy: caller.uid },
        { merge: true }
      );
      return payload;
    }

    const token = await getZoomAccessToken();
    const res = await fetch(`https://api.zoom.us/v2/users/${encodeURIComponent(hostUser)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new HttpsError('failed-precondition', `Zoom host verification failed (${res.status}): ${body.slice(0, 160)}`);
    }
    const zoomUser = (await res.json()) as { first_name?: string; last_name?: string; email?: string };
    const displayName = [zoomUser.first_name, zoomUser.last_name].filter(Boolean).join(' ') || zoomUser.email || hostUser;

    const payload = {
      ...existingPayload,
      connected: true,
      secretsConfigured: true,
      hostUserIdOrEmail: hostUser,
      verifiedHostDisplayName: displayName,
      defaultTimezone: 'Africa/Kampala',
      minorSafeguardingLock: true,
      lastTestedAt: new Date().toISOString(),
      statusMessage: `Connected to Zoom host ${displayName} (${zoomUser.email || hostUser}).`,
      updatedBy: caller.fullName,
      updatedAt: new Date().toISOString(),
    };
    await db.collection('systemSettings').doc('zoomIntegration').set(
      { key: 'zoomIntegration', status: 'published', payload, updatedAt: FieldValue.serverTimestamp(), updatedBy: caller.uid },
      { merge: true }
    );
    return payload;
  }
);

// 33. createZoomMeeting
export const createZoomMeeting = onCall(
  { secrets: [ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET] },
  async (request) => {
    const caller = await getCallerContext(request);
    assertRole(caller.role, ['instructor', 'mentor', 'learning_manager', 'admin']);
    const schema = z.object({
      courseId: z.string().min(1),
      moduleId: z.string().optional(),
      title: z.string().min(3).max(160).transform(sanitize),
      description: z.string().max(800).transform(sanitize).default('Live interactive class session'),
      scheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      startTimeKampala: z.string().regex(/^\d{2}:\d{2}$/),
      durationMinutes: z.number().int().min(15).max(240),
      isRecurring: z.boolean().default(false),
      recurrenceRule: z.string().max(120).optional(),
      manualJoinUrl: z.string().url().optional(),
      manualPasscode: z.string().max(24).optional(),
    });
    const parsed = schema.safeParse(request.data);
    if (!parsed.success) throw new HttpsError('invalid-argument', parsed.error.issues[0]?.message || 'Invalid session payload.');

    const d = parsed.data;
    await assertCourseInstructorOrManager(caller, d.courseId);

    const courseSnap = await db.collection('courses').doc(d.courseId).get();
    if (!courseSnap.exists) throw new HttpsError('not-found', 'Course not found.');
    const courseData = courseSnap.data()!;
    const startsAtIso = toUtcFromKampala(d.scheduledDate, d.startTimeKampala);

    const sessionRef = db.collection('courseSessions').doc();
    const meetingRef = db.collection('zoomMeetings').doc();
    const secretRef = db.collection('zoomMeetingSecrets').doc(meetingRef.id);

    let zoomMeetingId = '';
    let joinUrl = '';
    let startUrl = '';
    let passcode = '';
    let mode: 'zoom_api' | 'manual_fallback' = 'zoom_api';

    if (areZoomSecretsConfigured()) {
      const token = await getZoomAccessToken();
      const settingSnap = await db.collection('systemSettings').doc('zoomIntegration').get();
      const hostUser = String((settingSnap.data()?.payload as Record<string, unknown> | undefined)?.hostUserIdOrEmail || 'me');

      const zoomRes = await fetch(`https://api.zoom.us/v2/users/${encodeURIComponent(hostUser)}/meetings`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: `${courseData.title}: ${d.title}`,
          type: d.isRecurring ? 8 : 2,
          start_time: startsAtIso,
          duration: d.durationMinutes,
          timezone: 'Africa/Kampala',
          agenda: d.description,
          settings: {
            waiting_room: true,
            join_before_host: false,
            mute_upon_entry: true,
            auto_recording: 'none',
            meeting_authentication: false,
          },
        }),
      });
      if (!zoomRes.ok) {
        const errBody = await zoomRes.text().catch(() => '');
        throw new HttpsError('unavailable', `Zoom API failed to create meeting (${zoomRes.status}): ${errBody.slice(0, 180)}`);
      }
      const created = (await zoomRes.json()) as {
        id: number | string;
        join_url: string;
        start_url: string;
        password?: string;
      };
      zoomMeetingId = String(created.id);
      joinUrl = created.join_url;
      startUrl = created.start_url;
      passcode = created.password || '';
      mode = 'zoom_api';
    } else if (d.manualJoinUrl) {
      mode = 'manual_fallback';
      zoomMeetingId = `MANUAL-${Date.now()}`;
      joinUrl = d.manualJoinUrl;
      startUrl = d.manualJoinUrl;
      passcode = d.manualPasscode || '';
    } else {
      throw new HttpsError(
        'failed-precondition',
        'Zoom Server-to-Server OAuth credentials are not configured. Configure Zoom secrets in Learning Manager settings or supply a manual Zoom meeting link fallback.'
      );
    }

    await db.runTransaction(async (tx) => {
      tx.set(sessionRef, {
        id: sessionRef.id,
        courseId: d.courseId,
        courseTitle: courseData.title,
        moduleId: d.moduleId || null,
        title: d.title,
        description: d.description,
        instructorUid: caller.uid,
        instructorName: caller.fullName,
        scheduledDate: d.scheduledDate,
        startTimeKampala: d.startTimeKampala,
        startsAtIso,
        durationMinutes: d.durationMinutes,
        timezone: 'Africa/Kampala',
        zoomMeetingDocId: meetingRef.id,
        isRecurring: d.isRecurring,
        recurrenceRule: d.recurrenceRule || null,
        status: 'scheduled',
        createdBy: caller.uid,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      tx.set(meetingRef, {
        id: meetingRef.id,
        courseId: d.courseId,
        sessionId: sessionRef.id,
        zoomMeetingId,
        topic: d.title,
        startTimeUtc: startsAtIso,
        durationMinutes: d.durationMinutes,
        timezone: 'Africa/Kampala',
        hostIdentity: caller.fullName,
        status: 'scheduled',
        waitingRoom: true,
        joinBeforeHost: false,
        recordingEnabled: false,
        participantRestrictionsApplied: true,
        passcodeProtected: Boolean(passcode),
        mode,
        createdBy: caller.uid,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      tx.set(secretRef, {
        meetingDocId: meetingRef.id,
        joinUrl,
        startUrl,
        passcode,
        updatedAt: FieldValue.serverTimestamp(),
      });
    });

    await writeAuditLog({
      action: 'ZOOM_MEETING_SCHEDULED',
      performedBy: caller.fullName,
      performedByRole: caller.role,
      targetEntity: 'courseSessions',
      targetId: sessionRef.id,
      details: `Scheduled ${mode} live class (${zoomMeetingId}) for ${d.scheduledDate} ${d.startTimeKampala} EAT.`,
    });

    return { sessionId: sessionRef.id, meetingDocId: meetingRef.id, zoomMeetingId, startsAtIso, mode };
  }
);

// 34. updateZoomMeeting
export const updateZoomMeeting = onCall(
  { secrets: [ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET] },
  async (request) => {
    const caller = await getCallerContext(request);
    assertRole(caller.role, ['instructor', 'mentor', 'learning_manager', 'admin']);
    const schema = z.object({
      sessionId: z.string().min(1),
      title: z.string().min(3).max(160).transform(sanitize).optional(),
      scheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      startTimeKampala: z.string().regex(/^\d{2}:\d{2}$/).optional(),
      durationMinutes: z.number().int().min(15).max(240).optional(),
    });
    const parsed = schema.safeParse(request.data);
    if (!parsed.success) throw new HttpsError('invalid-argument', 'Invalid update parameters.');

    const sessionRef = db.collection('courseSessions').doc(parsed.data.sessionId);
    const sessionSnap = await sessionRef.get();
    if (!sessionSnap.exists) throw new HttpsError('not-found', 'Live session not found.');
    const sessionData = sessionSnap.data()!;
    await assertCourseInstructorOrManager(caller, sessionData.courseId);

    const nextDate = parsed.data.scheduledDate || sessionData.scheduledDate;
    const nextTime = parsed.data.startTimeKampala || sessionData.startTimeKampala;
    const nextIso = toUtcFromKampala(nextDate, nextTime);
    const nextDuration = parsed.data.durationMinutes || sessionData.durationMinutes;
    const nextTitle = parsed.data.title || sessionData.title;

    if (sessionData.zoomMeetingDocId) {
      const mRef = db.collection('zoomMeetings').doc(sessionData.zoomMeetingDocId);
      const mSnap = await mRef.get();
      if (mSnap.exists && mSnap.data()?.mode === 'zoom_api' && areZoomSecretsConfigured()) {
        const token = await getZoomAccessToken();
        await fetch(`https://api.zoom.us/v2/meetings/${encodeURIComponent(mSnap.data()!.zoomMeetingId)}`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topic: nextTitle,
            start_time: nextIso,
            duration: nextDuration,
            timezone: 'Africa/Kampala',
          }),
        });
      }
      await mRef.update({
        topic: nextTitle,
        startTimeUtc: nextIso,
        durationMinutes: nextDuration,
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    await sessionRef.update({
      title: nextTitle,
      scheduledDate: nextDate,
      startTimeKampala: nextTime,
      startsAtIso: nextIso,
      durationMinutes: nextDuration,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return { ok: true, startsAtIso: nextIso };
  }
);

// 35. cancelZoomMeeting
export const cancelZoomMeeting = onCall(
  { secrets: [ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET] },
  async (request) => {
    const caller = await getCallerContext(request);
    assertRole(caller.role, ['instructor', 'mentor', 'learning_manager', 'admin']);
    const schema = z.object({ sessionId: z.string().min(1), reason: z.string().max(300).optional() });
    const parsed = schema.safeParse(request.data);
    if (!parsed.success) throw new HttpsError('invalid-argument', 'sessionId is required.');

    const sessionRef = db.collection('courseSessions').doc(parsed.data.sessionId);
    const sessionSnap = await sessionRef.get();
    if (!sessionSnap.exists) throw new HttpsError('not-found', 'Live session not found.');
    const sessionData = sessionSnap.data()!;
    await assertCourseInstructorOrManager(caller, sessionData.courseId);

    if (sessionData.zoomMeetingDocId) {
      const mRef = db.collection('zoomMeetings').doc(sessionData.zoomMeetingDocId);
      const mSnap = await mRef.get();
      if (mSnap.exists && mSnap.data()?.mode === 'zoom_api' && areZoomSecretsConfigured()) {
        const token = await getZoomAccessToken();
        await fetch(`https://api.zoom.us/v2/meetings/${encodeURIComponent(mSnap.data()!.zoomMeetingId)}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => undefined);
      }
      await mRef.update({ status: 'cancelled', updatedAt: FieldValue.serverTimestamp() });
    }

    await sessionRef.update({ status: 'cancelled', updatedAt: FieldValue.serverTimestamp() });
    await writeAuditLog({
      action: 'ZOOM_MEETING_CANCELLED',
      performedBy: caller.fullName,
      performedByRole: caller.role,
      targetEntity: 'courseSessions',
      targetId: parsed.data.sessionId,
      details: parsed.data.reason ? sanitize(parsed.data.reason) : 'Live session cancelled.',
    });

    return { ok: true };
  }
);

// 36. getAuthorizedMeetingDetails
export const getAuthorizedMeetingDetails = onCall(async (request) => {
  const caller = await getCallerContext(request);
  const schema = z.object({ sessionId: z.string().min(1) });
  const parsed = schema.safeParse(request.data);
  if (!parsed.success) throw new HttpsError('invalid-argument', 'sessionId is required.');

  const sessionSnap = await db.collection('courseSessions').doc(parsed.data.sessionId).get();
  if (!sessionSnap.exists) throw new HttpsError('not-found', 'Live class session not found.');
  const session = sessionSnap.data()!;
  if (session.status === 'cancelled') {
    throw new HttpsError('failed-precondition', 'This live class session has been cancelled.');
  }

  let isHostOrManager = caller.role === 'admin' || caller.role === 'learning_manager';
  if (!isHostOrManager && caller.instructorAuthorized) {
    const assignSnap = await db.collection('instructorAssignments').doc(`${session.courseId}_${caller.uid}`).get();
    isHostOrManager = (assignSnap.exists && assignSnap.data()?.status === 'active') || session.instructorUid === caller.uid;
  }

  if (!isHostOrManager) {
    const enrollSnap = await db.collection('courseEnrollments').doc(`${session.courseId}_${caller.uid}`).get();
    if (!enrollSnap.exists || !['approved', 'enrolled', 'completed'].includes(enrollSnap.data()?.status)) {
      throw new HttpsError('permission-denied', 'Active enrolment in this course is required to join the live class.');
    }
  }

  if (!session.zoomMeetingDocId) {
    throw new HttpsError('failed-precondition', 'Meeting link has not been generated for this session.');
  }
  const [meetingSnap, secretSnap] = await Promise.all([
    db.collection('zoomMeetings').doc(session.zoomMeetingDocId).get(),
    db.collection('zoomMeetingSecrets').doc(session.zoomMeetingDocId).get(),
  ]);
  if (!meetingSnap.exists || !secretSnap.exists) {
    throw new HttpsError('not-found', 'Meeting credentials unavailable.');
  }
  const meeting = meetingSnap.data()!;
  const secret = secretSnap.data()!;

  return {
    sessionId: session.id,
    zoomMeetingId: meeting.zoomMeetingId,
    topic: session.title,
    startsAtIso: session.startsAtIso,
    durationMinutes: session.durationMinutes,
    timezone: 'Africa/Kampala',
    joinUrl: secret.joinUrl,
    passcode: secret.passcode || '',
    ...(isHostOrManager && secret.startUrl ? { startUrl: secret.startUrl } : {}),
    safeguardingNotice: 'Waiting Room is enabled and recording is disabled by default for minor safeguarding.',
  };
});

// 37. listCourseMeetings
export const listCourseMeetings = onCall(async (request) => {
  const caller = await getCallerContext(request);
  const schema = z.object({ courseId: z.string().min(1) });
  const parsed = schema.safeParse(request.data);
  if (!parsed.success) throw new HttpsError('invalid-argument', 'courseId is required.');

  const isManager = caller.role === 'admin' || caller.role === 'learning_manager';
  if (!isManager) {
    const enrollSnap = await db.collection('courseEnrollments').doc(`${parsed.data.courseId}_${caller.uid}`).get();
    const isEnrolled = enrollSnap.exists && ['approved', 'enrolled', 'completed'].includes(enrollSnap.data()?.status);
    if (!isEnrolled) {
      await assertCourseInstructorOrManager(caller, parsed.data.courseId);
    }
  }

  const sessionsSnap = await db.collection('courseSessions').where('courseId', '==', parsed.data.courseId).get();
  return { sessions: sessionsSnap.docs.map((d) => ({ id: d.id, ...d.data() })) };
});

// 38. syncMeetingStatus
export const syncMeetingStatus = onCall(
  { secrets: [ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET] },
  async (request) => {
    const caller = await getCallerContext(request);
    assertRole(caller.role, ['instructor', 'mentor', 'learning_manager', 'admin']);
    const schema = z.object({ sessionId: z.string().min(1) });
    const parsed = schema.safeParse(request.data);
    if (!parsed.success) throw new HttpsError('invalid-argument', 'sessionId is required.');

    const sessionSnap = await db.collection('courseSessions').doc(parsed.data.sessionId).get();
    if (!sessionSnap.exists) throw new HttpsError('not-found', 'Session not found.');
    const session = sessionSnap.data()!;
    await assertCourseInstructorOrManager(caller, session.courseId);

    const meetingSnap = session.zoomMeetingDocId
      ? await db.collection('zoomMeetings').doc(session.zoomMeetingDocId).get()
      : null;
    if (!meetingSnap?.exists || meetingSnap.data()?.mode !== 'zoom_api' || !areZoomSecretsConfigured()) {
      return { ok: true, status: session.status, mode: meetingSnap?.data()?.mode || 'manual_fallback' };
    }

    const token = await getZoomAccessToken();
    const res = await fetch(`https://api.zoom.us/v2/meetings/${encodeURIComponent(meetingSnap.data()!.zoomMeetingId)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new HttpsError('unavailable', 'Unable to sync meeting status from Zoom.');
    const zm = (await res.json()) as { status?: string };
    const nextStatus = zm.status === 'started' ? 'live' : zm.status === 'finished' ? 'completed' : 'scheduled';
    await sessionSnap.ref.update({ status: nextStatus, updatedAt: FieldValue.serverTimestamp() });
    await meetingSnap.ref.update({
      status: zm.status === 'started' ? 'started' : zm.status === 'finished' ? 'ended' : 'scheduled',
      updatedAt: FieldValue.serverTimestamp(),
    });
    return { ok: true, status: nextStatus };
  }
);

// 39. processZoomWebhook
export const processZoomWebhook = onRequest(
  { secrets: [ZOOM_WEBHOOK_SECRET_TOKEN] },
  async (req, res) => {
    const secretToken = ZOOM_WEBHOOK_SECRET_TOKEN.value().trim();
    if (!secretToken) {
      res.status(503).json({ error: 'Zoom webhook secret not configured.' });
      return;
    }

    const body = req.body as {
      event?: string;
      payload?: {
        plainToken?: string;
        object?: { id?: string | number; participant?: { email?: string; user_name?: string } };
      };
    };

    // Endpoint validation handshake required by Zoom
    if (body?.event === 'endpoint.url_validation' && body.payload?.plainToken) {
      const encryptedToken = createHmac('sha256', secretToken).update(body.payload.plainToken).digest('hex');
      res.status(200).json({ plainToken: body.payload.plainToken, encryptedToken });
      return;
    }

    const signature = String(req.headers['x-zm-signature'] || '');
    const timestamp = String(req.headers['x-zm-request-timestamp'] || '');
    const rawBody = req.rawBody ? req.rawBody.toString('utf8') : JSON.stringify(body);
    const expectedSig = `v0=${createHmac('sha256', secretToken).update(`v0:${timestamp}:${rawBody}`).digest('hex')}`;

    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expectedSig);
    if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
      res.status(401).json({ error: 'Invalid Zoom webhook signature.' });
      return;
    }

    const zoomId = body.payload?.object?.id ? String(body.payload.object.id) : '';
    if (zoomId) {
      const mQuery = await db.collection('zoomMeetings').where('zoomMeetingId', '==', zoomId).limit(1).get();
      if (!mQuery.empty) {
        const mDoc = mQuery.docs[0];
        const sessionId = mDoc.data().sessionId as string;
        if (body.event === 'meeting.started') {
          await mDoc.ref.update({ status: 'started', updatedAt: FieldValue.serverTimestamp() });
          await db.collection('courseSessions').doc(sessionId).update({ status: 'live', updatedAt: FieldValue.serverTimestamp() });
        } else if (body.event === 'meeting.ended') {
          await mDoc.ref.update({ status: 'ended', updatedAt: FieldValue.serverTimestamp() });
          await db.collection('courseSessions').doc(sessionId).update({ status: 'completed', updatedAt: FieldValue.serverTimestamp() });
        } else if (body.event === 'meeting.deleted') {
          await mDoc.ref.update({ status: 'cancelled', updatedAt: FieldValue.serverTimestamp() });
          await db.collection('courseSessions').doc(sessionId).update({ status: 'cancelled', updatedAt: FieldValue.serverTimestamp() });
        }
      }
    }

    res.status(200).json({ received: true });
  }
);

// 40. submitCourseForApproval & 41. reviewCoursePublication
export const submitCourseForApproval = onCall(async (request) => {
  const caller = await getCallerContext(request);
  assertRole(caller.role, ['instructor', 'mentor', 'learning_manager', 'admin']);
  const schema = z.object({ courseId: z.string().min(1) });
  const parsed = schema.safeParse(request.data);
  if (!parsed.success) throw new HttpsError('invalid-argument', 'courseId is required.');

  await assertCourseInstructorOrManager(caller, parsed.data.courseId);
  await db.collection('courses').doc(parsed.data.courseId).update({
    status: 'pending_approval',
    updatedAt: FieldValue.serverTimestamp(),
  });
  await writeAuditLog({
    action: 'COURSE_SUBMITTED_FOR_APPROVAL',
    performedBy: caller.fullName,
    performedByRole: caller.role,
    targetEntity: 'courses',
    targetId: parsed.data.courseId,
    details: 'Course submitted for Learning Manager review.',
  });
  return { ok: true, status: 'pending_approval' };
});

export const reviewCoursePublication = onCall(async (request) => {
  const caller = await getCallerContext(request);
  assertRole(caller.role, ['learning_manager', 'admin']);
  const schema = z.object({
    courseId: z.string().min(1),
    status: z.enum(['published', 'unpublished', 'archived', 'draft']),
    approvalNotes: z.string().max(400).transform(sanitize).optional(),
  });
  const parsed = schema.safeParse(request.data);
  if (!parsed.success) throw new HttpsError('invalid-argument', 'Invalid publication decision.');

  const courseRef = db.collection('courses').doc(parsed.data.courseId);
  const courseSnap = await courseRef.get();
  if (!courseSnap.exists) throw new HttpsError('not-found', 'Course not found.');
  const courseData = courseSnap.data()!;

  await courseRef.update({
    status: parsed.data.status,
    approvedBy: caller.fullName,
    ...(parsed.data.approvalNotes ? { approvalNotes: parsed.data.approvalNotes } : {}),
    updatedAt: FieldValue.serverTimestamp(),
  });

  if (courseData.createdBy) {
    await db.collection('learningNotifications').add({
      userId: courseData.createdBy,
      courseId: parsed.data.courseId,
      title: `Course ${parsed.data.status.replace('_', ' ')}`,
      message: `Course "${courseData.title}" status updated to ${parsed.data.status}.${parsed.data.approvalNotes ? ` Notes: ${parsed.data.approvalNotes}` : ''}`,
      category: 'announcement',
      read: false,
      createdAt: FieldValue.serverTimestamp(),
    });
  }

  await writeAuditLog({
    action: `COURSE_STATUS_${parsed.data.status.toUpperCase()}`,
    performedBy: caller.fullName,
    performedByRole: caller.role,
    targetEntity: 'courses',
    targetId: parsed.data.courseId,
    details: `Course set to ${parsed.data.status}.`,
  });
  return { ok: true, status: parsed.data.status };
});

// 42. assignCourseInstructor (Explicit Mentor -> Instructor authorization supported)
export const assignCourseInstructor = onCall(async (request) => {
  const caller = await getCallerContext(request);
  assertRole(caller.role, ['learning_manager', 'admin']);
  const schema = z.object({
    courseId: z.string().min(1),
    instructorUid: z.string().min(1),
    roleType: z.enum(['lead_instructor', 'co_instructor']).default('lead_instructor'),
    authorizeMentorForInstruction: z.boolean().default(true),
  });
  const parsed = schema.safeParse(request.data);
  if (!parsed.success) throw new HttpsError('invalid-argument', 'courseId and instructorUid are required.');

  const { courseId, instructorUid, roleType, authorizeMentorForInstruction } = parsed.data;
  const [courseSnap, targetUserSnap] = await Promise.all([
    db.collection('courses').doc(courseId).get(),
    db.collection('users').doc(instructorUid).get(),
  ]);
  if (!courseSnap.exists || !targetUserSnap.exists) {
    throw new HttpsError('not-found', 'Course or target instructor account not found.');
  }
  const targetUser = targetUserSnap.data()!;
  if (targetUser.role === 'mentor' && !authorizeMentorForInstruction && !targetUser.instructorAuthorized) {
    throw new HttpsError('failed-precondition', 'Mentors require explicit instructor authorization before assignment.');
  }

  if (targetUser.role === 'mentor' && authorizeMentorForInstruction) {
    await targetUserSnap.ref.update({ instructorAuthorized: true, updatedAt: FieldValue.serverTimestamp() });
    await adminAuth
      .setCustomUserClaims(instructorUid, {
        role: targetUser.role,
        safeguardingCleared: Boolean(targetUser.safeguardingCleared),
        instructorAuthorized: true,
      })
      .catch(() => undefined);
  }

  const courseData = courseSnap.data()!;
  const existingIds = Array.isArray(courseData.instructorIds) ? (courseData.instructorIds as string[]) : [];
  const existingNames = Array.isArray(courseData.instructorNames) ? (courseData.instructorNames as string[]) : [];
  const nextIds = existingIds.includes(instructorUid) ? existingIds : [...existingIds, instructorUid];
  const nextNames = existingNames.includes(targetUser.fullName) ? existingNames : [...existingNames, targetUser.fullName];

  await db.runTransaction(async (tx) => {
    tx.set(db.collection('instructorAssignments').doc(`${courseId}_${instructorUid}`), {
      id: `${courseId}_${instructorUid}`,
      courseId,
      courseTitle: courseData.title,
      instructorUid,
      instructorName: targetUser.fullName,
      roleType,
      assignedBy: caller.uid,
      assignedByName: caller.fullName,
      status: 'active',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    tx.update(courseSnap.ref, {
      instructorIds: nextIds,
      instructorNames: nextNames,
      updatedAt: FieldValue.serverTimestamp(),
    });
  });

  await writeAuditLog({
    action: 'INSTRUCTOR_ASSIGNED_TO_COURSE',
    performedBy: caller.fullName,
    performedByRole: caller.role,
    targetEntity: 'courses',
    targetId: courseId,
    details: `Assigned ${targetUser.fullName} (${roleType}) to ${courseData.title}`,
  });

  return { ok: true };
});

// 43. applyOrEnrollCourse (Age Eligibility + Minor Guardian Consent + Capacity Enforcement)
export const applyOrEnrollCourse = onCall(async (request) => {
  const caller = await getCallerContext(request);
  const schema = z.object({ courseId: z.string().min(1) });
  const parsed = schema.safeParse(request.data);
  if (!parsed.success) throw new HttpsError('invalid-argument', 'courseId is required.');

  const { courseId } = parsed.data;
  const userSnap = await db.collection('users').doc(caller.uid).get();
  if (!userSnap.exists) throw new HttpsError('not-found', 'User account not found.');
  const userData = userSnap.data()!;

  const isMinor = userData.ageCategory === 'child_5_17' || Number(userData.calculatedAge || 18) < 18;
  if (isMinor && userData.status !== 'active') {
    throw new HttpsError('failed-precondition', 'Verified guardian consent is required before a minor can enrol in courses.');
  }

  let resultStatus: 'enrolled' | 'pending' = 'enrolled';
  await db.runTransaction(async (tx) => {
    const courseRef = db.collection('courses').doc(courseId);
    const courseSnap = await tx.get(courseRef);
    if (!courseSnap.exists) throw new HttpsError('not-found', 'Course not found.');
    const course = courseSnap.data()!;
    if (course.status !== 'published') {
      throw new HttpsError('failed-precondition', 'This course is not open for enrolment.');
    }

    if (course.ageEligibility === 'children_5_17' && !isMinor) {
      throw new HttpsError('failed-precondition', 'This course is tailored exclusively for boys aged 5–17.');
    }
    if ((course.ageEligibility === 'young_adults_18_35' || course.ageEligibility === 'adults_18_plus') && isMinor) {
      throw new HttpsError('failed-precondition', 'Age eligibility requires participants to be 18 or older.');
    }

    const capacity = Number(course.enrolmentCapacity || 100);
    const enrolled = Number(course.enrolledCount || 0);
    if (enrolled >= capacity) {
      throw new HttpsError('failed-precondition', 'Course enrolment capacity has been reached.');
    }

    const enrollRef = db.collection('courseEnrollments').doc(`${courseId}_${caller.uid}`);
    const existingEnroll = await tx.get(enrollRef);
    if (existingEnroll.exists && ['enrolled', 'approved', 'completed', 'pending'].includes(existingEnroll.data()?.status)) {
      resultStatus = existingEnroll.data()!.status;
      return;
    }

    resultStatus = course.learningFormat === 'self_paced' ? 'enrolled' : 'pending';
    tx.set(enrollRef, {
      id: `${courseId}_${caller.uid}`,
      courseId,
      courseTitle: course.title,
      userId: caller.uid,
      learnerName: userData.fullName || caller.fullName,
      learnerDistrict: userData.district || 'Kampala',
      ageCategory: userData.ageCategory || 'young_adult_18_35',
      isMinor,
      guardianConsentVerified: isMinor ? userData.status === 'active' : true,
      status: resultStatus,
      progressPercent: 0,
      completedLessonsCount: 0,
      totalLessonsCount: 0,
      learningMinutes: 0,
      enrolledAt: new Date().toISOString(),
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    if (resultStatus === 'enrolled') {
      tx.update(courseRef, { enrolledCount: FieldValue.increment(1), updatedAt: FieldValue.serverTimestamp() });
    }
  });

  await db.collection('learningNotifications').add({
    userId: caller.uid,
    courseId,
    title: resultStatus === 'enrolled' ? 'Course Enrolment Confirmed' : 'Enrolment Request Received',
    message:
      resultStatus === 'enrolled'
        ? 'You are enrolled and can start your lessons immediately.'
        : 'Your enrolment request is awaiting Learning Manager approval.',
    category: 'enrolment',
    read: false,
    createdAt: FieldValue.serverTimestamp(),
  });

  return { status: resultStatus };
});

// 44. reviewCourseEnrollment
export const reviewCourseEnrollment = onCall(async (request) => {
  const caller = await getCallerContext(request);
  assertRole(caller.role, ['learning_manager', 'admin']);
  const schema = z.object({
    enrollmentId: z.string().min(1),
    decision: z.enum(['approved', 'rejected']),
    reason: z.string().max(300).transform(sanitize).optional(),
  });
  const parsed = schema.safeParse(request.data);
  if (!parsed.success) throw new HttpsError('invalid-argument', 'Invalid enrolment review payload.');

  let courseTitle = '';
  let userId = '';
  let courseId = '';
  await db.runTransaction(async (tx) => {
    const ref = db.collection('courseEnrollments').doc(parsed.data.enrollmentId);
    const snap = await tx.get(ref);
    if (!snap.exists) throw new HttpsError('not-found', 'Enrolment not found.');
    const data = snap.data()!;
    courseTitle = data.courseTitle;
    userId = data.userId;
    courseId = data.courseId;
    const nextStatus = parsed.data.decision === 'approved' ? 'enrolled' : 'rejected';
    tx.update(ref, {
      status: nextStatus,
      ...(parsed.data.reason ? { rejectionReason: parsed.data.reason } : {}),
      updatedAt: FieldValue.serverTimestamp(),
    });
    if (parsed.data.decision === 'approved' && data.status === 'pending') {
      tx.update(db.collection('courses').doc(courseId), {
        enrolledCount: FieldValue.increment(1),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
  });

  await db.collection('learningNotifications').add({
    userId,
    courseId,
    title: parsed.data.decision === 'approved' ? 'Enrolment Approved' : 'Enrolment Update',
    message:
      parsed.data.decision === 'approved'
        ? `Your enrolment in ${courseTitle} is approved.`
        : `Your enrolment in ${courseTitle} was declined.${parsed.data.reason ? ` Reason: ${parsed.data.reason}` : ''}`,
    category: 'enrolment',
    read: false,
    createdAt: FieldValue.serverTimestamp(),
  });

  return { ok: true };
});

// 45. getAuthorizedMediaUrl
export const getAuthorizedMediaUrl = onCall(async (request) => {
  const caller = await getCallerContext(request);
  const schema = z.object({ assetId: z.string().min(1) });
  const parsed = schema.safeParse(request.data);
  if (!parsed.success) throw new HttpsError('invalid-argument', 'assetId is required.');

  const assetSnap = await db.collection('courseAssets').doc(parsed.data.assetId).get();
  if (!assetSnap.exists) throw new HttpsError('not-found', 'Asset not found.');
  const asset = assetSnap.data()!;

  if (asset.visibility !== 'course_thumbnail') {
    const isManager = caller.role === 'admin' || caller.role === 'learning_manager';
    if (!isManager) {
      const enrollSnap = await db.collection('courseEnrollments').doc(`${asset.courseId}_${caller.uid}`).get();
      const enrolled = enrollSnap.exists && ['approved', 'enrolled', 'completed'].includes(enrollSnap.data()?.status);
      if (!enrolled) {
        await assertCourseInstructorOrManager(caller, asset.courseId);
      }
    }
  }

  try {
    const file = getStorage().bucket().file(asset.storagePath);
    const [signedUrl] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 15 * 60 * 1000,
    });
    return { url: signedUrl, mimeType: asset.mimeType, storagePath: asset.storagePath };
  } catch {
    return { url: null, mimeType: asset.mimeType, storagePath: asset.storagePath };
  }
});

// 46. upsertAssessmentQuestion (Separates question prompt from backend answer key)
export const upsertAssessmentQuestion = onCall(async (request) => {
  const caller = await getCallerContext(request);
  assertRole(caller.role, ['instructor', 'mentor', 'learning_manager', 'admin']);
  const schema = z.object({
    questionId: z.string().optional(),
    assessmentId: z.string().min(1),
    courseId: z.string().min(1),
    orderIndex: z.number().int().min(1),
    questionType: z.enum(['mcq', 'true_false', 'short_answer', 'written']),
    prompt: z.string().min(4).max(1000).transform(sanitize),
    options: z.array(z.string().max(300)).max(6).optional(),
    points: z.number().int().min(1).max(100),
    correctOptionIndex: z.number().int().min(0).max(5).optional(),
    correctBoolean: z.boolean().optional(),
    expectedKeywords: z.array(z.string().max(80)).max(10).optional(),
    explanation: z.string().max(500).transform(sanitize).optional(),
  });
  const parsed = schema.safeParse(request.data);
  if (!parsed.success) throw new HttpsError('invalid-argument', 'Invalid question payload.');
  const d = parsed.data;
  await assertCourseInstructorOrManager(caller, d.courseId);

  const qRef = d.questionId ? db.collection('assessmentQuestions').doc(d.questionId) : db.collection('assessmentQuestions').doc();
  const keyRef = db.collection('assessmentAnswerKeys').doc(qRef.id);

  await db.runTransaction(async (tx) => {
    tx.set(qRef, {
      id: qRef.id,
      assessmentId: d.assessmentId,
      courseId: d.courseId,
      orderIndex: d.orderIndex,
      questionType: d.questionType,
      prompt: d.prompt,
      options: d.options || [],
      points: d.points,
      createdBy: caller.uid,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    tx.set(keyRef, {
      questionId: qRef.id,
      assessmentId: d.assessmentId,
      courseId: d.courseId,
      ...(d.correctOptionIndex !== undefined ? { correctOptionIndex: d.correctOptionIndex } : {}),
      ...(d.correctBoolean !== undefined ? { correctBoolean: d.correctBoolean } : {}),
      ...(d.expectedKeywords ? { expectedKeywords: d.expectedKeywords } : {}),
      ...(d.explanation ? { explanation: d.explanation } : {}),
      updatedAt: FieldValue.serverTimestamp(),
    });
  });

  return { questionId: qRef.id };
});

// 47. submitAssessmentAttempt (Server-side Auto-Grading)
export const submitAssessmentAttempt = onCall(async (request) => {
  const caller = await getCallerContext(request);
  const schema = z.object({
    assessmentId: z.string().min(1),
    courseId: z.string().min(1),
    answers: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])),
  });
  const parsed = schema.safeParse(request.data);
  if (!parsed.success) throw new HttpsError('invalid-argument', 'Invalid assessment submission.');

  const { assessmentId, courseId, answers } = parsed.data;
  const enrollSnap = await db.collection('courseEnrollments').doc(`${courseId}_${caller.uid}`).get();
  if (!enrollSnap.exists || !['approved', 'enrolled', 'completed'].includes(enrollSnap.data()?.status)) {
    throw new HttpsError('permission-denied', 'Enrolment in this course is required.');
  }

  const [assessmentSnap, questionsSnap, keysSnap, prevAttemptsSnap] = await Promise.all([
    db.collection('assessments').doc(assessmentId).get(),
    db.collection('assessmentQuestions').where('assessmentId', '==', assessmentId).get(),
    db.collection('assessmentAnswerKeys').where('assessmentId', '==', assessmentId).get(),
    db.collection('assessmentAttempts').where('assessmentId', '==', assessmentId).where('userId', '==', caller.uid).get(),
  ]);
  if (!assessmentSnap.exists) throw new HttpsError('not-found', 'Assessment not found.');
  const assessment = assessmentSnap.data()!;
  const maxAttempts = Number(assessment.maxAttempts || 3);
  if (prevAttemptsSnap.size >= maxAttempts) {
    throw new HttpsError('failed-precondition', `Maximum attempt limit (${maxAttempts}) reached.`);
  }

  const keyByQid = new Map(keysSnap.docs.map((d) => [d.id, d.data()]));
  let totalPoints = 0;
  let earnedPoints = 0;
  let hasManualQuestion = false;

  for (const qDoc of questionsSnap.docs) {
    const q = qDoc.data();
    const pts = Number(q.points || 1);
    totalPoints += pts;
    const key = keyByQid.get(qDoc.id);
    const ans = answers[qDoc.id];
    if (q.questionType === 'mcq' && key && Number(ans) === Number(key.correctOptionIndex)) {
      earnedPoints += pts;
    } else if (q.questionType === 'true_false' && key && Boolean(ans) === Boolean(key.correctBoolean)) {
      earnedPoints += pts;
    } else if (q.questionType === 'short_answer' && key && Array.isArray(key.expectedKeywords) && typeof ans === 'string') {
      const lower = ans.toLowerCase();
      if (key.expectedKeywords.some((kw: string) => lower.includes(String(kw).toLowerCase()))) {
        earnedPoints += pts;
      }
    } else if (q.questionType === 'written') {
      hasManualQuestion = true;
    }
  }

  const scorePercent = totalPoints === 0 ? 100 : Math.round((earnedPoints / totalPoints) * 100);
  const passMark = Number(assessment.passMarkPercent || 70);
  const passed = !hasManualQuestion && scorePercent >= passMark;

  const attemptRef = db.collection('assessmentAttempts').doc();
  await attemptRef.set({
    id: attemptRef.id,
    assessmentId,
    courseId,
    userId: caller.uid,
    learnerName: caller.fullName,
    attemptNumber: prevAttemptsSnap.size + 1,
    answers,
    scorePercent,
    earnedPoints,
    totalPoints,
    passed,
    status: hasManualQuestion ? 'submitted' : 'graded',
    submittedAt: FieldValue.serverTimestamp(),
    ...(hasManualQuestion ? {} : { gradedAt: FieldValue.serverTimestamp(), gradedBy: 'Auto-Grader' }),
  });

  if (!hasManualQuestion) {
    await recalculateCourseProgressAndIssue(courseId, caller.uid);
  }

  return { attemptId: attemptRef.id, scorePercent, earnedPoints, totalPoints, passed };
});

// 48. gradeAssignmentSubmission
export const gradeAssignmentSubmission = onCall(async (request) => {
  const caller = await getCallerContext(request);
  assertRole(caller.role, ['instructor', 'mentor', 'learning_manager', 'admin']);
  const schema = z.object({
    submissionId: z.string().min(1),
    scorePercent: z.number().min(0).max(100),
    instructorFeedback: z.string().min(2).max(1000).transform(sanitize),
    requestResubmit: z.boolean().default(false),
  });
  const parsed = schema.safeParse(request.data);
  if (!parsed.success) throw new HttpsError('invalid-argument', 'Valid grade and feedback required.');

  const subRef = db.collection('assignmentSubmissions').doc(parsed.data.submissionId);
  const subSnap = await subRef.get();
  if (!subSnap.exists) throw new HttpsError('not-found', 'Assignment submission not found.');
  const sub = subSnap.data()!;
  await assertCourseInstructorOrManager(caller, sub.courseId);

  const nextStatus = parsed.data.requestResubmit ? 'resubmit_requested' : 'graded';
  await subRef.update({
    status: nextStatus,
    scorePercent: parsed.data.scorePercent,
    instructorFeedback: parsed.data.instructorFeedback,
    gradedBy: caller.fullName,
    gradedAt: FieldValue.serverTimestamp(),
  });

  await db.collection('learningNotifications').add({
    userId: sub.userId,
    courseId: sub.courseId,
    title: nextStatus === 'graded' ? 'Assignment Graded' : 'Resubmission Requested',
    message: `Your assignment was reviewed (${parsed.data.scorePercent}%). Feedback: ${parsed.data.instructorFeedback}`,
    category: 'assessment',
    read: false,
    createdAt: FieldValue.serverTimestamp(),
  });

  if (nextStatus === 'graded') {
    await recalculateCourseProgressAndIssue(sub.courseId, sub.userId);
  }
  return { ok: true, status: nextStatus };
});

// 49. issueCourseCertificate & 50. revokeCourseCertificate
export const issueCourseCertificate = onCall(async (request) => {
  const caller = await getCallerContext(request);
  assertRole(caller.role, ['learning_manager', 'admin']);
  const schema = z.object({ courseId: z.string().min(1), userId: z.string().min(1) });
  const parsed = schema.safeParse(request.data);
  if (!parsed.success) throw new HttpsError('invalid-argument', 'courseId and userId required.');

  const [courseSnap, userSnap] = await Promise.all([
    db.collection('courses').doc(parsed.data.courseId).get(),
    db.collection('users').doc(parsed.data.userId).get(),
  ]);
  if (!courseSnap.exists || !userSnap.exists) throw new HttpsError('not-found', 'Course or learner not found.');

  const courseData = courseSnap.data()!;
  const userData = userSnap.data()!;
  const isMinor = userData.ageCategory === 'child_5_17' || Number(userData.calculatedAge || 18) < 18;
  const certificateNumber = `BCA-CERT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const qrToken = `CERTQR-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
  const completionDate = new Date().toISOString().slice(0, 10);
  const learnerDisplayName = maskDisplayNameForMinorCertificate(userData.fullName || 'BCA Learner', isMinor);
  const instructorSignatory = Array.isArray(courseData.instructorNames) && courseData.instructorNames[0]
    ? String(courseData.instructorNames[0])
    : 'BCA Lead Instructor';

  await db.runTransaction(async (tx) => {
    tx.set(db.collection('certificates').doc(`${parsed.data.courseId}_${parsed.data.userId}`), {
      id: `${parsed.data.courseId}_${parsed.data.userId}`,
      certificateNumber,
      courseId: parsed.data.courseId,
      courseTitle: courseData.title,
      userId: parsed.data.userId,
      learnerDisplayName,
      completionDate,
      instructorSignatory,
      learningManagerSignatory: caller.fullName,
      qrToken,
      status: 'issued',
      issuedAt: new Date().toISOString(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    tx.set(db.collection('certificateVerifications').doc(certificateNumber), {
      certificateNumber,
      courseTitle: courseData.title,
      learnerDisplayName,
      completionDate,
      instructorSignatory,
      status: 'issued',
      qrToken,
      updatedAt: FieldValue.serverTimestamp(),
    });
  });

  await writeAuditLog({
    action: 'LMS_CERTIFICATE_ISSUED',
    performedBy: caller.fullName,
    performedByRole: caller.role,
    targetEntity: 'certificates',
    targetId: certificateNumber,
    details: `Issued certificate ${certificateNumber} for course ${courseData.title}`,
  });

  return { certificateNumber, qrToken };
});

export const revokeCourseCertificate = onCall(async (request) => {
  const caller = await getCallerContext(request);
  assertRole(caller.role, ['learning_manager', 'admin']);
  const schema = z.object({
    certificateId: z.string().min(1),
    reason: z.string().min(5).max(300).transform(sanitize),
  });
  const parsed = schema.safeParse(request.data);
  if (!parsed.success) throw new HttpsError('invalid-argument', 'Valid certificateId and reason are required.');

  const certRef = db.collection('certificates').doc(parsed.data.certificateId);
  const certSnap = await certRef.get();
  if (!certSnap.exists) throw new HttpsError('not-found', 'Certificate not found.');
  const cert = certSnap.data()!;

  await db.runTransaction(async (tx) => {
    tx.update(certRef, {
      status: 'revoked',
      revokedReason: parsed.data.reason,
      revokedBy: caller.fullName,
      updatedAt: FieldValue.serverTimestamp(),
    });
    tx.update(db.collection('certificateVerifications').doc(cert.certificateNumber), {
      status: 'revoked',
      revokedAt: new Date().toISOString(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  });

  await writeAuditLog({
    action: 'LMS_CERTIFICATE_REVOKED',
    performedBy: caller.fullName,
    performedByRole: caller.role,
    targetEntity: 'certificates',
    targetId: cert.certificateNumber,
    details: `Revoked certificate ${cert.certificateNumber}: ${parsed.data.reason}`,
  });

  return { ok: true };
});

// 51. dispatchLiveClassReminders
export const dispatchLiveClassReminders = onCall(async (request) => {
  const caller = await getCallerContext(request);
  assertRole(caller.role, ['instructor', 'learning_manager', 'admin']);
  const schema = z.object({ sessionId: z.string().min(1), leadTime: z.enum(['24h', '1h', 'immediate']).default('1h') });
  const parsed = schema.safeParse(request.data);
  if (!parsed.success) throw new HttpsError('invalid-argument', 'sessionId required.');

  const sessionSnap = await db.collection('courseSessions').doc(parsed.data.sessionId).get();
  if (!sessionSnap.exists) throw new HttpsError('not-found', 'Session not found.');
  const session = sessionSnap.data()!;
  await assertCourseInstructorOrManager(caller, session.courseId);

  const enrollSnap = await db
    .collection('courseEnrollments')
    .where('courseId', '==', session.courseId)
    .where('status', 'in', ['enrolled', 'approved'])
    .get();

  const batch = db.batch();
  enrollSnap.docs.forEach((docSnap) => {
    const notifId = `rem_${session.id}_${parsed.data.leadTime}_${docSnap.data().userId}`;
    batch.set(db.collection('learningNotifications').doc(notifId), {
      id: notifId,
      userId: docSnap.data().userId,
      courseId: session.courseId,
      sessionId: session.id,
      title: `Live Class Reminder (${parsed.data.leadTime})`,
      message: `${session.title} starts ${session.scheduledDate} at ${session.startTimeKampala} (Kampala EAT).`,
      category: 'live_class_reminder',
      reminderLeadTime: parsed.data.leadTime,
      read: false,
      createdAt: FieldValue.serverTimestamp(),
    });
  });
  await batch.commit();

  return { notifiedCount: enrollSnap.size };
});


