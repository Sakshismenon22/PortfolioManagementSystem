package com.example.pms.service;

import com.example.pms.dto.request.AddPortfolioHoldingDTO;
import com.example.pms.dto.request.BuyHoldingDTO;
import com.example.pms.dto.request.CreatePortfolioDTO;
import com.example.pms.dto.request.SellHoldingDTO;
import com.example.pms.model.PortfolioHolding;

import java.util.List;

public interface PortfolioHoldingService {

    public String addPortfolioHolding(AddPortfolioHoldingDTO addPortfolioHoldingDTO);

    public String buyHoldings(PortfolioHolding portfolioHolding);

    public Double getTotalCost(PortfolioHolding portfolioHolding);


    public String sellHoldingsShare(SellHoldingDTO sellHoldingDTO);

    public String sellHoldingsBatch(List<SellHoldingDTO> sellHoldingDTOList);

    public String buySecurities(BuyHoldingDTO buyHoldingDTO);

    public String buySecuritiesBatch(List<BuyHoldingDTO> buyHoldingDTOList);
}
