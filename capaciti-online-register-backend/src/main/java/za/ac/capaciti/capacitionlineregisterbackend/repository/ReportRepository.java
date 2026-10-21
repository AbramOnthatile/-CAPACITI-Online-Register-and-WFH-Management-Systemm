package za.ac.capaciti.capacitionlineregisterbackend.repository;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

import za.ac.capaciti.capacitionlineregisterbackend.domain.AttendanceRecord;

public interface ReportRepository extends Repository<AttendanceRecord, UUID> {

    @Query("""
            select count(u)
            from User u
            where u.role = :#{T(za.ac.capaciti.capacitionlineregisterbackend.enums.UserRole).CANDIDATE.name()}
              and u.active = true
            """)
    long countActiveCandidates();

    @Query("""
            select a.arrivalStatus as status, count(a) as count
            from AttendanceRecord a
            where a.attendanceDate between :from and :to
            group by a.arrivalStatus
            """)
    List<StatusCount> arrivalStatusCounts(@Param("from") LocalDate from, @Param("to") LocalDate to);

    @Query("""
            select a.departureStatus as status, count(a) as count
            from AttendanceRecord a
            where a.attendanceDate between :from and :to
            group by a.departureStatus
            """)
    List<StatusCount> departureStatusCounts(@Param("from") LocalDate from, @Param("to") LocalDate to);

    @Query("""
            select a.workMode as status, count(a) as count
            from AttendanceRecord a
            where a.attendanceDate between :from and :to
            group by a.workMode
            """)
    List<StatusCount> workModeCounts(@Param("from") LocalDate from, @Param("to") LocalDate to);

    @Query("""
            select a.attendanceDate as date,
                   count(case when a.clockInAt is not null then a.id end) as present,
                   count(case when a.arrivalStatus = :#{T(za.ac.capaciti.capacitionlineregisterbackend.enums.ArrivalStatus).LATE_UNEXCUSED}
                                   or a.arrivalStatus = :#{T(za.ac.capaciti.capacitionlineregisterbackend.enums.ArrivalStatus).LATE_EXCUSED}
                              then a.id end) as late,
                   count(case when a.arrivalStatus = :#{T(za.ac.capaciti.capacitionlineregisterbackend.enums.ArrivalStatus).ABSENT_UNEXCUSED}
                              then a.id end) as absent
            from AttendanceRecord a
            where a.attendanceDate between :from and :to
            group by a.attendanceDate
            order by a.attendanceDate
            """)
    List<DailyRow> dailyTrend(@Param("from") LocalDate from, @Param("to") LocalDate to);

    @Query("""
            select u.id as userId,
                   concat(u.firstName, concat(' ', u.lastName)) as fullName,
                   count(case when a.clockInAt is not null then a.id end) as present,
                   count(case when a.arrivalStatus = :#{T(za.ac.capacitionlineregisterbackend.enums.ArrivalStatus).ON_TIME}
                              then a.id end) as onTime,
                   count(case when a.arrivalStatus = :#{T(za.ac.capacitionlineregisterbackend.enums.ArrivalStatus).LATE_UNEXCUSED}
                                   or a.arrivalStatus = :#{T(za.ac.capacitionlineregisterbackend.enums.ArrivalStatus).LATE_EXCUSED}
                              then a.id end) as late,
                   count(case when a.arrivalStatus = :#{T(za.ac.capaciti.capacitionlineregisterbackend.enums.ArrivalStatus).ABSENT_UNEXCUSED}
                              then a.id end) as absent,
                   count(case when a.departureStatus = :#{T(za.ac.capaciti.capacitionlineregisterbackend.enums.DepartureStatus).PARTIAL_DAY}
                              then a.id end) as partialDay,
                   count(case when a.departureStatus = :#{T(za.ac.capaciti.capacitionlineregisterbackend.enums.DepartureStatus).LATE_CLOCKOUT}
                              then a.id end) as lateClockout
            from AttendanceRecord a
            join a.user u
            where a.attendanceDate between :from and :to
            group by u.id, u.firstName, u.lastName
            order by fullName
            """)
    List<CandidateRow> perCandidate(@Param("from") LocalDate from, @Param("to") LocalDate to);

    @Query("""
            select u.id as userId,
                   concat(u.firstName, concat(' ', u.lastName)) as fullName,
                   a.arrivalStatus as arrivalStatus,
                   a.clockInAt as clockInAt
            from AttendanceRecord a
            join a.user u
            where a.attendanceDate = :date
              and (a.arrivalStatus = :#{T(za.ac.capaciti.capacitionlineregisterbackend.enums.ArrivalStatus).LATE_UNEXCUSED}
                   or a.arrivalStatus = :#{T(za.ac.capaciti.capacitionlineregisterbackend.enums.ArrivalStatus).ABSENT_UNEXCUSED})
            """)
    List<AttentionRow> lateOrAbsentOn(@Param("date") LocalDate date);

    @Query("""
            select count(a)
            from AttendanceRecord a
            where a.attendanceDate = :date
              and a.clockInAt is not null
              and a.clockOutAt is null
            """)
    long countClockedInNoClockOut(@Param("date") LocalDate date);

    @Query("""
            select w.status as status, count(w) as count
            from WfhRequest w
            where w.startDate <= :to and w.endDate >= :from
            group by w.status
            """)
    List<StatusCount> wfhRequestCounts(@Param("from") LocalDate from, @Param("to") LocalDate to);

    @Query("""
            select p.stage as stage, p.status as status, count(p) as count
            from DailyPrompt p
            where p.promptDate between :from and :to
            group by p.stage, p.status
            """)
    List<PromptStatRow> promptCounts(@Param("from") LocalDate from, @Param("to") LocalDate to);

    @Query("""
            select count(a)
            from AttendanceRecord a
            where a.attendanceDate between :from and :to
              and a.aiQualityFlag = true
            """)
    long countFlaggedAttendance(@Param("from") LocalDate from, @Param("to") LocalDate to);

    @Query("""
            select count(p)
            from DailyPrompt p
            where p.promptDate between :from and :to
              and p.aiQualityFlag = true
            """)
    long countFlaggedPrompts(@Param("from") LocalDate from, @Param("to") LocalDate to);

    @Query("""
            select count(w)
            from WfhRequest w
            where w.createdAt between :from and :to
              and w.aiQualityFlag = true
            """)
    long countFlaggedWfh(@Param("from") Instant from, @Param("to") Instant to);

    @Query("""
            select count(t)
            from SupportTicket t
            where t.createdAt between :from and :to
              and t.aiQualityFlag = true
            """)
    long countFlaggedTickets(@Param("from") Instant from, @Param("to") Instant to);

    @Query("""
            select count(t)
            from SupportTicket t
            where t.status = :#{T(za.ac.capaciti.capacitionlineregisterbackend.domain.enums.TicketStatus).OPEN}
            """)
    long countOpenTickets();

    @Query("""
            select count(t)
            from SupportTicket t
            where t.status = :#{T(za.ac.capaciti.capacitionlineregisterbackend.domain.enums.TicketStatus).OPEN}
              and t.type = :#{T(za.ac.capaciti.capacitionlineregisterbackend.domain.enums.TicketType).BLOCKER}
              and t.prolonged = true
            """)
    long countProlongedOpenBlockers();

    @Query("""
            select count(w)
            from WfhRequest w
            where w.status = :#{T(za.ac.capaciti.capacitionlineregisterbackend.domain.enums.WfhStatus).PENDING}
            """)
    long countPendingWfh();

    @Query("""
            select count(t)
            from SupportTicket t
            where t.createdAt between :from and :to
            """)
    long countTicketsCreated(@Param("from") Instant from, @Param("to") Instant to);

    @Query("""
            select count(t)
            from SupportTicket t
            where t.resolvedAt between :from and :to
              and t.status = :#{T(za.ac.capaciti.capacitionlineregisterbackend.domain.enums.TicketStatus).RESOLVED}
            """)
    long countTicketsResolved(@Param("from") Instant from, @Param("to") Instant to);

    interface StatusCount {
        String getStatus();

        long getCount();
    }

    interface DailyRow {
        LocalDate getDate();

        long getPresent();

        long getLate();

        long getAbsent();
    }

    interface CandidateRow {
        UUID getUserId();

        String getFullName();

        long getPresent();

        long getOnTime();

        long getLate();

        long getAbsent();

        long getPartialDay();

        long getLateClockout();
    }

    interface AttentionRow {
        UUID getUserId();

        String getFullName();

        String getArrivalStatus();

        Instant getClockInAt();
    }

    interface PromptStatRow {
        String getStage();

        String getStatus();

        long getCount();
    }
}
