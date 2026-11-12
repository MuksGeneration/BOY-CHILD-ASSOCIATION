# Boy Child Association (BCA) Uganda

> **Mission:** Support, unite, guide, and empower the boy child across Uganda through community mentorship circles, life skills, and rigorous safeguarding.

---

## 1. Tech Stack Overview

- **Frontend:** React 18, TypeScript (strict mode), Vite, Tailwind CSS v4
- **State & Data:** TanStack Query, React Context
- **Routing:** React Router v6 with lazy-loaded dynamic routes
- **Forms & Validation:** React Hook Form + Zod (`@hookform/resolvers/zod`)
- **Backend & Persistence:** Firebase (Authentication, Cloud Firestore, Cloud Storage, App Check with reCAPTCHA Enterprise)
- **Offline & Mobile Support:** PWA via `vite-plugin-pwa` with precached assets, Web App Manifest, and Service Worker
- **Testing:** Vitest for schema validation, age guards, Ugandan phone normalization, and safeguarding scanners

---

## 2. Brand Identity & Design Tokens

- **Navy (`#1B365D`):** Dark surfaces, deep brand identity, page headers
- **Primary Blue (`#005A9C`):** Buttons, interactive links, primary brand accent
- **Sky (`#60C1E5`):** High-intent accents, contrast markers on navy surfaces
- **Light Cyan (`#A0E0EF`):** Subtle section highlights, divider accents
- **Safeguarding Red (`#DC2626`):** Reserved *strictly* for the confidential **Report a Concern** action
- **Typography:**
  - Headings: `Bricolage Grotesque`
  - Body Prose: `DM Sans`
- **Accessibility:** WCAG AA contrast (≥ 4.5:1), visible focus states, 44px minimum touch targets, and `prefers-reduced-motion` compliance.

---

## 3. Roles & Safeguarding Access Control

| Role | Description | Permissions & Safeguards |
| :--- | :--- | :--- |
| **`boy` (Member)** | Boys and young men (Ages 5–35) | If age < 18, account enters `pending_guardian_consent`. Cannot join circles or message mentors until parental consent is verified. |
| **`guardian`** | Parents and legal guardians | Reviews linked children, signs digital consent, tracks circle attendance and safety records. |
| **`mentor`** | Screened male volunteer role models | Cannot message minors privately (1-on-1). Reads only circle members in assigned groups. Requires 2 verified referees. |
| **`partner`** | Schools, churches, NGOs | Proposes community cohort partnerships and school Vanguard clubs. |
| **`coordinator`** | Child protection & community lead | Reviews join requests, triages confidential safeguarding reports, matches boys to circles. |
| **`admin`** | Executive administration | System configuration, elevated role management, and immutable audit logs. |

---

## 4. Environment Variables (`.env`)

Configure the following variables in your environment or `.env` file:

```bash
# Firebase Client SDK
VITE_FIREBASE_API_KEY="your-api-key"
VITE_FIREBASE_AUTH_DOMAIN="your-app.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="your-project-id"
VITE_FIREBASE_STORAGE_BUCKET="your-app.appspot.com"
VITE_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
VITE_FIREBASE_APP_ID="your-app-id"
VITE_FIREBASE_MEASUREMENT_ID="G-XXXXXXXXXX"

# reCAPTCHA Enterprise / App Check (Optional in dev)
VITE_FIREBASE_RECAPTCHA_SITE_KEY="your-recaptcha-key"

# Offline Demo Mode
# When Firebase keys are not provided, the platform automatically activates
# the interactive Uganda local demo store with pre-seeded safeguarding records.
VITE_USE_DEMO_STORE="true"
```

---

## 5. Security Checklist & Child Safeguarding Rules

- [x] **Default Deny:** Firestore and Storage rules default to `allow read, write: if false;`.
- [x] **Role Self-Promotion Blocked:** Rules prevent any user from updating their own `role` or `status` attribute.
- [x] **Minor Consent Gate:** Accounts with `pending_guardian_consent` are locked out of circle chat and member listings.
- [x] **Confidential Reports:** `concernReports` can be submitted anonymously by anyone, but are readable **only** by `coordinator` and `admin` roles.
- [x] **Anti-Grooming Scanners:** Real-time client and rule checks prevent sharing phone numbers, emails, or social media handles in youth message threads.
- [x] **Storage Quotas:** File uploads strictly limited to images/PDFs under 5 MB. Photos of minors are never public.
- [x] **Uganda Law Compliance:** Aligned with the Uganda Children Act (Cap 59) and the Data Protection and Privacy Act, 2019.

---

## 6. Firebase Deployment Steps

```bash
# 1. Install Firebase CLI (if not installed)
npm install -g firebase-tools

# 2. Log in and select project
firebase login
firebase use your-firebase-project-id

# 3. Deploy Firestore Security Rules & Indexes
firebase deploy --only firestore:rules,firestore:indexes

# 4. Deploy Storage Rules
firebase deploy --only storage:rules

# 5. Build and Deploy Web App
npm run build
firebase deploy --only hosting
```

---

## 7. Testing & Verification

Run the comprehensive unit test suite covering Ugandan phone normalization, age 17 vs 18 guardian consent, password complexity, and safeguarding scanners:

```bash
npx vitest run
```
