package com.news.controller;

import com.news.dto.AuthResponse;
import com.news.dto.LoginRequest;
import com.news.dto.TokenResponse;
import com.news.service.AuthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final AuthService authService;

    /**
     * Login user
     */
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest loginRequest) {
        log.info("Login request for user: {}", loginRequest.getUsername());
        AuthResponse response = authService.login(loginRequest);
        return ResponseEntity.ok(response);
    }

    /**
     * Refresh access token
     */
    @PostMapping("/refresh")
    public ResponseEntity<TokenResponse> refreshToken(
            @RequestHeader("Authorization") String refreshToken) {
        
        // Extract token from Bearer header
        String token = refreshToken.startsWith("Bearer ") ? 
            refreshToken.substring(7) : refreshToken;
        
        TokenResponse response = authService.refreshToken(token);
        return ResponseEntity.ok(response);
    }

    /**
     * Logout user
     */
    @PostMapping("/logout")
    public ResponseEntity<?> logout(@RequestHeader("Authorization") String token) {
        String jwtToken = token.startsWith("Bearer ") ? token.substring(7) : token;
        authService.logout(jwtToken);
        return ResponseEntity.ok(new ApiResponse("User logged out successfully"));
    }

    /**
     * Check token validity
     */
    @GetMapping("/validate")
    public ResponseEntity<ApiResponse> validateToken() {
        return ResponseEntity.ok(new ApiResponse("Token is valid"));
    }

    /**
     * Simple API response wrapper
     */
    @lombok.Data
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class ApiResponse {
        private String message;
    }
}
