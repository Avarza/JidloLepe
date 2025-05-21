package org.example.swagger;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SwaggerConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Jídlo lépe - API dokumentace")
                        .version("1.0.0")
                        .description("Dokumentace REST API pro autentizaci, správu uživatelů a alergenů"));
    }
}
