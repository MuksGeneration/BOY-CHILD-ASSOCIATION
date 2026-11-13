import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { concernReportSchema, ConcernReportInput } from '../../lib/validation/schemas';
import { UGANDA_DISTRICTS } from '../../lib/validation/ugandaDistricts';
import { firebaseService } from '../../lib/firebase/firebase';
import { ShieldAlert, PhoneCall, Lock, CheckCircle2, AlertTriangle } from 'lucide-react';

export const ReportConcernPage: React.FC = () => {
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ConcernReportInput>({
    resolver: zodResolver(concernReportSchema),
    defaultValues: {
      isAnonymous: false,
      urgency: 'medium',
      district: 'Kampala',
      concernCategory: 'emotional_distress',
      consentToInvestigation: true,
      details: '',
    },
  });

  const isAnonymous = watch('isAnonymous');

  const onSubmit = async (data: ConcernReportInput) => {
    const res = await firebaseService.submitConcernReport({
      isAnonymous: data.isAnonymous,
      reporterName: data.isAnonymous ? undefined : data.reporterName,
      reporterContact: data.isAnonymous ? undefined : data.reporterContact,
      boyName: data.boyName,
      district: data.district,
      concernCategory: data.concernCategory,
      urgency: data.urgency,
      details: data.details,
    });
    setSubmittedRef(res.refNumber || res.id);
    reset();
  };

  return (
    <div className="bg-[#F8FAFC] min-h-screen py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-6">
        <div className="bg-[#DC2626] text-white rounded-2xl p-6 sm:p-8 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold">
            <ShieldAlert className="w-5 h-5" />
            <span>Confidential Safeguarding Intake</span>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-white">
            Report a Child Safety Concern
          </h1>
          <p className="text-xs sm:text-sm text-white/90">
            Access is restricted strictly to certified Safeguarding Leads and Administrators. You may submit your report signed or completely anonymously.
          </p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 text-xs text-amber-950">
          <PhoneCall className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <strong>Immediate Danger in Uganda:</strong> Call <strong>Sauti National Child Helpline on 116</strong> (24/7 toll-free) or the <strong>Uganda Police Child &amp; Family Protection Unit (CFPU) on 0800 199 699</strong>.
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8">
          {submittedRef ? (
            <div className="text-center py-8 space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-700 mx-auto" />
              <h2 className="font-heading text-xl font-bold text-[#1B365D]">
                Confidential Report Filed
              </h2>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                Reference number: <strong className="font-mono text-[#005A9C]">{submittedRef}</strong>. Our safeguarding team has logged this report and initiated triage.
              </p>
              <button
                onClick={() => setSubmittedRef(null)}
                className="mt-4 px-5 py-2.5 bg-[#1B365D] text-white text-xs font-bold rounded-xl min-h-[44px]"
              >
                File Another Report
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-xs">
              <div className="p-3 bg-[#F4F8FC] border border-blue-100 rounded-xl flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-[#1B365D] font-medium">
                  <Lock className="w-4 h-4 text-[#005A9C]" />
                  <span>Protected under Uganda Children Act Cap 59 &amp; DPPA 2019</span>
                </div>
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-[#1B365D] min-h-[40px]">
                  <input
                    type="checkbox"
                    {...register('isAnonymous')}
                    className="w-4 h-4 rounded border-slate-300 text-[#DC2626]"
                  />
                  <span>Submit Anonymously</span>
                </label>
              </div>

              {!isAnonymous && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Your Name *</label>
                    <input
                      type="text"
                      {...register('reporterName')}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 min-h-[44px]"
                    />
                    {errors.reporterName && <p className="text-[#DC2626] mt-1">{errors.reporterName.message}</p>}
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Your Contact *</label>
                    <input
                      type="text"
                      {...register('reporterContact')}
                      placeholder="0772XXXXXX"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 min-h-[44px]"
                    />
                    {errors.reporterContact && <p className="text-[#DC2626] mt-1">{errors.reporterContact.message}</p>}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Affected Boy (Optional)</label>
                  <input
                    type="text"
                    {...register('boyName')}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 min-h-[44px]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">District *</label>
                  <select {...register('district')} className="w-full px-3 py-2 rounded-xl border border-slate-300 min-h-[44px]">
                    {UGANDA_DISTRICTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category *</label>
                  <select {...register('concernCategory')} className="w-full px-3 py-2 rounded-xl border border-slate-300 min-h-[44px]">
                    <option value="emotional_distress">Emotional Distress / Depression</option>
                    <option value="physical_harm">Physical Harm or Threat</option>
                    <option value="bullying_or_violence">Bullying / School Violence</option>
                    <option value="neglect">Neglect / Deprivation</option>
                    <option value="exploitation_or_labour">Child Labour / Exploitation</option>
                    <option value="substance_abuse">Substance Abuse</option>
                    <option value="other">Other Concern</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Urgency *</label>
                  <select {...register('urgency')} className="w-full px-3 py-2 rounded-xl border border-slate-300 min-h-[44px]">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="immediate">Immediate Risk</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Concern Details *</label>
                <textarea
                  rows={4}
                  {...register('details')}
                  placeholder="Describe what happened, location, and immediate support needed."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
                {errors.details && <p className="text-[#DC2626] mt-1">{errors.details.message}</p>}
              </div>

              <label className="flex items-start gap-2 cursor-pointer text-slate-600">
                <input
                  type="checkbox"
                  {...register('consentToInvestigation')}
                  className="mt-0.5 w-4 h-4 rounded border-slate-300 text-[#DC2626]"
                />
                <span>I confirm this report is submitted in good faith for child protection triage.</span>
              </label>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold rounded-xl min-h-[44px] flex items-center justify-center gap-2"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>{isSubmitting ? 'Securing Report...' : 'Submit Safeguarding Report'}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
