import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import { getFacilityById, deleteFacility, getWeeklyOccupancy } from '../services/facilityService';
import { useAuth } from '../context/useAuth';
import { useSidebar } from '../context/useSidebar';
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
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [hasActiveBookings, setHasActiveBookings] = useState(false);
  const [checkingBookings, setCheckingBookings] = useState(false);

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

  const handleDelete = () => {
    setDeleteConfirmOpen(true);
    checkForActiveBookings(id);
  };

  const checkForActiveBookings = async (facilityId) => {
    setCheckingBookings(true);
    try {
      const occupancyData = await getWeeklyOccupancy(facilityId);
      // Check if there are any bookings on today or future days
      const today = new Date();
      const todayStr = today.getFullYear() + '-' + 
                       String(today.getMonth() + 1).padStart(2, '0') + '-' + 
                       String(today.getDate()).padStart(2, '0');
      
      let hasBookings = false;
      let dataToCheck = [];
      
      if (occupancyData && Array.isArray(occupancyData)) {
        dataToCheck = occupancyData;
      } else if (occupancyData?.dailyOccupancy && Array.isArray(occupancyData.dailyOccupancy)) {
        dataToCheck = occupancyData.dailyOccupancy;
      }
      
      // Filter to only today and future days
      hasBookings = dataToCheck.some(day => {
        // Check if day date is today or in the future
        if (day.date && day.date >= todayStr) {
          return day.bookings && day.bookings.length > 0;
        }
        return false;
      });
      
      setHasActiveBookings(hasBookings);
    } catch (err) {
      console.error('Error checking bookings:', err);
      setHasActiveBookings(false);
    } finally {
      setCheckingBookings(false);
    }
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteFacility(id);
      navigate('/facilities');
    } catch (err) {
      setError('Failed to delete: ' + err.message);
      setIsDeleting(false);
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

      {/* Delete Confirmation Modal */}
      {deleteConfirmOpen && facility && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-red-200 animate-in fade-in duration-300">
            <div className="bg-gradient-to-r from-red-600 to-red-700 px-8 py-6 rounded-t-2xl">
              <h3 className="text-xl font-bold text-white">Delete Facility?</h3>
            </div>
            <div className="p-8">
              <p className="text-gray-700 mb-2 font-medium">
                Are you sure you want to delete <span className="font-bold text-red-700">"{facility.name}"</span>?
              </p>
              {checkingBookings ? (
                <p className="text-gray-600 text-sm mb-6 flex items-center gap-2">
                  <span className="animate-spin">⏳</span> Checking for active bookings...
                </p>
              ) : hasActiveBookings ? (
                <p className="text-orange-700 text-sm mb-6 bg-orange-50 p-3 rounded border border-orange-200">
                  <span className="font-semibold">⚠️ This facility has active bookings.</span> You must cancel or modify all bookings before you can delete this facility.
                </p>
              ) : (
                <p className="text-gray-600 text-sm mb-6">
                  This action is permanent and cannot be undone. Bookings associated with this facility can face issues. Recheck bookings and perform necessary actions before confirming deletion.
                </p>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setDeleteConfirmOpen(false);
                  }}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold py-3 px-6 rounded-lg transition"
                  disabled={isDeleting || checkingBookings}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={isDeleting || hasActiveBookings || checkingBookings}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-semibold py-3 px-6 rounded-lg transition"
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
