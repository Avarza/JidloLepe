package org.example.service;

import org.example.dto.LoginDTO;
import org.example.entity.User;
import org.example.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service("authServiceImpl")
public class AuthServiceImpl implements AuthService {

    private final UserService userService;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    @Autowired
    public AuthServiceImpl(UserService userService,
                           PasswordEncoder passwordEncoder,
                           JwtUtil jwtUtil) {
        this.userService = userService;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

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
}
