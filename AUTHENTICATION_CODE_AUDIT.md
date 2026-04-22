# Backend Authentication Code Audit

## Summary
This document contains all authentication-related code in the Smart Campus Hub backend, organized by category.

---

## 1. MIDDLEWARE/INTERCEPTORS THAT MODIFY USER ROLES

### JwtAuthenticationFilter
**File:** [backend/src/main/java/com/smartcampus/backend/security/JwtAuthenticationFilter.java](backend/src/main/java/com/smartcampus/backend/security/JwtAuthenticationFilter.java)

**Purpose:** Extracts JWT from request and sets authentication context with role

**Key Code:**
```java
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Autowired
    private JwtUtil jwtUtil;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, 
                                    FilterChain filterChain) throws ServletException, IOException {
        try {
            String jwt = extractJwtFromRequest(request);

            if (jwt != null && jwtUtil.isTokenValid(jwt)) {
                String username = jwtUtil.extractUsername(jwt);
                String role = jwtUtil.extractRole(jwt);
                if (role != null && role.startsWith("ROLE_")) {
                    role = role.substring("ROLE_".length());
                }

                UsernamePasswordAuthenticationToken authentication = 
                        new UsernamePasswordAuthenticationToken(
                                username, 
                                null, 
                                Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + role))
                        );
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authentication);
            }
        } catch (Exception e) {
            logger.error("Cannot set user authentication", e);
        }

        filterChain.doFilter(request, response);
    }

    private String extractJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}
```

**Critical Points:**
- Runs on **every request** before authentication is established
- **Extracts role directly from JWT token** (see JwtUtil.extractRole())
- Sets authentication context with the role from the token
- **Does NOT validate if the role in the token matches the database role**
- Strips "ROLE_" prefix and re-adds it when creating authorities

---

## 2. LOGIN/AUTH ENDPOINTS

### AuthController
**File:** [backend/src/main/java/com/smartcampus/backend/controller/auth/AuthController.java](backend/src/main/java/com/smartcampus/backend/controller/auth/AuthController.java)

#### Endpoint 1: POST /api/auth/signup
**Location:** Line 32-47

**Code:**
```java
@PostMapping("/signup")
public ResponseEntity<?> signup(@Valid @RequestBody SignupRequest signupRequest) {
    AuthResponse response = userService.signup(signupRequest);
    return new ResponseEntity<>(response, HttpStatus.CREATED);
}
```

**Related Service Method:** [UserService.signup()](backend/src/main/java/com/smartcampus/backend/service/auth/UserService.java#L35)
```java
public AuthResponse signup(SignupRequest request) {
    // ... validation code ...
    User user = User.builder()
            .email(request.getEmail())
            .firstName(request.getFirstName())
            .lastName(request.getLastName())
            .fullName(fullName)
            .phoneNumber(request.getPhoneNumber())
            .password(passwordEncoder.encode(request.getPassword()))
            .provider(AuthProvider.LOCAL)
            .role(Role.USER)  // <-- ALWAYS sets role to USER
            .emailVerified(false)
            .isActive(true)
            .build();
    
    user = userRepository.save(user);
    String token = jwtUtil.generateToken(user);
    String refreshToken = jwtUtil.generateRefreshToken(user);
    
    return AuthResponse.builder()
        .success(true)
        .message("Signup successful")
        .data(AuthResponse.AuthData.builder()
            .id(user.getId())
            .email(user.getEmail())
            .role(user.getRole())
            // ...
            .build())
            .token(token)
            .refreshToken(refreshToken)
            .build();
}
```

#### Endpoint 2: POST /api/auth/login
**Location:** Line 49-51

**Code:**
```java
@PostMapping("/login")
public ResponseEntity<?> login(@Valid @RequestBody LoginRequest loginRequest) {
    AuthResponse response = userService.login(loginRequest);
    return new ResponseEntity<>(response, HttpStatus.OK);
}
```

**Related Service Method:** [UserService.login()](backend/src/main/java/com/smartcampus/backend/service/auth/UserService.java#L93)
```java
public AuthResponse login(LoginRequest request) {
    User user = userRepository.findByEmail(request.getEmail())
            .orElseThrow(() -> new UnauthorizedException("Invalid email or password"));

    if (user.getProvider() == com.smartcampus.backend.model.auth.AuthProvider.GOOGLE) {
        throw new GoogleAccountLoginException("This account uses Google login. Please sign in with Google.");
    }

    // Password validation...

    // Check if user is active
    if (!user.getIsActive()) {
        throw new UnauthorizedException("User account is disabled");
    }

    // Generate tokens with user's current role from database
    String token = jwtUtil.generateToken(user);
    String refreshToken = jwtUtil.generateRefreshToken(user);

    return AuthResponse.builder()
        .success(true)
        .message("Login successful")
        .data(AuthResponse.AuthData.builder()
            .id(user.getId())
            .email(user.getEmail())
            .role(user.getRole())  // <-- Gets role from database User object
            // ...
            .build())
            .token(token)
            .refreshToken(refreshToken)
            .build();
}
```

#### Endpoint 3: POST /api/auth/logout
**Location:** Line 53-55

**Code:**
```java
@PostMapping("/logout")
public ResponseEntity<?> logout() {
    AuthResponse response = userService.logout();
    return new ResponseEntity<>(response, HttpStatus.OK);
}
```

**Related Service:** [UserService.logout()](backend/src/main/java/com/smartcampus/backend/service/auth/UserService.java#L149)
```java
public AuthResponse logout() {
    return AuthResponse.builder()
            .success(true)
            .message("Logout successful")
            .data(null)
            .token(null)
            .refreshToken(null)
            .build();
}
```

#### Endpoint 4: POST /api/auth/google
**Location:** Line 57-79

**Code:**
```java
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
        // ... error handling ...
    }
}
```

**Related Service Method:** [UserService.googleOAuthLogin()](backend/src/main/java/com/smartcampus/backend/service/auth/UserService.java#L165)
```java
public AuthResponse googleOAuthLogin(GoogleTokenInfo tokenInfo) {
    String email = tokenInfo.getEmail();
    String fullName = tokenInfo.getName() != null ? tokenInfo.getName() : 
        ((tokenInfo.getGivenName() != null ? tokenInfo.getGivenName() : "") + " " +
        (tokenInfo.getFamilyName() != null ? tokenInfo.getFamilyName() : "")).trim();

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
            .password(passwordEncoder.encode(UUID.randomUUID().toString()))
            .provider(com.smartcampus.backend.model.auth.AuthProvider.GOOGLE)
            .role(Role.USER)  // <-- ALWAYS sets role to USER for new Google users
            .emailVerified(true)
            .isActive(true)
            .build();

        user = userRepository.save(user);
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
            .role(user.getRole())  // <-- Uses existing role from database
            // ...
            .build())
            .token(token)
            .refreshToken(refreshToken)
            .build();
}
```

#### Endpoint 5: GET /api/auth/me
**Location:** Line 81-103

**Code:**
```java
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
                .role(user.getRole())  // <-- Gets role from database
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
        // ... error handling ...
    }
}
```

#### Endpoint 6: GET /api/auth/check-email/{email}
**Location:** Line 115-118

**Code:**
```java
@GetMapping("/check-email/{email}")
public ResponseEntity<?> checkEmailExists(@PathVariable String email) {
    boolean exists = userService.existsByEmail(email);
    return new ResponseEntity<>(new AuthResponse(exists ? "Email exists" : "Email available"), HttpStatus.OK);
}
```

#### Endpoint 7: GET /api/auth/users (Admin)
**Location:** Line 120-131

**Code:**
```java
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
```

#### Endpoint 8: GET /api/auth/users/{userId} (Admin)
**Location:** Line 133-149

**Code:**
```java
@GetMapping("/users/{userId}")
@PreAuthorize("hasRole('ADMIN')")
public ResponseEntity<?> getUserById(@PathVariable Long userId) {
    try {
        userService.getUserById(userId);
        return new ResponseEntity<>(
            AuthResponse.builder()
                .success(true)
                .message("User retrieved successfully")
                .data(null)
                .build(),
            HttpStatus.OK);
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
```

#### Endpoint 9: POST /api/auth/users (Admin - Create User)
**Location:** Line 151-169

**Code:**
```java
@PostMapping("/users")
@PreAuthorize("hasRole('ADMIN')")
public ResponseEntity<?> createUser(@Valid @RequestBody CreateUserRequest request) {
    try {
        userService.createUserByAdmin(request);
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
```

**Related Service Method:** [UserService.createUserByAdmin()](backend/src/main/java/com/smartcampus/backend/service/auth/UserService.java#L264)
```java
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
        .role(request.getRole())  // <-- Sets role from request (admin-specified)
        .emailVerified(false)
        .isActive(request.getIsActive() != null ? request.getIsActive() : true)
        .build();

    // Defensive check: prevent null provider before persisting
    if (user.getProvider() == null) {
        user.setProvider(AuthProvider.LOCAL);
    }

    user = userRepository.save(user);

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
```

#### Endpoint 10: PUT /api/auth/users/{userId}/role (Admin - Update Role)
**Location:** Line 171-196

**Code:**
```java
@PutMapping("/users/{userId}/role")
@PreAuthorize("hasRole('ADMIN')")
public ResponseEntity<?> updateUserRole(
        @PathVariable Long userId,
        @Valid @RequestBody UpdateRoleRequest request) {
    try {
        userService.updateUserRole(userId, request.getRole());
        return new ResponseEntity<>(
            AuthResponse.builder()
                .success(true)
                .message("User role updated successfully")
                .data(null)
                .build(),
            HttpStatus.OK
        );
    } catch (IllegalArgumentException e) {
        return new ResponseEntity<>(
            AuthResponse.builder()
                .success(false)
                .message(e.getMessage())
                .build(),
            HttpStatus.NOT_FOUND
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
```

**Related Service Method:** [UserService.updateUserRole()](backend/src/main/java/com/smartcampus/backend/service/auth/UserService.java#L307)
```java
public UserResponse updateUserRole(Long userId, Role newRole) {
    User user = userRepository.findById(userId)
        .orElseThrow(() -> new IllegalArgumentException("User not found"));

    Role previousRole = user.getRole();
    user.setRole(newRole);  // <-- Updates role in database
    user = userRepository.save(user);
    notifyRoleChangeIfNeeded(user, previousRole);  // <-- Sends notification

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
```

#### Endpoint 11: PUT /api/auth/users/{userId}/status (Admin - Update Status)
**Location:** Line 198-222

**Code:**
```java
@PutMapping("/users/{userId}/status")
@PreAuthorize("hasRole('ADMIN')")
public ResponseEntity<?> updateUserStatus(
        @PathVariable Long userId,
        @Valid @RequestBody UpdateStatusRequest request) {
    try {
        userService.updateUserStatus(userId, request.getIsActive());
        return new ResponseEntity<>(
            AuthResponse.builder()
                .success(true)
                .message("User status updated successfully")
                .data(null)
                .build(),
            HttpStatus.OK
        );
    } catch (IllegalArgumentException e) {
        return new ResponseEntity<>(
            AuthResponse.builder()
                .success(false)
                .message(e.getMessage())
                .build(),
            HttpStatus.NOT_FOUND
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
```

**Related Service Method:** [UserService.updateUserStatus()](backend/src/main/java/com/smartcampus/backend/service/auth/UserService.java#L327)
```java
public UserResponse updateUserStatus(Long userId, Boolean isActive) {
    User user = userRepository.findById(userId)
        .orElseThrow(() -> new IllegalArgumentException("User not found"));

    Boolean previousStatus = user.getIsActive();
    user.setIsActive(isActive);
    user = userRepository.save(user);
    notifyStatusChangeIfNeeded(user, previousStatus);  // <-- Sends notification

    return UserResponse.builder()
        .id(user.getId())
        .email(user.getEmail())
        // ...
        .build();
}
```

---

## 3. DEFAULT ROLE ASSIGNMENT LOGIC

### Default Role Assignment Locations:

1. **signup() - Line 57** [UserService.java](backend/src/main/java/com/smartcampus/backend/service/auth/UserService.java#L57)
   ```java
   .role(Role.USER)
   ```

2. **googleOAuthLogin() - Line 197** [UserService.java](backend/src/main/java/com/smartcampus/backend/service/auth/UserService.java#L197)
   ```java
   .role(Role.USER)
   ```

3. **User.builder() calls with no role parameter default to USER via the schema**

**NOTE:** The `InitializationConfig.java` does NOT contain any role assignment logic - it only initializes booking status for facilities.

---

## 4. JWT TOKEN VALIDATION & ROLE EXTRACTION

### JwtUtil.extractRole()
**File:** [backend/src/main/java/com/smartcampus/backend/security/JwtUtil.java](backend/src/main/java/com/smartcampus/backend/security/JwtUtil.java#L103)

**Code:**
```java
public String extractRole(String token) {
    Object role = extractAllClaims(token).get("role");
    if (role == null) {
        return "USER";
    }

    String value = String.valueOf(role).trim();
    return value.isEmpty() ? "USER" : value;
}
```

**Critical Points:**
- Extracts role claim from JWT token
- **Returns "USER" if role claim is missing or empty**
- **Does NOT validate that token role matches database role**

### JwtUtil.generateToken()
**File:** [backend/src/main/java/com/smartcampus/backend/security/JwtUtil.java](backend/src/main/java/com/smartcampus/backend/security/JwtUtil.java#L33)

**Code:**
```java
public String generateToken(UserDetails userDetails) {
    Map<String, Object> claims = new HashMap<>();
    claims.put("email", userDetails.getUsername());
    claims.put("role", userDetails.getAuthorities().stream()
            .map(auth -> auth.getAuthority().replace("ROLE_", ""))
            .findFirst()
            .orElse("USER"));
    return createToken(claims, userDetails.getUsername(), jwtExpirationMs);
}
```

**Critical Points:**
- Extracts role from `userDetails.getAuthorities()`
- User entity implements UserDetails and returns role via getAuthorities()
- For User entity, this comes from the database `role` field

### JwtUtil.generateRefreshToken()
**File:** [backend/src/main/java/com/smartcampus/backend/security/JwtUtil.java](backend/src/main/java/com/smartcampus/backend/security/JwtUtil.java#L43)

**Code:**
```java
public String generateRefreshToken(UserDetails userDetails) {
    Map<String, Object> claims = new HashMap<>();
    return createToken(claims, userDetails.getUsername(), jwtRefreshExpirationMs);
}
```

**Critical Points:**
- **Does NOT include role in refresh token**
- Only contains username and expiration

### JwtUtil.isTokenValid()
**File:** [backend/src/main/java/com/smartcampus/backend/security/JwtUtil.java](backend/src/main/java/com/smartcampus/backend/security/JwtUtil.java#L85)

**Code (Variant 1 - with UserDetails):**
```java
public Boolean isTokenValid(String token, UserDetails userDetails) {
    final String username = extractUsername(token);
    return (username.equals(userDetails.getUsername())) && !isTokenExpired(token);
}
```

**Code (Variant 2 - without UserDetails):**
```java
public Boolean isTokenValid(String token) {
    try {
        Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token);
        return true;
    } catch (Exception e) {
        return false;
    }
}
```

**Critical Points:**
- Only validates signature and expiration
- **Does NOT validate that the role in the token is correct**

---

## 5. SPRING SECURITY CONFIGURATION

### SecurityConfig
**File:** [backend/src/main/java/com/smartcampus/backend/config/SecurityConfig.java](backend/src/main/java/com/smartcampus/backend/config/SecurityConfig.java)

**Full Code:**
```java
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @Autowired
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public ObjectMapper objectMapper() {
        return new ObjectMapper();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers("/api/public/**").permitAll()
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
                        .requestMatchers("/api/technician/**").hasAnyRole("TECHNICIAN", "ADMIN")
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOriginPatterns(List.of("*"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(false);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);

        return source;
    }
}
```

**Critical Points:**
- Uses `@EnableMethodSecurity` - allows `@PreAuthorize` annotations
- All auth endpoints are permitAll
- Admin endpoints require ADMIN role
- Technician endpoints require TECHNICIAN or ADMIN role
- **Relies on JwtAuthenticationFilter to set the authentication context**
- **STATELESS session management** - no server-side session state

---

## 6. USER MODEL & ROLE DEFINITION

### User.java
**File:** [backend/src/main/java/com/smartcampus/backend/model/auth/User.java](backend/src/main/java/com/smartcampus/backend/model/auth/User.java)

**Key Sections:**
```java
@Entity
@Table(name = "users")
public class User implements UserDetails {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    // ... other fields ...

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;  // <-- Role enum stored as string in DB

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private AuthProvider provider = AuthProvider.LOCAL;

    // ... other fields ...

    // UserDetails Implementation
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    // ... other methods ...
}
```

**Critical Points:**
- Implements Spring's UserDetails interface
- Role is an enum stored as string in database
- `getAuthorities()` returns role as `"ROLE_" + role.name()`
- This is the source of truth for user roles

---

## 7. ROLE MODIFICATION ENDPOINTS & METHODS

### updateUserRole() - Admin Endpoint
**Endpoint:** PUT /api/auth/users/{userId}/role
**Requires:** @PreAuthorize("hasRole('ADMIN')")

**Call Chain:**
1. AuthController.updateUserRole() → UserService.updateUserRole()
2. UserService.updateUserRole() (Line 307):
   ```java
   user.setRole(newRole);
   user = userRepository.save(user);
   notifyRoleChangeIfNeeded(user, previousRole);
   ```

### updateUserByAdmin() - Admin Endpoint
**Endpoint:** PUT /api/auth/users/{userId} (presumed from code)

**Service Method** [UserService.java](backend/src/main/java/com/smartcampus/backend/service/auth/UserService.java#L356):
```java
public UserResponse updateUserByAdmin(Long userId, UpdateUserRequest request) {
    User user = userRepository.findById(userId)
        .orElseThrow(() -> new IllegalArgumentException("User not found"));

    Role previousRole = user.getRole();
    Boolean previousStatus = user.getIsActive();

    user.setFirstName(request.getFirstName());
    user.setLastName(request.getLastName());
    user.setFullName(request.getFirstName() + " " + request.getLastName());
    user.setPhoneNumber(request.getPhoneNumber());
    user.setRole(request.getRole());  // <-- Can update role here
    user.setIsActive(request.getIsActive());
    
    user = userRepository.save(user);
    notifyRoleChangeIfNeeded(user, previousRole);
    notifyStatusChangeIfNeeded(user, previousStatus);

    return UserResponse.builder()
        // ... build response ...
        .build();
}
```

---

## 8. ROLE ENUM

**Role enum values (from model):**
- USER (default for regular users)
- ADMIN
- TECHNICIAN

---

## 9. EXCEPTIONS & ERROR HANDLING

### GlobalExceptionHandler
**File:** [backend/src/main/java/com/smartcampus/backend/exception/GlobalExceptionHandler.java](backend/src/main/java/com/smartcampus/backend/exception/GlobalExceptionHandler.java)

**Handles:**
- ConflictException
- ResourceNotFoundException
- UnauthorizedException
- IllegalArgumentException
- MethodArgumentNotValidException
- AccessDeniedException
- Generic Exception

**Important:** 
- **Does NOT validate token roles**
- Returns standard error responses for auth failures

---

## 10. OAUTH2 RELATED CODE (Currently Disabled/Empty)

### CustomerOAuth2UserService.java
**File:** [backend/src/main/java/com/smartcampus/backend/security/CustomerOAuth2UserService.java](backend/src/main/java/com/smartcampus/backend/security/CustomerOAuth2UserService.java)
**Status:** EMPTY FILE - Not implemented

### OAuth2SuccessHandler.java
**File:** [backend/src/main/java/com/smartcampus/backend/security/OAuth2SuccessHandler.java](backend/src/main/java/com/smartcampus/backend/security/OAuth2SuccessHandler.java)
**Status:** EMPTY CLASS - Not implemented

---

## 11. AUTHORIZATION ANNOTATIONS IN CONTROLLERS

### Used in Controllers:
```java
@PreAuthorize("hasRole('USER')")
@PreAuthorize("hasRole('ADMIN')")
@PreAuthorize("hasAnyRole('USER', 'ADMIN', 'TECHNICIAN')")
@PreAuthorize("hasAnyRole('ADMIN', 'TECHNICIAN')")
@PreAuthorize("isAuthenticated()")
```

**Files Using These:**
- BookingController.java
- TicketController.java
- NotificationController.java

---

## KEY FINDINGS & SECURITY IMPLICATIONS

### 1. **No Role Validation in JWT Token**
The JWT token contains the role when generated, but there's **no validation** that this role matches the current database role. If a user's role is updated in the database, their old JWT token still contains the old role.

### 2. **Role Used from JWT Token (Not Database)**
JwtAuthenticationFilter extracts role from the token, not from the database. This means:
- User can use old token with old role even after role is updated
- Need to wait for token expiration OR have client refresh token

### 3. **Default Role is Always USER**
- New users via signup → USER
- New Google OAuth users → USER
- Admins must explicitly upgrade roles via /api/auth/users/{userId}/role

### 4. **No UserDetailsService Implementation**
No custom UserDetailsService found - relies on User entity implementing UserDetails

### 5. **Admin Role Updates**
Only admins can update roles via:
- POST /api/auth/users (CreateUserRequest with role)
- PUT /api/auth/users/{userId}/role (UpdateRoleRequest)
- PUT /api/auth/users/{userId} (UpdateUserRequest with role)

### 6. **No Refresh Token Handling Endpoint**
The code generates refresh tokens but there's **no endpoint to refresh the access token** to get an updated role claim.

### 7. **Google OAuth Always Creates USER Role**
Even Google OAuth users are created with USER role and must be manually upgraded.

### 8. **Multiple Role Update Paths**
Roles can be modified in multiple places:
- UserService.updateUserRole()
- UserService.updateUserByAdmin()
- UserService.createUserByAdmin()

---

## SUMMARY OF AUTHENTICATION FLOW

```
1. User Login
   ├─ POST /api/auth/login
   ├─ UserService.login() validates credentials
   ├─ Retrieves User from database (with current role)
   ├─ JwtUtil.generateToken(user) creates JWT with role from database
   └─ Returns JWT with role claim

2. Subsequent Requests
   ├─ Client sends JWT in Authorization header
   ├─ JwtAuthenticationFilter.doFilterInternal() runs on every request
   ├─ Extracts JWT and validates signature/expiration
   ├─ Extracts role from JWT token (NOT from database)
   ├─ Creates UsernamePasswordAuthenticationToken with role
   ├─ Sets in SecurityContextHolder
   └─ Request proceeds with token's role

3. Role Update (Admin)
   ├─ Admin calls PUT /api/auth/users/{userId}/role
   ├─ UserService.updateUserRole() updates database
   ├─ User's existing JWT still has old role
   └─ User needs to log out/in or wait for token expiration

4. Token Validation
   ├─ Only signature and expiration validated
   ├─ Role in token NOT validated against database
   └─ Missing role defaults to "USER"
```

---

## CONCLUSION

The authentication system has a **potential security gap**: roles are embedded in JWT tokens and extracted on every request, but are **not re-validated against the database**. This means role updates take effect only after token expiration or client-initiated logout/login.

**Recommended Actions:**
1. Implement token refresh endpoint
2. Add role validation in JwtAuthenticationFilter against database
3. Consider role change notification with forced logout
4. Implement token versioning/role version tracking
