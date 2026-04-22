import { useQuery } from '@tanstack/react-query';

export const useTickets = (filters = {}, options = {}) => {
  return useQuery({
    queryKey: ['tickets', filters],
    queryFn: async () => {
      try {
        const response = await fetch('/api/tickets', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch tickets: ${response.status}`);
        }
        
        let tickets = await response.json();
        
        // Client-side filtering
        if (filters.status) {
          tickets = tickets.filter(t => t.status === filters.status);
        }
        if (filters.priority) {
          tickets = tickets.filter(t => t.priority === filters.priority);
        }
        if (filters.assignedTechnicianId) {
          tickets = tickets.filter(t => t.assignedTechnicianId === filters.assignedTechnicianId);
        }
        
        return tickets;
      } catch (error) {
        console.error('Error fetching tickets:', error);
        throw error;
      }
    },
    enabled: true,
    staleTime: 1000 * 60 * 5, // 5 minutes
    ...options
  });
};

export const useTicketsByTechnician = (technicianId, options = {}) => {
  return useQuery({
    queryKey: ['tickets', 'technician', technicianId],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/tickets/technician/${technicianId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch technician tickets: ${response.status}`);
        }
        
        return await response.json();
      } catch (error) {
        console.error('Error fetching technician tickets:', error);
        throw error;
      }
    },
    enabled: !!technicianId,
    staleTime: 1000 * 60 * 5,
    ...options
  });
};
