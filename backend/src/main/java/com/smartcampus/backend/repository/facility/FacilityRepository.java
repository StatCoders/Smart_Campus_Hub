package com.smartcampus.backend.repository.facility;

import com.smartcampus.backend.model.facility.Facility;
import com.smartcampus.backend.model.facility.FacilityStatus;
import com.smartcampus.backend.model.facility.FacilityType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FacilityRepository extends JpaRepository<Facility, Long>, JpaSpecificationExecutor<Facility> {

    /**
     * Find facilities by type
     */
    List<Facility> findByType(FacilityType type);

    /**
     * Find facilities by status
     */
    List<Facility> findByStatus(FacilityStatus status);

    /**
     * Find facilities by building
     */
    List<Facility> findByBuilding(String building);

    /**
     * Find facilities by capacity >= minCapacity
     */
    List<Facility> findByCapacityGreaterThanEqual(Integer minCapacity);

    /**
     * Find all active facilities
     */
    List<Facility> findByStatusOrderByNameAsc(FacilityStatus status);

    /**
     * Find by type and status
     */
    List<Facility> findByTypeAndStatus(FacilityType type, FacilityStatus status);
}
