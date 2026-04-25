package com.smartcampus.backend.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SignupRequest {

    @NotBlank(message = "Email is required")
    @Email(message = "Enter a valid email address")
    @Pattern(regexp = "^[A-Za-z0-9._%+-]+@winfall\\.edu$", message = "Use your university email (@winfall.edu)")
    private String email;

    @NotBlank(message = "First name is required")
    @Size(min = 2, max = 100, message = "First name must be at least 2 characters")
    @Pattern(regexp = "^[A-Za-z]+$", message = "Name must contain only letters")
    private String firstName;

    @NotBlank(message = "Last name is required")
    @Size(min = 2, max = 100, message = "Last name must be at least 2 characters")
    @Pattern(regexp = "^[A-Za-z]+$", message = "Name must contain only letters")
    private String lastName;

    @NotBlank(message = "Phone number is required")
    @Pattern(regexp = "^\\d{10}$", message = "Enter a valid phone number (10 digits)")
    private String phoneNumber;

    @NotBlank(message = "Password is required")
    @Size(min = 8, max = 100, message = "Password must be at least 8 characters")
    @Pattern(regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*(),.?\":{}|<>]).+$", 
             message = "Password must meet all requirements (uppercase, lowercase, number, special char)")
    private String password;

    @NotBlank(message = "Confirm password is required")
    private String confirmPassword;
}
