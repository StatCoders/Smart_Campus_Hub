import apiClient from './apiClient';

/**
 * Fetch technicians from the backend
 * @returns {Promise<Array>} List of technicians {id, firstName, lastName, email}
 */
export const getTechnicians = async () => {
  try {
    const response = await apiClient.get('/users?role=TECHNICIAN');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch technicians:', error);
    throw error;
  }
};

/**
 * Fetch all active users from the backend
 * @returns {Promise<Array>} List of users {id, firstName, lastName, email}
 */
export const getAllUsers = async () => {
  try {
    const response = await apiClient.get('/users');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch users:', error);
    throw error;
  }
};

export default {
  getTechnicians,
  getAllUsers,
};
