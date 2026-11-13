# Privacy, Safeguarding & Security Architecture
**Boy Child Association (BCA) Uganda**

This document outlines the technical security, child safeguarding, and data protection controls built into the Boy Child Association Uganda web platform.

> **Important Scope Notice**: Technical architecture supports compliance with Uganda’s **Data Protection and Privacy Act, 2019 (DPPA)** and **Children Act (Cap 59)** principles, but organizational legal registration with PDPO Uganda, human safeguarding officer vetting, and ongoing operational audits remain mandatory organizational responsibilities.

---

## 1. Uganda Children Act (Cap 59) Safeguarding Controls

1. **Age Cohort Segregation (`child_5_17` vs `young_adult_18_35`)**
   - Youth aged **5–17 years** are registered into `pending_guardian_consent` and cannot be assigned to circles or participate in protected hub activities until a verified guardian submits formal consent.
   - Young adults aged **18–35 years** self-consent under standard membership review.

2. **Verified Guardian-Child Linking (`guardianLinks`)**
   - A parent or guardian cannot arbitrarily attach themselves to a minor's profile.
   - Linking creates a `pending_verification` record containing a one-time `BCA-XXXXXX` code, which must be verified before guardian consent can be recorded.

3. **Versioned & Immutable Consent Ledger (`consentRecords`)**
   - Both `granted` and `withdrawn` consent events are recorded as append-only documents in `consentRecords` (`allow update, delete: if false`).
   - Guardians can withdraw consent at any time via the Guardian Portal, automatically returning the minor's status to `pending_guardian_consent`.

4. **Strict Zero 1:1 Minor Messaging Boundary**
   - No private peer-to-peer chat collection exists between adults/mentors and minors.
   - Supervised Circle Q&A runs real-time regex screening (`detectSafeguardingBreachInText`) in both client Zod validation and trusted Cloud Functions (`functions/src/index.ts`) to block Ugandan phone numbers (`07XX`, `+256`), emails, and social handles.

5. **Confidential Safeguarding Case Separation (`safeguardingCases`)**
   - Concern reports (`concernReports`) are write-capable for intake (signed or anonymous) and never readable by boys, guardians, mentors, or partners.
   - Full case triage (`safeguardingCases`) is gated in Firestore Security Rules via `isSafeguardingCleared() || isAdmin()` rather than granted indiscriminately to all district coordinators.
   - Viewing a safeguarding case triggers `logSafeguardingAccess`, appending an immutable event in `auditLogs`.
   - Immediate-harm alerts display **Sauti National Child Helpline (116)** and **Uganda Police Child & Family Protection Unit (0800 199 699)** emergency contacts.

6. **Two-Referee Mentor Vetting**
   - Mentor applications capture two independent referees stored in `mentorReferees`. Both client UI and Cloud Function `approveMentorApplication` require both referees to reach `verified` before approval.

---

## 2. Uganda DPPA 2019 Technical Controls

1. **Data Minimization & Zero Public Minor Directories**
   - Unauthenticated visitors and general members cannot list `users`, `memberProfiles`, `guardianLinks`, or `attendance`.
   - Child avatars in `storage.rules` (`avatars/{userId}`) require authentication (`request.auth.uid == userId || isCoordinatorOrAdmin()`), preventing public scraping of minor photos.

2. **Digital Membership Card & QR Privacy Masking (`membershipVerifications`)**
   - Every active approved member receives an official `BCA-UG-YYYY-XXXX` membership number and scannable QR verification URL (`/verify/:cardNumber`).
   - Public QR scans perform a single-document `get` lookup on `membershipVerifications` (list/directory queries denied to non-coordinators) and mask minor full names (`fullNameMasked`: `"Minor Member (<District> Chapter)"`), exposing full private names only to the card owner, linked guardians, coordinators, and administrators.

3. **Verified Guardian Relationship & Authority Evidence**
   - Guardian linkage and formal consent submission require both an active verified `guardianLinks` document and explicit `verificationMethod` + `authorityEvidence` metadata (e.g., `child_code_confirmation`, `coordinator_id_check`, `guardian_sms_otp`, or `school_patron_attestation`). Clicking a bare UI checkbox alone does not establish authority over a child.

4. **Independent Safeguarding Command Centre (`safeguardingCases`)**
   - Standard event/circle coordinators (`safeguardingCleared: false`) are technically isolated from confidential safeguarding incident records by both Firestore Security Rules and UI guards.
   - Only Administrators and explicitly cleared Safeguarding Leads (`safeguardingCleared: true`) can triage cases, assign leads, log chronological follow-ups, escalate to Sauti 116 / Uganda Police CFPU (`0800 199 699`), and inspect per-case audit trails.

5. **Zero Sensitive Persistence in Browser Storage or PWA Cache**
   - Sensitive entities (`concernReports`, `users`, `goals`, `questions`) are excluded from `localStorage`.
   - `vite.config.ts` Workbox Service Worker explicitly forces `NetworkOnly` for `firestore.googleapis.com`, `identitytoolkit.googleapis.com`, `securetoken.googleapis.com`, `firebasestorage.googleapis.com`, and `*.cloudfunctions.net`.

6. **Data Subject Rights (Export, Correction, Deletion)**
   - **Right of Access / Portability**: Members and guardians can export a JSON copy of their profile, goals, attendance, and consent records (`exportUserData` / `exportMyData`).
   - **Right of Correction & Deletion**: Requests are logged to `dppaRequests` / `auditLogs`; safeguarding case retention holds (25 years statutory hold) supersede routine deletion where child protection records must be preserved.

7. **Newsletter Explicit Consent**
   - Public newsletter sign-up requires an explicit unchecked-by-default DPPA opt-in checkbox (`consentGiven: true`).

---

## 3. Infrastructure Security Model & Pre-Launch Legal Review
- **Claims-First RBAC**: Firebase Authentication custom claims (`role`, `safeguardingCleared`, `suspended`) carry authoritative access control. Firestore Security Rules and Cloud Functions enforce permissions server-side; Admin SDK operations in Cloud Functions bypass Security Rules and therefore verify caller claims explicitly inside each handler.
- **Database Security**: `firestore.rules` validated with `@firebase/eslint-plugin-security-rules` (0 errors, 0 warnings) denying privilege escalation (`role`, `safeguardingCleared`, `membershipNumber`, `status` self-mutation).
- **Pre-Launch Review**: All child-protection and Uganda DPPA 2019 / Children Act (Cap 59) workflows implemented here must be reviewed by a qualified Ugandan legal or child-protection professional prior to live national launch.
