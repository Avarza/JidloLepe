package org.example.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import org.example.security.JwtUtil;
import org.example.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/products")
public class ProductProxyController {

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Autowired
    private UserService userService;

    @Autowired
    private JwtUtil jwtUtil;

    // ── Helper: extract email from Bearer token (returns null if missing) ─────
    private String emailFromHeader(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) return null;
        try {
            return jwtUtil.extractUsername(authHeader.replace("Bearer ", ""));
        } catch (Exception e) {
            return null;
        }
    }

    // ── GET /api/products/snacks ──────────────────────────────────────────────
    @GetMapping("/snacks")
    public ResponseEntity<String> getSnackProducts() {
        String url = "https://world.openfoodfacts.org/cgi/search.pl?" +
                "action=process&tagtype_0=categories&tag_contains_0=contains" +
                "&tag_0=snacks&page_size=5&json=true";
        try {
            return ResponseEntity.ok(restTemplate.getForObject(url, String.class));
        } catch (Exception e) {
            return ResponseEntity.status(502).body("{\"error\":\"OpenFoodFacts API nedostupné\"}");
        }
    }

    // ── GET /api/products/ ────────────────────────────────────────────────────
    @GetMapping("/")
    public ResponseEntity<String> getBasicProducts() {
        String url = "https://world.openfoodfacts.org/cgi/search.pl?" +
                "action=process&tagtype_0=categories&tag_contains_0=contains" +
                "&tag_0=snacks&page_size=5&json=true&fields=code,product_name,image_front_url";
        try {
            return ResponseEntity.ok(restTemplate.getForObject(url, String.class));
        } catch (Exception e) {
            return ResponseEntity.status(502).body("{\"error\":\"OpenFoodFacts API nedostupné\"}");
        }
    }

    // ── GET /api/products/{id} ────────────────────────────────────────────────
    // Authorization header is optional — history is only saved when logged in
    @GetMapping("/{id}")
    public ResponseEntity<String> getProductDetail(
            @PathVariable String id,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        String url = "https://world.openfoodfacts.org/api/v0/product/" + id + ".json";

        try {
            String result = restTemplate.getForObject(url, String.class);

            // ── Save to history if user is logged in ──────────────────────────
            String email = emailFromHeader(authHeader);
            if (email != null && result != null) {
                try {
                    JsonNode root = objectMapper.readTree(result);
                    JsonNode product = root.path("product");

                    if (!product.isMissingNode()) {
                        String productName = product.path("product_name").asText(null);
                        String imageUrl    = product.path("image_front_url").asText(null);
                        userService.addToHistory(email, id, productName, imageUrl);
                    }
                } catch (Exception parseEx) {
                    // Don't fail the whole request if history saving fails
                    System.err.println("Chyba při ukládání historie: " + parseEx.getMessage());
                }
            }

            return ResponseEntity.ok(result);

        } catch (Exception e) {
            return ResponseEntity.status(502).body("{\"error\":\"Produkt nenalezen\"}");
        }
    }
}