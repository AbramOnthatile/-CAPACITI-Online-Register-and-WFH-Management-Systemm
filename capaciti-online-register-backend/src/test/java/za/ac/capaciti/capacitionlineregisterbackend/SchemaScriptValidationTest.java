package za.ac.capaciti.capacitionlineregisterbackend;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import io.zonky.test.db.postgres.embedded.EmbeddedPostgres;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

import za.ac.capaciti.capacitionlineregisterbackend.enums.ArrivalStatus;
import za.ac.capaciti.capacitionlineregisterbackend.enums.AssessmentStatus;
import za.ac.capaciti.capacitionlineregisterbackend.enums.AssessmentType;
import za.ac.capaciti.capacitionlineregisterbackend.enums.TicketStatus;
import za.ac.capaciti.capacitionlineregisterbackend.enums.TicketType;
import za.ac.capaciti.capacitionlineregisterbackend.enums.WfhStatus;
import za.ac.capaciti.capacitionlineregisterbackend.enums.WorkMode;
import za.ac.capaciti.capacitionlineregisterbackend.repository.AssessmentRepository;
import za.ac.capaciti.capacitionlineregisterbackend.repository.AttendanceRecordRepository;
import za.ac.capaciti.capacitionlineregisterbackend.repository.AuditLogRepository;
import za.ac.capaciti.capacitionlineregisterbackend.repository.DailyPromptRepository;
import za.ac.capaciti.capacitionlineregisterbackend.repository.ReportRepository;
import za.ac.capaciti.capacitionlineregisterbackend.repository.SupportTicketRepository;
import za.ac.capaciti.capacitionlineregisterbackend.repository.UserRepository;
import za.ac.capaciti.capacitionlineregisterbackend.repository.WfhRequestRepository;

// Runs database/schema.sql on a real PostgreSQL 17 and starts the app with
// ddl-auto=validate, the same way it runs against Supabase.
@SpringBootTest
class SchemaScriptValidationTest {

    private static final Path SCHEMA = Path.of("database", "schema.sql");
    private static final EmbeddedPostgres POSTGRES = startWithSchema();

    @DynamicPropertySource
    static void datasource(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", () -> POSTGRES.getJdbcUrl("postgres", "postgres"));
        registry.add("spring.datasource.driver-class-name", () -> "org.postgresql.Driver");
        registry.add("spring.datasource.username", () -> "postgres");
        registry.add("spring.datasource.password", () -> "");
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "validate");
        registry.add("spring.jpa.properties.hibernate.dialect", () -> "org.hibernate.dialect.PostgreSQLDialect");
    }

    @AfterAll
    static void stop() throws IOException {
        POSTGRES.close();
    }

    @Test
    void entitiesValidateAgainstTheScript() {
        // Context startup fails if any table or column is missing or has the wrong type.
    }

    @Autowired private UserRepository userRepository;
    @Autowired private AttendanceRecordRepository attendanceRecordRepository;
    @Autowired private AuditLogRepository auditLogRepository;
    @Autowired private WfhRequestRepository wfhRequestRepository;
    @Autowired private SupportTicketRepository supportTicketRepository;
    @Autowired private AssessmentRepository assessmentRepository;
    @Autowired private DailyPromptRepository dailyPromptRepository;
    @Autowired private ReportRepository reportRepository;

    // H2 accepts null filter parameters that PostgreSQL rejects, so run every
    // optional-filter query here with the filters left empty and filled in.
    @Test
    void searchQueriesRunOnPostgresWithAndWithoutFilters() {
        Pageable page = PageRequest.of(0, 20);
        LocalDate today = LocalDate.of(2026, 10, 28);
        Instant now = Instant.parse("2026-10-28T10:00:00Z");
        UUID id = UUID.randomUUID();

        userRepository.searchUsers(null, null, null, page);
        userRepository.searchUsers("CANDIDATE", true, "ada", page);
        userRepository.searchCandidatesOfChampion(id, null, null, page);
        userRepository.searchCandidatesOfChampion(id, true, "ada", page);
        attendanceRecordRepository.searchAttendanceRecords(null, null, null, null, null, page);
        attendanceRecordRepository.searchAttendanceRecords(id, today, today, WorkMode.WFH, ArrivalStatus.ON_TIME, page);
        attendanceRecordRepository.findActiveCandidatesWithoutRecordOn(today);
        attendanceRecordRepository.findByAttendanceDateAndClockInAtIsNotNullAndClockOutAtIsNull(today);
        auditLogRepository.searchAuditLogs(null, null, null, null, page);
        auditLogRepository.searchAuditLogs(id, "CLOCK_IN", now, now, page);
        wfhRequestRepository.search(null, null, null, null, page);
        wfhRequestRepository.search(WfhStatus.PENDING, id, today, today, page);
        wfhRequestRepository.findApprovedCovering(today);
        supportTicketRepository.search(null, null, null, null, page);
        supportTicketRepository.search(TicketStatus.OPEN, TicketType.BLOCKER, WorkMode.WFH, true, page);
        supportTicketRepository.findOpenBlockersOlderThan(now);
        assessmentRepository.search(null, null, null, null, null, page);
        assessmentRepository.search(id, AssessmentType.WEEKLY, AssessmentStatus.DRAFT, today, today, page);
        assessmentRepository.searchSubmitted(null, null, null, page);
        assessmentRepository.searchSubmitted(AssessmentType.PROJECT, today, today, page);
        dailyPromptRepository.findDueToActivate(now);
        dailyPromptRepository.findOverdue(now);
        reportRepository.countActiveCandidates();
        reportRepository.arrivalStatusCounts(today, today);
        reportRepository.departureStatusCounts(today, today);
        reportRepository.workModeCounts(today, today);
        reportRepository.dailyTrend(today, today);
        reportRepository.perCandidate(today, today);
        reportRepository.lateOrAbsentOn(today);
        reportRepository.countClockedInNoClockOut(today);
        reportRepository.wfhRequestCounts(today, today);
        reportRepository.promptCounts(today, today);
        reportRepository.countFlaggedAttendance(today, today);
        reportRepository.countFlaggedPrompts(today, today);
        reportRepository.countFlaggedWfh(now, now);
        reportRepository.countFlaggedTickets(now, now);
        reportRepository.countOpenTickets();
        reportRepository.countProlongedOpenBlockers();
        reportRepository.countPendingWfh();
        reportRepository.countTicketsCreated(now, now);
        reportRepository.countTicketsResolved(now, now);
    }

    @Test
    void scriptCanBeRunAgain() throws SQLException {
        runSchema(POSTGRES);
    }

    @Test
    void migrationsRunCleanly() throws IOException, SQLException {
        try (var files = Files.list(Path.of("database", "migrations"))) {
            for (Path migration : files.filter(file -> file.toString().endsWith(".sql")).sorted().toList()) {
                runSql(POSTGRES, migration);
            }
        }
    }

    @Test
    void everyTableHasRowLevelSecurity() throws SQLException {
        List<String> tables = new ArrayList<>();
        List<String> withoutRls = new ArrayList<>();
        try (Connection connection = POSTGRES.getPostgresDatabase().getConnection();
             Statement statement = connection.createStatement();
             ResultSet rows = statement.executeQuery(
                     "select tablename, rowsecurity from pg_tables where schemaname = 'public'")) {
            while (rows.next()) {
                tables.add(rows.getString("tablename"));
                if (!rows.getBoolean("rowsecurity")) {
                    withoutRls.add(rows.getString("tablename"));
                }
            }
        }
        assertEquals(11, tables.size(), "tables: " + tables);
        assertTrue(withoutRls.isEmpty(), "tables without RLS: " + withoutRls);
    }

    private static EmbeddedPostgres startWithSchema() {
        try {
            EmbeddedPostgres postgres = EmbeddedPostgres.start();
            // Roles that every Supabase project has; the RLS policies refer to them.
            try (Connection connection = postgres.getPostgresDatabase().getConnection();
                 Statement statement = connection.createStatement()) {
                statement.execute("create role anon; create role authenticated;");
            }
            runSchema(postgres);
            return postgres;
        } catch (IOException exception) {
            throw new UncheckedIOException(exception);
        } catch (SQLException exception) {
            throw new IllegalStateException(exception);
        }
    }

    private static void runSchema(EmbeddedPostgres postgres) throws SQLException {
        runSql(postgres, SCHEMA);
    }

    private static void runSql(EmbeddedPostgres postgres, Path file) throws SQLException {
        String sql;
        try {
            sql = Files.readString(file);
        } catch (IOException exception) {
            throw new UncheckedIOException(exception);
        }
        try (Connection connection = postgres.getPostgresDatabase().getConnection();
             Statement statement = connection.createStatement()) {
            statement.execute(sql);
        }
    }
}
