package com.example.pms.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AddPortfolioHoldingDTO {
    private Long portfolioId;
    private Long securityMasterId;
    private Integer quantity;
    private Integer assetId;

}
