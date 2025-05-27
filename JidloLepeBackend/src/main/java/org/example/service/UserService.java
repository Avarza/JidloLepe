package org.example.service;

import org.example.dto.UserDTO;
import org.example.entity.Allergen;
import org.example.entity.User;
import org.example.repository.AllergenRepository;
import org.example.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final AllergenRepository allergenRepository;

    @Autowired
    public UserService(UserRepository userRepository, AllergenRepository allergenRepository) {
        this.userRepository = userRepository;
        this.allergenRepository = allergenRepository;
    }
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

}
