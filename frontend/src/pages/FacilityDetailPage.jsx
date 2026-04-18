import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import { getFacilityById, deleteFacility } from '../services/facilityService';
import { useAuth } from '../context/useAuth';
import { useSidebar } from '../context/SidebarContext';
import AddFacilityModal from '../components/AddFacilityModal';
import OccupancyChart from '../components/OccupancyChart';

export default function FacilityDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { isCollapsed } = useSidebar();
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

  // Format date in IST timezone
  const formatDateIST = (dateString) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-IN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: 'Asia/Kolkata'
      }).format(date);
    } catch {
      return dateString;
    }
  };

  // Get booking status from backend field (calculated in real-time with IST timezone)
  const getBookingStatusBadge = () => {
    if (!facility || facility.status === 'OUT_OF_SERVICE') return null;
    const isAvailable = facility.bookingStatus === 'CAN_BOOK_NOW';
    return isAvailable ? '✅ Available for Booking' : '⏰ Not Available for Booking';
  };

  const getBookingStatusColor = () => {
    if (!facility || facility.status === 'OUT_OF_SERVICE') return null;
    const isAvailable = facility.bookingStatus === 'CAN_BOOK_NOW';
    return isAvailable ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-100">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        <div className={`flex-1 overflow-auto transition-all duration-300 ease-in-out ${isCollapsed ? 'lg:ml-24' : 'lg:ml-64'}`}>
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
        <div className={`flex-1 overflow-auto transition-all duration-300 ease-in-out ${isCollapsed ? 'lg:ml-24' : 'lg:ml-64'}`}>
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

      <div className={`flex-1 overflow-auto transition-all duration-300 ease-in-out ${isCollapsed ? 'lg:ml-24' : 'lg:ml-64'}`}>
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
                <OccupancyChart facilityId={facility?.id} facility={facility} />
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
              <p><span className="font-semibold">Resource Added On:</span> {formatDateIST(facility.createdAt)}</p>
              <p><span className="font-semibold">Resource Updated On:</span> {formatDateIST(facility.updatedAt)}</p>
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
