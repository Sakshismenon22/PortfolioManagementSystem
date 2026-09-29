package com.example.pms.repository;

import com.example.pms.model.DriftWatchList;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DriftWatchListRepository extends JpaRepository<DriftWatchList,Integer> {
}
