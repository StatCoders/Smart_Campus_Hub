package com.smartcampus.backend.repository.maintenance;

import com.smartcampus.backend.model.maintenance.TicketComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TicketCommentRepository extends JpaRepository<TicketComment, Long> {
    
    List<TicketComment> findByTicketIdOrderByCreatedAtDesc(Long ticketId);
    
    List<TicketComment> findByTicketIdAndUserId(Long ticketId, Long userId);
}

