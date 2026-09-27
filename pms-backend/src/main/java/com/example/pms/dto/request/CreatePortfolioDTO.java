package com.example.pms.dto.request;

import com.example.pms.model.enums.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CreatePortfolioDTO {
    private String name;
    private PortfolioType portfolioType;
    private String currency;
    private Benchmark benchmark;
    private Exchange exchange;
    private ReBalancingFrequency reBalancingFrequency;
    private Double amount;
    private Integer userId;
    private PortfolioStatus portfolioStatus;
    private Integer themeId;
}
