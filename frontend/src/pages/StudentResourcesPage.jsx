import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LogOut, MapPin, Users, Clock, Check, X } from 'lucide-react';
import { useAuth } from '../context/useAuth';
import campusLogo from '../assets/campus-logo.png';
import { getAllFacilities } from '../services/facilityService';
import OccupancyChart from '../components/OccupancyChart';
import NotificationDropdown from '../components/NotificationDropdown';

export default function StudentResourcesPage() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [availabilityFilter, setAvailabilityFilter] = useState('All');
  const [capacityFilter, setCapacityFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleNavigate = (path) => {
    navigate(path);
    setIsMenuOpen(false);
  };

  // Fetch facilities
  useEffect(() => {
    const fetchFacilities = async () => {
      try {
        setLoading(true);
        const data = await getAllFacilities();
        // Handle Spring Data Page response - extract content array
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
        setError(err.message || 'Failed to fetch resources');
      } finally {
        setLoading(false);
      }
    };

    fetchFacilities();
  }, []);

  // Get unique types for filter
  const facilityTypes = ['All', ...new Set(facilities.map(f => f.type))];
  const capacityRanges = ['All', '5+', '10+', '30+', '50+', '100+'];

  // Filter facilities
  const filteredFacilities = facilities.filter(facility => {
    if (typeFilter !== 'All' && facility.type !== typeFilter) return false;
    if (capacityFilter !== 'All') {
      const minCapacity = parseInt(capacityFilter);
      if (facility.capacity < minCapacity) return false;
    }
    if (availabilityFilter !== 'All') {
      if (availabilityFilter === 'Available' && facility.bookingStatus !== 'CAN_BOOK_NOW') return false;
      if (availabilityFilter === 'Available for Future Bookings' && facility.bookingStatus !== 'AVAILABLE_FOR_FUTURE_BOOKINGS') return false;
      if (availabilityFilter === 'Not Available' && facility.bookingStatus !== 'CANNOT_BOOK_NOW') return false;
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
    if (status === 'AVAILABLE_FOR_FUTURE_BOOKINGS') {
      return <span className={`${baseStyles} bg-blue-100 text-blue-800`}><Clock className="w-3 h-3" /> Available for Future Bookings</span>;
    }
    return <span className={`${baseStyles} bg-red-100 text-red-800`}><X className="w-3 h-3" /> Not Available</span>;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navigation Header */}
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/98 backdrop-blur-lg shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Logo and Title */}
            <div className="flex items-center gap-3">
              <img src={campusLogo} alt="Winterfall Northern University" className="h-12 w-12" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Winterfall Northern University</h1>
                <p className="text-xs text-blue-600 font-medium">Campus Resources</p>
              </div>
            </div>

            {/* Navigation Menu */}
            <nav className="hidden md:flex items-center gap-8">
              <button
                onClick={() => handleNavigate('/home')}
                className="text-gray-700 hover:text-blue-600 transition font-medium"
              >
                Home
              </button>
              <button
                onClick={() => handleNavigate('/student-bookings')}
                className="text-gray-700 hover:text-blue-600 transition font-medium"
              >
                Bookings
              </button>
              <button
                onClick={() => handleNavigate('/student-tickets')}
                className="text-gray-700 hover:text-blue-600 transition font-medium"
              >
                Tickets
              </button>
            </nav>

            {/* User Menu */}
            <div className="flex items-center gap-3 relative">
              <NotificationDropdown
                userId={user?.id}
                isOpen={showNotifications}
                onClose={() => setShowNotifications(false)}
                onToggle={() => {
                  setShowNotifications((c) => !c);
                  setIsMenuOpen(false);
                }}
              />

              {/* Profile Button */}
              <button
                onClick={() => {
                  setIsMenuOpen(!isMenuOpen);
                  setShowNotifications(false);
                }}
                className="flex items-center gap-2 px-3 py-2 hover:bg-blue-50 rounded-lg transition"
              >
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                  {user?.firstName?.charAt(0) || 'U'}
                </div>
              </button>

              {/* Dropdown Menu */}
              {isMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-lg z-50">
                  <div className="p-4 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-900">{user?.firstName} {user?.lastName || ''}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                    <div className="mt-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {user?.role || 'USER'}
                      </span>
                    </div>
                  </div>

                  <div className="p-2">
                    <button
                      onClick={() => {
                        navigate('/profile');
                        setIsMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 rounded-lg transition"
                    >
                      <User className="w-4 h-4" />
                      Your Profile
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Campus Resources</h2>
          <p className="text-gray-600 mt-1">Browse available facilities and resources</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Filters */}
        <div className="mb-8 bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex gap-3 items-center flex-wrap">
            {/* Search */}
            <div className="flex-1 min-w-[150px]">
              <label className="text-xs text-gray-500 font-medium mb-1 block">Search by location</label>
              <input
                type="text"
                placeholder="Building, floor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Type Filter */}
            <div className="flex-1 min-w-[150px]">
              <label className="text-xs text-gray-500 font-medium mb-1 block">Filter by facility</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {facilityTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* Capacity Filter */}
            <div className="flex-1 min-w-[150px]">
              <label className="text-xs text-gray-500 font-medium mb-1 block">Filter by capacity</label>
              <select
                value={capacityFilter}
                onChange={(e) => setCapacityFilter(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {capacityRanges.map(range => (
                  <option key={range} value={range}>
                    {range === 'All' ? 'All Capacities' : `${range} people`}
                  </option>
                ))}
              </select>
            </div>

            {/* Availability Filter */}
            <div className="flex-1 min-w-[150px]">
              <label className="text-xs text-gray-500 font-medium mb-1 block">Filter by availability</label>
              <select
                value={availabilityFilter}
                onChange={(e) => setAvailabilityFilter(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="All">All Availability</option>
                <option value="Available">Available</option>
                <option value="Available for Future Bookings">Available for Future Bookings</option>
                <option value="Not Available">Not Available</option>
              </select>
            </div>

            {/* Clear Filters Button */}
            {(searchTerm || typeFilter !== 'All' || capacityFilter !== 'All' || availabilityFilter !== 'All') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setTypeFilter('All');
                  setCapacityFilter('All');
                  setAvailabilityFilter('All');
                }}
                className="px-4 py-2 text-sm text-blue-600 hover:text-blue-700 font-medium border border-blue-300 rounded-lg hover:bg-blue-50 whitespace-nowrap"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>

        {/* Resources Grid */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading resources...</p>
          </div>
        ) : filteredFacilities.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <p className="text-gray-600">No resources found matching your filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFacilities.map(facility => (
              <div
                key={facility.id}
                className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition"
              >
                {/* Image Section */}
                <div className="relative h-48 bg-gray-200 overflow-hidden">
                  {facility.imageUrl ? (
                    <img
                      src={facility.imageUrl}
                      alt={facility.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <span className="text-4xl">📦</span>
                    </div>
                  )}
                </div>

                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{facility.name}</h3>
                    <p className="text-blue-100 text-sm mt-1">{facility.type}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded text-xs font-medium whitespace-nowrap ${facility.status === 'ACTIVE'
                      ? 'bg-white/20 text-white border border-white/30'
                      : 'bg-white/10 text-white border border-white/20'
                    }`}>
                    {facility.status === 'ACTIVE' ? 'Active' : 'Out of Service'}
                  </span>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                  {/* Building & Location */}
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-sm text-gray-600">Location</p>
                      <p className="font-medium text-gray-900">
                        {facility.building} - {facility.floor?.includes('Floor') ? facility.floor : `Floor ${facility.floor}`}
                      </p>
                    </div>
                  </div>

                  {/* Capacity */}
                  <div className="flex items-start gap-3">
                    <Users className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-sm text-gray-600">Capacity</p>
                      <p className="font-medium text-gray-900">
                        {facility.capacity ? `${facility.capacity} people` : 'N/A'}
                      </p>
                    </div>
                  </div>

                  {/* Operating Hours */}
                  {facility.operatingHours && (
                    <div className="flex items-start gap-3">
                      <Clock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-sm text-gray-600">Hours</p>
                        <p className="font-medium text-gray-900">
                          {facility.operatingHours}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Availability Status */}
                  <div className="flex items-start gap-3">
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Booking Status</p>
                      {getAvailabilityBadge(facility.bookingStatus)}
                    </div>
                  </div>

                  {/* Description */}
                  {facility.description && (
                    <div className="pt-4 border-t border-gray-200">
                      <p className="text-sm text-gray-600">{facility.description}</p>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setSelectedFacility(facility);
                      setIsModalOpen(true);
                    }}
                    className="w-full text-center text-blue-600 hover:text-blue-700 font-medium text-sm py-2 rounded-lg hover:bg-blue-50 transition"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Resource Details Modal */}
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
                  {selectedFacility.building} - Floor {selectedFacility.floor}
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
                <OccupancyChart facilityId={selectedFacility.id} facility={selectedFacility} />
              </div>

              {/* Timestamps */}
              <div className="pt-6 border-t border-gray-200 space-y-2 text-xs text-gray-500">
                <p>Added: {new Date(selectedFacility.createdAt).toLocaleString()}</p>
                <p>Updated: {new Date(selectedFacility.updatedAt).toLocaleString()}</p>
              </div>
            </div>

            {/* Footer Button */}
            <div className="bg-gray-50 px-8 py-4 border-t border-gray-200 rounded-b-2xl">
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
