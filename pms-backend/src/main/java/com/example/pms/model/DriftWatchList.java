package com.example.pms.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Entity
@Table(name = "drift_watchlist")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class DriftWatchList {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Integer id;
    private Long portfolioId;
    private LocalDate driftDetectedAt;

}
