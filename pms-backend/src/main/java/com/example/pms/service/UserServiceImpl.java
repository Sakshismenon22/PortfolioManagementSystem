package com.example.pms.service;


import com.example.pms.dto.request.LoginRequest;
import com.example.pms.dto.response.LoginResponse;
import com.example.pms.exception.UserAlreadyExistsException;
import com.example.pms.model.User;
import com.example.pms.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;


@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    final private UserRepository userRepository;

    private final PasswordEncoder passwordEncoder;


    @Override
    public String register(User user) {

        if(userRepository.existsByEmail(user.getEmail())){
            throw new UserAlreadyExistsException();
        }

        user.setPassword(passwordEncoder.encode(user.getPassword()));

        user.setRole("FUND_MANAGER");

        userRepository.save(user);

        return "User registered successfully.";

    }

    @Override
    public LoginResponse login(LoginRequest loginRequest) {
        User user =  userRepository.findByEmail(loginRequest.getEmail()).orElseThrow(() -> new RuntimeException("Invalid email or password"));

        boolean passwordMatches = passwordEncoder.matches(loginRequest.getPassword(), user.getPassword());

        if(!passwordMatches){
            throw new RuntimeException("Invalid email or password");
        }

        return new LoginResponse(user.getUserId(), user.getName(), user.getEmail(), user.getRole(), "Login successful");
    }


}
