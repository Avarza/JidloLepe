package org.example.service;

import org.example.dto.AllergenDTO;
import org.example.entity.Allergen;
import org.example.repository.AllergenRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class AllergenService {

    @Autowired
    private AllergenRepository allergenRepository;

    public List<AllergenDTO> getAllAllergens() {
        return allergenRepository.findAll().stream().map(allergen -> {
            AllergenDTO dto = new AllergenDTO();
            dto.setId(allergen.getId());
            dto.setName(allergen.getName());
            dto.setIconUrl(allergen.getIconUrl());
            dto.setTranslations(allergen.getTranslations());
            return dto;
        }).collect(Collectors.toList());
    }
}
