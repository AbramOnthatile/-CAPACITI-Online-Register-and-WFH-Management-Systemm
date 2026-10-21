package za.ac.capaciti.capacitionlineregisterbackend.scheduler;

import java.time.LocalDate;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import za.ac.capaciti.capacitionlineregisterbackend.repository.ReportRepository;
import za.ac.capaciti.capacitionlineregisterbackend.services.IAttendanceService;
import za.ac.capaciti.capacitionlineregisterbackend.util.TimeUtil;

@Component
public class AttendanceScheduler {

    private static final Logger log = LoggerFactory.getLogger(AttendanceScheduler.class);

    private final IAttendanceService attendanceService;
    private final ReportRepository reportRepository;

    public AttendanceScheduler(
            IAttendanceService attendanceService,
            ReportRepository reportRepository) {
        this.attendanceService = attendanceService;
        this.reportRepository = reportRepository;
    }

    @Scheduled(cron = "0 0 10 * * MON-FRI", zone = "${app.timezone}")
    public void markAbsent() {
        try {
            int count = attendanceService.markAbsentForDate(TimeUtil.today());
            if (count > 0) {
                log.info("markAbsent count={}", count);
            }
        } catch (Exception exception) {
            log.error("{}: {}", exception.getClass().getSimpleName(), exception.getMessage());
        }
    }

    @Scheduled(cron = "0 30 16 * * MON-FRI", zone = "${app.timezone}")
    public void closeDay() {
        try {
            LocalDate today = TimeUtil.today();
            long count = reportRepository.countClockedInNoClockOut(today);
            if (count > 0) {
                log.info("closeDay count={}", count);
            }
            // TODO: no column to flag these records yet
        } catch (Exception exception) {
            log.error("{}: {}", exception.getClass().getSimpleName(), exception.getMessage());
        }
    }
}
