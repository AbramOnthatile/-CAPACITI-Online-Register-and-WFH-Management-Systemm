package za.ac.capaciti.capacitionlineregisterbackend.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.EnumMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Stream;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.report.AttendanceSummaryDto;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.report.CandidateAttendanceRowDto;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.report.DailyTrendDto;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.report.OverviewReportDto;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.report.PromptStageStatDto;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.report.WfhSummaryDto;
import za.ac.capaciti.capacitionlineregisterbackend.domain.enums.WfhStatus;
import za.ac.capaciti.capacitionlineregisterbackend.enums.ArrivalStatus;
import za.ac.capaciti.capacitionlineregisterbackend.enums.DepartureStatus;
import za.ac.capaciti.capacitionlineregisterbackend.enums.PromptStage;
import za.ac.capaciti.capacitionlineregisterbackend.enums.PromptStatus;
import za.ac.capaciti.capacitionlineregisterbackend.enums.WorkMode;
import za.ac.capaciti.capacitionlineregisterbackend.exception.BadRequestException;
import za.ac.capaciti.capacitionlineregisterbackend.repository.ReportRepository;
import za.ac.capaciti.capacitionlineregisterbackend.repository.ReportRepository.CandidateRow;
import za.ac.capaciti.capacitionlineregisterbackend.repository.ReportRepository.DailyRow;
import za.ac.capaciti.capacitionlineregisterbackend.repository.ReportRepository.PromptStatRow;
import za.ac.capaciti.capacitionlineregisterbackend.repository.ReportRepository.StatusCount;
import za.ac.capaciti.capacitionlineregisterbackend.util.TimeUtil;

@Service
public class ReportService implements IReportService {

    private final ReportRepository reportRepository;

    public ReportService(ReportRepository reportRepository) {
        this.reportRepository = reportRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public OverviewReportDto overview(LocalDate from, LocalDate to) {
        DateRange range = normalizeRange(from, to);
        List<StatusCount> arrivals = reportRepository.arrivalStatusCounts(range.from(), range.to());
        long totalRecords = sumCounts(arrivals);
        long clockedIn = reportRepository.dailyTrend(range.from(), range.to()).stream()
                .mapToLong(DailyRow::getPresent)
                .sum();
        long onTime = countFor(arrivals, ArrivalStatus.ON_TIME.name());
        long late = countFor(arrivals, ArrivalStatus.LATE_UNEXCUSED.name())
                + countFor(arrivals, ArrivalStatus.LATE_EXCUSED.name());
        long absent = countFor(arrivals, ArrivalStatus.ABSENT_UNEXCUSED.name());
        long wfhDays = countFor(
                reportRepository.workModeCounts(range.from(), range.to()),
                WorkMode.WFH.name());
        Map<String, Long> wfhRequests = toCountMap(
                reportRepository.wfhRequestCounts(range.from(), range.to()));
        Instant start = TimeUtil.toInstant(range.from(), LocalTime.MIN);
        Instant end = TimeUtil.toInstant(range.to().plusDays(1), LocalTime.MIN);

        return new OverviewReportDto(
                range.from(),
                range.to(),
                reportRepository.countActiveCandidates(),
                percentage(clockedIn, totalRecords),
                percentage(onTime, clockedIn),
                late,
                absent,
                wfhDays,
                countFor(wfhRequests, WfhStatus.PENDING.name()),
                countFor(wfhRequests, WfhStatus.APPROVED.name()),
                countFor(wfhRequests, WfhStatus.REJECTED.name()),
                reportRepository.countOpenTickets(),
                reportRepository.countProlongedOpenBlockers(),
                reportRepository.countFlaggedAttendance(range.from(), range.to())
                        + reportRepository.countFlaggedPrompts(range.from(), range.to())
                        + reportRepository.countFlaggedWfh(start, end)
                        + reportRepository.countFlaggedTickets(start, end));
    }

    @Override
    @Transactional(readOnly = true)
    public AttendanceSummaryDto attendanceSummary(LocalDate from, LocalDate to) {
        DateRange range = normalizeRange(from, to);

        return new AttendanceSummaryDto(
                range.from(),
                range.to(),
                countsWithZeros(ArrivalStatus.values(),
                        reportRepository.arrivalStatusCounts(range.from(), range.to())),
                countsWithZeros(DepartureStatus.values(),
                        reportRepository.departureStatusCounts(range.from(), range.to())),
                countsWithZeros(WorkMode.values(),
                        reportRepository.workModeCounts(range.from(), range.to())),
                reportRepository.dailyTrend(range.from(), range.to()).stream()
                        .map(this::toDailyTrend)
                        .toList(),
                reportRepository.perCandidate(range.from(), range.to()).stream()
                        .map(this::toCandidateRow)
                        .toList());
    }

    @Override
    @Transactional(readOnly = true)
    public WfhSummaryDto wfhSummary(LocalDate from, LocalDate to) {
        DateRange range = normalizeRange(from, to);
        Map<String, Long> requestCounts = countsWithZeros(
                WfhStatus.values(),
                reportRepository.wfhRequestCounts(range.from(), range.to()));
        Map<PromptStage, PromptStageCounts> promptCounts = new EnumMap<>(PromptStage.class);
        for (PromptStatRow row : reportRepository.promptCounts(range.from(), range.to())) {
            PromptStage stage = PromptStage.valueOf(row.getStage());
            PromptStageCounts counts = promptCounts.computeIfAbsent(stage, ignored -> new PromptStageCounts());
            if (PromptStatus.SUBMITTED.name().equals(row.getStatus())) {
                counts.submitted += row.getCount();
            } else if (PromptStatus.EXPIRED.name().equals(row.getStatus())) {
                counts.expired += row.getCount();
            } else {
                counts.other += row.getCount();
            }
        }
        List<PromptStageStatDto> promptCompletion = Stream.of(PromptStage.values())
                .map(stage -> {
                    PromptStageCounts counts = promptCounts.getOrDefault(stage, new PromptStageCounts());
                    return new PromptStageStatDto(stage.name(), counts.submitted, counts.expired, counts.other);
                })
                .toList();
        Instant start = TimeUtil.toInstant(range.from(), LocalTime.MIN);
        Instant end = TimeUtil.toInstant(range.to().plusDays(1), LocalTime.MIN);

        return new WfhSummaryDto(
                range.from(),
                range.to(),
                requestCounts,
                countFor(reportRepository.workModeCounts(range.from(), range.to()), WorkMode.WFH.name()),
                promptCompletion,
                reportRepository.countTicketsCreated(start, end),
                reportRepository.countTicketsResolved(start, end),
                reportRepository.countProlongedOpenBlockers());
    }

    private DateRange normalizeRange(LocalDate from, LocalDate to) {
        LocalDate normalizedTo = to == null ? TimeUtil.today() : to;
        LocalDate normalizedFrom = from == null ? normalizedTo.minusDays(29) : from;
        if (normalizedFrom.isAfter(normalizedTo)) {
            throw new BadRequestException("'from' must not be after 'to'");
        }
        if (ChronoUnit.DAYS.between(normalizedFrom, normalizedTo) + 1 > 366) {
            throw new BadRequestException("Range is limited to 366 days");
        }
        return new DateRange(normalizedFrom, normalizedTo);
    }

    private double percentage(long numerator, long denominator) {
        if (denominator == 0) {
            return 0;
        }
        return BigDecimal.valueOf(numerator)
                .multiply(BigDecimal.valueOf(100))
                .divide(BigDecimal.valueOf(denominator), 1, RoundingMode.HALF_UP)
                .doubleValue();
    }

    private long sumCounts(List<StatusCount> rows) {
        return rows.stream().mapToLong(StatusCount::getCount).sum();
    }

    private long countFor(List<StatusCount> rows, String status) {
        return rows.stream()
                .filter(row -> status.equals(row.getStatus()))
                .mapToLong(StatusCount::getCount)
                .sum();
    }

    private long countFor(Map<String, Long> counts, String status) {
        return counts.getOrDefault(status, 0L);
    }

    private Map<String, Long> toCountMap(List<StatusCount> rows) {
        Map<String, Long> counts = new LinkedHashMap<>();
        rows.forEach(row -> counts.merge(row.getStatus(), row.getCount(), Long::sum));
        return counts;
    }

    private <E extends Enum<E>> Map<String, Long> countsWithZeros(
            E[] values, List<StatusCount> rows) {
        Map<String, Long> counts = new LinkedHashMap<>();
        for (E value : values) {
            counts.put(value.name(), 0L);
        }
        rows.forEach(row -> {
            if (row.getStatus() != null) {
                counts.merge(row.getStatus(), row.getCount(), Long::sum);
            }
        });
        return counts;
    }

    private DailyTrendDto toDailyTrend(DailyRow row) {
        return new DailyTrendDto(row.getDate(), row.getPresent(), row.getLate(), row.getAbsent());
    }

    private CandidateAttendanceRowDto toCandidateRow(CandidateRow row) {
        return new CandidateAttendanceRowDto(
                row.getUserId(),
                row.getFullName(),
                row.getPresent(),
                row.getOnTime(),
                row.getLate(),
                row.getAbsent(),
                row.getPartialDay(),
                row.getLateClockout());
    }

    private record DateRange(LocalDate from, LocalDate to) {
    }

    private static final class PromptStageCounts {
        private long submitted;
        private long expired;
        private long other;
    }
}
