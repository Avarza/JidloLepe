package org.example.service;

import org.example.dto.ChangePasswordDTO;
import org.example.dto.ScanHistoryDTO;
import org.example.dto.UserDTO;
import org.example.entity.Allergen;
import org.example.entity.ScanHistory;
import org.example.entity.User;
import org.example.repository.AllergenRepository;
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
    private final PasswordEncoder passwordEncoder;

    @Value("${app.upload.dir:uploads/avatars}")
    private String uploadDir;

    @Autowired
    public UserService(UserRepository userRepository,
                       AllergenRepository allergenRepository,
                       ScanHistoryRepository scanHistoryRepository,
                       PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.allergenRepository = allergenRepository;
        this.scanHistoryRepository = scanHistoryRepository;
        this.passwordEncoder = passwordEncoder;
    }

    // ── Existing methods ──────────────────────────────────────────────────────

    public User getUserEntityByEmail(String email) {
        return userRepository.findByEmail(email).orElse(null);
    }

    public UserDTO updateUserAllergens(UserDTO dto) {
        User user = userRepository.findByEmail(dto.getEmail())
                .orElseThrow(() -> new RuntimeException("Uživatel nenalezen"));
        Set<Allergen> allergens = new HashSet<>(allergenRepository.findAllById(dto.getAllergenIds()));
        user.setAllergens(allergens);
        userRepository.save(user);
        return new UserDTO(user.getEmail(), dto.getAllergenIds());
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
}