package com.example.pms.service;

import com.example.pms.client.SecurityMasterClient;
import com.example.pms.dto.request.AddPortfolioHoldingDTO;
import com.example.pms.dto.request.BuyHoldingDTO;
import com.example.pms.dto.request.SellHoldingDTO;
import com.example.pms.dto.response.SecurityPriceDTO;
import com.example.pms.exception.AssetNotFoundException;
import com.example.pms.exception.PortfolioHoldingNotFoundException;
import com.example.pms.exception.PortfolioNotFoundException;
import com.example.pms.exception.SecurityNotFoundException;
import com.example.pms.model.*;
import com.example.pms.model.enums.EquityCategory;
import com.example.pms.model.enums.HoldingStatus;
import com.example.pms.model.enums.PortfolioStatus;
import com.example.pms.model.enums.SecurityType;
import com.example.pms.repository.AssetRepository;
import com.example.pms.repository.PortFolioHoldingRepository;
import com.example.pms.repository.PortfolioRepository;
import com.example.pms.repository.SecurityMasterRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PortfolioHoldingServiceImplTest {

    @Mock
    private PortfolioRepository portfolioRepository;

    @Mock
    private AssetRepository assetRepository;

    @Mock
    private SecurityMasterRepository securityMasterRepository;

    @Mock
    private PortFolioHoldingRepository portfolioHoldingRepository;

    @Mock
    private SecurityMasterClient securityMasterClient;

    @Mock
    private SecurityMasterService securityMasterService;

    @InjectMocks
    private PortfolioHoldingServiceImpl holdingService;


    private Portfolio activePortfolio() {

        Portfolio portfolio =
                new Portfolio();

        portfolio.setId(100L);
        portfolio.setName("Test Portfolio");
        portfolio.setAmount(10000.0);
        portfolio.setPortfolioStatus(
                PortfolioStatus.ACTIVE
        );

        return portfolio;
    }


    private Asset equityAsset() {

        Asset asset =
                new Asset();

        asset.setId(1);
        asset.setAssetClass("Equity");

        return asset;
    }


    private SecurityMaster equitySecurity() {

        SecurityMaster security =
                new SecurityMaster();

        security.setId(200L);
        security.setName("ABC Ltd");
        security.setSymbol("ABC");
        security.setSecurityType(
                SecurityType.EQUITY
        );
        security.setAsset(
                equityAsset()
        );

        return security;
    }


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


    @Test
    @DisplayName("TC-HOLD-001 | Add holding successfully")
    void addPortfolioHolding_shouldSaveHolding() {

        AddPortfolioHoldingDTO request =
                new AddPortfolioHoldingDTO(
                        100L,
                        200L,
                        10,
                        1
                );

        Portfolio portfolio =
                activePortfolio();

        Asset asset =
                equityAsset();

        SecurityMaster security =
                equitySecurity();

        when(portfolioRepository.existsById(100L))
                .thenReturn(true);

        when(assetRepository.existsById(1))
                .thenReturn(true);

        when(securityMasterRepository
                .existsById(200L))
                .thenReturn(true);

        when(portfolioRepository.findById(100L))
                .thenReturn(Optional.of(portfolio));

        when(assetRepository.findById(1))
                .thenReturn(Optional.of(asset));

        when(securityMasterRepository
                .findById(200L))
                .thenReturn(Optional.of(security));

        assertEquals(
                "Portfolio Saved",
                holdingService
                        .addPortfolioHolding(request)
        );

        verify(portfolioHoldingRepository)
                .save(any(PortfolioHolding.class));
    }


    @Test
    @DisplayName("TC-HOLD-002 | Add holding rejects missing portfolio")
    void addPortfolioHolding_shouldThrow_whenPortfolioMissing() {

        AddPortfolioHoldingDTO request =
                new AddPortfolioHoldingDTO(
                        999L,
                        200L,
                        10,
                        1
                );

        when(portfolioRepository.existsById(999L))
                .thenReturn(false);

        assertThrows(
                PortfolioNotFoundException.class,
                () -> holdingService
                        .addPortfolioHolding(request)
        );
    }


    @Test
    @DisplayName("TC-HOLD-003 | Add holding rejects missing asset")
    void addPortfolioHolding_shouldThrow_whenAssetMissing() {

        AddPortfolioHoldingDTO request =
                new AddPortfolioHoldingDTO(
                        100L,
                        200L,
                        10,
                        999
                );

        when(portfolioRepository.existsById(100L))
                .thenReturn(true);

        when(assetRepository.existsById(999))
                .thenReturn(false);

        assertThrows(
                AssetNotFoundException.class,
                () -> holdingService
                        .addPortfolioHolding(request)
        );
    }


    @Test
    @DisplayName("TC-HOLD-004 | Add holding rejects missing security")
    void addPortfolioHolding_shouldThrow_whenSecurityMissing() {

        AddPortfolioHoldingDTO request =
                new AddPortfolioHoldingDTO(
                        100L,
                        999L,
                        10,
                        1
                );

        when(portfolioRepository.existsById(100L))
                .thenReturn(true);

        when(assetRepository.existsById(1))
                .thenReturn(true);

        when(securityMasterRepository
                .existsById(999L))
                .thenReturn(false);

        assertThrows(
                SecurityNotFoundException.class,
                () -> holdingService
                        .addPortfolioHolding(request)
        );
    }


    @Test
    @DisplayName("TC-HOLD-005 | Buy equity")
    void buyHoldings_shouldCalculateEquityCost() {

        Portfolio portfolio =
                activePortfolio();

        SecurityMaster security =
                equitySecurity();

        PortfolioHolding holding =
                new PortfolioHolding();

        holding.setId(10);
        holding.setPortfolio(portfolio);
        holding.setSecurityMaster(security);
        holding.setQuantityHeld(10);

        when(portfolioHoldingRepository
                .existsById(10))
                .thenReturn(true);

        when(portfolioRepository
                .existsById(100L))
                .thenReturn(true);

        when(securityMasterRepository
                .existsById(200L))
                .thenReturn(true);

        when(securityMasterClient
                .findBySecurityId(200L))
                .thenReturn(
                        Optional.of(
                                equityQuote(
                                        security,
                                        125.50
                                )
                        )
                );

        assertEquals(
                "Holding Brought.",
                holdingService.buyHoldings(holding)
        );

        assertEquals(
                HoldingStatus.BROUGHT,
                holding.getHoldingStatus()
        );

        assertEquals(
                1255.0,
                holding.getTotalCost()
        );

        assertEquals(
                125.5,
                holding.getAverageCost()
        );

        verify(portfolioHoldingRepository)
                .save(holding);
    }


    @Test
    @DisplayName("TC-HOLD-006 | Buy ETF")
    void buyHoldings_shouldCalculateEtfCost() {

        Portfolio portfolio =
                activePortfolio();

        SecurityMaster security =
                equitySecurity();

        security.setSecurityType(
                SecurityType.ETF
        );

        PortfolioHolding holding =
                new PortfolioHolding();

        holding.setId(10);
        holding.setPortfolio(portfolio);
        holding.setSecurityMaster(security);
        holding.setQuantityHeld(4);

        when(portfolioHoldingRepository.existsById(10))
                .thenReturn(true);

        when(portfolioRepository.existsById(100L))
                .thenReturn(true);

        when(securityMasterRepository.existsById(200L))
                .thenReturn(true);

        when(securityMasterClient.findBySecurityId(200L))
                .thenReturn(
                        Optional.of(
                                equityQuote(
                                        security,
                                        250.0
                                )
                        )
                );

        holdingService.buyHoldings(holding);

        assertEquals(
                1000.0,
                holding.getTotalCost()
        );
    }


    @Test
    @DisplayName("TC-HOLD-007 | Buy mutual fund")
    void buyHoldings_shouldCalculateMutualFundCost() {

        Portfolio portfolio =
                activePortfolio();

        SecurityMaster security =
                equitySecurity();

        security.setSecurityType(
                SecurityType.MUTUAL_FUND
        );

        MutualFundNav nav =
                new MutualFundNav();

        nav.setNav(
                BigDecimal.valueOf(50)
        );

        SecurityPriceDTO quote =
                new SecurityPriceDTO();

        quote.setSecurityMaster(security);
        quote.setMutualFundNav(nav);

        PortfolioHolding holding =
                new PortfolioHolding();

        holding.setId(10);
        holding.setPortfolio(portfolio);
        holding.setSecurityMaster(security);
        holding.setQuantityHeld(10);

        when(portfolioHoldingRepository.existsById(10))
                .thenReturn(true);

        when(portfolioRepository.existsById(100L))
                .thenReturn(true);

        when(securityMasterRepository.existsById(200L))
                .thenReturn(true);

        when(securityMasterClient.findBySecurityId(200L))
                .thenReturn(Optional.of(quote));

        holdingService.buyHoldings(holding);

        assertEquals(
                500.0,
                holding.getTotalCost()
        );
    }


    @Test
    @DisplayName("TC-HOLD-008 | Buy bond")
    void buyHoldings_shouldCalculateBondCost() {

        Portfolio portfolio =
                activePortfolio();

        SecurityMaster security =
                equitySecurity();

        security.setSecurityType(
                SecurityType.BOND
        );

        Bond bond =
                new Bond();

        bond.setCleanPrice(1000.0);

        SecurityPriceDTO quote =
                new SecurityPriceDTO();

        quote.setSecurityMaster(security);
        quote.setBond(bond);

        PortfolioHolding holding =
                new PortfolioHolding();

        holding.setId(10);
        holding.setPortfolio(portfolio);
        holding.setSecurityMaster(security);
        holding.setQuantityHeld(2);

        when(portfolioHoldingRepository.existsById(10))
                .thenReturn(true);

        when(portfolioRepository.existsById(100L))
                .thenReturn(true);

        when(securityMasterRepository.existsById(200L))
                .thenReturn(true);

        when(securityMasterClient.findBySecurityId(200L))
                .thenReturn(Optional.of(quote));

        holdingService.buyHoldings(holding);

        assertEquals(
                (1000.0 + 9.91) * 2,
                holding.getTotalCost()
        );
    }


    @Test
    @DisplayName("TC-HOLD-009 | Buy commodity")
    void buyHoldings_shouldCalculateCommodityCost() {

        Portfolio portfolio =
                activePortfolio();

        SecurityMaster security =
                equitySecurity();

        security.setSecurityType(
                SecurityType.COMMODITY
        );
        security.setSymbol("GOLD");

        CommoditySpotData commodity =
                new CommoditySpotData();

        commodity.setSpotPrice(
                BigDecimal.valueOf(10000)
        );
        commodity.setQuotation("10 grams");

        SecurityPriceDTO quote =
                new SecurityPriceDTO();

        quote.setSecurityMaster(security);
        quote.setCommoditySpotData(commodity);

        PortfolioHolding holding =
                new PortfolioHolding();

        holding.setId(10);
        holding.setPortfolio(portfolio);
        holding.setSecurityMaster(security);
        holding.setQuantityHeld(2);

        when(portfolioHoldingRepository.existsById(10))
                .thenReturn(true);

        when(portfolioRepository.existsById(100L))
                .thenReturn(true);

        when(securityMasterRepository.existsById(200L))
                .thenReturn(true);

        when(securityMasterClient.findBySecurityId(200L))
                .thenReturn(Optional.of(quote));

        holdingService.buyHoldings(holding);

        assertEquals(
                2000.0,
                holding.getTotalCost()
        );
    }


    @Test
    @DisplayName("TC-HOLD-010 | Buy rejects missing holding")
    void buyHoldings_shouldThrow_whenHoldingMissing() {

        PortfolioHolding holding =
                new PortfolioHolding();

        holding.setId(999);

        when(portfolioHoldingRepository.existsById(999))
                .thenReturn(false);

        assertThrows(
                PortfolioHoldingNotFoundException.class,
                () -> holdingService.buyHoldings(holding)
        );
    }


    @Test
    @DisplayName("TC-HOLD-011 | Buy rejects missing portfolio")
    void buyHoldings_shouldThrow_whenPortfolioMissing() {

        Portfolio portfolio =
                activePortfolio();

        SecurityMaster security =
                equitySecurity();

        PortfolioHolding holding =
                new PortfolioHolding();

        holding.setId(10);
        holding.setPortfolio(portfolio);
        holding.setSecurityMaster(security);

        when(portfolioHoldingRepository.existsById(10))
                .thenReturn(true);

        when(portfolioRepository.existsById(100L))
                .thenReturn(false);

        assertThrows(
                PortfolioNotFoundException.class,
                () -> holdingService.buyHoldings(holding)
        );
    }


    @Test
    @DisplayName("TC-HOLD-012 | Buy rejects missing security")
    void buyHoldings_shouldThrow_whenSecurityMissing() {

        Portfolio portfolio =
                activePortfolio();

        SecurityMaster security =
                equitySecurity();

        PortfolioHolding holding =
                new PortfolioHolding();

        holding.setId(10);
        holding.setPortfolio(portfolio);
        holding.setSecurityMaster(security);

        when(portfolioHoldingRepository.existsById(10))
                .thenReturn(true);

        when(portfolioRepository.existsById(100L))
                .thenReturn(true);

        when(securityMasterRepository.existsById(200L))
                .thenReturn(false);

        assertThrows(
                SecurityNotFoundException.class,
                () -> holdingService.buyHoldings(holding)
        );
    }


    @Test
    @DisplayName("TC-HOLD-013 | Get total cost")
    void getTotalCost_shouldReturnCost() {

        Portfolio portfolio =
                activePortfolio();

        SecurityMaster security =
                equitySecurity();

        PortfolioHolding holding =
                new PortfolioHolding();

        holding.setId(10);
        holding.setPortfolio(portfolio);
        holding.setSecurityMaster(security);
        holding.setQuantityHeld(8);

        when(portfolioHoldingRepository.existsById(10))
                .thenReturn(true);

        when(portfolioRepository.existsById(100L))
                .thenReturn(true);

        when(securityMasterRepository.existsById(200L))
                .thenReturn(true);

        when(securityMasterClient.findBySecurityId(200L))
                .thenReturn(
                        Optional.of(
                                equityQuote(
                                        security,
                                        100
                                )
                        )
                );

        assertEquals(
                800.0,
                holdingService.getTotalCost(holding)
        );
    }


    @Test
    @DisplayName("TC-HOLD-014 | Total cost rejects missing holding")
    void getTotalCost_shouldThrow_whenHoldingMissing() {

        PortfolioHolding holding =
                new PortfolioHolding();

        holding.setId(999);

        when(portfolioHoldingRepository.existsById(999))
                .thenReturn(false);

        assertThrows(
                PortfolioHoldingNotFoundException.class,
                () -> holdingService.getTotalCost(holding)
        );
    }


    @Test
    @DisplayName("TC-HOLD-015 | Sell rejects null request")
    void sellHoldingsShare_shouldRejectNull() {

        IllegalArgumentException exception =
                assertThrows(
                        IllegalArgumentException.class,
                        () -> holdingService
                                .sellHoldingsShare(null)
                );

        assertEquals(
                "Select a holding to sell.",
                exception.getMessage()
        );
    }


    @Test
    @DisplayName("TC-HOLD-016 | Sell rejects null ID")
    void sellHoldingsShare_shouldRejectNullId() {

        SellHoldingDTO request =
                new SellHoldingDTO(null, 2);

        assertThrows(
                IllegalArgumentException.class,
                () -> holdingService
                        .sellHoldingsShare(request)
        );
    }


    @Test
    @DisplayName("TC-HOLD-017 | Sell rejects zero quantity")
    void sellHoldingsShare_shouldRejectZeroQuantity() {

        SellHoldingDTO request =
                new SellHoldingDTO(10, 0);

        IllegalArgumentException exception =
                assertThrows(
                        IllegalArgumentException.class,
                        () -> holdingService
                                .sellHoldingsShare(request)
                );

        assertEquals(
                "Sell quantity must be a positive whole number.",
                exception.getMessage()
        );
    }


    @Test
    @DisplayName("TC-HOLD-018 | Sell partial holding")
    void sellHoldingsShare_shouldSellPartialQuantity() {

        Portfolio portfolio =
                activePortfolio();

        SecurityMaster security =
                equitySecurity();

        PortfolioHolding holding =
                new PortfolioHolding();

        holding.setId(10);
        holding.setPortfolio(portfolio);
        holding.setSecurityMaster(security);
        holding.setQuantityHeld(10);
        holding.setAverageCost(100.0);
        holding.setTotalCost(1000.0);
        holding.setHoldingStatus(
                HoldingStatus.BROUGHT
        );

        when(portfolioHoldingRepository
                .findById(10))
                .thenReturn(Optional.of(holding));

        when(portfolioRepository
                .findById(100L))
                .thenReturn(Optional.of(portfolio));

        when(securityMasterService
                .getCurrentPrice(200L))
                .thenReturn(120.0);

        String result =
                holdingService.sellHoldingsShare(
                        new SellHoldingDTO(10, 3)
                );

        assertEquals(
                7,
                holding.getQuantityHeld()
        );

        assertEquals(
                700.0,
                holding.getTotalCost()
        );

        assertEquals(
                10360.0,
                portfolio.getAmount()
        );

        assertTrue(
                result.contains("Sold 3 share(s)")
        );

        verify(portfolioHoldingRepository)
                .save(holding);

        verify(portfolioRepository)
                .save(portfolio);
    }


    @Test
    @DisplayName("TC-HOLD-019 | Complete sale marks holding SOLD")
    void sellHoldingsShare_shouldMarkSold_whenEntireQuantitySold() {

        Portfolio portfolio =
                activePortfolio();

        SecurityMaster security =
                equitySecurity();

        PortfolioHolding holding =
                new PortfolioHolding();

        holding.setId(10);
        holding.setPortfolio(portfolio);
        holding.setSecurityMaster(security);
        holding.setQuantityHeld(5);
        holding.setAverageCost(100.0);
        holding.setTotalCost(500.0);
        holding.setHoldingStatus(
                HoldingStatus.BROUGHT
        );

        when(portfolioHoldingRepository.findById(10))
                .thenReturn(Optional.of(holding));

        when(portfolioRepository.findById(100L))
                .thenReturn(Optional.of(portfolio));

        when(securityMasterService
                .getCurrentPrice(200L))
                .thenReturn(120.0);

        holdingService.sellHoldingsShare(
                new SellHoldingDTO(10, 5)
        );

        assertEquals(
                0,
                holding.getQuantityHeld()
        );

        assertEquals(
                HoldingStatus.SOLD,
                holding.getHoldingStatus()
        );
    }


    @Test
    @DisplayName("TC-HOLD-020 | Sell rejects unavailable quantity")
    void sellHoldingsShare_shouldRejectExcessQuantity() {

        PortfolioHolding holding =
                new PortfolioHolding();

        holding.setId(10);
        holding.setQuantityHeld(5);
        holding.setHoldingStatus(
                HoldingStatus.BROUGHT
        );

        when(portfolioHoldingRepository.findById(10))
                .thenReturn(Optional.of(holding));

        IllegalArgumentException exception =
                assertThrows(
                        IllegalArgumentException.class,
                        () -> holdingService
                                .sellHoldingsShare(
                                        new SellHoldingDTO(10, 10)
                                )
                );

        assertEquals(
                "Sell quantity cannot exceed the shares currently held.",
                exception.getMessage()
        );
    }


    @Test
    @DisplayName("TC-HOLD-021 | Buy securities rejects null request")
    void buySecurities_shouldRejectNull() {

        IllegalArgumentException exception =
                assertThrows(
                        IllegalArgumentException.class,
                        () -> holdingService.buySecurities(null)
                );

        assertEquals(
                "Select a portfolio and security before buying.",
                exception.getMessage()
        );
    }


    @Test
    @DisplayName("TC-HOLD-022 | Buy securities rejects zero quantity")
    void buySecurities_shouldRejectInvalidQuantity() {

        BuyHoldingDTO request =
                new BuyHoldingDTO(
                        100L,
                        0,
                        200L,
                        null
                );

        IllegalArgumentException exception =
                assertThrows(
                        IllegalArgumentException.class,
                        () -> holdingService
                                .buySecurities(request)
                );

        assertEquals(
                "Buy quantity must be a positive whole number.",
                exception.getMessage()
        );
    }


    @Test
    @DisplayName("TC-HOLD-023 | Buy securities successfully")
    void buySecurities_shouldCreateHolding() {

        Portfolio portfolio =
                activePortfolio();

        portfolio.setAmount(5000.0);

        SecurityMaster security =
                equitySecurity();

        when(portfolioRepository.findById(100L))
                .thenReturn(Optional.of(portfolio));

        when(securityMasterRepository.findById(200L))
                .thenReturn(Optional.of(security));

        when(securityMasterService
                .getCurrentPrice(200L))
                .thenReturn(100.0);

        when(portfolioHoldingRepository
                .findAllByPortfolio(portfolio))
                .thenReturn(new ArrayList<>());

        when(securityMasterClient
                .findBySecurityId(200L))
                .thenReturn(Optional.empty());

        BuyHoldingDTO request =
                new BuyHoldingDTO(
                        100L,
                        10,
                        200L,
                        null
                );

        String result =
                holdingService.buySecurities(request);

        assertTrue(
                result.contains("Bought 10 share(s)")
        );

        assertEquals(
                4000.0,
                portfolio.getAmount()
        );

        verify(portfolioHoldingRepository)
                .save(any(PortfolioHolding.class));

        verify(portfolioRepository)
                .save(portfolio);
    }


    @Test
    @DisplayName("TC-HOLD-024 | Buy securities rejects insufficient cash")
    void buySecurities_shouldRejectInsufficientCash() {

        Portfolio portfolio =
                activePortfolio();

        portfolio.setAmount(500.0);

        SecurityMaster security =
                equitySecurity();

        when(portfolioRepository.findById(100L))
                .thenReturn(Optional.of(portfolio));

        when(securityMasterRepository.findById(200L))
                .thenReturn(Optional.of(security));

        when(securityMasterService
                .getCurrentPrice(200L))
                .thenReturn(100.0);

        BuyHoldingDTO request =
                new BuyHoldingDTO(
                        100L,
                        10,
                        200L,
                        null
                );

        assertThrows(
                IllegalArgumentException.class,
                () -> holdingService.buySecurities(request)
        );

        verify(portfolioHoldingRepository, never())
                .save(any());
    }


    @Test
    @DisplayName("TC-HOLD-025 | Buy securities rejects inactive portfolio")
    void buySecurities_shouldRejectInactivePortfolio() {

        Portfolio portfolio =
                activePortfolio();

        portfolio.setPortfolioStatus(
                PortfolioStatus.NEW
        );

        when(portfolioRepository.findById(100L))
                .thenReturn(Optional.of(portfolio));

        BuyHoldingDTO request =
                new BuyHoldingDTO(
                        100L,
                        2,
                        200L,
                        null
                );

        IllegalArgumentException exception =
                assertThrows(
                        IllegalArgumentException.class,
                        () -> holdingService
                                .buySecurities(request)
                );

        assertEquals(
                "Trades are allowed only for active portfolios.",
                exception.getMessage()
        );
    }


    @Test
    @DisplayName("TC-HOLD-026 | Buy securities rejects missing security")
    void buySecurities_shouldRejectMissingSecurity() {

        Portfolio portfolio =
                activePortfolio();

        when(portfolioRepository.findById(100L))
                .thenReturn(Optional.of(portfolio));

        when(securityMasterRepository.findById(999L))
                .thenReturn(Optional.empty());

        BuyHoldingDTO request =
                new BuyHoldingDTO(
                        100L,
                        2,
                        999L,
                        null
                );

        assertThrows(
                SecurityNotFoundException.class,
                () -> holdingService
                        .buySecurities(request)
        );
    }


    @Test
    @DisplayName("TC-HOLD-027 | Update equity category")
    void updateEquityCategory_shouldUpdateCategory() {

        PortfolioHolding holding =
                new PortfolioHolding();

        SecurityMaster security =
                equitySecurity();

        holding.setId(10);
        holding.setSecurityMaster(security);

        when(portfolioHoldingRepository.findById(10))
                .thenReturn(Optional.of(holding));

        String result =
                holdingService.updateEquityCategory(
                        10,
                        "large_cap"
                );

        assertEquals(
                "Equity category updated.",
                result
        );

        assertEquals(
                EquityCategory.LARGE_CAP,
                holding.getEquityCategory()
        );

        verify(portfolioHoldingRepository)
                .save(holding);
    }


    @Test
    @DisplayName("TC-HOLD-028 | Blank equity category clears category")
    void updateEquityCategory_shouldClear_whenBlank() {

        PortfolioHolding holding =
                new PortfolioHolding();

        holding.setId(10);
        holding.setSecurityMaster(
                equitySecurity()
        );
        holding.setEquityCategory(
                EquityCategory.LARGE_CAP
        );

        when(portfolioHoldingRepository.findById(10))
                .thenReturn(Optional.of(holding));

        holdingService.updateEquityCategory(
                10,
                " "
        );

        assertNull(
                holding.getEquityCategory()
        );

        verify(portfolioHoldingRepository)
                .save(holding);
    }


    @Test
    @DisplayName("TC-HOLD-029 | Invalid equity category")
    void updateEquityCategory_shouldRejectInvalidCategory() {

        PortfolioHolding holding =
                new PortfolioHolding();

        holding.setId(10);
        holding.setSecurityMaster(
                equitySecurity()
        );

        when(portfolioHoldingRepository.findById(10))
                .thenReturn(Optional.of(holding));

        IllegalArgumentException exception =
                assertThrows(
                        IllegalArgumentException.class,
                        () -> holdingService
                                .updateEquityCategory(
                                        10,
                                        "INVALID"
                                )
                );

        assertEquals(
                "Choose Small Cap, Mid Cap, or Large Cap.",
                exception.getMessage()
        );

        verify(portfolioHoldingRepository, never())
                .save(any());
    }


    @Test
    @DisplayName("TC-HOLD-030 | Equity category rejected for bond")
    void updateEquityCategory_shouldRejectNonEquity() {

        SecurityMaster security =
                equitySecurity();

        security.setSecurityType(
                SecurityType.BOND
        );

        PortfolioHolding holding =
                new PortfolioHolding();

        holding.setId(10);
        holding.setSecurityMaster(security);

        when(portfolioHoldingRepository.findById(10))
                .thenReturn(Optional.of(holding));

        assertThrows(
                IllegalArgumentException.class,
                () -> holdingService
                        .updateEquityCategory(
                                10,
                                "LARGE_CAP"
                        )
        );
    }
}