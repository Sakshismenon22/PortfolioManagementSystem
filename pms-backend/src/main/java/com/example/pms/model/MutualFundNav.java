package com.example.pms.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "mutualfund_nav",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_mf_nav_isin_date",
                columnNames = {"isin", "nav_date"}),
        indexes = {
                @Index(name = "idx_mfnav_isin", columnList = "isin"),
                @Index(name = "idx_mfnav_date", columnList = "nav_date")
        })
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MutualFundNav {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 12)
    private String isin;

    @Column(name = "scheme_code")
    private Long schemeCode;

    @Column(name = "scheme_name", length = 255)
    private String schemeName;

    @Column(name = "nav_date", nullable = false)
    private LocalDate navDate;

    @Column(precision = 18, scale = 4)
    private BigDecimal nav;

    @Column(name = "watchlist_id")
    private Integer watchlistId;
}