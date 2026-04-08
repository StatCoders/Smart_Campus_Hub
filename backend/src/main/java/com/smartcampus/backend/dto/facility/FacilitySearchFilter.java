package com.smartcampus.backend.dto.facility;

import com.smartcampus.backend.model.facility.FacilityStatus;
import com.smartcampus.backend.model.facility.FacilityType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FacilitySearchFilter {

    private FacilityType type;
    private Integer minCapacity; // Filters capacity >= minCapacity
    private String location; // Searches in building or floor
    private FacilityStatus status;
}
