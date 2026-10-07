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
class UserServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserServiceImpl userService;


    @Test
    @DisplayName("TC-USER-001 | Register user")
    void register_shouldRegisterSuccessfully() {

        User user =
                new User();

        user.setName("ABC");
        user.setEmail("abc@gmail.com");
        user.setPassword("password@123");

        when(userRepository
                .existsByEmail("abc@gmail.com"))
                .thenReturn(false);

        when(passwordEncoder
                .encode("password@123"))
                .thenReturn("encodedPassword");

        String result =
                userService.register(user);

        assertEquals(
                "User registered successfully.",
                result
        );

        assertEquals(
                "encodedPassword",
                user.getPassword()
        );

        assertEquals(
                "FUND_MANAGER",
                user.getRole()
        );

        verify(userRepository)
                .save(user);
    }


    @Test
    @DisplayName("TC-USER-002 | Duplicate email")
    void register_shouldRejectDuplicateEmail() {

        User user =
                new User();

        user.setEmail("abc@gmail.com");
        user.setPassword("password@123");

        when(userRepository
                .existsByEmail("abc@gmail.com"))
                .thenReturn(true);

        assertThrows(
                UserAlreadyExistsException.class,
                () -> userService.register(user)
        );

        verify(passwordEncoder, never())
                .encode(anyString());

        verify(userRepository, never())
                .save(any());
    }


    @Test
    @DisplayName("TC-USER-003 | Successful login")
    void login_shouldReturnResponse() {

        User user =
                new User();

        user.setUserId(1);
        user.setName("ABC");
        user.setEmail("abc@gmail.com");
        user.setPassword("encodedPassword");
        user.setRole("FUND_MANAGER");

        LoginRequest request =
                new LoginRequest(
                        "abc@gmail.com",
                        "password@123"
                );

        when(userRepository
                .findByEmail("abc@gmail.com"))
                .thenReturn(Optional.of(user));

        when(passwordEncoder
                .matches(
                        "password@123",
                        "encodedPassword"
                ))
                .thenReturn(true);

        LoginResponse result =
                userService.login(request);

        assertNotNull(result);

        assertEquals(
                1,
                result.getUserId()
        );

        assertEquals(
                "ABC",
                result.getName()
        );

        assertEquals(
                "abc@gmail.com",
                result.getEmail()
        );

        assertEquals(
                "FUND_MANAGER",
                result.getRole()
        );

        assertEquals(
                "Login successful",
                result.getMessage()
        );
    }


    @Test
    @DisplayName("TC-USER-004 | Unknown email")
    void login_shouldRejectUnknownEmail() {

        LoginRequest request =
                new LoginRequest(
                        "unknown@gmail.com",
                        "password"
                );

        when(userRepository
                .findByEmail("unknown@gmail.com"))
                .thenReturn(Optional.empty());

        RuntimeException exception =
                assertThrows(
                        RuntimeException.class,
                        () -> userService.login(request)
                );

        assertEquals(
                "Invalid email or password",
                exception.getMessage()
        );

        verify(passwordEncoder, never())
                .matches(anyString(), anyString());
    }


    @Test
    @DisplayName("TC-USER-005 | Wrong password")
    void login_shouldRejectWrongPassword() {

        User user =
                new User();

        user.setUserId(1);
        user.setName("ABC");
        user.setEmail("abc@gmail.com");
        user.setPassword("encodedPassword");
        user.setRole("FUND_MANAGER");

        LoginRequest request =
                new LoginRequest(
                        "abc@gmail.com",
                        "wrongPassword"
                );

        when(userRepository
                .findByEmail("abc@gmail.com"))
                .thenReturn(Optional.of(user));

        when(passwordEncoder
                .matches(
                        "wrongPassword",
                        "encodedPassword"
                ))
                .thenReturn(false);

        RuntimeException exception =
                assertThrows(
                        RuntimeException.class,
                        () -> userService.login(request)
                );

        assertEquals(
                "Invalid email or password",
                exception.getMessage()
        );
    }
}