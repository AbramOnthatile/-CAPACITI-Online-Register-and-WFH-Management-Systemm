package za.ac.capaciti.capacitionlineregisterbackend.controller;

import java.util.List;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.scorecard.MyScorecardDto;
import za.ac.capaciti.capacitionlineregisterbackend.service.AssessmentService;

@RestController
@RequestMapping("/api/v1/scorecards")
public class ScorecardController {

    private final AssessmentService assessmentService;

    @Autowired
    public ScorecardController(AssessmentService assessmentService) {
        this.assessmentService = assessmentService;
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('CANDIDATE')")
    public ResponseEntity<List<MyScorecardDto>> myScorecards(Authentication authentication) {
        return ResponseEntity.ok(assessmentService.myScorecards(authentication.getName()));
    }

    @GetMapping("/{assessmentId}")
    @PreAuthorize("hasRole('CANDIDATE')")
    public ResponseEntity<MyScorecardDto> myScorecard(
            Authentication authentication, @PathVariable UUID assessmentId) {
        return ResponseEntity.ok(
                assessmentService.myScorecard(assessmentId, authentication.getName()));
    }
}
