package com.example.pms.dto.request;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/** Request for inserting a historical sample portfolio with fixture purchase prices. */
@Data
@NoArgsConstructor
public class CreateHistoricalPortfolioDTO {
    private CreatePortfolioDTO portfolio;
    private List<HistoricalHoldingDTO> holdings;

    @Data
    @NoArgsConstructor
    public static class HistoricalHoldingDTO {
        private Long securityMasterId;
        private Integer quantity;
        private Double purchasePrice;
    }
}
