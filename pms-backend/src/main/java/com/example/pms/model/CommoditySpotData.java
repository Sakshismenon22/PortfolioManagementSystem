package com.example.pms.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "commodity_spot_data",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_comm_spot_symbol_date",
                columnNames = {"symbol", "spot_date"}),
        indexes = {
                @Index(name = "idx_comm_spot_symbol", columnList = "symbol"),
                @Index(name = "idx_comm_spot_date",   columnList = "spot_date")
        })
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CommoditySpotData {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 32)
    private String symbol;

    @Column(name = "spot_date", nullable = false)
    private LocalDate spotDate;

    @Column(name = "spot_price1", precision = 18, scale = 4)
    private BigDecimal spotPrice1;

    @Column(name = "spot_price2", precision = 18, scale = 4)
    private BigDecimal spotPrice2;

    /** Effective price: spotPrice2 if present, else spotPrice1. Use this for valuation. */
    @Column(name = "spot_price", precision = 18, scale = 4)
    private BigDecimal spotPrice;

    @Column(length = 32)
    private String quotation;

    @Column(name = "price_timestamp")
    private LocalDateTime priceTimestamp;

    @Column(name = "is_final")
    private Boolean isFinal;

    @Column(name = "watchlist_id")
    private Integer watchlistId;
}
