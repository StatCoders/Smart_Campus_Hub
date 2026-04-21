package com.smartcampus.backend.dto.maintenance;

import com.smartcampus.backend.model.maintenance.AttachmentCategory;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TicketAttachmentDto {
    
    private Long id;
    private Long ticketId;
    private String fileName;
    private String fileUrl;
    private String fileType;
    private Long fileSize;
    private Long uploadedBy;
    private String uploadedByName;
    private AttachmentCategory attachmentCategory;
    private LocalDateTime uploadedAt;
}
