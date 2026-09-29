package com.example.pms.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig implements WebMvcConfigurer {

    public void addCorsMappings(CorsRegistry corsRegistry){
        corsRegistry
                .addMapping("/**")
                .allowedOrigins("http://localhost:5173")
                .allowedMethods(
                        "GET",
                        "POST",
                        "DELETE",
                        "PATCH",
                        "PUT",
                        "OPTIONS"
                )
                .allowedHeaders("*");
    }

}
