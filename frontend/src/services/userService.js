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
