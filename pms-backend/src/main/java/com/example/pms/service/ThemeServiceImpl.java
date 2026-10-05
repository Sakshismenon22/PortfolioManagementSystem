package com.example.pms.service;

import com.example.pms.dto.request.AddThemeDTO;
import com.example.pms.dto.request.AllocationDTO;
import com.example.pms.dto.request.UpdateThemeDTO;
import com.example.pms.exception.ThemeNotFoundException;
import com.example.pms.model.AllocationRule;
import com.example.pms.model.Theme;
import com.example.pms.model.User;
import com.example.pms.repository.ThemeRepository;
import com.example.pms.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ThemeServiceImpl implements ThemeService{

    private final ThemeRepository themeRepository;
    private final AllocationRuleService allocationRuleService;
    private final UserRepository userRepository;

    @Override
    public String addTheme(AddThemeDTO addThemeDTO) {
        User user = userRepository.findById(addThemeDTO.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("User not found."));
        List<AllocationRule> allocationRuleList = new ArrayList<>();
        for(AllocationDTO allocationRule:addThemeDTO.getAllocationRuleList()){
            allocationRuleList.add(allocationRuleService.addAllocationRule(allocationRule));
        }
        Theme theme = new Theme(null,addThemeDTO.getName(),addThemeDTO.getRisk(),addThemeDTO.getInvestmentHorizon(),allocationRuleList,true,user);
        themeRepository.save(theme);
        return "Theme Added.";
    }

    @Override
    @Transactional
    public String updateTheme(UpdateThemeDTO request) {
        Theme theme = themeRepository.findByIdAndCreatedBy_UserId(request.getId(), request.getUserId())
                .orElseThrow(ThemeNotFoundException::new);
        theme.setName(request.getName());
        theme.setRisk(request.getRisk());
        theme.setInvestmentHorizon(request.getInvestmentHorizon());
        List<AllocationRule> updatedRules = new ArrayList<>();
        for (AllocationDTO allocation : request.getAllocationRuleList()) {
            updatedRules.add(allocationRuleService.addAllocationRule(allocation));
        }
        theme.getAllocationRuleList().clear();
        theme.getAllocationRuleList().addAll(updatedRules);
        themeRepository.save(theme);
        return "Theme Updated";
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
    public List<Theme> getAllThemes(Integer userId) {
        if (userId == null || !userRepository.existsById(userId)) {
            throw new IllegalArgumentException("A valid userId is required.");
        }
        return themeRepository.findByCreatedBy_UserIdAndStatusTrue(userId);
    }

    @Override
    public Boolean validateTheme(Integer id, Map<String, Double> percentageMap) {
        if(themeRepository.existsById(id)){
            Theme theme = themeRepository.findById(id).get();
            for(AllocationRule allocationRule:theme.getAllocationRuleList()){
                Double drift = percentageMap.get(allocationRule.getAsset().getAssetClass()) - allocationRule.getPercentage();
                if(drift>=5){
                    return false;
                }
            }
        }else{
            throw new ThemeNotFoundException();
        }
        return true;
    }
}
