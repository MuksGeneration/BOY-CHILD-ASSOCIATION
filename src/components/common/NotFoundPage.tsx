import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, ArrowLeft, Home } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[75vh] flex items-center justify-center p-6 bg-[#F8FAFC]">
      <div className="max-w-md w-full bg-white rounded-2xl p-8 border border-slate-200/80 shadow-md text-center space-y-4">
        <div className="w-16 h-16 bg-blue-50 text-[#005A9C] rounded-2xl flex items-center justify-center mx-auto">
          <Compass className="w-8 h-8 text-[#005A9C]" />
        </div>
        <h1 className="font-heading text-2xl font-bold text-[#1B365D]">
          Circle Path Not Found
        </h1>
        <p className="text-xs text-slate-600 leading-relaxed">
          The page or circle resource you were looking for doesn&apos;t exist or may have been relocated.
        </p>
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/"
            className="w-full sm:w-auto px-5 py-2.5 bg-[#005A9C] hover:bg-[#004980] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 min-h-[44px]"
          >
            <Home className="w-4 h-4" />
            <span>Return to Home</span>
          </Link>
          <button
            onClick={() => window.history.back()}
            className="w-full sm:w-auto px-5 py-2.5 border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 min-h-[44px]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go Back</span>
          </button>
        </div>
      </div>
    </div>
  );
};
