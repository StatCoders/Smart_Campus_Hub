import apiClient from './apiClient';

// Create a new ticket
export const createTicket = async (ticketData) => {
  try {
    const response = await apiClient.post('/tickets', ticketData);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to create ticket';
  }
};

// Update a ticket
export const updateTicket = async (id, ticketData) => {
  try {
    const response = await apiClient.put(`/tickets/${id}`, ticketData);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to update ticket';
  }
};

// Get all tickets (user sees own, admin sees all)
export const getAllTickets = async () => {
  try {
    const response = await apiClient.get('/tickets');
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to fetch tickets';
  }
};

// Get a ticket by ID
export const getTicketById = async (id) => {
  try {
    const response = await apiClient.get(`/tickets/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to fetch ticket';
  }
};

// Delete a ticket
export const deleteTicket = async (id) => {
  try {
    await apiClient.delete(`/tickets/${id}`);
  } catch (error) {
    throw error.response?.data?.message || 'Failed to delete ticket';
  }
};
