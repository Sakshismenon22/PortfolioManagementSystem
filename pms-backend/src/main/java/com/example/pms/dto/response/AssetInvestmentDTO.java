package com.example.pms.dto.response;

import com.example.pms.model.Asset;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;


@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AssetInvestmentDTO {

    private Map<Asset, Double> assetWiseInvestment;   // Equity -> 4.5L, Bonds -> 1L, ...
    private Double totalBalance;                       // 2L
    private Double totalInvestment;

    public AssetInvestmentDTO(Map<Asset, Double> assetInvestmentMap, Double totalBalance) {
    }
}