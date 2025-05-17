package org.example.dto;

import java.util.Set;

public class UserDTO {
    private String email;
    private Set<Long> allergenIds;

    public UserDTO() {}

    public UserDTO(String email, Set<Long> allergenIds) {
        this.email = email;
        this.allergenIds = allergenIds;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public Set<Long> getAllergenIds() {
        return allergenIds;
    }

    public void setAllergenIds(Set<Long> allergenIds) {
        this.allergenIds = allergenIds;
    }
}
