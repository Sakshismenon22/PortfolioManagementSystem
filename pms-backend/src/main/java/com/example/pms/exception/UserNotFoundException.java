package com.example.pms.exception;

public class UserNotFoundException extends RuntimeException{

    public UserNotFoundException(){
        super("User not found.");
    }
}
