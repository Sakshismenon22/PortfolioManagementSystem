package com.example.pms.repository;

import com.example.pms.model.AllocationRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AllocationRuleRepository extends JpaRepository<AllocationRule,Integer> {
}
