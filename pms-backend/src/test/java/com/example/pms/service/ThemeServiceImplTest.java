package com.example.pms.service;

import com.example.pms.dto.request.AddThemeDTO;
import com.example.pms.dto.request.AllocationDTO;
import com.example.pms.dto.request.UpdateThemeDTO;
import com.example.pms.exception.ThemeNotFoundException;
import com.example.pms.model.AllocationRule;
import com.example.pms.model.Asset;
import com.example.pms.model.Theme;
import com.example.pms.model.User;
import com.example.pms.model.enums.InvestmentHorizon;
import com.example.pms.model.enums.Risk;
import com.example.pms.repository.ThemeRepository;
import com.example.pms.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ThemeServiceImplTest {

    @Mock
    private ThemeRepository themeRepository;

    @Mock
    private AllocationRuleService allocationRuleService;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private ThemeServiceImpl themeService;

    @Test
    @DisplayName("TC-THEME-001 | Add theme for a valid user")
    void addTheme_shouldCreateThemeSuccessfully(){

        AllocationDTO allocationDTO = new AllocationDTO(1, 60.0);

        AddThemeDTO addThemeDTO = new AddThemeDTO(
                "Balanced Theme",
                Risk.MEDIUM,
                InvestmentHorizon.LONG,
                List.of(allocationDTO),
                1
                );

        User user = new User();

        user.setUserId(1);
        user.setName("ABC");

        Asset asset = new Asset();

        asset.setId(1);
        asset.setAssetClass("Equity");

        AllocationRule allocationRule = new AllocationRule(10, asset, 60.0);

        when(allocationRuleService.addAllocationRule(allocationDTO)).thenReturn(allocationRule);

        when(userRepository.findById(1)).thenReturn(Optional.of(user));

        String result = themeService.addTheme(addThemeDTO);

        assertEquals("Theme Added.", result);

        verify(userRepository).findById(1);

        verify(themeRepository).save(any(Theme.class));

        verify(allocationRuleService).addAllocationRule(allocationDTO);

    }

//    @Test
//    @DisplayName("TC-THEME-002 | Update an existing theme")
//    void updateTheme_shouldUpdateTheme_whenThemeExists(){
//
//        UpdateThemeDTO theme = new UpdateThemeDTO();
//
//        theme.setId(10);
//
//        theme.setName("Updated Theme");
//
//        when(themeRepository.existsById(10)).thenReturn(true);
//
//        String result = themeService.updateTheme(theme);
//
//        assertEquals("Theme Updated", result);
//
//        verify(themeRepository).existsById(10);
//
//        verify(themeRepository).save(any(Theme.class));
//
//    }

//    @Test
//    @DisplayName("TC-THEME-003 | Reject update when theme does not exist")
//    void updateTheme_shouldThrowException_whenThemeDoesNotExist(){
//
//        UpdateThemeDTO theme = new UpdateThemeDTO();
//
//        theme.setId(999);
//
//        when(themeRepository.existsById(999)).thenReturn(false);
//
//        assertThrows(ThemeNotFoundException.class, () -> themeService.updateTheme(theme));
//
//        verify(themeRepository).existsById(999);
//
//        verify(themeRepository, never()).save(any(Theme.class));
//
//    }
//
//    @Test
//    @DisplayName("TC-THEME-004 | Deactivate theme for an existing theme")
//    void deleteTheme_shouldDeactivateTheme_whenThemeExists(){
//
//        Theme theme = new Theme();
//
//        theme.setId(10);
//        theme.setStatus(true);
//
//        when(themeRepository.existsById(10)).thenReturn(true);
//
//        when(themeRepository.findById(10)).thenReturn(Optional.of(theme));
//
//        String result = themeService.deleteTheme(10);
//
//        assertEquals("Theme Updated", result);
//
//        assertFalse(theme.getStatus());
//
//        verify(themeRepository).existsById(10);
//
//        verify(themeRepository).findById(10);
//
//        verify(themeRepository).save(any(Theme.class));
//
//    }
//
//    @Test
//    @DisplayName("TC-THEME-005 | Reject deletion when theme does not exist")
//    void deleteTheme_shouldThrowException_whenThemeDoesNotExist(){
//
//        Theme theme = new Theme();
//
//        theme.setId(999);
//
//        when(themeRepository.existsById(999)).thenReturn(false);
//
//        assertThrows(ThemeNotFoundException.class, () -> themeService.deleteTheme(999));
//
//        verify(themeRepository).existsById(999);
//
//        verify(themeRepository, never()).findById(999);
//
//        verify(themeRepository, never()).save(any(Theme.class));
//
//    }

//    @Test
//    @DisplayName("TC-THEME-006 | Retrieve all themes")
//    void getAllThemes_shouldReturnAllThemes(){
//
//        Theme theme1 = new Theme();
//
//        theme1.setId(1);
//        theme1.setName("Equity Theme");
//
//        Theme theme2 = new Theme();
//
//        theme2.setId(2);
//        theme2.setName("Balanced Theme");
//
//        List<Theme> list = List.of(theme1, theme2);
//
//        when(themeRepository.findAll()).thenReturn(list);
//
//        List<Theme> result = themeService.getAllThemes(1);
//
//        assertEquals(2, result.size());
//
//        assertEquals(list, result);
//
//        verify(themeRepository).findAll();
//    }
//
//    @Test
//    @DisplayName("TC-THEME-007 | Validate allocation when drift is below theshold")
//    void validateTheme_shouldReturnTrue_whenDriftIsBelowThreshold(){
//
//        Asset asset = new Asset();
//
//        asset.setId(1);
//        asset.setAssetClass("Equity");
//
//        AllocationRule allocationRule = new AllocationRule(1, asset, 60.0);
//
//        Theme theme = new Theme();
//
//        theme.setId(10);
//        theme.setAllocationRuleList(List.of(allocationRule));
//
//        when(themeRepository.existsById(10)).thenReturn(true);
//
//        when(themeRepository.findById(10)).thenReturn(Optional.of(theme));
//
//        Map<String, Double> percentageMap = Map.of("Equity", 63.0);
//
//        Boolean result = themeService.validateTheme(10, percentageMap);
//
//        assertTrue(result);
//    }
//
//    @Test
//    @DisplayName("TC-THEME-008 | Reject allocation when drift reaches five percent")
//    void validateTheme_shouldReturnFalse_whenDriftReachesFivePercent(){
//
//        Asset asset = new Asset();
//
//        asset.setId(1);
//        asset.setAssetClass("Equity");
//
//        AllocationRule allocationRule = new AllocationRule(1, asset, 60.0);
//
//        Theme theme = new Theme();
//
//        theme.setId(10);
//        theme.setAllocationRuleList(List.of(allocationRule));
//
//        when(themeRepository.existsById(10)).thenReturn(true);
//
//        when(themeRepository.findById(10)).thenReturn(Optional.of(theme));
//
//        Map<String, Double> percentageMap = Map.of("Equity", 65.0);
//
//        Boolean result = themeService.validateTheme(10, percentageMap);
//
//        assertFalse(result);
//
//    }
//
//    @Test
//    @DisplayName("TC-THEME-009 | Reject validation when theme does not exist")
//    void validateTheme_shouldThrowException_whenThemeDoesNotExist(){
//
//        when(themeRepository.existsById(999)).thenReturn(false);
//
//        assertThrows(ThemeNotFoundException.class, () -> themeService.validateTheme(999, Map.of("Equity", 60.0)));
//
//        verify(themeRepository).existsById(999);
//
//        verify(themeRepository, never()).findById(999);
//
//    }




}
