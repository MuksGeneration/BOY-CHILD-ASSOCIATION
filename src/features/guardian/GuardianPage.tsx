import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { mockStore } from '../../lib/firebase/mockStore';
import { firebaseService } from '../../lib/firebase/firebase';
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  UserCheck,
  AlertCircle,
  FileCheck,
  Calendar,
  Users
} from 'lucide-react';

export const GuardianPage: React.FC = () => {
  const { user } = useAuth();
  const [consentActionSuccess, setConsentActionSuccess] = useState<string | null>(null);

  // Linked boys in Uganda database
  const allUsers = Object.values(mockStore.users);
  const linkedBoys = allUsers.filter(
    (u) => u.guardianId === user?.uid || u.guardianPhone === user?.phone
  );

  const circles = firebaseService.getCircles();

  const handleGrantConsent = (boyUid: string, boyName: string) => {
    firebaseService.approveGuardianConsent(boyUid, user?.uid || 'usr_guardian_grace');
    setConsentActionSuccess(`Legal consent recorded for ${boyName}. Account activated.`);
    setTimeout(() => setConsentActionSuccess(null), 3500);
  };

  return (
    <div className="bg-[#F8FAFC] min-h-screen py-10 sm:py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
        {/* Header */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src="/assets/aistudio/Screenshot_20260801_081145_WhatsApp__1__8a50926e.jpg"
              alt="Boy Child Association Official Logo"
              className="w-14 h-14 object-contain rounded-full shadow-sm bg-white border border-slate-200 shrink-0 hidden sm:block"
            />
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#005A9C]">
                <ShieldCheck className="w-4 h-4 text-[#005A9C]" />
                <span>Uganda Parent &amp; Guardian Safeguarding Console</span>
                <span aria-hidden="true">·</span>
                <span className="text-slate-500">Standing Up As A Man</span>
              </div>
              <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-[#1B365D] mt-1">
                Guardian Portal: {user?.fullName}
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Authorised guardian registered under Uganda Children Act. Responsible for legal consent and monitoring.
              </p>
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-200 px-3.5 py-1.5 rounded-xl text-xs font-bold text-[#005A9C]">
            {linkedBoys.length} Registered {linkedBoys.length === 1 ? 'Boy' : 'Boys'}
          </div>
        </div>

        {consentActionSuccess && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{consentActionSuccess}</span>
          </div>
        )}

        {/* Linked Boys Consent Overview */}
        <div className="space-y-4">
          <h2 className="font-heading text-lg font-bold text-[#1B365D]">
            Registered Children &amp; Consent Verification
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {linkedBoys.map((boy) => {
              const boyCircle = circles.find((c) => c.id === boy.circleId);
              const isPending = boy.status === 'pending_guardian_consent';

              return (
                <div
                  key={boy.uid}
                  className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                      <div>
                        <h3 className="font-heading text-base font-bold text-[#1B365D]">
                          {boy.fullName}
                        </h3>
                        <p className="text-xs text-slate-500">
                          Age: {boy.calculatedAge || 15} Years · District: {boy.district || 'Wakiso'}
                        </p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        isPending
                          ? 'bg-amber-100 text-amber-900 border border-amber-200'
                          : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                      }`}>
                        {isPending ? 'Consent Pending' : 'Consent Approved'}
                      </span>
                    </div>

                    <div className="py-4 space-y-3 text-xs">
                      {isPending ? (
                        <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 space-y-2">
                          <div className="flex items-center gap-2 font-bold">
                            <Clock className="w-4 h-4 text-amber-700 shrink-0" />
                            <span>Action Required by Guardian</span>
                          </div>
                          <p className="leading-relaxed">
                            {boy.fullName.split(' ')[0]} cannot join his circle or attend Saturday sessions until you review and digitally approve our Child Protection Agreement.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-slate-700">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">
                              Assigned Community Circle
                            </span>
                            <span className="font-bold text-[#1B365D]">
                              {boyCircle ? boyCircle.name : 'Kampala Central Champions Circle'}
                            </span>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              Meeting: Every Saturday at 10:00 AM · Lead Mentor: Emmanuel Okello
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="pt-2 text-slate-600">
                        <span className="font-semibold text-slate-800">Child Safeguarding Rights:</span>
                        <ul className="list-disc pl-4 mt-1 space-y-1 text-[11px]">
                          <li>No mentor may contact your child privately via phone or social media.</li>
                          <li>You may attend any Saturday circle open observation session.</li>
                          <li>All session attendance is logged and verified with you via SMS.</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100">
                    {isPending ? (
                      <button
                        onClick={() => handleGrantConsent(boy.uid, boy.fullName)}
                        className="w-full py-3 bg-[#005A9C] hover:bg-[#004980] text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 min-h-[44px]"
                      >
                        <UserCheck className="w-4 h-4 text-[#60C1E5]" />
                        <span>Grant Formal Guardian Consent</span>
                      </button>
                    ) : (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-emerald-700 font-semibold flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Protected &amp; Active in Circle</span>
                        </span>
                        <button
                          onClick={() => alert(`Coordinator Sister Sarah Nabirye has been sent an SMS inquiry regarding ${boy.fullName}.`)}
                          className="text-[#005A9C] hover:underline font-semibold"
                        >
                          Contact Coordinator &rarr;
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Legal Consent Terms Explainer */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center gap-2 font-heading font-bold text-base text-[#1B365D]">
            <FileCheck className="w-5 h-5 text-[#005A9C]" />
            <span>Uganda Child Law &amp; Data Protection Compliance</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
            In compliance with the Data Protection and Privacy Act 2019 and the Children Act (Cap 59) of Uganda, personal data concerning children is treated as special category information. Photos of minors are never made public. Guardians hold the right to revoke consent, request deletion of data, or inspect circle logs at any point.
          </p>
        </div>
      </div>
    </div>
  );
};
