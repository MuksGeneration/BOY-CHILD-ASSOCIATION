import React, { useState } from 'react';
import { firebaseService } from '../../lib/firebase/firebase';
import { useAuth } from '../../hooks/useAuth';
import { usePublicCatalog } from '../../hooks/usePlatformData';
import { Programme } from '../../types';
import { UGANDA_DISTRICTS } from '../../lib/validation/ugandaDistricts';
import { normaliseUgandanPhone } from '../../lib/validation/schemas';
import {
  Search,
  Filter,
  Calendar,
  MapPin,
  CheckCircle2,
  X,
  Send,
  Sparkles,
} from 'lucide-react';

export const ProgrammesPage: React.FC = () => {
  const { user, role } = useAuth();
  usePublicCatalog(role);
  const programmes = firebaseService.getProgrammes();
  const cms = firebaseService.getCmsSettings();

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Request Place Modal State
  const [activeModalProg, setActiveModalProg] = useState<Programme | null>(null);
  const [applicantName, setApplicantName] = useState('');
  const [applicantPhone, setApplicantPhone] = useState('');
  const [applicantAge, setApplicantAge] = useState('');
  const [applicantDistrict, setApplicantDistrict] = useState('Kampala');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState(false);

  const categories = ['All', 'Mentorship', 'Wellbeing', 'Skills', 'Clubs', 'Families'];

  const filteredProgrammes = programmes.filter((p) => {
    const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesDistrict =
      selectedDistrict === 'All' ||
      p.districtLocations.includes('All Uganda Chapters & Virtual Dial-in') ||
      p.districtLocations.includes(selectedDistrict);
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.shortDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.outcomes.some((o) => o.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCat && matchesDistrict && matchesSearch;
  });

  const handleRequestPlace = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (applicantName.trim().length < 2) {
      setFormError('Please enter applicant or boy full name (min 2 characters).');
      return;
    }

    const phoneCheck = normaliseUgandanPhone(applicantPhone);
    if (!phoneCheck.valid) {
      setFormError(phoneCheck.error || 'Please provide a valid Ugandan phone number.');
      return;
    }

    const ageNum = parseInt(applicantAge, 10);
    if (isNaN(ageNum) || ageNum < 5 || ageNum > 35) {
      setFormError('Please enter a valid age between 5 and 35.');
      return;
    }

    setSubmitting(true);
    try {
      const dobYear = new Date().getFullYear() - ageNum;
      await firebaseService.submitMembershipApplication({
        applicantUid: user?.uid || `guest_${Date.now()}`,
        fullName: applicantName.trim(),
        dateOfBirth: `${dobYear}-01-01`,
        calculatedAge: ageNum,
        ageCategory: ageNum < 18 ? 'child_5_17' : 'young_adult_18_35',
        district: applicantDistrict,
        town: applicantDistrict,
        schoolOrOccupation: activeModalProg?.title || 'Programme Place Request',
        interests: [activeModalProg?.title || 'Mentorship', notes.trim()].filter(Boolean),
        guardianPhone: ageNum < 18 ? phoneCheck.e164 : undefined,
        guardianName: ageNum < 18 ? 'Guardian verification pending' : undefined,
      });

      setSuccessMessage(true);
      setTimeout(() => {
        setSuccessMessage(false);
        setActiveModalProg(null);
        setApplicantName('');
        setApplicantPhone('');
        setApplicantAge('');
        setNotes('');
      }, 2600);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to submit request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-[#F8FAFC] min-h-screen py-10 sm:py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="max-w-2xl mb-8">
          <span className="text-xs font-bold text-[#005A9C]">Uganda Chapter Directory</span>
          <h1 className="font-heading text-3xl sm:text-4xl font-extrabold text-[#1B365D] mt-1">
            Programmes &amp; Youth Circles
          </h1>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">
            All programmes operate under strict child safeguarding supervision. Boys ages 5–17 require verified guardian consent before circle placement, while young adults 18–35 self-consent.
          </p>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 mb-8 space-y-4">
          <div className="flex flex-col md:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search programmes by skill, topic, or keyword..."
                className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 focus:border-[#005A9C] focus:ring-1 focus:ring-[#005A9C] min-h-[44px]"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <MapPin className="w-4 h-4 text-[#005A9C] shrink-0" />
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="w-full md:w-56 px-3 py-2 text-sm rounded-xl border border-slate-200 focus:border-[#005A9C] min-h-[44px]"
              >
                <option value="All">All Uganda Districts</option>
                {UGANDA_DISTRICTS.slice(0, 15).map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 min-h-[40px] ${
                  selectedCategory === cat
                    ? 'bg-[#005A9C] text-white'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {filteredProgrammes.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 max-w-md mx-auto my-12">
            <Filter className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-[#1B365D]">No programmes match your filter</h3>
            <p className="text-xs text-slate-500 mt-1">
              Try selecting a different district or clearing your search keywords.
            </p>
            <button
              onClick={() => {
                setSelectedCategory('All');
                setSelectedDistrict('All');
                setSearchQuery('');
              }}
              className="mt-4 px-4 py-2 bg-[#005A9C] text-white text-xs font-semibold rounded-lg min-h-[40px]"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProgrammes.map((prog) => (
              <div
                key={prog.id}
                className="bg-white rounded-2xl overflow-hidden border border-slate-200 flex flex-col justify-between"
              >
                {prog.imagePath && (
                  <div className="relative h-48 w-full overflow-hidden bg-slate-100">
                    <img
                      src={prog.imagePath}
                      alt={prog.title}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}

                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-1.5">
                      <span className="font-semibold text-[#005A9C]">{prog.category}</span>
                      <span aria-hidden="true">·</span>
                      <span>{prog.ageRange}</span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">{prog.activeBoysCount} active</span>
                    </div>

                    <h3 className="font-heading text-lg font-bold text-[#1B365D]">{prog.title}</h3>

                    <p className="mt-2 text-xs text-slate-600 leading-relaxed">{prog.shortDescription}</p>

                    <div className="mt-4 space-y-1.5">
                      <div className="text-[11px] font-bold text-slate-700">Core Competencies:</div>
                      {prog.outcomes.map((outcome, idx) => (
                        <div key={idx} className="flex items-start gap-1.5 text-xs text-slate-600">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#005A9C] shrink-0 mt-0.5" />
                          <span>{outcome}</span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 space-y-1 text-xs text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{prog.schedule}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{prog.districtLocations.slice(0, 3).join(', ')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-700 tabular-nums">
                      {prog.availablePlaces} places available
                    </span>
                    <button
                      onClick={() => setActiveModalProg(prog)}
                      className="px-4 py-2 bg-[#005A9C] hover:bg-[#004980] text-white text-xs font-semibold rounded-xl min-h-[44px]"
                    >
                      Request a Place
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Direct WhatsApp Consultation Banner */}
        <div className="mt-12 bg-white rounded-2xl p-6 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center sm:text-left">
            <div className="text-xs font-bold text-emerald-800">
              Social Organisation to Unite Boys · Uganda
            </div>
            <h3 className="font-heading text-lg font-bold text-[#1B365D]">
              Have questions about enrolling a boy or joining a circle?
            </h3>
            <p className="text-xs text-slate-600">
              Chat directly with our community coordinator on WhatsApp at{' '}
              <strong className="text-slate-900 font-mono">{cms.whatsappNumber}</strong> for advice on age cohorts and locations.
            </p>
          </div>
          <a
            href={`https://wa.me/256${cms.whatsappNumber.replace(/^0/, '')}?text=Hello%20Boy%20Child%20Association%2C%20I%20would%20like%20guidance%20on%20which%20programme%20or%20circle%20fits%20best`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shrink-0 flex items-center gap-2 min-h-[44px]"
          >
            <span>Inquire on WhatsApp ({cms.whatsappNumber})</span>
          </a>
        </div>

        {/* Request Place Modal */}
        {activeModalProg && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="request-place-title"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          >
            <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl relative">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 id="request-place-title" className="font-heading text-lg font-bold text-[#1B365D]">
                    Request a Place in Programme
                  </h3>
                  <p className="text-xs text-[#005A9C] font-semibold mt-0.5">
                    {activeModalProg.title} ({activeModalProg.ageRange})
                  </p>
                </div>
                <button
                  onClick={() => setActiveModalProg(null)}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {successMessage ? (
                <div className="py-8 text-center">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <h4 className="text-base font-bold text-[#1B365D]">Place Request Recorded</h4>
                  <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto">
                    Your application is queued for our {applicantDistrict} Coordinator to review and contact <strong className="text-[#005A9C]">{applicantPhone}</strong>.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleRequestPlace} className="mt-4 space-y-3.5">
                  {formError && (
                    <div className="p-3 bg-red-50 text-[#DC2626] rounded-xl text-xs font-medium border border-red-100">
                      {formError}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Applicant / Boy Full Name <span className="text-[#DC2626]">*</span>
                    </label>
                    <input
                      type="text"
                      value={applicantName}
                      onChange={(e) => setApplicantName(e.target.value)}
                      placeholder="e.g. David Mukasa"
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:border-[#005A9C] min-h-[44px]"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Contact Phone <span className="text-[#DC2626]">*</span>
                      </label>
                      <input
                        type="text"
                        value={applicantPhone}
                        onChange={(e) => setApplicantPhone(e.target.value)}
                        placeholder="0772123456"
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:border-[#005A9C] min-h-[44px]"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Age (5–35) <span className="text-[#DC2626]">*</span>
                      </label>
                      <input
                        type="number"
                        value={applicantAge}
                        onChange={(e) => setApplicantAge(e.target.value)}
                        placeholder="15"
                        min="5"
                        max="35"
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:border-[#005A9C] min-h-[44px]"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">District</label>
                      <select
                        value={applicantDistrict}
                        onChange={(e) => setApplicantDistrict(e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 min-h-[44px]"
                      >
                        {UGANDA_DISTRICTS.slice(0, 15).map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Learning Interests or Accessibility Notes
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={2}
                      placeholder="e.g. Interested in solar tinkering and Saturday academic tutoring"
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:border-[#005A9C]"
                    />
                  </div>

                  <div className="p-3 bg-[#F4F8FC] rounded-xl text-[11px] text-[#1B365D] border border-blue-100 flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-[#005A9C] shrink-0 mt-0.5" />
                    <span>
                      Applicants under 18 are logged as pending guardian consent and matched after parent verification.
                    </span>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setActiveModalProg(null)}
                      className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 min-h-[44px]"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-5 py-2.5 bg-[#005A9C] hover:bg-[#004980] text-white text-xs font-bold rounded-xl flex items-center gap-2 min-h-[44px] disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                      <span>{submitting ? 'Submitting...' : 'Submit Request'}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
