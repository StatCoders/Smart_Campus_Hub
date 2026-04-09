import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import { getFacilityById, deleteFacility } from '../services/facilityService';
import { useAuth } from '../context/useAuth';
import AddFacilityModal from '../components/AddFacilityModal';
import OccupancyChart from '../components/OccupancyChart';

export default function FacilityDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('resources');

  const [facility, setFacility] = useState(location.state?.facility || null);
  const [loading, setLoading] = useState(!facility);
  const [error, setError] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);

  const fetchFacility = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getFacilityById(id);
      setFacility(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch facility');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!facility) {
      fetchFacility();
    }
  }, [id, facility, fetchFacility]);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this facility?')) {
      try {
        await deleteFacility(id);
        navigate('/facilities');
      } catch (err) {
        alert('Failed to delete: ' + err);
      }
    }
  };

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
    if (!facility || facility.status === 'OUT_OF_SERVICE') return null;
    if (!facility.availabilityWindows) return true;

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = currentHour * 60 + currentMinute;
    const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' });
    const dayAbbrev = now.toLocaleDateString('en-US', { weekday: 'short' });

    const windowStr = facility.availabilityWindows.toLowerCase();

    // Check day range if specified
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
        const startIdx = daysOfWeek.findIndex(d => d.substring(0, 3) === startDay);
        const endIdx = daysOfWeek.findIndex(d => d.substring(0, 3) === endDay);
        if (startIdx <= endIdx) {
          dayIsValid = dayIndex >= startIdx && dayIndex <= endIdx;
        } else {
          dayIsValid = dayIndex >= startIdx || dayIndex <= endIdx;
        }
      } else {
        dayIsValid = dayAbbrevLower === startDay;
      }
    }

    // Parse time windows
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

      if (startPeriod === 'pm' && startHour !== 12) startHour += 12;
      if (startPeriod === 'am' && startHour === 12) startHour = 0;
      if (endPeriod === 'pm' && endHour !== 12) endHour += 12;
      if (endPeriod === 'am' && endHour === 12) endHour = 0;

      const startTimeInMinutes = startHour * 60 + startMinute;
      const endTimeInMinutes = endHour * 60 + endMinute;

      timeIsValid = currentTime >= startTimeInMinutes && currentTime <= endTimeInMinutes;
    }

    return dayIsValid && timeIsValid;
  };

  const getBookingStatusBadge = () => {
    const available = isAvailableForBooking();
    if (available === null) return null;
    return available ? '✅ Available for Booking' : '⏰ Not Available for Booking';
  };

  const getBookingStatusColor = () => {
    const available = isAvailableForBooking();
    if (available === null) return null;
    return available ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-100">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        <div className="flex-1 overflow-auto ml-64">
          <TopBar user={user} />
          <div className="p-8 flex justify-center items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !facility) {
    return (
      <div className="flex h-screen bg-gray-100">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        <div className="flex-1 overflow-auto ml-64">
          <TopBar user={user} />
          <div className="p-8">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error || 'Facility not found'}
            </div>
            <button
              onClick={() => navigate('/facilities')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded"
            >
              ← Back to Facilities
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="flex-1 overflow-auto ml-64">
        <TopBar user={user} />

        <div className="p-8">
          {/* Back Button */}
          <button
            onClick={() => navigate('/facilities')}
            className="mb-6 text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-2"
          >
            ← Back to Facilities
          </button>

          {/* Header with Action Icons */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{facility.name}</h1>
              <p className="text-gray-500 mt-1">
                {getTypeIcon(facility.type)} {facility.type.replace('_', ' ')}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {getBookingStatusBadge() && (
                <span className={`${getBookingStatusColor()} px-4 py-2 rounded-full font-semibold`}>
                  {getBookingStatusBadge()}
                </span>
              )}
              <span className={`${getStatusColor(facility.status)} px-4 py-2 rounded-full font-semibold`}>
                {facility.status === 'ACTIVE' ? '🟢 ACTIVE' : '🔴 OUT OF SERVICE'}
              </span>
              {user?.role === 'ADMIN' && (
                <>
                  {/* Edit Icon Button */}
                  <button
                    onClick={() => setShowEditModal(true)}
                    title="Edit Facility"
                    className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-xl font-bold"
                  >
                    ✏️
                  </button>
                  {/* Delete Icon Button */}
                  <button
                    onClick={handleDelete}
                    title="Delete Facility"
                    className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-xl font-bold"
                  >
                    🗑️
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Image */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="h-64 bg-gray-200 rounded-lg overflow-hidden flex items-center justify-center">
                  {facility.imagePath ? (
                    <img src={`/uploads/${facility.imagePath}`} alt={facility.name} className="w-full h-full object-cover" />
                  ) : facility.imageUrl ? (
                    <img src={facility.imageUrl} alt={facility.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-8xl">{getTypeIcon(facility.type)}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Info */}
            <div className="space-y-4">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="font-bold text-lg mb-4">Quick Info</h2>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Capacity</p>
                    <p className="font-semibold text-gray-900">{facility.capacity} people</p>
                  </div>
                  <hr />
                  <div>
                    <p className="text-sm text-gray-600">Building</p>
                    <p className="font-semibold text-gray-900">{facility.building}</p>
                  </div>
                  <hr />
                  <div>
                    <p className="text-sm text-gray-600">Floor</p>
                    <p className="font-semibold text-gray-900">{facility.floor}</p>
                  </div>
                  {facility.availabilityWindows && (
                    <>
                      <hr />
                      <div>
                        <p className="text-sm text-gray-600">Hours</p>
                        <p className="font-semibold text-gray-900">{facility.availabilityWindows}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Occupancy Chart */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <OccupancyChart facility={facility} />
              </div>
            </div>
          </div>


          {/* This resource includes */}
          {facility.features && facility.features.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6 mt-6">
              <h2 className="font-bold text-lg mb-4">This resource includes</h2>
              <div className="flex flex-wrap gap-2">
                {facility.features.map((feature, idx) => (
                  <span key={idx} className="bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full">
                    {feature}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="bg-white rounded-lg shadow-md p-6 mt-6 text-sm text-gray-600">
            <h2 className="font-bold text-lg mb-4 text-gray-900">Resource Information</h2>
            <div className="space-y-2">
              <p><span className="font-semibold">Resource Added On:</span> {new Date(facility.createdAt).toLocaleString()}</p>
              <p><span className="font-semibold">Resource Updated On:</span> {new Date(facility.updatedAt).toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <AddFacilityModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          facilityToEdit={facility}
          onSuccess={() => {
            setShowEditModal(false);
            fetchFacility();
          }}
        />
      )}
    </div>
  );
}
