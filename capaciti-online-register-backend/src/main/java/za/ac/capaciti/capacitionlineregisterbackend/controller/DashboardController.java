package za.ac.capaciti.capacitionlineregisterbackend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.dashboard.CandidateDashboardDto;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.dashboard.ChampionDashboardDto;
import za.ac.capaciti.capacitionlineregisterbackend.service.IDashboardService;

@RestController
@RequestMapping("/api/v1/dashboard")
public class DashboardController {

    private final IDashboardService dashboardService;

    public DashboardController(IDashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/candidate")
    @PreAuthorize("hasRole('CANDIDATE')")
    public ResponseEntity<CandidateDashboardDto> candidate(Authentication authentication) {
        return ResponseEntity.ok(dashboardService.candidate(authentication.getName()));
    }

    @GetMapping("/champion")
    @PreAuthorize("hasRole('TECH_CHAMP') or hasRole('ADMIN')")
    public ResponseEntity<ChampionDashboardDto> champion() {
        return ResponseEntity.ok(dashboardService.champion());
    }
}
