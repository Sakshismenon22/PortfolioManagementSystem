package com.example.pms.exception;

public class ThemeNotFoundException extends RuntimeException{

    public ThemeNotFoundException(){
        super("Theme Not Found.");
    }
}
