package org.example.controller;

import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import org.example.dto.ChangePasswordDTO;
import org.example.dto.ScanHistoryDTO;
import org.example.dto.UserDTO;
import org.example.service.UserService;
import org.example.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.Set;

@SecurityRequirement(name = "bearerAuth")
@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private JwtUtil jwtUtil;

    // ── Helper ────────────────────────────────────────────────────────────────
    private String emailFromHeader(String authHeader) {
        return jwtUtil.extractUsername(authHeader.replace("Bearer ", ""));
    }

    // ── Existing allergen endpoints ───────────────────────────────────────────

    @PutMapping("/allergens")
    public UserDTO updateUserAllergens(@RequestBody UserDTO dto) {
        return userService.updateUserAllergens(dto);
    }

    @GetMapping("/allergens")
    public ResponseEntity<Set<String>> getUserAllergens(
            @RequestHeader("Authorization") String authHeader) {
        String email = emailFromHeader(authHeader);
        return ResponseEntity.ok(userService.getUserAllergenNamesByEmail(email));
    }

    // ── Change password ───────────────────────────────────────────────────────
    // POST /api/auth/change-password
    // Body: { "oldPassword": "...", "newPassword": "..." }

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody ChangePasswordDTO dto) {
        try {
            String email = emailFromHeader(authHeader);
            userService.changePassword(email, dto);
            return ResponseEntity.ok(Map.of("message", "Heslo bylo úspěšně změněno"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ── Scan history ──────────────────────────────────────────────────────────
    // GET /api/users/history  → returns last 20 scanned products

    @GetMapping("/history")
    public ResponseEntity<List<ScanHistoryDTO>> getHistory(
            @RequestHeader("Authorization") String authHeader) {
        String email = emailFromHeader(authHeader);
        return ResponseEntity.ok(userService.getHistory(email));
    }

    // POST /api/users/history  → call this when a product is scanned/viewed
    // Body: { "productCode": "...", "productName": "...", "imageUrl": "..." }

    @PostMapping("/history")
    public ResponseEntity<?> addToHistory(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody Map<String, String> body) {
        String email = emailFromHeader(authHeader);
        userService.addToHistory(
                email,
                body.get("productCode"),
                body.get("productName"),
                body.get("imageUrl")
        );
        return ResponseEntity.ok(Map.of("message", "Přidáno do historie"));
    }

    // ── Avatar upload ─────────────────────────────────────────────────────────
    // POST /api/users/avatar  → multipart/form-data, field name: "file"

    @PostMapping(value = "/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadAvatar(
            @RequestHeader("Authorization") String authHeader,
            @RequestPart("file") MultipartFile file) {
        try {
            String email = emailFromHeader(authHeader);
            String url = userService.uploadAvatar(email, file);
            return ResponseEntity.ok(Map.of("avatarUrl", url));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // GET /api/users/avatar  → returns the avatar URL for the current user

    @GetMapping("/avatar")
    public ResponseEntity<?> getAvatar(
            @RequestHeader("Authorization") String authHeader) {
        String email = emailFromHeader(authHeader);
        var user = userService.getUserEntityByEmail(email);
        if (user == null || user.getAvatarPath() == null) {
            return ResponseEntity.ok(Map.of("avatarUrl", ""));
        }
        return ResponseEntity.ok(Map.of("avatarUrl", "/avatars/" + user.getAvatarPath()));
    }
}