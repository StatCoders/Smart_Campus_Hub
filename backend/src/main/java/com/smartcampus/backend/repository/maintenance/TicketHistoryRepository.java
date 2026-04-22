package com.smartcampus.backend.repository.maintenance;

import com.smartcampus.backend.model.maintenance.TicketHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TicketHistoryRepository extends JpaRepository<TicketHistory, Long> {
    
    List<TicketHistory> findByTicketIdOrderByCreatedAtDesc(Long ticketId);
    
    List<TicketHistory> findByTicketIdAndAction(Long ticketId, String action);
}
