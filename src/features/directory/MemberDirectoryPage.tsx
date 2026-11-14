import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { MemberDirectory } from '../../components/directory/MemberDirectory';

export const MemberDirectoryPage: React.FC = () => {
  const { role } = useAuth();
  const backLink =
    role === 'mentor'
      ? { to: '/mentor', label: 'Back to Mentor Portal' }
      : { to: role === 'admin' ? '/admin' : '/coordinator', label: 'Back to Operations Console' };

  return (
    <div className="bg-[#F8FAFC] min-h-screen py-10 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-5">
        <div className="flex items-center justify-between gap-4">
          <Link
            to={backLink.to}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#005A9C] hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{backLink.label}</span>
          </Link>
        </div>

        <MemberDirectory />
      </div>
    </div>
  );
};
