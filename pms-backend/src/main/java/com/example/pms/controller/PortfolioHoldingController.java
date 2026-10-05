package com.example.pms.controller;

import com.example.pms.dto.request.AddPortfolioHoldingDTO;
import com.example.pms.dto.request.BuyHoldingDTO;
import com.example.pms.dto.request.CreatePortfolioDTO;
import com.example.pms.dto.request.SellHoldingDTO;
import com.example.pms.dto.request.UpdateEquityCategoryDTO;
import com.example.pms.response.Response;
import com.example.pms.service.PortfolioHoldingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.List;

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

    @PostMapping("/sell-batch")
    public ResponseEntity<?> sellHoldingsBatch(@RequestBody List<SellHoldingDTO> sellHoldingDTOList){
        return ResponseEntity.ok(new Response<String>(HttpStatus.OK.value(),true,null,
                portfolioHoldingService.sellHoldingsBatch(sellHoldingDTOList),LocalDateTime.now()));
    }

    @PostMapping("/buy")
    public ResponseEntity<?> buyHoldings(@RequestBody BuyHoldingDTO buyHoldingDTO){
        return ResponseEntity.ok(new Response<String>(HttpStatus.OK.value(), true, null,
                portfolioHoldingService.buySecurities(buyHoldingDTO), LocalDateTime.now()));
    }

    @PostMapping("/buy-batch")
    public ResponseEntity<?> buyHoldingsBatch(@RequestBody List<BuyHoldingDTO> buyHoldingDTOList){
        return ResponseEntity.ok(new Response<String>(HttpStatus.OK.value(), true, null,
                portfolioHoldingService.buySecuritiesBatch(buyHoldingDTOList), LocalDateTime.now()));
    }

    @PatchMapping("/{holdingId}/equity-category")
    public ResponseEntity<?> updateEquityCategory(
            @PathVariable Integer holdingId,
            @RequestBody UpdateEquityCategoryDTO request) {
        return ResponseEntity.ok(new Response<String>(HttpStatus.OK.value(), true, null,
                portfolioHoldingService.updateEquityCategory(holdingId, request.getEquityCategory()), LocalDateTime.now()));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<?> handleInvalidTrade(IllegalArgumentException exception) {
        String message = exception.getMessage() == null ? "The requested trade is invalid." : exception.getMessage();
        return ResponseEntity.badRequest().body(new Response<String>(HttpStatus.BAD_REQUEST.value(), false, null, message, LocalDateTime.now()));
    }

}
