import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  joinBoySchema,
  JoinBoyInput,
  joinGuardianSchema,
  JoinGuardianInput,
  joinMentorSchema,
  JoinMentorInput,
  joinPartnerSchema,
  JoinPartnerInput,
  normaliseUgandanPhone,
} from '../../lib/validation/schemas';
import { UGANDA_DISTRICTS } from '../../lib/validation/ugandaDistricts';
import { useAuth } from '../../hooks/useAuth';
import { firebaseService, isDemoModeEnabled } from '../../lib/firebase/firebase';
import { mockStore } from '../../lib/firebase/mockStore';
import { uploadApplicationDocument } from '../../lib/firebase/storage';
import { validateDocumentFile } from '../../lib/validation/schemas';
import {
  Users,
  ShieldAlert,
  GraduationCap,
  Building2,
  CheckCircle2,
  AlertCircle,
  Lock,
  ArrowRight,
  Upload,
} from 'lucide-react';

type JoinRoleTab = 'boy' | 'guardian' | 'mentor' | 'partner';

export const JoinPage: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<JoinRoleTab>('boy');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{ role: JoinRoleTab; name: string; status: string; ageCategory?: string } | null>(null);
  const [mentorDocFile, setMentorDocFile] = useState<File | null>(null);
  const [partnerDocFile, setPartnerDocFile] = useState<File | null>(null);
  const { user, isLiveFirebaseUser, switchPersona } = useAuth();

  // -------------------------------------------------------------
  // Boy / Young Man Form (5-17 vs 18-35)
  // -------------------------------------------------------------
  const {
    register: registerBoy,
    handleSubmit: handleSubmitBoy,
    watch: watchBoy,
    setValue: setBoyValue,
    formState: { errors: boyErrors, isSubmitting: isSubmittingBoy },
  } = useForm<JoinBoyInput>({
    resolver: zodResolver(joinBoySchema),
    defaultValues: {
      role: 'boy',
      calculatedAge: 16,
      district: 'Kampala',
      town: '',
      interests: ['Brothers in Purpose Mentorship'],
      guardianConsentGiven: false,
      honeypot: '',
    },
  });

  const calculatedAge = watchBoy('calculatedAge') || 16;
  const isMinor = calculatedAge < 18;

  const handleDobChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dobStr = e.target.value;
    if (dobStr) {
      const birthDate = new Date(dobStr);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      if (!isNaN(age) && age >= 5 && age <= 35) {
        setBoyValue('calculatedAge', age, { shouldValidate: true });
      }
    }
  };

  const onBoySubmit = async (data: JoinBoyInput) => {
    if (data.honeypot && data.honeypot.length > 0) return;
    setSubmitError(null);
    try {
      const ageCategory = data.calculatedAge < 18 ? 'child_5_17' : 'young_adult_18_35';
      const status = data.calculatedAge < 18 ? 'pending_guardian_consent' : 'active';
      const applicantUid = user?.uid || `app_boy_${Date.now()}`;

      await firebaseService.submitMembershipApplication({
        applicantUid,
        fullName: data.fullName,
        dateOfBirth: data.dateOfBirth,
        calculatedAge: data.calculatedAge,
        ageCategory,
        district: data.district,
        town: data.town,
        schoolOrOccupation: data.schoolOrOccupation,
        interests: data.interests,
        guardianName: data.guardianName,
        guardianPhone: data.guardianPhone ? normaliseUgandanPhone(data.guardianPhone).e164 : undefined,
      });

      if (!user && isDemoModeEnabled) {
        mockStore.addUser({
          uid: applicantUid,
          email: `${applicantUid}@pending.boychild.org`,
          fullName: data.fullName,
          role: 'boy',
          status,
          ageCategory,
          district: data.district,
          town: data.town,
          calculatedAge: data.calculatedAge,
          guardianName: data.guardianName,
          guardianPhone: data.guardianPhone ? normaliseUgandanPhone(data.guardianPhone).e164 : undefined,
          schoolOrOccupation: data.schoolOrOccupation,
          interests: data.interests,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: applicantUid,
        });
      }

      setSuccessData({
        role: 'boy',
        name: data.fullName,
        status,
        ageCategory: ageCategory === 'child_5_17' ? 'Child Cohort (Ages 5–17)' : 'Young Adult Cohort (Ages 18–35)',
      });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Unable to submit boy registration.');
    }
  };

  // -------------------------------------------------------------
  // Guardian Form
  // -------------------------------------------------------------
  const {
    register: registerGuardian,
    handleSubmit: handleSubmitGuardian,
    formState: { errors: guardianErrors, isSubmitting: isSubmittingGuardian },
  } = useForm<JoinGuardianInput>({
    resolver: zodResolver(joinGuardianSchema),
    defaultValues: {
      role: 'guardian',
      district: 'Wakiso',
      numberOfBoys: 1,
      relationship: 'mother',
      safeguardingAgreed: true,
      honeypot: '',
    },
  });

  const onGuardianSubmit = async (data: JoinGuardianInput) => {
    if (data.honeypot && data.honeypot.length > 0) return;
    setSubmitError(null);
    try {
      const uid = user?.uid || `usr_guardian_${Date.now()}`;
      const normPhone = normaliseUgandanPhone(data.phone).e164;
      if (user) {
        await firebaseService.updateProfile(user.uid, {
          fullName: data.fullName,
          district: data.district,
        });
      } else if (isDemoModeEnabled) {
        mockStore.addUser({
          uid,
          email: data.email || `${uid}@guardian.boychild.org`,
          fullName: data.fullName,
          phone: normPhone,
          role: 'guardian',
          status: 'active',
          ageCategory: 'adult',
          district: data.district,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: uid,
        });
      } else {
        await firebaseService.submitContactMessage({
          fullName: data.fullName,
          email: data.email || `${uid}@guardian.boychild.org`,
          phone: normPhone,
          subject: `Guardian Onboarding (${data.district})`,
          message: `Guardian registration inquiry for ${data.numberOfBoys} boy(s), relationship: ${data.relationship}.`,
        });
      }

      setSuccessData({
        role: 'guardian',
        name: data.fullName,
        status: 'active',
      });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Unable to register guardian profile.');
    }
  };

  // -------------------------------------------------------------
  // Mentor Form
  // -------------------------------------------------------------
  const {
    register: registerMentor,
    handleSubmit: handleSubmitMentor,
    watch: watchMentor,
    formState: { errors: mentorErrors, isSubmitting: isSubmittingMentor },
  } = useForm<JoinMentorInput>({
    resolver: zodResolver(joinMentorSchema),
    defaultValues: {
      role: 'mentor',
      district: 'Kampala',
      availability: 'weekends',
      safeguardingAgreed: true,
      hasCleanRecordConfirmed: true,
      honeypot: '',
    },
  });

  const mentorMotivation = watchMentor('motivation') || '';

  const onMentorSubmit = async (data: JoinMentorInput) => {
    if (data.honeypot && data.honeypot.length > 0) return;
    setSubmitError(null);
    try {
      const appId = `app_mentor_${Date.now()}`;
      const created = await firebaseService.submitMentorApplication({
        applicantUid: user?.uid || appId,
        fullName: data.fullName,
        email: data.email,
        phone: normaliseUgandanPhone(data.phone).e164,
        district: data.district,
        occupation: data.occupation,
        motivation: data.motivation,
        availability: data.availability,
        safeguardingTrainingAccepted: true,
        referee1Name: data.referee1Name,
        referee1Phone: normaliseUgandanPhone(data.referee1Phone).e164,
        referee2Name: data.referee2Name,
        referee2Phone: normaliseUgandanPhone(data.referee2Phone).e164,
      });
      if (mentorDocFile && user) {
        const check = validateDocumentFile(mentorDocFile);
        if (!check.valid) {
          throw new Error(check.error || 'Invalid mentor verification document.');
        }
        await uploadApplicationDocument('mentorApplications', created.id, mentorDocFile);
      }

      setMentorDocFile(null);
      setSuccessData({
        role: 'mentor',
        name: data.fullName,
        status: 'pending_vetting',
      });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Unable to submit mentor application.');
    }
  };

  // -------------------------------------------------------------
  // Partner Form
  // -------------------------------------------------------------
  const {
    register: registerPartner,
    handleSubmit: handleSubmitPartner,
    watch: watchPartner,
    formState: { errors: partnerErrors, isSubmitting: isSubmittingPartner },
  } = useForm<JoinPartnerInput>({
    resolver: zodResolver(joinPartnerSchema),
    defaultValues: {
      role: 'partner',
      district: 'Kampala',
      orgType: 'school',
      safeguardingAgreed: true,
      honeypot: '',
    },
  });

  const proposalText = watchPartner('collaborationProposal') || '';

  const onPartnerSubmit = async (data: JoinPartnerInput) => {
    if (data.honeypot && data.honeypot.length > 0) return;
    setSubmitError(null);
    try {
      const uid = user?.uid || `usr_partner_${Date.now()}`;
      const created = await firebaseService.submitPartnerApplication({
        applicantUid: uid,
        orgName: data.orgName,
        orgType: data.orgType,
        contactPerson: data.contactPerson,
        phone: normaliseUgandanPhone(data.phone).e164,
        email: data.email,
        district: data.district,
        applicationType: data.orgType === 'school' ? 'vanguard_club' : 'institutional_partner',
        proposal: data.collaborationProposal,
      });
      if (partnerDocFile && user) {
        const check = validateDocumentFile(partnerDocFile);
        if (!check.valid) {
          throw new Error(check.error || 'Invalid institutional verification document.');
        }
        await uploadApplicationDocument('partnerApplications', created.id, partnerDocFile);
      }

      setPartnerDocFile(null);
      setSuccessData({
        role: 'partner',
        name: data.orgName,
        status: 'pending',
      });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Unable to submit partnership proposal.');
    }
  };

  return (
    <div className="bg-[#F8FAFC] min-h-screen py-10 sm:py-14">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-bold uppercase tracking-widest text-[#005A9C]">
            Get Involved
          </span>
          <h1 className="font-heading text-3xl sm:text-4xl font-extrabold text-[#1B365D] mt-1">
            Join the Boy Child Movement
          </h1>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">
            Select your role below. Every participant goes through our safeguarding onboarding to protect boys (5–17) and empower young men (18–35).
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-1.5 bg-slate-200/70 rounded-2xl mb-8">
          <button
            type="button"
            onClick={() => {
              setSelectedRole('boy');
              setSuccessData(null);
              setSubmitError(null);
            }}
            className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs font-bold transition-all min-h-[44px] ${
              selectedRole === 'boy' ? 'bg-white text-[#1B365D] shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4 text-[#005A9C]" />
            <span>Boy / Young Man</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedRole('guardian');
              setSuccessData(null);
              setSubmitError(null);
            }}
            className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs font-bold transition-all min-h-[44px] ${
              selectedRole === 'guardian' ? 'bg-white text-[#1B365D] shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-[#005A9C]" />
            <span>Parent / Guardian</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedRole('mentor');
              setSuccessData(null);
              setSubmitError(null);
            }}
            className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs font-bold transition-all min-h-[44px] ${
              selectedRole === 'mentor' ? 'bg-white text-[#1B365D] shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <GraduationCap className="w-4 h-4 text-[#005A9C]" />
            <span>Mentor Volunteer</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedRole('partner');
              setSuccessData(null);
              setSubmitError(null);
            }}
            className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs font-bold transition-all min-h-[44px] ${
              selectedRole === 'partner' ? 'bg-white text-[#1B365D] shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-4 h-4 text-[#005A9C]" />
            <span>School / Partner</span>
          </button>
        </div>

        {submitError && (
          <div className="mb-6 p-4 bg-red-50 text-[#DC2626] rounded-2xl border border-red-200 text-xs font-semibold">
            {submitError}
          </div>
        )}

        {/* Success Confirmation Card */}
        {successData && (
          <div className="bg-white rounded-2xl p-8 border border-emerald-200 shadow-md mb-8 text-center">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="font-heading text-2xl font-bold text-[#1B365D]">
              Registration Submitted Successfully
            </h2>
            <p className="mt-2 text-sm text-slate-600 max-w-lg mx-auto">
              Thank you, <strong className="text-[#005A9C]">{successData.name}</strong>.
              {successData.ageCategory && <span className="block text-xs font-semibold mt-1">{successData.ageCategory}</span>}
            </p>

            {successData.status === 'pending_guardian_consent' && (
              <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 max-w-lg mx-auto text-left">
                <div className="font-bold flex items-center gap-2 text-amber-800 mb-1">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span>Safeguarding Hold: Guardian Consent Required</span>
                </div>
                Because you are under 18 years old, your application is held in <strong className="font-mono">pending_guardian_consent</strong> until a verified guardian submits formal safeguarding consent.
              </div>
            )}

            {successData.status === 'pending_vetting' && (
              <div className="mt-4 p-4 bg-purple-50 rounded-xl border border-purple-200 text-xs text-purple-900 max-w-lg mx-auto text-left">
                <div className="font-bold text-purple-900 mb-1">Mentor Vetting in Progress</div>
                Our safeguarding coordinator will verify both community referees and background clearance before circle assignment.
              </div>
            )}

            {successData.role === 'partner' && (
              <div className="mt-4 p-4 bg-cyan-50 rounded-xl border border-cyan-200 text-xs text-cyan-950 max-w-lg mx-auto text-left">
                <div className="font-bold text-cyan-900 mb-1">Partner Review Queued</div>
                Our partnerships team will verify your institution and review your School Vanguard Club or community collaboration proposal.
              </div>
            )}

            <div className="mt-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 max-w-lg mx-auto text-left">
              <div className="font-bold text-emerald-950 mb-1">
                Join the Boys WhatsApp Brotherhood Group (0732320190)
              </div>
              <p className="text-emerald-800 text-[11px] mb-3">
                Connect with our social brotherhood group to receive daily encouragement, peer study tips, and circle session updates.
              </p>
              <a
                href="https://wa.me/256732320190?text=Hello%20Boy%20Child%20Association%2C%20I%20just%20registered%20and%20would%20like%20to%20connect%20with%20the%20boys%20WhatsApp%20group"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition-colors"
              >
                <span>Connect on WhatsApp (0732320190)</span>
              </a>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/auth"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-300 text-[#1B365D] rounded-xl text-xs font-bold hover:bg-slate-50 min-h-[44px]"
              >
                <span>Create / Sign In to Account</span>
              </Link>
              <Link
                to={successData.role === 'guardian' ? '/guardian' : successData.role === 'mentor' ? '/mentor' : successData.role === 'partner' ? '/partner' : '/hub'}
                onClick={() => {
                  if (isDemoModeEnabled && !isLiveFirebaseUser && successData.role === 'guardian') {
                    switchPersona('usr_guardian_grace');
                  }
                }}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#005A9C] text-white rounded-xl text-xs font-bold hover:bg-[#004980] min-h-[44px]"
              >
                <span>Open Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}

        {/* 1. Boy / Young Man Form */}
        {!successData && selectedRole === 'boy' && (
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
            <div className="flex items-start justify-between pb-4 border-b border-slate-100 mb-6">
              <div>
                <h2 className="font-heading text-xl font-bold text-[#1B365D]">
                  Boy or Young Man Registration
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  For boys and young men ages 5 to 35 seeking brotherhood, guidance, and craft skills.
                </p>
              </div>
              <div className="hidden sm:block text-right">
                <span className="text-[11px] font-bold text-slate-400 uppercase">Age Guard</span>
                <div className="font-mono text-sm font-bold text-[#005A9C]">
                  {calculatedAge} Years Old
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmitBoy(onBoySubmit)} className="space-y-4">
              {/* Anti-abuse honeypot field (hidden from real users) */}
              <input type="text" {...registerBoy('honeypot')} className="hidden" tabIndex={-1} autoComplete="off" />

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name <span className="text-[#DC2626]">*</span>
                </label>
                <input
                  type="text"
                  {...registerBoy('fullName')}
                  placeholder="e.g. David Mukasa"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-[#005A9C] min-h-[44px]"
                />
                {boyErrors.fullName && (
                  <p className="text-xs text-[#DC2626] mt-1">{boyErrors.fullName.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Date of Birth <span className="text-[#DC2626]">*</span>
                  </label>
                  <input
                    type="date"
                    {...registerBoy('dateOfBirth')}
                    onChange={(e) => {
                      registerBoy('dateOfBirth').onChange(e);
                      handleDobChange(e);
                    }}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-[#005A9C] min-h-[44px]"
                  />
                  {boyErrors.dateOfBirth && (
                    <p className="text-xs text-[#DC2626] mt-1">{boyErrors.dateOfBirth.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Derived Age (Years)
                  </label>
                  <input
                    type="number"
                    {...registerBoy('calculatedAge', { valueAsNumber: true })}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-slate-50 min-h-[44px]"
                    readOnly
                  />
                  {boyErrors.calculatedAge && (
                    <p className="text-xs text-[#DC2626] mt-1">{boyErrors.calculatedAge.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    District <span className="text-[#DC2626]">*</span>
                  </label>
                  <select
                    {...registerBoy('district')}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-[#005A9C] min-h-[44px]"
                  >
                    {UGANDA_DISTRICTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                  {boyErrors.district && (
                    <p className="text-xs text-[#DC2626] mt-1">{boyErrors.district.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Town / Village / Sub-County <span className="text-[#DC2626]">*</span>
                  </label>
                  <input
                    type="text"
                    {...registerBoy('town')}
                    placeholder="e.g. Kira Town Council, Sector 4"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-[#005A9C] min-h-[44px]"
                  />
                  {boyErrors.town && (
                    <p className="text-xs text-[#DC2626] mt-1">{boyErrors.town.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Current School or Work Activity (Optional)
                </label>
                <input
                  type="text"
                  {...registerBoy('schoolOrOccupation')}
                  placeholder="e.g. Primary 7 Candidate / Solar Apprentice"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-[#005A9C] min-h-[44px]"
                />
              </div>

              {/* Conditional Guardian Section for Under 18s */}
              {isMinor ? (
                <div className="p-4 sm:p-5 rounded-xl bg-[#F0F9FD] border border-blue-200 space-y-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#1B365D]">
                    <Lock className="w-4 h-4 text-[#005A9C]" />
                    <span>Mandatory Safeguarding: Parent or Legal Guardian Details (Age {calculatedAge})</span>
                  </div>
                  <p className="text-xs text-slate-600">
                    In compliance with the Uganda Children Act, every boy under 18 must have an accountable parent or legal guardian on record before being assigned to a circle.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Parent / Guardian Full Name <span className="text-[#DC2626]">*</span>
                      </label>
                      <input
                        type="text"
                        {...registerBoy('guardianName')}
                        placeholder="e.g. Grace Mukasa"
                        className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:border-[#005A9C] min-h-[44px] bg-white"
                      />
                      {boyErrors.guardianName && (
                        <p className="text-xs text-[#DC2626] mt-1">{boyErrors.guardianName.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Parent / Guardian Phone <span className="text-[#DC2626]">*</span>
                      </label>
                      <input
                        type="text"
                        {...registerBoy('guardianPhone')}
                        placeholder="0772XXXXXX"
                        className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:border-[#005A9C] min-h-[44px] bg-white"
                      />
                      {boyErrors.guardianPhone && (
                        <p className="text-xs text-[#DC2626] mt-1">{boyErrors.guardianPhone.message}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="flex items-start gap-2.5 text-xs text-slate-700 cursor-pointer min-h-[44px]">
                      <input
                        type="checkbox"
                        {...registerBoy('guardianConsentGiven')}
                        className="mt-0.5 w-4 h-4 rounded border-slate-300 text-[#005A9C] focus:ring-[#005A9C]"
                      />
                      <span>
                        I confirm that my parent or legal guardian is aware of this application and has given permission for me to join the Boy Child Association circle.
                      </span>
                    </label>
                    {boyErrors.guardianConsentGiven && (
                      <p className="text-xs text-[#DC2626] mt-1">{boyErrors.guardianConsentGiven.message}</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>Applicant is an adult ({calculatedAge} years old). Direct consent applies.</span>
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  Data protected under Uganda DPPA 2019
                </span>
                <button
                  type="submit"
                  disabled={isSubmittingBoy}
                  className="px-6 py-3 bg-[#005A9C] hover:bg-[#004980] text-white text-xs font-bold rounded-xl transition-colors shadow-sm disabled:opacity-50 min-h-[44px]"
                >
                  {isSubmittingBoy ? 'Submitting Application...' : 'Submit Boy Registration'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 2. Guardian Form */}
        {!successData && selectedRole === 'guardian' && (
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
            <h2 className="font-heading text-xl font-bold text-[#1B365D] mb-1">
              Parent or Guardian Registration
            </h2>
            <p className="text-xs text-slate-500 mb-6">
              Register yourself to grant formal consent, track your boys&apos; progress, and connect with circle mentors.
            </p>

            <form onSubmit={handleSubmitGuardian(onGuardianSubmit)} className="space-y-4">
              <input type="text" {...registerGuardian('honeypot')} className="hidden" tabIndex={-1} />

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Your Full Name <span className="text-[#DC2626]">*</span>
                </label>
                <input
                  type="text"
                  {...registerGuardian('fullName')}
                  placeholder="e.g. Grace Mukasa"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-[#005A9C] min-h-[44px]"
                />
                {guardianErrors.fullName && (
                  <p className="text-xs text-[#DC2626] mt-1">{guardianErrors.fullName.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phone Number (MTN / Airtel Uganda) <span className="text-[#DC2626]">*</span>
                  </label>
                  <input
                    type="text"
                    {...registerGuardian('phone')}
                    placeholder="0772123456"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-[#005A9C] min-h-[44px]"
                  />
                  {guardianErrors.phone && (
                    <p className="text-xs text-[#DC2626] mt-1">{guardianErrors.phone.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address (Optional)
                  </label>
                  <input
                    type="email"
                    {...registerGuardian('email')}
                    placeholder="grace@example.com"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-[#005A9C] min-h-[44px]"
                  />
                  {guardianErrors.email && (
                    <p className="text-xs text-[#DC2626] mt-1">{guardianErrors.email.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Relationship to Boy(s) <span className="text-[#DC2626]">*</span>
                  </label>
                  <select
                    {...registerGuardian('relationship')}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-[#005A9C] min-h-[44px]"
                  >
                    <option value="mother">Mother</option>
                    <option value="father">Father</option>
                    <option value="legal_guardian">Legal Guardian</option>
                    <option value="elder_sibling">Elder Sibling (Adult)</option>
                    <option value="extended_family">Grandparent / Extended Family</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Number of Boys to Register <span className="text-[#DC2626]">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    {...registerGuardian('numberOfBoys', { valueAsNumber: true })}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-[#005A9C] min-h-[44px]"
                  />
                  {guardianErrors.numberOfBoys && (
                    <p className="text-xs text-[#DC2626] mt-1">{guardianErrors.numberOfBoys.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  District <span className="text-[#DC2626]">*</span>
                </label>
                <select
                  {...registerGuardian('district')}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-[#005A9C] min-h-[44px]"
                >
                  {UGANDA_DISTRICTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2">
                <label className="flex items-start gap-2.5 text-xs text-slate-700 cursor-pointer min-h-[44px]">
                  <input
                    type="checkbox"
                    {...registerGuardian('safeguardingAgreed')}
                    className="mt-0.5 w-4 h-4 rounded border-slate-300 text-[#005A9C] focus:ring-[#005A9C]"
                  />
                  <span>
                    I accept the BCA Safeguarding Code of Conduct and authorise circle mentors to provide structured guidance to my registered child.
                  </span>
                </label>
                {guardianErrors.safeguardingAgreed && (
                  <p className="text-xs text-[#DC2626] mt-1">{guardianErrors.safeguardingAgreed.message}</p>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
                <button
                  type="submit"
                  disabled={isSubmittingGuardian}
                  className="px-6 py-3 bg-[#005A9C] hover:bg-[#004980] text-white text-xs font-bold rounded-xl transition-colors min-h-[44px]"
                >
                  {isSubmittingGuardian ? 'Registering...' : 'Register as Guardian'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 3. Mentor Form */}
        {!successData && selectedRole === 'mentor' && (
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
            <h2 className="font-heading text-xl font-bold text-[#1B365D] mb-1">
              Apply to Become a Mentor
            </h2>
            <p className="text-xs text-slate-500 mb-6">
              Mentors undergo rigorous vetting including referee interviews and background verification.
            </p>

            <form onSubmit={handleSubmitMentor(onMentorSubmit)} className="space-y-4">
              <input type="text" {...registerMentor('honeypot')} className="hidden" tabIndex={-1} />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Name <span className="text-[#DC2626]">*</span>
                  </label>
                  <input
                    type="text"
                    {...registerMentor('fullName')}
                    placeholder="e.g. Emmanuel Okello"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-[#005A9C] min-h-[44px]"
                  />
                  {mentorErrors.fullName && (
                    <p className="text-xs text-[#DC2626] mt-1">{mentorErrors.fullName.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phone Number <span className="text-[#DC2626]">*</span>
                  </label>
                  <input
                    type="text"
                    {...registerMentor('phone')}
                    placeholder="0772XXXXXX"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-[#005A9C] min-h-[44px]"
                  />
                  {mentorErrors.phone && (
                    <p className="text-xs text-[#DC2626] mt-1">{mentorErrors.phone.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address <span className="text-[#DC2626]">*</span>
                  </label>
                  <input
                    type="email"
                    {...registerMentor('email')}
                    placeholder="emmanuel@example.com"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-[#005A9C] min-h-[44px]"
                  />
                  {mentorErrors.email && (
                    <p className="text-xs text-[#DC2626] mt-1">{mentorErrors.email.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Profession / Occupation <span className="text-[#DC2626]">*</span>
                  </label>
                  <input
                    type="text"
                    {...registerMentor('occupation')}
                    placeholder="e.g. Solar Engineer / Teacher"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-[#005A9C] min-h-[44px]"
                  />
                  {mentorErrors.occupation && (
                    <p className="text-xs text-[#DC2626] mt-1">{mentorErrors.occupation.message}</p>
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Why do you want to mentor boys? (50 to 800 characters) <span className="text-[#DC2626]">*</span>
                  </label>
                  <span className="text-xs font-mono text-slate-400">
                    {mentorMotivation.length}/800
                  </span>
                </div>
                <textarea
                  rows={3}
                  {...registerMentor('motivation')}
                  placeholder="Share your personal motivation, community background, and what values you wish to pass on..."
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:border-[#005A9C]"
                />
                {mentorErrors.motivation && (
                  <p className="text-xs text-[#DC2626] mt-1">{mentorErrors.motivation.message}</p>
                )}
              </div>

              {/* Two Referees Section (Mandatory Safeguarding requirement) */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="text-xs font-bold text-[#1B365D] uppercase tracking-wider">
                  Two Community Referees (Mandatory)
                </div>
                <p className="text-xs text-slate-500">
                  Provide two adults who know you professionally or in the community (e.g. pastor, imam, school head, employer).
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <input
                      type="text"
                      {...registerMentor('referee1Name')}
                      placeholder="Referee 1 Full Name"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white min-h-[44px]"
                    />
                    {mentorErrors.referee1Name && (
                      <p className="text-xs text-[#DC2626] mt-1">{mentorErrors.referee1Name.message}</p>
                    )}
                  </div>
                  <div>
                    <input
                      type="text"
                      {...registerMentor('referee1Phone')}
                      placeholder="Referee 1 Uganda Phone"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white min-h-[44px]"
                    />
                    {mentorErrors.referee1Phone && (
                      <p className="text-xs text-[#DC2626] mt-1">{mentorErrors.referee1Phone.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <input
                      type="text"
                      {...registerMentor('referee2Name')}
                      placeholder="Referee 2 Full Name"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white min-h-[44px]"
                    />
                    {mentorErrors.referee2Name && (
                      <p className="text-xs text-[#DC2626] mt-1">{mentorErrors.referee2Name.message}</p>
                    )}
                  </div>
                  <div>
                    <input
                      type="text"
                      {...registerMentor('referee2Phone')}
                      placeholder="Referee 2 Uganda Phone"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white min-h-[44px]"
                    />
                    {mentorErrors.referee2Phone && (
                      <p className="text-xs text-[#DC2626] mt-1">{mentorErrors.referee2Phone.message}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <label className="flex items-start gap-2.5 text-xs text-slate-700 cursor-pointer min-h-[44px]">
                  <input
                    type="checkbox"
                    {...registerMentor('safeguardingAgreed')}
                    className="mt-0.5 w-4 h-4 rounded border-slate-300 text-[#005A9C] focus:ring-[#005A9C]"
                  />
                  <span>
                    I agree that I will never initiate 1-on-1 private messaging with a minor or meet a boy outside of approved circle activities.
                  </span>
                </label>
                {mentorErrors.safeguardingAgreed && (
                  <p className="text-xs text-[#DC2626] mt-1">{mentorErrors.safeguardingAgreed.message}</p>
                )}

                <label className="flex items-start gap-2.5 text-xs text-slate-700 cursor-pointer min-h-[44px]">
                  <input
                    type="checkbox"
                    {...registerMentor('hasCleanRecordConfirmed')}
                    className="mt-0.5 w-4 h-4 rounded border-slate-300 text-[#005A9C] focus:ring-[#005A9C]"
                  />
                  <span>
                    I confirm that I have never been convicted of any crime involving harm, violence, or abuse toward children.
                  </span>
                </label>
                {mentorErrors.hasCleanRecordConfirmed && (
                  <p className="text-xs text-[#DC2626] mt-1">{mentorErrors.hasCleanRecordConfirmed.message}</p>
                )}
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <span className="font-semibold text-[#1B365D] block">
                    Optional Vetting Document (National ID / LC1 Letter — PDF or Image, max 10 MB)
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {user
                      ? mentorDocFile
                        ? `Selected: ${mentorDocFile.name}`
                        : 'Attaches securely to Firebase Storage for coordinator review.'
                      : 'Sign in first if you want to attach verification documents directly.'}
                  </span>
                </div>
                {user && (
                  <label className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-[#1B365D] cursor-pointer shrink-0">
                    <Upload className="w-3.5 h-3.5 text-[#005A9C]" />
                    <span>{mentorDocFile ? 'Change File' : 'Attach File'}</span>
                    <input
                      type="file"
                      accept="application/pdf,image/jpeg,image/png,image/webp"
                      onChange={(e) => setMentorDocFile(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
                <button
                  type="submit"
                  disabled={isSubmittingMentor}
                  className="px-6 py-3 bg-[#005A9C] hover:bg-[#004980] text-white text-xs font-bold rounded-xl transition-colors min-h-[44px]"
                >
                  {isSubmittingMentor ? 'Submitting Application...' : 'Submit Mentor Application'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 4. Partner Form */}
        {!successData && selectedRole === 'partner' && (
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
            <h2 className="font-heading text-xl font-bold text-[#1B365D] mb-1">
              Partner with the Boy Child Association
            </h2>
            <p className="text-xs text-slate-500 mb-6">
              We collaborate with schools, places of worship, youth NGOs, and local businesses across Uganda.
            </p>

            <form onSubmit={handleSubmitPartner(onPartnerSubmit)} className="space-y-4">
              <input type="text" {...registerPartner('honeypot')} className="hidden" tabIndex={-1} />

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Organisation Name <span className="text-[#DC2626]">*</span>
                </label>
                <input
                  type="text"
                  {...registerPartner('orgName')}
                  placeholder="e.g. Makerere College School"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-[#005A9C] min-h-[44px]"
                />
                {partnerErrors.orgName && (
                  <p className="text-xs text-[#DC2626] mt-1">{partnerErrors.orgName.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Contact Person Full Name <span className="text-[#DC2626]">*</span>
                  </label>
                  <input
                    type="text"
                    {...registerPartner('contactPerson')}
                    placeholder="e.g. Headmaster Patrick Kigozi"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-[#005A9C] min-h-[44px]"
                  />
                  {partnerErrors.contactPerson && (
                    <p className="text-xs text-[#DC2626] mt-1">{partnerErrors.contactPerson.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Organisation Type <span className="text-[#DC2626]">*</span>
                  </label>
                  <select
                    {...registerPartner('orgType')}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-[#005A9C] min-h-[44px]"
                  >
                    <option value="school">Primary / Secondary School</option>
                    <option value="church">Faith Institution (Church / Mosque)</option>
                    <option value="ngo">Registered NGO / CBO</option>
                    <option value="business">Corporate / Business Partner</option>
                    <option value="community_cbo">Community Association</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Official Phone <span className="text-[#DC2626]">*</span>
                  </label>
                  <input
                    type="text"
                    {...registerPartner('phone')}
                    placeholder="0772XXXXXX"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-[#005A9C] min-h-[44px]"
                  />
                  {partnerErrors.phone && (
                    <p className="text-xs text-[#DC2626] mt-1">{partnerErrors.phone.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Official Email <span className="text-[#DC2626]">*</span>
                  </label>
                  <input
                    type="email"
                    {...registerPartner('email')}
                    placeholder="info@school.ug"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-[#005A9C] min-h-[44px]"
                  />
                  {partnerErrors.email && (
                    <p className="text-xs text-[#DC2626] mt-1">{partnerErrors.email.message}</p>
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    How would you like to partner? (30 to 1000 characters) <span className="text-[#DC2626]">*</span>
                  </label>
                  <span className="text-xs font-mono text-slate-400">
                    {proposalText.length}/1000
                  </span>
                </div>
                <textarea
                  rows={3}
                  {...registerPartner('collaborationProposal')}
                  placeholder="e.g. We want to host a Saturday solar skills circle at our secondary school hall for 20 boys..."
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:border-[#005A9C]"
                />
                {partnerErrors.collaborationProposal && (
                  <p className="text-xs text-[#DC2626] mt-1">{partnerErrors.collaborationProposal.message}</p>
                )}
              </div>

              <div className="pt-2">
                <label className="flex items-start gap-2.5 text-xs text-slate-700 cursor-pointer min-h-[44px]">
                  <input
                    type="checkbox"
                    {...registerPartner('safeguardingAgreed')}
                    className="mt-0.5 w-4 h-4 rounded border-slate-300 text-[#005A9C] focus:ring-[#005A9C]"
                  />
                  <span>
                    Our organisation agrees to comply with the Uganda Children Act and BCA Child Protection Guidelines.
                  </span>
                </label>
                {partnerErrors.safeguardingAgreed && (
                  <p className="text-xs text-[#DC2626] mt-1">{partnerErrors.safeguardingAgreed.message}</p>
                )}
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <span className="font-semibold text-[#1B365D] block">
                    Optional Registration Certificate / School Charter (PDF or Image, max 10 MB)
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {user
                      ? partnerDocFile
                        ? `Selected: ${partnerDocFile.name}`
                        : 'Uploads directly to protected verification storage.'
                      : 'Sign in first if you want to attach institutional verification files.'}
                  </span>
                </div>
                {user && (
                  <label className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-[#1B365D] cursor-pointer shrink-0">
                    <Upload className="w-3.5 h-3.5 text-[#005A9C]" />
                    <span>{partnerDocFile ? 'Change File' : 'Attach File'}</span>
                    <input
                      type="file"
                      accept="application/pdf,image/jpeg,image/png,image/webp"
                      onChange={(e) => setPartnerDocFile(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
                <button
                  type="submit"
                  disabled={isSubmittingPartner}
                  className="px-6 py-3 bg-[#005A9C] hover:bg-[#004980] text-white text-xs font-bold rounded-xl transition-colors min-h-[44px]"
                >
                  {isSubmittingPartner ? 'Submitting Proposal...' : 'Submit Partnership Proposal'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
