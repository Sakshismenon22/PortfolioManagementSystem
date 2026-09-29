package com.example.pms.controller;

import com.example.pms.dto.request.AddPortfolioHoldingDTO;
import com.example.pms.dto.request.BuyHoldingDTO;
import com.example.pms.dto.request.CreatePortfolioDTO;
import com.example.pms.dto.request.SellHoldingDTO;
import com.example.pms.response.Response;
import com.example.pms.service.PortfolioHoldingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/portfolio-holding")
@RequiredArgsConstructor
public class PortfolioHoldingController {

    private final PortfolioHoldingService portfolioHoldingService;

    @PostMapping("/add-holding")
    public ResponseEntity<?> addHolding(@RequestBody AddPortfolioHoldingDTO addPortfolioHoldingDTO){
        return ResponseEntity.ok(new Response<String>(HttpStatus.OK.value(),true,null,portfolioHoldingService.addPortfolioHolding(addPortfolioHoldingDTO), LocalDateTime.now()));
    }

    @PostMapping("/sell")
    public ResponseEntity<?> sellHoldingsShares(@RequestBody SellHoldingDTO sellHoldingDTO){
        return ResponseEntity.ok(new Response<String>(HttpStatus.OK.value(),true,null,portfolioHoldingService.sellHoldingsShare(sellHoldingDTO),LocalDateTime.now()));
    }

    @PostMapping("/buy")
    public ResponseEntity<?> buyHoldings(@RequestBody BuyHoldingDTO buyHoldingDTO){
        return ResponseEntity.ok(new Response<String>(HttpStatus.OK.value(),true,null,))
    }

}
