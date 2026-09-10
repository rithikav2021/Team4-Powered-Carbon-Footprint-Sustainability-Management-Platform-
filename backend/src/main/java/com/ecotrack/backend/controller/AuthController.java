package com.ecotrack.backend.controller;

import com.ecotrack.backend.dto.AuthResponse;
import com.ecotrack.backend.dto.LoginRequest;
import com.ecotrack.backend.dto.RegisterRequest;
import com.ecotrack.backend.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor

public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(
            @RequestBody RegisterRequest request) {

        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(
            @RequestBody LoginRequest request) {

        return ResponseEntity.ok(authService.login(request));
    }
    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("Backend is working");
    }
}