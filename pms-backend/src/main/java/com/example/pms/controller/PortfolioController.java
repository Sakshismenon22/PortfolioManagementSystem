package com.example.pms.controller;

import com.example.pms.dto.request.CreatePortfolioDTO;
import com.example.pms.dto.response.ValidationDTO;
import com.example.pms.response.Response;
import com.example.pms.service.PortfolioService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/portfolio")
@RequiredArgsConstructor
public class PortfolioController {

    private final PortfolioService portfolioService;

    @PostMapping("/create-portfolio")
    public ResponseEntity<?> createPortfolio(@RequestBody CreatePortfolioDTO createPortfolioDTO){
        return ResponseEntity.ok(new Response<String>(HttpStatus.OK.value(),true,null,portfolioService.createPortfolio(createPortfolioDTO), LocalDateTime.now()));
    }

    @GetMapping("/validate-portfolio/{id}")
    public ResponseEntity<?> validatePortfolio(@PathVariable Long id){
        return ResponseEntity.ok(new Response<ValidationDTO>(HttpStatus.OK.value(),true,portfolioService.isValid(id),"Validation Done.", LocalDateTime.now()));
    }

    @GetMapping("/buy-portfolio-holdings/{id}")
    public ResponseEntity<?> buyPortfolioHoldings(@PathVariable Long id){
        return ResponseEntity.ok(new Response<String>(HttpStatus.OK.value(),true,null,portfolioService.buyPortfolioHoldings(id), LocalDateTime.now()));
    }
}
