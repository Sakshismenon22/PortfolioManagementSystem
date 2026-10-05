package com.example.pms.service;

import com.example.pms.client.SecurityMasterClient;
import com.example.pms.dto.request.*;
import com.example.pms.dto.response.*;
import com.example.pms.exception.PortfolioNotFoundException;
import com.example.pms.exception.ThemeNotFoundException;
import com.example.pms.exception.UserNotFoundException;
import com.example.pms.model.*;
import com.example.pms.model.enums.HoldingStatus;
import com.example.pms.model.enums.PortfolioStatus;
import com.example.pms.model.enums.SecurityType;
import com.example.pms.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


import java.util.*;
import java.util.stream.Collectors;

import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.time.LocalDate;


@Slf4j
@Service
@RequiredArgsConstructor
public class PortfolioServiceImpl implements PortfolioService{

    private final UserRepository userRepository;
    private final ThemeRepository themeRepository;
    private final PortfolioRepository portfolioRepository;
    private final PortFolioHoldingRepository portfolioHoldingRepository;
    private final PortfolioHoldingService portfolioHoldingService;
    private final SecurityMasterClient securityMasterClient;

    private final AssetRepository assetRepository;
    private final DriftWatchListRepository driftWatchListRepository;
    private final DriftDetectionRepository driftDetectionRepository;
    private final NotificationRepository notificationRepository;
    private final SecurityMasterService securityMasterService;
    private final SecurityMasterRepository securityMasterRepository;

    private static final List<String> DEMO_PORTFOLIO_NAMES = List.of(
            "DEMO 1Y | Equity overweight",
            "DEMO 1Y | Commodities overweight",
            "DEMO 1Y | Balanced control"
    );


    @Override
    public Portfolio createPortfolio(CreatePortfolioDTO createPortfolioDTO) {
        if(userRepository.existsById(createPortfolioDTO.getUserId())){
            if(themeRepository.existsById(createPortfolioDTO.getThemeId())){
                User user = userRepository.findById(createPortfolioDTO.getUserId()).get();
                Theme theme = themeRepository.findById(createPortfolioDTO.getThemeId()).get();
                Portfolio portfolio = new Portfolio();
                portfolio.setName(createPortfolioDTO.getName());
                portfolio.setPortfolioType(createPortfolioDTO.getPortfolioType());
                portfolio.setCurrency(createPortfolioDTO.getCurrency());
                portfolio.setBenchmark(createPortfolioDTO.getBenchmark());
                portfolio.setExchange(createPortfolioDTO.getExchange());
                portfolio.setTheme(theme);
                portfolio.setReBalancingFrequency(createPortfolioDTO.getReBalancingFrequency());
                portfolio.setAmount(createPortfolioDTO.getAmount());
                portfolio.setUser(user);
                portfolio.setPortfolioStatus(createPortfolioDTO.getPortfolioStatus());
                portfolio.setCreatedAt(createPortfolioDTO.getCreatedAt() == null
                        ? LocalDate.now() : createPortfolioDTO.getCreatedAt());

                return portfolioRepository.save(portfolio);

            }else{
                throw new ThemeNotFoundException();
            }
        }else{
            throw new UserNotFoundException();
        }
    }

    @Override
    @Transactional
    public String buyPortfolioHoldings(Long id) {
        if(portfolioRepository.existsById(id)){
            ValidationDTO validationDTO = isValid(id);
            if(validationDTO.getIsValid()){
                Portfolio portfolio = portfolioRepository.findById(id).get();
                if(validationDTO.getGrantTotal()<=portfolio.getAmount()){

                    List<PortfolioHolding> portfolioHoldings = portfolioHoldingRepository.findAllByPortfolio(portfolio);
                    for(PortfolioHolding portfolioHolding:portfolioHoldings){
                        portfolioHoldingService.buyHoldings(portfolioHolding);
                    }
                    Double remainingAmount = portfolio.getAmount()-validationDTO.getGrantTotal();
                    portfolio.setAmount(remainingAmount);
                    portfolio.setPortfolioStatus(PortfolioStatus.ACTIVE);
                    portfolioRepository.save(portfolio);
                    if (driftWatchListRepository.findAllByPortfolioId(portfolio.getId()) == null) {
                        driftWatchListRepository.save(DriftSchedule.newWatchList(portfolio, LocalDate.now()));
                    }
                    return "Portfolio Holdings Brought.";
                }else{
                    return "Portfolio Balance is insufficient";
                }
            }else{
                return "Validation Failed";
            }
        }else{
            throw new PortfolioNotFoundException();
        }

    }

    @Override
    public ValidationDTO isValid(Long id) {
        if(portfolioRepository.existsById(id)){
            Portfolio portfolio = portfolioRepository.findById(id).get();
            List<PortfolioHolding> portfolioHoldings = portfolioHoldingRepository.findAllByPortfolio(portfolio);
            HashMap<String,Double> map = new HashMap<>();
            for(PortfolioHolding portfolioHolding:portfolioHoldings){
                String type = portfolioHolding.getAsset().getId().toString();
                Double totalCost = portfolioHoldingService.getTotalCost(portfolioHolding);
                map.put(type,map.getOrDefault(type,0.0d)+totalCost);
            }

            double grandTotal = map.values().stream().mapToDouble(Double::doubleValue).sum();

            Map<String, Double> percentageMap = new LinkedHashMap<>();
            map.forEach((type, amount) -> {
                double pct = (grandTotal == 0) ? 0.0 : (amount / grandTotal) * 100;
                percentageMap.put(type, Math.round(pct * 100.0) / 100.0);
            });
            log.info("Amount map: "+map.toString());
            List<AllocationRule> allocationRuleList = portfolio.getTheme().getAllocationRuleList();
            log.info(allocationRuleList.toString());
            for(AllocationRule allocationRule:allocationRuleList){
                log.info("Percentage Map :"+percentageMap.toString());
                Double percent = percentageMap.get(allocationRule.getAsset().getId().toString());
                if(percent==null){
                    log.info("Percent is null for allocation: "+allocationRule.toString());
                }else{
                    log.info("Percent Asset id: "+allocationRule.getAsset().getId().toString());
                }
                Double drift = Math.abs(percent-allocationRule.getPercentage());
                if(drift>=5){
                    return new ValidationDTO(false,map,percentageMap,grandTotal);
                }
            }
            return new ValidationDTO(true,map,percentageMap,grandTotal);

        }else{
            throw new PortfolioNotFoundException();
        }
    }

    @Override
    @Transactional
    public String createAndActivatePortfolio(CreateAndActivatePortfolioDTO createAndActivatePortfolioDTO) {
        Portfolio portfolio = createPortfolio(createAndActivatePortfolioDTO.getCreatePortfolioDTO());
        for(AddPortfolioHoldingDTO addPortfolioHoldingDTO:createAndActivatePortfolioDTO.getAddPortfolioHoldingDTOList()){
            addPortfolioHoldingDTO.setPortfolioId(portfolio.getId());
            portfolioHoldingService.addPortfolioHolding(addPortfolioHoldingDTO);
        }
        return buyPortfolioHoldings(portfolio.getId());
    }

    @Override
    @Transactional
    public String createDemoPortfolios(Integer userId) {
        User user = userRepository.findById(userId).orElseThrow(UserNotFoundException::new);
        Set<String> existingNames = new HashSet<>();
        portfolioRepository.findByUserUserId(userId).stream()
                .map(Portfolio::getName)
                .filter(DEMO_PORTFOLIO_NAMES::contains)
                .forEach(existingNames::add);

        Theme theme = themeRepository.findAll().stream()
                .filter(candidate -> candidate.getAllocationRuleList() != null
                        && candidate.getAllocationRuleList().stream().anyMatch(rule -> rule.getAsset() != null
                        && "equity".equalsIgnoreCase(rule.getAsset().getAssetClass()))
                        && candidate.getAllocationRuleList().stream().anyMatch(rule -> rule.getAsset() != null
                        && "commodities".equalsIgnoreCase(rule.getAsset().getAssetClass())))
                .findFirst().orElseThrow(() -> new IllegalArgumentException(
                        "Create a theme containing Equity and Commodities before adding demo portfolios."));
        Asset equity = theme.getAllocationRuleList().stream().map(AllocationRule::getAsset)
                .filter(Objects::nonNull).filter(asset -> "equity".equalsIgnoreCase(asset.getAssetClass())).findFirst().orElseThrow();
        Asset commodities = theme.getAllocationRuleList().stream().map(AllocationRule::getAsset)
                .filter(Objects::nonNull).filter(asset -> "commodities".equalsIgnoreCase(asset.getAssetClass())).findFirst().orElseThrow();
        SecurityMaster equitySecurity = securityMasterRepository.findAll().stream()
                .filter(security -> "INFY".equalsIgnoreCase(security.getSymbol())).findFirst()
                .orElseThrow(() -> new IllegalArgumentException("INFY demo security is not available."));
        SecurityMaster commoditySecurity = securityMasterRepository.findAll().stream()
                .filter(security -> "GOLD".equalsIgnoreCase(security.getSymbol())).findFirst()
                .orElseThrow(() -> new IllegalArgumentException("GOLD demo security is not available."));
        double equityPrice = securityMasterService.getCurrentPrice(equitySecurity.getId());
        double commodityPrice = securityMasterService.getCurrentPrice(commoditySecurity.getId());
        if (equityPrice <= 0 || commodityPrice <= 0) throw new IllegalArgumentException("Live demo security prices are unavailable.");

        LocalDate createdAt = LocalDate.now().minusYears(1);
        int created = 0;
        double[][] samples = {{80, 20}, {60, 40}, {70, 30}};
        for (int index = 0; index < DEMO_PORTFOLIO_NAMES.size(); index++) {
            String name = DEMO_PORTFOLIO_NAMES.get(index);
            if (existingNames.contains(name)) continue;
            int equityQuantity = (int) Math.floor(100_000_000.0 * samples[index][0] / 100 / equityPrice);
            int commodityQuantity = (int) Math.floor(100_000_000.0 * samples[index][1] / 100 / commodityPrice);
            double equityCost = equityQuantity * equityPrice;
            double commodityCost = commodityQuantity * commodityPrice;

            Portfolio portfolio = new Portfolio();
            portfolio.setName(name);
            portfolio.setPortfolioType(com.example.pms.model.enums.PortfolioType.WEIGHTAGE);
            portfolio.setCurrency("INR");
            portfolio.setBenchmark(com.example.pms.model.enums.Benchmark.NIFTY_50);
            portfolio.setExchange(com.example.pms.model.enums.Exchange.NSE);
            portfolio.setTheme(theme);
            portfolio.setReBalancingFrequency(com.example.pms.model.enums.ReBalancingFrequency.MONTHLY);
            portfolio.setAmount(0.0);
            portfolio.setUser(user);
            portfolio.setPortfolioStatus(PortfolioStatus.ACTIVE);
            portfolio.setCreatedAt(createdAt);
            portfolio = portfolioRepository.save(portfolio);

            portfolioHoldingRepository.save(new PortfolioHolding(null, portfolio, equitySecurity, equityQuantity,
                    equityPrice, equityCost, equity, createdAt, createdAt, HoldingStatus.BROUGHT));
            portfolioHoldingRepository.save(new PortfolioHolding(null, portfolio, commoditySecurity, commodityQuantity,
                    commodityPrice, commodityCost, commodities, createdAt, createdAt, HoldingStatus.BROUGHT));
            driftWatchListRepository.save(DriftSchedule.newWatchList(portfolio, LocalDate.now()));

            double invested = equityCost + commodityCost;
            for (AllocationRule rule : theme.getAllocationRuleList()) {
                if (rule.getAsset() == null || rule.getPercentage() == null || invested == 0) continue;
                double amount = rule.getAsset().getId().equals(equity.getId()) ? equityCost
                        : rule.getAsset().getId().equals(commodities.getId()) ? commodityCost : 0;
                double drift = Math.round((amount / invested * 100 - rule.getPercentage()) * 100.0) / 100.0;
                if (Math.abs(drift) >= 5.0) {
                    driftDetectionRepository.save(new DriftDetection(null, portfolio.getId(), rule.getAsset().getId(), LocalDate.now(), drift));
                }
            }
            created++;
        }
        return created == 0 ? "The three demo portfolios already exist." : "Added " + created + " one-year demo portfolios.";
    }

    @Override
    @Transactional
    public String deleteDemoPortfolios(Integer userId) {
        userRepository.findById(userId).orElseThrow(UserNotFoundException::new);
        List<Portfolio> demos = portfolioRepository.findByUserUserId(userId).stream()
                .filter(portfolio -> DEMO_PORTFOLIO_NAMES.contains(portfolio.getName())).toList();
        for (Portfolio portfolio : demos) {
            notificationRepository.deleteByPortfolioId(portfolio.getId());
            driftDetectionRepository.deleteByPortfolioId(portfolio.getId());
            driftWatchListRepository.deleteByPortfolioId(portfolio.getId());
            portfolioHoldingRepository.deleteAllByPortfolio(portfolio);
            portfolioRepository.delete(portfolio);
        }
        return "Removed " + demos.size() + " demo portfolio(s).";
    }

    public Integer getCountOfPortfolios(Integer userId) {
        Integer count=0;
        if(userRepository.existsById(userId)){
            List<Portfolio> portfolios = portfolioRepository.findByUserUserId(userId);
            for(Portfolio portfolio: portfolios){
                count++;
            }

        }else{
            throw new UserNotFoundException();
        }
        return count;
    }

    public Integer getCountOfActivePortfolios(Integer userId){
        Integer count = 0;

        if(userRepository.existsById(userId)){
            List<Portfolio> portfolios = portfolioRepository.findByUserUserId(userId);
            for(Portfolio portfolio : portfolios){
                if(portfolio.getPortfolioStatus() == PortfolioStatus.ACTIVE){
                    count++;
                }
            }
        }else{
            throw new UserNotFoundException();
        }

        return count;

    }

    @Override
    @Cacheable(value = "portfolio",key = "'getAllPortfolios'")
    public GetAllPortfolioResponseDTO getAllPortfolioDetails(GetAllPortfolioDTO getAllPortfolioDTO) {
        if(userRepository.existsById(getAllPortfolioDTO.getUserId())){
            List<Portfolio> portfolios = portfolioRepository.findByUserUserId(getAllPortfolioDTO.getUserId());
            List<PortfolioDetailsDTO> portfolioDetailsDTOList = new ArrayList<>();
            for(Portfolio portfolio:portfolios){
                String initials = Arrays.stream(portfolio.getName().trim().split("\\s+"))
                        .filter(word -> !word.isBlank())
                        .map(word -> String.valueOf(word.charAt(0)))
                        .limit(2)
                        .collect(Collectors.joining());
                Double currentAum = getCurrentAum(portfolio);
                Double totalInvestedAmount = getTotalInvestedAmount(portfolio);
                Double returnAmount = currentAum - totalInvestedAmount;
                Double returnPercent = totalInvestedAmount > 0 ? (returnAmount / totalInvestedAmount) * 100 : 0.0d;
                String returnPercentString = String.format(java.util.Locale.ROOT, "%+.2f%%", returnPercent);

                PortfolioDetailsDTO portfolioDetailsDTO = new PortfolioDetailsDTO(
                        portfolio.getId(),
                        initials,
                        portfolio.getName(),
                        "PMS-0" + portfolio.getId(),
                        portfolio.getTheme() == null ? null : portfolio.getTheme().getName(),
                        portfolio.getPortfolioType() == null ? null : portfolio.getPortfolioType().toString(),
                        currentAum,
                        returnPercentString,
                        portfolio.getBenchmark(),
                        portfolio.getPortfolioStatus(),
                        "View"
                );
                portfolioDetailsDTOList.add(portfolioDetailsDTO);
            }
            return new GetAllPortfolioResponseDTO(portfolioDetailsDTOList);
        }else{
            throw new UserNotFoundException();
        }
    }

    public Double getCurrentAum(Portfolio portfolio){
        List<PortfolioHolding> portfolioHoldings = portfolioHoldingRepository.findAllByPortfolio(portfolio);
        Double currentAum = 0.0d;
        for(PortfolioHolding portfolioHolding:portfolioHoldings){
            SecurityPriceDTO  securityPriceDTO = securityMasterClient.findBySecurityId(portfolioHolding.getSecurityMaster().getId()).get();
            SecurityType type = securityPriceDTO.getSecurityMaster().getSecurityType();
            switch (type){
                case ETF,EQUITY->{
                    Double currentPrice = securityPriceDTO.getStockData().getClosePrice().doubleValue();
                    Double holdingWorth = currentPrice * portfolioHolding.getQuantityHeld();
                    currentAum += holdingWorth;
                }

                case MUTUAL_FUND -> {
                    Double currentPrice = securityPriceDTO.getMutualFundNav().getNav().doubleValue();
                    Double holdingWorth = currentPrice * portfolioHolding.getQuantityHeld();
                    currentAum += holdingWorth;
                }

                case BOND -> {
                    Double currentPrice = securityPriceDTO.getBond().getFaceValue().doubleValue();
                    Double holdingWorth = currentPrice * portfolioHolding.getQuantityHeld();
                    currentAum += holdingWorth;
                }

                case COMMODITY -> {
                    Double currentPrice = securityPriceDTO.getCommoditySpotData().getSpotPrice().doubleValue();
                    Double holdingWorth = currentPrice * portfolioHolding.getQuantityHeld();
                    currentAum += holdingWorth;
                }
            }

        }
        return currentAum+portfolio.getAmount();
    }

    public Double getTotalInvestedAmount(Portfolio portfolio) {
        List<PortfolioHolding> portfolioHoldings = portfolioHoldingRepository.findAllByPortfolio(portfolio);
        Double totalInvestedAmount = 0.0d;
        for (PortfolioHolding portfolioHolding : portfolioHoldings) {
            if(portfolioHolding.getHoldingStatus().equals(HoldingStatus.BROUGHT)){
                totalInvestedAmount += portfolioHolding.getTotalCost();
            }
        }
        return totalInvestedAmount + portfolio.getAmount();
    }


    @Override
    public Double getTotalRemainingAmount(Integer userId){
        Double totalRemainingAmount = Double.valueOf(0);

        if(userRepository.existsById(userId)){
            List<Portfolio> portfolios = portfolioRepository.findByUserUserId(userId);
            for(Portfolio portfolio : portfolios){
                totalRemainingAmount += portfolio.getAmount();
            }
        }else{
            throw new UserNotFoundException();
        }

        return totalRemainingAmount;



    }

    @Override
    public Portfolio getPortfolioDetails(Long id, Integer userId){
        Portfolio portfolio = new Portfolio();
        if(userRepository.existsById(userId)){
            if(portfolioRepository.existsById(id)){
                 portfolio = portfolioRepository.findById(id).get();
            }
            else{
                throw new PortfolioNotFoundException();
            }
        }else{
            throw new UserNotFoundException();
        }

        return portfolio;
    }

    @Override
    public PortfolioBasicInfoDTO getPortfolioBasicInfo(
            Long portfolioId,
            Integer userId
    ) {

        User user = userRepository.findById(userId)
                .orElseThrow(UserNotFoundException::new);

        Portfolio portfolio = portfolioRepository
                .findById(portfolioId)
                .orElseThrow(PortfolioNotFoundException::new);

        if (!portfolio.getUser().getUserId().equals(user.getUserId())) {
            throw new RuntimeException("Unauthorized portfolio access");
        }

        Theme theme = portfolio.getTheme();

        return new PortfolioBasicInfoDTO(
                portfolio.getId(),
                portfolio.getName(),
                portfolio.getPortfolioType(),
                portfolio.getCurrency(),
                portfolio.getBenchmark(),
                portfolio.getExchange(),
                theme != null ? Long.valueOf(theme.getId()) : null,
                theme != null ? theme.getName() : null,
                portfolio.getReBalancingFrequency(),
                portfolio.getAmount(),
                portfolio.getPortfolioStatus(),
                user.getUserId(),
                portfolio.getCreatedAt()
        );
    }

    @Override
    public ThemeAllocationDTO getThemeAllocation(
            Long portfolioId,
            Integer userId
    ) {

        Portfolio portfolio = getUserPortfolio(
                portfolioId,
                userId
        );

        Theme theme = portfolio.getTheme();

        if (theme == null) {
            throw new ThemeNotFoundException();
        }

        List<AllocationRuleDTO> rules =
                theme.getAllocationRuleList()
                        .stream()
                        .map(rule -> {

                            Asset asset = rule.getAsset();

                            return new AllocationRuleDTO(
                                    rule.getId(),
                                    asset.getId(),
                                    asset.getAssetClass(),
                                    asset.getAssetSubclass(),
                                    asset.getDescription(),
                                    rule.getPercentage()
                            );
                        })
                        .toList();

        return new ThemeAllocationDTO(
                Long.valueOf(theme.getId()),
                theme.getName(),
                theme.getRisk() != null
                        ? theme.getRisk().toString()
                        : null,
                theme.getInvestmentHorizon() != null
                        ? theme.getInvestmentHorizon().toString()
                        : null,
                rules
        );
    }

    private Portfolio getUserPortfolio(
            Long portfolioId,
            Integer userId
    ) {

        User user = userRepository.findById(userId)
                .orElseThrow(UserNotFoundException::new);

        Portfolio portfolio = portfolioRepository
                .findById(portfolioId)
                .orElseThrow(PortfolioNotFoundException::new);

        if (!portfolio.getUser().getUserId()
                .equals(user.getUserId())) {

            throw new RuntimeException(
                    "Unauthorized portfolio access"
            );
        }

        return portfolio;
    }

    @Override
    public List<PortfolioHoldingDTO> getPortfolioHoldings(
            Long portfolioId,
            Integer userId
    ) {

        Portfolio portfolio =
                getUserPortfolio(
                        portfolioId,
                        userId
                );

        List<PortfolioHolding> holdings =
                portfolioHoldingRepository
                        .findAllByPortfolio(portfolio).stream()
                        .filter(h -> h.getHoldingStatus() == HoldingStatus.BROUGHT
                                && h.getQuantityHeld() != null && h.getQuantityHeld() > 0)
                        .toList();

        // Only active, actually-held positions belong on the portfolio details
        // screen. Sold and not-yet-purchased draft rows are ledger history.
        holdings = holdings.stream()
                .filter(holding -> holding.getHoldingStatus() == HoldingStatus.BROUGHT
                        && holding.getQuantityHeld() != null && holding.getQuantityHeld() > 0)
                .toList();

        double totalInvested = holdings.stream()
                .filter(h -> h.getHoldingStatus() == HoldingStatus.BROUGHT
                        && h.getQuantityHeld() != null && h.getQuantityHeld() > 0)
                .mapToDouble(h -> h.getTotalCost() != null ? h.getTotalCost() : 0.0)
                .sum();

        return holdings.stream()
                .map(holding -> {

                    double totalCost =
                            holding.getTotalCost() != null
                                    ? holding.getTotalCost()
                                    : 0.0;

                    double allocation =
                            totalInvested == 0
                                    ? 0
                                    : (totalCost /
                                    totalInvested) * 100;

                    SecurityMaster security =
                            holding.getSecurityMaster();
                    double currentValue = getHoldingCurrentValue(holding, totalCost);

                    return new PortfolioHoldingDTO(
                            holding.getId(),
                            security.getId(),
                            security.getSymbol(),
                            security.getName(),
                            holding.getAsset().getId(),
                            holding.getAsset().getAssetClass(),
                            holding.getQuantityHeld(),
                            holding.getAverageCost(),
                            totalCost,
                            currentValue,
                            Math.round(allocation * 100.0)
                                    / 100.0,
                            holding.getFirstBuyDate()
                    );
                })
                .toList();
    }

    private double getHoldingCurrentValue(PortfolioHolding holding, double fallbackValue) {
        try {
            SecurityPriceDTO price = securityMasterClient
                    .findBySecurityId(holding.getSecurityMaster().getId())
                    .orElse(null);
            if (price == null || price.getSecurityMaster() == null) {
                return fallbackValue;
            }

            Double unitPrice = switch (price.getSecurityMaster().getSecurityType()) {
                case ETF, EQUITY -> price.getStockData() != null && price.getStockData().getClosePrice() != null
                        ? price.getStockData().getClosePrice().doubleValue() : null;
                case MUTUAL_FUND -> price.getMutualFundNav() != null && price.getMutualFundNav().getNav() != null
                        ? price.getMutualFundNav().getNav().doubleValue() : null;
                case BOND -> price.getBond() != null
                        ? (price.getBond().getCleanPrice() != null ? price.getBond().getCleanPrice() : price.getBond().getFaceValue()) : null;
                case COMMODITY -> price.getCommoditySpotData() != null && price.getCommoditySpotData().getSpotPrice() != null
                        ? price.getCommoditySpotData().getSpotPrice().doubleValue() : null;
            };
            return unitPrice == null ? fallbackValue : unitPrice * holding.getQuantityHeld();
        } catch (RuntimeException exception) {
            // Keep holdings visible if the market data service is temporarily unavailable.
            return fallbackValue;
        }
    }

    @Override
    public AllocationValidationDTO validatePortfolioAllocation(
            Long portfolioId,
            Integer userId
    ) {

        Portfolio portfolio =
                getUserPortfolio(
                        portfolioId,
                        userId
                );

        List<PortfolioHolding> holdings =
                portfolioHoldingRepository
                        .findAllByPortfolio(portfolio);


        double totalInvested = holdings.stream()
                .filter(h -> h.getHoldingStatus() == HoldingStatus.BROUGHT
                        && h.getQuantityHeld() != null && h.getQuantityHeld() > 0)
                .mapToDouble(h ->
                        h.getTotalCost() != null
                                ? h.getTotalCost()
                                : 0.0
                )
                .sum();

        double totalMarketValue = 0.0;


        Map<Integer, Double> assetAmountMap =
                new HashMap<>();

        Map<Integer, Integer> assetHoldingCount =
                new HashMap<>();

        for (PortfolioHolding holding : holdings) {
            if (holding.getHoldingStatus() != HoldingStatus.BROUGHT
                    || holding.getQuantityHeld() == null || holding.getQuantityHeld() <= 0) continue;

            double marketValue = getHoldingCurrentValue(holding,
                    holding.getTotalCost() == null ? 0.0 : holding.getTotalCost());
            totalMarketValue += marketValue;
            if (holding.getAsset() == null) continue;
            Integer assetId = holding.getAsset().getId();

            assetAmountMap.put(
                    assetId,
                    assetAmountMap.getOrDefault(
                            assetId,
                            0.0
                    ) + marketValue
            );

            assetHoldingCount.put(
                    assetId,
                    assetHoldingCount.getOrDefault(
                            assetId,
                            0
                    ) + 1
            );
        }


        List<AssetAllocationValidationDTO> result =
                new ArrayList<>();

        boolean portfolioValid = true;
        double allocationCapital = totalMarketValue
                + (portfolio.getAmount() == null ? 0.0 : portfolio.getAmount());

        for (AllocationRule rule :
                portfolio.getTheme()
                        .getAllocationRuleList()) {

            Asset asset = rule.getAsset();

            Integer assetId = asset.getId();

            double target =
                    rule.getPercentage() != null
                            ? rule.getPercentage()
                            : 0.0;

            double invested =
                    assetAmountMap.getOrDefault(
                            assetId,
                            0.0
                    );

            double current =
                    allocationCapital == 0
                            ? 0.0
                            : (invested / allocationCapital) * 100;

            current =
                    Math.round(current * 100.0)
                            / 100.0;

            double drift =
                    current - target;

            drift =
                    Math.round(drift * 100.0)
                            / 100.0;


            boolean satisfied =
                    Math.abs(drift) < 5.0;

            if (!satisfied) {
                portfolioValid = false;
            }

            result.add(
                    new AssetAllocationValidationDTO(
                            assetId,
                            asset.getAssetClass(),
                            target,
                            current,
                            drift,
                            satisfied,
                            assetHoldingCount
                                    .getOrDefault(
                                            assetId,
                                            0
                                    )
                    )
            );
        }

        return new AllocationValidationDTO(
                portfolio.getId(),
                portfolio.getName(),
                totalInvested,
                allocationCapital,
                portfolioValid,
                result
        );
    }

    @Override
    public AssetInvestmentDTO getEachAssetInvestment(Integer userId) {

        if (!userRepository.existsById(userId)) {
            throw new UserNotFoundException();
        }

        // Accumulates the merged asset-wise amounts across ALL portfolios
        Map<Asset, Double> assetInvestmentMap = new LinkedHashMap<>();
        Double totalBalance = 0.0d;

        List<Portfolio> portfolios = portfolioRepository.findByUserUserId(userId);

        for (Portfolio portfolio : portfolios) {

            ValidationDTO validation = isValid(portfolio.getId());   // :: NOTE: you must pass portfolio id, not user id

            validation.getAssetWiseAmount().forEach((assetClass, amount) -> {
                // assetClass is a String, e.g. "Equity" / "Bonds" / "REITs"
                Asset asset = assetRepository.findByAssetClass(assetClass);
                assetInvestmentMap.merge(asset, amount, Double::sum);
            });

            // 2. Accumulate balance
            totalBalance += validation.getGrantTotal();
        }

        return new AssetInvestmentDTO(assetInvestmentMap, totalBalance);
    }

}

