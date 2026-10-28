package za.ac.capaciti.capacitionlineregisterbackend.repository;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import za.ac.capaciti.capacitionlineregisterbackend.domain.AttendanceRecord;
import za.ac.capaciti.capacitionlineregisterbackend.domain.User;
import za.ac.capaciti.capacitionlineregisterbackend.enums.ArrivalStatus;
import za.ac.capaciti.capacitionlineregisterbackend.enums.WorkMode;

public interface AttendanceRecordRepository extends JpaRepository<AttendanceRecord, UUID> {

    Optional<AttendanceRecord> findByUserAndAttendanceDate(User user, LocalDate date);

    List<AttendanceRecord> findByAttendanceDate(LocalDate date);

    @EntityGraph(attributePaths = "user")
    List<AttendanceRecord> findByUser_IdInAndAttendanceDateBetween(
            Collection<UUID> userIds, LocalDate fromDate, LocalDate toDate);

    Page<AttendanceRecord> findByUserOrderByAttendanceDateDesc(User user, Pageable pageable);

    @EntityGraph(attributePaths = "user")
    List<AttendanceRecord> findByAttendanceDateAndClockInAtIsNotNullAndClockOutAtIsNull(LocalDate date);

    @Query(value = """
            SELECT a FROM AttendanceRecord a
            WHERE (:userId IS NULL OR a.user.id = :userId)
              AND (cast(:fromDate as LocalDate) IS NULL OR a.attendanceDate >= :fromDate)
              AND (cast(:toDate as LocalDate) IS NULL OR a.attendanceDate <= :toDate)
              AND (:workMode IS NULL OR a.workMode = :workMode)
              AND (:arrivalStatus IS NULL OR a.arrivalStatus = :arrivalStatus)
            ORDER BY a.attendanceDate DESC
            """,
            countQuery = """
            SELECT COUNT(a) FROM AttendanceRecord a
            WHERE (:userId IS NULL OR a.user.id = :userId)
              AND (cast(:fromDate as LocalDate) IS NULL OR a.attendanceDate >= :fromDate)
              AND (cast(:toDate as LocalDate) IS NULL OR a.attendanceDate <= :toDate)
              AND (:workMode IS NULL OR a.workMode = :workMode)
              AND (:arrivalStatus IS NULL OR a.arrivalStatus = :arrivalStatus)
            """)
    Page<AttendanceRecord> searchAttendanceRecords(
            @Param("userId") UUID userId,
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate,
            @Param("workMode") WorkMode workMode,
            @Param("arrivalStatus") ArrivalStatus arrivalStatus,
            Pageable pageable);

    @Query("""
            SELECT u FROM User u
            WHERE u.role = 'CANDIDATE'
              AND u.active = true
              AND NOT EXISTS (
                  SELECT a.id FROM AttendanceRecord a
                  WHERE a.user = u AND a.attendanceDate = :date
              )
            """)
    List<User> findActiveCandidatesWithoutRecordOn(@Param("date") LocalDate date);
}