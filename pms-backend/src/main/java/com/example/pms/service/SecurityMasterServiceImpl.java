package com.example.pms.service;

import com.example.pms.client.SecurityMasterClient;
import com.example.pms.dto.response.SecuritiesInfoDTO;
import com.example.pms.dto.response.SecurityPriceDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@RequiredArgsConstructor
@Service
public class SecurityMasterServiceImpl implements SecurityMasterService{

    private final SecurityMasterClient securityMasterClient;

    @Override
    public SecuritiesInfoDTO getAllSecuritiesInfo() {
        return securityMasterClient.getAllSecurityInfo().get();
    }

    @Override
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
                currentPrice =  securityPriceDTO.getCommoditySpotData().getSpotPrice().doubleValue();

            }

        }
        return currentPrice;
    }
}
