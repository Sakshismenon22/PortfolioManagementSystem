package com.example.pms.service;


import com.example.pms.dto.request.CreatePortfolioDTO;
import com.example.pms.dto.response.ValidationDTO;

public interface PortfolioService {

    public String createPortfolio(CreatePortfolioDTO createPortfolioDTO);

    public String buyPortfolioHoldings(Long id);

    public ValidationDTO isValid(Long id);

    public Integer getCountOfPortfolios(Integer userId);

    public Integer getCountOfActivePortfolios(Integer userId);


    public Double getTotalRemainingAmount(Integer userId);

}
