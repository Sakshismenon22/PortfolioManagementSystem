package com.example.pms.service;

import com.example.pms.client.SecurityMasterClient;
import com.example.pms.dto.request.CreateAndActivatePortfolioDTO;
import com.example.pms.dto.request.AddPortfolioHoldingDTO;
import com.example.pms.dto.request.CreatePortfolioDTO;
import com.example.pms.dto.request.GetAllPortfolioDTO;
import com.example.pms.dto.response.GetAllPortfolioResponseDTO;
import com.example.pms.dto.response.PortfolioDetailsDTO;
import com.example.pms.dto.response.SecurityPriceDTO;
import com.example.pms.dto.response.ValidationDTO;
import com.example.pms.exception.PortfolioNotFoundException;
import com.example.pms.exception.ThemeNotFoundException;
import com.example.pms.exception.UserNotFoundException;
import com.example.pms.model.*;
import com.example.pms.model.enums.PortfolioStatus;
import com.example.pms.model.enums.SecurityType;
import com.example.pms.repository.PortFolioHoldingRepository;
import com.example.pms.repository.PortfolioRepository;
import com.example.pms.repository.ThemeRepository;
import com.example.pms.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PortfolioServiceImpl implements PortfolioService{

    private final UserRepository userRepository;
    private final ThemeRepository themeRepository;
    private final PortfolioRepository portfolioRepository;
    private final PortFolioHoldingRepository portfolioHoldingRepository;
    private final PortfolioHoldingService portfolioHoldingService;
    private final SecurityMasterClient securityMasterClient;


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

    public Double getTotalInvestedAmount(Portfolio portfolio){
        List<PortfolioHolding> portfolioHoldings = portfolioHoldingRepository.findAllByPortfolio(portfolio);
        Double totalInvestedAmount = 0.0d;
        for(PortfolioHolding portfolioHolding:portfolioHoldings){
            totalInvestedAmount += portfolioHolding.getTotalCost();
        }
        return totalInvestedAmount+portfolio.getAmount();
    }
}

