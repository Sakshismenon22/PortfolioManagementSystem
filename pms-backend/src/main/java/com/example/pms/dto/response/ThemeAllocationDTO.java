package com.example.pms.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ThemeAllocationDTO {

    private Long themeId;

    private String themeName;

    private String risk;

    private String investmentHorizon;

    private List<AllocationRuleDTO> allocationRules;
}
