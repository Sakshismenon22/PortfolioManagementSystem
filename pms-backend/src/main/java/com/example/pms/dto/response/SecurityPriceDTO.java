package com.example.pms.dto.response;

import com.example.pms.model.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class SecurityPriceDTO {

    private SecurityMaster securityMaster;
    private Bond bond;
    private StockData stockData;
    private MutualFundNav mutualFundNav;
    private CommoditySpotData commoditySpotData;


}
