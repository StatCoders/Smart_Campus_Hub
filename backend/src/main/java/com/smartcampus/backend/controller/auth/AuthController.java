package com.smartcampus.backend.controller.auth;

import com.smartcampus.backend.dto.auth.AuthResponse;
import com.smartcampus.backend.dto.auth.GoogleTokenInfo;
import com.smartcampus.backend.dto.auth.GoogleTokenRequest;
import com.smartcampus.backend.dto.auth.LoginRequest;
import com.smartcampus.backend.dto.auth.SignupRequest;
import com.smartcampus.backend.exception.ConflictException;
import com.smartcampus.backend.service.auth.GoogleOAuthService;
import com.smartcampus.backend.service.auth.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "*", maxAge = 3600)
public class AuthController {

    private final UserService userService;
    private final GoogleOAuthService googleOAuthService;

    @PostMapping("/signup")
    public ResponseEntity<?> signup(@Valid @RequestBody SignupRequest signupRequest) {
        AuthResponse response = userService.signup(signupRequest);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest loginRequest) {
        AuthResponse response = userService.login(loginRequest);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout() {
        AuthResponse response = userService.logout();
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @PostMapping("/google")
    public ResponseEntity<?> googleOAuth(@Valid @RequestBody GoogleTokenRequest request) {
        try {
            System.out.println("Google OAuth request received with token: " + request.getToken().substring(0, 50) + "...");
            
            // Validate the Google token
            GoogleTokenInfo tokenInfo = googleOAuthService.validateToken(request.getToken());
            System.out.println("Token validated. Email: " + tokenInfo.getEmail());
            
            // Log in or register the user
            AuthResponse response = userService.googleOAuthLogin(tokenInfo);
            System.out.println("Google OAuth login successful for: " + response.getEmail());
            
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            System.err.println("Google OAuth error: " + e.getMessage());
            e.printStackTrace();
            return new ResponseEntity<>(
                new AuthResponse(e.getMessage()), 
                HttpStatus.UNAUTHORIZED
            );
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser() {
        try {
            var user = userService.getCurrentUser();
            AuthResponse response = AuthResponse.builder()
                    .id(user.getId())
                    .email(user.getEmail())
                    .firstName(user.getFirstName())
                    .lastName(user.getLastName())
                    .fullName(user.getFullName())
                    .phoneNumber(user.getPhoneNumber())
                    .role(user.getRole())
                    .emailVerified(user.getEmailVerified())
                    .message("User retrieved successfully")
                    .build();
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(new AuthResponse(e.getMessage()), HttpStatus.UNAUTHORIZED);
        }
    }

    @GetMapping("/check-email/{email}")
    public ResponseEntity<?> checkEmailExists(@PathVariable String email) {
        boolean exists = userService.existsByEmail(email);
        return new ResponseEntity<>(new AuthResponse(exists ? "Email exists" : "Email available"), HttpStatus.OK);
    }
}
