import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { concernReportSchema, ConcernReportInput } from '../../lib/validation/schemas';
import { UGANDA_DISTRICTS } from '../../lib/validation/ugandaDistricts';
import { firebaseService } from '../../lib/firebase/firebase';
import { AlertTriangle, ShieldAlert, X, CheckCircle2, Lock } from 'lucide-react';

interface SafeguardingConcernModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SafeguardingConcernModal: React.FC<SafeguardingConcernModalProps> = ({ isOpen, onClose }) => {
  const [submitted, setSubmitted] = useState(false);
  const [reportId, setReportId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<ConcernReportInput>({
    resolver: zodResolver(concernReportSchema),
    defaultValues: {
      isAnonymous: false,
      urgency: 'medium',
      district: 'Kampala',
      concernCategory: 'emotional_distress',
      consentToInvestigation: true,
      details: ''
    }
  });

  const isAnonymous = watch('isAnonymous');
  const detailsValue = watch('details') || '';

  if (!isOpen) return null;

  const onSubmit = async (data: ConcernReportInput) => {
    try {
      const res = await firebaseService.submitConcernReport({
        isAnonymous: data.isAnonymous,
        reporterName: data.isAnonymous ? undefined : data.reporterName,
        reporterContact: data.isAnonymous ? undefined : data.reporterContact,
        boyName: data.boyName,
        district: data.district,
        concernCategory: data.concernCategory,
        urgency: data.urgency,
        details: data.details
      });
      setReportId(res.id);
      setSubmitted(true);
      reset();
    } catch (err) {
      console.error('Failed to submit safeguarding concern:', err);
    }
  };

  const handleClose = () => {
    setSubmitted(false);
    setReportId(null);
    reset();
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="safeguarding-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 overflow-y-auto"
    >
      <div className="relative w-full max-w-xl rounded-2xl bg-white shadow-2xl overflow-hidden my-8">
        {/* Header with Safeguarding Red Banner */}
        <div className="bg-[#DC2626] px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 id="safeguarding-modal-title" className="text-lg font-bold leading-tight">
                Report a Safeguarding Concern
              </h2>
              <p className="text-xs text-white/90">
                Confidential · Handled directly by certified child protection leads
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10"
            aria-label="Close concern modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {submitted ? (
            <div className="text-center py-6">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-[#1B365D]">Report Received Securely</h3>
              <p className="mt-2 text-sm text-slate-600 max-w-md mx-auto">
                Thank you for speaking up. Your report reference is <strong className="font-mono text-[#005A9C]">{reportId}</strong>.
                Our safeguarding coordinator will review this report with urgency.
              </p>
              <div className="mt-5 p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 text-left flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Immediate Danger?</strong> If a child is facing imminent bodily harm, contact the Uganda Police Child and Family Protection Unit (CFPU) toll-free on <strong>116</strong> or <strong>0800 199 699</strong>.
                </span>
              </div>
              <button
                onClick={handleClose}
                className="mt-6 px-6 py-2.5 bg-[#1B365D] text-white rounded-xl text-sm font-semibold hover:bg-[#12243E] min-h-[44px]"
              >
                Close Window
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-[#F4F8FC] border border-blue-100 rounded-xl">
                <div className="flex items-center gap-2 text-xs text-[#1B365D] font-medium">
                  <Lock className="w-4 h-4 text-[#005A9C]" />
                  <span>Your report is encrypted and protected by Uganda privacy laws.</span>
                </div>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#1B365D] select-none min-h-[44px]">
                  <input
                    type="checkbox"
                    {...register('isAnonymous')}
                    className="w-4 h-4 rounded border-slate-300 text-[#DC2626] focus:ring-[#DC2626]"
                  />
                  <span>Submit Anonymously</span>
                </label>
              </div>

              {!isAnonymous && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Your Full Name <span className="text-[#DC2626]">*</span>
                    </label>
                    <input
                      type="text"
                      {...register('reporterName')}
                      placeholder="e.g. Grace Mukasa"
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:border-[#005A9C] focus:ring-1 focus:ring-[#005A9C] min-h-[44px]"
                    />
                    {errors.reporterName && (
                      <p className="text-xs text-[#DC2626] mt-1">{errors.reporterName.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Your Phone / Contact <span className="text-[#DC2626]">*</span>
                    </label>
                    <input
                      type="text"
                      {...register('reporterContact')}
                      placeholder="0772XXXXXX"
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:border-[#005A9C] focus:ring-1 focus:ring-[#005A9C] min-h-[44px]"
                    />
                    {errors.reporterContact && (
                      <p className="text-xs text-[#DC2626] mt-1">{errors.reporterContact.message}</p>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Name of Boy or Person Affected (Optional)
                  </label>
                  <input
                    type="text"
                    {...register('boyName')}
                    placeholder="If known or safe to provide"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:border-[#005A9C] focus:ring-1 focus:ring-[#005A9C] min-h-[44px]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    District / Region <span className="text-[#DC2626]">*</span>
                  </label>
                  <select
                    {...register('district')}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:border-[#005A9C] focus:ring-1 focus:ring-[#005A9C] min-h-[44px]"
                  >
                    {UGANDA_DISTRICTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nature of Concern <span className="text-[#DC2626]">*</span>
                  </label>
                  <select
                    {...register('concernCategory')}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:border-[#005A9C] min-h-[44px]"
                  >
                    <option value="emotional_distress">Emotional Distress / Depression</option>
                    <option value="physical_harm">Physical Harm or Threat</option>
                    <option value="bullying_or_violence">Bullying / School Violence</option>
                    <option value="neglect">Neglect / Deprivation of Food or School</option>
                    <option value="exploitation_or_labour">Child Labour or Exploitation</option>
                    <option value="substance_abuse">Substance Abuse</option>
                    <option value="other">Other Concern</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Urgency Level <span className="text-[#DC2626]">*</span>
                  </label>
                  <select
                    {...register('urgency')}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:border-[#005A9C] min-h-[44px]"
                  >
                    <option value="low">Low — General welfare observation</option>
                    <option value="medium">Medium — Attention needed this week</option>
                    <option value="high">High — Prompt action required</option>
                    <option value="immediate">Immediate — Critical child safety risk</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Details of the Incident or Concern <span className="text-[#DC2626]">*</span>
                  </label>
                  <span className="text-xs text-slate-500 font-mono">
                    {detailsValue.length}/2000 chars
                  </span>
                </div>
                <textarea
                  {...register('details')}
                  rows={4}
                  placeholder="Please describe what happened, when, and where. Mention any immediate safety risks."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:border-[#005A9C] focus:ring-1 focus:ring-[#005A9C]"
                />
                {errors.details && (
                  <p className="text-xs text-[#DC2626] mt-1">{errors.details.message}</p>
                )}
              </div>

              <div>
                <label className="flex items-start gap-2.5 text-xs text-slate-600 cursor-pointer min-h-[44px]">
                  <input
                    type="checkbox"
                    {...register('consentToInvestigation')}
                    className="mt-0.5 w-4 h-4 rounded border-slate-300 text-[#DC2626] focus:ring-[#DC2626]"
                  />
                  <span>
                    I confirm this report is provided in good faith to safeguard child welfare in accordance with Uganda’s Children Act and BCA Child Protection Policy.
                  </span>
                </label>
                {errors.consentToInvestigation && (
                  <p className="text-xs text-[#DC2626] mt-1">{errors.consentToInvestigation.message}</p>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-bold rounded-xl shadow transition-colors flex items-center gap-2 min-h-[44px] disabled:opacity-50"
                >
                  {isSubmitting ? 'Securing Report...' : 'Submit Confidential Report'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
