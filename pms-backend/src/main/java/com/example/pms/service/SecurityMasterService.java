package com.example.pms.service;

import com.example.pms.dto.response.SecuritiesInfoDTO;
import com.example.pms.dto.response.BondReturnPriceDTO;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;


public interface SecurityMasterService {

    public SecuritiesInfoDTO getAllSecuritiesInfo();

    SecuritiesInfoDTO searchSecurities(String query);

    public Double getCurrentPrice(Long securityId);

    Double getCurrentTradePrice(Long securityId);

    BondReturnPriceDTO getBondReturnPrice(Long securityId, LocalDate purchaseDate);

}
