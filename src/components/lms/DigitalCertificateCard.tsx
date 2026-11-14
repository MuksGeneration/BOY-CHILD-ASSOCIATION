import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { CourseCertificate } from '../../types';
import { Award, Download, Printer, ShieldAlert, ShieldCheck, X } from 'lucide-react';

interface DigitalCertificateCardProps {
  certificate: CourseCertificate;
  onClose?: () => void;
}

export const DigitalCertificateCard: React.FC<DigitalCertificateCardProps> = ({
  certificate,
  onClose,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  const verifyUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/verify-certificate/${certificate.certificateNumber}`
      : `https://boy-child-association.ai.studio/verify-certificate/${certificate.certificateNumber}`;

  useEffect(() => {
    QRCode.toDataURL(verifyUrl, {
      width: 140,
      margin: 1,
      color: { dark: '#1B365D', light: '#FFFFFF' },
    })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(''));
  }, [verifyUrl]);

  const handleDownloadHtml = () => {
    const html = `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>${certificate.certificateNumber} — BCA Uganda Certificate</title>
<style>body{font-family:system-ui,-apple-system,sans-serif;background:#f8fafc;padding:32px;color:#1e293b}
.cert{max-width:780px;margin:auto;background:#fff;border:6px double #1b365d;padding:40px;border-radius:12px}
.kicker{color:#005a9c;font-weight:700;font-size:12px;letter-spacing:2px;text-transform:uppercase}
h1{color:#1b365d;font-size:28px;margin:8px 0 4px}
.recipient{font-size:32px;font-weight:800;color:#1b365d;margin:20px 0;border-bottom:2px solid #e2e8f0;padding-bottom:12px}
.meta{display:flex;justify-content:space-between;margin-top:28px;font-size:13px;color:#475569}</style>
</head>
<body>
<div class="cert">
<div class="kicker">Boy Child Association (BCA) Uganda · Standing Up As A Man</div>
<h1>Certificate of Online Skilling Completion</h1>
${certificate.status === 'revoked' ? `<p style="color:#dc2626;font-weight:700">REVOKED CERTIFICATE: ${certificate.revokedReason || 'Revoked by administrator'}</p>` : ''}
<p>This certifies that</p>
<div class="recipient">${certificate.learnerDisplayName}</div>
<p>has successfully completed all required modules and assessments for:</p>
<h2>${certificate.courseTitle}</h2>
<div class="meta">
  <div><strong>Certificate ID:</strong> ${certificate.certificateNumber}<br/><strong>Date:</strong> ${certificate.completionDate}</div>
  <div><strong>Lead Instructor:</strong> ${certificate.instructorSignatory}<br/><strong>Learning Manager:</strong> ${certificate.learningManagerSignatory}</div>
</div>
<p style="margin-top:24px;font-size:11px;color:#64748b">Verify authenticity online: ${verifyUrl}</p>
</div>
</body>
</html>`;
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${certificate.certificateNumber}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-2xl border-2 border-[#1B365D] shadow-xl overflow-hidden">
      <div className="bg-[#1B365D] text-white px-6 py-4 flex items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#60C1E5]">
          <Award className="w-4 h-4" />
          <span>Verified BCA Uganda Skilling Credential</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="px-3 py-1.5 bg-[#005A9C] hover:bg-[#004980] text-white text-xs font-bold rounded-lg flex items-center gap-1.5 min-h-[36px]"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / Save PDF</span>
          </button>
          <button
            type="button"
            onClick={handleDownloadHtml}
            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 min-h-[36px]"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close certificate preview"
              className="p-1.5 text-slate-300 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {certificate.status === 'revoked' && (
        <div className="bg-red-50 border-b border-red-200 px-6 py-3 flex items-center gap-2 text-xs font-bold text-[#DC2626]">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>
            CERTIFICATE REVOKED: {certificate.revokedReason || 'Credential invalidated by Learning Department.'}
          </span>
        </div>
      )}

      <div className="p-8 sm:p-10 space-y-6 bg-[radial-gradient(circle_at_top_right,_#EFF6FF_0%,_#FFFFFF_55%)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <div className="flex items-center gap-3">
            <img
              src="/assets/aistudio/Screenshot_20260801_081145_WhatsApp__1__8a50926e.jpg"
              alt="BCA Uganda Crest"
              className="w-12 h-12 rounded-full object-contain border border-slate-200 bg-white"
            />
            <div>
              <div className="text-[11px] font-bold uppercase tracking-widest text-[#005A9C]">
                Boy Child Association (BCA) Uganda
              </div>
              <h2 className="font-heading text-xl sm:text-2xl font-extrabold text-[#1B365D]">
                Certificate of Online Skilling Completion
              </h2>
            </div>
          </div>
          <div className="text-left sm:text-right font-mono text-xs text-slate-600 tabular-nums">
            <div className="font-bold text-[#1B365D]">{certificate.certificateNumber}</div>
            <div>Issued: {certificate.completionDate}</div>
          </div>
        </div>

        <div className="space-y-2 py-2">
          <p className="text-xs uppercase tracking-wider font-semibold text-slate-500">
            Awarded In Recognition To
          </p>
          <div className="font-heading text-3xl sm:text-4xl font-extrabold text-[#1B365D]">
            {certificate.learnerDisplayName}
          </div>
          <p className="text-sm text-slate-600 pt-1">
            for successfully completing the supervised online skilling curriculum and verified assessments in:
          </p>
          <div className="font-heading text-xl font-bold text-[#005A9C]">
            {certificate.courseTitle}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-slate-200 items-end">
          <div className="text-xs space-y-1">
            <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
              Lead Course Instructor
            </div>
            <div className="font-bold text-[#1B365D] text-sm">{certificate.instructorSignatory}</div>
            <div className="text-slate-500">BCA Technical &amp; Mentorship Faculty</div>
          </div>

          <div className="text-xs space-y-1">
            <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
              Learning Department Authority
            </div>
            <div className="font-bold text-[#1B365D] text-sm">{certificate.learningManagerSignatory}</div>
            <div className="text-emerald-700 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Standing Up As A Man</span>
            </div>
          </div>

          <div className="flex sm:justify-end items-center gap-3">
            {qrDataUrl && (
              <img
                src={qrDataUrl}
                alt={`QR verification for ${certificate.certificateNumber}`}
                className="w-20 h-20 rounded-lg border border-slate-200 p-1 bg-white"
              />
            )}
            <div className="text-[11px] font-mono text-slate-500">
              <div className="font-bold text-[#1B365D]">QR Verify</div>
              <div>{certificate.qrToken}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
