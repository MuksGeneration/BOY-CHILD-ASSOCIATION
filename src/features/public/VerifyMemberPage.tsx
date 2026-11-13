import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { firebaseService, isDemoModeEnabled } from '../../lib/firebase/firebase';
import { useAuth } from '../../hooks/useAuth';
import { MembershipVerificationRecord } from '../../types';
import { QrCode, Search, ShieldCheck, CheckCircle2, AlertTriangle, Lock } from 'lucide-react';

export const VerifyMemberPage: React.FC = () => {
  const { cardNumber } = useParams<{ cardNumber?: string }>();
  const { user, role } = useAuth();
  const [query, setQuery] = useState(cardNumber || (isDemoModeEnabled ? 'BCA-UG-2026-0101' : ''));
  const [result, setResult] = useState<MembershipVerificationRecord | null>(null);
  const [searched, setSearched] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const runVerify = async (val: string) => {
    const clean = val.trim();
    if (!clean) return;
    setVerifying(true);
    try {
      const found = await firebaseService.verifyMembershipCardAsync(clean);
      setResult(found);
      setSearched(true);
    } finally {
      setVerifying(false);
    }
  };

  useEffect(() => {
    if (cardNumber) {
      setQuery(cardNumber);
      runVerify(cardNumber);
    }
  }, [cardNumber]);

  const canViewFullName = Boolean(
    result &&
      (role === 'admin' ||
        role === 'coordinator' ||
        user?.uid === result.uid ||
        !result.isMinor)
  );

  return (
    <div className="bg-[#F8FAFC] min-h-screen py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 text-[#005A9C] rounded-xl">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-heading text-2xl font-extrabold text-[#1B365D]">
                Digital Membership &amp; QR Verification
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Verify an official Boy Child Association Uganda membership number or scanned QR token.
              </p>
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              runVerify(query);
            }}
            className="flex flex-col sm:flex-row gap-3 pt-2"
          >
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter Membership Number (e.g. BCA-UG-2026-0101)"
                className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-slate-300 min-h-[44px] font-mono"
                required
              />
            </div>
            <button
              type="submit"
              disabled={verifying}
              className="px-6 py-2.5 bg-[#005A9C] hover:bg-[#004980] disabled:bg-slate-400 text-white text-xs font-bold rounded-xl min-h-[44px]"
            >
              {verifying ? 'Verifying...' : 'Verify Membership'}
            </button>
          </form>

          {isDemoModeEnabled && (
            <div className="flex flex-wrap gap-2 text-[11px] text-slate-500">
              <span>Quick demo lookups:</span>
              <button
                type="button"
                onClick={() => {
                  setQuery('BCA-UG-2026-0101');
                  runVerify('BCA-UG-2026-0101');
                }}
                className="font-mono text-[#005A9C] underline"
              >
                BCA-UG-2026-0101 (Minor Cohort)
              </button>
              <button
                type="button"
                onClick={() => {
                  setQuery('BCA-UG-2026-0102');
                  runVerify('BCA-UG-2026-0102');
                }}
                className="font-mono text-[#005A9C] underline"
              >
                BCA-UG-2026-0102 (Young Adult)
              </button>
            </div>
          )}
        </div>

        {searched && !result && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-[#DC2626] shrink-0 mt-0.5" />
            <div>
              <h2 className="font-heading text-base font-bold text-[#1B365D]">
                No Matching BCA Membership Record
              </h2>
              <p className="text-xs text-slate-700 mt-1">
                No active digital membership card matched &ldquo;{query}&rdquo;. Pending minor applicants do not receive active QR verification until guardian consent is approved.
              </p>
            </div>
          </div>
        )}

        {result && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                <div>
                  <div className="font-heading text-lg font-bold text-[#1B365D]">
                    Verified BCA Uganda Record
                  </div>
                  <div className="text-xs font-mono font-bold text-[#005A9C] tabular-nums">
                    {result.membershipNumber}
                  </div>
                </div>
              </div>
              <span
                className={`px-3 py-1 rounded-lg text-xs font-bold uppercase ${
                  result.status === 'active'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-900'
                }`}
              >
                {result.status.replace(/_/g, ' ')}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Member Identity</span>
                <span className="font-bold text-[#1B365D] text-sm">
                  {canViewFullName ? result.fullNamePrivate : result.fullNameMasked}
                </span>
                {result.isMinor && !canViewFullName && (
                  <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-[#005A9C]" />
                    Minor full name masked on public scan (DPPA 2019)
                  </p>
                )}
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">District Chapter &amp; Track</span>
                <span className="font-bold text-[#1B365D] text-sm">{result.district}</span>
                <span className="block text-slate-500 mt-0.5">
                  {result.ageCategory === 'child_5_17' ? 'Child Cohort (Ages 5–17)' : 'Young Adult Cohort (Ages 18–35)'}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Assigned Circle</span>
                <span className="font-semibold text-[#1B365D]">{result.circleName || 'District Mentorship Circle'}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Issued Date</span>
                <span className="font-mono font-semibold text-[#1B365D] tabular-nums">
                  {new Date(result.issuedAt).toLocaleDateString('en-GB', { dateStyle: 'medium' })}
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-xs text-slate-700 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-[#005A9C] shrink-0 mt-0.5" />
              <span>
                Under Uganda’s Children Act (Cap 59) and Data Protection and Privacy Act (2019), public QR checks never reveal a minor’s home address, phone number, school, or confidential safeguarding history.
              </span>
            </div>

            <div className="pt-2 text-right">
              <Link to="/hub" className="text-xs font-bold text-[#005A9C] hover:underline">
                Return to Member Hub &rarr;
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
