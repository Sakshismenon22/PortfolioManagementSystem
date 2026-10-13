package com.example.pms.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.pms.model.Transactions;
import com.example.pms.model.enums.TransactionType;
import com.example.pms.service.TransactionService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping ("/api/transactions")
@RequiredArgsConstructor
public class TransactionController {

    private final TransactionService transactionService;

    @GetMapping ("/portfolio/{portfolioId}")
    public List<Transactions> getByPortfolio(@PathVariable Long portfolioId) {
        return transactionService.getTransactionsByPortfolio(portfolioId);
    }

    @GetMapping("/holding/{holdingId}")
    public List<Transactions> getByHolding(@PathVariable Integer holdingId) {
        return transactionService.getTransactionsByHolding(holdingId);
    }

    @PostMapping 
    public ResponseEntity<String> addTransaction(
            @RequestParam Long portfolioId,
            @RequestParam Integer holdingId,
            @RequestParam Long securityId,
            @RequestParam TransactionType transactionType,
            @RequestParam double quantity,
            @RequestParam double pricePerUnit,
            @RequestParam double totalAmount,
            @RequestParam(defaultValue = "0.0") double fees
    ) {
        transactionService.recordTrade(
                portfolioId,
                holdingId,
                securityId,
                transactionType,
                quantity,
                pricePerUnit,
                totalAmount,
                fees
        );
        return ResponseEntity.ok("Transaction recorded.");
    } 
}
