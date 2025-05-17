package org.example.dto;

import lombok.Data;

import java.util.List;

@Data
public class UpdateUserAllergensDto {
    private List<Long> allergenIds;  // frontend pošle ID vybraných alergenů
}
