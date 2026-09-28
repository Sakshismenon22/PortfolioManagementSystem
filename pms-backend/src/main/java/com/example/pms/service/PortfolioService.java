package com.example.pms.service;


import com.example.pms.dto.request.CreateAndActivatePortfolioDTO;
import com.example.pms.dto.request.CreatePortfolioDTO;
import com.example.pms.dto.response.ValidationDTO;
import com.example.pms.model.Portfolio;

public interface PortfolioService {

    public Portfolio createPortfolio(CreatePortfolioDTO createPortfolioDTO);

    public String buyPortfolioHoldings(Long id);

    public ValidationDTO isValid(Long id);


    public String createAndActivatePortfolio(CreateAndActivatePortfolioDTO createAndActivatePortfolioDTO);

    public Integer getCountOfPortfolios(Integer userId);

    public Integer getCountOfActivePortfolios(Integer userId);



    public Double getTotalRemainingAmount(Integer userId);


    public Portfolio getPortfolioDetails(Long id, Integer userId);


}
