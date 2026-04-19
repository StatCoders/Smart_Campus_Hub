package com.smartcampus.backend.model.facility;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "resources")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Facility {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private FacilityType type;

    @Column(nullable = false)
    private Integer capacity = 0;

    @Column(nullable = false)
    private String building;

    @Column(nullable = false)
    private String floor;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private FacilityStatus status = FacilityStatus.ACTIVE;

    @Column(length = 50)
    private String bookingStatus = "CAN_BOOK_NOW";

    @Column(length = 500)
    private String availabilityWindows;

    @ElementCollection
    @CollectionTable(name = "resource_features", joinColumns = @JoinColumn(name = "resource_id"))
    @Column(name = "feature")
    private List<String> features;

    @Column(columnDefinition = "TEXT")
    private String imageUrl;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;
}
