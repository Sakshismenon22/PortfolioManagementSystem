package com.example.pms.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CreateAndActivatePortfolioDTO {

    CreatePortfolioDTO createPortfolioDTO;

    List<AddPortfolioHoldingDTO> addPortfolioHoldingDTOList;

}
