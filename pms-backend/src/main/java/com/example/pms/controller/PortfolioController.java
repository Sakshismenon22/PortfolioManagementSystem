package com.example.pms.controller;

import com.example.pms.dto.request.CreateAndActivatePortfolioDTO;
import com.example.pms.dto.request.CreatePortfolioDTO;
import com.example.pms.dto.request.GetAllPortfolioDTO;
import com.example.pms.dto.response.GetAllPortfolioResponseDTO;
import com.example.pms.dto.response.ValidationDTO;
import com.example.pms.model.Portfolio;
import com.example.pms.response.Response;
import com.example.pms.service.PortfolioService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/portfolio")
@RequiredArgsConstructor
public class PortfolioController {

    private final PortfolioService portfolioService;

    @PostMapping("/create-portfolio")
    public ResponseEntity<?> createPortfolio(@RequestBody CreatePortfolioDTO createPortfolioDTO){
        return ResponseEntity.ok(new Response<Portfolio>(HttpStatus.OK.value(),true,portfolioService.createPortfolio(createPortfolioDTO),"Created.", LocalDateTime.now()));
    }

    @GetMapping("/validate-portfolio/{id}")
    public ResponseEntity<?> validatePortfolio(@PathVariable Long id){
        return ResponseEntity.ok(new Response<ValidationDTO>(HttpStatus.OK.value(),true,portfolioService.isValid(id),"Validation Done.", LocalDateTime.now()));
    }

    @GetMapping("/buy-portfolio-holdings/{id}")
    public ResponseEntity<?> buyPortfolioHoldings(@PathVariable Long id){
        return ResponseEntity.ok(new Response<String>(HttpStatus.OK.value(),true,null,portfolioService.buyPortfolioHoldings(id), LocalDateTime.now()));
    }

    @PostMapping("/create-and-activate-portfolio")
    public ResponseEntity<?> createAndActivatePortfolio(@RequestBody CreateAndActivatePortfolioDTO createAndActivatePortfolioDTO){
        System.out.println("Reached.");
        return ResponseEntity.ok(new Response<String>(HttpStatus.OK.value(),true,null,portfolioService.createAndActivatePortfolio(createAndActivatePortfolioDTO), LocalDateTime.now()));
    }


    @GetMapping("/count-portfolio/{userId}")
    public Integer getCountOfPortfolios(@PathVariable Integer userId){
        return portfolioService.getCountOfPortfolios(userId);
    }

    @GetMapping("/count-active/{userId}")
    public Integer getCountOfActivePortfolios(@PathVariable Integer userId){
        return portfolioService.getCountOfActivePortfolios(userId);
    }

    @PostMapping("/get-all-portfolio")
    public ResponseEntity<?> getAllPortfolio(@RequestBody GetAllPortfolioDTO getAllPortfolioDTO){
        return ResponseEntity.ok(new Response<GetAllPortfolioResponseDTO>(HttpStatus.OK.value(), true,portfolioService.getAllPortfolioDetails(getAllPortfolioDTO),"All portfolios retrieved.",LocalDateTime.now()));
    }


    @GetMapping("/remaining-total/{userId}")
    public Double getTotalRemainingAmount(@PathVariable Integer userId){
        return portfolioService.getTotalRemainingAmount(userId);
    }

    @GetMapping("/portfolio-details/{id}/{userId}")
    public Response<Portfolio> getPortfolioDetails(@PathVariable Long id, @PathVariable Integer userId){
        return new Response<>(HttpStatus.OK.value(), true, portfolioService.getPortfolioDetails(id, userId), "Portfolio details retrieved", LocalDateTime.now());
    }

    @GetMapping("/basic-info/{id}/{userId}")
    public ResponseEntity<?> getPortfolioBasicInfo(
            @PathVariable Long id,
            @PathVariable Integer userId
    ) {

        return ResponseEntity.ok(
                new Response<>(
                        HttpStatus.OK.value(),
                        true,
                        portfolioService.getPortfolioBasicInfo(
                                id,
                                userId
                        ),
                        "Portfolio basic information retrieved.",
                        LocalDateTime.now()
                )
        );
    }

    @GetMapping("/theme-allocation/{id}/{userId}")
    public ResponseEntity<?> getThemeAllocation(
            @PathVariable Long id,
            @PathVariable Integer userId
    ) {

        return ResponseEntity.ok(
                new Response<>(
                        HttpStatus.OK.value(),
                        true,
                        portfolioService.getThemeAllocation(
                                id,
                                userId
                        ),
                        "Theme allocation retrieved.",
                        LocalDateTime.now()
                )
        );
    }

    @GetMapping("/holdings/{id}/{userId}")
    public ResponseEntity<?> getPortfolioHoldings(
            @PathVariable Long id,
            @PathVariable Integer userId
    ) {

        return ResponseEntity.ok(
                new Response<>(
                        HttpStatus.OK.value(),
                        true,
                        portfolioService.getPortfolioHoldings(
                                id,
                                userId
                        ),
                        "Portfolio holdings retrieved.",
                        LocalDateTime.now()
                )
        );
    }

    @GetMapping("/allocation-validation/{id}/{userId}")
    public ResponseEntity<?> validatePortfolioAllocation(
            @PathVariable Long id,
            @PathVariable Integer userId
    ) {

        return ResponseEntity.ok(
                new Response<>(
                        HttpStatus.OK.value(),
                        true,
                        portfolioService.validatePortfolioAllocation(
                                id,
                                userId
                        ),
                        "Portfolio allocation validation completed.",
                        LocalDateTime.now()
                )
        );
    }

}
