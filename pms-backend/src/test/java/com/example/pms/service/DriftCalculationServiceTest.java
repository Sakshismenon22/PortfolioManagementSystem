package com.example.pms.service;

import com.example.pms.dto.response.AllocationValidationDTO;
import com.example.pms.dto.response.AssetAllocationValidationDTO;
import com.example.pms.exception.PortfolioNotFoundException;
import com.example.pms.model.DriftWatchList;
import com.example.pms.model.Portfolio;
import com.example.pms.model.User;
import com.example.pms.model.enums.PortfolioStatus;
import com.example.pms.repository.DriftDetectionRepository;
import com.example.pms.repository.DriftWatchListRepository;
import com.example.pms.repository.NotificationRepository;
import com.example.pms.repository.PortfolioRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DriftCalculationServiceTest {

    @Mock private PortfolioService portfolioService;
    @Mock private PortfolioRepository portfolioRepository;
    @Mock private DriftDetectionRepository driftDetectionRepository;
    @Mock private DriftWatchListRepository driftWatchListRepository;
    @Mock private NotificationRepository notificationRepository;
    @InjectMocks private DriftCalculationService service;

    @Test
    void recordsBreachAndCreatesNotificationForActivePortfolio() {
        Portfolio portfolio = activePortfolio();
        when(portfolioService.validatePortfolioAllocation(10L, 2)).thenReturn(validation(6.0, true));
        when(portfolioRepository.findById(10L)).thenReturn(Optional.of(portfolio));
        when(driftWatchListRepository.findAllByPortfolioId(10L)).thenReturn(null);
        when(notificationRepository.existsByPortfolioIdAndUserUserIdAndMessageAndDate(
                any(), any(), any(), any())).thenReturn(false);

        String result = service.performPortfolioDriftCalculation(10L, 2);

        assertEquals("Portfolio Valid", result);
        verify(driftWatchListRepository).save(any(DriftWatchList.class));
        verify(driftDetectionRepository).save(any());
        verify(notificationRepository).save(any());
    }

    @Test
    void doesNotRecordDriftBelowThreshold() {
        when(portfolioService.validatePortfolioAllocation(10L, 2)).thenReturn(validation(4.99, true));
        when(portfolioRepository.findById(10L)).thenReturn(Optional.of(activePortfolio()));
        when(driftWatchListRepository.findAllByPortfolioId(10L)).thenReturn(new DriftWatchList());

        String result = service.performPortfolioDriftCalculation(10L, 2);

        assertEquals("Portfolio Valid", result);
        verify(driftDetectionRepository, never()).save(any());
        verify(notificationRepository, never()).save(any());
    }

    @Test
    void avoidsDuplicateNotificationForSameDailyDrift() {
        when(portfolioService.validatePortfolioAllocation(10L, 2)).thenReturn(validation(-5.0, false));
        when(portfolioRepository.findById(10L)).thenReturn(Optional.of(activePortfolio()));
        when(driftWatchListRepository.findAllByPortfolioId(10L)).thenReturn(new DriftWatchList());
        when(notificationRepository.existsByPortfolioIdAndUserUserIdAndMessageAndDate(
                any(), any(), any(), any())).thenReturn(true);

        String result = service.performPortfolioDriftCalculation(10L, 2);

        assertEquals("Portfolio Not Valid", result);
        verify(driftDetectionRepository).save(any());
        verify(notificationRepository, never()).save(any());
    }

    @Test
    void throwsWhenPortfolioDoesNotExist() {
        when(portfolioService.validatePortfolioAllocation(10L, 2)).thenReturn(validation(null, true));
        when(portfolioRepository.findById(10L)).thenReturn(Optional.empty());

        assertThrows(PortfolioNotFoundException.class, () -> service.performPortfolioDriftCalculation(10L, 2));
    }

    private Portfolio activePortfolio() {
        Portfolio portfolio = new Portfolio();
        portfolio.setId(10L);
        portfolio.setPortfolioStatus(PortfolioStatus.ACTIVE);
        portfolio.setUser(new User());
        portfolio.getUser().setUserId(2);
        return portfolio;
    }

    private AllocationValidationDTO validation(Double drift, boolean valid) {
        return new AllocationValidationDTO(
                10L,
                "Portfolio",
                100.0,
                100.0,
                valid,
                List.of(new AssetAllocationValidationDTO(1, "EQUITY", 50.0, 50.0, drift, true, 1))
        );
    }
}
