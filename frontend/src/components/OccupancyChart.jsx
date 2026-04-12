import React from 'react';

export default function OccupancyChart({ facility }) {
  // Mock data for now - will be replaced with actual booking data
  const mockBookings = 3; // Static mock value
  const capacity = facility.capacity || 0;
  const isEquipment = facility.type === 'EQUIPMENT';
  
  // For equipment, just show number of bookings today
  if (isEquipment) {
    return (
      <div className="bg-blue-50 p-3 rounded border border-blue-200">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-blue-900">Today's Occupancy</p>
          <span className="text-xs bg-blue-200 text-blue-900 px-2 py-1 rounded">
            {mockBookings} booking{mockBookings !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="w-full bg-blue-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${Math.min((mockBookings / (capacity || 5)) * 100, 100)}%` }}
          ></div>
        </div>
      </div>
    );
  }

  // For rooms/labs/meeting rooms with capacity
  if (capacity > 0) {
    const occupancyPercentage = Math.round((mockBookings / capacity) * 100);
    const occupancyColor = 
      occupancyPercentage > 80 ? 'bg-red-600' :
      occupancyPercentage > 50 ? 'bg-yellow-600' :
      'bg-green-600';
    
    const statusText = 
      occupancyPercentage > 80 ? 'Almost Full' :
      occupancyPercentage > 50 ? 'Moderate' :
      'Available';
    
    const statusColor = 
      occupancyPercentage > 80 ? 'bg-red-50 border-red-200 text-red-900' :
      occupancyPercentage > 50 ? 'bg-yellow-50 border-yellow-200 text-yellow-900' :
      'bg-green-50 border-green-200 text-green-900';

    return (
      <div className={`${statusColor} p-3 rounded border`}>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold">Today's Occupancy</p>
          <span className="text-xs font-bold">
            {mockBookings}/{capacity} ({occupancyPercentage}%)
          </span>
        </div>
        <div className="w-full bg-gray-300 rounded-full h-2.5 mb-1">
          <div 
            className={`${occupancyColor} h-2.5 rounded-full transition-all duration-300`}
            style={{ width: `${occupancyPercentage}%` }}
          ></div>
        </div>
        <p className="text-xs font-semibold mt-1">{statusText}</p>
      </div>
    );
  }

  // Fallback for resources without capacity info
  return null;
}
