package com.example.pms.service;


import com.example.pms.dto.request.CreateAndActivatePortfolioDTO;
import com.example.pms.dto.request.CreatePortfolioByDateDTO;
import com.example.pms.dto.request.CreatePortfolioDTO;
import com.example.pms.dto.request.BuyHoldingDTO;
import com.example.pms.dto.request.GetAllPortfolioDTO;
import com.example.pms.dto.response.*;
import com.example.pms.model.Asset;
import com.example.pms.model.Portfolio;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public interface PortfolioService {

    public Portfolio createPortfolio(CreatePortfolioDTO createPortfolioDTO);

    public String buyPortfolioHoldings(Long id);

    public ValidationDTO isValid(Long id);


    public String createAndActivatePortfolio(CreateAndActivatePortfolioDTO createAndActivatePortfolioDTO);

    String addInitialHoldingsAndActivate(Long portfolioId, List<BuyHoldingDTO> holdings);

    String createDemoPortfolios(Integer userId);

    String deleteDemoPortfolios(Integer userId);

    public Integer getCountOfPortfolios(Integer userId);

    public Integer getCountOfActivePortfolios(Integer userId);

    public GetAllPortfolioResponseDTO getAllPortfolioDetails(GetAllPortfolioDTO getAllPortfolioDTO);

    public Double getCurrentAum(Portfolio portfolio);

    public Double getTotalRemainingAmount(Integer userId);


    public Portfolio getPortfolioDetails(Long id, Integer userId);

    PortfolioBasicInfoDTO getPortfolioBasicInfo(
            Long portfolioId,
            Integer userId
    );

    ThemeAllocationDTO getThemeAllocation(
            Long portfolioId,
            Integer userId
    );

    List<PortfolioHoldingDTO> getPortfolioHoldings(
            Long portfolioId,
            Integer userId
    );

    AllocationValidationDTO validatePortfolioAllocation(
            Long portfolioId,
            Integer userId
    );

    public AssetInvestmentDTO getEachAssetInvestment(Integer userId);

}
