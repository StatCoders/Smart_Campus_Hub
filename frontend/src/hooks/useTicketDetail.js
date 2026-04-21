import { useQuery } from '@tanstack/react-query';

export const useTicketDetail = (ticketId, options = {}) => {
  return useQuery({
    queryKey: ['ticket', ticketId],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/tickets/${ticketId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          }
        });
        
        if (!response.ok) {
          if (response.status === 403) {
            throw new Error('Access denied to this ticket');
          }
          throw new Error(`Failed to fetch ticket: ${response.status}`);
        }
        
        return await response.json();
      } catch (error) {
        console.error('Error fetching ticket detail:', error);
        throw error;
      }
    },
    enabled: !!ticketId,
    staleTime: 1000 * 60 * 2, // 2 minutes
    ...options
  });
};
