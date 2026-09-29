package com.example.pms.controller;

import com.example.pms.dto.response.BenchmarkHistoryPointDTO;
import com.example.pms.response.Response;
import com.example.pms.service.Nifty50HistoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/benchmark")
@RequiredArgsConstructor
public class BenchmarkController {

    private static final Logger logger = LoggerFactory.getLogger(BenchmarkController.class);

    private final Nifty50HistoryService nifty50HistoryService;

    @GetMapping("/nifty50-history")
    public ResponseEntity<?> getNifty50History(
            @RequestParam @DateTimeFormat(pattern = "dd-MM-yyyy") LocalDate from,
            @RequestParam @DateTimeFormat(pattern = "dd-MM-yyyy") LocalDate to
    ) {
        try {
            List<BenchmarkHistoryPointDTO> points = nifty50HistoryService.getHistory(from, to);
            return ResponseEntity.ok(new Response<>(HttpStatus.OK.value(), true, points, "NIFTY 50 history retrieved.", LocalDateTime.now()));
        } catch (IllegalArgumentException exception) {
            return ResponseEntity.badRequest().body(new Response<>(HttpStatus.BAD_REQUEST.value(), false, null, exception.getMessage(), LocalDateTime.now()));
        } catch (Exception exception) {
            logger.error("Unable to retrieve NIFTY 50 history from NSE for {} through {}", from, to, exception);
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(new Response<>(HttpStatus.BAD_GATEWAY.value(), false, null, "NSE NIFTY 50 history is unavailable right now.", LocalDateTime.now()));
        }
    }
}
