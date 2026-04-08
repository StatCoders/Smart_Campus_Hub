package com.smartcampus.backend.controller.facility;

import com.smartcampus.backend.dto.facility.FacilityCreateRequest;
import com.smartcampus.backend.dto.facility.FacilityDto;
import com.smartcampus.backend.dto.facility.FacilitySearchFilter;
import com.smartcampus.backend.service.facility.FacilityService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/resources")
@RequiredArgsConstructor
public class FacilityController {

    private final FacilityService facilityService;

    /**
     * Get all resources with optional filtering
     * Accessible by ADMIN and USER
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<Page<FacilityDto>> getAllResources(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) Integer capacity,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) String status,
            @PageableDefault(size = 10, page = 0, sort = "id", direction = Sort.Direction.ASC) Pageable pageable) {

        FacilitySearchFilter filter = new FacilitySearchFilter();
        if (type != null && !type.isEmpty()) {
            filter.setType(com.smartcampus.backend.model.facility.FacilityType.valueOf(type.toUpperCase()));
        }
        if (capacity != null) {
            filter.setMinCapacity(capacity);
        }
        filter.setLocation(location);
        if (status != null && !status.isEmpty()) {
            filter.setStatus(com.smartcampus.backend.model.facility.FacilityStatus.valueOf(status.toUpperCase()));
        }

        Page<FacilityDto> resources = facilityService.getAllFacilities(filter, pageable);
        return ResponseEntity.ok(resources);
    }

    /**
     * Get resource by ID
     * Accessible by ADMIN and USER
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<FacilityDto> getResourceById(@PathVariable Long id) {
        FacilityDto resource = facilityService.getFacilityById(id);
        return ResponseEntity.ok(resource);
    }

    /**
     * Create new resource
     * ADMIN ONLY
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<FacilityDto> createResource(@Valid @RequestBody FacilityCreateRequest request) {
        FacilityDto resource = facilityService.createFacility(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(resource);
    }

    /**
     * Update existing resource
     * ADMIN ONLY
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<FacilityDto> updateResource(
            @PathVariable Long id,
            @Valid @RequestBody FacilityCreateRequest request) {
        FacilityDto resource = facilityService.updateFacility(id, request);
        return ResponseEntity.ok(resource);
    }

    /**
     * Delete resource
     * ADMIN ONLY
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteResource(@PathVariable Long id) {
        facilityService.deleteFacility(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Search resources by type
     * Accessible by ADMIN and USER
     */
    @GetMapping("/search/by-type")
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<?> searchByType(@RequestParam String type) {
        try {
            return ResponseEntity.ok(facilityService.getFacilitiesByType(type));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Invalid facility type: " + type);
        }
    }

    /**
     * Search resources by location
     * Accessible by ADMIN and USER
     */
    @GetMapping("/search/by-location")
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<?> searchByLocation(@RequestParam String location) {
        return ResponseEntity.ok(facilityService.searchByLocation(location));
    }
}
