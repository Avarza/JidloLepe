package org.example.dto;

import java.util.Map;

public class AllergenDTO {

    private Long id;
    private String name;
    private String iconUrl;
    private Map<String, String> translations;

    // Constructors
    public AllergenDTO() {}

    public AllergenDTO(Long id, String name, String iconUrl, Map<String, String> translations) {
        this.id = id;
        this.name = name;
        this.iconUrl = iconUrl;
        this.translations = translations;
    }

    // Getters & Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getIconUrl() {
        return iconUrl;
    }

    public void setIconUrl(String iconUrl) {
        this.iconUrl = iconUrl;
    }

    public Map<String, String> getTranslations() {
        return translations;
    }

    public void setTranslations(Map<String, String> translations) {
        this.translations = translations;
    }
}
