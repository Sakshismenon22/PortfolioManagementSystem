package com.example.pms.service;

import com.example.pms.dto.response.NotificationDTO;
import com.example.pms.exception.UserNotFoundException;
import com.example.pms.model.Notification;
import com.example.pms.model.User;
import com.example.pms.model.enums.NotificationStatus;
import com.example.pms.repository.NotificationRepository;
import com.example.pms.repository.UserRepository;
import org.checkerframework.checker.units.qual.N;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class NotificationServiceTest {

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private NotificationService notificationService;

    @Test
    @DisplayName("TC-NOTIF-001 | Retrieve notification for valid user")
    void getForUser_shouldRetrieveNotifications(){

        User user = new User();
        user.setUserId(1);

        Notification notification= new Notification();
        notification.setId(10);
        notification.setUser(user);

        when(userRepository.findById(1)).thenReturn(Optional.of(user));

        when(notificationRepository.findByUserUserIdOrderByDateDescIdDesc(1)).thenReturn(List.of(notification));

        List<NotificationDTO> result = notificationService.getForUser(1);

        assertNotNull(result);
        assertEquals(1, result.size());

        verify(userRepository).findById(1);
        verify(notificationRepository).findByUserUserIdOrderByDateDescIdDesc(1);
    }

    @Test
    @DisplayName("TC-NOTIF-002 | Reject retrieval of notifications when user does not exist")
    void getForUser_shouldThrowException_whenUserDoesNotExist(){

        when(userRepository.findById(999)).thenReturn(Optional.empty());

        assertThrows(UserNotFoundException.class, () -> notificationService.getForUser(999));

        verify(notificationRepository, never()).findByUserUserIdOrderByDateDescIdDesc(any());
    }

    @Test
    @DisplayName("TC-NOTIF-003 | Retrieve count of unread notifications")
    void getUnreadCount_shouldReturnCount(){

        User user = new User();
        user.setUserId(1);

        when(userRepository.findById(1)).thenReturn(Optional.of(user));
        when(notificationRepository.countByUserUserIdAndStatus(1, NotificationStatus.UNSEEN)).thenReturn(5L);

        long result = notificationService.getUnreadCount(1);

        assertEquals(5L, result);
    }

    @Test
    @DisplayName("TC-NOTIF-004 | Reject the retrieval of count of unread notifications")
    void getUnreadCount_shouldThrowException_whenUserMissing(){

        when(userRepository.findById(999)).thenReturn(Optional.empty());

        assertThrows(UserNotFoundException.class, () -> notificationService.getUnreadCount(999));
    }

    @Test
    @DisplayName("TC-NOTIF-005 | Mark notifications as read")
    void markRead_shouldMarkNotificationAsRead(){

        User user = new User();
        user.setUserId(1);

        Notification notification = new Notification();
        notification.setId(10);
        notification.setUser(user);
        notification.setStatus(NotificationStatus.UNSEEN);

        when(userRepository.findById(1)).thenReturn(Optional.of(user));
        when(notificationRepository.findById(10)).thenReturn(Optional.of(notification));
        when(notificationRepository.save(notification)).thenReturn(notification);

        NotificationDTO result = notificationService.markRead(1, 10);

        assertNotNull(result);
        assertEquals(NotificationStatus.READ, result.getStatus());

        verify(userRepository).findById(1);
        verify(notificationRepository).findById(10);
        verify(notificationRepository).save(any(Notification.class));

    }

    @Test
    @DisplayName("TC-NOTIF-006 | Reject marking of missing notification as read")
    void markRead_shouldThrowException_whenNotificationIsMissing(){

        User user = new User();
        user.setUserId(1);

        when(userRepository.findById(1)).thenReturn(Optional.of(user));

        when(notificationRepository.findById(999)).thenReturn(Optional.empty());

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> notificationService.markRead(1, 999));

        assertEquals("Notification not found.", exception.getMessage());


        verify(notificationRepository,never()).save(any());

    }

    @Test
    @DisplayName("TC-NOTIF-007 | Reject marking of notification as read when user is null")
    void markRead_shouldThrowException_whenNotificationUserIsNull(){

        User user = new User();
        user.setUserId(1);

        Notification notification = new Notification();
        notification.setId(10);
        notification.setUser(null);

        when(userRepository.findById(1)).thenReturn(Optional.of(user));

        when(notificationRepository.findById(10)).thenReturn(Optional.of(notification));

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> notificationService.markRead(1, 10));

        assertEquals("Notification does not belong to this user.", exception.getMessage());

        verify(userRepository).findById(1);
        verify(notificationRepository).findById(10);
        verify(notificationRepository,never()).save(any());

    }

    @Test
    @DisplayName("TC-NOTIF-008 | Reject marking of notification of another user")
    void markRead_shouldThrowException_whenNotificationBelongsToAnotherUser(){

        User owner = new User();
        owner.setUserId(1);

        User loggedInUser = new User();
        loggedInUser.setUserId(2);

        Notification notification = new Notification();
        notification.setId(10);
        notification.setUser(owner);

        when(userRepository.findById(2)).thenReturn(Optional.of(loggedInUser));

        when(notificationRepository.findById(10)).thenReturn(Optional.of(notification));

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> notificationService.markRead(2, 10));

        assertEquals("Notification does not belong to this user.", exception.getMessage());

       verify(notificationRepository,never()).save(any());

    }



}
