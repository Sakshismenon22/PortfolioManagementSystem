package com.example.pms.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class DriftHistoryDTO {
    private Integer id;
    private Long portfolioId;
    private Integer assetId;
    private String assetClass;
    private LocalDate detectedAt;
    private Double driftPercent;
}
