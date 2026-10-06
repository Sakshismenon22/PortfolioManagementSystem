package com.example.pms.service;

import com.example.pms.client.SecurityMasterClient;
import com.example.pms.dto.request.AddPortfolioHoldingDTO;
import com.example.pms.dto.response.SecurityPriceDTO;
import com.example.pms.exception.AssetNotFoundException;
import com.example.pms.exception.PortfolioHoldingNotFoundException;
import com.example.pms.exception.PortfolioNotFoundException;
import com.example.pms.model.*;
import com.example.pms.model.enums.HoldingStatus;
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
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
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


    @Test
    @DisplayName("TC-HOLD-001 | Add holding when portfolio, asset and security exist")
    void addPortfolioHolding_shouldSaveHolding_whenAllReferencesExist() {

        // Arrange
        AddPortfolioHoldingDTO request =
                new AddPortfolioHoldingDTO(
                        100L,
                        200L,
                        10,
                        1
                );

        Portfolio portfolio =
                new Portfolio();

        portfolio.setId(100L);

        Asset asset =
                new Asset();

        asset.setId(1);

        SecurityMaster security =
                new SecurityMaster();

        security.setId(200L);

        when(portfolioRepository.existsById(100L))
                .thenReturn(true);

        when(assetRepository.existsById(1))
                .thenReturn(true);

        when(securityMasterRepository.existsById(200L))
                .thenReturn(true);

        when(portfolioRepository.findById(100L))
                .thenReturn(Optional.of(portfolio));

        when(assetRepository.findById(1))
                .thenReturn(Optional.of(asset));

        when(securityMasterRepository.findById(200L))
                .thenReturn(Optional.of(security));


        // Act
        String result =
                holdingService.addPortfolioHolding(request);


        // Assert
        assertEquals(
                "Portfolio Saved",
                result
        );


        // Verify
        verify(portfolioHoldingRepository)
                .save(any(PortfolioHolding.class));
    }


    @Test
    @DisplayName("TC-HOLD-002 | Reject holding when portfolio does not exist")
    void addPortfolioHolding_shouldThrowPortfolioNotFound_whenPortfolioDoesNotExist() {

        // Arrange
        AddPortfolioHoldingDTO request =
                new AddPortfolioHoldingDTO(
                        999L,
                        200L,
                        10,
                        1
                );

        when(portfolioRepository.existsById(999L))
                .thenReturn(false);


        // Act & Assert
        assertThrows(
                PortfolioNotFoundException.class,
                () -> holdingService.addPortfolioHolding(request)
        );


        // Verify
        verify(portfolioHoldingRepository, never())
                .save(any());
    }


    @Test
    @DisplayName("TC-HOLD-003 | Reject holding when asset does not exist")
    void addPortfolioHolding_shouldThrowAssetNotFound_whenAssetDoesNotExist() {

        // Arrange
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


        // Act & Assert
        assertThrows(
                AssetNotFoundException.class,
                () -> holdingService.addPortfolioHolding(request)
        );


        // Verify
        verify(portfolioHoldingRepository, never())
                .save(any());
    }


    @Test
    @DisplayName("TC-HOLD-004 | Buy an equity holding")
    void buyHoldings_shouldCalculateAndSaveEquityCost() {

        // Arrange
        Portfolio portfolio =
                new Portfolio();

        portfolio.setId(100L);

        SecurityMaster security =
                new SecurityMaster();

        security.setId(200L);
        security.setSecurityType(
                SecurityType.EQUITY
        );

        PortfolioHolding holding =
                new PortfolioHolding();

        holding.setId(10);
        holding.setPortfolio(portfolio);
        holding.setSecurityMaster(security);
        holding.setQuantityHeld(10);

        StockData stockData =
                new StockData();

        stockData.setClosePrice(
                new BigDecimal("125.50")
        );

        SecurityPriceDTO priceDTO =
                new SecurityPriceDTO();

        priceDTO.setStockData(stockData);

        when(portfolioHoldingRepository.existsById(10))
                .thenReturn(true);

        when(portfolioRepository.existsById(100L))
                .thenReturn(true);

        when(securityMasterRepository.existsById(200L))
                .thenReturn(true);

        when(securityMasterClient.findBySecurityId(200L))
                .thenReturn(Optional.of(priceDTO));


        // Act
        String result =
                holdingService.buyHoldings(holding);


        // Assert
        assertEquals(
                "Holding Brought.",
                result
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


        // Verify
        verify(portfolioHoldingRepository)
                .save(holding);
    }


    @Test
    @DisplayName("TC-HOLD-005 | Calculate total cost for an equity holding")
    void getTotalCost_shouldReturnCalculatedEquityCost() {

        // Arrange
        Portfolio portfolio =
                new Portfolio();

        portfolio.setId(100L);

        SecurityMaster security =
                new SecurityMaster();

        security.setId(200L);
        security.setSecurityType(
                SecurityType.EQUITY
        );

        PortfolioHolding holding =
                new PortfolioHolding();

        holding.setId(10);
        holding.setPortfolio(portfolio);
        holding.setSecurityMaster(security);
        holding.setQuantityHeld(8);

        StockData stockData =
                new StockData();

        stockData.setClosePrice(
                new BigDecimal("100.00")
        );

        SecurityPriceDTO priceDTO =
                new SecurityPriceDTO();

        priceDTO.setStockData(stockData);

        when(portfolioHoldingRepository.existsById(10))
                .thenReturn(true);

        when(portfolioRepository.existsById(100L))
                .thenReturn(true);

        when(securityMasterRepository.existsById(200L))
                .thenReturn(true);

        when(securityMasterClient.findBySecurityId(200L))
                .thenReturn(Optional.of(priceDTO));


        // Act
        Double result =
                holdingService.getTotalCost(holding);


        // Assert
        assertEquals(
                800.0,
                result
        );
    }


    @Test
    @DisplayName("TC-HOLD-006 | Reject cost calculation for a missing holding")
    void getTotalCost_shouldThrowException_whenHoldingDoesNotExist() {

        // Arrange
        PortfolioHolding holding =
                new PortfolioHolding();

        holding.setId(999);

        when(portfolioHoldingRepository.existsById(999))
                .thenReturn(false);


        // Act & Assert
        assertThrows(
                PortfolioHoldingNotFoundException.class,
                () -> holdingService.getTotalCost(holding)
        );
    }


    @Test
    @DisplayName("TC-HOLD-007 | Reject buy when request is null")
    void buySecurities_shouldRejectNullRequest() {

        // Act
        IllegalArgumentException exception =
                assertThrows(
                        IllegalArgumentException.class,
                        () -> holdingService.buySecurities(null)
                );


        // Assert
        assertEquals(
                "Select a portfolio and security before buying.",
                exception.getMessage()
        );
    }


    @Test
    @DisplayName("TC-HOLD-008 | Reject sell when request is null")
    void sellHoldingsShare_shouldRejectNullRequest() {

        // Act
        IllegalArgumentException exception =
                assertThrows(
                        IllegalArgumentException.class,
                        () -> holdingService.sellHoldingsShare(null)
                );


        // Assert
        assertEquals(
                "Select a holding to sell.",
                exception.getMessage()
        );
    }
}

