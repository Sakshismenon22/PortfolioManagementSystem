package com.example.pms.service;

import com.example.pms.dto.request.LoginRequest;
import com.example.pms.dto.response.LoginResponse;
import com.example.pms.exception.UserAlreadyExistsException;
import com.example.pms.model.User;
import com.example.pms.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class UserServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserServiceImpl userServiceImpl;

    @Test
    @DisplayName("TC-USER-001 | Register user with a new email.")
    void register_shouldRegisterUserSuccessfully(){

        //Arrange
        User user =  new User();

        user.setName("ABC");
        user.setEmail("abc@gmail.com");
        user.setPassword("password@123");

        when(userRepository.existsByEmail("abc@gmail.com")).thenReturn(false);

        when(passwordEncoder.encode("password@123")).thenReturn("encodedPassword");

        //Act
        String result = userServiceImpl.register(user);

        //Assert
        assertEquals("User registered successfully.", result);

        assertEquals("encodedPassword", user.getPassword());

        assertEquals("FUND_MANAGER", user.getRole());

        //Verify
        verify(userRepository).existsByEmail("abc@gmail.com");

        verify(passwordEncoder).encode("password@123");

        verify(userRepository).save(user);

    }

    @Test
    @DisplayName("TC-USER-002 | Reject registration when email already exists")
    void register_shouldThrowException_whenEmailAlreadyExists(){

        User user = new User();

        user.setEmail("abc@gmail.com");
        user.setPassword("password@123");

        when(userRepository.existsByEmail("abc@gmail.com")).thenReturn(true);

        assertThrows(UserAlreadyExistsException.class, () -> userServiceImpl.register(user));

        verify(userRepository).existsByEmail("abc@gmail.com");

        verify(passwordEncoder, never()).encode(anyString());

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("TC-USER_003 | Login with valid credentials")
    void login_shouldReturnLoginResponse_whenCredentialsAreValid(){

        User user = new User();

        user.setUserId(1);
        user.setName("ABC");
        user.setEmail("abc@gmail.com");
        user.setPassword("encodedPassword");
        user.setRole("FUND_MANAGER");

        LoginRequest loginRequest = new LoginRequest("abc@gmail.com", "password@123");

        when(userRepository.findByEmail("abc@gmail.com")).thenReturn(Optional.of(user));

        when(passwordEncoder.matches("password@123", "encodedPassword")).thenReturn(true);

        //Act

        LoginResponse loginResponse = userServiceImpl.login(loginRequest);

        //Assert
        assertNotNull(loginResponse);

        assertEquals(1, loginResponse.getUserId());

        assertEquals("ABC", loginResponse.getName());

        assertEquals("abc@gmail.com", loginResponse.getEmail());

        assertEquals("FUND_MANAGER", loginResponse.getRole());

        assertEquals("Login successful", loginResponse.getMessage());

        //Verify
        verify(userRepository).findByEmail("abc@gmail.com");

        verify(passwordEncoder).matches("password@123", "encodedPassword");

    }

    @Test
    @DisplayName("TC-USER_004 | Reject login when email does not exist")
    void login_shouldThrowException_whenEmailDoesNotExist(){

        LoginRequest loginRequest = new LoginRequest("abc@gmail.com", "password@123");

        when(userRepository.findByEmail("abc@gmail.com")).thenReturn(Optional.empty());

       //Act

        RuntimeException exception = assertThrows(RuntimeException.class, () -> userServiceImpl.login(loginRequest));

        //Assert
        assertEquals("Invalid email or password", exception.getMessage());

        //Verify
        verify(userRepository).findByEmail("abc@gmail.com");

        verify(passwordEncoder, never()).matches(anyString(), anyString());

    }

    @Test
    @DisplayName("TC-USER_005 | Reject login when password is incorrect")
    void login_shouldThrowException_whenPasswordIsIncorrect(){

        User user = new User();

        user.setUserId(1);
        user.setName("ABC");
        user.setEmail("abc@gmail.com");
        user.setPassword("encodedPassword");
        user.setRole("FUND_MANAGER");

        LoginRequest loginRequest = new LoginRequest("abc@gmail.com", "wrongPassword");

        when(userRepository.findByEmail("abc@gmail.com")).thenReturn(Optional.of(user));

        when(passwordEncoder.matches("wrongPassword", "encodedPassword")).thenReturn(false);

        //Act

        RuntimeException exception = assertThrows(RuntimeException.class, () -> userServiceImpl.login(loginRequest));

        //Assert
        assertEquals("Invalid email or password", exception.getMessage());

        //Verify
        verify(userRepository).findByEmail("abc@gmail.com");

        verify(passwordEncoder).matches("wrongPassword", "encodedPassword");

    }


}
