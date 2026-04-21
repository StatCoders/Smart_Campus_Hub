package com.smartcampus.backend.controller.auth;

import com.smartcampus.backend.dto.UserSummaryDto;
import com.smartcampus.backend.model.auth.Role;
import com.smartcampus.backend.model.auth.User;
import com.smartcampus.backend.service.auth.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@CrossOrigin(origins = "*", maxAge = 3600)
public class UserController {

    private final UserService userService;

    /**
     * Get users filtered by role
     * @param role Optional role filter (e.g., TECHNICIAN)
     * @return List of UserSummaryDto with id, firstName, lastName, email
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'TECHNICIAN')")
    public ResponseEntity<List<UserSummaryDto>> getUsers(
            @RequestParam(required = false) String role) {
        
        List<UserSummaryDto> users;
        
        if (role != null && !role.trim().isEmpty()) {
            try {
                Role roleEnum = Role.valueOf(role.toUpperCase());
                users = userService.getUsersByRole(roleEnum);
            } catch (IllegalArgumentException e) {
                return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
            }
        } else {
            users = userService.getAllActiveUsers();
        }
        
        return new ResponseEntity<>(users, HttpStatus.OK);
    }
}
