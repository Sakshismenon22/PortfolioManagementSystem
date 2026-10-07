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
class AllocationRuleServiceImplTest {

    @Mock
    private AssetRepository assetRepository;

    @Mock
    private AllocationRuleRepository allocationRuleRepository;

    @InjectMocks
    private AllocationRuleServiceImpl allocationRuleService;


    @Test
    @DisplayName("TC-ALLOC-001 | Add allocation rule")
    void addAllocationRule_shouldCreateRule_whenAssetExists() {

        Asset asset =
                new Asset();

        asset.setId(1);
        asset.setAssetClass("Equity");

        AllocationDTO request =
                new AllocationDTO(
                        1,
                        60.0
                );

        AllocationRule saved =
                new AllocationRule(
                        10,
                        asset,
                        60.0
                );

        when(assetRepository.existsById(1))
                .thenReturn(true);

        when(assetRepository.findById(1))
                .thenReturn(Optional.of(asset));

        when(allocationRuleRepository
                .save(any(AllocationRule.class)))
                .thenReturn(saved);

        AllocationRule result =
                allocationRuleService
                        .addAllocationRule(request);

        assertNotNull(result);
        assertEquals(10, result.getId());
        assertEquals(asset, result.getAsset());
        assertEquals(60.0, result.getPercentage());

        verify(allocationRuleRepository)
                .save(any(AllocationRule.class));
    }


    @Test
    @DisplayName("TC-ALLOC-002 | Reject missing asset")
    void addAllocationRule_shouldThrow_whenAssetMissing() {

        AllocationDTO request =
                new AllocationDTO(
                        999,
                        60.0
                );

        when(assetRepository.existsById(999))
                .thenReturn(false);

        assertThrows(
                AssetNotFoundException.class,
                () -> allocationRuleService
                        .addAllocationRule(request)
        );

        verify(allocationRuleRepository, never())
                .save(any());
    }


    @Test
    @DisplayName("TC-ALLOC-003 | Update allocation rule")
    void updateAllocationRule_shouldUpdate_whenExists() {

        AllocationRule rule =
                new AllocationRule();

        rule.setId(10);
        rule.setPercentage(70.0);

        when(allocationRuleRepository
                .existsById(10))
                .thenReturn(true);

        assertEquals(
                "Allocation Rule Updated.",
                allocationRuleService
                        .updateAllocationRule(rule)
        );

        verify(allocationRuleRepository)
                .save(rule);
    }


    @Test
    @DisplayName("TC-ALLOC-004 | Reject missing allocation rule")
    void updateAllocationRule_shouldThrow_whenMissing() {

        AllocationRule rule =
                new AllocationRule();

        rule.setId(999);

        when(allocationRuleRepository
                .existsById(999))
                .thenReturn(false);

        assertThrows(
                AllocationRuleNotFoundException.class,
                () -> allocationRuleService
                        .updateAllocationRule(rule)
        );

        verify(allocationRuleRepository, never())
                .save(any());
    }
}