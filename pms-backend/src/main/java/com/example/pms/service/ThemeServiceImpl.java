package com.example.pms.service;

import com.example.pms.dto.request.AddThemeDTO;
import com.example.pms.dto.request.AllocationDTO;
import com.example.pms.exception.ThemeNotFoundException;
import com.example.pms.model.AllocationRule;
import com.example.pms.model.Theme;
import com.example.pms.repository.ThemeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ThemeServiceImpl implements ThemeService{

    private final ThemeRepository themeRepository;
    private final AllocationRuleService allocationRuleService;

    @Override
    public String addTheme(AddThemeDTO addThemeDTO) {
        List<AllocationRule> allocationRuleList = new ArrayList<>();
        for(AllocationDTO allocationRule:addThemeDTO.getAllocationRuleList()){
            allocationRuleList.add(allocationRuleService.addAllocationRule(allocationRule));
        }

        Theme theme = new Theme(null,addThemeDTO.getName(),addThemeDTO.getRisk(),addThemeDTO.getInvestmentHorizon(),allocationRuleList,true);
        themeRepository.save(theme);
        return "Theme Added.";
    }

    @Override
    public String updateTheme(Theme theme) {
        if(themeRepository.existsById(theme.getId())){
            themeRepository.save(theme);
            return "Theme Updated";
        }else{
            throw new ThemeNotFoundException();
        }
    }

    @Override
    public String deleteTheme(Integer id) {
        if(themeRepository.existsById(id)){
            Theme theme = themeRepository.findById(id).get();
            theme.setStatus(false);
            themeRepository.save(theme);
            return "Theme Updated";
        }else{
            throw new ThemeNotFoundException();
        }
    }

    @Override
    public List<Theme> getAllThemes() {
        return themeRepository.findAll();
    }
}
