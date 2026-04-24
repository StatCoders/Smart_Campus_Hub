package com.smartcampus.backend.dto.notification;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationPreferenceDto {
    private Long userId;
    private boolean bookingEnabled;
    private boolean ticketEnabled;
    private boolean systemEnabled;
    private boolean muteAll;
    private boolean highPriorityOnly;
}
