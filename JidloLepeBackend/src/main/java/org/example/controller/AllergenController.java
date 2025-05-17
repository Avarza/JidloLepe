package org.example.controller;

import org.example.dto.AllergenDTO;
import org.example.service.AllergenService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/allergens")
@CrossOrigin(origins = "*") // umožní přístup z frontendové aplikace
public class AllergenController {

    @Autowired
    private AllergenService allergenService;

    @GetMapping
    public List<AllergenDTO> getAllAllergens() {
        return allergenService.getAllAllergens();
    }
}
