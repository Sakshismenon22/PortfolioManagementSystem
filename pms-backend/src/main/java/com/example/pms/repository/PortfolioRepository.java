package com.example.pms.repository;

import com.example.pms.model.Portfolio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PortfolioRepository extends JpaRepository<Portfolio,Long> {

    public List<Portfolio> findByUserUserId(Integer userId);
}
