package com.example.pms.service;

import com.example.pms.client.SecurityMasterClient;
import com.example.pms.dto.request.AddPortfolioHoldingDTO;
import com.example.pms.dto.request.BuyHoldingDTO;
import com.example.pms.dto.request.CreatePortfolioDTO;
import com.example.pms.dto.request.SellHoldingDTO;
import com.example.pms.dto.response.SecurityPriceDTO;
import com.example.pms.exception.AssetNotFoundException;
import com.example.pms.exception.PortfolioHoldingNotFoundException;
import com.example.pms.exception.PortfolioNotFoundException;
import com.example.pms.exception.SecurityNotFoundException;
import com.example.pms.model.Asset;
import com.example.pms.model.AllocationRule;
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
import org.springframework.transaction.annotation.Transactional;

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
    @Transactional
    public String sellHoldingsShare(SellHoldingDTO sellHoldingDTO) {
        if (sellHoldingDTO == null || sellHoldingDTO.getId() == null) throw new IllegalArgumentException("Select a holding to sell.");
        int quantity = sellHoldingDTO.getQuantity() == null ? 0 : sellHoldingDTO.getQuantity();
        if (quantity <= 0) throw new IllegalArgumentException("Sell quantity must be a positive whole number.");

        PortfolioHolding holding = portfolioHoldingRepository.findById(sellHoldingDTO.getId()).orElseThrow(PortfolioHoldingNotFoundException::new);
        if (holding.getHoldingStatus() != HoldingStatus.BROUGHT || holding.getQuantityHeld() == null || holding.getQuantityHeld() <= 0) {
            throw new IllegalArgumentException("Only currently held securities can be sold.");
        }
        if (quantity > holding.getQuantityHeld()) throw new IllegalArgumentException("Sell quantity cannot exceed the shares currently held.");
        Portfolio portfolio = portfolioRepository.findById(holding.getPortfolio().getId()).orElseThrow(PortfolioNotFoundException::new);
        requireActivePortfolio(portfolio);
        double averageCost = holding.getAverageCost() == null ? 0 : holding.getAverageCost();
        requireTradeWithinTheme(portfolio, holding.getAsset(), averageCost * quantity, false);

        double currentPrice = securityMasterService.getCurrentPrice(holding.getSecurityMaster().getId());
        requirePositivePrice(currentPrice);
        int remainingShares = holding.getQuantityHeld() - quantity;
        portfolio.setAmount(safeAmount(portfolio.getAmount()) + currentPrice * quantity);
        holding.setQuantityHeld(remainingShares);
        // Selling must not rewrite the acquisition cost of the remaining shares.
        holding.setTotalCost(averageCost * remainingShares);
        holding.setUpdatedAt(LocalDate.now());
        if (remainingShares == 0) holding.setHoldingStatus(HoldingStatus.SOLD);
        portfolioHoldingRepository.save(holding);
        portfolioRepository.save(portfolio);
        return "Sold " + quantity + " share(s) of " + holding.getSecurityMaster().getName() + ".";
    }

    @Override
    @Transactional
    public String buySecurities(BuyHoldingDTO buyHoldingDTO) {
        if (buyHoldingDTO == null || buyHoldingDTO.getPortfolioId() == null || buyHoldingDTO.getSecurityId() == null) {
            throw new IllegalArgumentException("Select a portfolio and security before buying.");
        }
        int quantity = buyHoldingDTO.getQuantity() == null ? 0 : buyHoldingDTO.getQuantity();
        if (quantity <= 0) throw new IllegalArgumentException("Buy quantity must be a positive whole number.");
        Portfolio portfolio = portfolioRepository.findById(buyHoldingDTO.getPortfolioId()).orElseThrow(PortfolioNotFoundException::new);
        requireActivePortfolio(portfolio);
        SecurityMaster security = securityMasterRepository.findById(buyHoldingDTO.getSecurityId()).orElseThrow(SecurityNotFoundException::new);
        Asset asset = security.getAsset();
        if (asset == null) throw new IllegalArgumentException("The selected security has no asset class mapping.");
        double currentPrice = securityMasterService.getCurrentPrice(security.getId());
        requirePositivePrice(currentPrice);
        double buyAmount = currentPrice * quantity;
        requireTradeWithinTheme(portfolio, asset, buyAmount, true);
        double availableCash = safeAmount(portfolio.getAmount());
        if (buyAmount > availableCash + 0.01) {
            throw new IllegalArgumentException("Insufficient cash. Available " + formatAmount(availableCash) + ", required " + formatAmount(buyAmount) + ".");
        }
        portfolio.setAmount(Math.max(0, availableCash - buyAmount));
        // Add-on buys belong to the existing active position. This keeps one
        // current holding row and updates its weighted average acquisition cost.
        PortfolioHolding holding = portfolioHoldingRepository.findAllByPortfolio(portfolio).stream()
                .filter(existing -> existing.getHoldingStatus() == HoldingStatus.BROUGHT
                        && existing.getQuantityHeld() != null && existing.getQuantityHeld() > 0
                        && existing.getSecurityMaster() != null
                        && existing.getSecurityMaster().getId().equals(security.getId()))
                .findFirst()
                .orElse(null);
        if (holding == null) {
            holding = new PortfolioHolding(null, portfolio, security, quantity, currentPrice, buyAmount,
                    asset, LocalDate.now(), LocalDate.now(), HoldingStatus.BROUGHT);
        } else {
            int oldQuantity = holding.getQuantityHeld();
            double oldCost = holding.getTotalCost() == null
                    ? safeAmount(holding.getAverageCost()) * oldQuantity
                    : holding.getTotalCost();
            int newQuantity = oldQuantity + quantity;
            double newCost = oldCost + buyAmount;
            holding.setQuantityHeld(newQuantity);
            holding.setTotalCost(newCost);
            holding.setAverageCost(newCost / newQuantity);
            holding.setUpdatedAt(LocalDate.now());
        }
        portfolioHoldingRepository.save(holding);
        portfolioRepository.save(portfolio);
        return "Bought " + quantity + " share(s) of " + security.getName() + ".";
    }

    private void requireActivePortfolio(Portfolio portfolio) {
        if (portfolio.getPortfolioStatus() != com.example.pms.model.enums.PortfolioStatus.ACTIVE) {
            throw new IllegalArgumentException("Trades are allowed only for active portfolios.");
        }
    }

    private void requirePositivePrice(Double price) {
        if (price == null || !Double.isFinite(price) || price <= 0) {
            throw new IllegalArgumentException("A current security price is unavailable; the trade was not placed.");
        }
    }

    private void requireTradeWithinTheme(Portfolio portfolio, Asset asset, double amount, boolean buy) {
        if (amount <= 0) throw new IllegalArgumentException("Trade amount must be greater than zero.");
        AllocationRule rule = portfolio.getTheme().getAllocationRuleList().stream()
                .filter(candidate -> candidate.getAsset() != null && candidate.getAsset().getId().equals(asset.getId()))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("This asset class is not included in the portfolio theme."));
        var activeHoldings = portfolioHoldingRepository.findAllByPortfolio(portfolio).stream()
                .filter(holding -> holding.getHoldingStatus() == HoldingStatus.BROUGHT && holding.getQuantityHeld() != null && holding.getQuantityHeld() > 0)
                .toList();
        double totalCost = activeHoldings.stream().mapToDouble(holding -> holding.getTotalCost() == null ? 0 : holding.getTotalCost()).sum();
        double assetCost = activeHoldings.stream()
                .filter(holding -> holding.getAsset() != null && holding.getAsset().getId().equals(asset.getId()))
                .mapToDouble(holding -> holding.getTotalCost() == null ? 0 : holding.getTotalCost()).sum();
        double target = Math.max(0, Math.min(100, rule.getPercentage() == null ? 0 : rule.getPercentage())) / 100;
        if (target >= 1) throw new IllegalArgumentException("The selected asset class has no capacity for this trade under the theme.");
        double allowedAmount = buy
                ? (target * totalCost - assetCost) / (1 - target)
                : (assetCost - target * totalCost) / (1 - target);
        if (allowedAmount <= 0) throw new IllegalArgumentException(buy ? "This asset class is not underweight." : "This asset class is not overweight.");
        if (amount > allowedAmount + 0.01) {
            throw new IllegalArgumentException("Trade exceeds the amount needed to return this asset class to its theme target (" + formatAmount(allowedAmount) + ").");
        }
        if (!buy && totalCost <= 0) throw new IllegalArgumentException("No invested holdings are available to sell.");
    }

    private double safeAmount(Double amount) { return amount == null ? 0 : amount; }
    private String formatAmount(double amount) { return String.format(java.util.Locale.ROOT, "%.2f", amount); }

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

