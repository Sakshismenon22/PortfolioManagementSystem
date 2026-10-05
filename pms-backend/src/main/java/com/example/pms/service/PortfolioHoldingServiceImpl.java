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
import java.util.HashMap;
import java.util.List;
import java.util.Map;

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
        double currentPrice = securityMasterService.getCurrentPrice(holding.getSecurityMaster().getId());
        requirePositivePrice(currentPrice);
        requireTradeWithinTheme(portfolio, holding.getAsset(), currentPrice * quantity, false);
        double averageCost = holding.getAverageCost() == null ? 0 : holding.getAverageCost();
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
    public String sellHoldingsBatch(List<SellHoldingDTO> orders) {
        if (orders == null || orders.isEmpty()) throw new IllegalArgumentException("Add at least one sell order.");
        if (orders.size() > 50) throw new IllegalArgumentException("A sell basket can contain at most 50 orders.");

        Map<Integer, Integer> quantityByHolding = new HashMap<>();
        Map<Integer, PortfolioHolding> holdingById = new HashMap<>();
        Portfolio portfolio = null;
        for (SellHoldingDTO order : orders) {
            if (order == null || order.getId() == null || order.getQuantity() == null || order.getQuantity() <= 0)
                throw new IllegalArgumentException("Every sell order needs a holding and a positive whole-share quantity.");
            PortfolioHolding holding = portfolioHoldingRepository.findById(order.getId()).orElseThrow(PortfolioHoldingNotFoundException::new);
            if (holding.getHoldingStatus() != HoldingStatus.BROUGHT || holding.getQuantityHeld() == null || holding.getQuantityHeld() <= 0)
                throw new IllegalArgumentException("Only currently held securities can be sold.");
            if (order.getQuantity() > holding.getQuantityHeld()) throw new IllegalArgumentException("Sell quantity cannot exceed shares currently held.");
            if (quantityByHolding.putIfAbsent(order.getId(), order.getQuantity()) != null)
                throw new IllegalArgumentException("A holding can appear only once in a sell basket.");
            Portfolio rowPortfolio = portfolioRepository.findById(holding.getPortfolio().getId()).orElseThrow(PortfolioNotFoundException::new);
            if (portfolio != null && !portfolio.getId().equals(rowPortfolio.getId()))
                throw new IllegalArgumentException("All sell orders must belong to the same portfolio.");
            portfolio = rowPortfolio;
            holdingById.put(order.getId(), holding);
        }
        requireActivePortfolio(portfolio);

        List<PortfolioHolding> active = portfolioHoldingRepository.findAllByPortfolio(portfolio).stream()
                .filter(h -> h.getHoldingStatus() == HoldingStatus.BROUGHT && h.getQuantityHeld() != null && h.getQuantityHeld() > 0)
                .toList();
        Map<Integer, Double> assetMarketValue = new HashMap<>();
        Map<Integer, Double> priceByHolding = new HashMap<>();
        double totalMarketValue = 0;
        for (PortfolioHolding holding : active) {
            double price = securityMasterService.getCurrentPrice(holding.getSecurityMaster().getId());
            requirePositivePrice(price);
            priceByHolding.put(holding.getId(), price);
            double marketValue = price * holding.getQuantityHeld();
            totalMarketValue += marketValue;
            if (holding.getAsset() != null) assetMarketValue.merge(holding.getAsset().getId(), marketValue, Double::sum);
        }
        Map<Integer, Double> selectedTarget = new HashMap<>();
        Map<Integer, Double> requestedMarketValue = new HashMap<>();
        for (Map.Entry<Integer, PortfolioHolding> entry : holdingById.entrySet()) {
            PortfolioHolding holding = entry.getValue();
            if (holding.getAsset() == null) throw new IllegalArgumentException("The selected holding has no asset class mapping.");
            AllocationRule rule = portfolio.getTheme().getAllocationRuleList().stream()
                    .filter(r -> r.getAsset() != null && r.getAsset().getId().equals(holding.getAsset().getId()))
                    .findFirst().orElseThrow(() -> new IllegalArgumentException("The selected asset class is not included in this theme."));
            selectedTarget.put(holding.getAsset().getId(), (rule.getPercentage() == null ? 0 : rule.getPercentage()) / 100.0);
            double price = priceByHolding.getOrDefault(holding.getId(), 0.0);
            requestedMarketValue.merge(holding.getAsset().getId(), price * quantityByHolding.get(entry.getKey()), Double::sum);
        }

        double capital = totalMarketValue + safeAmount(portfolio.getAmount());
        if (totalMarketValue <= 0 || capital <= 0) throw new IllegalArgumentException("No invested capital is available to rebalance.");
        for (Integer assetId : selectedTarget.keySet()) {
            double targetSale = assetMarketValue.getOrDefault(assetId, 0.0) - selectedTarget.get(assetId) * capital;
            if (targetSale <= 0 || requestedMarketValue.getOrDefault(assetId, 0.0) > targetSale + 0.01)
                throw new IllegalArgumentException("Sell quantities exceed the combined rebalance amount for one or more asset classes.");
        }

        double cashProceeds = 0;
        for (Map.Entry<Integer, PortfolioHolding> entry : holdingById.entrySet()) {
            PortfolioHolding holding = entry.getValue();
            int quantity = quantityByHolding.get(entry.getKey());
            double currentPrice = priceByHolding.get(holding.getId());
            double averageCost = safeAmount(holding.getAverageCost());
            int remaining = holding.getQuantityHeld() - quantity;
            cashProceeds += currentPrice * quantity;
            holding.setQuantityHeld(remaining);
            holding.setTotalCost(averageCost * remaining);
            holding.setUpdatedAt(LocalDate.now());
            if (remaining == 0) holding.setHoldingStatus(HoldingStatus.SOLD);
            portfolioHoldingRepository.save(holding);
        }
        portfolio.setAmount(safeAmount(portfolio.getAmount()) + cashProceeds);
        portfolioRepository.save(portfolio);
        return "Recorded " + orders.size() + " sell order(s) as one rebalance basket.";
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

    @Override
    @Transactional
    public String buySecuritiesBatch(List<BuyHoldingDTO> buyHoldingDTOList) {
        if (buyHoldingDTOList == null || buyHoldingDTOList.isEmpty()) {
            throw new IllegalArgumentException("Add at least one security to the purchase basket.");
        }
        if (buyHoldingDTOList.size() > 50) {
            throw new IllegalArgumentException("A purchase basket can contain at most 50 securities.");
        }
        Long portfolioId = buyHoldingDTOList.get(0).getPortfolioId();
        if (portfolioId == null) throw new IllegalArgumentException("Select a portfolio before buying.");
        Portfolio portfolio = portfolioRepository.findById(portfolioId).orElseThrow(PortfolioNotFoundException::new);
        requireActivePortfolio(portfolio);

        Map<Long, Integer> quantityBySecurity = new HashMap<>();
        Map<Long, SecurityMaster> securityById = new HashMap<>();
        Map<Long, Double> priceBySecurity = new HashMap<>();
        Map<Integer, Double> buyAmountByAsset = new HashMap<>();
        double totalBuyAmount = 0;

        for (BuyHoldingDTO order : buyHoldingDTOList) {
            if (order == null || order.getPortfolioId() == null || !portfolioId.equals(order.getPortfolioId())) {
                throw new IllegalArgumentException("All basket securities must belong to the same portfolio.");
            }
            if (order.getSecurityId() == null) throw new IllegalArgumentException("Choose a security for every basket row.");
            int quantity = order.getQuantity() == null ? 0 : order.getQuantity();
            if (quantity <= 0) throw new IllegalArgumentException("Every buy quantity must be a positive whole number.");

            SecurityMaster security = securityById.computeIfAbsent(order.getSecurityId(), securityId ->
                    securityMasterRepository.findById(securityId).orElseThrow(SecurityNotFoundException::new));
            Asset asset = security.getAsset();
            if (asset == null) throw new IllegalArgumentException("The selected security has no asset class mapping.");
            boolean themeIncludesAsset = portfolio.getTheme().getAllocationRuleList().stream()
                    .anyMatch(rule -> rule.getAsset() != null && rule.getAsset().getId().equals(asset.getId())
                            && rule.getPercentage() != null && rule.getPercentage() > 0);
            if (!themeIncludesAsset) {
                throw new IllegalArgumentException(security.getName() + " is outside the portfolio theme's asset classes.");
            }

            double currentPrice = priceBySecurity.computeIfAbsent(security.getId(), securityId ->
                    securityMasterService.getCurrentPrice(securityId));
            requirePositivePrice(currentPrice);
            int previousQuantity = quantityBySecurity.getOrDefault(security.getId(), 0);
            quantityBySecurity.put(security.getId(), Math.addExact(previousQuantity, quantity));
            double orderAmount = currentPrice * quantity;
            totalBuyAmount += orderAmount;
            buyAmountByAsset.merge(asset.getId(), orderAmount, Double::sum);
        }

        double availableCash = safeAmount(portfolio.getAmount());
        if (totalBuyAmount > availableCash + 0.01) {
            throw new IllegalArgumentException("Insufficient cash. Available " + formatAmount(availableCash)
                    + ", basket requires " + formatAmount(totalBuyAmount) + ".");
        }

        List<PortfolioHolding> activeHoldings = portfolioHoldingRepository.findAllByPortfolio(portfolio).stream()
                .filter(holding -> holding.getHoldingStatus() == HoldingStatus.BROUGHT
                        && holding.getQuantityHeld() != null && holding.getQuantityHeld() > 0)
                .toList();
        Map<Integer, Double> currentMarketValueByAsset = new HashMap<>();
        double currentMarketValue = 0;
        for (PortfolioHolding holding : activeHoldings) {
            double currentPrice = securityMasterService.getCurrentPrice(holding.getSecurityMaster().getId());
            requirePositivePrice(currentPrice);
            double marketValue = currentPrice * holding.getQuantityHeld();
            currentMarketValue += marketValue;
            if (holding.getAsset() != null) {
                currentMarketValueByAsset.merge(holding.getAsset().getId(), marketValue, Double::sum);
            }
        }
        double projectedCapital = currentMarketValue + safeAmount(portfolio.getAmount());
        if (projectedCapital <= 0) throw new IllegalArgumentException("The purchase basket has no invested value.");

        for (AllocationRule rule : portfolio.getTheme().getAllocationRuleList()) {
            if (rule.getAsset() == null) continue;
            int assetId = rule.getAsset().getId();
            double target = rule.getPercentage() == null ? 0 : rule.getPercentage();
            double projectedAssetAmount = currentMarketValueByAsset.getOrDefault(assetId, 0.0)
                    + buyAmountByAsset.getOrDefault(assetId, 0.0);
            double projectedPercentage = Math.round(projectedAssetAmount / projectedCapital * 10000.0) / 100.0;
            double drift = Math.round((projectedPercentage - target) * 100.0) / 100.0;
            if (Math.abs(drift) >= 5.0) {
                throw new IllegalArgumentException(rule.getAsset().getAssetClass() + " would remain outside the theme band after these buys (projected "
                        + String.format(java.util.Locale.ROOT, "%.2f", projectedPercentage) + "%, target "
                        + String.format(java.util.Locale.ROOT, "%.2f", target) + "%). Adjust the basket quantities.");
            }
        }

        for (Map.Entry<Long, Integer> entry : quantityBySecurity.entrySet()) {
            SecurityMaster security = securityById.get(entry.getKey());
            Asset asset = security.getAsset();
            int quantity = entry.getValue();
            double price = priceBySecurity.get(entry.getKey());
            double buyAmount = price * quantity;
            PortfolioHolding holding = portfolioHoldingRepository.findAllByPortfolio(portfolio).stream()
                    .filter(existing -> existing.getHoldingStatus() == HoldingStatus.BROUGHT
                            && existing.getQuantityHeld() != null && existing.getQuantityHeld() > 0
                            && existing.getSecurityMaster() != null
                            && existing.getSecurityMaster().getId().equals(security.getId()))
                    .findFirst()
                    .orElse(null);
            if (holding == null) {
                holding = new PortfolioHolding(null, portfolio, security, quantity, price, buyAmount,
                        asset, LocalDate.now(), LocalDate.now(), HoldingStatus.BROUGHT);
            } else {
                int newQuantity = holding.getQuantityHeld() + quantity;
                double newCost = safeAmount(holding.getTotalCost()) + buyAmount;
                holding.setQuantityHeld(newQuantity);
                holding.setTotalCost(newCost);
                holding.setAverageCost(newCost / newQuantity);
                holding.setUpdatedAt(LocalDate.now());
            }
            portfolioHoldingRepository.save(holding);
        }

        portfolio.setAmount(Math.max(0, availableCash - totalBuyAmount));
        portfolioRepository.save(portfolio);
        return "Recorded " + quantityBySecurity.size() + " security purchase(s) for " + formatAmount(totalBuyAmount) + ".";
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
        double totalMarketValue = 0;
        double assetMarketValue = 0;
        for (PortfolioHolding holding : activeHoldings) {
            double currentPrice = securityMasterService.getCurrentPrice(holding.getSecurityMaster().getId());
            requirePositivePrice(currentPrice);
            double marketValue = currentPrice * holding.getQuantityHeld();
            totalMarketValue += marketValue;
            if (holding.getAsset() != null && holding.getAsset().getId().equals(asset.getId())) {
                assetMarketValue += marketValue;
            }
        }
        double target = Math.max(0, Math.min(100, rule.getPercentage() == null ? 0 : rule.getPercentage())) / 100;
        if (target >= 1) throw new IllegalArgumentException("The selected asset class has no capacity for this trade under the theme.");
        double portfolioCapital = totalMarketValue + safeAmount(portfolio.getAmount());
        double allowedAmount = buy
                ? target * portfolioCapital - assetMarketValue
                : assetMarketValue - target * portfolioCapital;
        if (allowedAmount <= 0) throw new IllegalArgumentException(buy ? "This asset class is not underweight." : "This asset class is not overweight.");
        if (amount > allowedAmount + 0.01) {
            throw new IllegalArgumentException("Trade exceeds the amount needed to return this asset class to its theme target (" + formatAmount(allowedAmount) + ").");
        }
        if (!buy && totalMarketValue <= 0) throw new IllegalArgumentException("No invested holdings are available to sell.");
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

