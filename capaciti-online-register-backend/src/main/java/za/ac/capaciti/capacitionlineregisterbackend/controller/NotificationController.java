package za.ac.capaciti.capacitionlineregisterbackend.controller;

import java.util.List;
import java.util.UUID;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.notification.AnnouncementResponse;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.notification.CreateAnnouncementRequest;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.notification.NotificationDto;
import za.ac.capaciti.capacitionlineregisterbackend.service.NotificationService;

@RestController
@RequestMapping("/api/v1")
public class NotificationController {
    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping("/notifications/me")
    @PreAuthorize("hasRole('CANDIDATE')")
    public List<NotificationDto> mine(Authentication authentication) {
        return notificationService.mine(authentication.getName());
    }

    @PatchMapping("/notifications/{id}/read")
    @PreAuthorize("hasRole('CANDIDATE')")
    public ResponseEntity<NotificationDto> markRead(Authentication authentication, @PathVariable UUID id) {
        return ResponseEntity.ok(notificationService.markRead(id, authentication.getName()));
    }

    @PostMapping("/announcements")
    @PreAuthorize("hasRole('TECH_CHAMP')")
    public ResponseEntity<AnnouncementResponse> announce(
            Authentication authentication,
            @Valid @RequestBody CreateAnnouncementRequest request) {
        return ResponseEntity.ok(notificationService.announce(authentication.getName(), request));
    }
}
