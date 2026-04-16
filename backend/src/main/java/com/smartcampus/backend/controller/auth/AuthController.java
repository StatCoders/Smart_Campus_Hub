package com.smartcampus.backend.controller.auth;

import com.smartcampus.backend.dto.auth.AuthResponse;
import com.smartcampus.backend.dto.auth.CreateUserRequest;
import com.smartcampus.backend.dto.auth.GoogleTokenInfo;
import com.smartcampus.backend.dto.auth.GoogleTokenRequest;
import com.smartcampus.backend.dto.auth.LoginRequest;
import com.smartcampus.backend.dto.auth.SignupRequest;
import com.smartcampus.backend.dto.auth.UserResponse;
import com.smartcampus.backend.service.auth.GoogleOAuthService;
import com.smartcampus.backend.service.auth.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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
            System.out.println("Google OAuth login successful for: " + response.getData().getEmail());
            
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            System.err.println("Google OAuth error: " + e.getMessage());
            e.printStackTrace();
            return new ResponseEntity<>(
                AuthResponse.builder()
                        .success(false)
                        .message(e.getMessage())
                        .data(null)
                        .token(null)
                        .refreshToken(null)
                        .build(),
                HttpStatus.UNAUTHORIZED
            );
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser() {
        try {
            var user = userService.getCurrentUser();
            AuthResponse response = AuthResponse.builder()
                .success(true)
                    .message("User retrieved successfully")
                .data(AuthResponse.AuthData.builder()
                    .id(user.getId())
                    .email(user.getEmail())
                    .role(user.getRole())
                    .firstName(user.getFirstName())
                    .lastName(user.getLastName())
                    .fullName(user.getFullName())
                    .phoneNumber(user.getPhoneNumber())
                    .emailVerified(user.getEmailVerified())
                    .build())
                .token(null)
                .refreshToken(null)
                    .build();
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            AuthResponse response = AuthResponse.builder()
                .success(false)
                .message(e.getMessage())
                .data(null)
                .token(null)
                .refreshToken(null)
                .build();
            return new ResponseEntity<>(response, HttpStatus.UNAUTHORIZED);
        }
    }

    @GetMapping("/check-email/{email}")
    public ResponseEntity<?> checkEmailExists(@PathVariable String email) {
        boolean exists = userService.existsByEmail(email);
        return new ResponseEntity<>(new AuthResponse(exists ? "Email exists" : "Email available"), HttpStatus.OK);
    }

    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getAllUsers() {
        try {
            List<UserResponse> users = userService.getAllUsers();
            return new ResponseEntity<>(users, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(
                AuthResponse.builder()
                    .success(false)
                    .message(e.getMessage())
                    .build(),
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    @GetMapping("/users/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getUserById(@PathVariable Long userId) {
        try {
            UserResponse user = userService.getUserById(userId);
            return new ResponseEntity<>(user, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(
                AuthResponse.builder()
                    .success(false)
                    .message(e.getMessage())
                    .build(),
                HttpStatus.NOT_FOUND
            );
        }
    }

    @PostMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createUser(@Valid @RequestBody CreateUserRequest request) {
        try {
            UserResponse user = userService.createUserByAdmin(request);
            return new ResponseEntity<>(
                AuthResponse.builder()
                    .success(true)
                    .message("User created successfully")
                    .data(null)
                    .build(),
                HttpStatus.CREATED
            );
        } catch (Exception e) {
            return new ResponseEntity<>(
                AuthResponse.builder()
                    .success(false)
                    .message(e.getMessage())
                    .build(),
                HttpStatus.BAD_REQUEST
            );
        }
    }
}
