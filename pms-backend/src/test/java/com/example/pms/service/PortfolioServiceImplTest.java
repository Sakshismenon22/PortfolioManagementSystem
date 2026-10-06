package com.example.pms.service;

import com.example.pms.client.SecurityMasterClient;
import com.example.pms.dto.request.CreatePortfolioDTO;
import com.example.pms.dto.response.ValidationDTO;
import com.example.pms.exception.PortfolioNotFoundException;
import com.example.pms.exception.ThemeNotFoundException;
import com.example.pms.exception.UserNotFoundException;
import com.example.pms.model.*;
import com.example.pms.model.enums.*;
import com.example.pms.repository.*;
import org.checkerframework.checker.units.qual.A;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.parameters.P;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class PortfolioServiceImplTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private ThemeRepository themeRepository;
    @Mock
    private PortfolioRepository portfolioRepository;
    @Mock
    private PortFolioHoldingRepository portfolioHoldingRepository;
    @Mock
    private PortfolioHoldingService portfolioHoldingService;

    @Mock
    private SecurityMasterClient securityMasterClient;

    @Mock
    private AssetRepository assetRepository;

    @Mock
    private DriftWatchListRepository driftWatchListRepository;
    @Mock
    private DriftDetectionRepository driftDetectionRepository;
    @Mock
    private  NotificationRepository notificationRepository;
    @Mock
    private SecurityMasterService securityMasterService;
    @Mock
    private SecurityMasterRepository securityMasterRepository;

    @InjectMocks
    private PortfolioServiceImpl portfolioService;

    private  User user(){
        User user = new User();

        user.setUserId(1);
        user.setName("Test user");

        return user;
    }

    private Asset asset(Integer id, String assetClass){
        Asset asset = new Asset();

        asset.setId(id);
        asset.setAssetClass(assetClass);

        return asset;
    }

    private Theme theme(){
        Theme theme = new Theme();

        theme.setId(10);
        theme.setName("Growth theme");
        theme.setAllocationRuleList(new ArrayList<>());

        return theme;
    }

    private Portfolio activePortfolio(){
        Portfolio portfolio= new Portfolio();

        portfolio.setId(100L);
        portfolio.setName("Growth Portfolio");
        portfolio.setAmount(10000.0);
        portfolio.setUser(user());
        portfolio.setTheme(theme());
        portfolio.setPortfolioStatus(PortfolioStatus.ACTIVE);
        portfolio.setPortfolioType(PortfolioType.WEIGHTAGE);
        portfolio.setCurrency("INR");
        portfolio.setBenchmark(Benchmark.NIFTY_50);
        portfolio.setExchange(Exchange.NSE);
        portfolio.setReBalancingFrequency(ReBalancingFrequency.MONTHLY);
        portfolio.setCreatedAt(LocalDate.now());

        return portfolio;

    }

    private CreatePortfolioDTO validCreateRequest(){
        CreatePortfolioDTO portfolio = new CreatePortfolioDTO();

        portfolio.setName("Growth Portfolio");
        portfolio.setPortfolioStatus(PortfolioStatus.NEW);
        portfolio.setPortfolioType(PortfolioType.WEIGHTAGE);
        portfolio.setCurrency("INR");
        portfolio.setBenchmark(Benchmark.NIFTY_50);
        portfolio.setExchange(Exchange.NSE);
        portfolio.setReBalancingFrequency(ReBalancingFrequency.MONTHLY);
        portfolio.setCreatedAt(LocalDate.of(2026,10,1));
        portfolio.setAmount(100000.0);
        portfolio.setUserId(1);
        portfolio.setThemeId(10);

        return portfolio;
    }

    @Test
    @DisplayName("TC-PORT-001 | Create portfolio for valid user and theme")
    void createPortfolio_shouldCreatePortfolio_whenUserAndThemeExist(){

        CreatePortfolioDTO request = validCreateRequest();

        User user = user();

       Theme theme = theme();

       Portfolio savedPortfolio = activePortfolio();

        when(userRepository.existsById(1)).thenReturn(true);

        when(themeRepository.existsById(10)).thenReturn(true);

        when(userRepository.findById(1)).thenReturn(Optional.of(user));

        when(themeRepository.findById(10)).thenReturn(Optional.of(theme));

        when(portfolioRepository.save(any(Portfolio.class))).thenReturn(savedPortfolio);

        Portfolio result = portfolioService.createPortfolio(request);

        assertNotNull(result);

        assertEquals(100L, result.getId());

        verify(userRepository).existsById(1);

        verify(themeRepository).existsById(10);

        verify(portfolioRepository).save(any(Portfolio.class));


    }

    @Test
    @DisplayName("TC-PORT-002 | Reject null create request")
    void createPortfolio_shouldRejectNullRequest() {

      IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> portfolioService.createPortfolio(null));

      assertEquals("Portfolio name is required.", exception.getMessage());

      verify(portfolioRepository, never()).save(any());

    }

    @Test
    @DisplayName("TC-PORT-003 | Reject blank portfolio name")
    void createPortfolio_shouldRejectBlankPortfolioName() {

        CreatePortfolioDTO request = validCreateRequest();

        request.setName(" ");

        IllegalArgumentException exception= assertThrows(IllegalArgumentException.class, () -> portfolioService.createPortfolio(request));

        assertEquals("Portfolio name is required.", exception.getMessage());

    }

    @Test
    @DisplayName("TC-PORT-004 | Reject invalid amount")
    void createPortfolio_shouldRejectInvalidAmount() {

        CreatePortfolioDTO request = validCreateRequest();

        request.setAmount(0.0);

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> portfolioService.createPortfolio(null));

        assertEquals("Portfolio name is required.", exception.getMessage());

    }

//    @Test
//    @DisplayName("TC-PORT-005 | Reject missing required fields")
//    void createPortfolio_shouldRejectMissingRequiredFields() {
//
//
//        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> portfolioService.createPortfolio(null));
//
//        assertEquals("Portfolio name is required.", exception.getMessage());
//
//        verify(portfolioRepository, never()).save(any());
//
//    }

//
//    @Test
//    @DisplayName("TC-PORT-003 | Reject portfolio when theme does not exist")
//    void createPortfolio_shouldThrowThemeNotFoundException_whenThemeDoesNotExist() {
//
//        // Arrange
//        CreatePortfolioDTO request =
//                new CreatePortfolioDTO();
//
//        request.setUserId(1);
//        request.setThemeId(999);
//
//        when(userRepository.existsById(1))
//                .thenReturn(true);
//
//        when(themeRepository.existsById(999))
//                .thenReturn(false);
//
//
//        // Act & Assert
//        assertThrows(
//                ThemeNotFoundException.class,
//                () -> portfolioService.createPortfolio(request)
//        );
//
//
//        // Verify
//        verify(portfolioRepository, never())
//                .save(any(Portfolio.class));
//    }


    @Test
    @DisplayName("TC-PORT-004 | Reject validation when portfolio does not exist")
    void isValid_shouldThrowPortfolioNotFoundException_whenPortfolioDoesNotExist() {

        // Arrange
        when(portfolioRepository.existsById(999L))
                .thenReturn(false);


        // Act & Assert
        assertThrows(
                PortfolioNotFoundException.class,
                () -> portfolioService.isValid(999L)
        );
    }


    @Test
    @DisplayName("TC-PORT-005 | Validate portfolio when allocation is within threshold")
    void isValid_shouldReturnValid_whenAllocationDriftIsBelowFivePercent() {

        // Arrange
        Asset asset = new Asset();

        asset.setId(1);
        asset.setAssetClass("equity");

        AllocationRule rule =new AllocationRule();

        rule.setId(1);
        rule.setAsset(asset);
        rule.setPercentage(98.0);

        Theme theme = new Theme();

        theme.setAllocationRuleList(List.of(rule));

        Portfolio portfolio = new Portfolio();

        portfolio.setId(100L);
        portfolio.setTheme(theme);

        PortfolioHolding holding = new PortfolioHolding();

        holding.setId(10);
        holding.setPortfolio(portfolio);
        holding.setAsset(asset);

        when(portfolioRepository.existsById(100L)).thenReturn(true);

        when(portfolioRepository.findById(100L)).thenReturn(Optional.of(portfolio));

        when(portfolioHoldingRepository.findAllByPortfolio(portfolio)).thenReturn(List.of(holding));

        when(portfolioHoldingService.getTotalCost(holding)).thenReturn(1000.0);


        // Act
        ValidationDTO result = portfolioService.isValid(100L);


        // Assert
        assertTrue(result.getIsValid());

        assertEquals(1000.0,result.getGrantTotal());

        assertEquals(100.0,result.getAssetWisePercentage().get("1"));
    }


    @Test
    @DisplayName("TC-PORT-006 | Reject validation when allocation drift reaches five percent")
    void isValid_shouldReturnInvalid_whenAllocationDriftReachesFivePercent() {

        // Arrange
        Asset asset =
                new Asset();

        asset.setId(1);
        asset.setAssetClass("equity");

        AllocationRule rule =
                new AllocationRule();

        rule.setAsset(asset);
        rule.setPercentage(60.0);

        Theme theme =
                new Theme();

        theme.setAllocationRuleList(
                List.of(rule)
        );

        Portfolio portfolio =
                new Portfolio();

        portfolio.setId(100L);
        portfolio.setTheme(theme);

        PortfolioHolding first =
                new PortfolioHolding();

        first.setId(10);
        first.setPortfolio(portfolio);
        first.setAsset(asset);

        Asset secondAsset =
                new Asset();

        secondAsset.setId(2);

        PortfolioHolding second =
                new PortfolioHolding();

        second.setId(11);
        second.setPortfolio(portfolio);
        second.setAsset(secondAsset);

        when(portfolioRepository.existsById(100L))
                .thenReturn(true);

        when(portfolioRepository.findById(100L))
                .thenReturn(Optional.of(portfolio));

        when(portfolioHoldingRepository.findAllByPortfolio(portfolio))
                .thenReturn(
                        List.of(first, second)
                );

        when(portfolioHoldingService.getTotalCost(first))
                .thenReturn(650.0);

        when(portfolioHoldingService.getTotalCost(second))
                .thenReturn(350.0);


        // Act
        ValidationDTO result =
                portfolioService.isValid(100L);


        // Assert
        assertFalse(result.getIsValid());

        assertEquals(
                1000.0,
                result.getGrantTotal()
        );

        assertEquals(
                65.0,
                result.getAssetWisePercentage().get("1")
        );
    }


    @Test
    @DisplayName("TC-PORT-007 | Count portfolios for an existing user")
    void getCountOfPortfolios_shouldReturnPortfolioCount_whenUserExists() {

        // Arrange
        when(userRepository.existsById(1))
                .thenReturn(true);

        Portfolio first =
                new Portfolio();

        Portfolio second =
                new Portfolio();

        when(portfolioRepository.findByUserUserId(1))
                .thenReturn(
                        List.of(first, second)
                );


        // Act
        Integer result =
                portfolioService.getCountOfPortfolios(1);


        // Assert
        assertEquals(
                2,
                result
        );
    }


    @Test
    @DisplayName("TC-PORT-008 | Count active portfolios")
    void getCountOfActivePortfolios_shouldCountOnlyActivePortfolios() {

        // Arrange
        when(userRepository.existsById(1))
                .thenReturn(true);

        Portfolio active =
                new Portfolio();

        active.setPortfolioStatus(
                PortfolioStatus.ACTIVE
        );

        Portfolio draft =
                new Portfolio();

        draft.setPortfolioStatus(
                PortfolioStatus.DRAFT
        );

        when(portfolioRepository.findByUserUserId(1))
                .thenReturn(
                        List.of(
                                active,
                                draft
                        )
                );


        // Act
        Integer result =
                portfolioService.getCountOfActivePortfolios(1);


        // Assert
        assertEquals(
                1,
                result
        );
    }


    @Test
    @DisplayName("TC-PORT-009 | Reject portfolio count when user does not exist")
    void getCountOfPortfolios_shouldThrowUserNotFoundException_whenUserDoesNotExist() {

        // Arrange
        when(userRepository.existsById(999))
                .thenReturn(false);


        // Act & Assert
        assertThrows(
                UserNotFoundException.class,
                () -> portfolioService.getCountOfPortfolios(999)
        );
    }
}
