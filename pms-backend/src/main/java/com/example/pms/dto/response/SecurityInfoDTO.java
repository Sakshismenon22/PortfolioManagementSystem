package com.example.pms.dto.response;

import com.example.pms.model.Asset;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class SecurityInfoDTO {

    private Long id;
    private String name;
    private String symbol;
    private String isin;
    private Asset asset;
    private Double price;


}
