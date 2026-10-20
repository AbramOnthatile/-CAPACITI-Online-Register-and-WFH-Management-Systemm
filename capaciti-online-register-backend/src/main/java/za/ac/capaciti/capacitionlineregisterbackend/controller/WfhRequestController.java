package za.ac.capaciti.capacitionlineregisterbackend.controller;

import java.time.LocalDate;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import jakarta.validation.Valid;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.wfh.CreateWfhRequest;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.wfh.WfhActionResponse;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.wfh.WfhDecisionRequest;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.wfh.WfhRequestDto;
import za.ac.capaciti.capacitionlineregisterbackend.domain.enums.WfhStatus;
import za.ac.capaciti.capacitionlineregisterbackend.service.IWfhRequestService;

@RestController
@RequestMapping("/api/v1")
public class WfhRequestController {
    private final IWfhRequestService wfhRequestService;

    public WfhRequestController(IWfhRequestService wfhRequestService) {
        this.wfhRequestService = wfhRequestService;
    }

    @PostMapping("/wfh-requests")
    @PreAuthorize("hasRole('CANDIDATE')")
    public ResponseEntity<WfhActionResponse> create(Authentication authentication,
                                                  @Valid @RequestBody CreateWfhRequest request) {
        return ResponseEntity.ok(wfhRequestService.create(authentication.getName(), request));
    }

    @GetMapping("/wfh-requests/me")
    @PreAuthorize("hasRole('CANDIDATE')")
    public Page<WfhRequestDto> mine(Authentication authentication,
                                   @PageableDefault(size = 20) Pageable pageable) {
        return wfhRequestService.mine(authentication.getName(), pageable);
    }

    @PatchMapping("/wfh-requests/{id}/cancel")
    @PreAuthorize("hasRole('CANDIDATE')")
    public ResponseEntity<WfhRequestDto> cancel(Authentication authentication, @PathVariable UUID id) {
        return ResponseEntity.ok(wfhRequestService.cancel(id, authentication.getName()));
    }

    @GetMapping("/wfh-requests")
    @PreAuthorize("hasRole('TECH_CHAMP') or hasRole('ADMIN')")
    public Page<WfhRequestDto> search(@RequestParam(required = false) WfhStatus status,
                                     @RequestParam(required = false) UUID userId,
                                     @RequestParam(required = false) LocalDate from,
                                     @RequestParam(required = false) LocalDate to,
                                     @PageableDefault(size = 20) Pageable pageable) {
        return wfhRequestService.search(status, userId, from, to, pageable);
    }

    @GetMapping("/wfh-requests/{id}")
    @PreAuthorize("hasRole('TECH_CHAMP') or hasRole('ADMIN')")
    public ResponseEntity<WfhRequestDto> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(wfhRequestService.getById(id));
    }

    @PatchMapping("/wfh-requests/{id}/decision")
    @PreAuthorize("hasRole('TECH_CHAMP') or hasRole('ADMIN')")
    public ResponseEntity<WfhRequestDto> decide(Authentication authentication,
                                              @PathVariable UUID id,
                                              @Valid @RequestBody WfhDecisionRequest request) {
        return ResponseEntity.ok(wfhRequestService.decide(id, request, authentication.getName()));
    }
}
