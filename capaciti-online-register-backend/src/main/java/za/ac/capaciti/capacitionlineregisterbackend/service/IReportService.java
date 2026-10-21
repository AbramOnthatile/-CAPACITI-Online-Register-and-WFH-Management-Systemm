package za.ac.capaciti.capacitionlineregisterbackend.service;

import java.time.LocalDate;

import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.report.AttendanceSummaryDto;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.report.OverviewReportDto;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.report.WfhSummaryDto;

public interface IReportService {

    OverviewReportDto overview(LocalDate from, LocalDate to);

    AttendanceSummaryDto attendanceSummary(LocalDate from, LocalDate to);

    WfhSummaryDto wfhSummary(LocalDate from, LocalDate to);
}
