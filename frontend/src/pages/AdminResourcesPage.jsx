import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Edit, Trash2, X, Check } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import { useAuth } from '../context/useAuth';
import { useSidebar } from '../context/useSidebar';
import { getAllFacilities, deleteFacility } from '../services/facilityService';
import OccupancyChart from '../components/OccupancyChart';
import AddFacilityModal from '../components/AddFacilityModal';
import Toast from '../components/Toast';

export default function AdminResourcesPage() {
  const { user } = useAuth();
  const { isCollapsed } = useSidebar();
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [availabilityFilter, setAvailabilityFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingFacility, setEditingFacility] = useState(null);
  const [toast, setToast] = useState(null);
  const [activeTab, setActiveTab] = useState('resources');
  const [statusFilter, setStatusFilter] = useState('All');

  const fetchFacilities = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAllFacilities();
      let facilitiesData = [];
      if (Array.isArray(data)) {
        facilitiesData = data;
      } else if (data?.content && Array.isArray(data.content)) {
        facilitiesData = data.content;
      } else if (data?.data && Array.isArray(data.data)) {
        facilitiesData = data.data;
      }
      setFacilities(facilitiesData);
    } catch (err) {
      setError(err.message || 'Failed to fetch facilities');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFacilities();
  }, [fetchFacilities]);

  const handleEdit = (facility) => {
    setEditingFacility(facility);
    setShowAddModal(true);
    setIsModalOpen(false);
  };

  const handleDelete = async (facilityId, facilityName) => {
    const confirmMessage = `Are you sure you want to delete "${facilityName}"?\n\nThis action is permanent. If this facility has active bookings, you must cancel them first before deletion.`;
    
    if (window.confirm(confirmMessage)) {
      try {
        await deleteFacility(facilityId);
        setToast({ type: 'success', message: `${facilityName} deleted successfully` });
        setFacilities(facilities.filter(f => f.id !== facilityId));
        setIsModalOpen(false);
        setTimeout(() => setToast(null), 3000);
      } catch (err) {
        let errorMessage = 'Failed to delete facility';
        
        // Check if error is due to foreign key constraint (active bookings)
        if (err?.includes?.('foreign key') || err?.includes?.('bookings')) {
          errorMessage = `Cannot delete "${facilityName}" - This facility has active bookings. Please cancel or modify all bookings before deletion.`;
        } else if (err?.includes?.('constraint')) {
          errorMessage = `Cannot delete "${facilityName}" - This facility is still in use. Please ensure all related bookings are removed first.`;
        }
        
        setToast({ type: 'error', message: errorMessage });
        setTimeout(() => setToast(null), 4000);
      }
    }
  };

  const handleAddModalClose = () => {
    setShowAddModal(false);
    setEditingFacility(null);
    fetchFacilities();
  };

  const facilityTypes = ['All', ...new Set(facilities.map(f => f.type))];

  const filteredFacilities = facilities.filter(facility => {
    if (typeFilter !== 'All' && facility.type !== typeFilter) return false;
    if (statusFilter !== 'All' && facility.status !== statusFilter) return false;
    if (availabilityFilter !== 'All') {
      if (availabilityFilter === 'Available' && facility.bookingStatus !== 'CAN_BOOK_NOW') return false;
      if (availabilityFilter === 'Not Available' && facility.bookingStatus === 'CAN_BOOK_NOW') return false;
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      return (
        (facility.name && facility.name.toLowerCase().includes(term)) ||
        (facility.building && facility.building.toLowerCase().includes(term)) ||
        (facility.floor && facility.floor.toLowerCase().includes(term))
      );
    }
    return true;
  }).sort((a, b) => a.name.localeCompare(b.name));

  const getAvailabilityBadge = (status) => {
    const baseStyles = 'px-3 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1';
    if (status === 'CAN_BOOK_NOW') {
      return <span className={`${baseStyles} bg-green-100 text-green-800`}><Check className="w-3 h-3" /> Available</span>;
    }
    return <span className={`${baseStyles} bg-red-100 text-red-800`}><X className="w-3 h-3" /> Not Available</span>;
  };

  return (
    <div className="flex bg-gray-50 min-h-screen">
      {/* Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ease-in-out ${isCollapsed ? 'lg:ml-24' : 'lg:ml-64'}`}>
        {/* Top Bar */}
        <TopBar user={user} />

        {/* Content Area - Scrollable */}
        <main className="overflow-auto p-8">
          {/* Header Section */}
          <div className="mb-8">
            <div className="mb-4">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Facilities Catalogue</h1>
              <p className="text-gray-600">Manage campus facilities and resources</p>
            </div>
            <button
              onClick={() => {
                setEditingFacility(null);
                setShowAddModal(true);
              }}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition"
            >
              <Plus className="w-5 h-5" />
              Add Facility
            </button>
          </div>

          {toast && (
            <Toast
              type={toast.type}
              message={toast.message}
              onClose={() => setToast(null)}
            />
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Filters Section */}
          <div className="flex gap-4 mb-8">
            {/* Search Bar */}
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by name or building..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Facility Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="All">Filter by Facility Type</option>
              {facilityTypes.map(type => (
                type !== 'All' && <option key={type} value={type}>{type}</option>
              ))}
            </select>

            {/* Facility Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="All">Facility Status</option>
              <option value="ACTIVE">Active</option>
              <option value="OUT_OF_SERVICE">Out of Service</option>
            </select>

            {/* Booking Status Filter */}
            <select
              value={availabilityFilter}
              onChange={(e) => setAvailabilityFilter(e.target.value)}
              className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="All">Booking Status</option>
              <option value="Available">Available</option>
              <option value="Not Available">Not Available</option>
            </select>
          </div>

          {(searchTerm || typeFilter !== 'All' || statusFilter !== 'All' || availabilityFilter !== 'All') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setTypeFilter('All');
                setStatusFilter('All');
                setAvailabilityFilter('All');
              }}
              className="mb-4 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Clear filters
            </button>
          )}

            {/* Facilities Count */}
            <p className="text-gray-600 mb-6">
              Showing {filteredFacilities.length} {filteredFacilities.length === 1 ? 'facility' : 'facilities'}
            </p>

            {/* Facilities Grid */}
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <p className="text-xl text-gray-600">Loading facilities...</p>
              </div>
            ) : filteredFacilities.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <p className="text-gray-600 text-lg mb-4">No facilities found</p>
                <p className="text-gray-500 text-sm">Campus facilities will appear here</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredFacilities.map((facility) => (
                  <div
                    key={facility.id}
                    className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden"
                  >
                    {/* Image Section */}
                    <div className="relative h-48 bg-gray-200 overflow-hidden">
                      {facility.imageUrl ? (
                        <img src={facility.imageUrl} alt={facility.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-100">
                          <span className="text-5xl">📦</span>
                        </div>
                      )}
                    </div>

                    {/* Card Header with Status and Time */}
                    <div className="flex justify-between items-start p-5 border-b border-gray-200">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${facility.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                        {facility.status === 'ACTIVE' ? 'ACTIVE' : 'OUT OF SERVICE'}
                      </span>
                      <span className="text-xs text-gray-500">1 week ago</span>
                    </div>

                    {/* Card Body */}
                    <div className="p-5">
                      {/* Title */}
                      <h3 className="text-lg font-bold text-gray-900 mb-2">
                        {facility.name}
                      </h3>

                      {/* Type */}
                      <p className="text-gray-600 text-sm mb-3 uppercase">
                        {facility.type?.toLowerCase().replace(/_/g, ' ')}
                      </p>

                      {/* Info Grid */}
                      <div className="space-y-2 mb-4 text-sm">
                        <div>
                          <p className="text-xs text-gray-500 font-semibold">Capacity</p>
                          <p className="font-medium text-gray-900">{facility.capacity} people</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 font-semibold">Location</p>
                          <p className="font-medium text-gray-900">{facility.building} - {facility.floor?.includes('Floor') ? facility.floor : `Floor ${facility.floor}`}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 font-semibold">Booking Status</p>
                          <div className="mt-1">
                            {getAvailabilityBadge(facility.bookingStatus)}
                          </div>
                        </div>
                      </div>

                      {/* Footer with Actions */}
                      <div className="flex justify-between items-center pt-4 border-t border-gray-200 gap-2">
                        <button
                          onClick={() => { setSelectedFacility(facility); setIsModalOpen(true); }}
                          className="flex-1 text-center text-blue-600 hover:text-blue-700 font-medium text-sm py-2 hover:bg-blue-50 rounded transition"
                        >
                          View Details
                        </button>
                        <button 
                          onClick={() => handleEdit(facility)} 
                          className="px-3 py-2 text-blue-600 hover:bg-blue-50 rounded transition"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(facility.id, facility.name)} 
                          className="px-3 py-2 text-red-600 hover:bg-red-50 rounded transition"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
        </main>

        {/* Detail Modal */}
        {isModalOpen && selectedFacility && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Glass Effect Backdrop */}
          <div 
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          ></div>
          
          {/* Modal */}
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            {/* Close Button */}
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 z-10 p-2 hover:bg-gray-100 rounded-full transition"
            >
              <X className="w-6 h-6 text-gray-600" />
            </button>

            {/* Image Section */}
            <div className="relative h-64 bg-gray-200 overflow-hidden">
              {selectedFacility.imageUrl ? (
                <img 
                  src={selectedFacility.imageUrl}
                  alt={selectedFacility.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <span className="text-6xl">📦</span>
                </div>
              )}
            </div>

            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6 pr-12">
              <h2 className="text-2xl font-bold text-white">{selectedFacility.name}</h2>
              <p className="text-blue-100 text-sm mt-2">{selectedFacility.type}</p>
            </div>

            {/* Content */}
            <div className="p-8 space-y-6">
              {/* Status Badge */}
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600 font-medium">Booking Status:</span>
                {getAvailabilityBadge(selectedFacility.bookingStatus)}
              </div>

              {/* Location */}
              <div className="border-l-4 border-blue-600 pl-4">
                <p className="text-sm text-gray-600 font-medium">Location</p>
                <p className="text-gray-900 font-semibold mt-1">
                  {selectedFacility.building} - {selectedFacility.floor?.includes('Floor') ? selectedFacility.floor : `Floor ${selectedFacility.floor}`}
                </p>
              </div>

              {/* Capacity */}
              <div className="border-l-4 border-blue-600 pl-4">
                <p className="text-sm text-gray-600 font-medium">Capacity</p>
                <p className="text-gray-900 font-semibold mt-1">
                  {selectedFacility.capacity ? `${selectedFacility.capacity} people` : 'N/A'}
                </p>
              </div>

              {/* Availability Windows */}
              {selectedFacility.availabilityWindows && (
                <div className="border-l-4 border-blue-600 pl-4">
                  <p className="text-sm text-gray-600 font-medium">Hours</p>
                  <p className="text-gray-900 font-semibold mt-1">
                    {selectedFacility.availabilityWindows}
                  </p>
                </div>
              )}

              {/* Features */}
              {selectedFacility.features && selectedFacility.features.length > 0 && (
                <div className="border-l-4 border-blue-600 pl-4">
                  <p className="text-sm text-gray-600 font-medium mb-3">This Facility Includes</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedFacility.features.map((feature, idx) => (
                      <span key={idx} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Occupancy Chart */}
              <div className="border-l-4 border-blue-600 pl-4 bg-blue-50 p-4 rounded">
                <OccupancyChart facilityId={selectedFacility.id} />
              </div>

              {/* Timestamps */}
              <div className="pt-6 border-t border-gray-200 space-y-2 text-xs text-gray-500">
                <p>Added: {new Date(selectedFacility.createdAt).toLocaleString()}</p>
                <p>Updated: {new Date(selectedFacility.updatedAt).toLocaleString()}</p>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="bg-gray-50 px-8 py-4 border-t border-gray-200 rounded-b-2xl flex gap-3">
              <button
                onClick={() => handleEdit(selectedFacility)}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition"
              >
                <Edit className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={() => handleDelete(selectedFacility.id, selectedFacility.name)}
                className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-medium py-2 rounded-lg transition"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-900 font-medium py-2 rounded-lg transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <AddFacilityModal
          isOpen={showAddModal}
          onClose={handleAddModalClose}
          facilityToEdit={editingFacility}
        />
      )}
      </div>
    </div>
  );
}
