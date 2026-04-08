import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import { getFacilityById, deleteFacility } from '../services/facilityService';
import { useAuth } from '../context/useAuth';
import AddFacilityModal from '../components/AddFacilityModal';

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

  useEffect(() => {
    if (!facility) {
      fetchFacility();
    }
  }, [id, facility]);

  const fetchFacility = async () => {
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
  };

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

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-100">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        <div className="flex-1 overflow-auto ml-64">
          <TopBar />
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
          <TopBar />
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
        <TopBar />

        <div className="p-8">
          {/* Back Button */}
          <button
            onClick={() => navigate('/facilities')}
            className="mb-6 text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-2"
          >
            ← Back to Facilities
          </button>

          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{facility.name}</h1>
              <p className="text-gray-500 mt-1">
                {getTypeIcon(facility.type)} {facility.type.replace('_', ' ')}
              </p>
            </div>

            <span className={`${getStatusColor(facility.status)} px-4 py-2 rounded-full font-semibold`}>
              {facility.status === 'ACTIVE' ? '🟢 ACTIVE' : '🔴 OUT OF SERVICE'}
            </span>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Image */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="h-96 bg-gray-200 rounded-lg overflow-hidden flex items-center justify-center">
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
                </div>
              </div>

              {/* Admin Actions */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="font-bold text-lg mb-4">Actions</h2>
                <div className="space-y-2">
                  <button
                    onClick={() => setShowEditModal(true)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded"
                  >
                    ✏️ Edit Facility
                  </button>
                  <button
                    onClick={handleDelete}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded"
                  >
                    🗑️ Delete Facility
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Availability */}
          {facility.availabilityWindows && (
            <div className="bg-white rounded-lg shadow-md p-6 mt-6">
              <h2 className="font-bold text-lg mb-3">Availability</h2>
              <p className="text-gray-700">{facility.availabilityWindows}</p>
            </div>
          )}

          {/* Features */}
          {facility.features && facility.features.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6 mt-6">
              <h2 className="font-bold text-lg mb-4">Features & Equipment</h2>
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
          <div className="bg-white rounded-lg shadow-md p-6 mt-6 text-sm text-gray-500">
            <p>Created: {new Date(facility.createdAt).toLocaleDateString()}</p>
            <p>Updated: {new Date(facility.updatedAt).toLocaleDateString()}</p>
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
