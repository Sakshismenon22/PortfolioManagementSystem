package com.example.pms.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AllocationValidationDTO {

    private Long portfolioId;

    private String portfolioName;

    private Double totalInvestedAmount;

    private Double totalCurrentValue;

    private Boolean valid;

    private List<AssetAllocationValidationDTO> allocations;
}
