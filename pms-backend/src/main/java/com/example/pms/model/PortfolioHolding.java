package com.example.pms.model;

import com.example.pms.model.enums.HoldingStatus;
import com.example.pms.model.enums.EquityCategory;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.ColumnDefault;

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

    @Enumerated(EnumType.STRING)
    private HoldingStatus holdingStatus;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private EquityCategory equityCategory;


}
