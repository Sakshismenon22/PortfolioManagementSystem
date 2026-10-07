package com.example.pms.service;

import com.example.pms.client.SecurityMasterClient;
import com.example.pms.dto.request.*;
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

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> portfolioService.createPortfolio(request));

        assertEquals("Portfolio amount must be greater than zero.", exception.getMessage());

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

    @Test
    @DisplayName("TC-PORT-026 | buyPortfolioHoldings - portfolio not found")
    void buyPortfolioHoldings_shouldThrow_whenPortfolioDoesNotExist() {

        when(portfolioRepository.existsById(999L))
                .thenReturn(false);

        assertThrows(
                PortfolioNotFoundException.class,
                () -> portfolioService.buyPortfolioHoldings(999L)
        );
    }


    @Test
    @DisplayName("TC-PORT-027 | buyPortfolioHoldings - validation failed")
    void buyPortfolioHoldings_shouldReturnValidationFailed_whenPortfolioAllocationInvalid() {

        Portfolio portfolio = activePortfolio();
        portfolio.setAmount(10000.0);

        Asset asset = asset(1, "Equity");

        AllocationRule rule = new AllocationRule();
        rule.setAsset(asset);
        rule.setPercentage(60.0);

        Theme theme = theme();
        theme.setAllocationRuleList(List.of(rule));

        portfolio.setTheme(theme);

        PortfolioHolding holding = new PortfolioHolding();
        holding.setId(10);
        holding.setPortfolio(portfolio);
        holding.setAsset(asset);

        when(portfolioRepository.existsById(100L))
                .thenReturn(true);

        when(portfolioRepository.findById(100L))
                .thenReturn(Optional.of(portfolio));

        when(portfolioHoldingRepository.findAllByPortfolio(portfolio))
                .thenReturn(List.of(holding));

        when(portfolioHoldingService.getTotalCost(holding))
                .thenReturn(1000.0);

        String result =
                portfolioService.buyPortfolioHoldings(100L);

        assertEquals("Validation Failed", result);
    }


    @Test
    @DisplayName("TC-PORT-028 | buyPortfolioHoldings - insufficient balance")
    void buyPortfolioHoldings_shouldReturnInsufficientBalance() {

        Portfolio portfolio = activePortfolio();
        portfolio.setAmount(500.0);

        Asset asset = asset(1, "Equity");

        AllocationRule rule = new AllocationRule();
        rule.setAsset(asset);
        rule.setPercentage(100.0);

        Theme theme = theme();
        theme.setAllocationRuleList(List.of(rule));

        portfolio.setTheme(theme);

        PortfolioHolding holding = new PortfolioHolding();
        holding.setId(10);
        holding.setPortfolio(portfolio);
        holding.setAsset(asset);

        when(portfolioRepository.existsById(100L))
                .thenReturn(true);

        when(portfolioRepository.findById(100L))
                .thenReturn(Optional.of(portfolio));

        when(portfolioHoldingRepository.findAllByPortfolio(portfolio))
                .thenReturn(List.of(holding));

        when(portfolioHoldingService.getTotalCost(holding))
                .thenReturn(1000.0);

        String result =
                portfolioService.buyPortfolioHoldings(100L);

        assertEquals("Portfolio Balance is insufficient", result);
    }


    @Test
    @DisplayName("TC-PORT-029 | buyPortfolioHoldings - success")
    void buyPortfolioHoldings_shouldBuyAndActivatePortfolio() {

        Portfolio portfolio = activePortfolio();
        portfolio.setAmount(5000.0);

        Asset asset = asset(1, "Equity");

        AllocationRule rule = new AllocationRule();
        rule.setAsset(asset);
        rule.setPercentage(100.0);

        Theme theme = theme();
        theme.setAllocationRuleList(List.of(rule));

        portfolio.setTheme(theme);

        PortfolioHolding holding = new PortfolioHolding();
        holding.setId(10);
        holding.setPortfolio(portfolio);
        holding.setAsset(asset);

        when(portfolioRepository.existsById(100L))
                .thenReturn(true);

        when(portfolioRepository.findById(100L))
                .thenReturn(Optional.of(portfolio));

        when(portfolioHoldingRepository.findAllByPortfolio(portfolio))
                .thenReturn(List.of(holding));

        when(portfolioHoldingService.getTotalCost(holding))
                .thenReturn(1000.0);

        when(driftWatchListRepository.findAllByPortfolioId(100L))
                .thenReturn(null);

        String result =
                portfolioService.buyPortfolioHoldings(100L);

        assertEquals(
                "Portfolio Holdings Brought.",
                result
        );

        assertEquals(
                4000.0,
                portfolio.getAmount()
        );

        assertEquals(
                PortfolioStatus.ACTIVE,
                portfolio.getPortfolioStatus()
        );

        verify(portfolioHoldingService)
                .buyHoldings(holding);

        verify(portfolioRepository)
                .save(portfolio);

        verify(driftWatchListRepository)
                .save(any(DriftWatchList.class));
    }


// ============================================================
// createAndActivatePortfolio()
// ============================================================

    @Test
    @DisplayName("TC-PORT-030 | createAndActivatePortfolio")
    void createAndActivatePortfolio_shouldCreateHoldingsAndActivate() {

        CreatePortfolioDTO createRequest =
                validCreateRequest();

        Portfolio portfolio =
                activePortfolio();

        AddPortfolioHoldingDTO holdingRequest =
                new AddPortfolioHoldingDTO(
                        null,
                        200L,
                        5,
                        1
                );

        CreateAndActivatePortfolioDTO request =
                new CreateAndActivatePortfolioDTO(
                        createRequest,
                        List.of(holdingRequest)
                );

        PortfolioServiceImpl spyService =
                spy(portfolioService);

        doReturn(portfolio)
                .when(spyService)
                .createPortfolio(createRequest);

        doReturn("Portfolio Holdings Brought.")
                .when(spyService)
                .buyPortfolioHoldings(100L);

        String result =
                spyService.createAndActivatePortfolio(request);

        assertEquals(
                "Portfolio Holdings Brought.",
                result
        );

        assertEquals(
                100L,
                holdingRequest.getPortfolioId()
        );

        verify(portfolioHoldingService)
                .addPortfolioHolding(holdingRequest);

        verify(spyService)
                .buyPortfolioHoldings(100L);
    }


// ============================================================
// addInitialHoldingsAndActivate()
// ============================================================

    private Portfolio newPortfolioForInitialHoldings() {

        Portfolio portfolio =
                activePortfolio();

        portfolio.setPortfolioStatus(
                PortfolioStatus.NEW
        );

        portfolio.setAmount(1000.0);

        Asset equity =
                asset(1, "Equity");

        AllocationRule rule =
                new AllocationRule();

        rule.setAsset(equity);
        rule.setPercentage(100.0);

        Theme theme =
                theme();

        theme.setAllocationRuleList(
                new ArrayList<>(List.of(rule))
        );

        portfolio.setTheme(theme);

        return portfolio;
    }


    private SecurityMaster initialEquitySecurity(Asset asset) {

        SecurityMaster security =
                new SecurityMaster();

        security.setId(200L);
        security.setName("ABC Limited");
        security.setSymbol("ABC");
        security.setSecurityType(SecurityType.EQUITY);
        security.setAsset(asset);

        return security;
    }


    @Test
    @DisplayName("TC-PORT-031 | Initial holdings - portfolio missing")
    void addInitialHoldingsAndActivate_shouldThrow_whenPortfolioMissing() {

        when(portfolioRepository.findById(999L))
                .thenReturn(Optional.empty());

        assertThrows(
                PortfolioNotFoundException.class,
                () -> portfolioService.addInitialHoldingsAndActivate(
                        999L,
                        List.of(
                                new BuyHoldingDTO(
                                        999L,
                                        1,
                                        200L,
                                        null
                                )
                        )
                )
        );
    }


    @Test
    @DisplayName("TC-PORT-032 | Initial holdings - portfolio not NEW")
    void addInitialHoldingsAndActivate_shouldRejectNonNewPortfolio() {

        Portfolio portfolio =
                activePortfolio();

        when(portfolioRepository.findById(100L))
                .thenReturn(Optional.of(portfolio));

        IllegalArgumentException exception =
                assertThrows(
                        IllegalArgumentException.class,
                        () -> portfolioService.addInitialHoldingsAndActivate(
                                100L,
                                List.of(
                                        new BuyHoldingDTO(
                                                100L,
                                                1,
                                                200L,
                                                null
                                        )
                                )
                        ));

        assertEquals(
                "Initial holdings can only be added to a New portfolio.",
                exception.getMessage()
        );
    }


    @Test
    @DisplayName("TC-PORT-033 | Initial holdings - null orders")
    void addInitialHoldingsAndActivate_shouldRejectNullOrders() {

        Portfolio portfolio =
                newPortfolioForInitialHoldings();

        when(portfolioRepository.findById(100L))
                .thenReturn(Optional.of(portfolio));

        IllegalArgumentException exception =
                assertThrows(
                        IllegalArgumentException.class,
                        () -> portfolioService.addInitialHoldingsAndActivate(
                                100L,
                                null
                        )
                );

        assertEquals(
                "Add between 1 and 50 securities to activate this portfolio.",
                exception.getMessage()
        );
    }


    @Test
    @DisplayName("TC-PORT-034 | Initial holdings - empty orders")
    void addInitialHoldingsAndActivate_shouldRejectEmptyOrders() {

        Portfolio portfolio =
                newPortfolioForInitialHoldings();

        when(portfolioRepository.findById(100L))
                .thenReturn(Optional.of(portfolio));

        assertThrows(
                IllegalArgumentException.class,
                () -> portfolioService.addInitialHoldingsAndActivate(
                        100L,
                        new ArrayList<>()
                )
        );
    }


    @Test
    @DisplayName("TC-PORT-035 | Initial holdings - already purchased")
    void addInitialHoldingsAndActivate_shouldRejectAlreadyPurchasedHoldings() {

        Portfolio portfolio =
                newPortfolioForInitialHoldings();

        PortfolioHolding holding =
                new PortfolioHolding();

        holding.setHoldingStatus(
                HoldingStatus.BROUGHT
        );

        holding.setQuantityHeld(2);

        when(portfolioRepository.findById(100L))
                .thenReturn(Optional.of(portfolio));

        when(portfolioHoldingRepository.findAllByPortfolio(portfolio))
                .thenReturn(List.of(holding));

        assertThrows(
                IllegalArgumentException.class,
                () -> portfolioService.addInitialHoldingsAndActivate(
                        100L,
                        List.of(
                                new BuyHoldingDTO(
                                        100L,
                                        1,
                                        200L,
                                        null
                                )
                        )
                )
        );
    }


    @Test
    @DisplayName("TC-PORT-036 | Initial holdings - invalid order")
    void addInitialHoldingsAndActivate_shouldRejectInvalidOrder() {

        Portfolio portfolio =
                newPortfolioForInitialHoldings();

        when(portfolioRepository.findById(100L))
                .thenReturn(Optional.of(portfolio));

        when(portfolioHoldingRepository.findAllByPortfolio(portfolio))
                .thenReturn(new ArrayList<>());

        assertThrows(
                IllegalArgumentException.class,
                () -> portfolioService.addInitialHoldingsAndActivate(
                        100L,
                        List.of(
                                new BuyHoldingDTO(
                                        100L,
                                        0,
                                        200L,
                                        null
                                )
                        )
                )
        );
    }


    @Test
    @DisplayName("TC-PORT-037 | Initial holdings - wrong portfolio")
    void addInitialHoldingsAndActivate_shouldRejectWrongPortfolio() {

        Portfolio portfolio =
                newPortfolioForInitialHoldings();

        when(portfolioRepository.findById(100L))
                .thenReturn(Optional.of(portfolio));

        when(portfolioHoldingRepository.findAllByPortfolio(portfolio))
                .thenReturn(new ArrayList<>());

        assertThrows(
                IllegalArgumentException.class,
                () -> portfolioService.addInitialHoldingsAndActivate(
                        100L,
                        List.of(
                                new BuyHoldingDTO(
                                        999L,
                                        1,
                                        200L,
                                        null
                                )
                        )
                )
        );
    }


    @Test
    @DisplayName("TC-PORT-038 | Initial holdings - security missing")
    void addInitialHoldingsAndActivate_shouldRejectMissingSecurity() {

        Portfolio portfolio =
                newPortfolioForInitialHoldings();

        when(portfolioRepository.findById(100L))
                .thenReturn(Optional.of(portfolio));

        when(portfolioHoldingRepository.findAllByPortfolio(portfolio))
                .thenReturn(new ArrayList<>());

        when(securityMasterRepository.findById(200L))
                .thenReturn(Optional.empty());

        assertThrows(
                com.example.pms.exception.SecurityNotFoundException.class,
                () -> portfolioService.addInitialHoldingsAndActivate(
                        100L,
                        List.of(
                                new BuyHoldingDTO(
                                        100L,
                                        1,
                                        200L,
                                        null
                                )
                        )
                ));
    }


    @Test
    @DisplayName("TC-PORT-039 | Initial holdings - security without asset")
    void addInitialHoldingsAndActivate_shouldRejectSecurityWithoutAsset() {

        Portfolio portfolio =
                newPortfolioForInitialHoldings();

        SecurityMaster security =
                initialEquitySecurity(null);

        when(portfolioRepository.findById(100L))
                .thenReturn(Optional.of(portfolio));

        when(portfolioHoldingRepository.findAllByPortfolio(portfolio))
                .thenReturn(new ArrayList<>());

        when(securityMasterRepository.findById(200L))
                .thenReturn(Optional.of(security));

        assertThrows(
                IllegalArgumentException.class,
                () -> portfolioService.addInitialHoldingsAndActivate(
                        100L,
                        List.of(
                                new BuyHoldingDTO(
                                        100L,
                                        1,
                                        200L,
                                        null
                                )
                        )
                ));
    }


//    @Test
//    @DisplayName("TC-PORT-040 | Initial holdings - outside theme")
//    void addInitialHoldingsAndActivate_shouldRejectSecurityOutsideTheme() {
//
//        Portfolio portfolio =
//                newPortfolioForInitialHoldings();
//
//        Asset differentAsset =
//                asset(99, "Bonds");
//
//        SecurityMaster security =
//                initialEquitySecurity(differentAsset);
//
//        when(portfolioRepository.findById(100L))
//                .thenReturn(Optional.of(portfolio));
//
//        when(portfolioHoldingRepository.findAllByPortfolio(portfolio))
//                .thenReturn(new ArrayList<>());
//
//        when(securityMasterRepository.findById(200L))
//                .thenReturn(Optional.of(security));
//
//        when(securityMasterService.getCurrentPrice(200L))
//                .thenReturn(100.0);
//
//        assertThrows(
//                IllegalArgumentException.class,
//                () -> portfolioService.addInitialHoldingsAndActivate(
//                        100L,
//                        List.of(
//                                new BuyHoldingDTO(
//                                        100L,
//                                        1,
//                                        200L,
//                                        null
//                                )
//                        )
//                ));
//    }
//

    @Test
    @DisplayName("TC-PORT-041 | Initial holdings - invalid current price")
    void addInitialHoldingsAndActivate_shouldRejectInvalidPrice() {

        Asset equity =
                asset(1, "Equity");

        Portfolio portfolio =
                newPortfolioForInitialHoldings();

        SecurityMaster security =
                initialEquitySecurity(equity);

        when(portfolioRepository.findById(100L))
                .thenReturn(Optional.of(portfolio));

        when(portfolioHoldingRepository.findAllByPortfolio(portfolio))
                .thenReturn(new ArrayList<>());

        when(securityMasterRepository.findById(200L))
                .thenReturn(Optional.of(security));

        when(securityMasterService.getCurrentPrice(200L))
                .thenReturn(0.0);

        assertThrows(
                IllegalArgumentException.class,
                () -> portfolioService.addInitialHoldingsAndActivate(
                        100L,
                        List.of(
                                new BuyHoldingDTO(
                                        100L,
                                        1,
                                        200L,
                                        null
                                )
                        )
                ));
    }


    @Test
    @DisplayName("TC-PORT-042 | Initial holdings - successful activation")
    void addInitialHoldingsAndActivate_shouldActivatePortfolio() {

        Asset equity =
                asset(1, "Equity");

        Portfolio portfolio =
                newPortfolioForInitialHoldings();

        SecurityMaster security =
                initialEquitySecurity(equity);

        when(portfolioRepository.findById(100L))
                .thenReturn(Optional.of(portfolio));

        when(portfolioHoldingRepository.findAllByPortfolio(portfolio))
                .thenReturn(new ArrayList<>());

        when(securityMasterRepository.findById(200L))
                .thenReturn(Optional.of(security));

        when(securityMasterService.getCurrentPrice(200L))
                .thenReturn(100.0);

        when(driftWatchListRepository.findAllByPortfolioId(100L))
                .thenReturn(null);

        BuyHoldingDTO order =
                new BuyHoldingDTO(
                        100L,
                        10,
                        200L,
                        EquityCategory.LARGE_CAP
                );

        String result =
                portfolioService.addInitialHoldingsAndActivate(
                        100L,
                        List.of(order)
                );

        assertEquals(
                "Initial holdings validated and portfolio activated.",
                result
        );

        assertEquals(
                PortfolioStatus.ACTIVE,
                portfolio.getPortfolioStatus()
        );

        assertEquals(
                0.0,
                portfolio.getAmount()
        );

        verify(portfolioHoldingRepository)
                .save(any(PortfolioHolding.class));

        verify(securityMasterRepository)
                .save(security);

        verify(portfolioRepository)
                .save(portfolio);

        verify(driftWatchListRepository)
                .save(any(DriftWatchList.class));
    }


// ============================================================
// getAllPortfolioDetails()
// ============================================================

    @Test
    @DisplayName("TC-PORT-043 | Get all portfolio details")
    void getAllPortfolioDetails_shouldReturnPortfolioDetails() {

        Portfolio portfolio =
                activePortfolio();

        portfolio.setName("Growth Portfolio");

        when(userRepository.existsById(1))
                .thenReturn(true);

        when(portfolioRepository.findByUserUserId(1))
                .thenReturn(List.of(portfolio));

        when(portfolioHoldingRepository.findAllByPortfolio(portfolio))
                .thenReturn(new ArrayList<>());

        GetAllPortfolioResponseDTO result =
                portfolioService.getAllPortfolioDetails(
                        new GetAllPortfolioDTO(1)
                );

        assertNotNull(result);

        assertEquals(
                1,
                result.getPortfolioDetailsDTOList().size()
        );

        PortfolioDetailsDTO dto =
                result.getPortfolioDetailsDTOList().get(0);

        assertEquals(
                "GP",
                dto.getInitials()
        );

        assertEquals(
                "Growth Portfolio",
                dto.getName()
        );
    }


    @Test
    @DisplayName("TC-PORT-044 | Get all portfolios - user missing")
    void getAllPortfolioDetails_shouldThrow_whenUserMissing() {

        when(userRepository.existsById(999))
                .thenReturn(false);

        assertThrows(
                UserNotFoundException.class,
                () -> portfolioService.getAllPortfolioDetails(
                        new GetAllPortfolioDTO(999)
                )
        );
    }


// ============================================================
// getCurrentAum() - all security types
// ============================================================

    private SecurityPriceDTO equityQuote(
            SecurityMaster security,
            double price) {

        StockData stock =
                new StockData();

        stock.setClosePrice(
                BigDecimal.valueOf(price)
        );

        SecurityPriceDTO quote =
                new SecurityPriceDTO();

        quote.setSecurityMaster(security);
        quote.setStockData(stock);

        return quote;
    }


    private SecurityPriceDTO mutualFundQuote(
            SecurityMaster security,
            double nav) {

        MutualFundNav mutualFundNav =
                new MutualFundNav();

        mutualFundNav.setNav(
                BigDecimal.valueOf(nav)
        );

        SecurityPriceDTO quote =
                new SecurityPriceDTO();

        quote.setSecurityMaster(security);
        quote.setMutualFundNav(mutualFundNav);

        return quote;
    }


    private SecurityPriceDTO bondQuote(
            SecurityMaster security,
            double faceValue) {

        Bond bond =
                new Bond();

        bond.setFaceValue(faceValue);

        SecurityPriceDTO quote =
                new SecurityPriceDTO();

        quote.setSecurityMaster(security);
        quote.setBond(bond);

        return quote;
    }


    private SecurityPriceDTO commodityQuote(
            SecurityMaster security,
            double price,
            String quotation) {

        CommoditySpotData commodity =
                new CommoditySpotData();

        commodity.setSpotPrice(
                BigDecimal.valueOf(price)
        );

        commodity.setQuotation(
                quotation
        );

        SecurityPriceDTO quote =
                new SecurityPriceDTO();

        quote.setSecurityMaster(security);
        quote.setCommoditySpotData(commodity);

        return quote;
    }


    @Test
    @DisplayName("TC-PORT-045 | Current AUM - ETF")
    void getCurrentAum_shouldHandleEtf() {

        Portfolio portfolio =
                activePortfolio();

        portfolio.setAmount(100.0);

        Asset asset =
                asset(1, "Equity");

        SecurityMaster security =
                initialEquitySecurity(asset);

        security.setSecurityType(
                SecurityType.ETF
        );

        PortfolioHolding holding =
                new PortfolioHolding();

        holding.setSecurityMaster(security);
        holding.setQuantityHeld(2);

        when(portfolioHoldingRepository.findAllByPortfolio(portfolio))
                .thenReturn(List.of(holding));

        when(securityMasterClient.findBySecurityId(200L))
                .thenReturn(
                        Optional.of(
                                equityQuote(security, 50.0)
                        )
                );

        assertEquals(
                200.0,
                portfolioService.getCurrentAum(portfolio)
        );
    }


    @Test
    @DisplayName("TC-PORT-046 | Current AUM - mutual fund")
    void getCurrentAum_shouldHandleMutualFund() {

        Portfolio portfolio =
                activePortfolio();

        portfolio.setAmount(100.0);

        Asset asset =
                asset(1, "Mutual Funds");

        SecurityMaster security =
                new SecurityMaster();

        security.setId(201L);
        security.setName("Test Mutual Fund");
        security.setSymbol("MF");
        security.setSecurityType(
                SecurityType.MUTUAL_FUND
        );
        security.setAsset(asset);

        PortfolioHolding holding =
                new PortfolioHolding();

        holding.setSecurityMaster(security);
        holding.setQuantityHeld(2);

        when(portfolioHoldingRepository.findAllByPortfolio(portfolio))
                .thenReturn(List.of(holding));

        when(securityMasterClient.findBySecurityId(201L))
                .thenReturn(
                        Optional.of(
                                mutualFundQuote(security, 50.0)
                        )
                );

        assertEquals(
                200.0,
                portfolioService.getCurrentAum(portfolio)
        );
    }


    @Test
    @DisplayName("TC-PORT-047 | Current AUM - bond")
    void getCurrentAum_shouldHandleBond() {

        Portfolio portfolio =
                activePortfolio();

        portfolio.setAmount(100.0);

        Asset asset =
                asset(1, "Bonds");

        SecurityMaster security =
                new SecurityMaster();

        security.setId(202L);
        security.setName("Test Bond");
        security.setSymbol("BOND");
        security.setSecurityType(
                SecurityType.BOND
        );
        security.setAsset(asset);

        PortfolioHolding holding =
                new PortfolioHolding();

        holding.setSecurityMaster(security);
        holding.setQuantityHeld(2);

        when(portfolioHoldingRepository.findAllByPortfolio(portfolio))
                .thenReturn(List.of(holding));

        when(securityMasterClient.findBySecurityId(202L))
                .thenReturn(
                        Optional.of(
                                bondQuote(security, 50.0)
                        )
                );

        assertEquals(
                200.0,
                portfolioService.getCurrentAum(portfolio)
        );
    }


    @Test
    @DisplayName("TC-PORT-048 | Current AUM - commodity")
    void getCurrentAum_shouldHandleCommodity() {

        Portfolio portfolio =
                activePortfolio();

        portfolio.setAmount(100.0);

        Asset asset =
                asset(1, "Commodities");

        SecurityMaster security =
                new SecurityMaster();

        security.setId(203L);
        security.setName("Gold");
        security.setSymbol("GOLD");
        security.setSecurityType(
                SecurityType.COMMODITY
        );
        security.setAsset(asset);

        PortfolioHolding holding =
                new PortfolioHolding();

        holding.setSecurityMaster(security);
        holding.setQuantityHeld(2);

        when(portfolioHoldingRepository.findAllByPortfolio(portfolio))
                .thenReturn(List.of(holding));

        when(securityMasterClient.findBySecurityId(203L))
                .thenReturn(
                        Optional.of(
                                commodityQuote(
                                        security,
                                        1000.0,
                                        "10 grams"
                                )
                        )
                );

        assertEquals(
                300.0,
                portfolioService.getCurrentAum(portfolio)
        );
    }


// ============================================================
// getPortfolioHoldings()
// ============================================================

    @Test
    @DisplayName("TC-PORT-049 | Portfolio holdings - equity")
    void getPortfolioHoldings_shouldReturnEquityHolding() {

        User user =
                user();

        Portfolio portfolio =
                activePortfolio();

        Asset asset =
                asset(1, "Equity");

        portfolio.setTheme(theme());

        SecurityMaster security =
                initialEquitySecurity(asset);

        security.setEquityCategory(
                EquityCategory.LARGE_CAP
        );

        PortfolioHolding holding =
                new PortfolioHolding();

        holding.setId(10);
        holding.setPortfolio(portfolio);
        holding.setSecurityMaster(security);
        holding.setAsset(asset);
        holding.setQuantityHeld(5);
        holding.setAverageCost(100.0);
        holding.setTotalCost(500.0);
        holding.setFirstBuyDate(LocalDate.now());
        holding.setHoldingStatus(
                HoldingStatus.BROUGHT
        );

        when(userRepository.findById(1))
                .thenReturn(Optional.of(user));

        when(portfolioRepository.findById(100L))
                .thenReturn(Optional.of(portfolio));

        when(portfolioHoldingRepository.findAllByPortfolio(portfolio))
                .thenReturn(List.of(holding));

        when(securityMasterClient.findBySecurityId(200L))
                .thenReturn(
                        Optional.of(
                                equityQuote(security, 120.0)
                        )
                );

        List<PortfolioHoldingDTO> result =
                portfolioService.getPortfolioHoldings(
                        100L,
                        1
                );

        assertEquals(
                1,
                result.size()
        );

        assertEquals(
                "ABC",
                result.get(0).getSymbol()
        );

        assertEquals(
                600.0,
                result.get(0).getCurrentValue()
        );

        assertEquals(
                "LARGE_CAP",
                result.get(0).getEquityCategory()
        );
    }


    @Test
    @DisplayName("TC-PORT-050 | Portfolio holdings - ignores sold holdings")
    void getPortfolioHoldings_shouldIgnoreSoldHoldings() {

        User user =
                user();

        Portfolio portfolio =
                activePortfolio();

        Asset asset =
                asset(1, "Equity");

        SecurityMaster security =
                initialEquitySecurity(asset);

        PortfolioHolding holding =
                new PortfolioHolding();

        holding.setId(10);
        holding.setPortfolio(portfolio);
        holding.setSecurityMaster(security);
        holding.setAsset(asset);
        holding.setQuantityHeld(5);
        holding.setTotalCost(500.0);
        holding.setHoldingStatus(
                HoldingStatus.SOLD
        );

        when(userRepository.findById(1))
                .thenReturn(Optional.of(user));

        when(portfolioRepository.findById(100L))
                .thenReturn(Optional.of(portfolio));

        when(portfolioHoldingRepository.findAllByPortfolio(portfolio))
                .thenReturn(List.of(holding));

        List<PortfolioHoldingDTO> result =
                portfolioService.getPortfolioHoldings(
                        100L,
                        1
                );

        assertTrue(result.isEmpty());
    }


    @Test
    @DisplayName("TC-PORT-051 | Portfolio holdings - missing quote uses fallback")
    void getPortfolioHoldings_shouldUseFallbackWhenQuoteMissing() {

        User user =
                user();

        Portfolio portfolio =
                activePortfolio();

        Asset asset =
                asset(1, "Equity");

        SecurityMaster security =
                initialEquitySecurity(asset);

        PortfolioHolding holding =
                new PortfolioHolding();

        holding.setId(10);
        holding.setPortfolio(portfolio);
        holding.setSecurityMaster(security);
        holding.setAsset(asset);
        holding.setQuantityHeld(5);
        holding.setTotalCost(500.0);
        holding.setAverageCost(100.0);
        holding.setHoldingStatus(
                HoldingStatus.BROUGHT
        );

        when(userRepository.findById(1))
                .thenReturn(Optional.of(user));

        when(portfolioRepository.findById(100L))
                .thenReturn(Optional.of(portfolio));

        when(portfolioHoldingRepository.findAllByPortfolio(portfolio))
                .thenReturn(List.of(holding));

        when(securityMasterClient.findBySecurityId(200L))
                .thenReturn(Optional.empty());

        List<PortfolioHoldingDTO> result =
                portfolioService.getPortfolioHoldings(
                        100L,
                        1
                );

        assertEquals(
                500.0,
                result.get(0).getCurrentValue()
        );
    }


    @Test
    @DisplayName("TC-PORT-052 | Portfolio holdings - mutual fund")
    void getPortfolioHoldings_shouldHandleMutualFund() {

        User user =
                user();

        Portfolio portfolio =
                activePortfolio();

        Asset asset =
                asset(1, "Mutual Funds");

        SecurityMaster security =
                new SecurityMaster();

        security.setId(204L);
        security.setName("Mutual Fund");
        security.setSymbol("MF");
        security.setSecurityType(
                SecurityType.MUTUAL_FUND
        );
        security.setAsset(asset);

        PortfolioHolding holding =
                new PortfolioHolding();

        holding.setId(11);
        holding.setPortfolio(portfolio);
        holding.setSecurityMaster(security);
        holding.setAsset(asset);
        holding.setQuantityHeld(2);
        holding.setTotalCost(100.0);
        holding.setAverageCost(50.0);
        holding.setHoldingStatus(
                HoldingStatus.BROUGHT
        );

        when(userRepository.findById(1))
                .thenReturn(Optional.of(user));

        when(portfolioRepository.findById(100L))
                .thenReturn(Optional.of(portfolio));

        when(portfolioHoldingRepository.findAllByPortfolio(portfolio))
                .thenReturn(List.of(holding));

        when(securityMasterClient.findBySecurityId(204L))
                .thenReturn(
                        Optional.of(
                                mutualFundQuote(security, 70.0)
                        )
                );

        List<PortfolioHoldingDTO> result =
                portfolioService.getPortfolioHoldings(
                        100L,
                        1
                );

        assertEquals(
                140.0,
                result.get(0).getCurrentValue()
        );
    }


    @Test
    @DisplayName("TC-PORT-053 | Portfolio holdings - bond")
    void getPortfolioHoldings_shouldHandleBond() {

        User user =
                user();

        Portfolio portfolio =
                activePortfolio();

        Asset asset =
                asset(1, "Bonds");

        SecurityMaster security =
                new SecurityMaster();

        security.setId(205L);
        security.setName("Bond");
        security.setSymbol("BOND");
        security.setSecurityType(
                SecurityType.BOND
        );
        security.setAsset(asset);

        PortfolioHolding holding =
                new PortfolioHolding();

        holding.setId(12);
        holding.setPortfolio(portfolio);
        holding.setSecurityMaster(security);
        holding.setAsset(asset);
        holding.setQuantityHeld(2);
        holding.setTotalCost(100.0);
        holding.setAverageCost(50.0);
        holding.setHoldingStatus(
                HoldingStatus.BROUGHT
        );

        when(userRepository.findById(1))
                .thenReturn(Optional.of(user));

        when(portfolioRepository.findById(100L))
                .thenReturn(Optional.of(portfolio));

        when(portfolioHoldingRepository.findAllByPortfolio(portfolio))
                .thenReturn(List.of(holding));

        Bond bond =
                new Bond();

        bond.setCleanPrice(70.0);
        bond.setFaceValue(60.0);

        SecurityPriceDTO quote =
                new SecurityPriceDTO();

        quote.setSecurityMaster(security);
        quote.setBond(bond);

        when(securityMasterClient.findBySecurityId(205L))
                .thenReturn(Optional.of(quote));

        List<PortfolioHoldingDTO> result =
                portfolioService.getPortfolioHoldings(
                        100L,
                        1
                );

        assertEquals(
                140.0,
                result.get(0).getCurrentValue()
        );
    }


// ============================================================
// validatePortfolioAllocation() - additional branches
// ============================================================

    @Test
    @DisplayName("TC-PORT-054 | Allocation validation - sold and zero quantity ignored")
    void validatePortfolioAllocation_shouldIgnoreInvalidHoldings() {

        User user =
                user();

        Portfolio portfolio =
                activePortfolio();

        Asset asset =
                asset(1, "Equity");

        AllocationRule rule =
                new AllocationRule();

        rule.setAsset(asset);
        rule.setPercentage(100.0);

        Theme theme =
                theme();

        theme.setAllocationRuleList(
                List.of(rule)
        );

        portfolio.setTheme(theme);

        PortfolioHolding sold =
                new PortfolioHolding();

        sold.setHoldingStatus(
                HoldingStatus.SOLD
        );
        sold.setQuantityHeld(5);
        sold.setTotalCost(500.0);

        PortfolioHolding zero =
                new PortfolioHolding();

        zero.setHoldingStatus(
                HoldingStatus.BROUGHT
        );
        zero.setQuantityHeld(0);
        zero.setTotalCost(500.0);

        when(userRepository.findById(1))
                .thenReturn(Optional.of(user));

        when(portfolioRepository.findById(100L))
                .thenReturn(Optional.of(portfolio));

        when(portfolioHoldingRepository.findAllByPortfolio(portfolio))
                .thenReturn(List.of(sold, zero));

        AllocationValidationDTO result =
                portfolioService.validatePortfolioAllocation(
                        100L,
                        1
                );

        assertNotNull(result);

        assertEquals(
                10000.0,
                result.getTotalCurrentValue()
        );

        assertFalse(result.getValid());
    }


// ============================================================
// getEachAssetInvestment()
// ============================================================

//    @Test
//    @DisplayName("TC-PORT-055 | Get each asset investment")
//    void getEachAssetInvestment_shouldMergeInvestments() {
//
//        Portfolio portfolio =
//                activePortfolio();
//
//        Asset asset =
//                asset(1, "Equity");
//
//        AllocationRule rule =
//                new AllocationRule();
//
//        rule.setAsset(asset);
//        rule.setPercentage(100.0);
//
//        Theme theme =
//                theme();
//
//        theme.setAllocationRuleList(
//                List.of(rule)
//        );
//
//        portfolio.setTheme(theme);
//
//        PortfolioHolding holding =
//                new PortfolioHolding();
//
//        holding.setPortfolio(portfolio);
//        holding.setAsset(asset);
//
//        when(userRepository.existsById(1))
//                .thenReturn(true);
//
//        when(portfolioRepository.findByUserUserId(1))
//                .thenReturn(List.of(portfolio));
//
//        when(portfolioRepository.existsById(100L))
//                .thenReturn(true);
//
//        when(portfolioRepository.findById(100L))
//                .thenReturn(Optional.of(portfolio));
//
//        when(portfolioHoldingRepository.findAllByPortfolio(portfolio))
//                .thenReturn(List.of(holding));
//
//        when(portfolioHoldingService.getTotalCost(holding))
//                .thenReturn(1000.0);
//
//        when(assetRepository.findByAssetClass("Equity"))
//                .thenReturn(asset);
//
//        AssetInvestmentDTO result =
//                portfolioService.getEachAssetInvestment(1);
//
//        assertNotNull(result);
//
//        assertEquals(
//                1000.0,
//                result.getTotalBalance()
//        );
//
//        assertEquals(
//                1000.0,
//                result.getAssetWiseInvestment().get(asset)
//        );
//    }


    @Test
    @DisplayName("TC-PORT-056 | Get each asset investment - missing user")
    void getEachAssetInvestment_shouldThrow_whenUserMissing() {

        when(userRepository.existsById(999))
                .thenReturn(false);

        assertThrows(
                UserNotFoundException.class,
                () -> portfolioService.getEachAssetInvestment(999)
        );
    }

    @Test
    void createPortfolio_shouldRejectNegativeAmount() {

        CreatePortfolioDTO request =
                validCreateRequest();

        request.setAmount(-100.0);

        assertThrows(
                IllegalArgumentException.class,
                () -> portfolioService.createPortfolio(request)
        );
    }


    @Test
    void createPortfolio_shouldRejectNaNAmount() {

        CreatePortfolioDTO request =
                validCreateRequest();

        request.setAmount(Double.NaN);

        assertThrows(
                IllegalArgumentException.class,
                () -> portfolioService.createPortfolio(request)
        );
    }


    @Test
    void createPortfolio_shouldRejectInfiniteAmount() {

        CreatePortfolioDTO request =
                validCreateRequest();

        request.setAmount(Double.POSITIVE_INFINITY);

        assertThrows(
                IllegalArgumentException.class,
                () -> portfolioService.createPortfolio(request)
        );
    }


}
