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

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.Mockito.*;


@ExtendWith(MockitoExtension.class)
public class SecurityMasterServiceImplTest {

    @Mock
    private SecurityMasterClient securityMasterClient;

    @InjectMocks
    private SecurityMasterServiceImpl securityMasterService;

    @Test
    @DisplayName("TC-SECURITY-001 | Retrieve all security information")
    void getAllSecuritiesInfo_shouldReturnClientResponse(){

        SecuritiesInfoDTO expected = new SecuritiesInfoDTO();

        when(securityMasterClient.getAllSecurityInfo()).thenReturn(Optional.of(expected));

        SecuritiesInfoDTO result = securityMasterService.getAllSecuritiesInfo();

        assertSame(expected, result);

        verify(securityMasterClient).getAllSecurityInfo();

    }

    @Test
    @DisplayName("TC-SECURITY-002 | Get current equity price")
    void getCurrentPrice_shouldReturnEquityClosePrice(){

        SecurityMaster securityMaster = new SecurityMaster();

        securityMaster.setId(1L);
        securityMaster.setSecurityType(SecurityType.EQUITY);

        StockData stockData = new StockData();

        stockData.setClosePrice(new BigDecimal("125.50"));

        SecurityPriceDTO priceDTO = new SecurityPriceDTO();

        priceDTO.setSecurityMaster(securityMaster);

        priceDTO.setStockData(stockData);

        when(securityMasterClient.findBySecurityId(1L)).thenReturn(Optional.of(priceDTO));

        Double result = securityMasterService.getCurrentPrice(1L);

        assertEquals(125.50, result);

    }

    @Test
    @DisplayName("TC-SECURITY-003 | Get current ETF price")
    void getCurrentPrice_shouldReturnEtfClosePrice(){

        SecurityMaster securityMaster = new SecurityMaster();

        securityMaster.setId(2L);
        securityMaster.setSecurityType(SecurityType.ETF);

        StockData stockData = new StockData();

        stockData.setClosePrice(new BigDecimal("250.75"));

        SecurityPriceDTO priceDTO = new SecurityPriceDTO();

        priceDTO.setSecurityMaster(securityMaster);

        priceDTO.setStockData(stockData);

        when(securityMasterClient.findBySecurityId(2L)).thenReturn(Optional.of(priceDTO));

        Double result = securityMasterService.getCurrentPrice(2L);

        assertEquals(250.75, result);

    }

    @Test
    @DisplayName("TC-SECURITY-004 | Get current mutual fund NAV")
    void getCurrentPrice_shouldReturnMutualFundNav(){

        SecurityMaster securityMaster = new SecurityMaster();

        securityMaster.setId(3L);
        securityMaster.setSecurityType(SecurityType.MUTUAL_FUND);

        MutualFundNav nav = new MutualFundNav();

        nav.setNav(new BigDecimal("42.35"));

        SecurityPriceDTO priceDTO = new SecurityPriceDTO();

        priceDTO.setSecurityMaster(securityMaster);

        priceDTO.setMutualFundNav(nav);

        when(securityMasterClient.findBySecurityId(3L)).thenReturn(Optional.of(priceDTO));

        Double result = securityMasterService.getCurrentPrice(3L);

        assertEquals(42.35, result);

    }

    @Test
    @DisplayName("TC-SECURITY-005 | Get current bond face value")
    void getCurrentPrice_shouldReturnBondFaceValue(){

        SecurityMaster securityMaster = new SecurityMaster();

        securityMaster.setId(4L);
        securityMaster.setSecurityType(SecurityType.BOND);

        Bond bond = new Bond();

        bond.setFaceValue(1000.0);

        SecurityPriceDTO priceDTO = new SecurityPriceDTO();

        priceDTO.setSecurityMaster(securityMaster);

        priceDTO.setBond(bond);

        when(securityMasterClient.findBySecurityId(4L)).thenReturn(Optional.of(priceDTO));

        Double result = securityMasterService.getCurrentPrice(4L);

        assertEquals(1000.0, result);

    }

    @Test
    @DisplayName("TC-SECURITY-006 | Get current commodity price")
    void getCurrentPrice_shouldReturnCommoditySpotPrice(){

        SecurityMaster securityMaster = new SecurityMaster();

        securityMaster.setId(5L);
        securityMaster.setSecurityType(SecurityType.COMMODITY);

        CommoditySpotData commodity = new CommoditySpotData();

        commodity.setSpotPrice(new BigDecimal("7250.00"));

        SecurityPriceDTO priceDTO = new SecurityPriceDTO();

        priceDTO.setSecurityMaster(securityMaster);

        priceDTO.setCommoditySpotData(commodity);

        when(securityMasterClient.findBySecurityId(5L)).thenReturn(Optional.of(priceDTO));

        Double result = securityMasterService.getCurrentPrice(5L);

        assertEquals(7250.00, result);

    }




}
