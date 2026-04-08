import React, { useState } from 'react';
import { useAuth } from '../context/useAuth';
import { deleteFacility } from '../services/facilityService';
import OccupancyChart from './OccupancyChart';

export default function FacilityCard({ facility, onClick, onEdit, onRefresh }) {
  const { user } = useAuth();
  const [deleting, setDeleting] = useState(false);

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

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this facility?')) {
      setDeleting(true);
      try {
        await deleteFacility(facility.id);
        onRefresh();
      } catch (err) {
        alert('Failed to delete: ' + err);
      } finally {
        setDeleting(false);
      }
    }
  };

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-4 cursor-pointer"
    >
      {/* Image */}
      <div className="mb-4 h-40 bg-gray-200 rounded-lg overflow-hidden flex items-center justify-center">
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
        {/* Name & Type */}
        <div>
          <h3 className="font-bold text-lg text-gray-900">{facility.name}</h3>
          <p className="text-sm text-gray-500">{getTypeIcon(facility.type)} {facility.type.replace('_', ' ')}</p>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          {facility.type !== 'EQUIPMENT' && (
            <div className="bg-gray-50 p-2 rounded">
              <p className="text-gray-600">Capacity</p>
              <p className="font-semibold text-gray-900">{facility.capacity} people</p>
            </div>
          )}
          <div className={`${facility.type !== 'EQUIPMENT' ? '' : 'col-span-2'} bg-gray-50 p-2 rounded`}>
            <p className="text-gray-600">Location</p>
            <p className="font-semibold text-gray-900">{facility.building}</p>
          </div>
        </div>

        <div className="bg-gray-50 p-2 rounded text-sm">
          <p className="text-gray-600">Floor</p>
          <p className="font-semibold text-gray-900">{facility.floor}</p>
        </div>

        {/* Features */}
        {facility.features && facility.features.length > 0 && (
          <div>
            <p className="text-xs text-gray-600 mb-1">Features:</p>
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

        {/* Occupancy Chart */}
        <OccupancyChart facility={facility} />

        {/* Status Badge */}
        <div className="flex items-center justify-between pt-2">
          <span className={`${getStatusColor(facility.status)} px-3 py-1 rounded-full text-xs font-semibold`}>
            {facility.status === 'ACTIVE' ? '🟢 ACTIVE' : '🔴 OUT OF SERVICE'}
          </span>
        </div>

        {/* View Details Button */}
        <button
          onClick={onClick}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 rounded transition-colors text-sm mt-3"
        >
          View Details →
        </button>
      </div>
    </div>
  );
}
