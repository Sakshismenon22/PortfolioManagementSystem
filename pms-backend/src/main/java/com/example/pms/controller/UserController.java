package com.example.pms.controller;

import com.example.pms.model.User;
import com.example.pms.response.Response;
import com.example.pms.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PostMapping("/register")
    public Response<String> register(@RequestBody User user){
        return new Response<>(HttpStatus.OK.value(), true, null, userService.register(user), LocalDateTime.now() );
    }
}
