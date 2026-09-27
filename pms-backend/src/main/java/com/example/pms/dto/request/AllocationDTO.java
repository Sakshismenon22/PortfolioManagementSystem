package com.example.pms.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AllocationDTO {

    private Integer assetId;

    private Double percentage;

}
