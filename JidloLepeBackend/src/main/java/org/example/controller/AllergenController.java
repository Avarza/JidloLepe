package org.example.controller;

import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import org.example.dto.AllergenDTO;
import org.example.service.AllergenService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@SecurityRequirement(name = "bearerAuth") // JWT vyžadován
@RestController
@RequestMapping("/api/allergens")
public class AllergenController {

    @Autowired
    private AllergenService allergenService;


    @GetMapping
    public List<AllergenDTO> getAllAllergens() {
        return allergenService.getAllAllergens();
    }
}
