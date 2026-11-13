# Boy Child Association (BCA) Uganda — Community & Safeguarding Platform

**Website:** https://boy-child-association.ai.studio/  
**Motto:** Standing Up As A Man  
**Mission:** Support, unite, guide, and empower the boy child across Uganda (ages 5–35) through supervised community mentorship circles, life skills, vocational crafts, and rigorous child safeguarding.  
**Community WhatsApp:** `0732320190` (`+256732320190`) · **Uganda Child Helpline:** Toll-free `116` · **Police CFPU:** `0800 199 699`

---

## Architecture & Tech Stack
- **Frontend**: React 18+ TypeScript (strict mode), Vite, Tailwind CSS v4, React Router v6 (lazy-loaded routes)
- **Forms & Validation**: React Hook Form + Zod (`@hookform/resolvers/zod`), `DOMPurify`
- **State & Caching**: TanStack Query + React Context + privacy-hardened Workbox PWA (`vite-plugin-pwa`)
- **Backend & Security**: Firebase Authentication (Email/Password, Google, Phone OTP), Cloud Firestore (`ai-studio-boychildassociat-e2cf5f8e-ec8b-4c04-89e0-7eec41b5c3d0`), Cloud Storage, App Check (reCAPTCHA Enterprise), Cloud Functions (`functions/src/index.ts`)
- **Testing & Quality**: Vitest, React Testing Library, `@firebase/eslint-plugin-security-rules`

---

## Firestore Data Schema (`firebase-blueprint.json`)
21+ collections designed with `createdAt`, `updatedAt`, and `createdBy` fields:
`users`, `memberProfiles`, `guardianLinks`, `consentRecords`, `membershipApplications`, `mentorApplications`, `mentorReferees`, `partners`, `partnerApplications`, `mentorshipCircles`, `circleMemberships`, `sessions`, `attendance`, `goals`, `questions`, `learningResources`, `announcements`, `events`, `notifications`, `concernReports`, `safeguardingCases`, `auditLogs`, `systemSettings`, plus `newsletterSubscribers` and `dppaRequests`.

---

## Role & Permission Matrix (`security_spec.md`)

| Role | Age / Verification | Key Access & Boundaries |
| --- | --- | --- |
| `boy` (Child 5–17) | Guardian consent locked until verified | Member Hub (`/hub`), Goals, Circle Q&A, Calendar & Attendance, Profile, DPPA export, Report Concern. Cannot access circles before consent or view directories. |
| `boy` (Young Adult 18–35) | Self-consent | Full Member Hub, vocational programmes, peer leadership track, Report Concern. |
| `guardian` | Adult | Guardian Portal (`/guardian`), verified `BCA-XXXXXX` child linking, grant/withdraw consent, attendance history, notifications, DPPA requests. |
| `mentor` | Two verified referees + clearance | Mentor Portal (`/mentor`), assigned circles ONLY, attendance register, session planner, supervised Q&A (no 1:1 minor DM or minor phone/email PII). |
| `partner` | Verified institution | Partner Portal (`/partner`), School Vanguard Club charter, event collaboration proposals, published events. |
| `coordinator` | Staff role | Coordinator Console (`/coordinator`), membership/mentor/partner vetting, circle matching, analytics. **Safeguarding cases require explicit `safeguardingCleared` claim.** |
| `admin` | Elevated governance (`mukuladavid6@gmail.com`) | Full Admin Console (`/admin`), RBAC role & clearance assignment, account suspension, Safeguarding Cases, Admin CMS, Audit Log exports (CSV/JSON). |

---

## Environment Variables (`.env.example`)
Copy `.env.example` to `.env.local` and supply project values:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID` (`boy-child-association-9a36f`)
- `VITE_FIREBASE_DATABASE_ID` (`ai-studio-boychildassociat-e2cf5f8e-ec8b-4c04-89e0-7eec41b5c3d0`)
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_MEASUREMENT_ID`
- `VITE_FIREBASE_RECAPTCHA_SITE_KEY`
- `VITE_USE_DEMO_STORE` (`"true"` enables offline sandbox persona testing)

---

## Firebase Deployment & Verification Commands

```bash
# 1. Install frontend & Cloud Functions dependencies
npm install
cd functions && npm install && cd ..

# 2. Validate Firestore Security Rules & run TypeScript / Test checks
npx eslint --config eslint.rules.config.mjs firestore.rules
npx vitest run
npm run lint
npm run build

# 3. Deploy Cloud Functions, Firestore Rules, and Storage Rules (Firebase Blaze plan required for Functions)
firebase use boy-child-association-9a36f
firebase deploy --only firestore:rules,storage
cd functions && npm run build && cd ..
firebase deploy --only functions
```

---

## Completed Deliverables Summary
1. React 18 + TypeScript strict (`"strict": true`) + Vite + Tailwind CSS v4 frontend with all public and protected routes.
2. Complete 21-collection Firestore blueprint (`firebase-blueprint.json`) and strict TypeScript types (`src/types/index.ts`).
3. Production `firestore.rules` audited cleanly by `@firebase/eslint-plugin-security-rules` (0 errors, 0 warnings) and deployed.
4. Hardened `storage.rules` protecting minor avatars, verification uploads, and safeguarding evidence.
5. 23 trusted Cloud Functions in `functions/src/index.ts` enforcing transactions, custom claims (`role`, `safeguardingCleared`), rate limits, and audit logging.
6. Comprehensive Role & Permission Matrix (`security_spec.md`).
7. Firebase Authentication with email verification/resend, password reset, Google Sign-In, Uganda Phone OTP integration, and suspension blocking.
8. Six functional role dashboards: Member Hub (5–17 vs 18–35), Guardian Portal, Mentor Portal, Partner Portal, Coordinator Console, Admin Console.
9. Admin CMS Editor (`CmsEditorTab.tsx`) supporting Draft / Preview / Published / Archived workflows for programmes, events, announcements, resources, stats, and FAQs.
10. Child Safeguarding & Case Management queue (`safeguardingCases`), access audit logging, zero 1:1 minor DMs, Sauti 116 & Police CFPU escalation guidance.
11. Uganda DPPA 2019 & Children Act Cap 59 architecture documentation (`docs/PRIVACY_AND_SECURITY.md`), personal JSON export, correction/deletion requests, and explicit newsletter opt-in.
12. Updated `.env.example`.
13. Deployment guide in `README.md`.
14. Vitest + React Testing Library tests (`src/tests/validation.test.ts` & `src/tests/platform.test.tsx`).

## Remaining Limitations & Manual Configuration Requirements
- **Firebase Cloud Functions Deployment**: `functions/src/index.ts` requires running `firebase deploy --only functions` on a project upgraded to the Firebase **Blaze** plan. Until deployed, `tryCallable()` gracefully falls back to verified local/Firestore client handlers in preview mode.
- **Phone Auth & App Check Activation**: Enabling SMS OTP sign-in and enforcing reCAPTCHA Enterprise App Check requires registering authorized domains and the reCAPTCHA site key in the Firebase Console (`Authentication -> Sign-in method` and `App Check`).
- **Legal Compliance Audits**: Software controls facilitate DPPA 2019 and Children Act Cap 59 workflows, but full compliance requires organizational registration with Uganda PDPO and human verification of background checks.
