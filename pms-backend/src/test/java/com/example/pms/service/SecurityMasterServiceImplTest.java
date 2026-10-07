package com.example.pms.service;

import com.example.pms.client.SecurityMasterClient;
import com.example.pms.dto.response.SecuritiesInfoDTO;
import com.example.pms.dto.response.SecurityInfoDTO;
import com.example.pms.dto.response.SecurityPriceDTO;
import com.example.pms.exception.SecurityNotFoundException;
import com.example.pms.model.*;
import com.example.pms.model.enums.SecurityType;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;


@ExtendWith(MockitoExtension.class)
class SecurityMasterServiceImplTest {

    @Mock
    private SecurityMasterClient securityMasterClient;

    @InjectMocks
    private SecurityMasterServiceImpl securityMasterService;


    private SecurityMaster security(
            Long id,
            SecurityType type) {

        SecurityMaster security =
                new SecurityMaster();

        security.setId(id);
        security.setSecurityType(type);

        return security;
    }


    @Test
    @DisplayName("TC-SECURITY-007 | Fail clearly when the security service has no quote")
    void getCurrentPrice_shouldThrowWhenQuoteIsMissing() {
        when(securityMasterClient.findBySecurityId(99L)).thenReturn(Optional.empty());

        assertThrows(SecurityNotFoundException.class, () -> securityMasterService.getCurrentPrice(99L));
    }

    @Test
    @DisplayName("TC-SECURITY-008 | Fail clearly when the security list is unavailable")
    void getAllSecuritiesInfo_shouldThrowWhenClientHasNoPayload() {
        when(securityMasterClient.getAllSecurityInfo()).thenReturn(Optional.empty());

        assertThrows(IllegalStateException.class, securityMasterService::getAllSecuritiesInfo);
    }

    @Test
    @DisplayName("TC-SECURITY-009 | Refresh commodity quotes but preserve other security prices")
    void getAllSecuritiesInfo_shouldRefreshOnlyCommodityQuotes() {
        SecurityInfoDTO commodity = new SecurityInfoDTO();
        commodity.setId(5L);
        commodity.setSymbol("SILVER");
        commodity.setPrice(7000.0);
        commodity.setAsset(new Asset());
        commodity.getAsset().setAssetClass("COMMODITY");
        SecurityInfoDTO equity = new SecurityInfoDTO();
        equity.setId(6L);
        equity.setPrice(200.0);
        equity.setAsset(new Asset());
        equity.getAsset().setAssetClass("EQUITY");
        when(securityMasterClient.getAllSecurityInfo())
                .thenReturn(Optional.of(new SecuritiesInfoDTO(List.of(commodity, equity))));

        SecurityMaster securityMaster = new SecurityMaster();
        securityMaster.setSecurityType(SecurityType.COMMODITY);
        securityMaster.setSymbol("SILVER");
        CommoditySpotData spot = new CommoditySpotData();
        spot.setSpotPrice(new BigDecimal("7250.00"));
        SecurityPriceDTO quote = new SecurityPriceDTO();
        quote.setSecurityMaster(securityMaster);
        quote.setCommoditySpotData(spot);
        when(securityMasterClient.findBySecurityId(5L)).thenReturn(Optional.of(quote));

        SecuritiesInfoDTO result = securityMasterService.getAllSecuritiesInfo();

        assertEquals(7250.0, result.getSecurities().get(0).getPrice());
        assertEquals(200.0, result.getSecurities().get(1).getPrice());
        verify(securityMasterClient, never()).findBySecurityId(6L);
    }

    @Test
    @DisplayName("TC-SECURITY-010 | Preserve a commodity price when its quote lookup fails")
    void getAllSecuritiesInfo_shouldPreserveFallbackPriceWhenCommodityQuoteUnavailable() {
        SecurityInfoDTO commodity = new SecurityInfoDTO();
        commodity.setId(5L);
        commodity.setPrice(7000.0);
        commodity.setAsset(new Asset());
        commodity.getAsset().setAssetClass("Commodity");
        when(securityMasterClient.getAllSecurityInfo())
                .thenReturn(Optional.of(new SecuritiesInfoDTO(List.of(commodity))));
        when(securityMasterClient.findBySecurityId(5L)).thenReturn(Optional.empty());

        SecuritiesInfoDTO result = securityMasterService.getAllSecuritiesInfo();

        assertEquals(7000.0, result.getSecurities().get(0).getPrice());
    }

    @Test
    @DisplayName("TC-SECURITY-011 | Reject malformed price payloads")
    void getCurrentPrice_shouldRejectMissingSecurityTypeAndQuoteValues() {
        when(securityMasterClient.findBySecurityId(1L)).thenReturn(Optional.of(new SecurityPriceDTO()));
        assertThrows(IllegalStateException.class, () -> securityMasterService.getCurrentPrice(1L));

        SecurityMaster master = new SecurityMaster();
        master.setSecurityType(SecurityType.EQUITY);
        SecurityPriceDTO missingClose = new SecurityPriceDTO();
        missingClose.setSecurityMaster(master);
        when(securityMasterClient.findBySecurityId(2L)).thenReturn(Optional.of(missingClose));
        assertThrows(IllegalStateException.class, () -> securityMasterService.getCurrentPrice(2L));
    }

    @Test
    @DisplayName("TC-SECURITY-002 | Get current equity price")
    void getCurrentPrice_shouldReturnEquityClosePrice(){

        SecuritiesInfoDTO expected =
                new SecuritiesInfoDTO();

        when(securityMasterClient
                .getAllSecurityInfo())
                .thenReturn(Optional.of(expected));

        SecuritiesInfoDTO result =
                securityMasterService
                        .getAllSecuritiesInfo();

        assertSame(
                expected,
                result
        );
    }


    @Test
    @DisplayName("TC-SECURITY-002 | Equity price")
    void getCurrentPrice_shouldReturnEquityPrice() {

        SecurityMaster security =
                security(1L, SecurityType.EQUITY);

        StockData stock =
                new StockData();

        stock.setClosePrice(
                BigDecimal.valueOf(125.50)
        );

        SecurityPriceDTO quote =
                new SecurityPriceDTO();

        quote.setSecurityMaster(security);
        quote.setStockData(stock);

        when(securityMasterClient
                .findBySecurityId(1L))
                .thenReturn(Optional.of(quote));

        assertEquals(
                125.50,
                securityMasterService
                        .getCurrentPrice(1L)
        );
    }


    @Test
    @DisplayName("TC-SECURITY-003 | ETF price")
    void getCurrentPrice_shouldReturnEtfPrice() {

        SecurityMaster security =
                security(2L, SecurityType.ETF);

        StockData stock =
                new StockData();

        stock.setClosePrice(
                BigDecimal.valueOf(250.75)
        );

        SecurityPriceDTO quote =
                new SecurityPriceDTO();

        quote.setSecurityMaster(security);
        quote.setStockData(stock);

        when(securityMasterClient
                .findBySecurityId(2L))
                .thenReturn(Optional.of(quote));

        assertEquals(
                250.75,
                securityMasterService
                        .getCurrentPrice(2L)
        );
    }


    @Test
    @DisplayName("TC-SECURITY-004 | Mutual fund NAV")
    void getCurrentPrice_shouldReturnMutualFundNav() {

        SecurityMaster security =
                security(3L, SecurityType.MUTUAL_FUND);

        MutualFundNav nav =
                new MutualFundNav();

        nav.setNav(
                BigDecimal.valueOf(42.35)
        );

        SecurityPriceDTO quote =
                new SecurityPriceDTO();

        quote.setSecurityMaster(security);
        quote.setMutualFundNav(nav);

        when(securityMasterClient
                .findBySecurityId(3L))
                .thenReturn(Optional.of(quote));

        assertEquals(
                42.35,
                securityMasterService
                        .getCurrentPrice(3L)
        );
    }


    @Test
    @DisplayName("TC-SECURITY-005 | Bond price")
    void getCurrentPrice_shouldReturnBondFaceValue() {

        SecurityMaster security =
                security(4L, SecurityType.BOND);

        Bond bond =
                new Bond();

        bond.setFaceValue(1000.0);

        SecurityPriceDTO quote =
                new SecurityPriceDTO();

        quote.setSecurityMaster(security);
        quote.setBond(bond);

        when(securityMasterClient
                .findBySecurityId(4L))
                .thenReturn(Optional.of(quote));

        assertEquals(
                1000.0,
                securityMasterService
                        .getCurrentPrice(4L)
        );
    }


    @Test
    @DisplayName("TC-SECURITY-006 | Commodity price")
    void getCurrentPrice_shouldReturnCommodityPrice() {

        SecurityMaster security =
                security(5L, SecurityType.COMMODITY);

        CommoditySpotData commodity =
                new CommoditySpotData();

        commodity.setSpotPrice(
                BigDecimal.valueOf(7250)
        );

        SecurityPriceDTO quote =
                new SecurityPriceDTO();

        quote.setSecurityMaster(security);
        quote.setCommoditySpotData(commodity);

        when(securityMasterClient
                .findBySecurityId(5L))
                .thenReturn(Optional.of(quote));

        assertEquals(
                7250.0,
                securityMasterService
                        .getCurrentPrice(5L)
        );
    }


    @Test
    @DisplayName("TC-SECURITY-007 | Missing security quote")
    void getCurrentPrice_shouldThrow_whenQuoteMissing() {

        when(securityMasterClient
                .findBySecurityId(999L))
                .thenReturn(Optional.empty());

        assertThrows(
                Exception.class,
                () -> securityMasterService
                        .getCurrentPrice(999L)
        );
    }
}
