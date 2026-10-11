package com.example.pms.repository;

import com.example.pms.model.PortfolioTransaction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PortfolioTransactionRepository extends JpaRepository<PortfolioTransaction, Long> {
    List<PortfolioTransaction> findByPortfolio_IdOrderByExecutedAtDescIdDesc(Long portfolioId);
}
