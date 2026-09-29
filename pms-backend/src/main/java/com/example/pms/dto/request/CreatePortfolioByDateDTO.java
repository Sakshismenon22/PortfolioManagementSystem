package com.example.pms.dto.request;

import com.example.pms.model.enums.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CreatePortfolioByDateDTO {
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
    private LocalDate date;
}
