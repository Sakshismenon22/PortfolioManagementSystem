package com.example.pms.service;

import com.example.pms.client.SecurityMasterClient;
import com.example.pms.dto.response.SecuritiesInfoDTO;
import com.example.pms.dto.response.SecurityPriceDTO;
import com.example.pms.dto.response.BondReturnPriceDTO;
import com.example.pms.exception.SecurityNotFoundException;
import com.example.pms.model.Bond;
import com.example.pms.model.enums.SecurityType;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.math.BigDecimal;
import java.math.RoundingMode;

@RequiredArgsConstructor
@Service
public class SecurityMasterServiceImpl implements SecurityMasterService{

    private final SecurityMasterClient securityMasterClient;

    private SecuritiesInfoDTO securitiesInfoDTO;

    private HashMap<Long,Double> priceMap = new HashMap<>();

    @Override
    public SecuritiesInfoDTO getAllSecuritiesInfo() {
       if(securitiesInfoDTO==null){
           SecuritiesInfoDTO info = securityMasterClient.getAllSecurityInfo()
                   .orElseThrow(() -> new IllegalStateException("Security Master returned no security information."));
//           if (info != null && info.getSecurities() != null) {
//               info.getSecurities().stream()
//                       .filter(security -> security.getAsset() != null
//                               && security.getAsset().getAssetClass() != null
//                               && (security.getAsset().getAssetClass().toLowerCase().contains("commodit")
//                               || security.getAsset().getAssetClass().toLowerCase().contains("bond")
//                               || security.getAsset().getAssetClass().toLowerCase().contains("fixed")
//                               || security.getAsset().getAssetClass().toLowerCase().contains("debt")))
//                       .forEach(security -> {
//                           try {
//                               security.setPrice(getCurrentPrice(security.getId()));
//                           } catch (RuntimeException ignored) {
//                               // Leave the Security Master list price in place if its quote endpoint is unavailable.
//                           }
//                       });
//           }
           securitiesInfoDTO = info;
           return info;
       }else{
           return securitiesInfoDTO;
       }
    }

    @Override
    // Bump the cache namespace after changing bond pricing precedence so stale
    // face-value entries from the previous resolver cannot be used for trades.
    public Double getCurrentPrice(Long securityId) {
        if(priceMap.get(securityId)!=null){
            return priceMap.get(securityId);
        }
        Double price = fetchCurrentPrice(securityId);
        priceMap.put(securityId,price);
        return price;
    }

    /** Trade quotes are deliberately fetched fresh so a cached face-value fallback
     * cannot override a newer clean bond quote during a buy or sell. */
    @Override
    public Double getCurrentTradePrice(Long securityId) {
        return fetchCurrentPrice(securityId);
    }

    private Double fetchCurrentPrice(Long securityId) {
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
                yield BondPriceResolver.unitPrice(securityPriceDTO.getBond());
            }
            case COMMODITY -> {
                yield CommodityPriceUnits.perPortfolioUnit(
                        securityPriceDTO.getCommoditySpotData(),
                        securityPriceDTO.getSecurityMaster().getSymbol());
            }
        };
    }

    @Override
    public BondReturnPriceDTO getBondReturnPrice(Long securityId, LocalDate purchaseDate) {
        SecurityPriceDTO quote = securityMasterClient.findBySecurityId(securityId)
                .orElseThrow(SecurityNotFoundException::new);
        if (quote.getSecurityMaster() == null || quote.getSecurityMaster().getSecurityType() != SecurityType.BOND) {
            throw new IllegalArgumentException("Return price is available only for bonds.");
        }
        Bond bond = quote.getBond();
        if (bond == null || bond.getFaceValue() == null || !Double.isFinite(bond.getFaceValue()) || bond.getFaceValue() <= 0) {
            throw new IllegalStateException("Security Master returned no valid bond face value.");
        }

        LocalDate asOfDate = LocalDate.now();
        if (purchaseDate != null && purchaseDate.isAfter(asOfDate)) {
            throw new IllegalArgumentException("Bond purchase date cannot be in the future.");
        }
        LocalDate interestStart = purchaseDate == null ? asOfDate : purchaseDate;
        LocalDate interestEnd = bond.getMaturityDate() != null && bond.getMaturityDate().isBefore(asOfDate)
                ? bond.getMaturityDate() : asOfDate;
        long accruedDays = interestEnd.isAfter(interestStart)
                ? ChronoUnit.DAYS.between(interestStart, interestEnd) : 0;
        double storedCouponRate = bond.getCouponRate() == null || !Double.isFinite(bond.getCouponRate())
                ? 0.0 : Math.max(0.0, bond.getCouponRate());
        // Security Master seed data stores rates as fractions (for example 0.0785 = 7.85%),
        // while existing external records may store percentage points (7.85).
        double annualCouponRate = storedCouponRate > 1.0 ? storedCouponRate / 100.0 : storedCouponRate;
        double accruedInterest = BigDecimal.valueOf(bond.getFaceValue() * annualCouponRate * accruedDays / 365.0)
                .setScale(2, RoundingMode.HALF_UP).doubleValue();
        double returnPrice = BigDecimal.valueOf(bond.getFaceValue() + accruedInterest)
                .setScale(2, RoundingMode.HALF_UP).doubleValue();

        return new BondReturnPriceDTO(
                bond.getFaceValue(),
                BondPriceResolver.unitPrice(bond),
                accruedInterest,
                returnPrice,
                asOfDate,
                "ACT/365"
        );
    }
}
