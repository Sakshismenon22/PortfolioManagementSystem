package com.example.pms.service;

import com.example.pms.dto.response.DriftHistoryDTO;
import com.example.pms.exception.PortfolioNotFoundException;
import com.example.pms.exception.UserNotFoundException;
import com.example.pms.model.Asset;
import com.example.pms.model.DriftDetection;
import com.example.pms.model.Portfolio;
import com.example.pms.model.User;
import com.example.pms.model.enums.PortfolioStatus;
import com.example.pms.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.Map;
import java.util.function.Function;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DriftWatchListService {

    private final UserRepository userRepository;
    private final PortfolioRepository portfolioRepository;
    private final DriftCalculationService driftCalculationService;
    private final DriftDetectionRepository driftDetectionRepository;
    private final DriftWatchListRepository driftWatchListRepository;
    private final AssetRepository assetRepository;

    public List<DriftHistoryDTO> getDriftHistory(Long portfolioId, Integer userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(UserNotFoundException::new);
        Portfolio portfolio = portfolioRepository.findById(portfolioId)
                .orElseThrow(PortfolioNotFoundException::new);
        if (!portfolio.getUser().getUserId().equals(user.getUserId())) {
            throw new PortfolioNotFoundException();
        }

        List<DriftDetection> detections = driftDetectionRepository
                .findByPortfolioIdOrderByDetectedAtDescIdDesc(portfolioId);
        Map<Integer, Asset> assetsById = assetRepository.findAllById(
                        detections.stream().map(DriftDetection::getAssetId).distinct().toList())
                .stream()
                .collect(Collectors.toMap(Asset::getId, Function.identity()));

        return detections.stream()
                .map(detection -> new DriftHistoryDTO(
                        detection.getId(),
                        detection.getPortfolioId(),
                        detection.getAssetId(),
                        assetsById.containsKey(detection.getAssetId())
                                ? assetsById.get(detection.getAssetId()).getAssetClass()
                                : "Unknown asset",
                        detection.getDetectedAt(),
                        detection.getDriftPercent()
                ))
                .toList();
    }


    @Scheduled(cron = "0 46 15 * * MON-FRI",
            zone = "Asia/Kolkata")
    public void doDriftCalculation(){
        List<User> userList = userRepository.findAll();
        for(User user:userList){
            List<Portfolio> portfolios = portfolioRepository.findByUserUserId(user.getUserId());
            for(Portfolio portfolio:portfolios){

                var watchList = driftWatchListRepository.findAllByPortfolioId(portfolio.getId());
                if (watchList == null
                        || watchList.getNextDriftCalculationDate() == null
                        || !watchList.getNextDriftCalculationDate().equals(LocalDate.now())
                        || portfolio.getPortfolioStatus() != PortfolioStatus.ACTIVE) {
                    continue;
                }

                driftCalculationService.performPortfolioDriftCalculation(portfolio.getId(), user.getUserId());
                watchList.setLastDriftCalculatedAt(watchList.getNextDriftCalculationDate());
                watchList.setNextDriftCalculationDate(
                        DriftSchedule.nextDate(watchList.getLastDriftCalculatedAt(), watchList.getReBalancingFrequency())
                );
                driftWatchListRepository.save(watchList);
            }
        }
    }

    public String performPortfolioDriftCalculation(Long portfolioId, Integer userId) {
        return driftCalculationService.performPortfolioDriftCalculation(portfolioId, userId);
    }

}
