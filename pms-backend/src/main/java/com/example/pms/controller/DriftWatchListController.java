package com.example.pms.controller;

import com.example.pms.response.Response;
import com.example.pms.dto.response.DriftHistoryDTO;
import com.example.pms.service.DriftWatchListService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/drift")
public class DriftWatchListController {


    private final DriftWatchListService driftWatchListService;

    public DriftWatchListController(DriftWatchListService driftWatchListService) {
        this.driftWatchListService = driftWatchListService;
    }

    @GetMapping("/calculate/{portfolioId}/{userId}")
    public ResponseEntity<Response> calculateDrift(@PathVariable Long portfolioId, @PathVariable Integer userId){
        return ResponseEntity.ok(new Response(HttpStatus.OK.value(), true,null,driftWatchListService.performPortfolioDriftCalculation(portfolioId, userId), LocalDateTime.now()));
    }

    @GetMapping("/history/{portfolioId}/{userId}")
    public ResponseEntity<Response<List<DriftHistoryDTO>>> getDriftHistory(
            @PathVariable Long portfolioId,
            @PathVariable Integer userId
    ) {
        return ResponseEntity.ok(new Response<>(
                HttpStatus.OK.value(),
                true,
                driftWatchListService.getDriftHistory(portfolioId, userId),
                "Drift history retrieved.",
                LocalDateTime.now()
        ));
    }

    @GetMapping("/trigger")
    public String triggerDriftCalculation(){
        driftWatchListService.doDriftCalculation();
        return "Triggered.";
    }

}
