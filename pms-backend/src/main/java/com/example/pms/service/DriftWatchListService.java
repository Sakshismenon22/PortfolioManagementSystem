package com.example.pms.service;

import com.example.pms.dto.response.AllocationValidationDTO;
import com.example.pms.dto.response.AssetAllocationValidationDTO;
import com.example.pms.model.Portfolio;
import com.example.pms.model.User;
import com.example.pms.repository.PortFolioHoldingRepository;
import com.example.pms.repository.PortfolioRepository;
import com.example.pms.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DriftWatchListService {

    private final UserRepository userRepository;
    private final PortfolioRepository portfolioRepository;
    private final PortFolioHoldingRepository portFolioHoldingRepository;
    private final PortfolioService portfolioService;



    public void doDriftCalculation(){
        List<User> userList = userRepository.findAll();
        for(User user:userList){
            List<Portfolio> portfolios = portfolioRepository.findByUserUserId(user.getUserId());
            for(Portfolio portfolio:portfolios){

            }
        }
    }

    public String performPortfolioDriftCalculation(Long portfolioId,Integer userId){
        AllocationValidationDTO allocationValidationDTO = portfolioService.validatePortfolioAllocation(portfolioId,userId);
        if(!allocationValidationDTO.getValid()){
            for(AssetAllocationValidationDTO assetAllocationValidationDTO:allocationValidationDTO.getAllocations()){{
                System.out.println(assetAllocationValidationDTO.getAssetClass()+": "+assetAllocationValidationDTO.getDriftPercentage());
            }}
            return "Portfolio Not Valid";
        }else{
            return "Portfolio Valid";
        }
    }

}
