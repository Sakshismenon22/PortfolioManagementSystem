package com.example.pms.service;

import com.example.pms.model.CommoditySpotData;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;

@ExtendWith(MockitoExtension.class)
class CommodityPriceUnitsTest {

    @Test
    @DisplayName("TC-COMMODITY-001 | Null quote returns zero")
    void perPortfolioUnit_shouldReturnZero_whenQuoteNull() {

        assertEquals(
                0.0,
                CommodityPriceUnits.perPortfolioUnit(
                        null,
                        "GOLD"
                )
        );
    }


    @Test
    @DisplayName("TC-COMMODITY-002 | Null spot price returns zero")
    void perPortfolioUnit_shouldReturnZero_whenSpotPriceNull() {

        CommoditySpotData spot = new CommoditySpotData();

        spot.setSpotPrice(null);

        assertEquals(
                0.0,
                CommodityPriceUnits.perPortfolioUnit(
                        spot,
                        "GOLD"
                )
        );
    }


    @Test
    @DisplayName("TC-COMMODITY-003 | Non-gold returns original price")
    void perPortfolioUnit_shouldReturnOriginalPrice_forNonGold() {

        CommoditySpotData spot =
                new CommoditySpotData();

        spot.setSpotPrice(
                BigDecimal.valueOf(5000)
        );

        assertEquals(
                5000.0,
                CommodityPriceUnits.perPortfolioUnit(
                        spot,
                        "SILVER"
                )
        );
    }


    @Test
    @DisplayName("TC-COMMODITY-004 | Gold ten grams")
    void perPortfolioUnit_shouldConvertTenGrams() {

        CommoditySpotData spot =
                new CommoditySpotData();

        spot.setSpotPrice(
                BigDecimal.valueOf(10000)
        );

        spot.setQuotation("10 grams");

        assertEquals(
                1000.0,
                CommodityPriceUnits.perPortfolioUnit(
                        spot,
                        "GOLD"
                )
        );
    }


    @Test
    @DisplayName("TC-COMMODITY-005 | Gold one kilogram")
    void perPortfolioUnit_shouldConvertKilogram() {

        CommoditySpotData spot =
                new CommoditySpotData();

        spot.setSpotPrice(
                BigDecimal.valueOf(1000000)
        );

        spot.setQuotation("1 KG");

        assertEquals(
                1000.0,
                CommodityPriceUnits.perPortfolioUnit(
                        spot,
                        "GOLD"
                )
        );
    }


    @Test
    @DisplayName("TC-COMMODITY-006 | Gold one gram")
    void perPortfolioUnit_shouldConvertOneGram() {

        CommoditySpotData spot =
                new CommoditySpotData();

        spot.setSpotPrice(
                BigDecimal.valueOf(1000)
        );

        spot.setQuotation("1 gram");

        assertEquals(
                1000.0,
                CommodityPriceUnits.perPortfolioUnit(
                        spot,
                        "GOLD"
                )
        );
    }


    @Test
    @DisplayName("TC-COMMODITY-007 | Gold default quotation is ten grams")
    void perPortfolioUnit_shouldUseTenGramDefault() {

        CommoditySpotData spot =
                new CommoditySpotData();

        spot.setSpotPrice(
                BigDecimal.valueOf(10000)
        );

        spot.setQuotation("UNKNOWN");

        assertEquals(
                1000.0,
                CommodityPriceUnits.perPortfolioUnit(
                        spot,
                        "GOLD"
                )
        );
    }


    @Test
    @DisplayName("TC-COMMODITY-008 | Zero price")
    void perPortfolioUnit_shouldReturnZero_whenPriceZero() {

        CommoditySpotData spot =
                new CommoditySpotData();

        spot.setSpotPrice(
                BigDecimal.ZERO
        );

        spot.setQuotation("10 grams");

        assertEquals(
                0.0,
                CommodityPriceUnits.perPortfolioUnit(
                        spot,
                        "GOLD"
                )
        );
    }
}