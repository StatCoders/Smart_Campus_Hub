import apiClient from './apiClient';

// Get all users (admin only)
export const getAllUsers = async () => {
  try {
    const response = await apiClient.get('/auth/users');
    return response.data;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

// Get a specific user by ID (admin only)
export const getUserById = async (userId) => {
  try {
    const response = await apiClient.get(`/auth/users/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching user:', error);
    throw error;
  }
};

// Create a new user (admin only)
export const createUser = async (userData) => {
  try {
    const response = await apiClient.post('/auth/users', userData);
    return response.data;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

// Update user role (admin only)
export const updateUserRole = async (userId, role) => {
  try {
    const response = await apiClient.put(`/auth/users/${userId}/role`, { role });
    return response.data;
  } catch (error) {
    console.error('Error updating user role:', error);
    throw error;
  }
};

// Update user status (admin only)
export const updateUserStatus = async (userId, isActive) => {
  try {
    const response = await apiClient.put(`/auth/users/${userId}/status`, { isActive });
    return response.data;
  } catch (error) {
    console.error('Error updating user status:', error);
    throw error;
  }
};

// Update user details (admin only)
export const updateUser = async (userId, userData) => {
  try {
    const response = await apiClient.put(`/auth/users/${userId}`, userData);
    return response.data;
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

// Get all technicians
export const getTechnicians = async () => {
  try {
    const response = await apiClient.get('/auth/users/role/TECHNICIAN');
    return response.data;
  } catch (error) {
    console.error('Error fetching technicians:', error);
    throw error;
  }
};


