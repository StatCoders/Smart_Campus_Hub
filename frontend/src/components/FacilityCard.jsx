import React from 'react';
import { formatRelativeTime } from '../utils/dateFormatter';

export default function FacilityCard({ facility, onClick }) {

  const getTypeIcon = (type) => {
    const icons = {
      LECTURE_HALL: '🏛️',
      LAB: '🧪',
      MEETING_ROOM: '💼',
      EQUIPMENT: '🎥'
    };
    return icons[type] || '📦';
  };

  const getStatusColor = (status) => {
    return status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  // Check if current time and day are within availability windows
  const isAvailableForBooking = () => {
    if (facility.status === 'OUT_OF_SERVICE') return null; // null means hidden
    if (!facility.availabilityWindows) return true; // No windows means always available

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = currentHour * 60 + currentMinute; // Convert to minutes
    const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' });
    const dayAbbrev = now.toLocaleDateString('en-US', { weekday: 'short' });

    const windowStr = facility.availabilityWindows.toLowerCase();

    // Check day range if specified (e.g., "Mon-Sun", "Monday-Friday", "mon-fri")
    const dayRegex = /(mon|tue|wed|thu|fri|sat|sun|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\s*-?\s*(mon|tue|wed|thu|fri|sat|sun|monday|tuesday|wednesday|thursday|friday|saturday|sunday)?/i;
    const dayMatch = windowStr.match(dayRegex);
    const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayIndex = daysOfWeek.indexOf(dayOfWeek.toLowerCase());

    let dayIsValid = true;
    if (dayMatch) {
      const startDay = dayMatch[1].substring(0, 3).toLowerCase();
      const endDay = dayMatch[2]?.substring(0, 3).toLowerCase();
      const dayAbbrevLower = dayAbbrev.toLowerCase();

      if (endDay) {
        // Range like "Mon-Fri"
        const startIdx = daysOfWeek.findIndex(d => d.substring(0, 3) === startDay);
        const endIdx = daysOfWeek.findIndex(d => d.substring(0, 3) === endDay);
        if (startIdx <= endIdx) {
          dayIsValid = dayIndex >= startIdx && dayIndex <= endIdx;
        } else {
          // Wrap around (e.g., "Fri-Mon")
          dayIsValid = dayIndex >= startIdx || dayIndex <= endIdx;
        }
      } else {
        // Single day
        dayIsValid = dayAbbrevLower === startDay;
      }
    }

    // Parse time windows (e.g., "8am-4pm" or "8:00am-4:00pm")
    const timeRegex = /(\d{1,2}):?(\d{2})?(am|pm)?\s*-\s*(\d{1,2}):?(\d{2})?(am|pm)?/i;
    const timeMatch = windowStr.match(timeRegex);

    let timeIsValid = true;
    if (timeMatch) {
      let startHour = parseInt(timeMatch[1]);
      const startMinute = parseInt(timeMatch[2]) || 0;
      let endHour = parseInt(timeMatch[4]);
      const endMinute = parseInt(timeMatch[5]) || 0;
      const startPeriod = timeMatch[3]?.toLowerCase() || 'am';
      const endPeriod = timeMatch[6]?.toLowerCase() || 'pm';

      // Convert to 24-hour format
      if (startPeriod === 'pm' && startHour !== 12) startHour += 12;
      if (startPeriod === 'am' && startHour === 12) startHour = 0;
      if (endPeriod === 'pm' && endHour !== 12) endHour += 12;
      if (endPeriod === 'am' && endHour === 12) endHour = 0;

      const startTimeInMinutes = startHour * 60 + startMinute;
      const endTimeInMinutes = endHour * 60 + endMinute;

      timeIsValid = currentTime >= startTimeInMinutes && currentTime <= endTimeInMinutes;
    }

    // Available only if both day and time conditions are met
    return dayIsValid && timeIsValid;
  };

  const getBookingStatusBadge = () => {
    const available = isAvailableForBooking();
    if (available === null) return null; // OUT_OF_SERVICE, hide booking badge
    return available ? '✅ Available for Booking' : '⏰ Not Available for Booking';
  };

  const getBookingStatusColor = () => {
    const available = isAvailableForBooking();
    if (available === null) return null;
    return available ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';
  };

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-4 cursor-pointer relative"
    >
      {/* Status Badge - Top Left */}
      <div className="absolute top-2 left-2 z-10">
        <span className={`${getStatusColor(facility.status)} px-3 py-1 rounded-full text-xs font-semibold`}>
          {facility.status === 'ACTIVE' ? '🟢 ACTIVE' : '🔴 OUT OF SERVICE'}
        </span>
      </div>

      {/* Date Info - Top Right - Relative Time */}
      <div className="absolute top-2 right-2 z-10 text-right text-xs text-gray-500 bg-white bg-opacity-90 px-2 py-1 rounded">
        <p>{formatRelativeTime(facility.createdAt)}</p>
      </div>

      {/* Image - Reduced Size */}
      <div className="mb-4 mt-6 h-32 bg-gray-200 rounded-lg overflow-hidden flex items-center justify-center">
        {facility.imagePath ? (
          <img src={`/uploads/${facility.imagePath}`} alt={facility.name} className="w-full h-full object-cover" />
        ) : facility.imageUrl ? (
          <img src={facility.imageUrl} alt={facility.name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-4xl">{getTypeIcon(facility.type)}</span>
        )}
      </div>

      {/* Content */}
      <div className="space-y-3">
        {/* Name & Type with Booking Availability Badge */}
        <div>
          <h3 className="font-bold text-lg text-gray-900">{facility.name}</h3>
          <p className="text-sm text-gray-500">{getTypeIcon(facility.type)} {facility.type.replace('_', ' ')}</p>
          {getBookingStatusBadge() && (
            <div className="mt-2">
              <span className={`${getBookingStatusColor()} px-2 py-1 rounded-full text-xs font-semibold`}>
                {getBookingStatusBadge()}
              </span>
            </div>
          )}
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="bg-gray-50 p-2 rounded">
            <p className="text-gray-600">Capacity</p>
            <p className="font-semibold text-gray-900">
              {facility.capacity}
              {facility.type !== 'EQUIPMENT' && ' people'}
            </p>
          </div>
          <div className="bg-gray-50 p-2 rounded">
            <p className="text-gray-600">Location</p>
            <p className="font-semibold text-gray-900">{facility.building}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="bg-gray-50 p-2 rounded">
            <p className="text-gray-600">Floor</p>
            <p className="font-semibold text-gray-900">{facility.floor}</p>
          </div>
          {facility.availabilityWindows && (
            <div className="bg-gray-50 p-2 rounded">
              <p className="text-gray-600">Hours</p>
              <p className="font-semibold text-gray-900 text-xs">{facility.availabilityWindows}</p>
            </div>
          )}
        </div>

        {/* This facility includes */}
        {facility.features && facility.features.length > 0 && (
          <div>
            <p className="text-xs text-gray-600 mb-1">This Facility Includes</p>
            <div className="flex flex-wrap gap-1">
              {facility.features.slice(0, 3).map((feature, idx) => (
                <span key={idx} className="bg-indigo-100 text-indigo-700 text-xs px-2 py-1 rounded">
                  {feature}
                </span>
              ))}
              {facility.features.length > 3 && (
                <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">
                  +{facility.features.length - 3}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
