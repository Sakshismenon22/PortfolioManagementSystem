package com.example.pms.service;

import com.example.pms.client.SecurityMasterClient;
import com.example.pms.dto.response.SecuritiesInfoDTO;
import com.example.pms.dto.response.SecurityPriceDTO;
import com.example.pms.exception.SecurityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.List;

@RequiredArgsConstructor
@Service
public class SecurityMasterServiceImpl implements SecurityMasterService{

    private final SecurityMasterClient securityMasterClient;

    @Override
    public SecuritiesInfoDTO getAllSecuritiesInfo() {
        SecuritiesInfoDTO info = securityMasterClient.getAllSecurityInfo()
                .orElseThrow(() -> new IllegalStateException("Security Master returned no security information."));
        if (info != null && info.getSecurities() != null) {
            info.getSecurities().stream()
                    .filter(security -> security.getAsset() != null
                            && security.getAsset().getAssetClass() != null
                            && security.getAsset().getAssetClass().toLowerCase().contains("commodit"))
                    .forEach(security -> {
                        try {
                            security.setPrice(getCurrentPrice(security.getId()));
                        } catch (RuntimeException ignored) {
                            // Leave the Security Master list price in place if its quote endpoint is unavailable.
                        }
                    });
        }
        return info;
    }

    @Override
    @Cacheable(value = "securityCurrentPricePerUnitV2", key = "#securityId")
    public Double getCurrentPrice(Long securityId) {
        SecurityPriceDTO securityPriceDTO = securityMasterClient.findBySecurityId(securityId)
                .orElseThrow(SecurityNotFoundException::new);
        if (securityPriceDTO.getSecurityMaster() == null
                || securityPriceDTO.getSecurityMaster().getSecurityType() == null) {
            throw new IllegalStateException("Security Master returned a price without security type information.");
        }
        return switch (securityPriceDTO.getSecurityMaster().getSecurityType()) {
            case EQUITY,ETF ->{
                if (securityPriceDTO.getStockData() == null || securityPriceDTO.getStockData().getClosePrice() == null) {
                    throw new IllegalStateException("Security Master returned no closing price.");
                }
                yield securityPriceDTO.getStockData().getClosePrice().doubleValue();
            }

            case MUTUAL_FUND -> {
                if (securityPriceDTO.getMutualFundNav() == null || securityPriceDTO.getMutualFundNav().getNav() == null) {
                    throw new IllegalStateException("Security Master returned no mutual fund NAV.");
                }
                yield securityPriceDTO.getMutualFundNav().getNav().doubleValue();
            }
            case BOND -> {
                if (securityPriceDTO.getBond() == null || securityPriceDTO.getBond().getFaceValue() == null) {
                    throw new IllegalStateException("Security Master returned no bond face value.");
                }
                yield securityPriceDTO.getBond().getCleanPrice();
            }
            case COMMODITY -> {
                yield CommodityPriceUnits.perPortfolioUnit(
                        securityPriceDTO.getCommoditySpotData(),
                        securityPriceDTO.getSecurityMaster().getSymbol());
            }
        };
    }
}
