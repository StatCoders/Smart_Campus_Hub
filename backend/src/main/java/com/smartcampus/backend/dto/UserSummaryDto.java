package com.smartcampus.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Summary DTO for User - contains minimal information for list displays
 * Used for technician selection dropdowns and user listings
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserSummaryDto {
    
    private Long id;
    private String firstName;
    private String lastName;
    private String email;
}
