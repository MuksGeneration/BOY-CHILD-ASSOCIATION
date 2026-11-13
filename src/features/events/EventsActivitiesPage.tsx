import React, { useState } from 'react';
import { firebaseService } from '../../lib/firebase/firebase';
import { useAuth } from '../../hooks/useAuth';
import { usePublicCatalog } from '../../hooks/usePlatformData';
import { eventRegistrationSchema } from '../../lib/validation/schemas';
import { UGANDA_DISTRICTS } from '../../lib/validation/ugandaDistricts';
import { BcaEvent } from '../../types';
import {
  Calendar,
  MapPin,
  CheckCircle2,
  ClipboardCheck,
  XCircle,
  AlertTriangle,
} from 'lucide-react';

export const EventsActivitiesPage: React.FC = () => {
  const { user, role } = useAuth();
  usePublicCatalog(role);
  const events = firebaseService.getEvents();
  const announcements = firebaseService.getAnnouncements();
  const canMarkAttendance = ['coordinator', 'admin', 'mentor', 'partner'].includes(role);

  const [districtFilter, setDistrictFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Registration Modal State
  const [selectedEvent, setSelectedEvent] = useState<BcaEvent | null>(null);
  const [regName, setRegName] = useState(user?.fullName || '');
  const [regEmail, setRegEmail] = useState(user?.email || '');
  const [regDistrict, setRegDistrict] = useState(user?.district || 'Kampala');
  const [regError, setRegError] = useState('');
  const [regReceipt, setRegReceipt] = useState<{ eventTitle: string; code: string } | null>(null);

  // Attendance Roster Selector
  const [rosterEventId, setRosterEventId] = useState<string>(events[0]?.id || '');

  const uniqueDistricts = ['All', ...Array.from(new Set(events.map((e) => e.district)))];
  const categories = ['All', 'Circle Gathering', 'Skills Workshop', 'School Vanguard', 'Guardian Dialogue', 'Sports Wellbeing'];

  const filteredEvents = events.filter((ev) => {
    const matchDist = districtFilter === 'All' || ev.district === districtFilter;
    const matchCat = categoryFilter === 'All' || ev.category === categoryFilter;
    return matchDist && matchCat;
  });

  const allRegistrations = firebaseService.getEventRegistrations();
  const rosterRegistrations = allRegistrations.filter((r) => r.eventId === rosterEventId);

  const openRegistration = (ev: BcaEvent) => {
    setSelectedEvent(ev);
    setRegName(user?.fullName || '');
    setRegEmail(user?.email || '');
    setRegDistrict(user?.district || ev.district || 'Kampala');
    setRegError('');
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) return;
    setRegError('');
    const parsed = eventRegistrationSchema.safeParse({
      eventId: selectedEvent.id,
      attendeeName: regName,
      attendeeEmail: regEmail || undefined,
      district: regDistrict,
    });
    if (!parsed.success) {
      setRegError(parsed.error.issues[0]?.message || 'Check your registration details.');
      return;
    }
    try {
      const reg = await firebaseService.registerForEvent(selectedEvent.id, {
        userId: user?.uid,
        attendeeName: parsed.data.attendeeName,
        attendeeEmail: parsed.data.attendeeEmail,
        attendeeRole: user?.role || 'guest',
        district: parsed.data.district,
      });
      setRegReceipt({ eventTitle: selectedEvent.title, code: reg.confirmationCode });
      setSelectedEvent(null);
    } catch (err) {
      setRegError(err instanceof Error ? err.message : 'Unable to complete event registration.');
    }
  };

  return (
    <div className="bg-[#F8FAFC] min-h-screen pb-16">
      <section className="bg-[#1B365D] text-white py-14 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-[#60C1E5]">
            <span>Uganda Events, Activities &amp; News</span>
            <span aria-hidden="true">·</span>
            <span>Standing Up As A Man</span>
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl font-extrabold max-w-3xl text-balance">
            National &amp; District Calendar
          </h1>
          <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
            Browse supervised district circle gatherings, vocational workshops, School Vanguard summits, and guardian dialogues across Uganda.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-10">
        {regReceipt && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 font-semibold">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>
                Registered for <strong>{regReceipt.eventTitle}</strong> · Confirmation Code:{' '}
                <strong className="font-mono">{regReceipt.code}</strong>
              </span>
            </div>
            <button onClick={() => setRegReceipt(null)} className="text-emerald-700 font-bold hover:underline">
              Dismiss
            </button>
          </div>
        )}

        {/* Filter Bar */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap min-h-[36px] ${
                  categoryFilter === cat
                    ? 'bg-[#005A9C] text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <label htmlFor="event-district-filter" className="text-xs font-semibold text-slate-600">
              District:
            </label>
            <select
              id="event-district-filter"
              value={districtFilter}
              onChange={(e) => setDistrictFilter(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white min-h-[38px]"
            >
              {uniqueDistricts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Events Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-2xl font-bold text-[#1B365D]">
              Upcoming Chapter Gatherings ({filteredEvents.length})
            </h2>
          </div>

          {filteredEvents.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-xs text-slate-500">
              No events match the selected district or category filter.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map((ev) => {
                const userReg = allRegistrations.find(
                  (r) => r.eventId === ev.id && ((user?.uid && r.userId === user.uid) || (user?.email && r.attendeeEmail === user.email))
                );
                const isFull = ev.registeredCount >= ev.capacity;
                const fillPct = Math.min(100, Math.round((ev.registeredCount / Math.max(1, ev.capacity)) * 100));

                return (
                  <div
                    key={ev.id}
                    className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="font-bold text-[#005A9C]">{ev.category}</span>
                        <span aria-hidden="true">·</span>
                        <span>{ev.district}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">
                          {new Date(ev.startsAt).toLocaleDateString('en-GB', { dateStyle: 'medium' })}
                        </span>
                      </div>
                      <h3 className="font-heading text-lg font-bold text-[#1B365D]">{ev.title}</h3>
                      <p className="text-xs text-slate-600 leading-relaxed">{ev.description}</p>
                    </div>

                    <div className="space-y-3 pt-3 border-t border-slate-100 text-xs">
                      <div className="flex items-center gap-2 text-slate-600">
                        <MapPin className="w-3.5 h-3.5 text-[#005A9C] shrink-0" />
                        <span>{ev.location}</span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] text-slate-600 font-mono tabular-nums">
                          <span>Capacity</span>
                          <span>
                            {ev.registeredCount} / {ev.capacity} places
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${isFull ? 'bg-amber-600' : 'bg-[#005A9C]'}`}
                            style={{ width: `${fillPct}%` }}
                          />
                        </div>
                      </div>

                      {userReg ? (
                        <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 font-semibold flex items-center justify-between">
                          <span>Registered ({userReg.attendanceStatus})</span>
                          <span className="font-mono text-[11px]">{userReg.confirmationCode}</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => openRegistration(ev)}
                          disabled={isFull}
                          className="w-full py-2.5 bg-[#005A9C] hover:bg-[#004980] disabled:bg-slate-300 text-white font-bold rounded-xl text-xs min-h-[42px]"
                        >
                          {isFull ? 'Event Full' : 'Register for Event'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Event Attendance Register (Coordinators, Mentors, Partners, Admins) */}
        {canMarkAttendance && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
              <div>
                <h2 className="font-heading text-lg font-bold text-[#1B365D] flex items-center gap-2">
                  <ClipboardCheck className="w-5 h-5 text-[#005A9C]" />
                  <span>Event Attendance &amp; Check-In Roster</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Record event check-ins for registered attendees. Every attendance change writes an audit log entry.
                </p>
              </div>
              <select
                value={rosterEventId}
                onChange={(e) => setRosterEventId(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white min-h-[40px]"
              >
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.title} ({ev.district})
                  </option>
                ))}
              </select>
            </div>

            {rosterRegistrations.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">
                No attendees registered for this event yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-bold">
                      <th className="py-2.5 pr-4">Attendee</th>
                      <th className="py-2.5 px-4">Code</th>
                      <th className="py-2.5 px-4">Role &amp; District</th>
                      <th className="py-2.5 px-4">Status</th>
                      <th className="py-2.5 pl-4 text-right">Mark Attendance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rosterRegistrations.map((reg) => (
                      <tr key={reg.id}>
                        <td className="py-3 pr-4 font-bold text-[#1B365D]">{reg.attendeeName}</td>
                        <td className="py-3 px-4 font-mono text-[#005A9C]">{reg.confirmationCode}</td>
                        <td className="py-3 px-4 text-slate-600 capitalize">
                          {reg.attendeeRole} · {reg.district}
                        </td>
                        <td className="py-3 px-4 capitalize font-semibold text-emerald-700">
                          {reg.attendanceStatus}
                        </td>
                        <td className="py-3 pl-4 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => firebaseService.recordEventAttendance(reg.id, 'present')}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                            >
                              Present
                            </button>
                            <button
                              onClick={() => firebaseService.recordEventAttendance(reg.id, 'excused')}
                              className="px-2.5 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 font-semibold"
                            >
                              Excused
                            </button>
                            <button
                              onClick={() => firebaseService.recordEventAttendance(reg.id, 'absent')}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold"
                            >
                              Absent
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Announcements & Impact Stories */}
        <div className="space-y-4">
          <h2 className="font-heading text-2xl font-bold text-[#1B365D]">Announcements &amp; Impact Stories</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {announcements.map((a) => (
              <div key={a.id} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-2">
                <div className="text-xs text-slate-500">
                  <span className="capitalize font-bold text-[#005A9C]">{a.type}</span> · {a.district} ·{' '}
                  <span className="font-mono tabular-nums">{a.publishedDate}</span>
                </div>
                <h3 className="font-heading text-lg font-bold text-[#1B365D]">{a.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{a.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Registration Modal */}
      {selectedEvent && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="font-heading text-lg font-bold text-[#1B365D]">
                  Register for Event
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">{selectedEvent.title}</p>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-slate-400 hover:text-slate-700"
                aria-label="Close registration modal"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {regError && (
              <div className="p-3 bg-red-50 border border-red-200 text-[#DC2626] rounded-xl text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{regError}</span>
              </div>
            )}

            <form onSubmit={handleRegisterSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Attendee Full Name</label>
                <input
                  type="text"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 min-h-[44px]"
                  required
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email (optional)</label>
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 min-h-[44px]"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Uganda District</label>
                <select
                  value={regDistrict}
                  onChange={(e) => setRegDistrict(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 min-h-[44px]"
                >
                  {UGANDA_DISTRICTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedEvent(null)}
                  className="px-4 py-2 font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#005A9C] hover:bg-[#004980] text-white font-bold rounded-xl min-h-[44px] flex items-center gap-1.5"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Confirm Event Registration</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
