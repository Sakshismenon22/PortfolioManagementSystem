package com.example.pms.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class Response <T>{

    private Integer statusCode;
    private Boolean success;
    private T data;
    private String message;
    private LocalDateTime timeStamp;

}
