package com.example.pms.dto.response;

import com.example.pms.model.enums.Benchmark;
import com.example.pms.model.enums.PortfolioStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PortfolioDetailsDTO {
    private Long id;
    private String initials;
    private String name;
    private String code;
    private String theme;
    private String allocationType;
    private Double aum;
    private String return1Y;
    private Benchmark benchmark;
    private PortfolioStatus portfolioStatus;
    private String action;
}
