package com.smartcampus.backend.dto.maintenance;

import com.smartcampus.backend.model.maintenance.Status;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TicketStatusUpdateRequest {
    
    @NotNull(message = "Status is required")
    private Status status;
    
    private String notes; // For resolution notes or rejection reason
    
    private String rejectionReason; // Mandatory if status = REJECTED
}
