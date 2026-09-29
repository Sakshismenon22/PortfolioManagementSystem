package com.example.pms.exception;

public class UserAlreadyExistsException extends RuntimeException{

    public UserAlreadyExistsException(){
        super("User already exists.");
    }
}
