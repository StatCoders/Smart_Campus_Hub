package com.smartcampus.backend.service.facility;

import com.smartcampus.backend.dto.facility.FacilityCreateRequest;
import com.smartcampus.backend.dto.facility.FacilityDto;
import com.smartcampus.backend.dto.facility.FacilitySearchFilter;
import com.smartcampus.backend.model.facility.Facility;
import com.smartcampus.backend.repository.facility.FacilityRepository;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class FacilityService {

    private final FacilityRepository facilityRepository;
    private final ModelMapper modelMapper;

    /**
     * Get all facilities with optional filtering
     */
    public Page<FacilityDto> getAllFacilities(FacilitySearchFilter filter, Pageable pageable) {
        Specification<Facility> spec = buildSpecification(filter);
        Page<Facility> facilities = facilityRepository.findAll(spec, pageable);
        return facilities.map(facility -> modelMapper.map(facility, FacilityDto.class));
    }

    /**
     * Build Specification for dynamic filtering
     */
    private Specification<Facility> buildSpecification(FacilitySearchFilter filter) {
        return (root, query, cb) -> {
            var predicates = new java.util.ArrayList<>();

            if (filter.getType() != null) {
                predicates.add(cb.equal(root.get("type"), filter.getType()));
            }

            if (filter.getMinCapacity() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("capacity"), filter.getMinCapacity()));
            }

            if (filter.getLocation() != null && !filter.getLocation().isBlank()) {
                var building = cb.like(cb.lower(root.get("building")), "%" + filter.getLocation().toLowerCase() + "%");
                var floor = cb.like(cb.lower(root.get("floor")), "%" + filter.getLocation().toLowerCase() + "%");
                predicates.add(cb.or(building, floor));
            }

            if (filter.getStatus() != null) {
                predicates.add(cb.equal(root.get("status"), filter.getStatus()));
            }

            return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };
    }

    /**
     * Get facility by ID
     */
    public FacilityDto getFacilityById(Long id) {
        Facility facility = facilityRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Facility not found with id: " + id));
        return modelMapper.map(facility, FacilityDto.class);
    }

    /**
     * Create new facility (Admin only)
     */
    public FacilityDto createFacility(FacilityCreateRequest request) {
        Facility facility = modelMapper.map(request, Facility.class);
        Facility savedFacility = facilityRepository.save(facility);
        return modelMapper.map(savedFacility, FacilityDto.class);
    }

    /**
     * Update existing facility (Admin only)
     */
    public FacilityDto updateFacility(Long id, FacilityCreateRequest request) {
        Facility facility = facilityRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Facility not found with id: " + id));

        modelMapper.map(request, facility);
        Facility updatedFacility = facilityRepository.save(facility);
        return modelMapper.map(updatedFacility, FacilityDto.class);
    }

    /**
     * Delete facility (Admin only)
     */
    public void deleteFacility(Long id) {
        if (!facilityRepository.existsById(id)) {
            throw new RuntimeException("Facility not found with id: " + id);
        }
        facilityRepository.deleteById(id);
    }

    /**
     * Get facilities by type
     */
    public List<FacilityDto> getFacilitiesByType(String type) {
        return facilityRepository.findByType(Enum.valueOf(com.smartcampus.backend.model.facility.FacilityType.class, type))
                .stream()
                .map(facility -> modelMapper.map(facility, FacilityDto.class))
                .collect(Collectors.toList());
    }

    /**
     * Search facilities by location (building or floor)
     */
    public List<FacilityDto> searchByLocation(String location) {
        List<Facility> facilities = facilityRepository.findByBuilding(location);
        // Also add facilities with matching floor
        List<Facility> facilities2 = facilityRepository.findAll().stream()
                .filter(f -> f.getFloor() != null && f.getFloor().toLowerCase().contains(location.toLowerCase()))
                .collect(Collectors.toList());
        facilities.addAll(facilities2);

        return facilities.stream()
                .distinct()
                .map(facility -> modelMapper.map(facility, FacilityDto.class))
                .collect(Collectors.toList());
    }

    /**
     * Get count of total facilities
     */
    public long getTotalFacilityCount() {
        return facilityRepository.count();
    }
}
