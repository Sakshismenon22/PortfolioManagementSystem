package com.example.pms.repository;

import com.example.pms.model.DriftDetection;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DriftDetectionRepository extends JpaRepository<DriftDetection,Integer> {

    List<DriftDetection> findByPortfolioIdOrderByDetectedAtDescIdDesc(Long portfolioId);

    void deleteByPortfolioId(Long portfolioId);

}
