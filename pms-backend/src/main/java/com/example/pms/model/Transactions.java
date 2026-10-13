package com.example.pms.model;

import com.example.pms.model.enums.TransactionType;
import com.example.pms.model.Portfolio;
import com.example.pms.model.PortfolioHolding;
import com.example.pms.model.SecurityMaster;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "transactions")
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class Transactions {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer transactionId;

    @ManyToOne
    private Portfolio portfolio;

    @ManyToOne
    private PortfolioHolding portfolioHolding;

    @ManyToOne
    private SecurityMaster securityMaster;

    @Enumerated(EnumType.STRING)
    private TransactionType transactionType;

    private LocalDateTime transactionDate;

    private Double quantity;

    private Double pricePerUnit;

    private Double totalAmount;

    private Double fees;

    private Double costBasisPerUnit;

    private Double sellPricePerUnit;

    private Double realizedPnl;

    private LocalDateTime createdAt;
}
