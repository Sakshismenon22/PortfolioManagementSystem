package com.example.pms.model;

import com.example.pms.model.enums.Exchange;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Entity
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class Bond {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private String isin;

    private String name;

    private String issuerName;

    private String bondType;

    @Enumerated(EnumType.STRING)
    private Exchange exchange;

    private String currency;

    private Double faceValue;

    private Double couponRate;

    private String couponFrequency;

    private LocalDate issueDate;

    private LocalDate maturityDate;

    private Double cleanPrice;

    private Double yieldToMaturity;

    private String creditRating;

    private String status;

    @ManyToOne
    private Asset asset;

    private String country;

}
