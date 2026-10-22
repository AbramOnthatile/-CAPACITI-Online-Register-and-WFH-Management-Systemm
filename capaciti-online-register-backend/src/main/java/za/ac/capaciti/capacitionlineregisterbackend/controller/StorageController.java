package za.ac.capaciti.capacitionlineregisterbackend.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.storage.SignedUrlResponse;
import za.ac.capaciti.capacitionlineregisterbackend.service.StorageService;

@RestController
@RequestMapping("/api/v1/files")
public class StorageController {

    private final StorageService storageService;

    @Autowired
    public StorageController(StorageService storageService) {
        this.storageService = storageService;
    }

    @GetMapping("/signed-url")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<SignedUrlResponse> signedUrl(
            Authentication authentication,
            @RequestParam String bucket,
            @RequestParam String path) {
        return ResponseEntity.ok(storageService.signedUrl(authentication.getName(), bucket, path));
    }
}
