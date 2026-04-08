package org.example.service;

import org.example.dto.ChangePasswordDTO;
import org.example.dto.FavoriteProductDTO;
import org.example.dto.ProductNoteDTO;
import org.example.dto.ScanHistoryDTO;
import org.example.dto.UserDTO;
import org.example.entity.Allergen;
import org.example.entity.DietPreference;
import org.example.entity.FavoriteProduct;
import org.example.entity.ProductNote;
import org.example.entity.ScanHistory;
import org.example.entity.User;
import org.example.repository.AllergenRepository;
import org.example.repository.DietPreferenceRepository;
import org.example.repository.FavoriteProductRepository;
import org.example.repository.ProductNoteRepository;
import org.example.repository.ScanHistoryRepository;
import org.example.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final AllergenRepository allergenRepository;
    private final ScanHistoryRepository scanHistoryRepository;
    private final FavoriteProductRepository favoriteProductRepository;
    private final ProductNoteRepository productNoteRepository;
    private final DietPreferenceRepository dietPreferenceRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.upload.dir:uploads/avatars}")
    private String uploadDir;

    @Autowired
    public UserService(UserRepository userRepository,
                       AllergenRepository allergenRepository,
                       ScanHistoryRepository scanHistoryRepository,
                       FavoriteProductRepository favoriteProductRepository,
                       ProductNoteRepository productNoteRepository,
                       DietPreferenceRepository dietPreferenceRepository,
                       PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.allergenRepository = allergenRepository;
        this.scanHistoryRepository = scanHistoryRepository;
        this.favoriteProductRepository = favoriteProductRepository;
        this.productNoteRepository = productNoteRepository;
        this.dietPreferenceRepository = dietPreferenceRepository;
        this.passwordEncoder = passwordEncoder;
    }

    // ── Existing methods ──────────────────────────────────────────────────────

    public User getUserEntityByEmail(String email) {
        return userRepository.findByEmail(email).orElse(null);
    }

    public UserDTO updateUserAllergens(UserDTO dto) {
        User user = userRepository.findByEmail(dto.getEmail())
                .orElseThrow(() -> new RuntimeException("Uživatel nenalezen"));
        Set<Long> allergenIds = dto.getAllergenIds() == null ? Set.of() : dto.getAllergenIds();
        Set<Allergen> allergens = new HashSet<>(allergenRepository.findAllById(allergenIds));
        user.setAllergens(allergens);
        userRepository.save(user);
        return new UserDTO(user.getEmail(), allergenIds);
    }

    public Set<String> getUserAllergenNamesByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Uživatel nenalezen"));
        return user.getAllergens().stream()
                .map(Allergen::getName)
                .collect(Collectors.toSet());
    }

    // ── Change password ───────────────────────────────────────────────────────

    public void changePassword(String email, ChangePasswordDTO dto) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Uživatel nenalezen"));

        if (!passwordEncoder.matches(dto.getOldPassword(), user.getPassword())) {
            throw new RuntimeException("Současné heslo není správné");
        }
        if (dto.getNewPassword() == null || dto.getNewPassword().length() < 6) {
            throw new RuntimeException("Nové heslo musí mít alespoň 6 znaků");
        }

        user.setPassword(passwordEncoder.encode(dto.getNewPassword()));
        userRepository.save(user);
    }

    // ── Scan history ──────────────────────────────────────────────────────────

    /**
     * Add a product to the user's scan history.
     * Call this from your product lookup endpoint whenever a user scans a barcode.
     */
    public void addToHistory(String email, String productCode, String productName, String imageUrl) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Uživatel nenalezen"));

        ScanHistory entry = new ScanHistory();
        entry.setUser(user);
        entry.setProductCode(productCode);
        entry.setProductName(productName);
        entry.setImageUrl(imageUrl);
        scanHistoryRepository.save(entry);
    }

    /**
     * Get the last 20 scanned products for a user.
     */
    public List<ScanHistoryDTO> getHistory(String email) {
        return scanHistoryRepository
                .findTop20ByUserEmailOrderByScannedAtDesc(email)
                .stream()
                .map(h -> new ScanHistoryDTO(
                        h.getProductCode(),
                        h.getProductName(),
                        h.getImageUrl(),
                        h.getScannedAt()
                ))
                .collect(Collectors.toList());
    }

    // ── Avatar upload ─────────────────────────────────────────────────────────

    /**
     * Save an uploaded avatar image to disk and store the path on the user.
     * Returns the relative URL to serve back to the client.
     */
    public String uploadAvatar(String email, MultipartFile file) throws IOException {
        if (file.isEmpty()) throw new RuntimeException("Soubor je prázdný");

        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new RuntimeException("Povoleny jsou pouze obrázky");
        }

        // Ensure upload directory exists
        Path uploadPath = Paths.get(uploadDir);
        Files.createDirectories(uploadPath);

        // Give file a unique name to avoid collisions
        String extension = contentType.contains("png") ? ".png" : ".jpg";
        String filename = email.replaceAll("[^a-zA-Z0-9]", "_") + "_" + System.currentTimeMillis() + extension;
        Path filePath = uploadPath.resolve(filename);
        Files.write(filePath, file.getBytes());

        // Store path on user entity
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Uživatel nenalezen"));
        user.setAvatarPath(filename);
        userRepository.save(user);

        return "/avatars/" + filename;
    }

    // Favorites
    public List<FavoriteProductDTO> getFavorites(String email) {
        return favoriteProductRepository.findByUserEmailOrderByCreatedAtDesc(email)
                .stream()
                .map(f -> new FavoriteProductDTO(
                        f.getProductCode(),
                        f.getProductName(),
                        f.getImageUrl(),
                        f.getCreatedAt()
                ))
                .collect(Collectors.toList());
    }

    public void addFavorite(String email, String productCode, String productName, String imageUrl) {
        if (productCode == null || productCode.isBlank()) {
            throw new RuntimeException("Kód produktu je povinný");
        }

        boolean exists = favoriteProductRepository
                .findByUserEmailAndProductCode(email, productCode)
                .isPresent();
        if (exists) return;

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Uživatel nenalezen"));

        FavoriteProduct favorite = new FavoriteProduct();
        favorite.setUser(user);
        favorite.setProductCode(productCode);
        favorite.setProductName(productName);
        favorite.setImageUrl(imageUrl);
        favoriteProductRepository.save(favorite);
    }

    public void removeFavorite(String email, String productCode) {
        favoriteProductRepository.deleteByUserEmailAndProductCode(email, productCode);
    }

    public boolean isFavorite(String email, String productCode) {
        return favoriteProductRepository.findByUserEmailAndProductCode(email, productCode).isPresent();
    }

    // Product notes
    public ProductNoteDTO getProductNote(String email, String productCode) {
        ProductNote note = productNoteRepository.findByUserEmailAndProductCode(email, productCode).orElse(null);
        if (note == null) {
            return new ProductNoteDTO(productCode, "", null);
        }
        return new ProductNoteDTO(note.getProductCode(), note.getNote(), note.getUpdatedAt());
    }

    public ProductNoteDTO saveProductNote(String email, String productCode, String noteText) {
        if (productCode == null || productCode.isBlank()) {
            throw new RuntimeException("Kód produktu je povinný");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Uživatel nenalezen"));

        String sanitized = noteText == null ? "" : noteText.trim();
        if (sanitized.length() > 800) {
            throw new RuntimeException("Poznámka může mít maximálně 800 znaků");
        }

        ProductNote note = productNoteRepository.findByUserEmailAndProductCode(email, productCode)
                .orElseGet(ProductNote::new);
        note.setUser(user);
        note.setProductCode(productCode);
        note.setNote(sanitized);
        note.setUpdatedAt(java.time.LocalDateTime.now());

        ProductNote saved = productNoteRepository.save(note);
        return new ProductNoteDTO(saved.getProductCode(), saved.getNote(), saved.getUpdatedAt());
    }

    // Diet preferences
    public List<String> getDietPreferences(String email) {
        return dietPreferenceRepository.findByUserEmailOrderByCreatedAtDesc(email)
                .stream()
                .map(DietPreference::getPreferenceCode)
                .collect(Collectors.toList());
    }

    public List<String> updateDietPreferences(String email, List<String> preferences) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Uživatel nenalezen"));

        List<String> sanitized = preferences == null
                ? List.of()
                : preferences.stream()
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .distinct()
                .collect(Collectors.toList());

        dietPreferenceRepository.deleteByUserEmail(email);

        List<DietPreference> rows = new ArrayList<>();
        for (String preference : sanitized) {
            DietPreference row = new DietPreference();
            row.setUser(user);
            row.setPreferenceCode(preference);
            rows.add(row);
        }
        dietPreferenceRepository.saveAll(rows);
        return sanitized;
    }
}

