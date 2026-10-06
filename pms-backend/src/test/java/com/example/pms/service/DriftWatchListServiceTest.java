package com.example.pms.service;

import com.example.pms.dto.response.AllocationValidationDTO;
import com.example.pms.dto.response.AssetAllocationValidationDTO;
import com.example.pms.dto.response.DriftHistoryDTO;
import com.example.pms.exception.PortfolioNotFoundException;
import com.example.pms.exception.UserNotFoundException;
import com.example.pms.model.*;
import com.example.pms.model.enums.PortfolioStatus;
import com.example.pms.model.enums.ReBalancingFrequency;
import com.example.pms.repository.*;
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
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DriftWatchListServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PortfolioRepository portfolioRepository;

    @Mock
    private PortFolioHoldingRepository portFolioHoldingRepository;

    @Mock
    private PortfolioService portfolioService;

    @Mock
    private DriftDetectionRepository driftDetectionRepository;

    @Mock
    private DriftWatchListRepository driftWatchListRepository;

    @Mock
    private AssetRepository assetRepository;

    @Mock
    private NotificationRepository notificationRepository;

    @InjectMocks
    private DriftWatchListService driftWatchListService;


    private User user() {
        User user = new User();
        user.setUserId(1);
        return user;
    }


    private Portfolio portfolio() {
        Portfolio portfolio = new Portfolio();

        portfolio.setId(100L);
        portfolio.setUser(user());
        portfolio.setName("Growth Portfolio");
        portfolio.setPortfolioStatus(
                PortfolioStatus.ACTIVE
        );
        portfolio.setReBalancingFrequency(
                ReBalancingFrequency.MONTHLY
        );

        return portfolio;
    }


    @Test
    @DisplayName("TC-DRIFT-001 | Return drift history")
    void getDriftHistory_shouldReturnHistory() {

        Portfolio portfolio =
                portfolio();

        Asset asset =
                new Asset();

        asset.setId(10);
        asset.setAssetClass("Equity");

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

        when(userRepository.findById(1))
                .thenReturn(Optional.of(user()));

        when(portfolioRepository.findById(100L))
                .thenReturn(Optional.of(portfolio));

        when(driftDetectionRepository
                .findByPortfolioIdOrderByDetectedAtDescIdDesc(100L))
                .thenReturn(List.of(detection));

        when(assetRepository.findAllById(List.of(10)))
                .thenReturn(List.of(asset));

        List<DriftHistoryDTO> result =
                driftWatchListService
                        .getDriftHistory(100L, 1);

        assertEquals(1, result.size());

        assertEquals(
                10,
                result.get(0).getAssetId()
        );

        assertEquals(
                "Equity",
                result.get(0).getAssetClass()
        );

        assertEquals(
                6.5,
                result.get(0).getDriftPercent()
        );
    }


    @Test
    @DisplayName("TC-DRIFT-002 | Empty history")
    void getDriftHistory_shouldReturnEmpty() {

        Portfolio portfolio =
                portfolio();

        when(userRepository.findById(1))
                .thenReturn(Optional.of(user()));

        when(portfolioRepository.findById(100L))
                .thenReturn(Optional.of(portfolio));

        when(driftDetectionRepository
                .findByPortfolioIdOrderByDetectedAtDescIdDesc(100L))
                .thenReturn(List.of());

        assertTrue(
                driftWatchListService
                        .getDriftHistory(100L, 1)
                        .isEmpty()
        );
    }


    @Test
    @DisplayName("TC-DRIFT-003 | Missing user")
    void getDriftHistory_shouldThrow_whenUserMissing() {

        when(userRepository.findById(999))
                .thenReturn(Optional.empty());

        assertThrows(
                UserNotFoundException.class,
                () -> driftWatchListService
                        .getDriftHistory(100L, 999)
        );
    }


    @Test
    @DisplayName("TC-DRIFT-004 | Missing portfolio")
    void getDriftHistory_shouldThrow_whenPortfolioMissing() {

        when(userRepository.findById(1))
                .thenReturn(Optional.of(user()));

        when(portfolioRepository.findById(999L))
                .thenReturn(Optional.empty());

        assertThrows(
                PortfolioNotFoundException.class,
                () -> driftWatchListService
                        .getDriftHistory(999L, 1)
        );
    }


    @Test
    @DisplayName("TC-DRIFT-005 | Unauthorized history")
    void getDriftHistory_shouldThrow_whenUserDoesNotOwnPortfolio() {

        User owner =
                new User();

        owner.setUserId(2);

        Portfolio portfolio =
                portfolio();

        portfolio.setUser(owner);

        when(userRepository.findById(1))
                .thenReturn(Optional.of(user()));

        when(portfolioRepository.findById(100L))
                .thenReturn(Optional.of(portfolio));

        assertThrows(
                PortfolioNotFoundException.class,
                () -> driftWatchListService
                        .getDriftHistory(100L, 1)
        );
    }


    @Test
    @DisplayName("TC-DRIFT-006 | Unknown asset")
    void getDriftHistory_shouldUseUnknownAsset() {

        Portfolio portfolio =
                portfolio();

        DriftDetection detection =
                new DriftDetection(
                        1,
                        100L,
                        999,
                        LocalDate.now(),
                        -7.0
                );

        when(userRepository.findById(1))
                .thenReturn(Optional.of(user()));

        when(portfolioRepository.findById(100L))
                .thenReturn(Optional.of(portfolio));

        when(driftDetectionRepository
                .findByPortfolioIdOrderByDetectedAtDescIdDesc(100L))
                .thenReturn(List.of(detection));

        when(assetRepository.findAllById(List.of(999)))
                .thenReturn(List.of());

        List<DriftHistoryDTO> result =
                driftWatchListService
                        .getDriftHistory(100L, 1);

        assertEquals(
                "Unknown asset",
                result.get(0).getAssetClass()
        );
    }


    @Test
    @DisplayName("TC-DRIFT-007 | Valid allocation")
    void performPortfolioDriftCalculation_shouldReturnValid() {

        Portfolio portfolio =
                portfolio();

        AllocationValidationDTO validation =
                new AllocationValidationDTO(
                        100L,
                        "Growth Portfolio",
                        1000.0,
                        1000.0,
                        true,
                        List.of()
                );

        when(portfolioService
                .validatePortfolioAllocation(100L, 1))
                .thenReturn(validation);

        when(portfolioRepository.findById(100L))
                .thenReturn(Optional.of(portfolio));

        when(driftWatchListRepository
                .findAllByPortfolioId(100L))
                .thenReturn(null);

        assertEquals(
                "Portfolio Valid",
                driftWatchListService
                        .performPortfolioDriftCalculation(
                                100L,
                                1
                        )
        );

        verify(driftWatchListRepository)
                .save(any());

        verify(driftDetectionRepository, never())
                .save(any());
    }


    @Test
    @DisplayName("TC-DRIFT-008 | Positive drift creates detection and notification")
    void performPortfolioDriftCalculation_shouldCreateOverweightNotification() {

        Portfolio portfolio =
                portfolio();

        AssetAllocationValidationDTO allocation =
                new AssetAllocationValidationDTO(
                        10,
                        "Equity",
                        50.0,
                        57.0,
                        7.0,
                        false,
                        1
                );

        AllocationValidationDTO validation =
                new AllocationValidationDTO(
                        100L,
                        "Growth Portfolio",
                        1000.0,
                        1000.0,
                        false,
                        List.of(allocation)
                );

        when(portfolioService
                .validatePortfolioAllocation(100L, 1))
                .thenReturn(validation);

        when(portfolioRepository.findById(100L))
                .thenReturn(Optional.of(portfolio));

        when(driftWatchListRepository
                .findAllByPortfolioId(100L))
                .thenReturn(mock(DriftWatchList.class));

        when(notificationRepository
                .existsByPortfolioIdAndUserUserIdAndMessageAndDate(
                        eq(100L),
                        eq(1),
                        anyString(),
                        any(LocalDate.class)
                ))
                .thenReturn(false);

        assertEquals(
                "Portfolio Not Valid",
                driftWatchListService
                        .performPortfolioDriftCalculation(
                                100L,
                                1
                        )
        );

        verify(driftDetectionRepository)
                .save(any(DriftDetection.class));

        verify(notificationRepository)
                .save(any(Notification.class));
    }


    @Test
    @DisplayName("TC-DRIFT-009 | Negative drift creates underweight notification")
    void performPortfolioDriftCalculation_shouldCreateUnderweightNotification() {

        Portfolio portfolio =
                portfolio();

        AssetAllocationValidationDTO allocation =
                new AssetAllocationValidationDTO(
                        10,
                        "Equity",
                        60.0,
                        52.0,
                        -8.0,
                        false,
                        1
                );

        AllocationValidationDTO validation =
                new AllocationValidationDTO(
                        100L,
                        "Growth Portfolio",
                        1000.0,
                        1000.0,
                        false,
                        List.of(allocation)
                );

        when(portfolioService
                .validatePortfolioAllocation(100L, 1))
                .thenReturn(validation);

        when(portfolioRepository.findById(100L))
                .thenReturn(Optional.of(portfolio));

        when(driftWatchListRepository
                .findAllByPortfolioId(100L))
                .thenReturn(mock(DriftWatchList.class));

        when(notificationRepository
                .existsByPortfolioIdAndUserUserIdAndMessageAndDate(
                        eq(100L),
                        eq(1),
                        contains("underweight"),
                        any(LocalDate.class)
                ))
                .thenReturn(false);

        driftWatchListService
                .performPortfolioDriftCalculation(
                        100L,
                        1
                );

        verify(notificationRepository)
                .save(any(Notification.class));
    }


    @Test
    @DisplayName("TC-DRIFT-010 | Drift below five is ignored")
    void performPortfolioDriftCalculation_shouldIgnoreSmallDrift() {

        Portfolio portfolio =
                portfolio();

        AssetAllocationValidationDTO allocation =
                new AssetAllocationValidationDTO(
                        10,
                        "Equity",
                        60.0,
                        63.0,
                        3.0,
                        true,
                        1
                );

        AllocationValidationDTO validation =
                new AllocationValidationDTO(
                        100L,
                        "Growth Portfolio",
                        1000.0,
                        1000.0,
                        true,
                        List.of(allocation)
                );

        when(portfolioService
                .validatePortfolioAllocation(100L, 1))
                .thenReturn(validation);

        when(portfolioRepository.findById(100L))
                .thenReturn(Optional.of(portfolio));

        when(driftWatchListRepository
                .findAllByPortfolioId(100L))
                .thenReturn(mock(DriftWatchList.class));

        driftWatchListService
                .performPortfolioDriftCalculation(
                        100L,
                        1
                );

        verify(driftDetectionRepository, never())
                .save(any());

        verify(notificationRepository, never())
                .save(any());
    }


    @Test
    @DisplayName("TC-DRIFT-011 | Null drift is ignored")
    void performPortfolioDriftCalculation_shouldIgnoreNullDrift() {

        Portfolio portfolio =
                portfolio();

        AssetAllocationValidationDTO allocation =
                new AssetAllocationValidationDTO(
                        10,
                        "Equity",
                        60.0,
                        60.0,
                        null,
                        true,
                        0
                );

        AllocationValidationDTO validation =
                new AllocationValidationDTO(
                        100L,
                        "Growth Portfolio",
                        0.0,
                        0.0,
                        true,
                        List.of(allocation)
                );

        when(portfolioService
                .validatePortfolioAllocation(100L, 1))
                .thenReturn(validation);

        when(portfolioRepository.findById(100L))
                .thenReturn(Optional.of(portfolio));

        when(driftWatchListRepository
                .findAllByPortfolioId(100L))
                .thenReturn(mock(DriftWatchList.class));

        driftWatchListService
                .performPortfolioDriftCalculation(
                        100L,
                        1
                );

        verify(driftDetectionRepository, never())
                .save(any());

        verify(notificationRepository, never())
                .save(any());
    }


    @Test
    @DisplayName("TC-DRIFT-012 | Existing notification is not duplicated")
    void performPortfolioDriftCalculation_shouldNotDuplicateNotification() {

        Portfolio portfolio =
                portfolio();

        AssetAllocationValidationDTO allocation =
                new AssetAllocationValidationDTO(
                        10,
                        "Equity",
                        50.0,
                        57.0,
                        7.0,
                        false,
                        1
                );

        AllocationValidationDTO validation =
                new AllocationValidationDTO(
                        100L,
                        "Growth Portfolio",
                        1000.0,
                        1000.0,
                        false,
                        List.of(allocation)
                );

        when(portfolioService
                .validatePortfolioAllocation(100L, 1))
                .thenReturn(validation);

        when(portfolioRepository.findById(100L))
                .thenReturn(Optional.of(portfolio));

        when(driftWatchListRepository
                .findAllByPortfolioId(100L))
                .thenReturn(mock(DriftWatchList.class));

        when(notificationRepository
                .existsByPortfolioIdAndUserUserIdAndMessageAndDate(
                        anyLong(),
                        anyInt(),
                        anyString(),
                        any(LocalDate.class)
                ))
                .thenReturn(true);

        driftWatchListService
                .performPortfolioDriftCalculation(
                        100L,
                        1
                );

        verify(driftDetectionRepository)
                .save(any(DriftDetection.class));

        verify(notificationRepository, never())
                .save(any(Notification.class));
    }
}
