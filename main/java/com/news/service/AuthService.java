package com.news.service;

import com.news.dto.AuthResponse;
import com.news.dto.LoginRequest;
import com.news.dto.TokenResponse;
import com.news.dto.UserInfo;
import com.news.entity.User;
import com.news.repository.UserRepository;
import com.news.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthResponse login(LoginRequest loginRequest) {
        log.info("Login attempt for user: {}", loginRequest.getUsername());

        Authentication authentication = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(
                loginRequest.getUsername(),
                loginRequest.getPassword()
            )
        );

        User user = (User) authentication.getPrincipal();
        String accessToken = tokenProvider.generateAccessToken(authentication);
        String refreshToken = tokenProvider.generateRefreshToken(user.getUsername());

        log.info("User logged in successfully: {}", user.getUsername());

        return new AuthResponse(
            accessToken,
            refreshToken,
            "Bearer",
            mapUserToUserInfo(user)
        );
    }

    public TokenResponse refreshToken(String refreshToken) {
        if (!tokenProvider.validateToken(refreshToken)) {
            throw new RuntimeException("Invalid refresh token");
        }

        String username = tokenProvider.getUsernameFromJwt(refreshToken);
        String newAccessToken = tokenProvider.generateAccessToken(username);
        long expiresIn = tokenProvider.getExpirationTimeFromToken(newAccessToken);

        return new TokenResponse(newAccessToken, "Bearer", expiresIn);
    }

    public void logout(String token) {
        log.info("User logged out");
        // Implementasi bisa menggunakan token blacklist di Redis jika diperlukan
    }

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
}
