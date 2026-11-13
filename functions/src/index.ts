import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import { onCall, HttpsError, CallableRequest } from 'firebase-functions/v2/https';
import { z } from 'zod';

initializeApp();

const DATABASE_ID = 'ai-studio-boychildassociat-e2cf5f8e-ec8b-4c04-89e0-7eec41b5c3d0';
const db = getFirestore(DATABASE_ID);
const adminAuth = getAuth();

type UserRole = 'boy' | 'guardian' | 'mentor' | 'partner' | 'coordinator' | 'admin';

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
    newRole: z.enum(['boy', 'guardian', 'mentor', 'partner', 'coordinator', 'admin']),
    safeguardingCleared: z.boolean().optional(),
  });
  const parsed = schema.safeParse(request.data);
  if (!parsed.success) throw new HttpsError('invalid-argument', 'Invalid role assignment.');

  const { targetUid, newRole, safeguardingCleared } = parsed.data;
  const cleared = newRole === 'admin' ? true : Boolean(safeguardingCleared);
  await db.collection('users').doc(targetUid).update({
    role: newRole,
    safeguardingCleared: cleared,
    updatedAt: FieldValue.serverTimestamp(),
  });
  await adminAuth.setCustomUserClaims(targetUid, { role: newRole, safeguardingCleared: cleared }).catch(() => undefined);

  await writeAuditLog({
    action: 'USER_ROLE_ASSIGNED',
    performedBy: caller.fullName,
    performedByRole: caller.role,
    targetEntity: 'users',
    targetId: targetUid,
    details: `Role assigned: ${newRole}, safeguardingCleared=${cleared}`,
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


