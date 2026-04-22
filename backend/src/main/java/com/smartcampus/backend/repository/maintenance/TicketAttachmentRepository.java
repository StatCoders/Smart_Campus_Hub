package com.smartcampus.backend.repository.maintenance;

import com.smartcampus.backend.model.maintenance.AttachmentCategory;
import com.smartcampus.backend.model.maintenance.TicketAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TicketAttachmentRepository extends JpaRepository<TicketAttachment, Long> {
    
    List<TicketAttachment> findByTicketIdOrderByUploadedAtDesc(Long ticketId);

    List<TicketAttachment> findByTicketIdAndAttachmentCategoryOrderByUploadedAtDesc(Long ticketId, AttachmentCategory attachmentCategory);

    long countByTicketId(Long ticketId);

    long countByTicketIdAndAttachmentCategory(Long ticketId, AttachmentCategory attachmentCategory);
}

