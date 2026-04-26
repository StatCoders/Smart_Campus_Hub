package com.smartcampus.backend.dto.facility;

import com.smartcampus.backend.model.facility.FacilityStatus;
import com.smartcampus.backend.model.facility.FacilityType;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FacilityCreateRequest {

    @NotBlank(message = "Name is required")
    @Size(min = 3, max = 100, message = "Name must be between 3 and 100 characters")
    private String name;

    @NotNull(message = "Type is required")
    private FacilityType type;

    @PositiveOrZero(message = "Capacity must be positive or null")
    private Integer capacity;

    @NotBlank(message = "Building is required")
    @Size(min = 1, max = 50, message = "Building must be between 1 and 50 characters")
    private String building;

    @NotBlank(message = "Floor is required")
    @Size(min = 1, max = 20, message = "Floor must be between 1 and 20 characters")
    private String floor;

    private FacilityStatus status = FacilityStatus.ACTIVE;

    @Pattern(
            regexp = "^$|(?i)(mon|tue|wed|thu|fri|sat|sun)\\s*-\\s*(mon|tue|wed|thu|fri|sat|sun)\\s*:?\\s*([01]?\\d|2[0-3]):[0-5]\\d\\s*-\\s*([01]?\\d|2[0-3]):[0-5]\\d$",
            message = "Availability must match format like Mon-Fri: 08:00-19:00"
    )
    private String availabilityWindows;

    private List<String> features;

    private String imageUrl;

    private String imagePath;
}
