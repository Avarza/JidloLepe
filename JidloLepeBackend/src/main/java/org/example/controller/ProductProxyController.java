package org.example.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.example.security.JwtUtil;
import org.example.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/products")
public class ProductProxyController {

    private static final String OPEN_FOOD_FACTS_BASE_URL = "https://world.openfoodfacts.org";
    private static final String USER_AGENT = "JidloLepe/1.0 (contact: support@jidlolepe.local)";

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Autowired
    private UserService userService;

    @Autowired
    private JwtUtil jwtUtil;

    private String emailFromHeader(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return null;
        }
        try {
            return jwtUtil.extractUsername(authHeader.replace("Bearer ", ""));
        } catch (Exception e) {
            return null;
        }
    }

    private String fetchOpenFoodFacts(String url) {
        HttpHeaders headers = new HttpHeaders();
        headers.set(HttpHeaders.USER_AGENT, USER_AGENT);

        ResponseEntity<String> response = restTemplate.exchange(
                url,
                HttpMethod.GET,
                new HttpEntity<>(headers),
                String.class
        );

        return response.getBody();
    }

    @GetMapping("/snacks")
    public ResponseEntity<String> getSnackProducts() {
        String url = OPEN_FOOD_FACTS_BASE_URL + "/cgi/search.pl?" +
                "action=process&tagtype_0=categories&tag_contains_0=contains" +
                "&tag_0=snacks&page_size=5&json=true";
        try {
            return ResponseEntity.ok(fetchOpenFoodFacts(url));
        } catch (Exception e) {
            return ResponseEntity.status(502).body("{\"error\":\"OpenFoodFacts API nedostupné\"}");
        }
    }

    @GetMapping("/")
    public ResponseEntity<String> getBasicProducts() {
        String url = OPEN_FOOD_FACTS_BASE_URL + "/api/v2/search?" +
                "page_size=5" +
                "&categories_tags=en:snacks" +
                "&fields=code,product_name,image_front_url";
        try {
            return ResponseEntity.ok(fetchOpenFoodFacts(url));
        } catch (Exception e) {
            System.err.println("Chyba při načítání základních produktů: " + e.getMessage());
            return ResponseEntity.status(502).body("{\"error\":\"OpenFoodFacts API nedostupné\"}");
        }
    }

    @GetMapping("/search")
    public ResponseEntity<String> searchProducts(@RequestParam("query") String query) {
        String url = OPEN_FOOD_FACTS_BASE_URL + "/api/v2/search?" +
                "search_terms=" + URLEncoder.encode(query, StandardCharsets.UTF_8) +
                "&page_size=20" +
                "&fields=code,product_name,image_front_url";
        try {
            return ResponseEntity.ok(fetchOpenFoodFacts(url));
        } catch (Exception e) {
            System.err.println("Chyba při vyhledávání produktů: " + e.getMessage());
            return ResponseEntity.status(502).body("{\"error\":\"Vyhledávání produktů není dostupné\"}");
        }
    }

    @GetMapping("/recommended")
    public ResponseEntity<String> getRecommendedProducts(@RequestParam(value = "page", defaultValue = "1") int page) {
        String url = OPEN_FOOD_FACTS_BASE_URL + "/api/v2/search?" +
                "sort_by=unique_scans_n" +
                "&page=" + Math.max(page, 1) +
                "&page_size=10" +
                "&fields=code,product_name,image_front_url,allergens_tags" +
                "&countries_tags=en:czechia";
        try {
            return ResponseEntity.ok(fetchOpenFoodFacts(url));
        } catch (Exception e) {
            System.err.println("Chyba při načítání doporučených produktů: " + e.getMessage());
            return ResponseEntity.status(502).body("{\"error\":\"Doporučené produkty nejsou dostupné\"}");
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<String> getProductDetail(
            @PathVariable String id,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        String url = OPEN_FOOD_FACTS_BASE_URL + "/api/v2/product/" + id +
                "?fields=product_name,image_url,image_front_url,ingredients_text,ingredients_text_cz," +
                "ingredients_text_en,ingredients_text_de,ingredients_text_fr,ingredients_text_pl," +
                "ingredients_text_sk,brands,quantity,nutriscore_grade,nutriments";

        try {
            String result = fetchOpenFoodFacts(url);

            String email = emailFromHeader(authHeader);
            if (email != null && result != null) {
                try {
                    JsonNode root = objectMapper.readTree(result);
                    JsonNode product = root.path("product");

                    if (!product.isMissingNode()) {
                        String productName = product.path("product_name").asText(null);
                        String imageUrl = product.path("image_front_url").asText(
                                product.path("image_url").asText(null)
                        );
                        userService.addToHistory(email, id, productName, imageUrl);
                    }
                } catch (Exception parseEx) {
                    System.err.println("Chyba při ukládání historie: " + parseEx.getMessage());
                }
            }

            return ResponseEntity.ok(result);

        } catch (Exception e) {
            return ResponseEntity.status(502).body("{\"error\":\"Produkt nenalezen\"}");
        }
    }
}
