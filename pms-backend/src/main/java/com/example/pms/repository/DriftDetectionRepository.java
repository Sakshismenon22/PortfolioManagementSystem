package com.example.pms.repository;

import com.example.pms.model.DriftDetection;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DriftDetectionRepository extends JpaRepository<DriftDetection,Integer> {
}
