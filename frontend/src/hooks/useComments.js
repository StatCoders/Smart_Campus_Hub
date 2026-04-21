import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export const useComments = (ticketId, options = {}) => {
  return useQuery({
    queryKey: ['comments', ticketId],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/tickets/${ticketId}/comments`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch comments: ${response.status}`);
        }
        
        return await response.json();
      } catch (error) {
        console.error('Error fetching comments:', error);
        throw error;
      }
    },
    enabled: !!ticketId,
    staleTime: 1000 * 60 * 1, // 1 minute
    ...options
  });
};

export const useAddComment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ ticketId, content }) => {
      const response = await fetch(`/api/tickets/${ticketId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({ content })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to add comment: ${response.status}`);
      }
      
      return await response.json();
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch comments for this ticket
      queryClient.invalidateQueries({ queryKey: ['comments', variables.ticketId] });
      // Also invalidate the ticket detail to update the ticket with new comments
      queryClient.invalidateQueries({ queryKey: ['ticket', variables.ticketId] });
    },
    onError: (error) => {
      console.error('Error adding comment:', error);
    }
  });
};

export const useUpdateComment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ commentId, content }) => {
      const response = await fetch(`/api/tickets/comments/${commentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({ content })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update comment: ${response.status}`);
      }
      
      return await response.json();
    },
    onSuccess: () => {
      // Invalidate comments queries
      queryClient.invalidateQueries({ queryKey: ['comments'] });
      queryClient.invalidateQueries({ queryKey: ['ticket'] });
    },
    onError: (error) => {
      console.error('Error updating comment:', error);
    }
  });
};

export const useDeleteComment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (commentId) => {
      const response = await fetch(`/api/tickets/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete comment: ${response.status}`);
      }
      
      return true;
    },
    onSuccess: () => {
      // Invalidate comments queries
      queryClient.invalidateQueries({ queryKey: ['comments'] });
      queryClient.invalidateQueries({ queryKey: ['ticket'] });
    },
    onError: (error) => {
      console.error('Error deleting comment:', error);
    }
  });
};
