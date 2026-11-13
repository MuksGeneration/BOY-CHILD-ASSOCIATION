import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { usePartnerData, usePublicCatalog } from '../../hooks/usePlatformData';
import { firebaseService } from '../../lib/firebase/firebase';
import { UGANDA_DISTRICTS } from '../../lib/validation/ugandaDistricts';
import {
  Building2,
  CheckCircle2,
  Calendar,
  Send,
  ShieldCheck,
  Award,
  Lock,
  FileText,
} from 'lucide-react';

export const PartnerDashboardPage: React.FC = () => {
  const { user, role } = useAuth();
  usePublicCatalog(role);
  usePartnerData(user?.uid);

  const partners = firebaseService.getPartners();
  const partnerApps = firebaseService.getPartnerApplications();
  const events = firebaseService.getEvents();

  const myPartnerOrg =
    partners.find((p) => p.ownerUid === user?.uid) || partners[0];
  const myApps = partnerApps.filter(
    (a) => a.applicantUid === user?.uid || role === 'admin' || role === 'coordinator'
  );

  // Form states for new Vanguard Club / Event Collaboration Proposal
  const [applicationType, setApplicationType] = useState<'vanguard_club' | 'event_collaboration' | 'institutional_partner'>('vanguard_club');
  const [orgName, setOrgName] = useState(myPartnerOrg?.orgName || '');
  const [district, setDistrict] = useState(myPartnerOrg?.district || 'Kampala');
  const [proposal, setProposal] = useState('');
  const [activityReport, setActivityReport] = useState('');
  const [formMsg, setFormMsg] = useState('');
  const [formErr, setFormErr] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (role !== 'partner' && role !== 'coordinator' && role !== 'admin') {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6 bg-[#F8FAFC]">
        <div className="max-w-md bg-white rounded-2xl p-8 border border-slate-200 text-center">
          <div className="w-12 h-12 bg-blue-50 text-[#005A9C] rounded-full flex items-center justify-center mx-auto mb-3">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="font-heading text-lg font-bold text-[#1B365D]">Partner Portal Restricted</h2>
          <p className="text-xs text-slate-600 mt-2">
            Only verified schools, churches, NGOs, and community partner institutions can access partner collaboration controls.
          </p>
        </div>
      </div>
    );
  }

  const handleProposalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErr('');
    setFormMsg('');
    if (orgName.trim().length < 3) {
      setFormErr('Organisation or school name is required.');
      return;
    }
    if (proposal.trim().length < 25) {
      setFormErr('Please provide at least 25 characters describing your School Vanguard Club or event plan.');
      return;
    }
    setSubmitting(true);
    try {
      await firebaseService.submitPartnerApplication({
        applicantUid: user?.uid || 'usr_partner_school',
        orgName: orgName.trim(),
        orgType: myPartnerOrg?.orgType || 'school',
        contactPerson: user?.fullName || 'Partner Contact',
        phone: user?.phone || '+256752118899',
        email: user?.email || 'partner@boychild.org',
        district,
        applicationType,
        proposal: proposal.trim(),
        activityNotes: activityReport.trim() || undefined,
      });
      setProposal('');
      setActivityReport('');
      setFormMsg('Proposal submitted to BCA Coordinators for safeguarding & schedule approval.');
    } catch (err) {
      setFormErr(err instanceof Error ? err.message : 'Unable to submit partner proposal.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-[#F8FAFC] min-h-screen py-10 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
        {/* Top Summary Header */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className="font-bold text-[#005A9C]">Institutional Partner Portal</span>
              <span aria-hidden="true">·</span>
              <span>{myPartnerOrg?.orgType.toUpperCase() || 'SCHOOL'}</span>
              <span aria-hidden="true">·</span>
              <span className="text-emerald-700 font-semibold">
                Status: {myPartnerOrg?.status === 'verified' ? 'Verified Partner' : 'Pending Verification'}
              </span>
            </div>
            <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-[#1B365D]">
              {myPartnerOrg?.orgName || user?.fullName}
            </h1>
            <p className="text-xs text-slate-600 max-w-2xl">
              Manage your School Vanguard Club charter, submit joint event proposals, and review BCA safeguarding requirements for school campuses.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-center shrink-0">
            <div className="px-4 py-3 rounded-xl bg-[#F4F8FC] border border-blue-100">
              <div className="font-heading font-extrabold text-xl text-[#1B365D] tabular-nums">
                {myPartnerOrg?.approvedEventsCount ?? 0}
              </div>
              <div className="text-[11px] text-slate-600">Approved Events</div>
            </div>
            <div className="px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200">
              <div className="font-heading font-extrabold text-xl text-emerald-800">
                {myPartnerOrg?.vanguardClubActive ? 'Active' : 'Applying'}
              </div>
              <div className="text-[11px] text-emerald-800">Vanguard Club</div>
            </div>
          </div>
        </div>

        {/* Safeguarding Reminder */}
        <div className="bg-[#1B365D] text-white rounded-2xl p-5 flex items-start gap-3 text-xs">
          <ShieldCheck className="w-5 h-5 text-[#60C1E5] shrink-0 mt-0.5" />
          <div>
            <strong className="text-white block">Partner Child Safeguarding Covenant</strong>
            <span className="text-slate-300">
              Institutional partners must assign two vetted staff members during all School Vanguard Club meetings and never collect private student data outside approved BCA consent workflows.
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Submit Vanguard Club or Joint Event Proposal */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <h2 className="font-heading text-lg font-bold text-[#1B365D] flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#005A9C]" />
              <span>Submit Partnership or Club Proposal</span>
            </h2>

            {formMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>{formMsg}</span>
              </div>
            )}
            {formErr && (
              <div className="p-3 bg-red-50 border border-red-200 text-[#DC2626] rounded-xl text-xs">
                {formErr}
              </div>
            )}

            <form onSubmit={handleProposalSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Proposal Category</label>
                <select
                  value={applicationType}
                  onChange={(e) => setApplicationType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 min-h-[44px]"
                >
                  <option value="vanguard_club">School Vanguard Club Charter</option>
                  <option value="event_collaboration">Joint Workshop / Sports Wellbeing Event</option>
                  <option value="institutional_partner">District Chapter Institutional MOU</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">School / Organisation Name</label>
                <input
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 min-h-[44px]"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">District</label>
                <select
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 min-h-[44px]"
                >
                  {UGANDA_DISTRICTS.slice(0, 20).map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Programme Scope, Venue &amp; Adult Supervision Plan
                </label>
                <textarea
                  rows={4}
                  value={proposal}
                  onChange={(e) => setProposal(e.target.value)}
                  placeholder="Describe student age group, patron teachers, meeting schedule, and safeguarding measures..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Optional Term Activity Update
                </label>
                <input
                  type="text"
                  value={activityReport}
                  onChange={(e) => setActivityReport(e.target.value)}
                  placeholder="e.g. 42 boys attended Term 3 integrity seminar"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 min-h-[44px]"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 bg-[#005A9C] hover:bg-[#004980] text-white font-bold rounded-xl flex items-center justify-center gap-2 min-h-[44px] disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{submitting ? 'Submitting...' : 'Submit Partner Proposal'}</span>
              </button>
            </form>
          </div>

          {/* Right Column: Applications & Collaborating Events */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
              <h2 className="font-heading text-lg font-bold text-[#1B365D] flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#005A9C]" />
                <span>Submitted Club &amp; Partnership Applications</span>
              </h2>
              {myApps.length === 0 ? (
                <p className="text-xs text-slate-500">No applications logged yet.</p>
              ) : (
                <div className="space-y-3">
                  {myApps.map((app) => (
                    <div key={app.id} className="p-4 rounded-xl border border-slate-200 text-xs space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-[#1B365D]">{app.orgName}</span>
                        <span
                          className={`font-bold capitalize ${
                            app.status === 'approved'
                              ? 'text-emerald-700'
                              : app.status === 'declined'
                              ? 'text-[#DC2626]'
                              : 'text-amber-700'
                          }`}
                        >
                          {app.status}
                        </span>
                      </div>
                      <div className="text-slate-500">
                        {app.applicationType.replace(/_/g, ' ')} · {app.district}
                      </div>
                      <p className="text-slate-700">{app.proposal}</p>
                      {app.activityNotes && (
                        <div className="text-[#005A9C] pt-1 font-medium">Note: {app.activityNotes}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
              <h2 className="font-heading text-lg font-bold text-[#1B365D] flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#005A9C]" />
                <span>Published Community &amp; Vanguard Events</span>
              </h2>
              <div className="space-y-3">
                {events.map((evt) => (
                  <div key={evt.id} className="p-4 rounded-xl border border-slate-200 text-xs space-y-1">
                    <div className="flex items-center justify-between gap-2 text-slate-500">
                      <span className="font-bold text-[#005A9C]">{evt.category}</span>
                      <span className="font-mono tabular-nums">{new Date(evt.startsAt).toLocaleDateString()}</span>
                    </div>
                    <div className="font-bold text-sm text-[#1B365D]">{evt.title}</div>
                    <div className="text-slate-600">{evt.location} ({evt.district})</div>
                    <div className="text-slate-500 flex items-center gap-1 pt-1">
                      <Award className="w-3.5 h-3.5 text-[#005A9C]" />
                      <span className="tabular-nums">
                        {evt.registeredCount} / {evt.capacity} registered
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
