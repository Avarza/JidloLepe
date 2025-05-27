package org.example.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.util.Map;

@Schema(description = "DTO objekt představující alergen s překlady a ikonou")
public class AllergenDTO {

    @Schema(description = "Jedinečný identifikátor alergenu", example = "1")
    private Long id;

    @Schema(description = "Název alergenu v hlavním jazyce", example = "Lepek")
    private String name;

    @Schema(description = "URL ikony reprezentující alergen", example = "https://example.com/icons/lepek.png")
    private String iconUrl;

    @Schema(description = "Mapování překladů pro různé jazyky", example = "{\"en\": \"Gluten\", \"de\": \"Gluten\", \"cz\": \"Lepek\"}")
    private Map<String, String> translations;

    public AllergenDTO() {}

    public AllergenDTO(Long id, String name, String iconUrl, Map<String, String> translations) {
        this.id = id;
        this.name = name;
        this.iconUrl = iconUrl;
        this.translations = translations;
    }

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
