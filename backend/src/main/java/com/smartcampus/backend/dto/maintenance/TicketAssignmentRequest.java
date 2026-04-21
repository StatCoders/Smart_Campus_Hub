package com.smartcampus.backend.dto.maintenance;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TicketAssignmentRequest {
    
    @NotNull(message = "Technician ID is required")
    private Long technicianId;

    @Size(max = 500, message = "Assignment note cannot exceed 500 characters")
    private String note;
}
