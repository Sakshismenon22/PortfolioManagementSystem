package com.example.pms.service;

import com.example.pms.dto.request.AllocationDTO;
import com.example.pms.model.AllocationRule;

import java.util.List;

public interface AllocationRuleService {

    public AllocationRule addAllocationRule(AllocationDTO allocationDTO);

    public String updateAllocationRule(AllocationRule allocationRule);



}
