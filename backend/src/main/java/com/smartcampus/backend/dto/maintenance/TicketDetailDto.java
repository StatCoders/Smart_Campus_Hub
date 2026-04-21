package com.smartcampus.backend.dto.maintenance;

import com.smartcampus.backend.model.maintenance.Priority;
import com.smartcampus.backend.model.maintenance.Status;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TicketDetailDto {
    
    private Long id;
    private String resourceId;
    private Long userId;
    private String userFullName;
    private String category;
    private String building;
    private String roomNumber;
    private String description;
    private String additionalNotes;
    private Priority priority;
    private Status status;
    private LocalDate expectedDate;
    
    // Assignment details
    private Long assignedTechnicianId;
    private String assignedTechnicianName;
    private String assignedTechnicianEmail;
    
    // Resolution tracking
    private String resolutionNotes;
    private LocalDateTime firstResponseAt;
    private LocalDateTime resolvedAt;
    private String rejectionReason;
    
    // Contact info
    private String contactEmail;
    private String contactPhone;
    
    // Timestamps
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Related data
    private List<TicketCommentDto> comments;
    private List<TicketAttachmentDto> attachments;
    private List<TicketHistoryDto> history;
    
    // SLA metrics (calculated)
    private Long minutesToFirstResponse; // null if not yet responded
    private Long minutesToResolution;   // null if not resolved yet
}
