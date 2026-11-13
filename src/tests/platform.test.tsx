// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { mockStore } from '../lib/firebase/mockStore';
import {
  verifyGuardianLinkSchema,
  newsletterSchema,
  dppaRequestSchema,
  contactMessageSchema,
  mentorProgressReportSchema,
  validateImageFile,
  validateDocumentFile,
} from '../lib/validation/schemas';
import { AuthProvider } from '../hooks/useAuth';
import { AdminConsolePage } from '../features/admin/AdminConsolePage';
import { CmsEditorTab } from '../features/admin/CmsEditorTab';
import { ReportConcernPage } from '../features/public/ReportConcernPage';
import { HomePage } from '../features/home/HomePage';
import { NationalDashboardPage } from '../features/national/NationalDashboardPage';
import { VerifyMemberPage } from '../features/public/VerifyMemberPage';
import { EventsActivitiesPage } from '../features/events/EventsActivitiesPage';
import { SafeguardingCommandPage } from '../features/safeguarding/SafeguardingCommandPage';
import { ContactPage } from '../features/public/PublicPages';
import { MentorDashboardPage } from '../features/mentor/MentorDashboardPage';
import { DigitalMembershipCard } from '../components/common/DigitalMembershipCard';

function renderWithProviders(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <AuthProvider>
        <MemoryRouter>{ui}</MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

afterEach(() => {
  cleanup();
});

describe('Safeguarding, Consent & Role-Based Invariants', () => {
  it('enforces BCA-XXXXXX code validation for guardian link verification', () => {
    expect(verifyGuardianLinkSchema.safeParse({ linkId: 'l1', verificationCode: 'BCA-123456' }).success).toBe(true);
    expect(verifyGuardianLinkSchema.safeParse({ linkId: 'l1', verificationCode: '123456' }).success).toBe(false);
  });

  it('requires explicit DPPA consent for newsletter subscription', () => {
    expect(
      newsletterSchema.safeParse({ email: 'parent@kampala.ug', district: 'Kampala', consentGiven: false }).success
    ).toBe(false);
    expect(
      newsletterSchema.safeParse({ email: 'parent@kampala.ug', district: 'Kampala', consentGiven: true }).success
    ).toBe(true);
  });

  it('validates DPPA data subject export, correction, and deletion requests', () => {
    expect(dppaRequestSchema.safeParse({ type: 'correction', reason: 'Update school district spelling' }).success).toBe(true);
    expect(dppaRequestSchema.safeParse({ type: 'deletion', reason: 'hi' }).success).toBe(false);
  });

  it('prevents assigning a minor pending guardian consent into an active circle', () => {
    expect(() => {
      mockStore.assignMemberToCircle('usr_boy_pending', 'circle_kampala_central');
    }).toThrow(/Cannot assign member until account is active/);
  });

  it('requires verified link & authority evidence before granting minor consent and issuing digital membership card', () => {
    expect(() => {
      mockStore.approveGuardianConsent(
        'usr_boy_pending',
        'usr_guardian_grace',
        '2026.1',
        'child_code_confirmation',
        'bad'
      );
    }).toThrow(/Authority verification evidence/i);

    const link = mockStore.requestGuardianLink(
      'usr_guardian_grace',
      'usr_boy_pending',
      'legal_guardian',
      'coordinator_id_check',
      'Kira Subcounty Guardian National ID Check'
    );
    expect(link.status).toBe('pending_verification');

    expect(() => mockStore.verifyGuardianLink(link.id, 'BCA-000000')).toThrow(/does not match/);
    mockStore.verifyGuardianLink(link.id, link.verificationCode);

    const updatedLink = mockStore.guardianLinks.find((l) => l.id === link.id);
    expect(updatedLink?.status).toBe('verified');

    mockStore.approveGuardianConsent(
      'usr_boy_pending',
      'usr_guardian_grace',
      '2026.1',
      'coordinator_id_check',
      'Kira Subcounty Guardian National ID Check'
    );
    expect(mockStore.users.usr_boy_pending.status).toBe('active');
    expect(mockStore.users.usr_boy_pending.membershipNumber).toMatch(/^BCA-UG-\d{4}-\d{4}$/);

    mockStore.withdrawGuardianConsent('usr_boy_pending', 'usr_guardian_grace', 'Family relocating to Gulu chapter');
    expect(mockStore.users.usr_boy_pending.status).toBe('pending_guardian_consent');
    expect(mockStore.consentRecords[0].action).toBe('withdrawn');
  });

  it('isolates Events Coordinator (safeguardingCleared=false) from Safeguarding Command Centre while allowing cleared Lead', () => {
    mockStore.switchUser('usr_coordinator_events');
    renderWithProviders(<SafeguardingCommandPage />);
    expect(screen.getByText(/Safeguarding Clearance Required/i)).toBeTruthy();

    mockStore.switchUser('usr_coordinator_sarah');
    renderWithProviders(<AdminConsolePage />);
    expect(screen.getByText(/Safeguarding Cleared/i)).toBeTruthy();

    const firstCase = mockStore.safeguardingCases[0];
    const followUp = mockStore.addSafeguardingFollowUp(firstCase.id, {
      actionTaken: 'Verified school attendance and met guardian',
      outcome: 'Child safe and continuing circle attendance',
      nextReviewDate: '2026-12-01',
    });
    expect(followUp.actionTaken).toMatch(/Verified school attendance/);
    mockStore.switchUser('usr_boy_active');
  });

  it('differentiates Coordinator without safeguarding clearance when role permission changes', () => {
    mockStore.switchUser('usr_admin_kato');
    mockStore.assignUserRole('usr_coordinator_sarah', 'coordinator', false);
    expect(mockStore.users.usr_coordinator_sarah.safeguardingCleared).toBe(false);

    mockStore.switchUser('usr_coordinator_sarah');
    renderWithProviders(<AdminConsolePage />);
    expect(screen.getByText(/Operational Access Only/i)).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /Safeguarding Cases/i }));
    expect(screen.getByText(/Safeguarding Clearance Required/i)).toBeTruthy();

    // Restore coordinator clearance for demo consistency
    mockStore.assignUserRole('usr_coordinator_sarah', 'coordinator', true);
    mockStore.switchUser('usr_boy_active');
  });

  it('masks minor PII in public QR membership card verification and tracks event registration & attendance', () => {
    const minorVerify = mockStore.verifyMembershipCard('BCA-UG-2026-0101');
    expect(minorVerify).toBeTruthy();
    expect(minorVerify?.isMinor).toBe(true);
    expect(minorVerify?.fullNameMasked).toBe('Minor Member (Kampala Chapter)');
    expect(minorVerify?.fullNamePrivate).toBe('David Mukasa');

    const evt = mockStore.events[1];
    const initialCount = evt.registeredCount;
    const reg = mockStore.registerForEvent(evt.id, {
      userId: 'usr_young_adult',
      attendeeName: 'Samuel Kiggundu',
      attendeeEmail: 'samuel.kiggundu@boychild.demo',
      attendeeRole: 'boy',
      district: 'Kampala',
    });
    expect(evt.registeredCount).toBe(initialCount + 1);
    expect(reg.confirmationCode).toMatch(/^BCA-EVT-\d{4}$/);

    expect(() => {
      mockStore.registerForEvent(evt.id, {
        userId: 'usr_young_adult',
        attendeeName: 'Samuel Kiggundu',
        attendeeEmail: 'samuel.kiggundu@boychild.demo',
        attendeeRole: 'boy',
        district: 'Kampala',
      });
    }).toThrow(/Already registered/);

    mockStore.recordEventAttendance(reg.id, 'present');
    expect(mockStore.eventRegistrations.find((r) => r.id === reg.id)?.attendanceStatus).toBe('present');
  });
});

describe('Critical Public & Organizational UI Flows', () => {
  it('renders HomePage hero, Uganda Child Protection messaging, and WhatsApp group CTA', () => {
    renderWithProviders(<HomePage />);
    expect(screen.getByText(/Every boy deserves a circle that has his back/i)).toBeTruthy();
    expect(screen.getAllByText(/0732320190/).length).toBeGreaterThan(0);
  });

  it('renders ReportConcernPage with Sauti 116 and Police CFPU emergency details', () => {
    renderWithProviders(<ReportConcernPage />);
    expect(screen.getByText(/Report a Child Safety Concern/i)).toBeTruthy();
    expect(screen.getByText(/0800 199 699/)).toBeTruthy();
    expect(screen.getByLabelText(/Submit Anonymously/i)).toBeTruthy();
  });

  it('renders NationalDashboardPage with Uganda district reach and privacy notice', () => {
    renderWithProviders(<NationalDashboardPage />);
    expect(screen.getByText(/Uganda National Membership, Circles & Impact Dashboard/i)).toBeTruthy();
    expect(screen.getByText(/Child Privacy & Legal Review Notice/i)).toBeTruthy();
  });

  it('renders VerifyMemberPage and DigitalMembershipCard with QR code SVG for active members', () => {
    mockStore.switchUser('usr_boy_active');
    renderWithProviders(<DigitalMembershipCard user={mockStore.users.usr_boy_active} />);
    expect(screen.getAllByText('BCA-UG-2026-0101').length).toBeGreaterThan(0);
    expect(screen.getByRole('img', { name: /QR verification code for BCA-UG-2026-0101/i })).toBeTruthy();

    renderWithProviders(<VerifyMemberPage />);
    expect(screen.getByText(/Digital Membership & QR Verification/i)).toBeTruthy();
  });

  it('renders EventsActivitiesPage with district filter and capacity indicators', () => {
    renderWithProviders(<EventsActivitiesPage />);
    expect(screen.getByText(/National & District Calendar/i)).toBeTruthy();
    expect(screen.getAllByText(/places/i).length).toBeGreaterThan(0);
  });

  it('validates contact inquiry messages, mentor progress reports, and storage file guards', () => {
    expect(
      contactMessageSchema.safeParse({
        fullName: 'Robert Ssemakula',
        email: 'robert@school.ug',
        phone: '0772112233',
        subject: 'School Vanguard Partnership',
        message: 'We would like to start a supervised Vanguard Club for 45 boys in Jinja.',
      }).success
    ).toBe(true);
    expect(
      contactMessageSchema.safeParse({
        fullName: 'Robert',
        email: 'bad-email',
        phone: '123',
        subject: 'Hi',
        message: 'Short',
      }).success
    ).toBe(false);

    expect(
      mentorProgressReportSchema.safeParse({
        circleId: 'circle_kampala_central',
        reportingPeriod: 'November 2026 — Week 3',
        attendanceSummary: '10 of 12 active boys attended Saturday session.',
        keyMilestones: 'Boys completed peer accountability and time management workshop.',
        safeguardingObservations: 'Zero incidents; Two-Adult rule maintained throughout.',
      }).success
    ).toBe(true);

    expect(validateImageFile({ type: 'image/jpeg', size: 1024 * 500 }).valid).toBe(true);
    expect(validateImageFile({ type: 'application/pdf', size: 1024 }).valid).toBe(false);
    expect(validateImageFile({ type: 'image/png', size: 6 * 1024 * 1024 }).valid).toBe(false);

    expect(validateDocumentFile({ type: 'application/pdf', size: 2 * 1024 * 1024 }).valid).toBe(true);
    expect(validateDocumentFile({ type: 'application/x-msdownload', size: 1024 }).valid).toBe(false);
    expect(validateDocumentFile({ type: 'application/pdf', size: 12 * 1024 * 1024 }).valid).toBe(false);
  });

  it('supports Contact inbox lifecycle, Mentor progress reports, DPPA SAR triage, and concern-to-case promotion', () => {
    const msg = mockStore.addContactMessage({
      fullName: 'Sarah Namukasa',
      email: 'sarah@parish.ug',
      phone: '+256772334455',
      subject: 'Mukono Circle Orientation',
      message: 'Requesting coordinator visit for our parish youth mentorship orientation.',
    });
    expect(msg.status).toBe('new');
    mockStore.updateContactMessageStatus(msg.id, 'resolved', 'Admin Kato');
    expect(mockStore.contactMessages.find((m) => m.id === msg.id)?.status).toBe('resolved');

    const report = mockStore.addProgressReport({
      circleId: 'circle_kampala_central',
      circleName: 'Kampala Central Champions Circle',
      mentorId: 'usr_mentor_okello',
      mentorName: 'Emmanuel Okello',
      reportingPeriod: 'November 2026 — Week 4',
      attendanceSummary: '11 of 12 boys present.',
      keyMilestones: 'Completed solar wiring practical safely.',
      safeguardingObservations: 'Two-Adult supervision verified.',
    });
    expect(mockStore.progressReports.some((r) => r.id === report.id)).toBe(true);

    mockStore.switchUser('usr_admin_kato');
    const sar = mockStore.addDppaRequest('usr_boy_active', 'correction', 'Update district to Wakiso');
    expect(sar.status).toBe('pending');
    mockStore.reviewDppaRequest(sar.id, 'held_for_safeguarding', 'Retained under Children Act');
    expect(mockStore.dppaRequests.find((r) => r.id === sar.id)?.status).toBe('held_for_safeguarding');

    mockStore.concernReports.unshift({
      id: 'rep_unpromoted_test',
      refNumber: 'BCA-SG-2026-9901',
      reporterName: 'Anonymous Community Member',
      isAnonymous: true,
      district: 'Kampala',
      concernCategory: 'Child Safety / Neglect',
      urgency: 'high',
      details: 'Child reported unsafe working conditions near Old Kampala bus stage.',
      status: 'new',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    const promoted = mockStore.promoteConcernToCase('rep_unpromoted_test');
    expect(promoted.reportId).toBe('rep_unpromoted_test');
    expect(mockStore.concernReports.find((r) => r.id === 'rep_unpromoted_test')?.status).toBe('investigating');
    mockStore.switchUser('usr_boy_active');
  });

  it('renders ContactPage, MentorDashboardPage Progress Reports tab, and CmsEditorTab', () => {
    renderWithProviders(<ContactPage />);
    expect(screen.getByText(/Send a General Inquiry/i)).toBeTruthy();

    mockStore.switchUser('usr_mentor_okello');
    renderWithProviders(<MentorDashboardPage />);
    fireEvent.click(screen.getByRole('button', { name: /Progress Reports/i }));
    expect(screen.getByText(/Submit Circle Progress Report/i)).toBeTruthy();

    mockStore.switchUser('usr_admin_kato');
    renderWithProviders(<CmsEditorTab />);
    expect(screen.getByText(/Admin CMS: Homepage Sections/i)).toBeTruthy();
    expect(screen.getByText(/Publish Starter Data to Firestore/i)).toBeTruthy();
    mockStore.switchUser('usr_boy_active');
  });
});


