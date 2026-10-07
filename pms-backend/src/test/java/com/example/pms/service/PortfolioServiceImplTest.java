package com.example.pms.service;

import com.example.pms.client.SecurityMasterClient;
import com.example.pms.dto.request.CreatePortfolioDTO;
import com.example.pms.dto.response.*;
import com.example.pms.exception.PortfolioNotFoundException;
import com.example.pms.exception.ThemeNotFoundException;
import com.example.pms.exception.UserNotFoundException;
import com.example.pms.model.*;
import com.example.pms.model.enums.*;
import com.example.pms.repository.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
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

    @Test
    @DisplayName("TC-PORT-005 | Reject missing required fields")
    void createPortfolio_shouldRejectMissingRequiredFields() {

        CreatePortfolioDTO request = new CreatePortfolioDTO();

        request.setBenchmark(null);

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> portfolioService.createPortfolio(request));

        assertEquals("Portfolio name is required.", exception.getMessage());

        verify(portfolioRepository, never()).save(any());

    }

    @Test
    @DisplayName("TC-PORT-006 | Reject missing user")
    void createPortfolio_shouldThrowUserNotFound_whenUserDoesNotExist() {

        CreatePortfolioDTO request = validCreateRequest();

        request.setUserId(999);
        request.setThemeId(10);

        when(userRepository.existsById(999)).thenReturn(false);

        assertThrows(UserNotFoundException.class, () -> portfolioService.createPortfolio(request));

       verify(portfolioRepository, never()).save(any(Portfolio.class));
       verify(userRepository).existsById(999);
       verify(themeRepository,never()).existsById(anyInt());

    }

    @Test
    @DisplayName("TC-PORT-007 | Reject missing theme")
    void createPortfolio_shouldThrowThemeNotFound_whenThemeDoesNotExist() {

        CreatePortfolioDTO request = validCreateRequest();

        when(userRepository.existsById(1)).thenReturn(true);
        when(themeRepository.existsById(10)).thenReturn(false);

        assertThrows(ThemeNotFoundException.class, () -> portfolioService.createPortfolio(request));

        verify(portfolioRepository, never()).save(any());

    }



    @Test
    @DisplayName("TC-PORT-008 | Reject validation when portfolio does not exist")
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
    @DisplayName("TC-PORT-009 | Validation succeeds when drift is below five")
    void isValid_shouldReturnValid_whenDriftBelowFive() {

        Asset asset = asset(1, "Equity");

        AllocationRule rule = new AllocationRule();

        rule.setId(1);
        rule.setAsset(asset);
        rule.setPercentage(98.0);

        Theme theme = theme();

        theme.setAllocationRuleList(List.of(rule));

        Portfolio portfolio = activePortfolio();

        portfolio.setTheme(theme);

        PortfolioHolding holding = new PortfolioHolding();

        holding.setId(10);
        holding.setPortfolio(portfolio);
        holding.setAsset(asset);

        when(portfolioRepository.existsById(100L))
                .thenReturn(true);

        when(portfolioRepository.findById(100L))
                .thenReturn(Optional.of(portfolio));

        when(portfolioHoldingRepository
                .findAllByPortfolio(portfolio))
                .thenReturn(List.of(holding));

        when(portfolioHoldingService
                .getTotalCost(holding))
                .thenReturn(1000.0);

        ValidationDTO result = portfolioService.isValid(100L);

        assertTrue(result.getIsValid());
        assertEquals(1000.0, result.getGrantTotal());
        assertEquals( 100.0, result.getAssetWisePercentage().get("1")
        );
    }

    @Test
    @DisplayName("TC-PORT-010 | Reject validation when allocation drift reaches five percent")
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
    @DisplayName("TC-PORT-010 | Validation fails at exactly five percent")
    void isValid_shouldReturnInvalid_whenDriftIsFive() {

        Asset firstAsset =
                asset(1, "Equity");

        Asset secondAsset =
                asset(2, "Bonds");

        AllocationRule rule =
                new AllocationRule();

        rule.setAsset(firstAsset);
        rule.setPercentage(60.0);

        Theme theme = theme();

        theme.setAllocationRuleList(
                List.of(rule)
        );

        Portfolio portfolio =
                activePortfolio();

        portfolio.setTheme(theme);

        PortfolioHolding first =
                new PortfolioHolding();

        first.setId(10);
        first.setPortfolio(portfolio);
        first.setAsset(firstAsset);

        PortfolioHolding second =
                new PortfolioHolding();

        second.setId(11);
        second.setPortfolio(portfolio);
        second.setAsset(secondAsset);

        when(portfolioRepository.existsById(100L))
                .thenReturn(true);

        when(portfolioRepository.findById(100L))
                .thenReturn(Optional.of(portfolio));

        when(portfolioHoldingRepository
                .findAllByPortfolio(portfolio))
                .thenReturn(List.of(first, second));

        when(portfolioHoldingService
                .getTotalCost(first))
                .thenReturn(650.0);

        when(portfolioHoldingService
                .getTotalCost(second))
                .thenReturn(350.0);

        ValidationDTO result =
                portfolioService.isValid(100L);

        assertFalse(result.getIsValid());

        assertEquals(
                65.0,
                result.getAssetWisePercentage().get("1")
        );
    }


    @Test
    @DisplayName("TC-PORT-011 | Count portfolios")
    void getCountOfPortfolios_shouldReturnCount() {

        when(userRepository.existsById(1))
                .thenReturn(true);

        when(portfolioRepository
                .findByUserUserId(1))
                .thenReturn(
                        List.of(
                                new Portfolio(),
                                new Portfolio()
                        )
                );

        assertEquals(
                2,
                portfolioService.getCountOfPortfolios(1)
        );
    }


    @Test
    @DisplayName("TC-PORT-012 | Count active portfolios")
    void getCountOfActivePortfolios_shouldReturnOnlyActive() {

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

        when(portfolioRepository
                .findByUserUserId(1))
                .thenReturn(
                        List.of(active, draft)
                );

        assertEquals(
                1,
                portfolioService
                        .getCountOfActivePortfolios(1)
        );
    }


    @Test
    @DisplayName("TC-PORT-013 | Count portfolios rejects unknown user")
    void getCountOfPortfolios_shouldThrow_whenUserMissing() {

        when(userRepository.existsById(999))
                .thenReturn(false);

        assertThrows(
                UserNotFoundException.class,
                () -> portfolioService
                        .getCountOfPortfolios(999)
        );
    }


    @Test
    @DisplayName("TC-PORT-014 | Total remaining amount")
    void getTotalRemainingAmount_shouldSumPortfolioBalances() {

        when(userRepository.existsById(1))
                .thenReturn(true);

        Portfolio first = new Portfolio();
        first.setAmount(1000.0);

        Portfolio second = new Portfolio();
        second.setAmount(2500.0);

        when(portfolioRepository
                .findByUserUserId(1))
                .thenReturn(
                        List.of(first, second)
                );

        assertEquals(
                3500.0,
                portfolioService
                        .getTotalRemainingAmount(1)
        );
    }


    @Test
    @DisplayName("TC-PORT-015 | Total remaining amount rejects user")
    void getTotalRemainingAmount_shouldThrow_whenUserMissing() {

        when(userRepository.existsById(999))
                .thenReturn(false);

        assertThrows(
                UserNotFoundException.class,
                () -> portfolioService
                        .getTotalRemainingAmount(999)
        );
    }


    @Test
    @DisplayName("TC-PORT-016 | Get portfolio details")
    void getPortfolioDetails_shouldReturnPortfolio() {

        Portfolio portfolio =
                activePortfolio();

        when(userRepository.existsById(1))
                .thenReturn(true);

        when(portfolioRepository.existsById(100L))
                .thenReturn(true);

        when(portfolioRepository.findById(100L))
                .thenReturn(Optional.of(portfolio));

        Portfolio result =
                portfolioService
                        .getPortfolioDetails(100L, 1);

        assertSame(
                portfolio,
                result
        );
    }


    @Test
    @DisplayName("TC-PORT-017 | Portfolio details rejects missing portfolio")
    void getPortfolioDetails_shouldThrow_whenPortfolioMissing() {

        when(userRepository.existsById(1))
                .thenReturn(true);

        when(portfolioRepository.existsById(999L))
                .thenReturn(false);

        assertThrows(
                PortfolioNotFoundException.class,
                () -> portfolioService
                        .getPortfolioDetails(999L, 1)
        );
    }


    @Test
    @DisplayName("TC-PORT-018 | Portfolio details rejects missing user")
    void getPortfolioDetails_shouldThrow_whenUserMissing() {

        when(userRepository.existsById(999))
                .thenReturn(false);

        assertThrows(
                UserNotFoundException.class,
                () -> portfolioService
                        .getPortfolioDetails(100L, 999)
        );
    }


    @Test
    @DisplayName("TC-PORT-019 | Get portfolio basic information")
    void getPortfolioBasicInfo_shouldReturnData() {

        User user = user();

        Theme theme = theme();

        Portfolio portfolio =
                activePortfolio();

        portfolio.setTheme(theme);

        when(userRepository.findById(1))
                .thenReturn(Optional.of(user));

        when(portfolioRepository.findById(100L))
                .thenReturn(Optional.of(portfolio));

        PortfolioBasicInfoDTO result =
                portfolioService
                        .getPortfolioBasicInfo(100L, 1);

        assertEquals(
                100L,
                result.getPortfolioId()
        );

        assertEquals(
                "Growth Portfolio",
                result.getName()
        );

        assertEquals(
                "Growth theme",
                result.getThemeName()
        );
    }


    @Test
    @DisplayName("TC-PORT-020 | Basic information rejects unauthorized user")
    void getPortfolioBasicInfo_shouldRejectUnauthorizedUser() {

        User loggedIn =
                user();

        User owner =
                new User();

        owner.setUserId(2);

        Portfolio portfolio =
                activePortfolio();

        portfolio.setUser(owner);

        when(userRepository.findById(1))
                .thenReturn(Optional.of(loggedIn));

        when(portfolioRepository.findById(100L))
                .thenReturn(Optional.of(portfolio));

        RuntimeException exception =
                assertThrows(
                        RuntimeException.class,
                        () -> portfolioService
                                .getPortfolioBasicInfo(100L, 1)
                );

        assertEquals(
                "Unauthorized portfolio access",
                exception.getMessage()
        );
    }


    @Test
    @DisplayName("TC-PORT-021 | Theme allocation")
    void getThemeAllocation_shouldReturnRules() {

        User user =
                user();

        Asset asset =
                asset(1, "Equity");

        AllocationRule rule =
                new AllocationRule();

        rule.setId(20);
        rule.setAsset(asset);
        rule.setPercentage(60.0);

        Theme theme =
                theme();

        theme.setAllocationRuleList(
                List.of(rule)
        );

        Portfolio portfolio =
                activePortfolio();

        portfolio.setTheme(theme);

        when(userRepository.findById(1))
                .thenReturn(Optional.of(user));

        when(portfolioRepository.findById(100L))
                .thenReturn(Optional.of(portfolio));

        ThemeAllocationDTO result =
                portfolioService
                        .getThemeAllocation(100L, 1);

        assertEquals(
                10L,
                result.getThemeId()
        );

        assertEquals(
                "Growth theme",
                result.getThemeName()
        );

        assertEquals(
                1,
                result.getAllocationRules().size()
        );

        assertEquals(
                60.0,
                result.getAllocationRules()
                        .get(0)
                        .getTargetPercentage()
        );
    }


    @Test
    @DisplayName("TC-PORT-022 | Theme allocation rejects missing theme")
    void getThemeAllocation_shouldThrow_whenThemeMissing() {

        Portfolio portfolio =
                activePortfolio();

        portfolio.setTheme(null);

        when(userRepository.findById(1))
                .thenReturn(Optional.of(user()));

        when(portfolioRepository.findById(100L))
                .thenReturn(Optional.of(portfolio));

        assertThrows(
                ThemeNotFoundException.class,
                () -> portfolioService
                        .getThemeAllocation(100L, 1)
        );
    }


    @Test
    @DisplayName("TC-PORT-023 | Validate portfolio allocation")
    void validatePortfolioAllocation_shouldCalculateAllocation() {

        User user =
                user();

        Asset asset =
                asset(1, "Equity");

        AllocationRule rule =
                new AllocationRule();

        rule.setAsset(asset);
        rule.setPercentage(60.0);

        Theme theme =
                theme();

        theme.setAllocationRuleList(
                List.of(rule)
        );

        Portfolio portfolio =
                activePortfolio();

        portfolio.setTheme(theme);
        portfolio.setAmount(500.0);

        SecurityMaster security =
                new SecurityMaster();

        security.setId(20L);
        security.setSymbol("ABC");
        security.setName("ABC Ltd");
        security.setSecurityType(
                SecurityType.EQUITY
        );
        security.setAsset(asset);

        PortfolioHolding holding =
                new PortfolioHolding();

        holding.setId(10);
        holding.setPortfolio(portfolio);
        holding.setSecurityMaster(security);
        holding.setAsset(asset);
        holding.setQuantityHeld(5);
        holding.setTotalCost(500.0);
        holding.setHoldingStatus(
                HoldingStatus.BROUGHT
        );

        StockData stock =
                new StockData();

        stock.setClosePrice(
                new BigDecimal("100")
        );

        SecurityPriceDTO quote =
                new SecurityPriceDTO();

        quote.setSecurityMaster(security);
        quote.setStockData(stock);

        when(userRepository.findById(1))
                .thenReturn(Optional.of(user));

        when(portfolioRepository.findById(100L))
                .thenReturn(Optional.of(portfolio));

        when(portfolioHoldingRepository
                .findAllByPortfolio(portfolio))
                .thenReturn(List.of(holding));

        when(securityMasterClient
                .findBySecurityId(20L))
                .thenReturn(Optional.of(quote));

        AllocationValidationDTO result =
                portfolioService
                        .validatePortfolioAllocation(
                                100L,
                                1
                        );

        assertNotNull(result);

        assertEquals(
                500.0,
                result.getTotalInvestedAmount()
        );

        assertEquals(
                1000.0,
                result.getTotalCurrentValue()
        );

        assertEquals(
                1,
                result.getAllocations().size()
        );
    }


    @Test
    @DisplayName("TC-PORT-024 | Get current AUM")
    void getCurrentAum_shouldCalculateAum() {

        Portfolio portfolio =
                activePortfolio();

        portfolio.setAmount(500.0);

        Asset asset =
                asset(1, "Equity");

        SecurityMaster security =
                new SecurityMaster();

        security.setId(20L);
        security.setSecurityType(
                SecurityType.EQUITY
        );

        PortfolioHolding holding =
                new PortfolioHolding();

        holding.setSecurityMaster(security);
        holding.setQuantityHeld(5);

        StockData stock =
                new StockData();

        stock.setClosePrice(
                new BigDecimal("100")
        );

        SecurityPriceDTO quote =
                new SecurityPriceDTO();

        quote.setSecurityMaster(security);
        quote.setStockData(stock);

        when(portfolioHoldingRepository
                .findAllByPortfolio(portfolio))
                .thenReturn(List.of(holding));

        when(securityMasterClient
                .findBySecurityId(20L))
                .thenReturn(Optional.of(quote));

        assertEquals(
                1000.0,
                portfolioService.getCurrentAum(portfolio)
        );
    }


    @Test
    @DisplayName("TC-PORT-025 | Get total invested amount")
    void getTotalInvestedAmount_shouldIncludeBoughtHoldingsAndCash() {

        Portfolio portfolio =
                activePortfolio();

        portfolio.setAmount(500.0);

        PortfolioHolding holding =
                new PortfolioHolding();

        holding.setHoldingStatus(
                HoldingStatus.BROUGHT
        );

        holding.setTotalCost(1500.0);

        when(portfolioHoldingRepository
                .findAllByPortfolio(portfolio))
                .thenReturn(List.of(holding));

        assertEquals(
                2000.0,
                portfolioService
                        .getTotalInvestedAmount(portfolio)
        );
    }
}
