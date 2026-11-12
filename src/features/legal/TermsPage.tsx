import React from 'react';
import { ShieldCheck, FileCheck } from 'lucide-react';

export const TermsPage: React.FC = () => {
  return (
    <div className="bg-[#F8FAFC] min-h-screen py-10 sm:py-14">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-8">
        <div className="text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-xs font-semibold text-[#005A9C] mb-3">
            <FileCheck className="w-4 h-4 text-[#005A9C]" />
            <span>Community Agreement</span>
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl font-extrabold text-[#1B365D]">
            Terms of Service &amp; Consent
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-500">
            Governing participation, guardian authorization, and circle conduct in Uganda.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6 text-xs sm:text-sm text-slate-700 leading-relaxed">
          <section>
            <h2 className="font-heading text-lg font-bold text-[#1B365D] mb-2">
              1. Acceptance of Community Standards
            </h2>
            <p>
              By joining the Boy Child Association (BCA) Uganda as a boy member, guardian, mentor, or institutional partner, you agree to treat every member with respect, dignity, and care. Bullying, physical violence, hazing, harassment, and discrimination of any kind are grounds for immediate termination and referral to local authorities.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-bold text-[#1B365D] mb-2">
              2. Guardian Authorization for Minors
            </h2>
            <p>
              Under Ugandan law, boys under the age of 18 must have recorded consent from a parent, foster parent, or legal guardian. An account registered for a minor remains in <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800">pending_guardian_consent</code> status and is legally barred from circle participation or messaging until consent is validated.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-bold text-[#1B365D] mb-2">
              3. Mentor Obligations
            </h2>
            <p>
              Mentors act as non-compensated voluntary role models. Mentors accept the BCA Child Safeguarding Code of Conduct, confirm clean legal records, and submit to continuous administrative auditing.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-bold text-[#1B365D] mb-2">
              4. Governing Law
            </h2>
            <p>
              These terms are governed by and construed in accordance with the laws of the Republic of Uganda. Any disputes arising shall be subject to the jurisdiction of the courts of Uganda.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};
