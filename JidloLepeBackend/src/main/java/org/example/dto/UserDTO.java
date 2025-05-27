package org.example.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.util.Set;

@Schema(description = "DTO objekt pro uživatele s přiřazenými alergeny")
public class UserDTO {

    @Schema(description = "Email uživatele", example = "jan.kral@email.cz")
    private String email;

    @Schema(
            description = "ID alergenů, které má uživatel vybrané",
            example = "[1, 2, 5]"
    )
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
