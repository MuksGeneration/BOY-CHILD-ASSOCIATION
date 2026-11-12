import React, { useState } from 'react';
import { firebaseService } from '../../lib/firebase/firebase';
import { Programme } from '../../types';
import { UGANDA_DISTRICTS } from '../../lib/validation/ugandaDistricts';
import { normaliseUgandanPhone } from '../../lib/validation/schemas';
import {
  Search,
  Filter,
  Calendar,
  MapPin,
  CheckCircle2,
  Users,
  X,
  Send,
  Sparkles
} from 'lucide-react';

export const ProgrammesPage: React.FC = () => {
  const programmes = firebaseService.getProgrammes();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Request Place Modal State
  const [activeModalProg, setActiveModalProg] = useState<Programme | null>(null);
  const [applicantName, setApplicantName] = useState('');
  const [applicantPhone, setApplicantPhone] = useState('');
  const [applicantAge, setApplicantAge] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');
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

  const handleRequestPlace = (e: React.FormEvent) => {
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

    // Success flow
    setSuccessMessage(true);
    setTimeout(() => {
      setSuccessMessage(false);
      setActiveModalProg(null);
      setApplicantName('');
      setApplicantPhone('');
      setApplicantAge('');
      setNotes('');
    }, 2500);
  };

  return (
    <div className="bg-[#F8FAFC] min-h-screen py-10 sm:py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="max-w-2xl mb-8">
          <span className="text-xs font-bold uppercase tracking-widest text-[#005A9C]">
            Uganda Chapter Directory
          </span>
          <h1 className="font-heading text-3xl sm:text-4xl font-extrabold text-[#1B365D] mt-1">
            Programmes &amp; Youth Circles
          </h1>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">
            All programmes operate under strict child safeguarding supervision. Boys are placed in small, safe cohort circles guided by vetted community mentors.
          </p>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs mb-8 space-y-4">
          <div className="flex flex-col md:flex-row items-center gap-3">
            {/* Search Input */}
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

            {/* District Selector */}
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

          {/* Category Tabs (Functional segmented controls) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap min-h-[38px] ${
                  selectedCategory === cat
                    ? 'bg-[#005A9C] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Programmes Grid */}
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
              className="mt-4 px-4 py-2 bg-[#005A9C] text-white text-xs font-semibold rounded-lg"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProgrammes.map((prog) => (
              <div
                key={prog.id}
                className="bg-white rounded-2xl overflow-hidden border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                {prog.imagePath && (
                  <div className="relative h-48 w-full overflow-hidden bg-slate-100">
                    <img
                      src={prog.imagePath}
                      alt={prog.title}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-3 right-3 px-2.5 py-1 rounded-md bg-[#1B365D]/90 backdrop-blur-xs text-[11px] font-bold text-[#60C1E5]">
                      {prog.ageRange}
                    </div>
                  </div>
                )}

                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-1.5">
                      <span className="font-semibold text-[#005A9C]">{prog.category}</span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">{prog.activeBoysCount} boys active</span>
                    </div>

                    <h3 className="font-heading text-lg font-bold text-[#1B365D]">
                      {prog.title}
                    </h3>

                    <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                      {prog.shortDescription}
                    </p>

                    <div className="mt-4 space-y-1.5">
                      <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                        Core Competencies:
                      </div>
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
                        <span>{prog.districtLocations.slice(0, 3).join(', ')}{prog.districtLocations.length > 3 ? '...' : ''}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-emerald-700 tabular-nums">
                        {prog.availablePlaces} places available
                      </span>
                    </div>
                    <button
                      onClick={() => setActiveModalProg(prog)}
                      className="px-4 py-2 bg-[#005A9C] hover:bg-[#004980] text-white text-xs font-semibold rounded-xl transition-colors shadow-xs min-h-[44px]"
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
        <div className="mt-12 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center sm:text-left">
            <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
              Social Organisation to Unite Boys · Uganda
            </div>
            <h3 className="font-heading text-lg font-bold text-[#1B365D]">
              Have questions about enrolling a boy or joining a circle?
            </h3>
            <p className="text-xs text-slate-600">
              Chat directly with our community coordinator on WhatsApp at <strong className="text-slate-900 font-mono">0732320190</strong> for advice on age cohorts and locations.
            </p>
          </div>
          <a
            href="https://wa.me/256732320190?text=Hello%20Boy%20Child%20Association%2C%20I%20would%20like%20guidance%20on%20which%20programme%20or%20circle%20fits%20best"
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors shrink-0 flex items-center gap-2 min-h-[44px]"
          >
            <span>Inquire on WhatsApp (0732320190)</span>
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
                  <h4 className="text-base font-bold text-[#1B365D]">Place Request Submitted</h4>
                  <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto">
                    Our local circle coordinator will contact you on <strong className="text-[#005A9C]">{applicantPhone}</strong> to verify guardian consent and confirm session start dates.
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

                  <div className="grid grid-cols-2 gap-3">
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
                        Age of Applicant <span className="text-[#DC2626]">*</span>
                      </label>
                      <input
                        type="number"
                        value={applicantAge}
                        onChange={(e) => setApplicantAge(e.target.value)}
                        placeholder="e.g. 15"
                        min="5"
                        max="35"
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:border-[#005A9C] min-h-[44px]"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Special Learning Interests or Notes
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={2}
                      placeholder="e.g. Needs help with mathematics, interested in solar kits"
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:border-[#005A9C]"
                    />
                  </div>

                  <div className="p-3 bg-[#F4F8FC] rounded-xl text-[11px] text-[#1B365D] border border-blue-100 flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-[#005A9C] shrink-0 mt-0.5" />
                    <span>
                      Applicants under 18 will require parental/guardian consent verification before attending the first circle session.
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
                      className="px-5 py-2.5 bg-[#005A9C] hover:bg-[#004980] text-white text-xs font-bold rounded-xl flex items-center gap-2 min-h-[44px]"
                    >
                      <Send className="w-4 h-4" />
                      <span>Submit Request</span>
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
