package com.smartcampus.backend.dto.facility;

import com.smartcampus.backend.model.facility.FacilityStatus;
import com.smartcampus.backend.model.facility.FacilityType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FacilityDto {

    private Long id;
    private String name;
    private FacilityType type;
    private Integer capacity;
    private String building;
    private String floor;
    private FacilityStatus status;
    private String availabilityWindows;
    private List<String> features;
    private String imageUrl;
    private String imagePath;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
