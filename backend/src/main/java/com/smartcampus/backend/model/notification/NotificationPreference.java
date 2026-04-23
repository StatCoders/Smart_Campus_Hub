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

    @Column(nullable = false, unique = true)
    private Long userId;

    @Builder.Default
    @Column(nullable = false)
    private boolean bookingEnabled = true;

    @Builder.Default
    @Column(nullable = false)
    private boolean ticketEnabled = true;

    @Builder.Default
    @Column(nullable = false)
    private boolean systemEnabled = true;

    @Builder.Default
    @Column(nullable = false)
    private boolean muteAll = false;
}
