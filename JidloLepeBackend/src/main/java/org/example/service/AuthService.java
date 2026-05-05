package org.example.service;

import org.example.dto.LoginDTO;
import org.example.dto.RegisterDTO;

public interface AuthService {
    String login(LoginDTO loginDTO);
    String register(RegisterDTO registerDTO);
}