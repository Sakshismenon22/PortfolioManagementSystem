package com.example.pms.exception;

public class PortfolioNotFoundException extends RuntimeException {
    public PortfolioNotFoundException() {
        super("Portfolio not found.");
    }
}
