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
import org.springframework.stereotype.Service;


import java.util.*;
import java.util.stream.Collectors;

import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;


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


    @Override
    public Portfolio createPortfolio(CreatePortfolioDTO createPortfolioDTO) {
        if(userRepository.existsById(createPortfolioDTO.getUserId())){
            if(themeRepository.existsById(createPortfolioDTO.getThemeId())){
                User user = userRepository.findById(createPortfolioDTO.getUserId()).get();
                Theme theme = themeRepository.findById(createPortfolioDTO.getThemeId()).get();
                Portfolio portfolio = new Portfolio(null,
                        createPortfolioDTO.getName(),
                        createPortfolioDTO.getPortfolioType(),
                        createPortfolioDTO.getCurrency(),
                        createPortfolioDTO.getBenchmark(),
                        createPortfolioDTO.getExchange(),
                        theme,
                        createPortfolioDTO.getReBalancingFrequency(),
                        createPortfolioDTO.getAmount(),
                        user,
                        createPortfolioDTO.getPortfolioStatus());

                return portfolioRepository.save(portfolio);

            }else{
                throw new ThemeNotFoundException();
            }
        }else{
            throw new UserNotFoundException();
        }
    }

    @Override
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

            List<AllocationRule> allocationRuleList = portfolio.getTheme().getAllocationRuleList();
            for(AllocationRule allocationRule:allocationRuleList){
                Double percent = percentageMap.get(allocationRule.getAsset().getId().toString());
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
    public String createAndActivatePortfolio(CreateAndActivatePortfolioDTO createAndActivatePortfolioDTO) {
        Portfolio portfolio = createPortfolio(createAndActivatePortfolioDTO.getCreatePortfolioDTO());
        for(AddPortfolioHoldingDTO addPortfolioHoldingDTO:createAndActivatePortfolioDTO.getAddPortfolioHoldingDTOList()){
            addPortfolioHoldingDTO.setPortfolioId(portfolio.getId());
            portfolioHoldingService.addPortfolioHolding(addPortfolioHoldingDTO);
        }
        return buyPortfolioHoldings(portfolio.getId());
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
    public GetAllPortfolioResponseDTO getAllPortfolioDetails(GetAllPortfolioDTO getAllPortfolioDTO) {
        if(userRepository.existsById(getAllPortfolioDTO.getUserId())){
            List<Portfolio> portfolios = portfolioRepository.findByUserUserId(getAllPortfolioDTO.getUserId());
            List<PortfolioDetailsDTO> portfolioDetailsDTOList = new ArrayList<>();
            for(Portfolio portfolio:portfolios){
                if(portfolio.getPortfolioStatus().equals(PortfolioStatus.ACTIVE)){
                    String initials = Arrays.stream(portfolio.getName().split(" ")).map((word)-> String.valueOf(word.charAt(0))).collect(Collectors.joining());
                    Double currentAum = getCurrentAum(portfolio);
                    Double totalInvestedAmount = getTotalInvestedAmount(portfolio);
                    Double return1Y = currentAum - totalInvestedAmount;
                    Double returnPercent = (return1Y/totalInvestedAmount) * 100;
                    String returnPercentString = returnPercent<0?"-"+returnPercent+"%":"+"+returnPercent+"%";

                    PortfolioDetailsDTO portfolioDetailsDTO = new PortfolioDetailsDTO(
                            portfolio.getId(),
                            initials,portfolio.getName(),
                            "PMS-0"+portfolio.getId(),
                            portfolio.getTheme().getName(),
                            portfolio.getPortfolioType().toString(),
                            currentAum,
                            returnPercentString,
                            portfolio.getBenchmark(),
                            portfolio.getPortfolioStatus(),
                            "View"
                    );
                    portfolioDetailsDTOList.add(portfolioDetailsDTO);
                }
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
                user.getUserId()
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
                        .findAllByPortfolio(portfolio);

        double totalInvested = holdings.stream()
                .mapToDouble(h ->
                        h.getTotalCost() != null
                                ? h.getTotalCost()
                                : 0.0
                )
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
                            totalCost,
                            Math.round(allocation * 100.0)
                                    / 100.0
                    );
                })
                .toList();
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
                .mapToDouble(h ->
                        h.getTotalCost() != null
                                ? h.getTotalCost()
                                : 0.0
                )
                .sum();


        Map<Integer, Double> assetAmountMap =
                new HashMap<>();

        Map<Integer, Integer> assetHoldingCount =
                new HashMap<>();

        for (PortfolioHolding holding : holdings) {

            Integer assetId =
                    holding.getAsset().getId();

            Double amount =
                    holding.getTotalCost() != null
                            ? holding.getTotalCost()
                            : 0.0;

            assetAmountMap.put(
                    assetId,
                    assetAmountMap.getOrDefault(
                            assetId,
                            0.0
                    ) + amount
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
                    totalInvested == 0
                            ? 0.0
                            : (invested /
                            totalInvested) * 100;

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
                getCurrentAum(portfolio),
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

