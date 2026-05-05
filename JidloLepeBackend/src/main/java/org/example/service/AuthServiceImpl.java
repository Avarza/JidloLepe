package org.example.service;

import org.example.dto.LoginDTO;
import org.example.dto.RegisterDTO;
import org.example.entity.User;
import org.example.repository.UserRepository;
import org.example.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service("authServiceImpl")
public class AuthServiceImpl implements AuthService {

    private final UserService userService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    @Autowired
    public AuthServiceImpl(UserService userService,
                           UserRepository userRepository,
                           PasswordEncoder passwordEncoder,
                           JwtUtil jwtUtil) {
        this.userService = userService;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    // ── Login ─────────────────────────────────────────────────────────────────
    @Override
    public String login(LoginDTO loginDTO) {
        System.out.println("📥 Login attempt: " + loginDTO.getEmail());

        User user = userService.getUserEntityByEmail(loginDTO.getEmail());
        if (user == null) {
            throw new RuntimeException("Uživatel neexistuje: " + loginDTO.getEmail());
        }

        System.out.println("Zadané heslo: " + loginDTO.getPassword());
        System.out.println("Heslo v DB (hash): " + user.getPassword());

        boolean matches = passwordEncoder.matches(loginDTO.getPassword(), user.getPassword());
        System.out.println("Hesla sedí? " + matches);

        if (!matches) {
            throw new RuntimeException("Neplatné přihlašovací údaje (heslo nesedí)");
        }

        String token = jwtUtil.generateToken(user.getEmail());
        System.out.println("✅ Vygenerovaný token: " + token);
        return token;
    }

    // ── Register ──────────────────────────────────────────────────────────────
    @Override
    public String register(RegisterDTO registerDTO) {
        System.out.println("📥 Register attempt: " + registerDTO.getEmail());

        // Validate input
        if (registerDTO.getEmail() == null || registerDTO.getEmail().isBlank()) {
            throw new IllegalArgumentException("Email nesmí být prázdný");
        }
        if (registerDTO.getPassword() == null || registerDTO.getPassword().length() < 6) {
            throw new IllegalArgumentException("Heslo musí mít alespoň 6 znaků");
        }

        // Check if email already taken
        if (userRepository.findByEmail(registerDTO.getEmail()).isPresent()) {
            throw new IllegalArgumentException("Účet s tímto emailem již existuje");
        }

        // Create and save new user
        User user = new User();
        user.setEmail(registerDTO.getEmail());
        user.setPassword(passwordEncoder.encode(registerDTO.getPassword()));
        userRepository.save(user);

        System.out.println("✅ Uživatel zaregistrován: " + user.getEmail());

        // Return token so the app logs in immediately after register
        return jwtUtil.generateToken(user.getEmail());
    }
}