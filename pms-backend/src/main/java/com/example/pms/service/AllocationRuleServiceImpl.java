package com.example.pms.service;

import com.example.pms.dto.request.AllocationDTO;
import com.example.pms.exception.AllocationRuleNotFoundException;
import com.example.pms.exception.AssetNotFoundException;
import com.example.pms.model.AllocationRule;
import com.example.pms.model.Asset;
import com.example.pms.repository.AllocationRuleRepository;
import com.example.pms.repository.AssetRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AllocationRuleServiceImpl implements AllocationRuleService{

    private final AssetRepository assetRepository;
    private final AllocationRuleRepository allocationRuleRepository;

    @Override
    public AllocationRule addAllocationRule(AllocationDTO allocationDTO) {
        if(assetRepository.existsById(allocationDTO.getAssetId())){
            Asset asset = assetRepository.findById(allocationDTO.getAssetId()).get();
            AllocationRule allocationRule = new AllocationRule(null,asset,allocationDTO.getPercentage());
            return allocationRuleRepository.save(allocationRule);

        }else{
            throw new AssetNotFoundException();
        }
    }

    @Override
    public String updateAllocationRule(AllocationRule allocationRule) {
        if(allocationRuleRepository.existsById(allocationRule.getId())){
            allocationRuleRepository.save(allocationRule);
            return "Allocation Rule Updated.";
        }else{
            throw new AllocationRuleNotFoundException();
        }
    }
}
