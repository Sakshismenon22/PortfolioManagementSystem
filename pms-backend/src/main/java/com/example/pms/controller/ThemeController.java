package com.example.pms.controller;


import com.example.pms.dto.request.AddThemeDTO;
import com.example.pms.dto.request.UpdateThemeDTO;
import com.example.pms.model.Theme;
import com.example.pms.response.Response;
import com.example.pms.service.ThemeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/themes")
@RequiredArgsConstructor
public class ThemeController {

    final private ThemeService themeService;

    @PostMapping("/add-theme")
    public Response<String> addTheme(@RequestBody AddThemeDTO addThemeDTO){
        return new Response<>(HttpStatus.OK.value(), true, null, themeService.addTheme(addThemeDTO), LocalDateTime.now() );
    }

    @PutMapping("/update-theme")
    public Response<String> updateTheme(@RequestBody UpdateThemeDTO theme){
        return new Response<>(HttpStatus.OK.value(), true, null, themeService.updateTheme(theme), LocalDateTime.now() );

    }

    @DeleteMapping("/delete-theme/{id}")
    public Response<String> deleteTheme(@PathVariable Integer id){
        return new Response<>(HttpStatus.OK.value(), true, null, themeService.deleteTheme(id), LocalDateTime.now() );

    }

    @GetMapping("/get-all-themes")
    public Response<List<Theme>> getAllThemes(@RequestParam Integer userId){
        return new Response<>(HttpStatus.OK.value(), true, themeService.getAllThemes(userId), "Themes retrieved", LocalDateTime.now());
    }
}
