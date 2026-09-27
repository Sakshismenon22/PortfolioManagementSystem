package com.example.pms.exception;

public class PortfolioHoldingNotFoundException extends RuntimeException {
    public PortfolioHoldingNotFoundException() {
        super("Portfolio Holding not Found.");
    }
}
