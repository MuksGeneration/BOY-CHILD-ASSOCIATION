import React, { useState } from 'react';
import { ShieldCheck, AlertCircle, PhoneCall, CheckCircle2, Lock, FileText } from 'lucide-react';
import { SafeguardingConcernModal } from '../../components/common/SafeguardingConcernModal';

export const SafeguardingPage: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="bg-[#F8FAFC] min-h-screen py-10 sm:py-14">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-10">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-xs font-semibold text-[#005A9C] mb-3">
            <ShieldCheck className="w-4 h-4 text-[#005A9C]" />
            <span>Uganda Children Act (Cap 59) Compliance</span>
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl font-extrabold text-[#1B365D]">
            Child Safeguarding &amp; Protection Policy
          </h1>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">
            Our solemn commitment to the physical, emotional, and digital safety of every boy in Uganda.
          </p>
        </div>

        {/* Emergency Callout */}
        <div className="bg-[#DC2626] text-white rounded-2xl p-6 sm:p-8 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2 font-bold text-sm text-white/90">
              <AlertCircle className="w-5 h-5 text-white" />
              <span>Immediate Child Danger Helpline</span>
            </div>
            <h2 className="font-heading text-xl font-bold">
              Is a child in immediate physical harm?
            </h2>
            <p className="text-xs text-white/90 max-w-md">
              Call the National Child Helpline (Sauti) toll-free on <strong>116</strong> or the Uganda Police CFPU on <strong>0800 199 699</strong> immediately.
            </p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="px-6 py-3 bg-white text-[#DC2626] font-bold text-xs rounded-xl shadow-md hover:bg-slate-100 transition-colors shrink-0 min-h-[44px]"
          >
            File Confidential BCA Report
          </button>
        </div>

        {/* Core Principles */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
          <h2 className="font-heading text-xl font-bold text-[#1B365D] pb-3 border-b border-slate-100">
            1. Zero-Tolerance Statement
          </h2>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            The Boy Child Association operates under a strict, non-negotiable zero-tolerance policy against any form of physical violence, emotional abuse, verbal degradation, sexual exploitation, or neglect. All adults working with or volunteering for the Association are legally bound to uphold the welfare and best interests of the child as their paramount consideration.
          </p>

          <h2 className="font-heading text-xl font-bold text-[#1B365D] pt-4 pb-3 border-b border-slate-100">
            2. Mandatory Mentor Code of Conduct
          </h2>
          <div className="space-y-3 text-xs sm:text-sm text-slate-700">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-[#005A9C] shrink-0 mt-1" />
              <span><strong>The Two-Adult Rule:</strong> No circle meeting, vocational workshop, or recreational activity may be conducted by a lone mentor. At least two background-checked adults must be present at all times.</span>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-[#005A9C] shrink-0 mt-1" />
              <span><strong>Prohibition on Private Messaging:</strong> Mentors are strictly forbidden from initiating private 1-on-1 chats, WhatsApp conversations, or direct messages with minors outside supervised circle channels.</span>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-[#005A9C] shrink-0 mt-1" />
              <span><strong>No Secret Gifts or Financial Inducements:</strong> Mentors shall not provide personal cash, mobile money transfers, or private gifts to individual boys. All community support must flow through registered welfare accounts.</span>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-[#005A9C] shrink-0 mt-1" />
              <span><strong>Transparent Locations:</strong> All circle sessions occur in designated community centres, school halls, or open spaces visible to community members. Private home visits are strictly prohibited without written coordinator and parental authorisation.</span>
            </div>
          </div>

          <h2 className="font-heading text-xl font-bold text-[#1B365D] pt-4 pb-3 border-b border-slate-100">
            3. Digital Safety &amp; Minor Privacy
          </h2>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            In compliance with Uganda’s Data Protection and Privacy Act 2019:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-slate-700">
            <li>No identifiable photographs or video recordings of boys under 18 may be published publicly without explicit written guardian consent.</li>
            <li>Personal contact numbers, addresses, and family circumstances are encrypted and accessible only by certified safeguarding leads.</li>
            <li>Our digital platform features automated scanners that detect and block the transmission of phone numbers, emails, and social media handles in youth threads.</li>
          </ul>

          <h2 className="font-heading text-xl font-bold text-[#1B365D] pt-4 pb-3 border-b border-slate-100">
            4. Whistleblowing &amp; Safe Reporting
          </h2>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            Anyone—including boys, parents, community members, or volunteers—who observes behaviour that breaches our code of conduct has an ethical and civic obligation to report it immediately. Reports can be submitted anonymously and will be investigated without fear of retaliation.
          </p>
        </div>

        <SafeguardingConcernModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
      </div>
    </div>
  );
};
