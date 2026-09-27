package com.example.pms.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "stock_data",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_stock_data_symbol_date",
                columnNames = {"symbol", "trade_date"}),
        indexes = {
                @Index(name = "idx_stock_data_symbol", columnList = "symbol"),
                @Index(name = "idx_stock_data_date",   columnList = "trade_date")
        })
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StockData {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 32)
    private String symbol;

    @Column(name = "trade_date", nullable = false)
    private LocalDate tradeDate;

    @Column(name = "open_price", precision = 18, scale = 4)
    private BigDecimal openPrice;

    @Column(name = "close_price", precision = 18, scale = 4)
    private BigDecimal closePrice;

    /** FK back to the source watchlist row - gives you ISIN/GICS via join, no duplication. */
    @Column(name = "watchlist_id")
    private Integer watchlistId;
}
