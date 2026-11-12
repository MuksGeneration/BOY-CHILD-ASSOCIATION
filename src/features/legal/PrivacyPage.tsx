import React from 'react';
import { ShieldCheck, Lock, FileText, CheckCircle2 } from 'lucide-react';

export const PrivacyPage: React.FC = () => {
  return (
    <div className="bg-[#F8FAFC] min-h-screen py-10 sm:py-14">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-8">
        <div className="text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-xs font-semibold text-[#005A9C] mb-3">
            <ShieldCheck className="w-4 h-4 text-[#005A9C]" />
            <span>Uganda Data Protection and Privacy Act, 2019</span>
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl font-extrabold text-[#1B365D]">
            Privacy Policy &amp; Data Rights
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-500">
            Last updated: November 2026 · Flagged for ongoing legal compliance review
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6 text-xs sm:text-sm text-slate-700 leading-relaxed">
          <section>
            <h2 className="font-heading text-lg font-bold text-[#1B365D] mb-2">
              1. Introduction &amp; Statutory Authority
            </h2>
            <p>
              The Boy Child Association (BCA) Uganda is committed to processing all personal data in strict compliance with the <strong>Data Protection and Privacy Act, 2019</strong> and the <strong>Children Act (Cap 59)</strong> of the Republic of Uganda. We recognise that personal data pertaining to children represents special category data demanding elevated physical, technical, and organisational protection.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-bold text-[#1B365D] mb-2">
              2. Minimum Data Collection Principle
            </h2>
            <p>
              We adhere strictly to the principle of data minimisation. We collect only what is strictly necessary to ensure the physical safety and mentorship of boys in our community circles:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong>Member Details:</strong> Full name, age/date of birth (to enforce child consent guards), town/district, and vocational interests.</li>
              <li><strong>Guardian Details:</strong> Mandatory for all boys under 18 years old. We collect the guardian’s verified phone number and full name for legal consent and emergency contacts.</li>
              <li><strong>Mentors &amp; Volunteers:</strong> Identity verification, professional occupation, motivation, and two verified community references.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-lg font-bold text-[#1B365D] mb-2">
              3. Protection of Children&apos;s Imagery &amp; Identity
            </h2>
            <p>
              No identifiable pictures or video recordings of minors are published on public dashboards, marketing materials, or public social channels without prior written informed consent from both the child and their legal guardian.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-bold text-[#1B365D] mb-2">
              4. Data Subject Rights &amp; Deletion
            </h2>
            <p>
              Under Sections 24 to 28 of the Uganda Data Protection and Privacy Act 2019, any registered user, parent, or legal guardian retains the right to:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Request an electronic copy of all personal records held by BCA.</li>
              <li>Request correction or updating of inaccurate contact information.</li>
              <li>Request permanent deletion (&ldquo;right to be forgotten&rdquo;) of their profile upon leaving the association.</li>
            </ul>
            <p className="mt-2">
              To exercise these rights, email our Data Protection Officer at <strong className="text-[#005A9C]">dpo@boychild.org</strong> or contact our Kampala headquarters.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};
