package com.example.pms.service;

import com.example.pms.dto.response.NotificationDTO;
import com.example.pms.exception.UserNotFoundException;
import com.example.pms.model.Notification;
import com.example.pms.model.User;
import com.example.pms.model.enums.NotificationStatus;
import com.example.pms.repository.NotificationRepository;
import com.example.pms.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {
    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<NotificationDTO> getForUser(Integer userId) {
        requireUser(userId);
        return notificationRepository.findByUserUserIdOrderByDateDescIdDesc(userId)
                .stream().map(NotificationDTO::from).toList();
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(Integer userId) {
        requireUser(userId);
        return notificationRepository.countByUserUserIdAndStatus(userId, NotificationStatus.UNSEEN);
    }

    @Transactional
    public NotificationDTO markRead(Integer userId, Integer notificationId) {
        User user = requireUser(userId);
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found."));
        if (notification.getUser() == null || !notification.getUser().getUserId().equals(user.getUserId())) {
            throw new IllegalArgumentException("Notification does not belong to this user.");
        }
        notification.setStatus(NotificationStatus.READ);
        return NotificationDTO.from(notificationRepository.save(notification));
    }

    private User requireUser(Integer userId) {
        return userRepository.findById(userId).orElseThrow(UserNotFoundException::new);
    }
}
