package com.example.pms.dto.response;

import com.example.pms.model.Notification;
import com.example.pms.model.enums.NotificationStatus;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDate;

@Data
@AllArgsConstructor
public class NotificationDTO {
    private Integer id;
    private Long portfolioId;
    private String portfolioName;
    private String message;
    private NotificationStatus status;
    private LocalDate date;

    public static NotificationDTO from(Notification notification) {
        return new NotificationDTO(
                notification.getId(),
                notification.getPortfolio() == null ? null : notification.getPortfolio().getId(),
                notification.getPortfolio() == null ? "Portfolio" : notification.getPortfolio().getName(),
                notification.getMessage(),
                notification.getStatus(),
                notification.getDate()
        );
    }
}
