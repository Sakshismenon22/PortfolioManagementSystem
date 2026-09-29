package com.example.pms.service;


import com.example.pms.dto.request.LoginRequest;
import com.example.pms.dto.response.LoginResponse;
import com.example.pms.model.User;

public interface UserService {

    public String register(User user);

    LoginResponse login(LoginRequest loginRequest);

}
