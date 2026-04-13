package com.smartcampus.backend.dto.booking;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class RejectBookingRequestDto {

    @NotBlank(message = "Rejection reason is required")
    private String reason;
}
