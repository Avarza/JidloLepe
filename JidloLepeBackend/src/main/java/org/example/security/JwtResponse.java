package org.example.security;

public class JwtResponse {
    public String getToken() {
        return token;
    }

    private String token;

    public JwtResponse(String token) {
        this.token = token;
    }

}
