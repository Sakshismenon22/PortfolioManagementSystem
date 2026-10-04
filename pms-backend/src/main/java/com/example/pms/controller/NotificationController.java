package com.example.pms.controller;

import com.example.pms.dto.response.NotificationDTO;
import com.example.pms.response.Response;
import com.example.pms.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {
    private final NotificationService notificationService;

    @GetMapping("/user/{userId}")
    public ResponseEntity<Response<List<NotificationDTO>>> getNotifications(@PathVariable Integer userId) {
        return ResponseEntity.ok(new Response<>(HttpStatus.OK.value(), true,
                notificationService.getForUser(userId), "Notifications retrieved.", LocalDateTime.now()));
    }

    @GetMapping("/user/{userId}/unread-count")
    public ResponseEntity<Response<Long>> getUnreadCount(@PathVariable Integer userId) {
        return ResponseEntity.ok(new Response<>(HttpStatus.OK.value(), true,
                notificationService.getUnreadCount(userId), "Unread count retrieved.", LocalDateTime.now()));
    }

    @PatchMapping("/user/{userId}/{notificationId}/read")
    public ResponseEntity<Response<NotificationDTO>> markRead(
            @PathVariable Integer userId, @PathVariable Integer notificationId) {
        return ResponseEntity.ok(new Response<>(HttpStatus.OK.value(), true,
                notificationService.markRead(userId, notificationId), "Notification marked as read.", LocalDateTime.now()));
    }
}
