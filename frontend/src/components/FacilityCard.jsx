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

  // Check booking status from DB
  const isAvailableForBooking = () => {
    if (!facility.bookingStatus) return null;
    return facility.bookingStatus === 'CAN_BOOK_NOW';
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
