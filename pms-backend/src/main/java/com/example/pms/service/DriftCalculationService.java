package com.example.pms.service;

import com.example.pms.dto.response.AllocationValidationDTO;
import com.example.pms.dto.response.AssetAllocationValidationDTO;
import com.example.pms.exception.PortfolioNotFoundException;
import com.example.pms.model.DriftDetection;
import com.example.pms.model.Notification;
import com.example.pms.model.Portfolio;
import com.example.pms.model.enums.NotificationStatus;
import com.example.pms.model.enums.PortfolioStatus;
import com.example.pms.repository.DriftDetectionRepository;
import com.example.pms.repository.DriftWatchListRepository;
import com.example.pms.repository.NotificationRepository;
import com.example.pms.repository.PortfolioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class DriftCalculationService {

    private final PortfolioService portfolioService;
    private final PortfolioRepository portfolioRepository;
    private final DriftDetectionRepository driftDetectionRepository;
    private final DriftWatchListRepository driftWatchListRepository;
    private final NotificationRepository notificationRepository;

    @Transactional
    public String performPortfolioDriftCalculation(Long portfolioId, Integer userId) {
        AllocationValidationDTO allocationValidation =
                portfolioService.validatePortfolioAllocation(portfolioId, userId);
        Portfolio portfolio = portfolioRepository.findById(portfolioId)
                .orElseThrow(PortfolioNotFoundException::new);
        if (portfolio.getPortfolioStatus() == PortfolioStatus.ACTIVE
                && driftWatchListRepository.findAllByPortfolioId(portfolioId) == null) {
            driftWatchListRepository.save(DriftSchedule.newWatchList(portfolio, LocalDate.now()));
        }

        for (AssetAllocationValidationDTO allocation : allocationValidation.getAllocations()) {
            if (allocation.getDriftPercentage() == null
                    || Math.abs(allocation.getDriftPercentage()) < 5.0) {
                continue;
            }

            driftDetectionRepository.save(new DriftDetection(
                    null, portfolioId, allocation.getAssetId(), LocalDate.now(), allocation.getDriftPercentage()));

            String message = allocation.getAssetClass()
                    + " allocation drift is "
                    + (allocation.getDriftPercentage() > 0 ? "overweight" : "underweight")
                    + " by " + Math.abs(allocation.getDriftPercentage())
                    + "% (threshold: 5%).";
            if (!notificationRepository.existsByPortfolioIdAndUserUserIdAndMessageAndDate(
                    portfolioId, userId, message, LocalDate.now())) {
                notificationRepository.save(new Notification(
                        null, portfolio, message, NotificationStatus.UNSEEN, LocalDate.now(), portfolio.getUser()));
            }
        }
        return allocationValidation.getValid() ? "Portfolio Valid" : "Portfolio Not Valid";
    }
}
