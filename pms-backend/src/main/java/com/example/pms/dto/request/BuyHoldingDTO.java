package com.example.pms.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class BuyHoldingDTO {

    private Long portfolioId;

    private Integer quantity;

    private Long securityId;

}
