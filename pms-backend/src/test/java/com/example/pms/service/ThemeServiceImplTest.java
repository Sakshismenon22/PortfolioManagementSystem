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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import javax.swing.text.html.Option;
import java.util.ArrayList;
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

    private User user;
    private Asset asset;
    private AllocationRule allocationRule;

    @BeforeEach
    void setUp(){

        user = new User();

        user.setUserId(1);

        asset = new Asset();
        asset.setId(2);
        asset.setAssetClass("Equity");

        allocationRule = new AllocationRule(20, asset, 70.0);

    }

    @Test
    @DisplayName("TC-THEME-001 | Add theme for a valid user")
    void addTheme_shouldCreateThemeSuccessfully(){

       AddThemeDTO addThemeDTO = new AddThemeDTO();

       addThemeDTO.setUserId(1);
       addThemeDTO.setName("Aggressive Growth");
       addThemeDTO.setRisk(Risk.HIGH);
       addThemeDTO.setInvestmentHorizon(InvestmentHorizon.MEDIUM);

       AllocationDTO allocationDTO =new AllocationDTO(2, 70.0);

       addThemeDTO.setAllocationRuleList(List.of(allocationDTO));

       when(userRepository.findById(1)).thenReturn(Optional.of(user));
       when(allocationRuleService.addAllocationRule(allocationDTO)).thenReturn(allocationRule);

       String result = themeService.addTheme(addThemeDTO);

       assertEquals("Theme Added.", result);

       verify(userRepository).findById(1);
       verify(allocationRuleService).addAllocationRule(allocationDTO);
       verify(themeRepository).save(any(Theme.class));

    }

    @Test
    @DisplayName("TC-THEME-002 | Reject creation of theme when a user does not exist")
    void addTheme_shouldThrowException_whenUserDoesNotExist(){
        AddThemeDTO addThemeDTO = new AddThemeDTO();

        addThemeDTO.setUserId(999);
        addThemeDTO.setName("Aggressive Growth");
        addThemeDTO.setRisk(Risk.HIGH);
        addThemeDTO.setInvestmentHorizon(InvestmentHorizon.MEDIUM);

        addThemeDTO.setAllocationRuleList(new ArrayList<>());

        when(userRepository.findById(999)).thenReturn(Optional.empty());

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> themeService.addTheme(addThemeDTO));

        assertEquals("User not found.", exception.getMessage());

        verify(themeRepository, never()).save(any());
        verify(allocationRuleService, never()).addAllocationRule(any());

    }

    @Test
    @DisplayName("TC-THEME-003 | Update an existing theme")
    void updateTheme_shouldUpdateTheme_whenThemeExists(){

        UpdateThemeDTO request = new UpdateThemeDTO();

        request.setId(10);
        request.setUserId(1);
        request.setName("Updated Theme");
        request.setRisk(Risk.HIGH);
        request.setInvestmentHorizon(InvestmentHorizon.MEDIUM);

        AllocationDTO allocationDTO = new AllocationDTO(2, 70.0);

        request.setAllocationRuleList(List.of(allocationDTO));

        Theme theme =  new Theme();

        theme.setId(10);
        theme.setName("Old Theme");
        theme.setCreatedBy(user);
        theme.setAllocationRuleList(new ArrayList<>());

        when(themeRepository.findByIdAndCreatedBy_UserId(10, 1)).thenReturn(Optional.of(theme));
        when(allocationRuleService.addAllocationRule(allocationDTO)).thenReturn(allocationRule);

        String result = themeService.updateTheme(request);

        assertEquals("Theme Updated", result);
        assertEquals("Updated Theme", theme.getName());
        assertEquals(Risk.HIGH, theme.getRisk());
        assertEquals(InvestmentHorizon.MEDIUM, theme.getInvestmentHorizon());
        assertEquals(1, theme.getAllocationRuleList().size());
        assertEquals(allocationRule, theme.getAllocationRuleList().get(0));

        verify(themeRepository).findByIdAndCreatedBy_UserId(10,1);
        verify(allocationRuleService).addAllocationRule(allocationDTO);
        verify(themeRepository).save(theme);

    }

    @Test
    @DisplayName("TC-THEME-004 | Reject update of an existing theme that does not belong to the user")
    void updateTheme_shouldThrowException_whenThemeDoesNotBelongToUser(){

        UpdateThemeDTO request = new UpdateThemeDTO();

        request.setId(999);
        request.setUserId(1);

        request.setAllocationRuleList(new ArrayList<>());

        when(themeRepository.findByIdAndCreatedBy_UserId(999, 1)).thenReturn(Optional.empty());

        assertThrows(ThemeNotFoundException.class, () -> themeService.updateTheme(request));

        verify(allocationRuleService, never()).addAllocationRule(any());
        verify(themeRepository, never()).save(any());

    }

    @Test
    @DisplayName("TC-THEME-005 | Deactivate theme for an existing theme")
    void deleteTheme_shouldDeactivateTheme_whenThemeExists(){

        Theme theme = new Theme();

        theme.setId(10);
        theme.setStatus(true);

        when(themeRepository.existsById(10)).thenReturn(true);
        when(themeRepository.findById(10)).thenReturn(Optional.of(theme));

        String result = themeService.deleteTheme(10);

        assertEquals("Theme Updated", result);
        assertFalse(theme.getStatus());

        verify(themeRepository).existsById(10);
        verify(themeRepository).findById(10);
        verify(themeRepository).save(any(Theme.class));

    }

    @Test
    @DisplayName("TC-THEME-006 | Reject deletion when theme does not exist")
    void deleteTheme_shouldThrowException_whenThemeDoesNotExist(){

        Theme theme = new Theme();

        theme.setId(999);

        when(themeRepository.existsById(999)).thenReturn(false);

        assertThrows(ThemeNotFoundException.class, () -> themeService.deleteTheme(999));

        verify(themeRepository).existsById(999);
        verify(themeRepository, never()).findById(999);
        verify(themeRepository, never()).save(any(Theme.class));

    }

    @Test
    @DisplayName("TC-THEME-007 | Retrieve all themes")
    void getAllThemes_shouldReturnAllThemes(){


        Theme theme = new Theme();

        when(userRepository.existsById(1)).thenReturn(true);
        when(themeRepository.findByCreatedBy_UserIdAndStatusTrue(1)).thenReturn(List.of(theme));

        List<Theme> result = themeService.getAllThemes(1);

        assertEquals(1, result.size());

        verify(userRepository).existsById(1);
        verify(themeRepository).findByCreatedBy_UserIdAndStatusTrue(1);
    }

    @Test
    @DisplayName("TC-THEME-008 | Reject retrieval of all themes when user is null")
    void getAllThemes_shouldThrowException_whenUserIdIsNull(){

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, ()-> themeService.getAllThemes(null));

        assertEquals("A valid userId is required.", exception.getMessage());

        verify(themeRepository, never()).findByCreatedBy_UserIdAndStatusTrue(any());

    }

    @Test
    @DisplayName("TC-THEME-009 | Validate allocation when drift is below theshold")
    void validateTheme_shouldReturnTrue_whenDriftIsBelowThreshold(){

        AllocationRule rule = new AllocationRule(120, asset, 70.0);

        Theme theme = new Theme();

        theme.setId(10);
        theme.setAllocationRuleList(List.of(allocationRule));

        when(themeRepository.existsById(10)).thenReturn(true);
        when(themeRepository.findById(10)).thenReturn(Optional.of(theme));

        Map<String, Double> percentageMap = Map.of("Equity", 73.0);

        Boolean result = themeService.validateTheme(10, percentageMap);

        assertTrue(result);
    }

    @Test
    @DisplayName("TC-THEME-010 | Reject allocation when drift reaches five percent")
    void validateTheme_shouldReturnFalse_whenDriftReachesFivePercent(){

        AllocationRule allocationRule = new AllocationRule(20, asset, 70.0);

        Theme theme = new Theme();

        theme.setId(10);
        theme.setAllocationRuleList(List.of(allocationRule));

        when(themeRepository.existsById(10)).thenReturn(true);

        when(themeRepository.findById(10)).thenReturn(Optional.of(theme));

        Map<String, Double> percentageMap = Map.of("Equity", 75.0);

        Boolean result = themeService.validateTheme(10, percentageMap);

        assertFalse(result);

    }

    @Test
    @DisplayName("TC-THEME-011 | Reject validation when theme does not exist")
    void validateTheme_shouldThrowException_whenThemeDoesNotExist(){

        when(themeRepository.existsById(999)).thenReturn(false);

        assertThrows(ThemeNotFoundException.class, () -> themeService.validateTheme(999, Map.of("Equity", 60.0)));

        verify(themeRepository).existsById(999);

        verify(themeRepository, never()).findById(999);

    }




}
