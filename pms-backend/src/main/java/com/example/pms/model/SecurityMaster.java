package com.example.pms.model;

import com.example.pms.model.enums.SecurityType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "security_master")
public class SecurityMaster {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column
    private String isin;

    @Column
    private String symbol;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(nullable = false, length = 30)
    @Enumerated(EnumType.STRING)
    private SecurityType securityType;

    @ManyToOne
    private Asset asset;

    @Column(length = 30)
    private String gicsSector;

    @Column(length = 30)
    private String gicsGroup;

    @Column(length = 30)
    private String gicsIndustry;

    @Column(length = 30)
    private String gicsSubIndustry;

    @Column
    private String issuerName;

    @Column
    private String faceValue;


    @Column(nullable = false, length = 20)
    private String exchangeCode;

    @Column(length = 3)
    private String currencyCode;

    @Column(length = 2)
    private String countryCode;

    @Column(nullable = false, length = 20)
    private String status;


    @Column
    private LocalDate listingDate;

    @Column
    private Integer lotSize;

}
