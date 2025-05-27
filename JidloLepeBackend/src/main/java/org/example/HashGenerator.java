package org.example;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

public class HashGenerator {
    public static void main(String[] args) {
        PasswordEncoder encoder = new BCryptPasswordEncoder();
        String rawPassword = "admin123"; // to co zadáš do loginu
        String encodedPassword = encoder.encode(rawPassword);
        System.out.println("BCrypt: " + encodedPassword);
    }
}
