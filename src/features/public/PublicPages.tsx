import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { firebaseService } from '../../lib/firebase/firebase';
import { useAuth } from '../../hooks/useAuth';
import { usePublicCatalog } from '../../hooks/usePlatformData';
import { contactMessageSchema, newsletterSchema } from '../../lib/validation/schemas';
import { UGANDA_DISTRICTS } from '../../lib/validation/ugandaDistricts';
import {
  ShieldCheck,
  Users,
  Compass,
  Hammer,
  BookOpen,
  MapPin,
  Mail,
  PhoneCall,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';

interface PageBannerProps {
  kicker: string;
  title: string;
  subtitle: string;
}

const PageBanner: React.FC<PageBannerProps> = ({ kicker, title, subtitle }) => (
  <div className="bg-[#1B365D] text-white py-12 sm:py-16">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-3">
      <div className="text-xs font-bold text-[#60C1E5]">{kicker}</div>
      <h1 className="font-heading text-3xl sm:text-4xl font-extrabold text-white text-balance max-w-3xl">
        {title}
      </h1>
      <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">{subtitle}</p>
    </div>
  </div>
);

export const AboutPage: React.FC = () => {
  const { role } = useAuth();
  usePublicCatalog(role);
  const cms = firebaseService.getCmsSettings();
  return (
    <div className="bg-[#F8FAFC] min-h-screen pb-16">
      <PageBanner
        kicker="Boy Child Association Uganda · Standing Up As A Man"
        title="Supporting, Uniting, Guiding & Empowering the Boy Child"
        subtitle="Founded to ensure every boy across Uganda grows within an accountable, safe community circle led by vetted elders and supported by families and schools."
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 space-y-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-8 space-y-4">
            <h2 className="font-heading text-2xl font-bold text-[#1B365D]">Why Our Work Matters in Uganda</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Across urban centres and rural districts, many boys face silent academic dropout pressures, emotional isolation, unsafe peer groups, or transition to adulthood without consistent male role models. Boy Child Association (BCA) Uganda responds with structured weekly circles rather than one-off talks.
            </p>
            <p className="text-sm text-slate-600 leading-relaxed">
              We operate two tailored developmental tracks: protected <strong>Children Circles (ages 5–17)</strong> requiring verified parent/guardian consent, and <strong>Young Adult Tracks (ages 18–35)</strong> focused on solar and digital livelihoods, leadership, and peer stewardship.
            </p>
            <div className="pt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-slate-100">
              <div>
                <div className="font-heading text-2xl font-extrabold text-[#005A9C] tabular-nums">{cms.stats.activeBoys}</div>
                <div className="text-xs text-slate-500">Boys Reached</div>
              </div>
              <div>
                <div className="font-heading text-2xl font-extrabold text-[#005A9C] tabular-nums">{cms.stats.vettedMentors}</div>
                <div className="text-xs text-slate-500">Vetted Mentors</div>
              </div>
              <div>
                <div className="font-heading text-2xl font-extrabold text-[#005A9C] tabular-nums">{cms.stats.districts}</div>
                <div className="text-xs text-slate-500">Active Districts</div>
              </div>
              <div>
                <div className="font-heading text-2xl font-extrabold text-[#005A9C] tabular-nums">{cms.stats.partnerSchools}</div>
                <div className="text-xs text-slate-500">Partner Schools</div>
              </div>
            </div>
          </div>
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col">
            <img
              src="/images/hero_boys_circle_1794461657319.jpg"
              alt="BCA community mentorship circle session"
              className="w-full h-64 lg:h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export const MissionVisionPage: React.FC = () => (
  <div className="bg-[#F8FAFC] min-h-screen pb-16">
    <PageBanner
      kicker="Mission, Vision & Four Core Pillars"
      title="Standing Up As A Man Through Character & Craft"
      subtitle="Our mission integrates safeguarding, emotional literacy, community brotherhood, and vocational self-reliance."
    />
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 space-y-3">
          <h2 className="font-heading text-xl font-bold text-[#1B365D]">Our Mission</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            To support, unite, guide, and empower the boy child across Uganda (ages 5–35) through supervised peer circles, two-referee vetted mentorship, and hands-on skills development while safeguarding children’s dignity.
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-8 space-y-3">
          <h2 className="font-heading text-xl font-bold text-[#1B365D]">Our Vision</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            An Uganda where every boy stands grounded in integrity, respects women and girls, completes his education or vocational craft, and builds safe families and resilient communities.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { t: 'Support', d: 'Confidential safeguarding, counselling referrals, and safe dialogue.', i: ShieldCheck },
          { t: 'Unite', d: 'Weekly circles ending isolation and toxic street pressure.', i: Users },
          { t: 'Guide', d: 'Vetted elder mentors modelling honesty and steady accountability.', i: Compass },
          { t: 'Empower', d: 'Solar electronics, computing, and career readiness.', i: Hammer },
        ].map((item) => {
          const Icon = item.i;
          return (
            <div key={item.t} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-2">
              <Icon className="w-6 h-6 text-[#005A9C]" />
              <h3 className="font-heading text-base font-bold text-[#1B365D]">{item.t}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{item.d}</p>
            </div>
          );
        })}
      </div>
    </div>
  </div>
);

export const MentorshipCirclesPage: React.FC = () => {
  const { role } = useAuth();
  usePublicCatalog(role);
  const circles = firebaseService.getCircles();
  return (
    <div className="bg-[#F8FAFC] min-h-screen pb-16">
      <PageBanner
        kicker="Community Neighbourhood Chapters"
        title="Mentorship Circles Across Uganda"
        subtitle="Small cohorts of 8–12 members supervised under our Two-Adult Rule and local safeguarding leads."
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {circles.map((c) => (
            <div key={c.id} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="font-bold text-[#005A9C]">{c.district}</span>
                <span className="capitalize font-semibold text-emerald-700">{c.status}</span>
              </div>
              <h3 className="font-heading text-lg font-bold text-[#1B365D]">{c.name}</h3>
              <p className="text-slate-600">{c.locationName}</p>
              <p className="text-slate-600">{c.meetingTime}</p>
              <p className="text-slate-700">Focus: <strong>{c.focusArea}</strong></p>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="font-mono font-bold text-[#005A9C] tabular-nums">
                  {c.activeMembersCount} / {c.maxMembers} seats
                </span>
                <Link to="/join" className="font-bold text-[#005A9C] hover:underline">
                  Apply to Join &rarr;
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

interface PillarTopicPageProps {
  kicker: string;
  title: string;
  subtitle: string;
  highlights: { heading: string; detail: string }[];
  ctaPath: string;
  ctaLabel: string;
}

export const PillarDetailPage: React.FC<PillarTopicPageProps> = ({
  kicker,
  title,
  subtitle,
  highlights,
  ctaPath,
  ctaLabel,
}) => (
  <div className="bg-[#F8FAFC] min-h-screen pb-16">
    <PageBanner kicker={kicker} title={title} subtitle={subtitle} />
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {highlights.map((h) => (
          <div key={h.heading} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-2">
            <h2 className="font-heading text-lg font-bold text-[#1B365D]">{h.heading}</h2>
            <p className="text-xs text-slate-600 leading-relaxed">{h.detail}</p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-heading text-lg font-bold text-[#1B365D]">Ready to get involved?</h3>
          <p className="text-xs text-slate-600 mt-1">
            All youth applications follow strict age cohort and safeguarding checks.
          </p>
        </div>
        <Link
          to={ctaPath}
          className="px-5 py-3 rounded-xl bg-[#005A9C] hover:bg-[#004980] text-white text-xs font-bold inline-flex items-center gap-2 min-h-[44px] whitespace-nowrap"
        >
          <span>{ctaLabel}</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  </div>
);

export const ResourcesPage: React.FC = () => {
  const { role } = useAuth();
  usePublicCatalog(role);
  const resources = firebaseService.getLearningResources();
  const [catFilter, setCatFilter] = useState('All');
  const filtered = resources.filter((r) => catFilter === 'All' || r.category === catFilter);

  return (
    <div className="bg-[#F8FAFC] min-h-screen pb-16">
      <PageBanner
        kicker="Educational Materials & Toolkits"
        title="Guides for Boys, Guardians, Mentors & Schools"
        subtitle="Practical field handbooks, Uganda safeguarding policies, and life skills study notes."
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 space-y-6">
        <div className="flex flex-wrap gap-2">
          {['All', 'Safeguarding', 'Mentorship Guide', 'Parenting', 'Life Skills'].map((c) => (
            <button
              key={c}
              onClick={() => setCatFilter(c)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold min-h-[40px] ${
                catFilter === c ? 'bg-[#005A9C] text-white' : 'bg-white border border-slate-200 text-slate-700'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filtered.map((res) => (
            <div key={res.id} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <BookOpen className="w-4 h-4 text-[#005A9C]" />
                <span className="font-bold text-[#005A9C]">{res.category}</span>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">{res.readTimeMinutes} min read</span>
              </div>
              <h3 className="font-heading text-base font-bold text-[#1B365D]">{res.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{res.summary}</p>
              <div className="pt-3 border-t border-slate-100 text-xs text-slate-700 leading-relaxed">
                {res.contentBody}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const ContactPage: React.FC = () => {
  const { role } = useAuth();
  usePublicCatalog(role);
  const cms = firebaseService.getCmsSettings();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [contactError, setContactError] = useState('');
  const [contactSuccess, setContactSuccess] = useState(false);
  const [contactSubmitting, setContactSubmitting] = useState(false);

  const [newsEmail, setNewsEmail] = useState('');
  const [newsDistrict, setNewsDistrict] = useState('Kampala');
  const [newsConsent, setNewsConsent] = useState(false);
  const [newsMsg, setNewsMsg] = useState('');
  const [newsErr, setNewsErr] = useState('');

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactError('');
    const parsed = contactMessageSchema.safeParse({ fullName, email, phone, subject, message });
    if (!parsed.success) {
      setContactError(parsed.error.issues[0]?.message || 'Please check your form details.');
      return;
    }
    setContactSubmitting(true);
    try {
      await firebaseService.submitContactMessage({
        fullName: parsed.data.fullName,
        email: parsed.data.email,
        phone: parsed.data.phone,
        subject: parsed.data.subject,
        message: parsed.data.message,
      });
      setContactSuccess(true);
      setFullName('');
      setEmail('');
      setPhone('');
      setSubject('');
      setMessage('');
    } catch (err) {
      setContactError(err instanceof Error ? err.message : 'Unable to send your inquiry right now.');
    } finally {
      setContactSubmitting(false);
    }
  };

  const handleNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewsErr('');
    setNewsMsg('');
    const parsed = newsletterSchema.safeParse({
      email: newsEmail,
      district: newsDistrict,
      consentGiven: newsConsent,
    });
    if (!parsed.success) {
      setNewsErr(parsed.error.issues[0]?.message || 'Valid email and DPPA consent required.');
      return;
    }
    try {
      await firebaseService.subscribeNewsletter(parsed.data.email, parsed.data.district);
      setNewsEmail('');
      setNewsConsent(false);
      setNewsMsg('Subscribed with verified Uganda DPPA 2019 email consent.');
    } catch (err) {
      setNewsErr(err instanceof Error ? err.message : 'Unable to process subscription.');
    }
  };

  return (
    <div className="bg-[#F8FAFC] min-h-screen pb-16">
      <PageBanner
        kicker="Connect With Us"
        title="Contact Boy Child Association Uganda"
        subtitle="Reach our district coordinators, request a school presentation, or subscribe to verified quarterly updates."
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 text-xs">
            <h2 className="font-heading text-lg font-bold text-[#1B365D]">Uganda Office &amp; Helplines</h2>
            <div className="space-y-3 text-slate-600">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#005A9C] shrink-0 mt-0.5" />
                <span>{cms.headquartersAddress}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#005A9C] shrink-0" />
                <span>{cms.email}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <PhoneCall className="w-4 h-4 text-[#DC2626] shrink-0" />
                <span>Sauti National Child Helpline: Toll-Free <strong>{cms.helplineNumber}</strong></span>
              </div>
            </div>
            <a
              href={`https://wa.me/256${cms.whatsappNumber.replace(/^0/, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              WhatsApp Community Line: {cms.whatsappNumber}
            </a>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3 text-xs">
            <h3 className="font-heading text-base font-bold text-[#1B365D]">
              Newsletter &amp; Chapter Updates
            </h3>
            <p className="text-slate-500">
              Explicit opt-in compliant with the Uganda Data Protection and Privacy Act 2019. Zero spam; unsubscribe anytime.
            </p>
            {newsMsg && <div className="p-2.5 bg-emerald-50 text-emerald-800 rounded-xl">{newsMsg}</div>}
            {newsErr && <div className="p-2.5 bg-red-50 text-[#DC2626] rounded-xl">{newsErr}</div>}
            <form onSubmit={handleNewsletter} className="space-y-3">
              <input
                type="email"
                value={newsEmail}
                onChange={(e) => setNewsEmail(e.target.value)}
                placeholder="your.email@example.com"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 min-h-[44px]"
                required
              />
              <select
                value={newsDistrict}
                onChange={(e) => setNewsDistrict(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 min-h-[44px]"
              >
                {UGANDA_DISTRICTS.slice(0, 15).map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              <label className="flex items-start gap-2 cursor-pointer text-slate-600">
                <input
                  type="checkbox"
                  checked={newsConsent}
                  onChange={(e) => setNewsConsent(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-slate-300 text-[#005A9C]"
                />
                <span>I explicitly consent to receive BCA Uganda programme emails under DPPA 2019.</span>
              </label>
              <button
                type="submit"
                className="w-full py-2.5 bg-[#005A9C] hover:bg-[#004980] text-white font-bold rounded-xl min-h-[44px]"
              >
                Subscribe with Consent
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-8">
          <h2 className="font-heading text-xl font-bold text-[#1B365D] mb-4">Send a General Inquiry</h2>
          {contactSuccess ? (
            <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-700 mx-auto" />
              <div className="font-bold text-[#1B365D]">Inquiry Received</div>
              <p className="text-xs text-slate-600">Our Uganda coordination desk will respond within 2 working days.</p>
            </div>
          ) : (
            <form onSubmit={handleContactSubmit} className="space-y-4 text-xs">
              {contactError && <div className="p-3 bg-red-50 text-[#DC2626] rounded-xl">{contactError}</div>}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 min-h-[44px]"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Ugandan Phone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0772123456"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 min-h-[44px]"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 min-h-[44px]"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Subject</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 min-h-[44px]"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Message</label>
                <textarea
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={contactSubmitting}
                className="px-6 py-3 bg-[#005A9C] hover:bg-[#004980] text-white font-bold rounded-xl min-h-[44px] disabled:opacity-50"
              >
                {contactSubmitting ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export const SchoolPartnershipsPage: React.FC = () => (
  <PillarDetailPage
    kicker="School Vanguard Chapters & Institutional Alliances"
    title="School & Community Partnerships"
    subtitle="Partner with BCA Uganda to launch supervised School Vanguard Clubs, anti-bullying patrols, and parent dialogues."
    highlights={[
      { heading: 'School Vanguard Clubs', detail: 'Weekly term-time clubs building positive male leadership and respect for girls and women.' },
      { heading: 'Trained Patron Teachers', detail: 'Every partner club operates under our Two-Adult Rule with signed safeguarding covenants.' },
      { heading: 'Co-Hosted Career Clinics', detail: 'Connecting senior students with solar technicians, engineers, and vocational scholarships.' },
    ]}
    ctaPath="/join"
    ctaLabel="Register as Institutional Partner"
  />
);

export const VolunteerMentorPage: React.FC = () => (
  <PillarDetailPage
    kicker="Stand Up As A Role Model"
    title="Volunteer & Mentor Pathways"
    subtitle="Apply to become a community mentor or chapter volunteer after mandatory two-referee verification and safeguarding clearance."
    highlights={[
      { heading: 'Rigorous Two-Referee Vetting', detail: 'Two independent community or school referees must verify character before mentor activation.' },
      { heading: 'Structured Weekly Curriculum', detail: 'Facilitate circle discussions using prepared modules on integrity, stress, and life skills.' },
      { heading: 'Transparent Boundaries', detail: 'Zero private 1:1 messaging with minors; all guidance occurs inside supervised circles.' },
    ]}
    ctaPath="/join"
    ctaLabel="Start Mentor Application"
  />
);
