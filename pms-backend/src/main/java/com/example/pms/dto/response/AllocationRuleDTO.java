package com.example.pms.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AllocationRuleDTO {

    private Integer allocationRuleId;

    private Integer assetId;

    private String assetClass;

    private String assetSubclass;

    private String description;

    private Double targetPercentage;
}
