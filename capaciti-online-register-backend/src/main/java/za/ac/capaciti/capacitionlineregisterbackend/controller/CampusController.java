package za.ac.capaciti.capacitionlineregisterbackend.controller;

import java.util.List;
import java.util.UUID;

import jakarta.validation.Valid;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import za.ac.capaciti.capacitionlineregisterbackend.domain.User;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.campus.CampusDto;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.campus.UpdateCampusRequest;
import za.ac.capaciti.capacitionlineregisterbackend.service.ICampusService;

@RestController
@RequestMapping("/api/v1/campuses")
public class CampusController {

    private final ICampusService campusService;

    public CampusController(ICampusService campusService) {
        this.campusService = campusService;
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<CampusDto>> list() {
        return ResponseEntity.ok(campusService.list());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CampusDto> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateCampusRequest request,
            @AuthenticationPrincipal User actor) {
        return ResponseEntity.ok(campusService.update(id, request, actor));
    }

    @PostMapping("/{id}/whitelist/current-ip")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CampusDto> addCurrentIp(
            @PathVariable UUID id,
            HttpServletRequest request,
            @AuthenticationPrincipal User actor) {
        return ResponseEntity.ok(campusService.addCurrentIp(id, request, actor));
    }

    @DeleteMapping("/{id}/whitelist")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CampusDto> removeCidr(
            @PathVariable UUID id,
            @RequestParam String cidr,
            @AuthenticationPrincipal User actor) {
        return ResponseEntity.ok(campusService.removeCidr(id, cidr, actor));
    }
}