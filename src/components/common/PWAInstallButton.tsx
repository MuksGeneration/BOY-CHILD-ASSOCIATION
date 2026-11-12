import React, { useState } from 'react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { Download, Smartphone, X } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA, hide the button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-2 rounded-lg bg-[#005A9C] px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[#004980] transition-colors whitespace-nowrap min-h-[44px]"
        aria-label="Install Boy Child App on your device for offline use"
      >
        <Download className="w-4 h-4 text-[#60C1E5]" />
        <span>Install App</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 rounded-lg border border-[#005A9C]/30 bg-white px-3 py-1.5 text-xs font-medium text-[#1B365D] hover:bg-[#F0F9FD] transition-colors min-h-[44px]"
        >
          <Smartphone className="w-4 h-4 text-[#005A9C]" />
          <span>Install on iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-base font-bold text-[#1B365D]">Install on iPhone / iPad</h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded-md text-slate-500 hover:text-slate-800"
                  aria-label="Close guide"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                Save the Boy Child platform directly to your home screen for quick offline access:
              </p>
              <div className="mt-4 space-y-3 text-xs text-slate-700 bg-[#F4F8FC] p-3.5 rounded-xl border border-blue-100">
                <div className="flex items-start gap-2">
                  <span className="font-bold text-[#005A9C]">1.</span>
                  <span>Tap the <strong>Share</strong> icon in the bottom Safari toolbar.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-bold text-[#005A9C]">2.</span>
                  <span>Scroll down and select <strong>&quot;Add to Home Screen&quot;</strong>.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-bold text-[#005A9C]">3.</span>
                  <span>Tap <strong>Add</strong> in the top right corner.</span>
                </div>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-[#005A9C] py-2.5 text-xs font-semibold text-white hover:bg-[#004980] min-h-[44px]"
              >
                Got It
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
