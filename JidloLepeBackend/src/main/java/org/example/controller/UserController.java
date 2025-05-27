package org.example.controller;

import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import org.example.dto.UserDTO;
import org.example.service.UserService;
import org.example.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Set;

@SecurityRequirement(name = "bearerAuth")
@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private JwtUtil jwtUtil;

    // PUT /api/users/allergens – uloží alergeny
    @PutMapping("/allergens")
    public UserDTO updateUserAllergens(@RequestBody UserDTO dto) {
        return userService.updateUserAllergens(dto);
    }

    // GET /api/users/allergens – načte alergeny přihlášeného uživatele
    @GetMapping("/allergens")
    public ResponseEntity<Set<String>> getUserAllergens(@RequestHeader("Authorization") String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        String email = jwtUtil.extractUsername(token);
        Set<String> allergenNames = userService.getUserAllergenNamesByEmail(email);
        return ResponseEntity.ok(allergenNames);
    }
}
