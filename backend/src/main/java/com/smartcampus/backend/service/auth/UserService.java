package com.smartcampus.backend.service.auth;

import com.smartcampus.backend.dto.auth.*;
import com.smartcampus.backend.exception.ConflictException;
import com.smartcampus.backend.exception.UnauthorizedException;
import com.smartcampus.backend.model.auth.Role;
import com.smartcampus.backend.model.auth.User;
import com.smartcampus.backend.repository.auth.UserRepository;
import com.smartcampus.backend.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthResponse signup(SignupRequest request) {
        // Validate that passwords match
        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new IllegalArgumentException("Passwords do not match");
        }

        // Check if user already exists
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ConflictException("Email already registered");
        }

        // Create new user
        String fullName = request.getFirstName() + " " + request.getLastName();
        User user = User.builder()
                .email(request.getEmail())
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .fullName(fullName)
                .phoneNumber(request.getPhoneNumber())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.USER)
                .emailVerified(false)
                .isActive(true)
                .build();

        user = userRepository.save(user);

        // Generate tokens
        String token = jwtUtil.generateToken(user);
        String refreshToken = jwtUtil.generateRefreshToken(user);

        return AuthResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .fullName(user.getFullName())
                .phoneNumber(user.getPhoneNumber())
                .role(user.getRole())
                .token(token)
                .refreshToken(refreshToken)
                .emailVerified(user.getEmailVerified())
                .message("Signup successful")
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new UnauthorizedException("Invalid email or password"));

        // Verify password
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new UnauthorizedException("Invalid email or password");
        }

        // Check if user is active
        if (!user.getIsActive()) {
            throw new UnauthorizedException("User account is disabled");
        }

        // Generate tokens
        String token = jwtUtil.generateToken(user);
        String refreshToken = jwtUtil.generateRefreshToken(user);

        return AuthResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .fullName(user.getFullName())
                .phoneNumber(user.getPhoneNumber())
                .role(user.getRole())
                .token(token)
                .refreshToken(refreshToken)
                .emailVerified(user.getEmailVerified())
                .message("Login successful")
                .build();
    }

    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    public User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return getUserByEmail(email);
    }

    public AuthResponse logout() {
        return new AuthResponse("Logout successful");
    }

    @Transactional(readOnly = true)
    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }

    public User updateUser(User user) {
        return userRepository.save(user);
    }

    public void deleteUser(Long userId) {
        userRepository.deleteById(userId);
    }

    public AuthResponse googleOAuthLogin(GoogleTokenInfo tokenInfo) {
        // Try to find existing user by email
        User user = userRepository.findByEmail(tokenInfo.getEmail()).orElse(null);

        // If user doesn't exist, create new user from Google info
        if (user == null) {
            String fullName = tokenInfo.getName() != null ? tokenInfo.getName() : 
                             (tokenInfo.getGivenName() + " " + tokenInfo.getFamilyName());
            
            user = User.builder()
                    .email(tokenInfo.getEmail())
                    .firstName(tokenInfo.getGivenName() != null ? tokenInfo.getGivenName() : "")
                    .lastName(tokenInfo.getFamilyName() != null ? tokenInfo.getFamilyName() : "")
                    .fullName(fullName)
                    .phoneNumber("")
                    .password("") // No password for OAuth users
                    .role(Role.USER)
                    .emailVerified(tokenInfo.getEmailVerified() != null ? tokenInfo.getEmailVerified() : false)
                    .isActive(true)
                    .build();
            
            user = userRepository.save(user);
        }

        // Generate JWT tokens
        String token = jwtUtil.generateToken(user);
        String refreshToken = jwtUtil.generateRefreshToken(user);

        return AuthResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .fullName(user.getFullName())
                .phoneNumber(user.getPhoneNumber())
                .role(user.getRole())
                .token(token)
                .refreshToken(refreshToken)
                .emailVerified(user.getEmailVerified())
                .message("Google login successful")
                .build();
    }
}
