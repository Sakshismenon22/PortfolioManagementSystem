package com.example.pms.service;

import com.example.pms.client.SecurityMasterClient;
import com.example.pms.dto.response.SecuritiesInfoDTO;
import com.example.pms.dto.response.SecurityPriceDTO;
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
        SecuritiesInfoDTO info = securityMasterClient.getAllSecurityInfo().get();
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
        SecurityPriceDTO securityPriceDTO = securityMasterClient.findBySecurityId(securityId).get();
        Double currentPrice = 0.0d;
        switch (securityPriceDTO.getSecurityMaster().getSecurityType()){
            case EQUITY,ETF ->{
                currentPrice =  securityPriceDTO.getStockData().getClosePrice().doubleValue();
            }

            case MUTUAL_FUND -> {
                currentPrice =  securityPriceDTO.getMutualFundNav().getNav().doubleValue();

            }
            case BOND -> {
                currentPrice =   securityPriceDTO.getBond().getFaceValue();

            }
            case COMMODITY -> {
                currentPrice = CommodityPriceUnits.perPortfolioUnit(
                        securityPriceDTO.getCommoditySpotData(),
                        securityPriceDTO.getSecurityMaster().getSymbol());

            }

        }
        return currentPrice;
    }
}
