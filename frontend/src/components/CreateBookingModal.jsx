import React, { useState, useEffect, useCallback } from 'react';
import { createBooking, updateBooking, getAvailability } from '../services/bookingService';
import { getAllFacilities } from '../services/facilityService';
import { 
  MapPin, Users, Clock, Lock, CheckCircle, 
  AlertCircle, XCircle, Loader2, Calendar,
  Edit3, Sparkles, ChevronRight, Info
} from 'lucide-react';
import { motion as Motion, AnimatePresence } from 'framer-motion';

// ─────────────────────────────────────────────────────────────
// Time-slot helpers — 15-minute intervals 08:00 → 20:00
// ─────────────────────────────────────────────────────────────
function generateTimeSlots() {
  const slots = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 15) {
      slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }
  }
  slots.push('24:00');
  return slots;
}

const TIME_SLOTS = generateTimeSlots();

function getWindowConfig(windowStr) {
  if (!windowStr) return { start: '08:00', end: '20:00' };
  // Find time pattern like 08:00-20:00 or 08.00-20.00
  const match = windowStr.match(/([0-1]?\d|2[0-3])[:.]([0-5]\d)\s*-\s*([0-1]?\d|2[0-3])[:.]([0-5]\d)/);
  if (match) {
    return {
      start: `${match[1].padStart(2, '0')}:${match[2]}`,
      end: `${match[3].padStart(2, '0')}:${match[4]}`
    };
  }
  return { start: '08:00', end: '20:00' };
}

function todayString() {
  return new Date().toISOString().split('T')[0];
}

function toMinutes(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function getNext15MinSlot() {
  const now = new Date();
  let h = now.getHours();
  let m = now.getMinutes();
  m = Math.ceil((m + 1) / 15) * 15;
  if (m >= 60) { h += 1; m = 0; }
  if (h < 8) return '08:00';
  if (h >= 20) return '20:00';
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function getAllowedDays(windowStr) {
  if (!windowStr) return null;
  const s = windowStr.toLowerCase();
  const shortDays = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  if (s.includes('mon-sun')) return [0,1,2,3,4,5,6];
  if (s.includes('weekdays')) return [1,2,3,4,5];
  if (s.includes('weekends')) return [0,6];
  const match = s.match(/(mon|tue|wed|thu|fri|sat|sun|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\s*-\s*(mon|tue|wed|thu|fri|sat|sun|monday|tuesday|wednesday|thursday|friday|saturday|sunday)/);
  if (match) {
    const startIdx = shortDays.findIndex(d => match[1].startsWith(d));
    const endIdx = shortDays.findIndex(d => match[2].startsWith(d));
    if (startIdx === -1 || endIdx === -1) return null;
    const allowed = [];
    let curr = startIdx;
    while (curr !== endIdx) { allowed.push(curr); curr = (curr + 1) % 7; }
    allowed.push(endIdx);
    return allowed;
  }
  return null;
}

function calcRangeRemaining(startTime, endTime, slotMap) {
  if (!startTime || !endTime || !slotMap) return null;
  const startMin = toMinutes(startTime);
  const endMin   = toMinutes(endTime);
  let minRemaining = Infinity;
  let found = false;

  for (const [key, slot] of Object.entries(slotMap)) {
    const sMin = toMinutes(key);
    if (sMin < endMin && sMin + 15 > startMin) {
      minRemaining = Math.min(minRemaining, slot.remainingCapacity);
      found = true;
    }
  }
  return found ? minRemaining : null;
}

function buildBookingRows(slotMap) {
  if (!slotMap) return [];
  const keys = Object.keys(slotMap).sort();
  const rows = [];
  let i = 0;
  while (i < keys.length) {
    const slot = slotMap[keys[i]];
    if (!slot || slot.bookedCapacity === 0) { i++; continue; }
    const windowStart = keys[i];
    const cap = slot.bookedCapacity;
    let j = i + 1;
    while (j < keys.length && slotMap[keys[j]]?.bookedCapacity === cap) j++;
    const lastSlot = slotMap[keys[j - 1]];
    const rawEnd = lastSlot?.endTime ?? '';
    const windowEnd = typeof rawEnd === 'string' ? rawEnd.substring(0, 5) : rawEnd;
    rows.push({ start: windowStart, end: windowEnd, booked: cap });
    i = j;
  }
  return rows;
}

function BookingSummaryCard({ slotMap, startTime, endTime, rangeRemaining, availLoading, isMeetingRoom, capacity }) {
  if (availLoading) {
    return (
      <div className="rounded-2xl border border-indigo-100 bg-indigo-50/30 px-4 py-4 flex items-center gap-3 text-indigo-600 text-sm font-medium animate-pulse">
        <Loader2 className="w-5 h-5 animate-spin flex-shrink-0" />
        Synchronizing availability...
      </div>
    );
  }

  if (!slotMap) return null;

  const bookingRows = buildBookingRows(slotMap);
  const hasRange    = startTime && endTime && toMinutes(startTime) < toMinutes(endTime);

  let bannerTheme;
  if (!hasRange || rangeRemaining === null) {
    bannerTheme = null;
  } else if (rangeRemaining === 0 || (isMeetingRoom && rangeRemaining < capacity)) {
    bannerTheme = { bg: 'bg-rose-50', border: 'border-rose-100', text: 'text-rose-700', icon: <XCircle className="w-4 h-4 flex-shrink-0" /> };
  } else if (rangeRemaining <= 5) {
    bannerTheme = { bg: 'bg-amber-50', border: 'border-amber-100', text: 'text-amber-700', icon: <AlertCircle className="w-4 h-4 flex-shrink-0" /> };
  } else {
    bannerTheme = { bg: 'bg-emerald-50', border: 'border-emerald-100', text: 'text-emerald-700', icon: <CheckCircle className="w-4 h-4 flex-shrink-0" /> };
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
      <div className="flex items-center gap-2 px-4 py-3 bg-slate-50/80 border-b border-slate-200">
        <Calendar className="w-4 h-4 text-slate-500" />
        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Scheduled Bookings</span>
      </div>

      <div className="px-4 py-4">
        {bookingRows.length === 0 ? (
          <p className="text-xs text-slate-400 italic font-medium">No reservations confirmed for this date yet.</p>
        ) : (
          <div className="space-y-2">
            {bookingRows.map((row, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <span className="text-sm font-black text-slate-600">
                  {row.start} — {row.end}
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-[10px] font-black uppercase tracking-wider">
                  <Users className="w-3 h-3" />
                  {isMeetingRoom ? 'Reserved' : `${row.booked} Occupied`}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {bannerTheme && rangeRemaining !== null && (
        <div className={`flex items-start gap-3 px-4 py-3 border-t border-slate-100 ${bannerTheme.bg} ${bannerTheme.text}`}>
          {bannerTheme.icon}
          <p className="text-xs font-bold leading-relaxed">
            {rangeRemaining === 0 || (isMeetingRoom && rangeRemaining < capacity) ? (
              <>Selected Window: <span className="font-black">{startTime}–{endTime}</span> is {isMeetingRoom ? 'unavailable (Private Booking)' : 'fully booked'}.</>
            ) : (
              <><span className="font-black">{isMeetingRoom ? 'Available' : `${rangeRemaining} seats available`}</span> from {startTime} to {endTime}.</>
            )}
          </p>
        </div>
      )}
    </div>
  );
}

function SmartTimeSelect({ id, name, value, onChange, slotMap, filterFn, disabled, hidePast, windowStart, windowEnd }) {
  const nowStr = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  
  const isSlotDisabled = (t) => {
    if (hidePast && t < nowStr) return true;
    if (!slotMap || !slotMap[t]) return false;
    return slotMap[t].remainingCapacity === 0;
  };

  const startMin = toMinutes(windowStart || '08:00');
  const endMin = toMinutes(windowEnd || '20:00');

  const visibleSlots = TIME_SLOTS.filter(t => {
    const tMin = toMinutes(t);
    return tMin >= startMin && tMin <= endMin;
  });

  const finalSlots = filterFn ? visibleSlots.filter(filterFn) : visibleSlots;

  return (
    <select
      id={id}
      name={name}
      value={value}
      onChange={onChange}
      disabled={disabled}
      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700
                 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all appearance-none
                 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {finalSlots.map((t) => {
        const disabledSlot = isSlotDisabled(t);
        if (hidePast && disabledSlot && t < nowStr) return null; // Hide past times for today
        return (
          <option key={t} value={t} disabled={disabledSlot}>
            {t}
          </option>
        );
      })}
    </select>
  );
}

const EMPTY_FORM = {
  resourceId: '',
  date: todayString(),
  startTime: '08:00',
  endTime: '09:00',
  attendees: 1,
  purpose: '',
};

export default function CreateBookingModal({ isOpen, onClose, onSuccess, preSelectedResource, editBooking }) {
  const [formData, setFormData]         = useState(EMPTY_FORM);
  const [resources, setResources]       = useState([]);
  const [resourcesLoading, setResourcesLoading] = useState(false);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');
  const [slotMap, setSlotMap]           = useState(null);
  const [availLoading, setAvailLoading] = useState(false);

  const activeResource = preSelectedResource || resources.find(r => String(r.id) === String(formData.resourceId)) || null;
  const isEdit = !!editBooking;

  useEffect(() => {
    if (!isOpen) return;

    if (isEdit) {
      setFormData({
        resourceId: String(editBooking.resourceId),
        date: editBooking.bookingDate,
        startTime: editBooking.startTime.substring(0, 5),
        endTime: editBooking.endTime.substring(0, 5),
        attendees: editBooking.expectedAttendees,
        purpose: editBooking.purpose,
      });
    } else {
      setFormData({
        ...EMPTY_FORM,
        date: todayString(),
        startTime: getNext15MinSlot(),
        endTime: '20:00', // Default end to end of window
        resourceId: preSelectedResource ? String(preSelectedResource.id) : '',
      });
    }

    setError('');
    setSlotMap(null);

    if (!preSelectedResource && !isEdit) {
      const fetchResources = async () => {
        setResourcesLoading(true);
        try {
          const data = await getAllFacilities();
          const list = Array.isArray(data) ? data : data.content ?? [];
          const bookable = list.filter((r) => r.bookingStatus === 'CAN_BOOK_NOW');
          setResources(bookable);
          if (bookable.length > 0 && !formData.resourceId) {
            setFormData(prev => ({ ...prev, resourceId: String(bookable[0].id) }));
          }
        } catch {
          setResources([]);
        } finally {
          setResourcesLoading(false);
        }
      };
      fetchResources();
    }
  }, [isOpen, preSelectedResource, editBooking, isEdit, formData.resourceId]);

  const fetchAvailability = useCallback(async (resourceId, date) => {
    if (!resourceId || !date) return;
    setAvailLoading(true);
    try {
      const slots = await getAvailability(resourceId, date);
      const map = {};
      if (Array.isArray(slots)) {
        slots.forEach((s) => {
          const key = s.startTime?.substring(0, 5);
          if (key) map[key] = s;
        });
      }
      setSlotMap(map);
    } catch {
      setSlotMap({});
    } finally {
      setAvailLoading(false);
    }
  }, []);

  useEffect(() => {
    const rid = activeResource?.id;
    if (rid && formData.date) {
      fetchAvailability(rid, formData.date);
    }
  }, [formData.resourceId, formData.date, activeResource?.id, fetchAvailability]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const isToday = formData.date === todayString();
  const windowConfig = getWindowConfig(activeResource?.availabilityWindows);
  const rangeRemaining = calcRangeRemaining(formData.startTime, formData.endTime, slotMap);
  const isMeetingRoom = activeResource?.type === 'MEETING_ROOM';

  // Validation Logic
  const getValidationErrors = () => {
    const errors = {};
    
    // Day Validation
    const allowedDays = getAllowedDays(activeResource?.availabilityWindows);
    if (formData.date && allowedDays) {
      const selectedDay = new Date(formData.date).getDay();
      if (!allowedDays.includes(selectedDay)) {
        errors.date = `This resource is only available ${activeResource.availabilityWindows.split(' ')[0]}. Please select a valid date.`;
      }
    }

    // Time Validation
    const nowStr = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    if (isToday && formData.startTime < nowStr) {
      errors.startTime = 'Start time must be in the future.';
    }
    if (toMinutes(formData.startTime) >= toMinutes(formData.endTime)) {
      errors.endTime = 'End time must be after start time.';
    }

    // Capacity & Meeting Room Logic
    if (rangeRemaining !== null) {
      if (isMeetingRoom && rangeRemaining < (activeResource?.capacity || 0)) {
        errors.capacity = "This meeting room is already reserved for this time slot. Meeting rooms are private spaces and cannot be shared.";
      } else if (Number(formData.attendees) > rangeRemaining) {
        errors.capacity = `Capacity exceeded — only ${rangeRemaining} seats remaining for this time slot.`;
      }
    }

    if (!formData.purpose.trim()) errors.purpose = 'Please provide a purpose.';
    if (!formData.resourceId && !activeResource) errors.resource = 'Please select a resource.';

    return errors;
  };

  const validationErrors = getValidationErrors();
  const hasErrors = Object.keys(validationErrors).length > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (hasErrors) return;

    setLoading(true);
    setError('');
    try {
      const payload = {
        resourceId: Number(formData.resourceId),
        bookingDate: formData.date,
        startTime: `${formData.startTime}:00`,
        endTime:   `${formData.endTime}:00`,
        expectedAttendees: Number(formData.attendees),
        purpose: formData.purpose.trim(),
      };
      
      if (isEdit) {
        await updateBooking(editBooking.id, payload);
      } else {
        await createBooking(payload);
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      if (err?.response?.status === 409) {
        setError(`Capacity exceeded — only ${rangeRemaining || 0} seats remaining for this time slot.`);
      } else {
        setError(err?.response?.data?.message || err?.message || 'Transaction failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Scroll Control & Hidden Scrollbar Style */}
        <style dangerouslySetInnerHTML={{ __html: `
          .no-scrollbar::-webkit-scrollbar { display: none; }
          .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; scroll-behavior: smooth; }
        `}} />

        <Motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
          onClick={onClose}
        />

        <Motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col border border-white/20"
        >
          {/* ── Modal Header with Image ── */}
          <div className="relative h-48 sm:h-56 bg-indigo-600 flex-shrink-0">
            {activeResource?.imageUrl ? (
              <img src={activeResource.imageUrl} className="w-full h-full object-cover" alt="Resource" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-indigo-600 via-indigo-700 to-blue-800 flex items-center justify-center">
                <Sparkles className="w-16 h-16 text-white/20" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent flex flex-col justify-end p-8">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                <span className="text-[10px] font-black text-white/70 uppercase tracking-[0.3em]">
                  {isEdit ? 'Modification Mode' : 'New Reservation'}
                </span>
              </div>
              <h2 className="text-3xl font-black text-white tracking-tighter">
                {isEdit ? 'Edit Booking' : 'Book Resource'}
              </h2>
            </div>
            <button onClick={onClose} className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white flex items-center justify-center transition-all">
              <XCircle className="w-5 h-5" />
            </button>
          </div>

          {/* ── Modal Content Area ── */}
          <div className="flex-1 overflow-y-auto no-scrollbar p-8 pt-6">
            <form onSubmit={handleSubmit} className="space-y-8">
              <AnimatePresence>
                {error && (
                  <Motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-700 text-sm font-bold">
                    <XCircle className="w-5 h-5 flex-shrink-0" /> {error}
                  </Motion.div>
                )}
              </AnimatePresence>

              {/* Resource Info Section */}
              <div className="p-6 bg-slate-50 border border-slate-100 rounded-[2rem] space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Selected Resource</p>
                    <h3 className="text-lg font-black text-slate-900 leading-tight">
                      {activeResource?.name || (resourcesLoading ? 'Syncing...' : 'Select a resource')}
                    </h3>
                  </div>
                  <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100">
                    <Users className="w-5 h-5 text-indigo-600" />
                  </div>
                </div>

                {!isEdit && !preSelectedResource && (
                   <select name="resourceId" value={formData.resourceId} onChange={handleChange} className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:ring-4 focus:ring-indigo-500/10">
                     {resources.map(r => <option key={r.id} value={r.id}>{r.name} — Cap: {r.capacity}</option>)}
                   </select>
                )}

                <div className="flex flex-wrap gap-4 pt-2">
                   <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                     <MapPin className="w-4 h-4 text-indigo-500" /> {activeResource?.building || 'Location N/A'}
                   </div>
                   <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                     <Users className="w-4 h-4 text-indigo-500" /> Max Capacity: {activeResource?.capacity || 'N/A'}
                   </div>
                </div>
              </div>

              {/* Schedule Section */}
              <div className="space-y-5">
                <div className="flex items-center gap-3 border-l-4 border-indigo-500 pl-4">
                  <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">Schedule Details</h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Reservation Date</label>
                    <input type="date" name="date" value={formData.date} min={todayString()} onChange={handleChange} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all" />
                    {validationErrors.date && (
                      <p className="flex items-center gap-1 text-[10px] font-bold text-rose-600 px-2">
                        <XCircle className="w-3 h-3" /> {validationErrors.date}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Expected Attendees</label>
                    <input type="number" name="attendees" value={formData.attendees} onChange={handleChange} min="1" max={activeResource?.capacity} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all" />
                    {validationErrors.capacity && (
                      <p className="flex items-center gap-1 text-[10px] font-bold text-rose-600 px-2 leading-tight">
                        <XCircle className="w-3 h-3 flex-shrink-0" /> {validationErrors.capacity}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-4 px-2 py-2 bg-indigo-50/50 rounded-xl text-indigo-700 text-[10px] font-bold uppercase tracking-wider">
                  <Clock className="w-3 h-3" />
                  Available hours: {windowConfig.start} — {windowConfig.end}
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Start Time</label>
                    <SmartTimeSelect 
                      id="start-time" 
                      name="startTime" 
                      value={formData.startTime} 
                      onChange={handleChange} 
                      slotMap={slotMap} 
                      disabled={availLoading} 
                      filterFn={t => t !== windowConfig.end} 
                      hidePast={isToday}
                      windowStart={windowConfig.start}
                      windowEnd={windowConfig.end}
                    />
                    {validationErrors.startTime && (
                      <p className="flex items-center gap-1 text-[10px] font-bold text-rose-600 px-2">
                        <XCircle className="w-3 h-3" /> {validationErrors.startTime}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">End Time</label>
                    <SmartTimeSelect 
                      id="end-time" 
                      name="endTime" 
                      value={formData.endTime} 
                      onChange={handleChange} 
                      slotMap={slotMap} 
                      disabled={availLoading} 
                      filterFn={t => t !== windowConfig.start && toMinutes(t) > toMinutes(formData.startTime)}
                      windowStart={windowConfig.start}
                      windowEnd={windowConfig.end}
                    />
                    {validationErrors.endTime && (
                      <p className="flex items-center gap-1 text-[10px] font-bold text-rose-600 px-2">
                        <XCircle className="w-3 h-3" /> {validationErrors.endTime}
                      </p>
                    )}
                  </div>
                </div>

                <BookingSummaryCard slotMap={slotMap} startTime={formData.startTime} endTime={formData.endTime} rangeRemaining={rangeRemaining} availLoading={availLoading} isMeetingRoom={isMeetingRoom} capacity={activeResource?.capacity} />
              </div>

              {/* Purpose Section */}
              <div className="space-y-2">
                <div className="flex items-center gap-3 border-l-4 border-indigo-500 pl-4 mb-4">
                  <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">Purpose of Booking</h4>
                </div>
                <textarea name="purpose" value={formData.purpose} onChange={handleChange} rows={3} placeholder="Tell us about your event..." className="w-full p-6 bg-slate-50 border border-slate-200 rounded-[2rem] text-sm font-medium text-slate-700 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all resize-none" />
                {validationErrors.purpose && (
                  <p className="flex items-center gap-1 text-[10px] font-bold text-rose-600 px-4">
                    <XCircle className="w-3 h-3" /> {validationErrors.purpose}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-4 pt-4 pb-2">
                <button type="submit" disabled={loading || availLoading || hasErrors} className="flex-1 bg-gradient-to-r from-indigo-600 to-blue-600 hover:scale-[1.02] active:scale-95 disabled:opacity-50 text-white font-black py-5 px-8 rounded-3xl transition-all shadow-xl shadow-indigo-200 flex items-center justify-center gap-3">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Edit3 className="w-5 h-5" /> {isEdit ? 'Update Booking' : 'Confirm Reservation'}</>}
                  {!loading && <ChevronRight className="w-5 h-5 opacity-50" />}
                </button>
                <button type="button" onClick={onClose} className="px-8 py-5 text-sm font-black text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-3xl transition-all">Cancel</button>
              </div>
            </form>
          </div>
        </Motion.div>
      </div>
    </AnimatePresence>
  );
}
