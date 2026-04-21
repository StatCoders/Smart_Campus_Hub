package com.smartcampus.backend.model.maintenance;

import jakarta.persistence.*;
import com.smartcampus.backend.model.auth.Role;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "tickets")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Ticket {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String resourceId;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    private String category;

    @Column(length = 100)
    private String building;

    @Column(length = 50)
    private String roomNumber;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(columnDefinition = "TEXT")
    private String additionalNotes;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Priority priority;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status;

    @Column
    private LocalDate expectedDate;

    // Technician Assignment
    @Column
    private Long assignedTechnicianId;

    // Resolution tracking
    @Column(columnDefinition = "TEXT")
    private String resolutionNotes;

    // SLA tracking
    @Column
    private LocalDateTime firstResponseAt;

    @Column
    private LocalDateTime resolvedAt;

    // Rejection reason (if status = REJECTED)
    @Column(columnDefinition = "TEXT")
    private String rejectionReason;

    @Enumerated(EnumType.STRING)
    @Column
    private Role rejectedByRole;

    @Column(columnDefinition = "TEXT")
    private String adminFeedback;

    @Column
    private Integer adminRating;

    @Column
    private Long adminFeedbackBy;

    @Column
    private LocalDateTime adminFeedbackAt;

    // Contact info
    @Column
    private String contactEmail;

    @Column
    private String contactPhone;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    // Relationships
    @OneToMany(mappedBy = "ticket", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<TicketComment> comments = new ArrayList<>();

    @OneToMany(mappedBy = "ticket", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<TicketAttachment> attachments = new ArrayList<>();

    @OneToMany(mappedBy = "ticket", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<TicketHistory> history = new ArrayList<>();
}
