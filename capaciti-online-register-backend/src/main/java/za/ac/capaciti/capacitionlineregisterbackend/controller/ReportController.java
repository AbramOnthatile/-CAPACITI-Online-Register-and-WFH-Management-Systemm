package za.ac.capaciti.capacitionlineregisterbackend.controller;

import java.time.LocalDate;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.report.AttendanceSummaryDto;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.report.OverviewReportDto;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.report.WfhSummaryDto;
import za.ac.capaciti.capacitionlineregisterbackend.service.IReportService;

@RestController
@RequestMapping("/api/v1/reports")
@PreAuthorize("hasRole('TECH_CHAMP') or hasRole('ADMIN')")
public class ReportController {

    private final IReportService reportService;

    public ReportController(IReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping("/overview")
    public ResponseEntity<OverviewReportDto> overview(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(reportService.overview(from, to));
    }

    @GetMapping("/attendance-summary")
    public ResponseEntity<AttendanceSummaryDto> attendanceSummary(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(reportService.attendanceSummary(from, to));
    }

    @GetMapping("/wfh-summary")
    public ResponseEntity<WfhSummaryDto> wfhSummary(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(reportService.wfhSummary(from, to));
    }
}
