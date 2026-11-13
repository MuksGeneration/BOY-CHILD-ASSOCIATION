import React, { useState } from 'react';
import { firebaseService } from '../../lib/firebase/firebase';
import { useAuth } from '../../hooks/useAuth';
import { usePublicCatalog } from '../../hooks/usePlatformData';
import { cmsAnnouncementSchema, cmsProgrammeSchema } from '../../lib/validation/schemas';
import { CmsStatus, Programme } from '../../types';
import { Globe, Plus, CheckCircle2, Eye, FileEdit, Database, AlertTriangle } from 'lucide-react';

export const CmsEditorTab: React.FC = () => {
  const { role } = useAuth();
  usePublicCatalog(role);

  const cms = firebaseService.getCmsSettings();
  const programmes = firebaseService.getProgrammes(true);
  const events = firebaseService.getEvents(true);
  const announcements = firebaseService.getAnnouncements(true);
  const resources = firebaseService.getLearningResources(true);

  const [heroHeadline, setHeroHeadline] = useState(cms.heroHeadline);
  const [heroSubheadline, setHeroSubheadline] = useState(cms.heroSubheadline);
  const [activeBoys, setActiveBoys] = useState(cms.stats.activeBoys);
  const [vettedMentors, setVettedMentors] = useState(cms.stats.vettedMentors);
  const [districts, setDistricts] = useState(cms.stats.districts);
  const [partnerSchools, setPartnerSchools] = useState(cms.stats.partnerSchools);
  const [whatsappNumber, setWhatsappNumber] = useState(cms.whatsappNumber);
  const [cmsStatus, setCmsStatus] = useState<CmsStatus>(cms.status);
  const [retentionApps, setRetentionApps] = useState(cms.retentionDays.membershipApps);
  const [retentionLogs, setRetentionLogs] = useState(cms.retentionDays.auditLogs);
  const [retentionCasesYears, setRetentionCasesYears] = useState(cms.retentionDays.safeguardingCasesYears);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [savedNotice, setSavedNotice] = useState('');
  const [cmsError, setCmsError] = useState('');
  const [seeding, setSeeding] = useState(false);

  // New Programme form
  const [progTitle, setProgTitle] = useState('');
  const [progCategory, setProgCategory] = useState<Programme['category']>('Mentorship');
  const [progAgeRange, setProgAgeRange] = useState('Ages 12–17');
  const [progShortDesc, setProgShortDesc] = useState('');
  const [progStatus, setProgStatus] = useState<CmsStatus>('published');

  // New Announcement form
  const [annTitle, setAnnTitle] = useState('');
  const [annSummary, setAnnSummary] = useState('');
  const [annDistrict, setAnnDistrict] = useState('Kampala');
  const [annStatus, setAnnStatus] = useState<CmsStatus>('published');

  const pushSaved = (msg: string) => {
    setCmsError('');
    setSavedNotice(msg);
    setTimeout(() => setSavedNotice(''), 3500);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setCmsError('');
    try {
      await firebaseService.updateCmsHeroSettings({
        heroHeadline,
        heroSubheadline,
        whatsappNumber,
        status: cmsStatus,
        stats: { activeBoys, vettedMentors, districts, partnerSchools },
        retentionDays: {
          membershipApps: Number(retentionApps) || 365,
          auditLogs: Number(retentionLogs) || 730,
          safeguardingCasesYears: Number(retentionCasesYears) || 7,
        },
      });
      pushSaved('Global homepage, stats, DPPA retention policy, and contact configuration saved to Firestore.');
    } catch (err) {
      setCmsError(err instanceof Error ? err.message : 'Unable to save CMS settings.');
    }
  };

  const handleCreateProgramme = async (e: React.FormEvent) => {
    e.preventDefault();
    setCmsError('');
    const parsed = cmsProgrammeSchema.safeParse({
      title: progTitle,
      category: progCategory,
      ageRange: progAgeRange,
      shortDescription: progShortDesc,
      status: progStatus,
    });
    if (!parsed.success) {
      setCmsError(parsed.error.issues[0]?.message || 'Check programme details.');
      return;
    }
    try {
      await firebaseService.createProgramme({
        title: parsed.data.title,
        category: parsed.data.category,
        ageRange: parsed.data.ageRange,
        shortDescription: parsed.data.shortDescription,
        fullDescription: parsed.data.shortDescription,
        outcomes: ['Supervised weekly mentorship circle', 'Safeguarding Lead oversight'],
        schedule: 'Weekly Chapter Schedule',
        districtLocations: ['Kampala'],
        activeBoysCount: 0,
        availablePlaces: 30,
        status: parsed.data.status,
      });
      setProgTitle('');
      setProgShortDesc('');
      pushSaved(`Programme "${parsed.data.title}" published to Firestore CMS.`);
    } catch (err) {
      setCmsError(err instanceof Error ? err.message : 'Unable to create programme.');
    }
  };

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    setCmsError('');
    const parsed = cmsAnnouncementSchema.safeParse({
      title: annTitle,
      summary: annSummary,
      type: 'announcement',
      district: annDistrict,
      status: annStatus,
    });
    if (!parsed.success) {
      setCmsError(parsed.error.issues[0]?.message || 'Check announcement details.');
      return;
    }
    try {
      await firebaseService.createAnnouncement({
        title: parsed.data.title,
        summary: parsed.data.summary,
        body: parsed.data.summary,
        type: parsed.data.type,
        district: parsed.data.district,
        publishedDate: new Date().toISOString().slice(0, 10),
        status: parsed.data.status,
      });
      setAnnTitle('');
      setAnnSummary('');
      pushSaved('Announcement persisted to Firestore CMS.');
    } catch (err) {
      setCmsError(err instanceof Error ? err.message : 'Unable to create announcement.');
    }
  };

  const handleSeedStarterData = async () => {
    setCmsError('');
    setSeeding(true);
    try {
      const res = await firebaseService.seedDefaultFirestoreData();
      pushSaved(`Published ${res.count} starter CMS settings, programmes, events, circles, announcements, and guides to Firestore.`);
    } catch (err) {
      setCmsError(err instanceof Error ? err.message : 'Unable to seed Firestore starter data.');
    } finally {
      setSeeding(false);
    }
  };

  const statusBtn = (type: 'programme' | 'event' | 'announcement' | 'resource', id: string, current: CmsStatus) => (
    <div className="inline-flex items-center gap-1">
      {(['draft', 'published', 'archived'] as CmsStatus[]).map((st) => (
        <button
          key={st}
          type="button"
          onClick={async () => {
            try {
              await firebaseService.updateCmsStatus(type, id, st);
              pushSaved(`Updated ${type} status to ${st}.`);
            } catch (err) {
              setCmsError(err instanceof Error ? err.message : 'Unable to update CMS state.');
            }
          }}
          className={`px-2.5 py-1 rounded text-[11px] font-semibold capitalize transition-colors ${
            current === st
              ? 'bg-[#005A9C] text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          {st}
        </button>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      {savedNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-700" />
          <span>{savedNotice}</span>
        </div>
      )}
      {cmsError && (
        <div className="p-3 bg-red-50 border border-red-200 text-[#DC2626] rounded-xl text-xs font-semibold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{cmsError}</span>
        </div>
      )}

      {/* 1. Global Homepage Hero, Impact Stats, Retention Policy & Contact Editor */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="font-heading text-lg font-bold text-[#1B365D] flex items-center gap-2">
              <Globe className="w-5 h-5 text-[#005A9C]" />
              <span>Admin CMS: Homepage Sections, Impact Counters &amp; DPPA Policy</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Changes persist to Firestore <code className="font-mono">systemSettings/cms</code> and publish dynamically to the public website.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleSeedStarterData}
              disabled={seeding}
              className="px-3.5 py-2 rounded-xl bg-[#1B365D] hover:bg-[#132846] text-white text-xs font-semibold flex items-center gap-1.5 min-h-[40px] disabled:opacity-50"
            >
              <Database className="w-3.5 h-3.5 text-[#60C1E5]" />
              <span>{seeding ? 'Publishing...' : 'Publish Starter Data to Firestore'}</span>
            </button>
            <button
              type="button"
              onClick={() => setPreviewOpen(!previewOpen)}
              className="px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-[#1B365D] hover:bg-slate-50 flex items-center gap-1.5 min-h-[40px]"
            >
              <Eye className="w-4 h-4 text-[#005A9C]" />
              <span>{previewOpen ? 'Hide Live Preview' : 'Preview Hero Banner'}</span>
            </button>
          </div>
        </div>

        {previewOpen && (
          <div className="p-6 rounded-2xl bg-[#1B365D] text-white space-y-3">
            <div className="text-[11px] font-bold text-[#60C1E5] uppercase tracking-wider">
              Live CMS Preview ({cmsStatus})
            </div>
            <h3 className="font-heading text-2xl font-extrabold">{heroHeadline}</h3>
            <p className="text-xs text-slate-300 max-w-2xl">{heroSubheadline}</p>
            <div className="grid grid-cols-4 gap-4 pt-3 border-t border-white/10 text-xs">
              <div>
                <strong className="text-[#60C1E5] block text-base tabular-nums">{activeBoys}</strong>
                <span>Active Boys</span>
              </div>
              <div>
                <strong className="text-[#60C1E5] block text-base tabular-nums">{vettedMentors}</strong>
                <span>Vetted Mentors</span>
              </div>
              <div>
                <strong className="text-[#60C1E5] block text-base tabular-nums">{districts}</strong>
                <span>Districts</span>
              </div>
              <div>
                <strong className="text-[#60C1E5] block text-base tabular-nums">{partnerSchools}</strong>
                <span>Schools</span>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Hero Headline</label>
              <input
                type="text"
                value={heroHeadline}
                onChange={(e) => setHeroHeadline(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 min-h-[44px]"
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">WhatsApp Community Number</label>
              <input
                type="text"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 min-h-[44px]"
                required
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Hero Subheadline</label>
            <textarea
              rows={2}
              value={heroSubheadline}
              onChange={(e) => setHeroSubheadline(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300"
              required
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Active Boys</label>
              <input
                type="text"
                value={activeBoys}
                onChange={(e) => setActiveBoys(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 min-h-[40px]"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Vetted Mentors</label>
              <input
                type="text"
                value={vettedMentors}
                onChange={(e) => setVettedMentors(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 min-h-[40px]"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Districts</label>
              <input
                type="text"
                value={districts}
                onChange={(e) => setDistricts(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 min-h-[40px]"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Partner Schools</label>
              <input
                type="text"
                value={partnerSchools}
                onChange={(e) => setPartnerSchools(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 min-h-[40px]"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Publish State</label>
              <select
                value={cmsStatus}
                onChange={(e) => setCmsStatus(e.target.value as CmsStatus)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 min-h-[40px]"
              >
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">DPPA Membership App Retention (Days)</label>
              <input
                type="number"
                min={30}
                value={retentionApps}
                onChange={(e) => setRetentionApps(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white min-h-[40px]"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">DPPA Audit Log Retention (Days)</label>
              <input
                type="number"
                min={90}
                value={retentionLogs}
                onChange={(e) => setRetentionLogs(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white min-h-[40px]"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Statutory Safeguarding Hold (Years)</label>
              <input
                type="number"
                min={5}
                value={retentionCasesYears}
                onChange={(e) => setRetentionCasesYears(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white min-h-[40px]"
              />
            </div>
          </div>

          <button
            type="submit"
            className="px-5 py-2.5 bg-[#005A9C] hover:bg-[#004980] text-white font-bold rounded-xl min-h-[44px]"
          >
            Save &amp; Publish Global Settings
          </button>
        </form>
      </div>

      {/* 2. Create & Manage Programmes, Events, Resources & Announcements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
          <div>
            <h3 className="font-heading text-base font-bold text-[#1B365D] mb-3 flex items-center gap-2">
              <Plus className="w-4 h-4 text-[#005A9C]" />
              <span>Create New Programme</span>
            </h3>
            <form onSubmit={handleCreateProgramme} className="space-y-3 text-xs pb-4 border-b border-slate-100">
              <input
                type="text"
                value={progTitle}
                onChange={(e) => setProgTitle(e.target.value)}
                placeholder="Programme title (e.g. Digital & Robotics Apprenticeship)"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 min-h-[40px]"
                required
              />
              <div className="grid grid-cols-3 gap-2">
                <select
                  value={progCategory}
                  onChange={(e) => setProgCategory(e.target.value as Programme['category'])}
                  className="px-2.5 py-2 rounded-xl border border-slate-300 min-h-[40px]"
                >
                  <option value="Mentorship">Mentorship</option>
                  <option value="Wellbeing">Wellbeing</option>
                  <option value="Skills">Skills</option>
                  <option value="Clubs">Clubs</option>
                  <option value="Families">Families</option>
                </select>
                <input
                  type="text"
                  value={progAgeRange}
                  onChange={(e) => setProgAgeRange(e.target.value)}
                  placeholder="Ages 12–17"
                  className="px-2.5 py-2 rounded-xl border border-slate-300 min-h-[40px]"
                  required
                />
                <select
                  value={progStatus}
                  onChange={(e) => setProgStatus(e.target.value as CmsStatus)}
                  className="px-2.5 py-2 rounded-xl border border-slate-300 min-h-[40px]"
                >
                  <option value="published">Publish Now</option>
                  <option value="draft">Draft</option>
                </select>
              </div>
              <textarea
                rows={2}
                value={progShortDesc}
                onChange={(e) => setProgShortDesc(e.target.value)}
                placeholder="Short description for /programmes..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300"
                required
              />
              <button
                type="submit"
                className="px-4 py-2 bg-[#005A9C] hover:bg-[#004980] text-white font-bold rounded-xl min-h-[40px]"
              >
                Add Programme
              </button>
            </form>
          </div>

          <h3 className="font-heading text-base font-bold text-[#1B365D] flex items-center gap-2">
            <FileEdit className="w-4 h-4 text-[#005A9C]" />
            <span>Programmes &amp; Events Publishing State</span>
          </h3>
          <div className="space-y-2.5 text-xs">
            {programmes.map((p) => (
              <div key={p.id} className="p-3 rounded-xl border border-slate-100 flex items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-[#1B365D]">{p.title}</div>
                  <div className="text-slate-500">Programme · {p.category}</div>
                </div>
                {statusBtn('programme', p.id, p.status)}
              </div>
            ))}
            {events.map((e) => (
              <div key={e.id} className="p-3 rounded-xl border border-slate-100 flex items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-[#1B365D]">{e.title}</div>
                  <div className="text-slate-500">Event · {e.district}</div>
                </div>
                {statusBtn('event', e.id, e.status)}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
          <div>
            <h3 className="font-heading text-base font-bold text-[#1B365D] mb-3 flex items-center gap-2">
              <Plus className="w-4 h-4 text-[#005A9C]" />
              <span>Create News Announcement or Community Story</span>
            </h3>
            <form onSubmit={handleCreateAnnouncement} className="space-y-3 text-xs">
              <input
                type="text"
                value={annTitle}
                onChange={(e) => setAnnTitle(e.target.value)}
                placeholder="Headline (e.g. Jinja Saturday Coding Cohort Opens)"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 min-h-[40px]"
                required
              />
              <textarea
                rows={2}
                value={annSummary}
                onChange={(e) => setAnnSummary(e.target.value)}
                placeholder="Short summary for public /events-news..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300"
                required
              />
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={annDistrict}
                  onChange={(e) => setAnnDistrict(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-300 flex-1 min-h-[40px]"
                />
                <select
                  value={annStatus}
                  onChange={(e) => setAnnStatus(e.target.value as CmsStatus)}
                  className="px-3 py-2 rounded-xl border border-slate-300 min-h-[40px]"
                >
                  <option value="published">Publish Now</option>
                  <option value="draft">Save as Draft</option>
                </select>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#005A9C] text-white font-bold rounded-xl min-h-[40px]"
                >
                  Add
                </button>
              </div>
            </form>
          </div>

          <div className="space-y-2.5 text-xs pt-3 border-t border-slate-100">
            <div className="font-bold text-slate-700">Announcements &amp; Learning Guides</div>
            {announcements.map((a) => (
              <div key={a.id} className="p-3 rounded-xl border border-slate-100 flex items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-[#1B365D]">{a.title}</div>
                  <div className="text-slate-500">{a.district} · {a.publishedDate}</div>
                </div>
                {statusBtn('announcement', a.id, a.status)}
              </div>
            ))}
            {resources.map((r) => (
              <div key={r.id} className="p-3 rounded-xl border border-slate-100 flex items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-[#1B365D]">{r.title}</div>
                  <div className="text-slate-500">Resource · {r.category}</div>
                </div>
                {statusBtn('resource', r.id, r.status)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
