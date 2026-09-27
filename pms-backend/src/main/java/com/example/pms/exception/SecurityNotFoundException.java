package com.example.pms.exception;

public class SecurityNotFoundException extends RuntimeException {
    public SecurityNotFoundException() {
        super("Security not found.");
    }
}
