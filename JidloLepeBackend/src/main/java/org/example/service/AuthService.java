package org.example.service;

import org.example.dto.LoginDTO;

public interface AuthService {
    String login(LoginDTO loginDTO);
}
