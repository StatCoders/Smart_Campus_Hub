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
    const response = await apiClient.get('/users', {
      params: { role: 'TECHNICIAN' },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching technicians:', error);
    throw error;
  }
};

const ACTIVE_TECHNICIAN_STATUSES = new Set(['OPEN', 'IN_PROGRESS']);

// Get technicians that do not currently own another active ticket.
export const getAvailableTechnicians = async (currentTicketId = null) => {
  try {
    const [technicians, ticketsResponse] = await Promise.all([
      getTechnicians(),
      apiClient.get('/tickets'),
    ]);

    const tickets = Array.isArray(ticketsResponse.data) ? ticketsResponse.data : [];
    const currentId = currentTicketId ? Number(currentTicketId) : null;
    const busyTechnicianIds = new Set(
      tickets
        .filter((ticket) => {
          const isCurrentTicket = currentId !== null && Number(ticket.id) === currentId;
          return (
            !isCurrentTicket &&
            ticket.assignedTechnicianId &&
            ACTIVE_TECHNICIAN_STATUSES.has(ticket.status)
          );
        })
        .map((ticket) => Number(ticket.assignedTechnicianId))
    );

    return (Array.isArray(technicians) ? technicians : []).filter(
      (technician) => !busyTechnicianIds.has(Number(technician.id))
    );
  } catch (error) {
    console.error('Error fetching available technicians:', error);
    throw error;
  }
};

