package com.example.pms.service;

import com.example.pms.dto.request.AddThemeDTO;
import com.example.pms.dto.request.UpdateThemeDTO;
import com.example.pms.model.Theme;

import java.util.List;
import java.util.Map;

public interface ThemeService {

    public String addTheme(AddThemeDTO addThemeDTO);

    public String updateTheme(UpdateThemeDTO theme);

    public String deleteTheme(Integer id);

    public List<Theme> getAllThemes(Integer userId);

    public Boolean validateTheme(Integer id, Map<String,Double> percentageMap);

}
