package com.smartcampus.backend.repository.maintenance;

import com.smartcampus.backend.model.maintenance.TicketAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TicketAttachmentRepository extends JpaRepository<TicketAttachment, Long> {
    
    List<TicketAttachment> findByTicketIdOrderByUploadedAtDesc(Long ticketId);
    
    long countByTicketId(Long ticketId);
}

