package com.example.pms.model;

import com.example.pms.model.enums.PortfolioTransactionSide;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@Entity
@Table(name = "portfolio_transactions", indexes = {
        @Index(name = "idx_portfolio_transactions_portfolio_time", columnList = "portfolio_id, executed_at")
})
public class PortfolioTransaction {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "portfolio_id", nullable = false)
    private Portfolio portfolio;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "security_id", nullable = false)
    private SecurityMaster security;

    @Column(name = "security_name", nullable = false)
    private String securityName;

    @Column(name = "symbol")
    private String symbol;

    @Column(name = "asset_class")
    private String assetClass;

    @Enumerated(EnumType.STRING)
    @Column(name = "transaction_side", nullable = false, length = 8)
    private PortfolioTransactionSide side;

    @Column(nullable = false)
    private Integer quantity;

    @Column(name = "execution_price", nullable = false)
    private Double executionPrice;

    @Column(name = "total_amount", nullable = false)
    private Double totalAmount;

    @Column(name = "realized_pnl")
    private Double realizedPnl;

    @Column(name = "cash_balance_after", nullable = false)
    private Double cashBalanceAfter;

    @Column(name = "executed_at", nullable = false)
    private LocalDateTime executedAt;
}
