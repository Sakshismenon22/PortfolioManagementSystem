package com.example.pms.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PortfolioTransactionDTO {
    private Long transactionId;
    private LocalDateTime executedAt;
    private String side;
    private String securityName;
    private String symbol;
    private String assetClass;
    private Integer quantity;
    private Double executionPrice;
    private Double totalAmount;
    private Double realizedPnl;
    private Double cashBalanceAfter;
}
