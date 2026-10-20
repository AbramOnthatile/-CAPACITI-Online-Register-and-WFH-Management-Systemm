package za.ac.capaciti.capacitionlineregisterbackend.controller;

import java.util.UUID;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.prompt.PromptListResponse;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.prompt.SubmitPromptRequest;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.prompt.SubmitPromptResponse;
import za.ac.capaciti.capacitionlineregisterbackend.service.IPromptService;

@RestController
@RequestMapping("/api/v1/prompts")
@PreAuthorize("hasRole('CANDIDATE')")
public class PromptController {

    private final IPromptService promptService;

    public PromptController(IPromptService promptService) {
        this.promptService = promptService;
    }

    @GetMapping("/active")
    public ResponseEntity<PromptListResponse> active(Authentication authentication) {
        return ResponseEntity.ok(promptService.active(authentication.getName()));
    }

    @GetMapping("/today")
    public ResponseEntity<PromptListResponse> today(Authentication authentication) {
        return ResponseEntity.ok(promptService.today(authentication.getName()));
    }

    @PostMapping("/{id}/submit")
    public ResponseEntity<SubmitPromptResponse> submit(
            Authentication authentication,
            @PathVariable UUID id,
            @Valid @RequestBody SubmitPromptRequest request) {
        return ResponseEntity.ok(promptService.submit(authentication.getName(), id, request));
    }
}