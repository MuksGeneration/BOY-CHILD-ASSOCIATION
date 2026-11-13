# Boy Child Association Uganda — Security & Safeguarding Specification

## 1. Role & Permission Matrix

| Capability | Boy (5–17) Pending Consent | Boy (5–17) / Young Man (18–35) Active | Guardian | Mentor (Vetted) | Partner | Coordinator (Standard) | Coordinator (Safeguarding Cleared) | Admin |
| --- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| View Published Public CMS Content | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Edit Own Non-Privileged Profile | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Change Own Role or Account Status | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Join Circle / Post Supervised Question | ❌ | ✅ | ❌ | ✅ | ❌ | ✅ | ✅ | ✅ |
| 1-on-1 Direct Message to Minors | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| View Linked Child Profile & Attendance | N/A | N/A | Verified Only | Assigned Circles Only | ❌ | ✅ | ✅ | ✅ |
| Grant / Withdraw Minor Consent | ❌ | ❌ | Verified Only | ❌ | ❌ | Audit | Audit | ✅ |
| Verify Mentor Referees & Approve Mentors | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Manage Circles & Record Attendance | ❌ | ❌ | ❌ | Assigned Circles Only | ❌ | ✅ | ✅ | ✅ |
| Submit Partner Proposals & Vanguard Clubs | ❌ | ❌ | ❌ | ❌ | Approved Scope | ✅ | ✅ | ✅ |
| Submit Confidential Concern Report | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| View / Triage `safeguardingCases` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ (Unless Assigned) | ✅ | ✅ |
| Publish / Archive CMS Content | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Assign Roles / Suspend / SAR Export | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

## 2. Structural Data Invariants (Enforced in Firestore Rules & Cloud Functions)

1. **Zero Self-Privilege Escalation**: Creating a `users/{uid}` document from client is locked to `role in ['boy', 'guardian']` and `safeguardingCleared == false`. Updating `users/{uid}` by owner rejects mutations to `role`, `status`, `safeguardingCleared`, or `assignedCaseIds`.
2. **Under-18 Guardian Consent Lock**: Any member with `calculatedAge < 18` starts as `status == 'pending_guardian_consent'`. Rules block writes to `questions` and `circleMemberships` unless `status == 'active'`.
3. **Guardian Consent Withdrawal**: Withdrawing consent writes an immutable `consentRecords` entry (`action: 'withdrawn'`) and transitions the child's `users/{uid}.status` back to `'pending_guardian_consent'`.
4. **Verified Guardian Linking Only**: Guardians cannot attach arbitrary `boyId` profiles directly; `guardianLinks` start in `'pending_verification'` with a verification code or coordinator review before `'verified'` grants read access to child attendance/profile.
5. **Coordinator vs Safeguarding Separation**: Standard coordinators manage applications, mentors, circles, events, and attendance, but CANNOT read or list `safeguardingCases` unless `safeguardingCleared == true` or explicitly listed in `assignedCaseIds`.
6. **Immutable Audit Trail & Consents**: `auditLogs` and `consentRecords` forbid `update` and `delete` from all clients (`allow update, delete: if false;`).
7. **Collection-Query Safe `list` Rules**: All `allow list` rules rely on `resource.data` field checks (plus auth/role claims), never calling `get()` or `exists()` per scanned document, preventing rule-engine DoS or failure on list queries.

## 3. Adversarial "Dirty Dozen" Verification Cases

1. **Self-Admin Promotion**: Boy attempts `update(/users/{uid}, { role: 'admin' })` -> **DENIED**.
2. **Boy Self-Activation**: Minor under 18 in `pending_guardian_consent` attempts `update(/users/{uid}, { status: 'active' })` -> **DENIED**.
3. **Spoofed Guardian Link**: Random signed-in user attempts `create(/guardianLinks/fake, { status: 'verified', guardianId: auth.uid, boyId: victimUid })` -> **DENIED**.
4. **Unassigned Mentor Roster Snooping**: Mentor A tries to `get(/memberProfiles/boyInCircleB)` -> **DENIED**.
5. **Unauthorized Safeguarding Read**: Standard mentor, partner, or non-cleared coordinator tries to `get(/safeguardingCases/case1)` or `list(/concernReports)` -> **DENIED**.
6. **Unpublished CMS Leakage**: Unauthenticated visitor tries to `get(/programmes/draftProg)` or `list(/announcements)` without `status == 'published'` -> **DENIED**.
7. **Minor Directory Enumeration**: Member or mentor tries to `list(/memberProfiles)` across all boys -> **DENIED**.
8. **Suspended User Write**: Suspended user tries to post a `questions` doc or create `goals` -> **DENIED**.
9. **Audit Log Tampering**: Even an admin tries to `update` or `delete` `/auditLogs/{id}` -> **DENIED**.
10. **Consent Record Deletion**: Any user tries to `delete(/consentRecords/{id})` -> **DENIED**.
11. **Oversized or HTML-Injected Concern Report**: Unauthenticated attacker sends 10,000 chars or `<script>` in `concernReports` -> **DENIED** (client Zod + rules size bounds + Cloud Function sanitization).
12. **Public Child Avatar Access**: Unauthenticated user tries to read `storage:/avatars/{minorUid}/photo.jpg` -> **DENIED**.
