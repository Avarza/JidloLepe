package org.example.controller;

import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import org.example.dto.ChangePasswordDTO;
import org.example.dto.DietPreferencesDTO;
import org.example.dto.FavoriteProductDTO;
import org.example.dto.ProductNoteDTO;
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
    public UserDTO updateUserAllergens(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody UserDTO dto) {
        String email = emailFromHeader(authHeader);
        dto.setEmail(email);
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

    // Favorites
    @GetMapping("/favorites")
    public ResponseEntity<List<FavoriteProductDTO>> getFavorites(
            @RequestHeader("Authorization") String authHeader) {
        String email = emailFromHeader(authHeader);
        return ResponseEntity.ok(userService.getFavorites(email));
    }

    @PostMapping("/favorites")
    public ResponseEntity<?> addFavorite(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody Map<String, String> body) {
        String email = emailFromHeader(authHeader);
        userService.addFavorite(
                email,
                body.get("productCode"),
                body.get("productName"),
                body.get("imageUrl")
        );
        return ResponseEntity.ok(Map.of("message", "Produkt přidán do oblíbených"));
    }

    @DeleteMapping("/favorites/{productCode}")
    public ResponseEntity<?> removeFavorite(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable String productCode) {
        String email = emailFromHeader(authHeader);
        userService.removeFavorite(email, productCode);
        return ResponseEntity.ok(Map.of("message", "Produkt odebrán z oblíbených"));
    }

    @GetMapping("/favorites/{productCode}/exists")
    public ResponseEntity<?> isFavorite(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable String productCode) {
        String email = emailFromHeader(authHeader);
        return ResponseEntity.ok(Map.of("isFavorite", userService.isFavorite(email, productCode)));
    }

    // Product notes
    @GetMapping("/notes/{productCode}")
    public ResponseEntity<ProductNoteDTO> getProductNote(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable String productCode) {
        String email = emailFromHeader(authHeader);
        return ResponseEntity.ok(userService.getProductNote(email, productCode));
    }

    @PutMapping("/notes/{productCode}")
    public ResponseEntity<ProductNoteDTO> saveProductNote(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable String productCode,
            @RequestBody Map<String, String> body) {
        String email = emailFromHeader(authHeader);
        return ResponseEntity.ok(userService.saveProductNote(email, productCode, body.get("note")));
    }

    // Diet preferences
    @GetMapping("/diet-preferences")
    public ResponseEntity<?> getDietPreferences(
            @RequestHeader("Authorization") String authHeader) {
        String email = emailFromHeader(authHeader);
        return ResponseEntity.ok(Map.of("preferences", userService.getDietPreferences(email)));
    }

    @PutMapping("/diet-preferences")
    public ResponseEntity<?> updateDietPreferences(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody DietPreferencesDTO dto) {
        String email = emailFromHeader(authHeader);
        return ResponseEntity.ok(Map.of("preferences", userService.updateDietPreferences(email, dto.getPreferences())));
    }
}
