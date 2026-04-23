package com.smartcampus.backend.service.auth;

import com.smartcampus.backend.dto.auth.*;
import com.smartcampus.backend.dto.UserSummaryDto;
import com.smartcampus.backend.exception.ConflictException;
import com.smartcampus.backend.exception.GoogleAccountLoginException;
import com.smartcampus.backend.exception.MissingPasswordException;
import com.smartcampus.backend.exception.UnauthorizedException;
import com.smartcampus.backend.model.auth.AuthProvider;
import com.smartcampus.backend.model.auth.Role;
import com.smartcampus.backend.model.auth.User;
import com.smartcampus.backend.model.notification.NotificationType;
import com.smartcampus.backend.repository.auth.UserRepository;
import com.smartcampus.backend.security.JwtUtil;
import com.smartcampus.backend.service.notification.NotificationPreferenceService;
import com.smartcampus.backend.service.notification.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final NotificationService notificationService;
    private final NotificationPreferenceService preferenceService;

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
                .provider(AuthProvider.LOCAL)
                .role(Role.USER)
                .emailVerified(false)
                .isActive(true)
                .build();

        // Defensive check: prevent null provider before persisting
        if (user.getProvider() == null) {
            user.setProvider(AuthProvider.LOCAL);
        }

        user = userRepository.save(user);
        preferenceService.createDefaultPreferences(user.getId());

        // Generate tokens
        String token = jwtUtil.generateToken(user);
        String refreshToken = jwtUtil.generateRefreshToken(user);

        return AuthResponse.builder()
            .success(true)
            .message("Signup successful")
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
                .token(token)
                .refreshToken(refreshToken)
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new UnauthorizedException("Invalid email or password"));

        if (user.getProvider() == com.smartcampus.backend.model.auth.AuthProvider.GOOGLE) {
            throw new GoogleAccountLoginException("This account uses Google login. Please sign in with Google.");
        }

        String rawPassword = request.getPassword();
        String encodedPassword = user.getPassword();

        if (rawPassword == null || rawPassword.isBlank()) {
            throw new MissingPasswordException("Password is required");
        }

        if (encodedPassword == null || encodedPassword.isBlank()) {
            throw new MissingPasswordException("Password login is not available for this account");
        }

        // Verify password (null-safe)
        if (!passwordEncoder.matches(rawPassword, encodedPassword)) {
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
            .success(true)
            .message("Login successful")
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
                .token(token)
                .refreshToken(refreshToken)
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
        return AuthResponse.builder()
                .success(true)
                .message("Logout successful")
                .data(null)
                .token(null)
                .refreshToken(null)
                .build();
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
        String email = tokenInfo.getEmail();
        String fullName = tokenInfo.getName() != null
            ? tokenInfo.getName()
            : ((tokenInfo.getGivenName() != null ? tokenInfo.getGivenName() : "")
            + " "
            + (tokenInfo.getFamilyName() != null ? tokenInfo.getFamilyName() : "")).trim();

        // Return existing user if present
        User user = userRepository.findByEmail(email).orElse(null);

        // Otherwise create a Google-authenticated user
        if (user == null) {
            user = User.builder()
                .email(email)
                .firstName(tokenInfo.getGivenName() != null ? tokenInfo.getGivenName() : "")
                .lastName(tokenInfo.getFamilyName() != null ? tokenInfo.getFamilyName() : "")
                .fullName(fullName)
                .phoneNumber("")
                // Keep DB NOT NULL constraint satisfied; GOOGLE users are still blocked from password login.
                .password(passwordEncoder.encode(UUID.randomUUID().toString()))
                .provider(com.smartcampus.backend.model.auth.AuthProvider.GOOGLE)
                .role(Role.USER)
                .emailVerified(true)
                .isActive(true)
                .build();

            user = userRepository.save(user);
            preferenceService.createDefaultPreferences(user.getId());
        }

        // Generate JWT tokens
        String token = jwtUtil.generateToken(user);
        String refreshToken = jwtUtil.generateRefreshToken(user);

        return AuthResponse.builder()
            .success(true)
            .message("Google login successful")
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
                .token(token)
                .refreshToken(refreshToken)
                .build();
    }

    @Transactional(readOnly = true)
    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
            .map(user -> UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .fullName(user.getFullName())
                .phoneNumber(user.getPhoneNumber())
                .role(user.getRole())
                .emailVerified(user.getEmailVerified())
                .isActive(user.getIsActive())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build())
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public UserResponse getUserById(Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
        
        return UserResponse.builder()
            .id(user.getId())
            .email(user.getEmail())
            .firstName(user.getFirstName())
            .lastName(user.getLastName())
            .fullName(user.getFullName())
            .phoneNumber(user.getPhoneNumber())
            .role(user.getRole())
            .emailVerified(user.getEmailVerified())
            .isActive(user.getIsActive())
            .createdAt(user.getCreatedAt())
            .updatedAt(user.getUpdatedAt())
            .build();
    }

    public User getUser(Long userId) {
        return userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + userId));
    }

    public UserResponse createUserByAdmin(CreateUserRequest request) {
        // Check if user already exists
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ConflictException("Email already registered");
        }

        // Create new user with admin-specified role
        String fullName = request.getFirstName() + " " + request.getLastName();
        User user = User.builder()
            .email(request.getEmail())
            .firstName(request.getFirstName())
            .lastName(request.getLastName())
            .fullName(fullName)
            .phoneNumber(request.getPhoneNumber())
            .password(passwordEncoder.encode(request.getPassword()))
            .provider(AuthProvider.LOCAL)
            .role(request.getRole())
            .emailVerified(false)
            .isActive(request.getIsActive() != null ? request.getIsActive() : true)
            .build();

        // Defensive check: prevent null provider before persisting
        if (user.getProvider() == null) {
            user.setProvider(AuthProvider.LOCAL);
        }

        user = userRepository.save(user);
        preferenceService.createDefaultPreferences(user.getId());

        return UserResponse.builder()
            .id(user.getId())
            .email(user.getEmail())
            .firstName(user.getFirstName())
            .lastName(user.getLastName())
            .fullName(user.getFullName())
            .phoneNumber(user.getPhoneNumber())
            .role(user.getRole())
            .emailVerified(user.getEmailVerified())
            .isActive(user.getIsActive())
            .createdAt(user.getCreatedAt())
            .updatedAt(user.getUpdatedAt())
            .build();
    }

    public UserResponse updateUserRole(Long userId, Role newRole) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Role previousRole = user.getRole();
        user.setRole(newRole);
        user = userRepository.save(user);
        preferenceService.createDefaultPreferences(user.getId());
        notifyRoleChangeIfNeeded(user, previousRole);

        return UserResponse.builder()
            .id(user.getId())
            .email(user.getEmail())
            .firstName(user.getFirstName())
            .lastName(user.getLastName())
            .fullName(user.getFullName())
            .phoneNumber(user.getPhoneNumber())
            .role(user.getRole())
            .emailVerified(user.getEmailVerified())
            .isActive(user.getIsActive())
            .createdAt(user.getCreatedAt())
            .updatedAt(user.getUpdatedAt())
            .build();
    }

    public UserResponse updateUserStatus(Long userId, Boolean isActive) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Boolean previousStatus = user.getIsActive();
        user.setIsActive(isActive);
        user = userRepository.save(user);
        preferenceService.createDefaultPreferences(user.getId());
        notifyStatusChangeIfNeeded(user, previousStatus);

        return UserResponse.builder()
            .id(user.getId())
            .email(user.getEmail())
            .firstName(user.getFirstName())
            .lastName(user.getLastName())
            .fullName(user.getFullName())
            .phoneNumber(user.getPhoneNumber())
            .role(user.getRole())
            .emailVerified(user.getEmailVerified())
            .isActive(user.getIsActive())
            .createdAt(user.getCreatedAt())
            .updatedAt(user.getUpdatedAt())
            .build();
    }

    public UserResponse updateUserByAdmin(Long userId, UpdateUserRequest request) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Role previousRole = user.getRole();
        Boolean previousStatus = user.getIsActive();

        // Update user details
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setFullName(request.getFirstName() + " " + request.getLastName());
        user.setPhoneNumber(request.getPhoneNumber());
        user.setRole(request.getRole());
        user.setIsActive(request.getIsActive());
        
        user = userRepository.save(user);
        preferenceService.createDefaultPreferences(user.getId());
        notifyRoleChangeIfNeeded(user, previousRole);
        notifyStatusChangeIfNeeded(user, previousStatus);

        return UserResponse.builder()
            .id(user.getId())
            .email(user.getEmail())
            .firstName(user.getFirstName())
            .lastName(user.getLastName())
            .fullName(user.getFullName())
            .phoneNumber(user.getPhoneNumber())
            .role(user.getRole())
            .emailVerified(user.getEmailVerified())
            .isActive(user.getIsActive())
            .createdAt(user.getCreatedAt())
            .updatedAt(user.getUpdatedAt())
            .build();
    }

    /**
     * Get all users filtered by role as UserSummaryDto
     * @param role The role to filter by
     * @return List of UserSummaryDto for users with the given role
     */
    @Transactional(readOnly = true)
    public List<UserSummaryDto> getUsersByRole(Role role) {
        return userRepository.findByRoleAndIsActiveTrueOrderByFirstName(role)
                .stream()
                .map(this::mapToSummaryDto)
                .collect(Collectors.toList());
    }

    /**
     * Get all active users as UserSummaryDto
     * @return List of all active users
     */
    @Transactional(readOnly = true)
    public List<UserSummaryDto> getAllActiveUsers() {
        return userRepository.findByIsActiveTrueOrderByFirstName()
                .stream()
                .map(this::mapToSummaryDto)
                .collect(Collectors.toList());
    }

    /**
     * Map User entity to UserSummaryDto
     */
    private UserSummaryDto mapToSummaryDto(User user) {
        return UserSummaryDto.builder()
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .build();
    }

    private void notifyRoleChangeIfNeeded(User user, Role previousRole) {
        if (previousRole == user.getRole()) {
            return;
        }

        notificationService.createNotification(
                user.getId(),
                "Your role has been updated to " + user.getRole(),
                NotificationType.SYSTEM
        );
    }

    private void notifyStatusChangeIfNeeded(User user, Boolean previousStatus) {
        if (previousStatus != null && previousStatus.equals(user.getIsActive())) {
            return;
        }

        String message = Boolean.TRUE.equals(user.getIsActive())
                ? "Your account has been enabled"
                : "Your account has been disabled";

        notificationService.createNotification(
                user.getId(),
                message,
                NotificationType.SYSTEM
        );
    }
}
