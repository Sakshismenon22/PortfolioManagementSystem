package com.example.pms.repository;

import com.example.pms.model.Notification;
import com.example.pms.model.enums.NotificationStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Integer> {
    List<Notification> findByUserUserIdOrderByDateDescIdDesc(Integer userId);

    long countByUserUserIdAndStatus(Integer userId, NotificationStatus status);

    boolean existsByPortfolioIdAndUserUserIdAndMessageAndDate(
            Long portfolioId, Integer userId, String message, LocalDate date);

    void deleteByPortfolioId(Long portfolioId);
}
