package com.example.pms.controller;


import com.example.pms.dto.response.SecuritiesInfoDTO;
import com.example.pms.dto.response.BondReturnPriceDTO;
import com.example.pms.model.SecurityMaster;
import com.example.pms.response.Response;
import com.example.pms.service.SecurityMasterService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.time.LocalDate;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/security")
public class SecurityMasterController {

    private final SecurityMasterService securityMasterService;

    @GetMapping("/get-all-security-info")
    public ResponseEntity<?> getAllSecurityInfo(){
        return new ResponseEntity<>(new Response<SecuritiesInfoDTO>(HttpStatus.OK.value(), true, securityMasterService.getAllSecuritiesInfo(), "All securities info retrieved.", LocalDateTime.now()),HttpStatus.OK);
    }

    @GetMapping("/bond-return-price/{securityId}")
    public ResponseEntity<Response<BondReturnPriceDTO>> getBondReturnPrice(
            @PathVariable Long securityId,
            @RequestParam(required = false) LocalDate purchaseDate) {
        BondReturnPriceDTO price = securityMasterService.getBondReturnPrice(securityId, purchaseDate);
        return ResponseEntity.ok(new Response<>(HttpStatus.OK.value(), true, price,
                "Bond return valuation retrieved using face value and accrued coupon interest.", LocalDateTime.now()));
    }

}
