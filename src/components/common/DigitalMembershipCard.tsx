import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import QRCode from 'qrcode';
import { AppUser } from '../../types';
import { ShieldCheck, Lock, QrCode, Printer, ExternalLink } from 'lucide-react';

interface DigitalMembershipCardProps {
  user: AppUser;
  circleName?: string;
}

export const DigitalMembershipCard: React.FC<DigitalMembershipCardProps> = ({ user, circleName }) => {
  const isLockedMinor = user.role === 'boy' && user.status === 'pending_guardian_consent';
  const membershipNumber = user.membershipNumber || 'PENDING-VERIFICATION';
  const verifyUrl = `https://boy-child-association.ai.studio/verify/${membershipNumber}${
    user.membershipQrToken ? `?t=${user.membershipQrToken}` : ''
  }`;

  const qrSvgPath = useMemo(() => {
    if (isLockedMinor || !user.membershipNumber) return null;
    try {
      const matrix = QRCode.create(verifyUrl, { errorCorrectionLevel: 'M' }).modules;
      const size = matrix.size;
      let d = '';
      for (let r = 0; r < size; r += 1) {
        for (let c = 0; c < size; c += 1) {
          if (matrix.get(r, c)) {
            d += `M${c + 1} ${r + 1}h1v1h-1z`;
          }
        }
      }
      return { size: size + 2, d };
    } catch {
      return null;
    }
  }, [isLockedMinor, user.membershipNumber, verifyUrl]);

  if (isLockedMinor || !user.membershipNumber) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-amber-100 text-amber-800 rounded-xl shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-amber-900">
              Digital Membership Card Locked
            </div>
            <p className="text-xs text-amber-800 mt-1 leading-relaxed max-w-xl">
              An official BCA membership number and QR verification card will be issued automatically once a verified guardian submits formal safeguarding consent under Uganda Children Act (Cap 59).
            </p>
          </div>
        </div>
        <span className="text-xs font-mono font-bold text-amber-900 bg-amber-100 px-3 py-1.5 rounded-lg shrink-0">
          STATUS: PENDING CONSENT
        </span>
      </div>
    );
  }

  return (
    <div className="bg-[#1B365D] text-white rounded-2xl p-6 shadow-md border border-[#005A9C]/50 relative overflow-hidden">
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        <div className="md:col-span-8 space-y-4">
          <div className="flex items-center justify-between gap-3 border-b border-white/15 pb-3">
            <div className="flex items-center gap-3">
              <img
                src="/assets/aistudio/Screenshot_20260801_081145_WhatsApp__1__8a50926e.jpg"
                alt="Boy Child Association Official Logo"
                className="w-10 h-10 object-contain rounded-full bg-white p-0.5 shrink-0"
              />
              <div>
                <div className="font-heading text-sm font-extrabold tracking-tight text-white">
                  BOY CHILD ASSOCIATION UGANDA
                </div>
                <div className="text-[11px] font-bold text-[#60C1E5]">
                  Official Digital Membership Card · Standing Up As A Man
                </div>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-[11px] font-bold uppercase shrink-0">
              {user.status}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-300 block">Member Name</span>
              <span className="font-heading text-lg font-bold text-white">{user.fullName}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-300 block">Membership Number</span>
              <span className="font-mono text-base font-extrabold text-[#A0E0EF] tabular-nums">
                {membershipNumber}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-300 block">Age Track &amp; Chapter</span>
              <span className="font-semibold text-white">
                {user.ageCategory === 'young_adult_18_35' ? 'Young Adult (18–35)' : 'Child Cohort (5–17)'} ·{' '}
                {user.district || 'Kampala'}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-300 block">Assigned Circle</span>
              <span className="font-semibold text-white">
                {circleName || 'Kampala Central Champions Circle'}
              </span>
            </div>
          </div>

          <div className="pt-2 flex flex-wrap items-center gap-3 text-xs">
            <Link
              to={`/verify/${membershipNumber}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#005A9C] hover:bg-[#004980] text-white font-semibold transition-colors"
            >
              <QrCode className="w-3.5 h-3.5 text-[#A0E0EF]" />
              <span>Open Live Verification Page</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
            <button
              type="button"
              onClick={() => typeof window !== 'undefined' && window.print?.()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold transition-colors print:hidden"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Card</span>
            </button>
            <span className="text-[11px] text-slate-300 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#60C1E5]" />
              Public QR scans hide minor PII under DPPA 2019
            </span>
          </div>
        </div>

        <div className="md:col-span-4 flex flex-col items-center justify-center bg-white rounded-xl p-4 text-[#1B365D]">
          {qrSvgPath ? (
            <svg
              viewBox={`0 0 ${qrSvgPath.size} ${qrSvgPath.size}`}
              className="w-36 h-36"
              role="img"
              aria-label={`QR verification code for ${membershipNumber}`}
            >
              <rect width={qrSvgPath.size} height={qrSvgPath.size} fill="#FFFFFF" />
              <path d={qrSvgPath.d} fill="#1B365D" />
            </svg>
          ) : (
            <QrCode className="w-28 h-28 text-[#1B365D]" />
          )}
          <span className="mt-2 font-mono text-[11px] font-bold text-[#005A9C] tabular-nums">
            {membershipNumber}
          </span>
          <span className="text-[10px] text-slate-500 text-center">
            Scan to verify active BCA membership status
          </span>
        </div>
      </div>
    </div>
  );
};
