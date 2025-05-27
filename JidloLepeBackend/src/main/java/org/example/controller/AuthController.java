package org.example.controller;

import org.example.dto.AuthResponse;
import org.example.dto.LoginDTO;
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
    @Qualifier("authServiceImpl") // pokud jsi přidal název
    private AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginDTO loginDTO) {
        try {
            String token = authService.login(loginDTO);
            return ResponseEntity.ok(new AuthResponse(token));
        } catch (Exception e) {
            System.out.println("❌ Výjimka v AuthController: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Neplatný email nebo heslo");

        }
    }

}
