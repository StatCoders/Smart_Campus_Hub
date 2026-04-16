import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, User, Settings, LogOut, MapPin, Users, Clock, Check, X } from 'lucide-react';
import { useAuth } from '../context/useAuth';
import campusLogo from '../assets/campus-logo.png';
import { getAllFacilities } from '../services/facilityService';

export default function StudentResourcesPage() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [availabilityFilter, setAvailabilityFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

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

  // Filter facilities
  const filteredFacilities = facilities.filter(facility => {
    if (typeFilter !== 'All' && facility.type !== typeFilter) return false;
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
              <button className="p-2 hover:bg-blue-50 rounded-lg transition">
                <Bell className="w-5 h-5 text-blue-600" />
              </button>

              {/* Profile Button */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
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
                      onClick={() => {
                        navigate('/settings');
                        setIsMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 rounded-lg transition"
                    >
                      <Settings className="w-4 h-4" />
                      Settings
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
        <div className="mb-8 bg-white rounded-lg border border-gray-200 p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <input
                type="text"
                placeholder="Search by name or building..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Resource Type</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {facilityTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* Availability Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Availability</label>
              <select
                value={availabilityFilter}
                onChange={(e) => setAvailabilityFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="All">All</option>
                <option value="Available">Available</option>
                <option value="Not Available">Not Available</option>
              </select>
            </div>
          </div>

          {/* Clear Filters */}
          {(searchTerm || typeFilter !== 'All' || availabilityFilter !== 'All') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setTypeFilter('All');
                setAvailabilityFilter('All');
              }}
              className="mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Clear filters
            </button>
          )}
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
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                  <h3 className="text-lg font-semibold text-white">{facility.name}</h3>
                  <p className="text-blue-100 text-sm mt-1">{facility.type}</p>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                  {/* Building & Location */}
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-sm text-gray-600">Location</p>
                      <p className="font-medium text-gray-900">
                        {facility.building} - Floor {facility.floor}
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
                    onClick={() => navigate(`/facilities/${facility.id}`)}
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
    </div>
  );
}
