package za.ac.capaciti.capacitionlineregisterbackend.service;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import za.ac.capaciti.capacitionlineregisterbackend.domain.Notification;
import za.ac.capaciti.capacitionlineregisterbackend.domain.User;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.notification.AnnouncementResponse;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.notification.CreateAnnouncementRequest;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.notification.NotificationDto;
import za.ac.capaciti.capacitionlineregisterbackend.enums.UserRole;
import za.ac.capaciti.capacitionlineregisterbackend.exception.ResourceNotFoundException;
import za.ac.capaciti.capacitionlineregisterbackend.repository.NotificationRepository;
import za.ac.capaciti.capacitionlineregisterbackend.repository.UserRepository;

@Service
public class NotificationService {
    private static final String ANNOUNCEMENT = "Announcement";

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;

    public NotificationService(
            NotificationRepository notificationRepository,
            UserRepository userRepository,
            AuditService auditService) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public List<NotificationDto> mine(String email) {
        User recipient = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));
        return notificationRepository.findByRecipientOrderByCreatedAtDesc(recipient).stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public NotificationDto markRead(UUID id, String email) {
        User recipient = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));
        Notification notification = notificationRepository.findByIdAndRecipient(id, recipient)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found: " + id));
        notification.setRead(true);
        return toDto(notificationRepository.save(notification));
    }

    @Transactional
    public AnnouncementResponse announce(String email, CreateAnnouncementRequest request) {
        User champion = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));
        List<User> recipients = userRepository.findByRoleAndActive(
                UserRole.CANDIDATE.name(), true);
        if (recipients.isEmpty()) {
            return new AnnouncementResponse(0);
        }

        List<Notification> notifications = recipients.stream()
                .map(recipient -> new Notification(
                        recipient,
                        champion,
                        request.title().trim(),
                        request.message().trim(),
                        ANNOUNCEMENT))
                .toList();
        notificationRepository.saveAll(notifications);
        auditService.log("ANNOUNCEMENT_PUBLISHED", null, "Notification", Map.of(
                "title", request.title().trim(),
                "recipientCount", recipients.size()));
        return new AnnouncementResponse(recipients.size());
    }

    private NotificationDto toDto(Notification notification) {
        return new NotificationDto(
                notification.getId(),
                notification.getTitle(),
                notification.getMessage(),
                notification.getCreatedAt(),
                notification.getType(),
                notification.isRead());
    }
}
