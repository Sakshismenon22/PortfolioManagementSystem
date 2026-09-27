package com.example.pms.service;

import com.example.pms.client.SecurityMasterClient;
import com.example.pms.dto.request.AddPortfolioHoldingDTO;
import com.example.pms.dto.request.CreatePortfolioDTO;
import com.example.pms.dto.response.SecurityPriceDTO;
import com.example.pms.exception.AssetNotFoundException;
import com.example.pms.exception.PortfolioHoldingNotFoundException;
import com.example.pms.exception.PortfolioNotFoundException;
import com.example.pms.exception.SecurityNotFoundException;
import com.example.pms.model.Asset;
import com.example.pms.model.Portfolio;
import com.example.pms.model.PortfolioHolding;
import com.example.pms.model.SecurityMaster;
import com.example.pms.model.enums.SecurityType;
import com.example.pms.repository.AssetRepository;
import com.example.pms.repository.PortFolioHoldingRepository;
import com.example.pms.repository.PortfolioRepository;
import com.example.pms.repository.SecurityMasterRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.repository.Repository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class PortfolioHoldingServiceImpl implements PortfolioHoldingService{

    private final PortfolioRepository portfolioRepository;
    private final AssetRepository assetRepository;
    private final SecurityMasterRepository securityMasterRepository;
    private final PortFolioHoldingRepository portfolioHoldingRepository;
    private final SecurityMasterClient securityMasterClient;


    @Override
    public String addPortfolioHolding(AddPortfolioHoldingDTO addPortfolioHoldingDTO) {
        if(portfolioRepository.existsById(addPortfolioHoldingDTO.getPortfolioId())){
            if(assetRepository.existsById(addPortfolioHoldingDTO.getAssetId())){
                if(securityMasterRepository.existsById(addPortfolioHoldingDTO.getSecurityMasterId())){
                    Portfolio portfolio = portfolioRepository.findById(addPortfolioHoldingDTO.getPortfolioId()).get();
                    Asset asset = assetRepository.findById(addPortfolioHoldingDTO.getAssetId()).get();
                    SecurityMaster securityMaster = securityMasterRepository.findById(addPortfolioHoldingDTO.getSecurityMasterId()).get();

                    PortfolioHolding portfolioHolding = new PortfolioHolding(null,
                            portfolio,securityMaster,addPortfolioHoldingDTO.getQuantity(),null,null,asset,null, LocalDate.now());
                    portfolioHoldingRepository.save(portfolioHolding);
                    return "Portfolio Saved";
                }else{
                    throw new SecurityNotFoundException();
                }
            }else{
                throw new AssetNotFoundException();
            }
        }else{
            throw new PortfolioNotFoundException();
        }
    }

    @Override
    public String buyHoldings(PortfolioHolding portfolioHolding) {
        if(portfolioHoldingRepository.existsById(portfolioHolding.getId())){
            if(portfolioRepository.existsById(portfolioHolding.getPortfolio().getId())){
                if(securityMasterRepository.existsById(portfolioHolding.getSecurityMaster().getId())){
                    SecurityType type = portfolioHolding.getSecurityMaster().getSecurityType();
                    LocalDate firstBuyDate = LocalDate.now();
                    switch (type) {
                        case EQUITY, ETF -> {
                            SecurityPriceDTO securityPriceDTO = securityMasterClient.findBySecurityId(portfolioHolding.getSecurityMaster().getId()).get();
                            Double price = securityPriceDTO.getStockData().getClosePrice().doubleValue();
                            Double totalCost = price * portfolioHolding.getQuantityHeld();
                            Double avgCost = totalCost/ portfolioHolding.getQuantityHeld();
                            portfolioHolding.setFirstBuyDate(firstBuyDate);
                            portfolioHolding.setAverageCost(avgCost);
                            portfolioHolding.setTotalCost(totalCost);
                            portfolioHolding.setUpdatedAt(firstBuyDate);
                            portfolioHoldingRepository.save(portfolioHolding);

                        }
                        case MUTUAL_FUND -> {
                            SecurityPriceDTO securityPriceDTO = securityMasterClient.findBySecurityId(portfolioHolding.getSecurityMaster().getId()).get();
                            Double price = securityPriceDTO.getMutualFundNav().getNav().doubleValue();
                            Double totalCost = price * portfolioHolding.getQuantityHeld();
                            Double avgCost = totalCost/ portfolioHolding.getQuantityHeld();
                            portfolioHolding.setFirstBuyDate(firstBuyDate);
                            portfolioHolding.setAverageCost(avgCost);
                            portfolioHolding.setTotalCost(totalCost);
                            portfolioHolding.setUpdatedAt(firstBuyDate);
                            portfolioHoldingRepository.save(portfolioHolding);
                        }
                        case BOND -> {
                            SecurityPriceDTO securityPriceDTO = securityMasterClient.findBySecurityId(portfolioHolding.getSecurityMaster().getId()).get();
                            Double price = securityPriceDTO.getBond().getCleanPrice().doubleValue() + 9.91;
                            Double totalCost = price * portfolioHolding.getQuantityHeld();
                            Double avgCost = totalCost/ portfolioHolding.getQuantityHeld();
                            portfolioHolding.setFirstBuyDate(firstBuyDate);
                            portfolioHolding.setAverageCost(avgCost);
                            portfolioHolding.setTotalCost(totalCost);
                            portfolioHolding.setUpdatedAt(firstBuyDate);
                            portfolioHoldingRepository.save(portfolioHolding);
                        }
                        case COMMODITY -> {
                            SecurityPriceDTO securityPriceDTO = securityMasterClient.findBySecurityId(portfolioHolding.getSecurityMaster().getId()).get();
                            Double price = securityPriceDTO.getCommoditySpotData().getSpotPrice().doubleValue();
                            Double totalCost = price * portfolioHolding.getQuantityHeld();
                            Double avgCost = totalCost/ portfolioHolding.getQuantityHeld();
                            portfolioHolding.setFirstBuyDate(firstBuyDate);
                            portfolioHolding.setAverageCost(avgCost);
                            portfolioHolding.setTotalCost(totalCost);
                            portfolioHolding.setUpdatedAt(firstBuyDate);
                            portfolioHoldingRepository.save(portfolioHolding);
                        }

                    }
                    return "Holding Brought.";
                }else{
                    throw new SecurityNotFoundException();
                }
            }else{
                throw new PortfolioNotFoundException();
            }
        }else{
            throw new PortfolioHoldingNotFoundException();
        }
    }

    @Override
    public Double getTotalCost(PortfolioHolding portfolioHolding) {
        if(portfolioHoldingRepository.existsById(portfolioHolding.getId())){
            if(portfolioRepository.existsById(portfolioHolding.getPortfolio().getId())){
                if(securityMasterRepository.existsById(portfolioHolding.getSecurityMaster().getId())){
                    SecurityType type = portfolioHolding.getSecurityMaster().getSecurityType();
                    LocalDate firstBuyDate = LocalDate.now();
                    switch (type) {
                        case EQUITY, ETF -> {
                            SecurityPriceDTO securityPriceDTO = securityMasterClient.findBySecurityId(portfolioHolding.getSecurityMaster().getId()).get();
                            System.out.println(securityPriceDTO.toString());
                            Double price = securityPriceDTO.getStockData().getClosePrice().doubleValue();
                            Double totalCost = price * portfolioHolding.getQuantityHeld();
                            return totalCost;

                        }
                        case MUTUAL_FUND -> {
                            SecurityPriceDTO securityPriceDTO = securityMasterClient.findBySecurityId(portfolioHolding.getSecurityMaster().getId()).get();
                            Double price = securityPriceDTO.getMutualFundNav().getNav().doubleValue();
                            Double totalCost = price * portfolioHolding.getQuantityHeld();
                            return totalCost;
                        }
                        case BOND -> {
                            SecurityPriceDTO securityPriceDTO = securityMasterClient.findBySecurityId(portfolioHolding.getSecurityMaster().getId()).get();
                            Double price = securityPriceDTO.getBond().getCleanPrice().doubleValue() + 9.91;
                            Double totalCost = price * portfolioHolding.getQuantityHeld();
                            return totalCost;
                        }
                        case COMMODITY -> {
                            SecurityPriceDTO securityPriceDTO = securityMasterClient.findBySecurityId(portfolioHolding.getSecurityMaster().getId()).get();
                            Double price = securityPriceDTO.getCommoditySpotData().getSpotPrice().doubleValue();
                            Double totalCost = price * portfolioHolding.getQuantityHeld();
                            return totalCost;
                        }

                    }
                    return 0.0;

                }else{
                    throw new SecurityNotFoundException();
                }
            }else{
                throw new PortfolioNotFoundException();
            }
        }else{
            throw new PortfolioHoldingNotFoundException();
        }
    }
}

