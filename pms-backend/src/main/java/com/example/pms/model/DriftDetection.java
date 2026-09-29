package com.example.pms.model;

import jakarta.persistence.*;

import java.time.LocalDate;

@Entity
@Table(name = "drift_detection")
public class DriftDetection {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Integer id;

    private Long portfolioId;

    private Integer assetId;

    private LocalDate detectedAt;

    private Double driftPercent;




}
