package com.example.pms.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class BenchmarkHistoryPointDTO {
    private LocalDate date;
    private Double close;
}
