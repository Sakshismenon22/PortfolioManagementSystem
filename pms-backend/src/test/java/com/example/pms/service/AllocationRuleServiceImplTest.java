package com.example.pms.service;

import com.example.pms.dto.request.AllocationDTO;
import com.example.pms.exception.AllocationRuleNotFoundException;
import com.example.pms.exception.AssetNotFoundException;
import com.example.pms.model.AllocationRule;
import com.example.pms.model.Asset;
import com.example.pms.repository.AllocationRuleRepository;
import com.example.pms.repository.AssetRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class AllocationRuleServiceImplTest {

    @Mock
    private AssetRepository assetRepository;

    @Mock
    private AllocationRuleRepository allocationRuleRepository;

    @InjectMocks
    private AllocationRuleServiceImpl allocationRuleService;

    @Test
    @DisplayName("TC-ALLOC-001 | Add allocation rule for existing asset")
    void addAllocationRule_shouldCreateRule_whenAssetExists(){

        Integer assetId = 1;

        AllocationDTO allocationDTO = new AllocationDTO(assetId, 60.0);

        Asset asset = new Asset();

        asset.setId(assetId);

        asset.setAssetClass("Equity");

        AllocationRule savedRule = new AllocationRule(10, asset, 60.0);

        when(assetRepository.existsById(assetId)).thenReturn(true);

        when(assetRepository.findById(assetId)).thenReturn(Optional.of(asset));

        when(allocationRuleRepository.save(any(AllocationRule.class))).thenReturn(savedRule);

        AllocationRule result = allocationRuleService.addAllocationRule(allocationDTO);

        assertNotNull(result);

        assertEquals(10, result.getId());

        assertEquals(asset, result.getAsset());

        assertEquals(60.0 , result.getPercentage());

        verify(assetRepository).existsById(assetId);

        verify(assetRepository).findById(assetId);

        verify(allocationRuleRepository).save(any(AllocationRule.class));

    }

    @Test
    @DisplayName("TC-ALLOC-002 | Reject allocation rule when asset does not existing asset")
    void addAllocationRule_shouldThrowException_whenAssetDoesNotExist(){

        Integer assetId = 999;

        AllocationDTO allocationDTO = new AllocationDTO(assetId, 60.0);

        when(assetRepository.existsById(assetId)).thenReturn(false);

        assertThrows(AssetNotFoundException.class, () -> allocationRuleService.addAllocationRule(allocationDTO));

        verify(assetRepository).existsById(assetId);

        verify(assetRepository, never()).findById(assetId);

        verify(allocationRuleRepository, never()).save(any(AllocationRule.class));

    }

    @Test
    @DisplayName("TC-ALLOC-003 | Update an existing allocation rule")
    void updateAllocationRule_shouldUpdateRule_whenRuleExists(){

        AllocationRule allocationRule = new AllocationRule();

        allocationRule.setId(10);

        allocationRule.setPercentage(70.0);

       when(allocationRuleRepository.existsById(10)).thenReturn(true);

       String result = allocationRuleService.updateAllocationRule(allocationRule);

        assertEquals("Allocation Rule Updated.", result);

        verify(allocationRuleRepository).existsById(10);

        verify(allocationRuleRepository).save(allocationRule);

    }

    @Test
    @DisplayName("TC-ALLOC-004 | Reject update for a missing allocation rule")
    void updateAllocationRule_shouldThrowException_whenRuleDoesNotExist(){

        AllocationRule allocationRule = new AllocationRule();

        allocationRule.setId(999);

        when(allocationRuleRepository.existsById(999)).thenReturn(false);

        assertThrows(AllocationRuleNotFoundException.class , () -> allocationRuleService.updateAllocationRule(allocationRule));

        verify(allocationRuleRepository).existsById(999);

        verify(allocationRuleRepository, never()).save(any(AllocationRule.class));

    }
}
