package org.example.controller;

import org.example.dto.AuthResponse;
import org.example.dto.LoginDTO;
import org.example.dto.RegisterDTO;
import org.example.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin("*")
public class AuthController {

    @Autowired
    @Qualifier("authServiceImpl")
    private AuthService authService;

    // ── POST /api/auth/login ──────────────────────────────────────────────────
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginDTO loginDTO) {
        try {
            String token = authService.login(loginDTO);
            return ResponseEntity.ok(new AuthResponse(token));
        } catch (Exception e) {
            System.out.println("❌ Výjimka v AuthController login: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Neplatný email nebo heslo");
        }
    }

    // ── POST /api/auth/register ───────────────────────────────────────────────
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterDTO registerDTO) {
        try {
            String token = authService.register(registerDTO);
            return ResponseEntity.status(HttpStatus.CREATED).body(new AuthResponse(token));
        } catch (IllegalArgumentException e) {
            // Email already taken, password too short, etc.
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        } catch (Exception e) {
            System.out.println("❌ Výjimka v AuthController register: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Registrace selhala");
        }
    }
}