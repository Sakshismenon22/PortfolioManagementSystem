package com.example.pms.exception;

public class AllocationRuleNotFoundException extends RuntimeException {

    public AllocationRuleNotFoundException(){
        super("Allocation Rule Not Found.");
    }

}
