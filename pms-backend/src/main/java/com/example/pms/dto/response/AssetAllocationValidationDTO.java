package com.example.pms.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AssetAllocationValidationDTO {

    private Integer assetId;

    private String assetClass;

    private Double targetPercentage;

    private Double currentPercentage;

    private Double driftPercentage;

    private Boolean satisfied;

    private Integer holdingCount;
}