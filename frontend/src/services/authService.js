import apiClient from './apiClient';

const authService = {
  signup: async (formData) => {
    const response = await apiClient.post('/auth/signup', formData);
    return response.data;
  },

  login: async (email, password) => {
    const response = await apiClient.post('/auth/login', { email, password });
    return response.data;
  },

  googleLogin: async (token) => {
    const response = await apiClient.post('/auth/google', { token });
    return response.data;
  },

  logout: async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    }
  },

  getCurrentUser: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  checkEmailExists: async (email) => {
    const response = await apiClient.get(`/auth/check-email/${email}`);
    return response.data;
  },
};

export default authService;
