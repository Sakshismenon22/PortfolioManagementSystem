package com.example.pms.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;

import com.example.pms.exception.PortfolioHoldingNotFoundException;
import com.example.pms.exception.PortfolioNotFoundException;
import com.example.pms.exception.SecurityNotFoundException;
import com.example.pms.model.Portfolio;
import com.example.pms.model.PortfolioHolding;
import com.example.pms.model.SecurityMaster;
import com.example.pms.model.Transactions;
import com.example.pms.model.enums.TransactionType;
import com.example.pms.repository.PortFolioHoldingRepository;
import com.example.pms.repository.PortfolioRepository;
import com.example.pms.repository.SecurityMasterRepository;
import com.example.pms.repository.TransactionRepository;

import lombok.RequiredArgsConstructor;

@Service 
@RequiredArgsConstructor
public class TransactionServiceImpl implements TransactionService {

    private final PortfolioRepository portfolioRepository;
    private final PortFolioHoldingRepository portfolioHoldingRepository;
    private final SecurityMasterRepository securityMasterRepository;
    private final TransactionRepository transactionsRepository;

    @Override
    public void recordTrade(Long portfolioId, Integer holdingId, Long masterId, TransactionType transactionType, double quantity, double pricePerUnit, double totalAmount, double fees) {
        recordTrade(portfolioId, holdingId, masterId, transactionType, quantity, pricePerUnit, totalAmount, fees, null, null);
    }

    @Override
    public void recordTrade(Long portfolioId, Integer holdingId, Long masterId, TransactionType transactionType, double quantity, double pricePerUnit, double totalAmount, double fees, Double costBasisPerUnit, Double realizedPnl) {
        if(portfolioId == null || holdingId == null || masterId == null ){
            throw new IllegalArgumentException("Portfolio, Holding and Security are required");
        }
        if(quantity <=0) {
            throw new IllegalArgumentException("Quantity must be greater than zero.");
        }

        Portfolio portfolio = portfolioRepository.findById(portfolioId).orElseThrow(() -> new PortfolioNotFoundException());

        PortfolioHolding portfolioHolding = portfolioHoldingRepository.findById(holdingId).orElseThrow(() -> new PortfolioHoldingNotFoundException());

        SecurityMaster security = securityMasterRepository.findById(masterId).orElseThrow(() -> new SecurityNotFoundException());

        if (!portfolio.getId().equals(portfolioHolding.getPortfolio().getId())) {
            throw new IllegalArgumentException("This holding does not belong to the selected portfolio.");
        }

        Transactions tx = Transactions.builder()
                .portfolio(portfolio)
                .portfolioHolding(portfolioHolding)
                .securityMaster(security)
                .transactionType(transactionType)
                .transactionDate(LocalDateTime.now())
                .quantity(quantity)
                .pricePerUnit(pricePerUnit)
                .totalAmount(totalAmount)
                .fees(fees)
                .costBasisPerUnit(transactionType == TransactionType.SELL ? costBasisPerUnit : null)
                .sellPricePerUnit(transactionType == TransactionType.SELL ? pricePerUnit : null)
                .realizedPnl(transactionType == TransactionType.SELL ? realizedPnl : null)
                .createdAt(LocalDateTime.now())
                .build();

        transactionsRepository.save(tx);
    }

    @Override
    public List<Transactions> getTransactionsByPortfolio(Long portfolioId) {
        if (portfolioId == null) {
            throw new IllegalArgumentException("Portfolio id is required.");
        }
        return transactionsRepository.findByPortfolioIdOrderByTransactionDateDesc(portfolioId);
    }

    @Override
    public List<Transactions> getTransactionsByHolding(Integer holdingId) {
        if (holdingId == null) {
            throw new IllegalArgumentException("Holding id is required.");
        }
        return transactionsRepository.findByPortfolioHoldingIdOrderByTransactionDateDesc(holdingId);
    }
    
}
