package za.ac.capaciti.capacitionlineregisterbackend.controller;

import java.time.LocalDate;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import jakarta.validation.Valid;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.scorecard.AssessmentDetailDto;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.scorecard.AssessmentSummaryDto;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.scorecard.CreateAssessmentRequest;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.scorecard.SaveEntriesRequest;
import za.ac.capaciti.capacitionlineregisterbackend.enums.AssessmentStatus;
import za.ac.capaciti.capacitionlineregisterbackend.enums.AssessmentType;
import za.ac.capaciti.capacitionlineregisterbackend.service.AssessmentService;

@RestController
@RequestMapping("/api/v1/assessments")
public class AssessmentController {

    private final AssessmentService assessmentService;

    @Autowired
    public AssessmentController(AssessmentService assessmentService) {
        this.assessmentService = assessmentService;
    }

    @PostMapping
    @PreAuthorize("hasRole('TECH_CHAMP')")
    public ResponseEntity<AssessmentDetailDto> create(
            Authentication authentication, @Valid @RequestBody CreateAssessmentRequest request) {
        AssessmentDetailDto created = assessmentService.create(authentication.getName(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping
    @PreAuthorize("hasRole('TECH_CHAMP') or hasRole('ADMIN')")
    public ResponseEntity<Page<AssessmentSummaryDto>> list(
            Authentication authentication,
            @RequestParam(required = false) AssessmentType type,
            @RequestParam(required = false) AssessmentStatus status,
            @RequestParam(required = false) LocalDate from,
            @RequestParam(required = false) LocalDate to,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(assessmentService.list(
                authentication.getName(), type, status, from, to, pageable));
    }

    @GetMapping("/{assessmentId}")
    @PreAuthorize("hasRole('TECH_CHAMP') or hasRole('ADMIN')")
    public ResponseEntity<AssessmentDetailDto> getById(
            Authentication authentication, @PathVariable UUID assessmentId) {
        return ResponseEntity.ok(assessmentService.getById(assessmentId, authentication.getName()));
    }

    @PutMapping("/{assessmentId}/entries")
    @PreAuthorize("hasRole('TECH_CHAMP')")
    public ResponseEntity<AssessmentDetailDto> saveEntries(
            Authentication authentication,
            @PathVariable UUID assessmentId,
            @Valid @RequestBody SaveEntriesRequest request) {
        return ResponseEntity.ok(assessmentService.saveEntries(
                assessmentId, authentication.getName(), request));
    }

    @PostMapping("/{assessmentId}/submit")
    @PreAuthorize("hasRole('TECH_CHAMP')")
    public ResponseEntity<AssessmentDetailDto> submit(
            Authentication authentication, @PathVariable UUID assessmentId) {
        return ResponseEntity.ok(assessmentService.submit(assessmentId, authentication.getName()));
    }

    @PostMapping("/{assessmentId}/reopen")
    @PreAuthorize("hasRole('TECH_CHAMP')")
    public ResponseEntity<AssessmentDetailDto> reopen(
            Authentication authentication, @PathVariable UUID assessmentId) {
        return ResponseEntity.ok(assessmentService.reopen(assessmentId, authentication.getName()));
    }

    @DeleteMapping("/{assessmentId}")
    @PreAuthorize("hasRole('TECH_CHAMP')")
    public ResponseEntity<Void> delete(
            Authentication authentication, @PathVariable UUID assessmentId) {
        assessmentService.delete(assessmentId, authentication.getName());
        return ResponseEntity.noContent().build();
    }
}
