package com.example.pms.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ValidationDTO {
    private Boolean isValid;
    private Map<String,Double> assetWiseAmount;
    private Map<String,Double> assetWisePercentage;
    private Double grantTotal;
}
