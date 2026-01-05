package org.example.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

@RestController
@CrossOrigin(origins = "*")

@RequestMapping("/api/products")
public class ProductProxyController {

    private final RestTemplate restTemplate = new RestTemplate();

    @GetMapping("/snacks")
    public ResponseEntity<String> getSnackProducts() {
        String url = "https://world.openfoodfacts.org/cgi/search.pl?" +
                "action=process&tagtype_0=categories&tag_contains_0=contains" +
                "&tag_0=snacks&page_size=5&json=true";

        try {
            String result = restTemplate.getForObject(url, String.class);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(502).body("{\"error\":\"OpenFoodFacts API nedostupné\"}");
        }
    }
    @GetMapping("/")
    public ResponseEntity<String> getBasicProducts() {
        String url = "https://world.openfoodfacts.org/cgi/search.pl?" +
                "action=process&tagtype_0=categories&tag_contains_0=contains" +
                "&tag_0=snacks&page_size=5&json=true&fields=code,product_name,image_front_url";

        try {
            String result = restTemplate.getForObject(url, String.class);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(502).body("{\"error\":\"OpenFoodFacts API nedostupné\"}");
        }
    }
    @GetMapping("/{id}")
    public ResponseEntity<String> getProductDetail(@PathVariable String id) {
        String url = "https://world.openfoodfacts.org/api/v0/product/" + id + ".json";

        try {
            String result = restTemplate.getForObject(url, String.class);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(502).body("{\"error\":\"Produkt nenalezen\"}");
        }
    }


}
