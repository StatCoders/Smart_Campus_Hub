import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import { getAllFacilities, buildFilterParams } from '../services/facilityService';
import { useAuth } from '../context/useAuth';
import FacilityCard from '../components/FacilityCard';
import FacilityFilters from '../components/FacilityFilters';
import AddFacilityModal from '../components/AddFacilityModal';
import Toast from '../components/Toast';
import { useSidebar } from '../context/useSidebar';
import '../facilities.css';

export default function FacilitiesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isCollapsed } = useSidebar();
  const [activeTab, setActiveTab] = useState('resources');
  
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filteredFacilities, setFilteredFacilities] = useState([]);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [capacityFilter, setCapacityFilter] = useState('All Capacities');
  const [locationFilter, setLocationFilter] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState('All');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(10);
  
  // Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingFacility, setEditingFacility] = useState(null);
  const [toast, setToast] = useState(null);

  // Fetch facilities
  const fetchFacilities = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const filters = {
        type: typeFilter === 'All' ? null : typeFilter,
        status: statusFilter === 'All Statuses' ? null : statusFilter,
        capacity: capacityFilter === 'All Capacities' ? null : capacityFilter,
        location: locationFilter,
        page: currentPage,
        size: pageSize,
      };
      
      const params = buildFilterParams(filters);
      const data = await getAllFacilities(params);
      
      // Handle paginated response
      if (data.content) {
        setFacilities(data.content);
      } else if (Array.isArray(data)) {
        setFacilities(data);
      } else {
        setFacilities([]);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch facilities');
    } finally {
      setLoading(false);
    }
  }, [typeFilter, statusFilter, capacityFilter, locationFilter, currentPage, pageSize]);

  useEffect(() => {
    fetchFacilities();
  }, [fetchFacilities]);

  // Apply search and availability filters
  const applySearchFilter = useCallback(() => {
    let filtered = [...facilities];

    if (searchTerm.trim()) {
      filtered = filtered.filter(f =>
        f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.building.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.floor.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply availability filter using DB booking_status
    if (availabilityFilter !== 'All') {
      filtered = filtered.filter(f => {
        if (availabilityFilter === 'Available for Booking') {
          return f.bookingStatus === 'CAN_BOOK_NOW';
        } else if (availabilityFilter === 'Available for Future Bookings') {
          return f.bookingStatus === 'AVAILABLE_FOR_FUTURE_BOOKINGS';
        } else if (availabilityFilter === 'Not Available for Booking') {
          return f.bookingStatus === 'CANNOT_BOOK_NOW';
        }
        return true;
      });
    }

    setFilteredFacilities(filtered);
  }, [facilities, searchTerm, availabilityFilter]);

  useEffect(() => {
    applySearchFilter();
  }, [applySearchFilter]);

  // Handle facility click
  const handleFacilityClick = (facility) => {
    navigate(`/facilities/${facility.id}`, { state: { facility } });
  };

  // Handle success after add/edit
  const handleAddSuccess = (newFacility) => {
    setEditingFacility(null);
    setShowAddModal(false);
    // Add new facility to the list in real-time
    if (newFacility && !editingFacility) {
      setFacilities([newFacility, ...facilities]);
      // Show success toast
      setToast({ message: 'Facility added successfully!', type: 'success' });
    } else if (editingFacility) {
      fetchFacilities();
      setToast({ message: 'Facility updated successfully!', type: 'success' });
    }
  };

  // Handle refresh after delete
  const handleRefresh = () => {
    setEditingFacility(null);
    fetchFacilities();
  };

  // Handle clear filters
  const handleClearFilters = () => {
    setSearchTerm('');
    setTypeFilter('All');
    setStatusFilter('All Statuses');
    setCapacityFilter('All Capacities');
    setLocationFilter('');
    setAvailabilityFilter('All');
    setCurrentPage(0);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <div className={`flex-1 overflow-auto transition-all duration-300 ease-in-out ${isCollapsed ? 'lg:ml-24' : 'lg:ml-64'}`}>
        <TopBar user={user} />
        
        {/* Toast Notification */}
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
        
        <div className="p-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Facilities Catalogue</h1>
              <p className="text-gray-500 mt-1">Browse and manage campus facilities</p>
            </div>
            
            {user?.role === 'ADMIN' && (
              <button
                onClick={() => {
                  setEditingFacility(null);
                  setShowAddModal(true);
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-lg transition-colors"
              >
                + Add Facility
              </button>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {/* Filters */}
          <FacilityFilters
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            typeFilter={typeFilter}
            setTypeFilter={setTypeFilter}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            capacityFilter={capacityFilter}
            setCapacityFilter={setCapacityFilter}
            locationFilter={locationFilter}
            setLocationFilter={setLocationFilter}
            availabilityFilter={availabilityFilter}
            setAvailabilityFilter={setAvailabilityFilter}
            onClearFilters={handleClearFilters}
          />

          {/* Loading State */}
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          ) : filteredFacilities.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No facilities found</p>
              <p className="text-gray-400">Try adjusting your filters</p>
            </div>
          ) : (
            <>
              {/* Results Count */}
              <p className="text-sm text-gray-600 mb-4">
                Showing {filteredFacilities.length} facility(ies)
              </p>

              {/* Facilities Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredFacilities.map(facility => (
                  <FacilityCard
                    key={facility.id}
                    facility={facility}
                    onClick={() => handleFacilityClick(facility)}
                    onEdit={(facility) => {
                      setEditingFacility(facility);
                      setShowAddModal(true);
                    }}
                    onRefresh={handleRefresh}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <AddFacilityModal
          isOpen={showAddModal}
          onClose={() => {
            setShowAddModal(false);
            setEditingFacility(null);
          }}
          facilityToEdit={editingFacility}
          onSuccess={handleAddSuccess}
        />
      )}
    </div>
  );
}
