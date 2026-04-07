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

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TicketDto {
    
    private Long id;
    private String resourceId;
    private Long userId;
    private String category;
    private String building;
    private String roomNumber;
    private String description;
    private String additionalNotes;
    private Priority priority;
    private Status status;
    private LocalDate expectedDate;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
