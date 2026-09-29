package com.example.pms.service;

import com.example.pms.client.SecurityMasterClient;
import com.example.pms.dto.request.AddPortfolioHoldingDTO;
import com.example.pms.dto.request.BuyHoldingDTO;
import com.example.pms.dto.request.CreatePortfolioDTO;
import com.example.pms.dto.request.SellHoldingDTO;
import com.example.pms.dto.response.SecurityPriceDTO;
import com.example.pms.dto.response.ValidationDTO;
import com.example.pms.exception.AssetNotFoundException;
import com.example.pms.exception.PortfolioHoldingNotFoundException;
import com.example.pms.exception.PortfolioNotFoundException;
import com.example.pms.exception.SecurityNotFoundException;
import com.example.pms.model.Asset;
import com.example.pms.model.Portfolio;
import com.example.pms.model.PortfolioHolding;
import com.example.pms.model.SecurityMaster;
import com.example.pms.model.enums.HoldingStatus;
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
    private final SecurityMasterService securityMasterService;
//    private final PortfolioService portfolioService;


    @Override
    public String addPortfolioHolding(AddPortfolioHoldingDTO addPortfolioHoldingDTO) {
        if(portfolioRepository.existsById(addPortfolioHoldingDTO.getPortfolioId())){
            if(assetRepository.existsById(addPortfolioHoldingDTO.getAssetId())){
                if(securityMasterRepository.existsById(addPortfolioHoldingDTO.getSecurityMasterId())){
                    Portfolio portfolio = portfolioRepository.findById(addPortfolioHoldingDTO.getPortfolioId()).get();
                    Asset asset = assetRepository.findById(addPortfolioHoldingDTO.getAssetId()).get();
                    SecurityMaster securityMaster = securityMasterRepository.findById(addPortfolioHoldingDTO.getSecurityMasterId()).get();

                    PortfolioHolding portfolioHolding = new PortfolioHolding(null,
                            portfolio,securityMaster,addPortfolioHoldingDTO.getQuantity(),null,null,asset,null, LocalDate.now(), HoldingStatus.ADDED);
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
                    portfolioHolding.setHoldingStatus(HoldingStatus.BROUGHT);
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

    @Override
    public String sellHoldingsShare(SellHoldingDTO sellHoldingDTO) {
        if(portfolioHoldingRepository.existsById(sellHoldingDTO.getId())){
            PortfolioHolding portfolioHolding = portfolioHoldingRepository.findById(sellHoldingDTO.getId()).get();
            if(sellHoldingDTO.getQuantity()<= portfolioHolding.getQuantityHeld()){
                Integer remainingShares = portfolioHolding.getQuantityHeld() - sellHoldingDTO.getQuantity();
                Portfolio portfolio = portfolioRepository.findById(portfolioHolding.getPortfolio().getId()).get();
                SecurityPriceDTO securityPriceDTO = securityMasterClient.findBySecurityId(portfolioHolding.getSecurityMaster().getId()).get();
                Double soldAmount = 0.0d;
                Double currentPrice = 0.0d;
                switch (portfolioHolding.getSecurityMaster().getSecurityType()){
                    case EQUITY,ETF ->{
                        currentPrice =  securityPriceDTO.getStockData().getClosePrice().doubleValue();
                    }

                    case MUTUAL_FUND -> {
                        currentPrice =  securityPriceDTO.getMutualFundNav().getNav().doubleValue();

                    }
                    case BOND -> {
                        currentPrice =  securityPriceDTO.getBond().getFaceValue();

                    }
                    case COMMODITY -> {
                        currentPrice =  securityPriceDTO.getCommoditySpotData().getSpotPrice().doubleValue();

                    }
                }
                soldAmount = currentPrice * sellHoldingDTO.getQuantity();
                Double amount = portfolio.getAmount()+soldAmount;
                portfolioHolding.setQuantityHeld(remainingShares);
                if(remainingShares>0){
                    Double totalCost = remainingShares*currentPrice;
                    Double avg = totalCost/remainingShares;
                    portfolioHolding.setTotalCost(totalCost);
                    portfolioHolding.setAverageCost(avg);
                }else {
                    portfolioHolding.setTotalCost(0.0d);
                    portfolioHolding.setAverageCost(0.0d);
                    portfolioHolding.setHoldingStatus(HoldingStatus.SOLD);
                }
                portfolio.setAmount(amount);
                portfolioHoldingRepository.save(portfolioHolding);
                portfolioRepository.save(portfolio);
                return "Sold Securities.";
            }else{
                throw new IllegalArgumentException();
            }
        }else{
            throw new PortfolioHoldingNotFoundException();
        }
    }

    @Override
    public String buySecurities(BuyHoldingDTO buyHoldingDTO) {
        return null;
    }

//    @Override
//    public String buySecurities(BuyHoldingDTO buyHoldingDTO) {
//        ValidationDTO validationDTO = portfolioService.isValid(buyHoldingDTO.getPortfolioId());
//
//        if(securityMasterRepository.existsById(buyHoldingDTO.getSecurityId())){
//            if(portfolioRepository.existsById(buyHoldingDTO.getPortfolioId())){
//
//                SecurityMaster securityMaster = securityMasterRepository.findById(buyHoldingDTO.getSecurityId()).get();
//
//                Portfolio portfolio = portfolioRepository.findById(buyHoldingDTO.getPortfolioId()).get();
//                Double currentPrice = securityMasterService.getCurrentPrice(buyHoldingDTO.getSecurityId());
//                Double buyAmount = currentPrice * buyHoldingDTO.getQuantity();
//                validationDTO
//                        .getAssetWiseAmount()
//                        .put(securityMaster
//                                        .getAsset()
//                                        .getAssetClass(),
//                                validationDTO.getAssetWiseAmount()
//                                        .getOrDefault(securityMaster.getAsset().getAssetClass(),0.0d)+buyAmount);
//                Double avg = buyAmount/buyHoldingDTO.getQuantity();
//                if(buyAmount<=portfolio.getAmount()){
//                    portfolio.setAmount(portfolio.getAmount()-buyAmount);
//                    PortfolioHolding portfolioHolding = new PortfolioHolding(null,portfolio,securityMaster, buyHoldingDTO.getQuantity(),avg ,buyAmount,securityMaster.getAsset(),LocalDate.now(),LocalDate.now(),HoldingStatus.BROUGHT);
//                    portfolioHoldingRepository.save(portfolioHolding);
//                    portfolioRepository.save(portfolio);
//                    return "Securities Brought";
//                }else{
//                    throw new IllegalArgumentException();
//                }
//            }else{
//                throw new PortfolioNotFoundException();
//            }
//        }else{
//            throw new SecurityNotFoundException();
//        }
//
//    }
}

