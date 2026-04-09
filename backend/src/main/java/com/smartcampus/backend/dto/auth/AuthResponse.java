package com.smartcampus.backend.dto.auth;

import com.smartcampus.backend.model.auth.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthResponse {

    private boolean success;
    private String message;
    private AuthData data;
    private String token;
    private String refreshToken;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AuthData {
        private Long id;
        private String email;
        private Role role;
        private String firstName;
        private String lastName;
        private String fullName;
        private String phoneNumber;
        private Boolean emailVerified;
    }

    public AuthResponse(String message) {
        this.success = false;
        this.message = message;
    }

    public AuthResponse(String message, String token) {
        this.success = true;
        this.message = message;
        this.token = token;
    }
}
