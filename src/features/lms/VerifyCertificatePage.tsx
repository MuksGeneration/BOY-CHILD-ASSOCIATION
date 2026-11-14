import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { firebaseService } from '../../lib/firebase/firebase';
import { CertificateVerificationRecord } from '../../types';
import { Award, CheckCircle2, Search, ShieldAlert, ShieldCheck } from 'lucide-react';

export const VerifyCertificatePage: React.FC = () => {
  const { certificateNumber: routeCertNumber } = useParams();
  const [queryInput, setQueryInput] = useState(routeCertNumber || '');
  const [result, setResult] = useState<CertificateVerificationRecord | null>(null);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const runLookup = async (code: string) => {
    const clean = code.trim();
    if (!clean) return;
    setLoading(true);
    setSearched(true);
    try {
      const rec = await firebaseService.verifyCertificateAsync(clean);
      setResult(rec);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (routeCertNumber) {
      setQueryInput(routeCertNumber);
      runLookup(routeCertNumber);
    }
  }, [routeCertNumber]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    runLookup(queryInput);
  };

  return (
    <div className="bg-[#F8FAFC] min-h-screen py-12 sm:py-16">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 space-y-8">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#005A9C]">
            <Award className="w-4 h-4" />
            <span>BCA Uganda Digital Skilling Registry</span>
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl font-extrabold text-[#1B365D]">
            Verify Digital Course Certificate
          </h1>
          <p className="text-sm text-slate-600">
            Confirm the authenticity of a Boy Child Association Uganda online skilling certificate without exposing private minor records.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <label className="block text-xs font-bold text-[#1B365D]">
            Certificate Number or QR Verification Code
          </label>
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
                placeholder="e.g. BCA-CERT-2026-4401"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 font-mono text-sm min-h-[44px]"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-[#005A9C] hover:bg-[#004980] text-white text-xs font-bold rounded-xl min-h-[44px]"
            >
              {loading ? 'Checking...' : 'Verify Credential'}
            </button>
          </div>
        </form>

        {searched && !loading && (
          result ? (
            <div
              className={`bg-white rounded-2xl p-6 border-2 shadow-sm space-y-4 ${
                result.status === 'issued' ? 'border-emerald-500' : 'border-[#DC2626]'
              }`}
            >
              <div className="flex items-center justify-between gap-4 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  {result.status === 'issued' ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                  ) : (
                    <ShieldAlert className="w-6 h-6 text-[#DC2626]" />
                  )}
                  <span className="font-heading text-lg font-extrabold text-[#1B365D]">
                    {result.status === 'issued' ? 'Valid BCA Uganda Certificate' : 'Certificate Revoked'}
                  </span>
                </div>
                <span className="font-mono text-xs font-bold text-[#005A9C]">
                  {result.certificateNumber}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 uppercase font-bold text-[10px] block">Recipient</span>
                  <strong className="text-sm text-[#1B365D]">{result.learnerDisplayName}</strong>
                </div>
                <div>
                  <span className="text-slate-400 uppercase font-bold text-[10px] block">Completion Date</span>
                  <strong className="text-sm font-mono text-[#1B365D]">{result.completionDate}</strong>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-slate-400 uppercase font-bold text-[10px] block">Completed Skilling Course</span>
                  <strong className="text-sm text-[#005A9C]">{result.courseTitle}</strong>
                </div>
                <div>
                  <span className="text-slate-400 uppercase font-bold text-[10px] block">Course Instructor Signatory</span>
                  <span className="text-slate-700 font-semibold">{result.instructorSignatory}</span>
                </div>
                <div>
                  <span className="text-slate-400 uppercase font-bold text-[10px] block">Safeguarding &amp; Privacy</span>
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Uganda DPPA 2019 Compliant</span>
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-6 border border-red-200 text-center space-y-2 text-xs">
              <ShieldAlert className="w-7 h-7 text-[#DC2626] mx-auto" />
              <div className="font-heading text-base font-bold text-[#1B365D]">
                No Matching Certificate Found
              </div>
              <p className="text-slate-600">
                Verify the exact certificate number printed on the credential (for example <code className="font-mono">BCA-CERT-2026-4401</code>).
              </p>
            </div>
          )
        )}

        <div className="text-center text-xs text-slate-500">
          <Link to="/learn" className="text-[#005A9C] font-bold hover:underline">
            Explore BCA Online Skilling Courses &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
};
