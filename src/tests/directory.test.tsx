// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../hooks/useAuth';
import { mockStore } from '../lib/firebase/mockStore';
import { firebaseService } from '../lib/firebase/firebase';
import { MemberDirectory } from '../components/directory/MemberDirectory';
import { MemberDirectoryPage } from '../features/directory/MemberDirectoryPage';
import { MentorDashboardPage } from '../features/mentor/MentorDashboardPage';
import { AdminConsolePage } from '../features/admin/AdminConsolePage';

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
  mockStore.switchUser('usr_boy_active');
});

describe('Secure Member Directory — Authorization, Circle Scoping & PII Isolation', () => {
  it('blocks unauthorized roles from receiving directory entries or viewing profiles', () => {
    const unauthorized: Array<[string, 'boy' | 'guardian' | 'partner' | 'instructor' | 'learning_manager']> = [
      ['usr_boy_active', 'boy'],
      ['usr_guardian_grace', 'guardian'],
      ['usr_partner_school', 'partner'],
      ['usr_instructor_musoke', 'instructor'],
      ['usr_learning_manager_namono', 'learning_manager'],
    ];

    for (const [uid, role] of unauthorized) {
      expect(firebaseService.getMemberDirectoryEntries(uid, role)).toEqual([]);
      mockStore.switchUser(uid);
      renderWithProviders(<MemberDirectory />);
      expect(screen.getByText(/Member Directory Restricted/i)).toBeTruthy();
      cleanup();
    }
  });

  it('strictly scopes mentors to members in their assigned mentorship circles and excludes unassigned/other-circle youth', () => {
    const mentorEntries = firebaseService.getMemberDirectoryEntries('usr_mentor_okello', 'mentor');
    const visibleNames = mentorEntries.map((m) => m.fullName);

    expect(visibleNames).toContain('David Mukasa');
    expect(visibleNames).toContain('Samuel Kiggundu');
    // Unassigned minor awaiting consent and Wakiso Builders member must NOT appear for Kampala Central mentor
    expect(visibleNames).not.toContain('John Baptist Ssemwogerere');
    expect(visibleNames).not.toContain('Brian Ssemogerere');

    mockStore.switchUser('usr_mentor_okello');
    renderWithProviders(<MemberDirectory />);
    expect(screen.getByText(/Assigned Circles Scope Only/i)).toBeTruthy();
    expect(screen.getAllByText('David Mukasa').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Samuel Kiggundu').length).toBeGreaterThan(0);
    expect(screen.queryByText('Brian Ssemogerere')).toBeNull();
    expect(screen.queryByText('John Baptist Ssemwogerere')).toBeNull();
  });

  it('includes co-mentors listed in coMentorIds while still excluding unassigned circles', () => {
    const kampalaCircle = mockStore.circles.find((c) => c.id === 'circle_kampala_central');
    expect(kampalaCircle).toBeTruthy();
    const origCoMentors = [...(kampalaCircle?.coMentorIds || [])];
    if (kampalaCircle) {
      kampalaCircle.coMentorIds = [...origCoMentors, 'usr_mentor_co_test'];
    }

    const entries = firebaseService.getMemberDirectoryEntries('usr_mentor_co_test', 'mentor');
    expect(entries.map((e) => e.fullName)).toContain('David Mukasa');
    expect(entries.map((e) => e.fullName)).not.toContain('Brian Ssemogerere');

    if (kampalaCircle) {
      kampalaCircle.coMentorIds = origCoMentors;
    }
  });

  it('allows coordinators (even without safeguarding clearance) and admins to view operational profiles across circles without exposing contact PII', () => {
    const coordEntries = firebaseService.getMemberDirectoryEntries('usr_coordinator_events', 'coordinator');
    const names = coordEntries.map((e) => e.fullName);

    expect(names).toContain('David Mukasa');
    expect(names).toContain('Samuel Kiggundu');
    expect(names).toContain('Brian Ssemogerere');
    expect(names).toContain('John Baptist Ssemwogerere');

    mockStore.switchUser('usr_coordinator_events');
    const { container } = renderWithProviders(<MemberDirectoryPage />);
    const fullText = container.textContent || '';

    // Basic fields & circle info visible
    expect(fullText).toContain('Kampala Central Champions Circle');
    expect(fullText).toContain('Wakiso Young Builders Circle');
    expect(fullText).toContain('BCA-UG-2026-0103');

    // Sensitive PII must never appear
    expect(fullText).not.toContain('+256782555111');
    expect(fullText).not.toContain('+256772334455');
    expect(fullText).not.toContain('+256774119988');
    expect(fullText).not.toContain('david.mukasa@boychild.demo');
    expect(fullText).not.toContain('brian.ssemogerere@boychild.demo');
  });

  it('supports real-time search, circle/status/cohort filtering, reset, and inspecting basic member profiles', () => {
    mockStore.switchUser('usr_admin_kato');
    renderWithProviders(<MemberDirectory />);

    // Filter by Mentorship Circle: Wakiso Young Builders Circle
    fireEvent.change(screen.getByLabelText(/Mentorship Circle/i), {
      target: { value: 'circle_wakiso_builders' },
    });
    expect(screen.getAllByText('Brian Ssemogerere').length).toBeGreaterThan(0);
    expect(screen.queryByText('David Mukasa')).toBeNull();

    // Reset filters
    fireEvent.click(screen.getByRole('button', { name: /Reset Filters/i }));
    expect(screen.getAllByText('David Mukasa').length).toBeGreaterThan(0);

    // Filter by Membership Status: Pending Consent
    fireEvent.change(screen.getByLabelText(/Membership Status/i), {
      target: { value: 'pending_guardian_consent' },
    });
    expect(screen.getAllByText('John Baptist Ssemwogerere').length).toBeGreaterThan(0);
    const panel = screen.getByRole('complementary', { name: /Selected Member Profile/i });
    expect(within(panel).getByText(/Not assigned to a mentorship circle yet/i)).toBeTruthy();

    // Clear filter and search by keyword with empty fallback
    fireEvent.click(screen.getByRole('button', { name: /Reset Filters/i }));
    fireEvent.change(screen.getByLabelText(/Search Basic Profiles/i), {
      target: { value: 'NonExistentQuery999' },
    });
    expect(screen.getByText(/No Members Match Current Filters/i)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Reset All Filters/i }));

    // Search for Samuel Kiggundu and verify profile panel updates
    fireEvent.change(screen.getByLabelText(/Search Basic Profiles/i), {
      target: { value: 'Samuel' },
    });
    const detailPanel = screen.getByRole('complementary', { name: /Selected Member Profile/i });
    expect(within(detailPanel).getByText('Samuel Kiggundu')).toBeTruthy();
    expect(within(detailPanel).getByText('BCA-UG-2026-0102')).toBeTruthy();
    expect(within(detailPanel).getByText('Kampala Central Champions Circle')).toBeTruthy();
  });

  it('integrates inside MentorDashboardPage and AdminConsolePage tabs seamlessly', () => {
    mockStore.switchUser('usr_mentor_okello');
    renderWithProviders(<MentorDashboardPage />);
    fireEvent.click(screen.getByRole('button', { name: /Member Directory/i }));
    expect(screen.getByText(/Mentorship Member Directory/i)).toBeTruthy();
    expect(screen.getAllByText('David Mukasa').length).toBeGreaterThan(0);
    expect(screen.queryByText('Brian Ssemogerere')).toBeNull();
    cleanup();

    mockStore.switchUser('usr_coordinator_events');
    renderWithProviders(<AdminConsolePage />);
    fireEvent.click(screen.getByRole('button', { name: /Member Directory/i }));
    expect(screen.getByText(/National Operational Member Directory/i)).toBeTruthy();
    expect(screen.getAllByText('Brian Ssemogerere').length).toBeGreaterThan(0);
  });
});
