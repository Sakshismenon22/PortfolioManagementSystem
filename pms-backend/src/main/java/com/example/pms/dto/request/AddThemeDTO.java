package com.example.pms.dto.request;

import com.example.pms.model.AllocationRule;
import com.example.pms.model.enums.InvestmentHorizon;
import com.example.pms.model.enums.Risk;
import jakarta.persistence.OneToMany;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AddThemeDTO {

    private String name;

    private Risk risk;

    private InvestmentHorizon investmentHorizon;


    private List<AllocationDTO> allocationRuleList;

}
