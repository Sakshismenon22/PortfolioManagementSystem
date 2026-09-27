package com.example.pms.service;

import com.example.pms.model.User;
import com.example.pms.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    final private UserRepository userRepository;

    @Override
    public String register(User user) {

        userRepository.save(user);

        return "User registered successfully";

    }
}
