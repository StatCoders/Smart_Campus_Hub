package com.smartcampus.backend.dto.maintenance;

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
public class TicketHistoryDto {
    
    private Long id;
    private Long ticketId;
    private Long userId;
    private String userFullName;
    private String action;
    private String oldValue;
    private String newValue;
    private String details;
    private LocalDateTime createdAt;
}
