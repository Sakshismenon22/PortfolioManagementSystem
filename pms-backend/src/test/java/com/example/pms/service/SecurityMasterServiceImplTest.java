package com.example.pms.service;

import com.example.pms.client.SecurityMasterClient;
import com.example.pms.dto.response.SecuritiesInfoDTO;
import com.example.pms.dto.response.SecurityPriceDTO;
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

import static org.junit.jupiter.api.Assertions.*;
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
    @DisplayName("TC-SECURITY-001 | Get all securities")
    void getAllSecuritiesInfo_shouldReturnData() {

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
