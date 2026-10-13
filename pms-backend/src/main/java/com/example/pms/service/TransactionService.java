package com.example.pms.service;

import java.util.List;

import com.example.pms.model.Portfolio;
import com.example.pms.model.PortfolioHolding;
import com.example.pms.model.SecurityMaster;
import com.example.pms.model.Transactions;
import com.example.pms.model.enums.TransactionType;

public interface TransactionService {

    default void recordTrade(Long portfolioId, Integer holdingId, Long masterId, TransactionType transactionType, double quantity, double pricePerUnit, double totalAmount, double fees) {
        recordTrade(portfolioId, holdingId, masterId, transactionType, quantity, pricePerUnit, totalAmount, fees, null, null);
    }

    void recordTrade(Long portfolioId, Integer holdingId, Long masterId, TransactionType transactionType, double quantity, double pricePerUnit, double totalAmount, double fees, Double costBasisPerUnit, Double realizedPnl);

    List<Transactions> getTransactionsByPortfolio(Long portfolioId);

    List<Transactions> getTransactionsByHolding(Integer holdingId);
}

