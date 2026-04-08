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
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/products")
public class ProductProxyController {

    private static final String OPEN_FOOD_FACTS_BASE_URL = "https://world.openfoodfacts.org";
    private static final String USER_AGENT = "JidloLepe/1.0 (contact: support@jidlolepe.local)";
    private static final String EMPTY_PRODUCTS_JSON = "{\"count\":0,\"page\":1,\"page_size\":10,\"products\":[]}";

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();
    private volatile String recommendedCacheJson = EMPTY_PRODUCTS_JSON;

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

    private boolean isLikelyJson(String body) {
        if (body == null) return false;
        String trimmed = body.trim();
        return trimmed.startsWith("{") || trimmed.startsWith("[");
    }

    private String fetchFirstJson(List<String> urls) {
        Exception lastException = null;
        for (String url : urls) {
            try {
                String body = fetchOpenFoodFacts(url);
                if (isLikelyJson(body)) {
                    return body;
                }
            } catch (Exception e) {
                lastException = e;
            }
        }
        if (lastException != null) {
            throw new RuntimeException(lastException);
        }
        throw new RuntimeException("No valid JSON response from OpenFoodFacts");
    }

    @GetMapping("/snacks")
    public ResponseEntity<String> getSnackProducts() {
        String url = OPEN_FOOD_FACTS_BASE_URL + "/cgi/search.pl?" +
                "action=process&tagtype_0=categories&tag_contains_0=contains" +
                "&tag_0=snacks&page_size=5&json=true";
        try {
            return ResponseEntity.ok(fetchOpenFoodFacts(url));
        } catch (Exception e) {
            return ResponseEntity.ok(EMPTY_PRODUCTS_JSON);
        }
    }

    @GetMapping("/")
    public ResponseEntity<String> getBasicProducts() {
        String url = OPEN_FOOD_FACTS_BASE_URL + "/api/v2/search?" +
                "page_size=5" +
                "&categories_tags=en:snacks" +
                "&fields=code,product_name,image_front_url";
        try {
            String body = fetchOpenFoodFacts(url);
            if (isLikelyJson(body)) {
                return ResponseEntity.ok(body);
            }
            return ResponseEntity.ok(EMPTY_PRODUCTS_JSON);
        } catch (Exception e) {
            return ResponseEntity.ok(EMPTY_PRODUCTS_JSON);
        }
    }

    @GetMapping("/search")
    public ResponseEntity<String> searchProducts(@RequestParam("query") String query) {
        String encodedQuery = URLEncoder.encode(query, StandardCharsets.UTF_8);
        String urlV2 = OPEN_FOOD_FACTS_BASE_URL + "/api/v2/search?" +
                "search_terms=" + encodedQuery +
                "&page_size=20" +
                "&fields=code,product_name,image_front_url";
        String urlCgi = OPEN_FOOD_FACTS_BASE_URL + "/cgi/search.pl?" +
                "search_terms=" + encodedQuery +
                "&search_simple=1&action=process&json=1&page_size=20" +
                "&fields=code,product_name,image_front_url";

        try {
            String body = fetchFirstJson(List.of(urlV2, urlCgi));
            return ResponseEntity.ok(body);
        } catch (Exception e) {
            return ResponseEntity.ok(EMPTY_PRODUCTS_JSON);
        }
    }

    @GetMapping("/recommended")
    public ResponseEntity<String> getRecommendedProducts(@RequestParam(value = "page", defaultValue = "1") int page) {
        int safePage = Math.max(page, 1);
        List<String> urls = new ArrayList<>();

        for (int i = 0; i < 6; i++) {
            int candidate = ((safePage + i - 1) % 50) + 1;
            urls.add(OPEN_FOOD_FACTS_BASE_URL + "/api/v2/search?" +
                    "sort_by=unique_scans_n" +
                    "&page=" + candidate +
                    "&page_size=10" +
                    "&fields=code,product_name,image_front_url,allergens_tags" +
                    "&countries_tags=en:czechia");
        }

        for (int i = 0; i < 4; i++) {
            int randomPage = ThreadLocalRandom.current().nextInt(1, 51);
            urls.add(OPEN_FOOD_FACTS_BASE_URL + "/api/v2/search?" +
                    "sort_by=unique_scans_n" +
                    "&page=" + randomPage +
                    "&page_size=10" +
                    "&fields=code,product_name,image_front_url,allergens_tags" +
                    "&countries_tags=en:czechia");
        }

        try {
            String body = fetchFirstJson(urls);
            recommendedCacheJson = body;
            return ResponseEntity.ok(body);
        } catch (Exception e) {
            return ResponseEntity.ok(recommendedCacheJson);
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
                    System.err.println("History save failed: " + parseEx.getMessage());
                }
            }

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(502).body("{\"error\":\"Product not found\"}");
        }
    }
}
