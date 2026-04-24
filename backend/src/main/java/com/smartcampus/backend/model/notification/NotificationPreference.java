package com.smartcampus.backend.model.notification;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "notification_preferences")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationPreference {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false, unique = true)
    private Long userId;

    @Builder.Default
    @Column(name = "booking_enabled", nullable = false)
    private boolean bookingEnabled = true;

    @Builder.Default
    @Column(name = "ticket_enabled", nullable = false)
    private boolean ticketEnabled = true;

    @Builder.Default
    @Column(name = "system_enabled", nullable = false)
    private boolean systemEnabled = true;

    @Builder.Default
    @Column(name = "mute_all", nullable = false)
    private boolean muteAll = false;

    @Builder.Default
    @Column(name = "high_priority_only", nullable = false)
    private boolean highPriorityOnly = false;
}
