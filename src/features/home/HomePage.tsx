import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Users,
  Compass,
  Hammer,
  ArrowRight,
  HeartHandshake,
  CheckCircle2,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { SafeguardingConcernModal } from '../../components/common/SafeguardingConcernModal';

export const HomePage: React.FC = () => {
  const [concernModalOpen, setConcernModalOpen] = useState(false);

  const pillars = [
    {
      title: 'Support',
      lead: 'Mental Health & Emotional Safety',
      desc: 'Creating judgment-free spaces where boys can express anxiety, grief, and school stress before it becomes anger or isolation.',
      icon: HeartHandshake,
      color: 'bg-blue-50 text-[#005A9C] border-blue-100'
    },
    {
      title: 'Unite',
      lead: 'Small Peer Circles',
      desc: 'Forming tight-knit brotherhood circles of 8–10 boys in local communities who hold each other accountable and celebrate positive growth.',
      icon: Users,
      color: 'bg-cyan-50 text-[#005A9C] border-cyan-100'
    },
    {
      title: 'Guide',
      lead: 'Elder & Professional Mentorship',
      desc: 'Screened and vetted male role models providing consistent, practical guidance on character, integrity, and respectful relationships.',
      icon: Compass,
      color: 'bg-amber-50 text-amber-900 border-amber-100'
    },
    {
      title: 'Empower',
      lead: 'Practical 21st-Century Crafts',
      desc: 'Hands-on training in solar electronics, electrical repair, robotics, and academic problem-solving for sustainable self-reliance.',
      icon: Hammer,
      color: 'bg-emerald-50 text-emerald-900 border-emerald-100'
    }
  ];

  const steps = [
    {
      num: '01',
      title: 'Join or Refer a Boy',
      text: 'A parent, teacher, or young man registers online. Basic contact details and community location are submitted.'
    },
    {
      num: '02',
      title: 'Guardian Consent & Verification',
      text: 'For boys under 18, our team verifies parent or guardian consent in accordance with the Uganda Children Act.'
    },
    {
      num: '03',
      title: 'Circle Matching',
      text: 'The boy is welcomed into a weekly neighborhood circle guided by two thoroughly vetted adult mentors.'
    },
    {
      num: '04',
      title: 'Growth & Accountability',
      text: 'Participate in life skills, academic tutoring, craft training, and peer sports with continuous safeguarding monitoring.'
    }
  ];

  return (
    <div className="bg-[#F8FAFC]">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#1B365D] to-[#12243E] text-white py-16 sm:py-24">
        {/* Subtle grid background */}
        <div className="absolute inset-0 bg-[radial-gradient(#60C1E5_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content Column */}
            <div className="lg:col-span-7 space-y-6">
              <div className="flex flex-wrap items-center gap-3">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-semibold text-[#A0E0EF]">
                  <ShieldCheck className="w-4 h-4 text-[#60C1E5]" />
                  <span>Uganda Child Protection Certified</span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#60C1E5]/20 text-[#60C1E5] text-xs font-bold uppercase tracking-wider">
                  <span>Motto: Standing Up As A Man</span>
                </div>
              </div>

              <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight text-white text-balance">
                Every boy deserves a circle that has his back.
              </h1>

              <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl">
                The Boy Child Association unites, guides, and empowers boys and young men across Uganda. Through safe neighborhood circles, principled mentors, and practical vocational skills, we foster resilient, respectful, and purposeful leaders.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  to="/join"
                  className="px-6 py-3.5 rounded-xl bg-[#60C1E5] hover:bg-[#A0E0EF] text-[#1B365D] font-bold text-sm transition-all shadow-lg hover:shadow-cyan-500/20 flex items-center gap-2 min-h-[44px]"
                >
                  <span>Join a Circle Today</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <a
                  href="https://wa.me/256732320190?text=Hello%20Boy%20Child%20Association%2C%20I%20would%20like%20to%20join%20the%20boys%20WhatsApp%20group"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-md flex items-center gap-2 min-h-[44px]"
                  title="Connect with our WhatsApp Community on 0732320190"
                >
                  <span>Join WhatsApp: 0732320190</span>
                </a>

                <Link
                  to="/programmes"
                  className="px-5 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-sm transition-colors border border-white/20 min-h-[44px]"
                >
                  Explore Programmes
                </Link>

                <button
                  onClick={() => setConcernModalOpen(true)}
                  className="px-4 py-3.5 rounded-xl bg-[#DC2626]/90 hover:bg-[#DC2626] text-white font-bold text-xs transition-colors flex items-center gap-1.5 min-h-[44px]"
                >
                  <AlertCircle className="w-4 h-4" />
                  <span>Report a Concern</span>
                </button>
              </div>

              {/* Social Proof adjacency */}
              <div className="pt-6 border-t border-white/10 grid grid-cols-3 gap-4 text-left">
                <div>
                  <div className="font-heading font-extrabold text-2xl text-[#60C1E5] tabular-nums">
                    1,200+
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">Active Boys in Circles</div>
                </div>
                <div>
                  <div className="font-heading font-extrabold text-2xl text-[#60C1E5] tabular-nums">
                    85+
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">Vetted Community Mentors</div>
                </div>
                <div>
                  <div className="font-heading font-extrabold text-2xl text-[#60C1E5] tabular-nums">
                    14
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">Uganda Districts</div>
                </div>
              </div>
            </div>

            {/* Right Media Column - High fidelity authentic photograph */}
            <div className="lg:col-span-5">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/10 group">
                {/* Floating Official Emblem Badge */}
                <div className="absolute top-4 left-4 p-2 rounded-2xl bg-white/95 backdrop-blur-md border border-white/20 shadow-xl flex items-center gap-2.5 z-10">
                  <img
                    src="/assets/aistudio/Screenshot_20260801_081145_WhatsApp__1__8a50926e.jpg"
                    alt="Boy Child Association Official Logo"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = '/logo.png';
                    }}
                    className="w-11 h-11 object-contain rounded-full shadow-xs"
                  />
                  <div className="pr-2 text-left">
                    <span className="font-heading font-extrabold text-xs text-[#1B365D] block leading-none">
                      BOY CHILD ASSOCIATION
                    </span>
                    <span className="text-[10px] font-bold text-[#005A9C]">
                      Standing Up As A Man
                    </span>
                  </div>
                </div>

                <img
                  src="/images/hero_boys_circle_1794461657319.jpg"
                  alt="Ugandan boys gathered in a supportive outdoor mentorship circle with an elder mentor"
                  className="w-full h-80 sm:h-96 object-cover transform group-hover:scale-102 transition-transform duration-500 bg-[#1B365D]"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1B365D] via-transparent to-transparent opacity-80" />
                <div className="absolute bottom-4 left-4 right-4 p-4 rounded-xl bg-[#1B365D]/80 backdrop-blur-md border border-white/10 text-white text-xs">
                  <div className="font-bold text-[#60C1E5]">Kampala Central Circle #3</div>
                  <div className="text-slate-300 text-[11px] mt-0.5">
                    Elder mentor Patrick facilitating Saturday dialogue on resilience and integrity.
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
          <span className="text-xs font-bold uppercase tracking-widest text-[#005A9C]">
            Our Foundation
          </span>
          <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-[#1B365D] mt-2">
            The Four Pillars of the Boy Child
          </h2>
          <p className="mt-3 text-sm text-slate-600 leading-relaxed">
            Every programme we run is designed around four interdependent principles that address the real emotional, social, and practical realities Ugandan boys navigate daily.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {pillars.map((p) => {
            const Icon = p.icon;
            return (
              <div
                key={p.title}
                className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 border ${p.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-heading text-lg font-bold text-[#1B365D]">{p.title}</h3>
                  <div className="text-xs font-semibold text-[#005A9C] mt-0.5">{p.lead}</div>
                  <p className="mt-3 text-xs text-slate-600 leading-relaxed">{p.desc}</p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center text-xs font-bold text-[#005A9C]">
                  <span>Integrated in all circles</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Featured Programmes Spotlight */}
      <section className="py-16 bg-[#F4F8FC] border-y border-blue-100/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-10">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-[#005A9C]">
                Active Initiatives
              </span>
              <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-[#1B365D] mt-1">
                Featured Programmes
              </h2>
            </div>
            <Link
              to="/programmes"
              className="text-xs font-bold text-[#005A9C] hover:text-[#004980] flex items-center gap-1.5"
            >
              <span>View All 5 Programmes</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Programme 1 */}
            <div className="bg-white rounded-2xl overflow-hidden border border-slate-200/80 shadow-xs flex flex-col">
              <img
                src="/images/programme_mentorship_1794461658375.jpg"
                alt="Brothers in Purpose circle mentorship session"
                className="w-full h-48 object-cover bg-slate-100"
                referrerPolicy="no-referrer"
              />
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                    <span>Mentorship</span>
                    <span aria-hidden="true">·</span>
                    <span>Ages 10 – 19</span>
                  </div>
                  <h3 className="font-heading text-lg font-bold text-[#1B365D]">
                    Brothers in Purpose
                  </h3>
                  <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                    Small peer circles led by background-checked mentors focusing on integrity, emotional vocabulary, and resisting peer pressure.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-emerald-700 font-semibold">35 Places Open</span>
                  <Link
                    to="/programmes"
                    className="text-xs font-bold text-[#005A9C] hover:underline"
                  >
                    Request a Place &rarr;
                  </Link>
                </div>
              </div>
            </div>

            {/* Programme 2 */}
            <div className="bg-white rounded-2xl overflow-hidden border border-slate-200/80 shadow-xs flex flex-col">
              <img
                src="/images/programme_skills_1794461658653.jpg"
                alt="Boys learning practical solar robotics and electronics"
                className="w-full h-48 object-cover bg-slate-100"
                referrerPolicy="no-referrer"
              />
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                    <span>Skills &amp; Tech</span>
                    <span aria-hidden="true">·</span>
                    <span>Ages 12 – 24</span>
                  </div>
                  <h3 className="font-heading text-lg font-bold text-[#1B365D]">
                    Digital Crafts &amp; Solar Tinkering
                  </h3>
                  <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                    Vocational hands-on electronics, computer problem-solving, and clean energy assembly for self-reliance.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-emerald-700 font-semibold">18 Places Open</span>
                  <Link
                    to="/programmes"
                    className="text-xs font-bold text-[#005A9C] hover:underline"
                  >
                    Request a Place &rarr;
                  </Link>
                </div>
              </div>
            </div>

            {/* Programme 3 */}
            <div className="bg-white rounded-2xl overflow-hidden border border-slate-200/80 shadow-xs flex flex-col">
              <img
                src="/images/programme_wellbeing_1794461659186.jpg"
                alt="Ugandan boys celebrating teamwork during sports wellbeing session"
                className="w-full h-48 object-cover bg-slate-100"
                referrerPolicy="no-referrer"
              />
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                    <span>Wellbeing</span>
                    <span aria-hidden="true">·</span>
                    <span>Ages 7 – 22</span>
                  </div>
                  <h3 className="font-heading text-lg font-bold text-[#1B365D]">
                    Safe Minds &amp; Strong Hearts
                  </h3>
                  <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                    Trauma-informed mental health, sports-based therapy, and safe spaces to speak without fear or ridicule.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-emerald-700 font-semibold">40 Places Open</span>
                  <Link
                    to="/programmes"
                    className="text-xs font-bold text-[#005A9C] hover:underline"
                  >
                    Request a Place &rarr;
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - Step-by-Step Safeguarding Flow */}
      <section className="py-16 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-[#005A9C]">
            Safe Journey
          </span>
          <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-[#1B365D] mt-2">
            How a Boy Joins a Circle
          </h2>
          <p className="mt-3 text-sm text-slate-600">
            Because we work with minors, safeguarding comes before convenience. Every step is monitored by child protection specialists.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((st) => (
            <div key={st.num} className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs relative">
              <span className="text-3xl font-heading font-extrabold text-[#A0E0EF] block mb-3">
                {st.num}
              </span>
              <h3 className="font-heading text-base font-bold text-[#1B365D] mb-2">
                {st.title}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">{st.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Social Organization to Unite Boys: WhatsApp Community Section */}
      <section className="py-14 bg-gradient-to-r from-emerald-900 via-[#1B365D] to-[#12243E] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="rounded-3xl bg-white/5 border border-white/10 p-8 sm:p-12 relative overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-8 space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold uppercase tracking-wider">
                  <span>Social Organisation to Unite Boys · Uganda</span>
                </div>
                <h2 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white">
                  Join the Boys WhatsApp Brotherhood Community
                </h2>
                <p className="text-sm text-slate-200 leading-relaxed max-w-2xl">
                  We are a social organization dedicated to uniting boys into positive, supportive brotherhood circles. Connect directly with our community on WhatsApp at <strong className="text-emerald-400 font-mono text-base">0732320190</strong> for daily inspiration, study accountability, session announcements, and positive male mentorship.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs text-slate-300">
                  <div className="bg-white/10 p-3 rounded-xl border border-white/10">
                    <span className="font-bold text-white block">Official Number:</span>
                    <span className="text-emerald-300 font-mono text-sm font-semibold">0732320190</span>
                  </div>
                  <div className="bg-white/10 p-3 rounded-xl border border-white/10">
                    <span className="font-bold text-white block">Moderated &amp; Safe:</span>
                    <span>Overseen by child safety leads</span>
                  </div>
                  <div className="bg-white/10 p-3 rounded-xl border border-white/10">
                    <span className="font-bold text-white block">All Uganda Chapters:</span>
                    <span>Kampala, Wakiso, Jinja, Gulu</span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-4 flex flex-col gap-3">
                <a
                  href="https://wa.me/256732320190?text=Hello%20Boy%20Child%20Association%2C%20I%20am%20reaching%20out%20to%20connect%20with%20the%20boys%20brotherhood%20group"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-4 px-6 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold text-sm rounded-2xl shadow-xl hover:shadow-emerald-500/30 transition-all text-center flex items-center justify-center gap-2 min-h-[48px]"
                >
                  <span>Connect on WhatsApp (0732320190)</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
                <Link
                  to="/join"
                  className="w-full py-3.5 px-6 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-2xl border border-white/20 transition-colors text-center min-h-[44px]"
                >
                  Register as Member or Guardian
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Safeguarding Commitment Banner */}
      <section className="py-12 bg-[#1B365D] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-3 max-w-2xl">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#60C1E5]">
                <ShieldCheck className="w-5 h-5 text-[#60C1E5]" />
                <span>Our Uncompromising Safety Standard</span>
              </div>
              <h3 className="font-heading text-2xl font-bold text-white">
                Child Safety, Dignity &amp; Privacy First
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Mentors are vetted with two verified referees and background checks. Direct 1-on-1 private messaging with minors is forbidden. Personal contacts are never displayed, and concerns can be reported confidentially 24/7.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 shrink-0">
              <Link
                to="/safeguarding"
                className="px-5 py-3 rounded-xl bg-white text-[#1B365D] font-bold text-xs hover:bg-slate-100 transition-colors min-h-[44px] flex items-center justify-center"
              >
                Read Safeguarding Policy
              </Link>
              <button
                onClick={() => setConcernModalOpen(true)}
                className="px-5 py-3 rounded-xl bg-[#DC2626] text-white font-bold text-xs hover:bg-[#B91C1C] transition-colors min-h-[44px] flex items-center justify-center gap-2 shadow"
              >
                <AlertCircle className="w-4 h-4" />
                <span>Report Concern</span>
              </button>
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
