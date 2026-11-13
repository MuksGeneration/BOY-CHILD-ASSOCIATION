import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { firebaseService } from '../../lib/firebase/firebase';
import { useAuth } from '../../hooks/useAuth';
import { usePublicCatalog } from '../../hooks/usePlatformData';
import {
  ShieldCheck,
  Users,
  Compass,
  Hammer,
  ArrowRight,
  HeartHandshake,
  AlertCircle,
  Calendar,
  BookOpen,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { SafeguardingConcernModal } from '../../components/common/SafeguardingConcernModal';

export const HomePage: React.FC = () => {
  const { role } = useAuth();
  usePublicCatalog(role);
  const [concernModalOpen, setConcernModalOpen] = useState(false);
  const [openFaqId, setOpenFaqId] = useState<string | null>('faq_1');

  const cms = firebaseService.getCmsSettings();
  const publishedProgrammes = firebaseService.getProgrammes().slice(0, 3);
  const publishedAnnouncements = firebaseService.getAnnouncements().slice(0, 2);

  const pillars = [
    {
      title: '01. Support',
      lead: 'Mental Health & Emotional Safety',
      desc: 'Creating judgment-free spaces where boys can express anxiety, grief, and school stress before it becomes anger or isolation.',
      icon: HeartHandshake,
      color: 'bg-blue-50 text-[#005A9C] border-blue-100',
    },
    {
      title: '02. Unite',
      lead: 'Small Peer Circles',
      desc: 'Forming tight-knit brotherhood circles of 8–12 boys in local communities who hold each other accountable and celebrate positive growth.',
      icon: Users,
      color: 'bg-cyan-50 text-[#005A9C] border-cyan-100',
    },
    {
      title: '03. Guide',
      lead: 'Elder & Professional Mentorship',
      desc: 'Screened and vetted male role models providing consistent, practical guidance on character, integrity, and respectful relationships.',
      icon: Compass,
      color: 'bg-amber-50 text-amber-900 border-amber-100',
    },
    {
      title: '04. Empower',
      lead: 'Practical 21st-Century Crafts',
      desc: 'Hands-on training in solar electronics, electrical repair, coding, and academic problem-solving for sustainable self-reliance.',
      icon: Hammer,
      color: 'bg-emerald-50 text-emerald-900 border-emerald-100',
    },
  ];

  const steps = [
    {
      num: '01',
      title: 'Join or Refer a Boy',
      text: 'A parent, teacher, or young man registers online. Community district and age cohort (5–17 vs 18–35) are recorded.',
    },
    {
      num: '02',
      title: 'Guardian Consent & Verification',
      text: 'For boys under 18, a verified parent or guardian grants explicit consent in line with Uganda’s Children Act Cap 59.',
    },
    {
      num: '03',
      title: 'Circle Matching',
      text: 'Each member is welcomed into a supervised local circle guided by mentors screened through two independent referees.',
    },
    {
      num: '04',
      title: 'Growth & Accountability',
      text: 'Boys build life skills, track personal goals, and attend weekly circle activities with continuous safeguarding oversight.',
    },
  ];

  return (
    <div className="bg-[#F8FAFC]">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#1B365D] to-[#12243E] text-white py-16 sm:py-24">
        <div className="absolute inset-0 bg-[radial-gradient(#60C1E5_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch">
            <div className="lg:col-span-7 flex flex-col justify-center space-y-6">
              <div className="flex flex-wrap items-center gap-2 text-xs text-[#A0E0EF] font-semibold">
                <span>Uganda Child Protection Standard</span>
                <span aria-hidden="true">·</span>
                <span>Motto: {cms.motto}</span>
                <span aria-hidden="true">·</span>
                <span>Ages 5–35 Cohorts</span>
              </div>

              <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight text-white text-balance">
                {cms.heroHeadline}
              </h1>

              <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl">
                {cms.heroSubheadline}
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  to="/join"
                  className="px-6 py-3.5 rounded-xl bg-[#60C1E5] hover:bg-[#A0E0EF] text-[#1B365D] font-bold text-sm transition-colors shadow-lg flex items-center gap-2 min-h-[44px] whitespace-nowrap"
                >
                  <span>Join a Circle Today</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <a
                  href={`https://wa.me/256${cms.whatsappNumber.replace(/^0/, '')}?text=Hello%20Boy%20Child%20Association%2C%20I%20would%20like%20to%20join%20the%20boys%20WhatsApp%20group`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-md flex items-center gap-2 min-h-[44px] whitespace-nowrap"
                >
                  <span>WhatsApp Group: {cms.whatsappNumber}</span>
                </a>

                <Link
                  to="/programmes"
                  className="px-5 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-sm transition-colors border border-white/20 min-h-[44px] flex items-center whitespace-nowrap"
                >
                  Explore Programmes
                </Link>

                <button
                  onClick={() => setConcernModalOpen(true)}
                  className="px-4 py-3.5 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold text-xs transition-colors flex items-center gap-1.5 min-h-[44px] whitespace-nowrap"
                >
                  <AlertCircle className="w-4 h-4" />
                  <span>Report a Concern</span>
                </button>
              </div>

              {/* Claim-to-Proof Metrics Strip */}
              <div className="pt-6 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-4 text-left">
                <div>
                  <div className="font-heading font-extrabold text-2xl text-[#60C1E5] tabular-nums">
                    {cms.stats.activeBoys}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">Active Boys in Circles</div>
                </div>
                <div>
                  <div className="font-heading font-extrabold text-2xl text-[#60C1E5] tabular-nums">
                    {cms.stats.vettedMentors}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">Vetted Community Mentors</div>
                </div>
                <div>
                  <div className="font-heading font-extrabold text-2xl text-[#60C1E5] tabular-nums">
                    {cms.stats.districts}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">Uganda Districts</div>
                </div>
                <div>
                  <div className="font-heading font-extrabold text-2xl text-[#60C1E5] tabular-nums">
                    {cms.stats.partnerSchools}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">Vanguard Partner Schools</div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-[#A0E0EF]">
                <Link to="/national-dashboard" className="font-semibold hover:underline flex items-center gap-1">
                  <span>View National BCA Overview</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <span aria-hidden="true" className="text-white/25">·</span>
                <Link to="/verify" className="font-semibold hover:underline">
                  Verify Membership Card (QR)
                </Link>
              </div>
            </div>

            {/* Right Media Column */}
            <div className="lg:col-span-5">
              <div className="relative h-full min-h-[340px] rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                <div className="absolute top-4 left-4 p-2 rounded-2xl bg-white/95 backdrop-blur-md border border-white/20 shadow-xl flex items-center gap-2.5 z-10">
                  <img
                    src="/assets/aistudio/Screenshot_20260801_081145_WhatsApp__1__8a50926e.jpg"
                    alt="Boy Child Association Official Logo"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = '/logo.png';
                    }}
                    className="w-11 h-11 object-contain rounded-full bg-white"
                  />
                  <div className="pr-2 text-left">
                    <span className="font-heading font-extrabold text-xs text-[#1B365D] block leading-none">
                      BOY CHILD ASSOCIATION
                    </span>
                    <span className="text-[10px] font-bold text-[#005A9C]">
                      {cms.motto}
                    </span>
                  </div>
                </div>

                <img
                  src="/images/hero_boys_circle_1794461657319.jpg"
                  alt="Ugandan boys gathered in a supportive outdoor mentorship circle with an elder mentor"
                  className="w-full h-full object-cover bg-[#1B365D]"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1B365D] via-transparent to-transparent opacity-80" />
                <div className="absolute bottom-4 left-4 right-4 p-4 rounded-xl bg-[#1B365D]/85 backdrop-blur-md border border-white/10 text-white text-xs">
                  <div className="font-bold text-[#60C1E5]">Kampala Central Circle #3</div>
                  <div className="text-slate-300 text-[11px] mt-0.5">
                    Saturday peer dialogue on integrity, study habits, and community service.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Four Pillars Section */}
      <section className="py-16 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold text-[#005A9C]">Our Foundation</span>
          <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-[#1B365D] mt-2 text-balance">
            The Four Pillars of the Boy Child
          </h2>
          <p className="mt-3 text-sm text-slate-600 leading-relaxed">
            Every programme is structured around four practical principles addressing the real emotional, educational, and social challenges boys navigate daily across Uganda.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {pillars.map((p) => {
            const Icon = p.icon;
            return (
              <div
                key={p.title}
                className="bg-white rounded-2xl p-6 border border-slate-200 flex flex-col justify-between"
              >
                <div>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 border ${p.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-heading text-lg font-bold text-[#1B365D]">{p.title}</h3>
                  <div className="text-xs font-semibold text-[#005A9C] mt-0.5">{p.lead}</div>
                  <p className="mt-3 text-xs text-slate-600 leading-relaxed">{p.desc}</p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-100 text-xs font-bold text-[#005A9C]">
                  <Link to="/mission-vision" className="hover:underline">
                    Read Pillar Framework &rarr;
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Featured Programmes Spotlight (CMS-driven) */}
      <section className="py-16 bg-[#F4F8FC] border-y border-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-10">
            <div>
              <span className="text-xs font-bold text-[#005A9C]">Active Initiatives</span>
              <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-[#1B365D] mt-1">
                Featured Programmes
              </h2>
            </div>
            <Link
              to="/programmes"
              className="text-xs font-bold text-[#005A9C] hover:text-[#004980] flex items-center gap-1.5"
            >
              <span>View Full Programme Directory</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {publishedProgrammes.map((prog) => (
              <div key={prog.id} className="bg-white rounded-2xl overflow-hidden border border-slate-200 flex flex-col">
                {prog.imagePath && (
                  <img
                    src={prog.imagePath}
                    alt={prog.title}
                    className="w-full h-48 object-cover bg-slate-100"
                    referrerPolicy="no-referrer"
                  />
                )}
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                      <span>{prog.category}</span>
                      <span aria-hidden="true">·</span>
                      <span>{prog.ageRange}</span>
                    </div>
                    <h3 className="font-heading text-lg font-bold text-[#1B365D]">{prog.title}</h3>
                    <p className="mt-2 text-xs text-slate-600 leading-relaxed">{prog.shortDescription}</p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-emerald-700 font-semibold tabular-nums">
                      {prog.availablePlaces} Places Open
                    </span>
                    <Link to="/programmes" className="text-xs font-bold text-[#005A9C] hover:underline">
                      Request a Place &rarr;
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold text-[#005A9C]">Safe Journey</span>
          <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-[#1B365D] mt-2">
            How a Boy Joins a Circle
          </h2>
          <p className="mt-3 text-sm text-slate-600">
            Because we work with children and young men, safeguarding comes before convenience at every stage.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((st) => (
            <div key={st.num} className="bg-white rounded-2xl p-6 border border-slate-200">
              <span className="text-3xl font-heading font-extrabold text-[#A0E0EF] block mb-3 tabular-nums">
                {st.num}
              </span>
              <h3 className="font-heading text-base font-bold text-[#1B365D] mb-2">{st.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{st.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Latest News & Community Stories (CMS-driven) */}
      {publishedAnnouncements.length > 0 && (
        <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-heading text-2xl font-extrabold text-[#1B365D]">
                Community Updates &amp; Stories
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                News from Uganda chapter circles, schools, and parent dialogues.
              </p>
            </div>
            <Link to="/events-news" className="text-xs font-bold text-[#005A9C] hover:underline flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>All Events &amp; News</span>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {publishedAnnouncements.map((ann) => (
              <div key={ann.id} className="bg-white rounded-2xl p-6 border border-slate-200 space-y-2">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="capitalize font-semibold text-[#005A9C]">{ann.type}</span>
                  <span aria-hidden="true">·</span>
                  <span>{ann.district}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">{ann.publishedDate}</span>
                </div>
                <h3 className="font-heading text-base font-bold text-[#1B365D]">{ann.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{ann.summary}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* WhatsApp Brotherhood Community Banner */}
      <section className="py-14 bg-gradient-to-r from-emerald-900 via-[#1B365D] to-[#12243E] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="rounded-3xl bg-white/5 border border-white/10 p-8 sm:p-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-8 space-y-4">
                <div className="text-xs font-bold text-emerald-300">
                  Social Organisation to Unite Boys · Uganda
                </div>
                <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-white">
                  Join the Boys WhatsApp Brotherhood Community
                </h2>
                <p className="text-sm text-slate-200 leading-relaxed max-w-2xl">
                  Connect directly with our community on WhatsApp at{' '}
                  <strong className="text-emerald-400 font-mono text-base">{cms.whatsappNumber}</strong> for study accountability, Saturday circle locations, and positive male mentorship updates.
                </p>
              </div>

              <div className="lg:col-span-4 flex flex-col gap-3">
                <a
                  href={`https://wa.me/256${cms.whatsappNumber.replace(/^0/, '')}?text=Hello%20Boy%20Child%20Association%2C%20I%20am%20reaching%20out%20to%20connect%20with%20the%20boys%20brotherhood%20group`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-4 px-6 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold text-sm rounded-2xl text-center flex items-center justify-center gap-2 min-h-[48px]"
                >
                  <span>Connect on WhatsApp ({cms.whatsappNumber})</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
                <Link
                  to="/join"
                  className="w-full py-3.5 px-6 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-2xl border border-white/20 text-center min-h-[44px] flex items-center justify-center"
                >
                  Register as Member, Guardian or Partner
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQs (CMS-driven) */}
      <section className="py-14 max-w-4xl mx-auto px-4 sm:px-6 space-y-6">
        <div className="text-center">
          <h2 className="font-heading text-2xl font-extrabold text-[#1B365D]">
            Safeguarding &amp; Membership Questions
          </h2>
        </div>
        <div className="space-y-3">
          {cms.faqs.map((faq) => {
            const isOpen = openFaqId === faq.id;
            return (
              <div key={faq.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <button
                  onClick={() => setOpenFaqId(isOpen ? null : faq.id)}
                  className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 font-heading text-sm font-bold text-[#1B365D] min-h-[48px]"
                >
                  <span>{faq.question}</span>
                  {isOpen ? <ChevronUp className="w-4 h-4 shrink-0" /> : <ChevronDown className="w-4 h-4 shrink-0" />}
                </button>
                {isOpen && (
                  <div className="px-5 pb-4 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Safeguarding Commitment Banner */}
      <section className="py-12 bg-[#1B365D] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-3 max-w-2xl">
              <div className="flex items-center gap-2 text-xs font-bold text-[#60C1E5]">
                <ShieldCheck className="w-5 h-5 text-[#60C1E5]" />
                <span>Our Uncompromising Safety Standard</span>
              </div>
              <h3 className="font-heading text-2xl font-bold text-white">
                Child Safety, Dignity &amp; Privacy First
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Mentors are vetted with two verified referees and background checks. Direct 1-on-1 private messaging with minors is forbidden. Concerns can be reported confidentially 24/7 or via Sauti {cms.helplineNumber}.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 shrink-0">
              <Link
                to="/resources"
                className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs min-h-[44px] flex items-center justify-center gap-2 border border-white/20"
              >
                <BookOpen className="w-4 h-4" />
                <span>Resources</span>
              </Link>
              <Link
                to="/safeguarding"
                className="px-5 py-3 rounded-xl bg-white text-[#1B365D] font-bold text-xs hover:bg-slate-100 min-h-[44px] flex items-center justify-center"
              >
                Read Safeguarding Policy
              </Link>
              <Link
                to="/report-concern"
                className="px-5 py-3 rounded-xl bg-[#DC2626] text-white font-bold text-xs hover:bg-[#B91C1C] min-h-[44px] flex items-center justify-center gap-2"
              >
                <AlertCircle className="w-4 h-4" />
                <span>Report Concern</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <SafeguardingConcernModal
        isOpen={concernModalOpen}
        onClose={() => setConcernModalOpen(false)}
      />
    </div>
  );
};
