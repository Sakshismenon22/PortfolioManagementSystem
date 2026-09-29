package com.example.pms.dto.response;

import com.example.pms.model.enums.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PortfolioBasicInfoDTO {

    private Long portfolioId;

    private String name;

    private PortfolioType portfolioType;

    private String currency;

    private Benchmark benchmark;

    private Exchange exchange;

    private Long themeId;

    private String themeName;

    private ReBalancingFrequency reBalancingFrequency;

    private Double amount;

    private PortfolioStatus portfolioStatus;

    private Integer userId;

    private LocalDate createdAt;
}
