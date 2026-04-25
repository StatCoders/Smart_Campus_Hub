import apiClient from './apiClient';

const normalizeAuthResponse = (payload) => {
  // New backend format: { success, message, data, token, refreshToken }
  if (payload && payload.data && typeof payload.data === 'object') {
    return {
      ...payload.data,
      token: payload.token ?? null,
      refreshToken: payload.refreshToken ?? null,
      message: payload.message,
      success: payload.success,
    };
  }

  // Backward-compatible fallback for older flat payloads
  return payload;
};

const authService = {
  signup: async (formData) => {
    const response = await apiClient.post('/auth/signup', formData);
    return normalizeAuthResponse(response.data);
  },

  login: async (email, password) => {
    const response = await apiClient.post('/auth/login', { email, password });
    return normalizeAuthResponse(response.data);
  },

  googleLogin: async (token) => {
    const response = await apiClient.post('/auth/google', { token });
    return normalizeAuthResponse(response.data);
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
    return normalizeAuthResponse(response.data);
  },

  checkEmailExists: async (email) => {
    const response = await apiClient.get(`/auth/check-email/${email}`);
    return response.data;
  },
  
  updateProfile: async (profileData) => {
    const response = await apiClient.put('/users/profile', profileData);
    return normalizeAuthResponse({ data: response.data, success: true });
  },
};

export default authService;
