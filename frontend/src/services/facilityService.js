import apiClient from './apiClient';

// Get all facilities with optional filters
export const getAllFacilities = async (params = {}) => {
  try {
    const response = await apiClient.get('/resources', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to fetch facilities';
  }
};

// Get a single facility by ID
export const getFacilityById = async (id) => {
  try {
    const response = await apiClient.get(`/resources/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to fetch facility';
  }
};

// Create a new facility (ADMIN only)
export const createFacility = async (facilityData) => {
  try {
    const response = await apiClient.post('/resources', facilityData);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to create facility';
  }
};

// Update an existing facility (ADMIN only)
export const updateFacility = async (id, facilityData) => {
  try {
    const response = await apiClient.put(`/resources/${id}`, facilityData);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to update facility';
  }
};

// Delete a facility (ADMIN only)
export const deleteFacility = async (id) => {
  try {
    await apiClient.delete(`/resources/${id}`);
  } catch (error) {
    throw error.response?.data?.message || 'Failed to delete facility';
  }
};

// Search facilities by type
export const searchByType = async (type) => {
  try {
    const response = await apiClient.get('/resources/search/by-type', {
      params: { type }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to search by type';
  }
};

// Search facilities by location
export const searchByLocation = async (location) => {
  try {
    const response = await apiClient.get('/resources/search/by-location', {
      params: { location }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to search by location';
  }
};

// Helper function to build filter params
export const buildFilterParams = (filters) => {
  const params = {};
  
  if (filters.type && filters.type !== 'All') {
    params.type = filters.type;
  }
  if (filters.status && filters.status !== 'All Statuses') {
    params.status = filters.status;
  }
  if (filters.capacity && filters.capacity !== 'All Capacities') {
    params.capacity = parseInt(filters.capacity);
  }
  if (filters.location && filters.location.trim()) {
    params.location = filters.location;
  }
  if (filters.page !== undefined) {
    params.page = filters.page;
  }
  if (filters.size !== undefined) {
    params.size = filters.size;
  }
  
  return params;
};

// Upload image file
export const uploadImage = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post('/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data?.error || 'Failed to upload image';
  }
};
