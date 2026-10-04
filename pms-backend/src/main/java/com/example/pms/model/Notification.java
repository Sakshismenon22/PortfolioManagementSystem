package com.example.pms.model;

import com.example.pms.model.enums.NotificationStatus;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;

@Entity
public class Notification{

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Integer id;

    @ManyToOne
    private Portfolio portfolio;

    private String message;

    @Enumerated(EnumType.STRING)
    private NotificationStatus status;

    private LocalDate date;

    @ManyToOne
    private User user;
}
