import { useQuery } from '@tanstack/react-query';
import { getAllFacilities } from '../services/facilityService';
import { getAllTickets } from '../services/ticketService';
import { getAllBookings } from '../services/bookingService';

const normalizeFacilities = (payload) => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.content)) {
    return payload.content;
  }

  return [];
};

export function useCampusOperationsData() {
  const ticketsQuery = useQuery({
    queryKey: ['dashboard', 'tickets'],
    queryFn: getAllTickets,
    staleTime: 60_000,
  });

  const facilitiesQuery = useQuery({
    queryKey: ['dashboard', 'facilities'],
    queryFn: () => getAllFacilities({ page: 0, size: 100 }),
    select: normalizeFacilities,
    staleTime: 120_000,
  });

  const bookingsQuery = useQuery({
    queryKey: ['dashboard', 'bookings'],
    queryFn: getAllBookings,
    staleTime: 120_000,
    retry: false,
  });

  return {
    ticketsQuery,
    facilitiesQuery,
    bookingsQuery,
  };
}
