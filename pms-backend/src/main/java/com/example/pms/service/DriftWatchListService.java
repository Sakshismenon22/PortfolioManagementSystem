package com.example.pms.service;

import com.example.pms.dto.response.AllocationValidationDTO;
import com.example.pms.dto.response.AssetAllocationValidationDTO;
import com.example.pms.model.DriftDetection;
import com.example.pms.model.DriftWatchList;
import com.example.pms.model.Portfolio;
import com.example.pms.model.User;
import com.example.pms.model.enums.PortfolioStatus;
import com.example.pms.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DriftWatchListService {

    private final UserRepository userRepository;
    private final PortfolioRepository portfolioRepository;
    private final PortFolioHoldingRepository portFolioHoldingRepository;
    private final PortfolioService portfolioService;
    private final DriftDetectionRepository driftDetectionRepository;
    private final DriftWatchListRepository driftWatchListRepository;


    @Scheduled(cron = "0 46 15 * * MON-FRI",
            zone = "Asia/Kolkata")
    public void doDriftCalculation(){
        List<User> userList = userRepository.findAll();
        for(User user:userList){
            List<Portfolio> portfolios = portfolioRepository.findByUserUserId(user.getUserId());
            for(Portfolio portfolio:portfolios){

                DriftWatchList driftWatchList = driftWatchListRepository.findAllByPortfolioId(portfolio.getId());
                if(driftWatchList!=null && driftWatchList.getNextDriftCalculationDate().equals(LocalDate.now())&&portfolio.getPortfolioStatus().equals(PortfolioStatus.ACTIVE)){
                    performPortfolioDriftCalculation(portfolio.getId(),user.getUserId());
                    driftWatchList.setLastDriftCalculatedAt(driftWatchList.getNextDriftCalculationDate());
                    switch(driftWatchList.getReBalancingFrequency()){
                        case DAILY -> {
                            driftWatchList.setNextDriftCalculationDate(LocalDate.now().plusDays(1));
                        }
                        case WEEKLY -> {
                            driftWatchList.setNextDriftCalculationDate(LocalDate.now().plusWeeks(1));
                        }
                        case MONTHLY -> {
                            driftWatchList.setNextDriftCalculationDate(LocalDate.now().plusMonths(1));
                        }
                        case YEARLY -> {
                            driftWatchList.setNextDriftCalculationDate(LocalDate.now().plusMonths(12));
                        }
                        case QUARTERLY -> {
                            driftWatchList.setNextDriftCalculationDate(LocalDate.now().plusMonths(3));
                        }
                        case SEMI_ANNUAL -> {
                            driftWatchList.setNextDriftCalculationDate(LocalDate.now().plusMonths(6));
                        }
                    }

                    driftWatchListRepository.save(driftWatchList);

                }
            }
        }
    }

    public String performPortfolioDriftCalculation(Long portfolioId,Integer userId){
        AllocationValidationDTO allocationValidationDTO = portfolioService.validatePortfolioAllocation(portfolioId,userId);
        System.out.println(allocationValidationDTO);
        if(!allocationValidationDTO.getValid()){
            for(AssetAllocationValidationDTO assetAllocationValidationDTO:allocationValidationDTO.getAllocations()){{
                System.out.println(assetAllocationValidationDTO.getAssetClass()+": "+assetAllocationValidationDTO.getDriftPercentage());
                DriftDetection driftDetection = new DriftDetection(null,portfolioId,assetAllocationValidationDTO.getAssetId(), LocalDate.now(), assetAllocationValidationDTO.getDriftPercentage());
                driftDetectionRepository.save(driftDetection);
            }}
            return "Portfolio Not Valid";
        }else{
            return "Portfolio Valid";
        }
    }

}
