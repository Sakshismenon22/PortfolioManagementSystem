package com.example.pms.dto.request;

import com.example.pms.model.enums.InvestmentHorizon;
import com.example.pms.model.enums.Risk;
import lombok.Data;

import java.util.List;

@Data
public class UpdateThemeDTO {
    private Integer id;
    private Integer userId;
    private String name;
    private Risk risk;
    private InvestmentHorizon investmentHorizon;
    private List<AllocationDTO> allocationRuleList;
}
