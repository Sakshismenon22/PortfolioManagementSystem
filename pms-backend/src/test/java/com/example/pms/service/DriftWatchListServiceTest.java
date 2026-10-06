package com.example.pms.service;

import com.example.pms.dto.response.DriftHistoryDTO;
import com.example.pms.model.Asset;
import com.example.pms.model.DriftDetection;
import com.example.pms.model.DriftWatchList;
import com.example.pms.model.Portfolio;
import com.example.pms.model.User;
import com.example.pms.model.enums.PortfolioStatus;
import com.example.pms.model.enums.ReBalancingFrequency;
import com.example.pms.exception.PortfolioNotFoundException;
import com.example.pms.exception.UserNotFoundException;
import com.example.pms.repository.AssetRepository;
import com.example.pms.repository.DriftDetectionRepository;
import com.example.pms.repository.DriftWatchListRepository;
import com.example.pms.repository.PortfolioRepository;
import com.example.pms.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DriftWatchListServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PortfolioRepository portfolioRepository;

    @Mock
    private DriftCalculationService driftCalculationService;

    @Mock
    private DriftDetectionRepository driftDetectionRepository;

    @Mock
    private DriftWatchListRepository driftWatchListRepository;

    @Mock
    private AssetRepository assetRepository;

    @InjectMocks
    private DriftWatchListService driftWatchListService;


    @Test
    @DisplayName("TC-DRIFT-001 | Return drift history for portfolio owner")
    void getDriftHistory_shouldReturnHistory_whenUserOwnsPortfolio() {

        // Arrange
        User user =
                new User();

        user.setUserId(1);

        Portfolio portfolio =
                new Portfolio();

        portfolio.setId(100L);
        portfolio.setUser(user);

        DriftDetection detection =
                new DriftDetection(
                        1,
                        100L,
                        10,
                        LocalDate.of(
                                2026,
                                10,
                                1
                        ),
                        6.5
                );

        Asset asset =
                new Asset();

        asset.setId(10);
        asset.setAssetClass("equity");

        when(userRepository.findById(1))
                .thenReturn(Optional.of(user));

        when(portfolioRepository.findById(100L))
                .thenReturn(Optional.of(portfolio));

        when(driftDetectionRepository
                .findByPortfolioIdOrderByDetectedAtDescIdDesc(100L))
                .thenReturn(List.of(detection));

        when(assetRepository.findAllById(List.of(10)))
                .thenReturn(List.of(asset));


        // Act
        List<DriftHistoryDTO> result =
                driftWatchListService.getDriftHistory(
                        100L,
                        1
                );


        // Assert
        assertEquals(
                1,
                result.size()
        );

        assertEquals(
                10,
                result.get(0).getAssetId()
        );

        assertEquals(
                "equity",
                result.get(0).getAssetClass()
        );

        assertEquals(
                6.5,
                result.get(0).getDriftPercent()
        );
    }


    @Test
    @DisplayName("TC-DRIFT-002 | Return empty drift history when no detections exist")
    void getDriftHistory_shouldReturnEmptyList_whenNoDetectionsExist() {

        // Arrange
        User user =
                new User();

        user.setUserId(1);

        Portfolio portfolio =
                new Portfolio();

        portfolio.setId(100L);
        portfolio.setUser(user);

        when(userRepository.findById(1))
                .thenReturn(Optional.of(user));

        when(portfolioRepository.findById(100L))
                .thenReturn(Optional.of(portfolio));

        when(driftDetectionRepository
                .findByPortfolioIdOrderByDetectedAtDescIdDesc(100L))
                .thenReturn(List.of());


        // Act
        List<DriftHistoryDTO> result =
                driftWatchListService.getDriftHistory(
                        100L,
                        1
                );


        // Assert
        assertNotNull(result);
        assertTrue(result.isEmpty());
    }


    @Test
    @DisplayName("TC-DRIFT-003 | Return valid status when allocation validation is valid")
    void performPortfolioDriftCalculation_shouldDelegateToTransactionalService() {
        when(driftCalculationService.performPortfolioDriftCalculation(100L, 1))
                .thenReturn("Portfolio Valid");

        String result = driftWatchListService.performPortfolioDriftCalculation(100L, 1);

        assertEquals("Portfolio Valid", result);
        verify(driftCalculationService).performPortfolioDriftCalculation(100L, 1);
    }

    @Test
    @DisplayName("TC-DRIFT-004 | Scheduled calculation advances the next run date")
    void doDriftCalculation_shouldRunDueActivePortfoliosAndAdvanceSchedule() {
        User user = new User();
        user.setUserId(1);
        Portfolio portfolio = new Portfolio();
        portfolio.setId(100L);
        portfolio.setPortfolioStatus(PortfolioStatus.ACTIVE);
        DriftWatchList watchList = new DriftWatchList(
                1, 100L, LocalDate.now(), LocalDate.now().minusMonths(1), ReBalancingFrequency.MONTHLY);
        when(userRepository.findAll()).thenReturn(List.of(user));
        when(portfolioRepository.findByUserUserId(1)).thenReturn(List.of(portfolio));
        when(driftWatchListRepository.findAllByPortfolioId(100L)).thenReturn(watchList);

        driftWatchListService.doDriftCalculation();

        verify(driftCalculationService).performPortfolioDriftCalculation(100L, 1);
        verify(driftWatchListRepository).save(watchList);
        assertEquals(LocalDate.now(), watchList.getLastDriftCalculatedAt());
        assertEquals(LocalDate.now().plusMonths(1), watchList.getNextDriftCalculationDate());
    }

    @Test
    @DisplayName("TC-DRIFT-005 | Scheduled run skips portfolios that are not due or active")
    void doDriftCalculation_shouldSkipNotDueAndInactivePortfolios() {
        User user = new User();
        user.setUserId(1);
        Portfolio notDue = new Portfolio();
        notDue.setId(100L);
        notDue.setPortfolioStatus(PortfolioStatus.ACTIVE);
        Portfolio inactive = new Portfolio();
        inactive.setId(200L);
        inactive.setPortfolioStatus(PortfolioStatus.NEW);
        when(userRepository.findAll()).thenReturn(List.of(user));
        when(portfolioRepository.findByUserUserId(1)).thenReturn(List.of(notDue, inactive));
        when(driftWatchListRepository.findAllByPortfolioId(100L))
                .thenReturn(new DriftWatchList(1, 100L, LocalDate.now().minusDays(1), null, null));
        when(driftWatchListRepository.findAllByPortfolioId(200L))
                .thenReturn(new DriftWatchList(2, 200L, LocalDate.now(), null, null));

        driftWatchListService.doDriftCalculation();

        verify(driftCalculationService, never()).performPortfolioDriftCalculation(any(), any());
        verify(driftWatchListRepository, never()).save(any());
    }

    @Test
    @DisplayName("TC-DRIFT-006 | Reject drift history when the user is missing")
    void getDriftHistory_shouldThrowWhenUserDoesNotExist() {
        when(userRepository.findById(404)).thenReturn(Optional.empty());

        assertThrows(UserNotFoundException.class, () -> driftWatchListService.getDriftHistory(100L, 404));
    }

    @Test
    @DisplayName("TC-DRIFT-007 | Reject drift history for another user’s portfolio")
    void getDriftHistory_shouldHidePortfolioOwnedByAnotherUser() {
        User user = new User();
        user.setUserId(1);
        User owner = new User();
        owner.setUserId(2);
        Portfolio portfolio = new Portfolio();
        portfolio.setId(100L);
        portfolio.setUser(owner);
        when(userRepository.findById(1)).thenReturn(Optional.of(user));
        when(portfolioRepository.findById(100L)).thenReturn(Optional.of(portfolio));

        assertThrows(PortfolioNotFoundException.class, () -> driftWatchListService.getDriftHistory(100L, 1));
    }
}
