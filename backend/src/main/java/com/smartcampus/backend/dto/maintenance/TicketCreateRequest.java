package com.smartcampus.backend.dto.maintenance;

import com.smartcampus.backend.model.maintenance.Priority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TicketCreateRequest {

    @NotBlank(message = "Resource ID is required")
    private String resourceId;

    @NotBlank(message = "Category is required")
    private String category;

    private String building;

    private String roomNumber;

    @NotBlank(message = "Description is required")
    private String description;

    private String additionalNotes;

    private LocalDate expectedDate;

    @NotNull(message = "Priority is required")
    private Priority priority;
}
