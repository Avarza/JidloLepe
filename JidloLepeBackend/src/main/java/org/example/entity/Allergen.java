package org.example.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.Map;

@Getter
@Setter
@Entity
@Table(name = "allergens")
public class Allergen {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name; // název v hlavním jazyce (např. "Lepek")

    private String iconUrl; // URL na ikonu alergenu

    @ElementCollection
    @CollectionTable(name = "allergen_translations", joinColumns = @JoinColumn(name = "allergen_id"))
    @MapKeyColumn(name = "language") // např. "en", "cz"
    @Column(name = "translation")
    private Map<String, String> translations; // např. {"en": "Gluten", "cz": "Lepek"}
}
