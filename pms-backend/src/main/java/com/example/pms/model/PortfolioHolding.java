package com.example.pms.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "portfolio_holdings")
public class PortfolioHolding {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Integer id;

    @ManyToOne
    private Portfolio portfolio;

    @ManyToOne
    private SecurityMaster securityMaster;

    private Integer quantityHeld;

    private Double averageCost;

    private Double totalCost;

    @ManyToOne
    private Asset asset;

    private LocalDate firstBuyDate;

    private LocalDate updatedAt;


}
