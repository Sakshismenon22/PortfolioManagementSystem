package com.example.pms.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PortfolioHoldingDTO {

    private Integer holdingId;

    private Long securityId;

    private String symbol;

    private String securityName;

    private Integer assetId;

    private String assetClass;

    private Integer quantity;

    private Double averageCost;

    private Double totalCost;

    private Double currentValue;

    private Double allocationPercentage;
}
