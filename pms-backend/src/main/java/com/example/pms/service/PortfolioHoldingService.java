package com.example.pms.service;

import com.example.pms.dto.request.AddPortfolioHoldingDTO;
import com.example.pms.dto.request.CreatePortfolioDTO;
import com.example.pms.model.PortfolioHolding;

public interface PortfolioHoldingService {

    public String addPortfolioHolding(AddPortfolioHoldingDTO addPortfolioHoldingDTO);

    public String buyHoldings(PortfolioHolding portfolioHolding);

    public Double getTotalCost(PortfolioHolding portfolioHolding);


}
