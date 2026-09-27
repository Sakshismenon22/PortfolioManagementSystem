package com.example.pms.model;

import com.example.pms.model.enums.*;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "portfolios")
public class Portfolio {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    private String name;

    private PortfolioType portfolioType;

    private String currency;

    @Enumerated(EnumType.STRING)
    private Benchmark benchmark;

    @Enumerated(EnumType.STRING)
    private Exchange exchange;

    @ManyToOne
    private Theme theme;

    private ReBalancingFrequency reBalancingFrequency;

    private Double amount;

    @ManyToOne
    private User user;

    private PortfolioStatus portfolioStatus;



}
