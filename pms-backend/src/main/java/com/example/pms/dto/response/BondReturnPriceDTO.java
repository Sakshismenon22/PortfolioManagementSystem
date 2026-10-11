package com.example.pms.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class BondReturnPriceDTO {
    private Double faceValue;
    private Double tradePrice;
    private Double accruedCouponInterest;
    private Double currentReturnPrice;
    private LocalDate asOfDate;
    private String dayCountConvention;
}
