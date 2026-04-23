import React, { useState, useEffect, useCallback } from 'react';
import { createBooking, getAvailability } from '../services/bookingService';
import { getAllFacilities } from '../services/facilityService';
import { MapPin, Users, Clock, Lock, CheckCircle, AlertCircle, XCircle, Loader2 } from 'lucide-react';

// ─────────────────────────────────────────────────────────────
// Time-slot helpers — 15-minute intervals 08:00 → 20:00
// ─────────────────────────────────────────────────────────────
function generateTimeSlots() {
  const slots = [];
  for (let h = 8; h <= 20; h++) {
    for (let m = 0; m < 60; m += 15) {
      if (h === 20 && m > 0) break;
      slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }
  }
  return slots;
}

const TIME_SLOTS = generateTimeSlots(); // ["08:00","08:15",...,"20:00"]

function todayString() {
  return new Date().toISOString().split('T')[0];
}

// Parse "HH:MM" → minutes from midnight
function toMinutes(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

// Given start + end time strings and a flat slot list from the backend,
// find the MINIMUM remaining capacity across all 15-min slots in the range.
function calcRangeRemaining(startTime, endTime, slotMap) {
  if (!startTime || !endTime || !slotMap) return null;
  const startMin = toMinutes(startTime);
  const endMin   = toMinutes(endTime);
  let minRemaining = Infinity;
  let found = false;

  for (const [key, slot] of Object.entries(slotMap)) {
    const sMin = toMinutes(key);
    // slot covers [sMin, sMin+15) — overlaps range if sMin < endMin && sMin+15 > startMin
    if (sMin < endMin && sMin + 15 > startMin) {
      minRemaining = Math.min(minRemaining, slot.remainingCapacity);
      found = true;
    }
  }
  return found ? minRemaining : null;
}

// ─────────────────────────────────────────────────────────────
// Booking Summary Card
// Shows existing bookings on the date + remaining capacity
// for the user's chosen time range.
// ─────────────────────────────────────────────────────────────

// Derive a consolidated list of "real" booking windows from the slotMap.
// Consecutive occupied 15-min slots that share the same bookedCapacity are
// merged into one row so the card reads like "08:00 – 09:00  →  6 seats booked".
function buildBookingRows(slotMap) {
  if (!slotMap) return [];

  const keys = Object.keys(slotMap).sort();
  const rows = [];
  let i = 0;

  while (i < keys.length) {
    const slot = slotMap[keys[i]];
    if (!slot || slot.bookedCapacity === 0) { i++; continue; }

    // Start a new occupied window
    const windowStart = keys[i];
    const cap = slot.bookedCapacity;
    let j = i + 1;

    // Extend while next slot has the same bookedCapacity
    while (j < keys.length && slotMap[keys[j]]?.bookedCapacity === cap) j++;

    // End time = start of the slot after the window
    const lastSlot = slotMap[keys[j - 1]];
    // endTime stored as "HH:MM:SS" or "HH:MM" — normalise to "HH:MM"
    const rawEnd = lastSlot?.endTime ?? '';
    const windowEnd = typeof rawEnd === 'string' ? rawEnd.substring(0, 5) : rawEnd;

    rows.push({ start: windowStart, end: windowEnd, booked: cap });
    i = j;
  }

  return rows;
}

function BookingSummaryCard({ slotMap, startTime, endTime, rangeRemaining, totalCapacity, availLoading }) {
  if (availLoading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 flex items-center gap-2 text-slate-500 text-sm">
        <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
        Checking availability…
      </div>
    );
  }

  if (!slotMap) return null;

  const bookingRows = buildBookingRows(slotMap);
  const hasRange    = startTime && endTime && toMinutes(startTime) < toMinutes(endTime);

  // Colour theme for the selected-range remaining banner
  let bannerTheme;
  if (!hasRange || rangeRemaining === null) {
    bannerTheme = null;
  } else if (rangeRemaining === 0) {
    bannerTheme = { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', icon: <XCircle className="w-4 h-4 flex-shrink-0" /> };
  } else if (rangeRemaining <= 5) {
    bannerTheme = { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', icon: <AlertCircle className="w-4 h-4 flex-shrink-0" /> };
  } else {
    bannerTheme = { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', icon: <CheckCircle className="w-4 h-4 flex-shrink-0" /> };
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">

      {/* Card header */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border-b border-slate-200">
        <span className="text-base">📅</span>
        <span className="text-sm font-semibold text-slate-700">Bookings on this date</span>
      </div>

      {/* Existing bookings list */}
      <div className="px-4 py-3">
        {bookingRows.length === 0 ? (
          <p className="text-sm text-slate-400 italic">No bookings yet on this date</p>
        ) : (
          <ul className="space-y-1.5">
            {bookingRows.map((row, idx) => (
              <li key={idx} className="flex items-center justify-between text-sm">
                <span className="font-mono text-slate-600 font-medium">
                  {row.start} &ndash; {row.end}
                </span>
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
                  <Users className="w-3 h-3" />
                  {row.booked} seat{row.booked !== 1 ? 's' : ''} booked
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Selected range remaining capacity banner */}
      {bannerTheme && rangeRemaining !== null && (
        <div className={`flex items-center gap-2.5 px-4 py-3 border-t border-slate-200 ${bannerTheme.bg} ${bannerTheme.text}`}>
          {bannerTheme.icon}
          <span className="text-sm font-medium">
            {rangeRemaining === 0 ? (
              <>✅ Your selected range: <strong>{startTime}–{endTime}</strong>&nbsp;&nbsp;Fully booked — no seats remaining</>
            ) : (
              <>✅ Your selected range: <strong>{startTime}–{endTime}</strong>&nbsp;&nbsp;
                <strong>{rangeRemaining}</strong> of {totalCapacity} seat{totalCapacity !== 1 ? 's' : ''} remaining
              </>
            )}
          </span>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Simple Time Select — clean HH:MM labels only
// Fully-booked slots (remainingCapacity === 0) remain disabled
// so the user cannot select them, but labels stay clean.
// ─────────────────────────────────────────────────────────────
function SmartTimeSelect({ id, name, value, onChange, slotMap, filterFn, disabled }) {
  const isSlotDisabled = (t) => {
    if (!slotMap || !slotMap[t]) return false;
    return slotMap[t].remainingCapacity === 0;
  };

  const visibleSlots = filterFn ? TIME_SLOTS.filter(filterFn) : TIME_SLOTS;

  return (
    <select
      id={id}
      name={name}
      value={value}
      onChange={onChange}
      disabled={disabled}
      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white
                 focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                 disabled:bg-slate-50 disabled:text-slate-400 transition"
    >
      {visibleSlots.map((t) => (
        <option key={t} value={t} disabled={isSlotDisabled(t)}>
          {t}
        </option>
      ))}
    </select>
  );
}

// ─────────────────────────────────────────────────────────────
// Default empty form
// ─────────────────────────────────────────────────────────────
const EMPTY_FORM = {
  resourceId: '',
  date: todayString(),
  startTime: '08:00',
  endTime: '09:00',
  attendees: 1,
  purpose: '',
};

// ─────────────────────────────────────────────────────────────
// Main Modal
// ─────────────────────────────────────────────────────────────
export default function CreateBookingModal({ isOpen, onClose, onSuccess, preSelectedResource }) {
  const [formData, setFormData]         = useState(EMPTY_FORM);
  const [resources, setResources]       = useState([]);
  const [resourcesLoading, setResourcesLoading] = useState(false);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');

  // Availability data — keyed by "HH:MM" slot start
  const [slotMap, setSlotMap]           = useState(null);  // null = not fetched yet
  const [availLoading, setAvailLoading] = useState(false);

  // ── Resolve the active resource object ──────────────────────
  const activeResource = preSelectedResource
    ? preSelectedResource
    : resources.find((r) => String(r.id) === String(formData.resourceId)) ?? null;

  const totalCapacity = activeResource?.capacity ?? 0;

  // ── Initialise / reset when modal opens ─────────────────────
  useEffect(() => {
    if (!isOpen) return;

    const initial = preSelectedResource
      ? { ...EMPTY_FORM, date: todayString(), resourceId: String(preSelectedResource.id) }
      : { ...EMPTY_FORM, date: todayString() };

    setFormData(initial);
    setError('');
    setSlotMap(null);

    if (preSelectedResource) {
      // No need to fetch resources list
      setResources([]);
    } else {
      // Fetch bookable resources for the dropdown
      const fetchResources = async () => {
        setResourcesLoading(true);
        try {
          const data = await getAllFacilities();
          const list = Array.isArray(data) ? data : data.content ?? [];
          const bookable = list.filter((r) => r.bookingStatus === 'CAN_BOOK_NOW');
          setResources(bookable);
          if (bookable.length > 0) {
            setFormData((prev) => ({ ...prev, resourceId: String(bookable[0].id) }));
          }
        } catch {
          setResources([]);
        } finally {
          setResourcesLoading(false);
        }
      };
      fetchResources();
    }
  }, [isOpen, preSelectedResource]);

  // ── Fetch availability whenever resource + date change ───────
  const fetchAvailability = useCallback(async (resourceId, date) => {
    if (!resourceId || !date) return;
    setAvailLoading(true);
    setSlotMap(null);
    try {
      const slots = await getAvailability(resourceId, date);
      // Convert array to a map keyed by HH:MM start time for O(1) lookup
      const map = {};
      if (Array.isArray(slots)) {
        slots.forEach((s) => {
          // backend returns "09:00:00" — normalise to "09:00"
          const key = s.startTime ? s.startTime.substring(0, 5) : null;
          if (key) map[key] = s;
        });
      }
      setSlotMap(map);
    } catch {
      setSlotMap({}); // treat as all-available on error
    } finally {
      setAvailLoading(false);
    }
  }, []);

  useEffect(() => {
    const rid = preSelectedResource ? preSelectedResource.id : formData.resourceId;
    if (rid && formData.date) {
      fetchAvailability(rid, formData.date);
    }
  }, [formData.resourceId, formData.date, preSelectedResource, fetchAvailability]);

  // ── Form field change handler ────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  // ── Range remaining capacity ─────────────────────────────────
  const rangeRemaining = calcRangeRemaining(formData.startTime, formData.endTime, slotMap);

  // ── Validation ───────────────────────────────────────────────
  const validate = () => {
    if (!formData.resourceId && !preSelectedResource) return 'Please select a resource.';
    if (!formData.date) return 'Please select a date.';
    if (!formData.startTime) return 'Please select a start time.';
    if (!formData.endTime) return 'Please select an end time.';
    if (toMinutes(formData.startTime) >= toMinutes(formData.endTime))
      return 'End time must be after start time.';
    if (!formData.attendees || Number(formData.attendees) < 1)
      return 'Attendees must be at least 1.';
    if (activeResource && Number(formData.attendees) > activeResource.capacity)
      return `Attendees (${formData.attendees}) exceeds resource capacity (${activeResource.capacity}).`;
    if (rangeRemaining !== null && Number(formData.attendees) > rangeRemaining)
      return `Only ${rangeRemaining} seat${rangeRemaining !== 1 ? 's' : ''} remaining in this time range.`;
    if (!formData.purpose.trim()) return 'Please provide a purpose for the booking.';
    return '';
  };

  // ── Submit ───────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setLoading(true);
    setError('');
    try {
      const rid = preSelectedResource ? preSelectedResource.id : Number(formData.resourceId);
      const payload = {
        resourceId: rid,
        bookingDate: formData.date,
        startTime: `${formData.startTime}:00`,
        endTime:   `${formData.endTime}:00`,
        expectedAttendees: Number(formData.attendees),
        purpose: formData.purpose.trim(),
      };
      await createBooking(payload);
      onSuccess?.();
      onClose();
    } catch (err) {
      if (err?.response?.status === 409) {
        setError(
          err.response?.data?.message ||
            'This time slot conflicts with an existing booking. Please choose a different time.'
        );
      } else {
        setError(err?.response?.data?.message || err?.message || 'Failed to create booking. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const isFrozen = !!preSelectedResource;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal card */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto flex flex-col">

        {/* ── Header ── */}
        <div className="bg-gradient-to-r from-indigo-600 via-indigo-600 to-blue-600 px-7 py-5 rounded-t-2xl flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">New Booking</h2>
              {isFrozen && (
                <p className="text-indigo-200 text-xs mt-0.5 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Resource pre-selected
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition"
              aria-label="Close modal"
            >
              ✕
            </button>
          </div>
        </div>

        {/* ── Body ── */}
        <form onSubmit={handleSubmit} className="p-7 space-y-5 flex-1">

          {/* Error banner */}
          {error && (
            <div className="flex items-start gap-2 bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm">
              <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* ── Resource field ── */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Resource <span className="text-rose-500">*</span>
            </label>

            {isFrozen ? (
              /* Frozen / read-only display */
              <div className="flex items-center gap-3 px-4 py-3 bg-indigo-50 border border-indigo-200 rounded-xl">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-indigo-900 truncate">{preSelectedResource.name}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-0.5">
                    {preSelectedResource.building && (
                      <span className="flex items-center gap-1 text-xs text-indigo-600">
                        <MapPin className="w-3 h-3" />
                        {preSelectedResource.building}
                        {preSelectedResource.floor ? ` — ${preSelectedResource.floor}` : ''}
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-xs text-indigo-600">
                      <Users className="w-3 h-3" />
                      Capacity: {preSelectedResource.capacity}
                    </span>
                    {preSelectedResource.availabilityWindows && (
                      <span className="flex items-center gap-1 text-xs text-indigo-600">
                        <Clock className="w-3 h-3" />
                        {preSelectedResource.availabilityWindows}
                      </span>
                    )}
                  </div>
                </div>
                <Lock className="w-4 h-4 text-indigo-400 flex-shrink-0" />
              </div>
            ) : resourcesLoading ? (
              <div className="flex items-center gap-2 text-sm text-slate-500 px-4 py-3 border border-slate-200 rounded-xl">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading resources…
              </div>
            ) : (
              <select
                name="resourceId"
                value={formData.resourceId}
                onChange={handleChange}
                id="booking-resource"
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              >
                {resources.length === 0 && <option value="">No resources available</option>}
                {resources.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} {r.building ? `– ${r.building}` : ''} (Cap: {r.capacity})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* ── Date picker ── */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5" htmlFor="booking-date">
              Date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              name="date"
              id="booking-date"
              value={formData.date}
              min={todayString()}
              onChange={handleChange}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            />
          </div>

          {/* ── Time selectors ── */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-semibold text-slate-700">
                Time Range <span className="text-rose-500">*</span>
              </label>
              {availLoading && (
                <span className="flex items-center gap-1 text-xs text-indigo-500">
                  <Loader2 className="w-3 h-3 animate-spin" /> Checking availability…
                </span>
              )}
            </div>


            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1" htmlFor="booking-start-time">
                  Start Time
                </label>
                <SmartTimeSelect
                  id="booking-start-time"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleChange}
                  slotMap={slotMap}
                  disabled={availLoading}
                  // Exclude the last slot (20:00) from start time options
                  filterFn={(t) => t !== '20:00'}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1" htmlFor="booking-end-time">
                  End Time
                </label>
                <SmartTimeSelect
                  id="booking-end-time"
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleChange}
                  slotMap={slotMap}
                  disabled={availLoading}
                  // End time must be after start time
                  filterFn={(t) => t !== '08:00' && toMinutes(t) > toMinutes(formData.startTime)}
                />
              </div>
            </div>

            {/* Booking summary card — replaces old capacity banner */}
            <div className="mt-3">
              <BookingSummaryCard
                slotMap={slotMap}
                startTime={formData.startTime}
                endTime={formData.endTime}
                rangeRemaining={rangeRemaining}
                totalCapacity={totalCapacity}
                availLoading={availLoading}
              />
            </div>
          </div>

          {/* ── Attendees ── */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-semibold text-slate-700" htmlFor="booking-attendees">
                Number of Attendees <span className="text-rose-500">*</span>
              </label>
              {activeResource && (
                <span className="text-xs text-indigo-600 font-medium">
                  Max: {activeResource.capacity}
                  {rangeRemaining !== null && rangeRemaining < activeResource.capacity
                    ? ` · ${rangeRemaining} seats left`
                    : ''}
                </span>
              )}
            </div>
            <input
              type="number"
              name="attendees"
              id="booking-attendees"
              value={formData.attendees}
              onChange={handleChange}
              min="1"
              max={rangeRemaining !== null ? Math.max(rangeRemaining, 0) : (activeResource?.capacity ?? undefined)}
              placeholder="e.g. 10"
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            />
          </div>

          {/* ── Purpose ── */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5" htmlFor="booking-purpose">
              Purpose <span className="text-rose-500">*</span>
            </label>
            <textarea
              name="purpose"
              id="booking-purpose"
              value={formData.purpose}
              onChange={handleChange}
              rows={3}
              placeholder="Briefly describe the purpose of this booking…"
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm resize-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            />
          </div>

          {/* ── Actions ── */}
          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={loading || availLoading}
              id="submit-booking-btn"
              className="flex-1 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700
                         disabled:from-slate-300 disabled:to-slate-400 text-white font-semibold
                         py-3 px-6 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</>
              ) : 'Submit Booking'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 px-6 rounded-xl transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
