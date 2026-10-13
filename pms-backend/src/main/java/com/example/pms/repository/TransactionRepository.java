package com.example.pms.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.pms.model.Transactions;

public interface TransactionRepository extends JpaRepository<Transactions, Integer>{

    List<Transactions> findByPortfolioIdOrderByTransactionDateDesc(Long portfolioId);
    List<Transactions> findByPortfolioHoldingIdOrderByTransactionDateDesc(Integer holdingId);
    List<Transactions> findByPortfolioIdAndSecurityMasterIdOrderByTransactionDateDesc(Long portfolioId, Long securityId);
    
}
