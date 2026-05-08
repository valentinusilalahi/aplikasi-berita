package com.news.controller;

import com.news.dto.UserInfo;
import com.news.entity.User;
import com.news.entity.UserRole;
import com.news.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
@Slf4j
public class UserController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * Get all users (ADMIN only)
     */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UserInfo>> getAllUsers() {
        log.info("Fetching all users");
        List<UserInfo> users = userRepository.findAll().stream()
            .map(this::mapUserToUserInfo)
            .collect(Collectors.toList());
        return ResponseEntity.ok(users);
    }

    /**
     * Get users by role
     */
    @GetMapping("/role/{role}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UserInfo>> getUsersByRole(@PathVariable String role) {
        log.info("Fetching users by role: {}", role);
        UserRole userRole = UserRole.valueOf(role.toUpperCase());
        List<UserInfo> users = userRepository.findByRole(userRole).stream()
            .map(this::mapUserToUserInfo)
            .collect(Collectors.toList());
        return ResponseEntity.ok(users);
    }

    /**
     * Create new user (ADMIN only)
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createUser(@Valid @RequestBody CreateUserRequest request) {
        log.info("Creating new user: {}", request.getUsername());
        
        // Check if user already exists
        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(new ApiResponse("Username already exists"));
        }
        
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(new ApiResponse("Email already exists"));
        }
        
        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(UserRole.valueOf(request.getRole().toUpperCase()));
        user.setActive(true);
        
        User savedUser = userRepository.save(user);
        return ResponseEntity.status(HttpStatus.CREATED).body(mapUserToUserInfo(savedUser));
    }

    /**
     * Update user (ADMIN only)
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateUser(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserRequest request) {
        log.info("Updating user: {}", id);
        
        User user = userRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        if (request.getEmail() != null) {
            user.setEmail(request.getEmail());
        }
        
        if (request.getRole() != null) {
            user.setRole(UserRole.valueOf(request.getRole().toUpperCase()));
        }
        
        if (request.getActive() != null) {
            user.setActive(request.getActive());
        }
        
        User updatedUser = userRepository.save(user);
        return ResponseEntity.ok(mapUserToUserInfo(updatedUser));
    }

    /**
     * Deactivate/Delete user
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deactivateUser(@PathVariable Long id) {
        log.info("Deactivating user: {}", id);
        
        User user = userRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        user.setActive(false);
        userRepository.save(user);
        
        return ResponseEntity.ok(new ApiResponse("User deactivated successfully"));
    }

    /**
     * Reset user password (ADMIN only)
     */
    @PostMapping("/{id}/reset-password")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> resetPassword(
            @PathVariable Long id,
            @RequestBody PasswordResetRequest request) {
        log.info("Resetting password for user: {}", id);
        
        User user = userRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        
        return ResponseEntity.ok(new ApiResponse("Password reset successfully"));
    }

    /**
     * Helper method to map User to UserInfo
     */
    private UserInfo mapUserToUserInfo(User user) {
        return new UserInfo(
            user.getId(),
            user.getUsername(),
            user.getEmail(),
            user.getRole(),
            user.isActive(),
            user.getCreatedAt()
        );
    }

    /**
     * DTOs for request/response
     */
    @lombok.Data
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class CreateUserRequest {
        private String username;
        private String email;
        private String password;
        private String role; // EDITOR, REVIEWER, ADMIN
    }

    @lombok.Data
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class UpdateUserRequest {
        private String email;
        private String role;
        private Boolean active;
    }

    @lombok.Data
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class PasswordResetRequest {
        private String newPassword;
    }

    @lombok.Data
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class ApiResponse {
        private String message;
    }
}
