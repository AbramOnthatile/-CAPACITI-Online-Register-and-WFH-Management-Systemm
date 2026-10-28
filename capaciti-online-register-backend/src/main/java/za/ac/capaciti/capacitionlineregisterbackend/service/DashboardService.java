package za.ac.capaciti.capacitionlineregisterbackend.service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import za.ac.capaciti.capacitionlineregisterbackend.domain.AttendanceRecord;
import za.ac.capaciti.capacitionlineregisterbackend.domain.DailyPrompt;
import za.ac.capaciti.capacitionlineregisterbackend.domain.User;
import za.ac.capaciti.capacitionlineregisterbackend.domain.WfhRequest;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.dashboard.AttentionItemDto;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.dashboard.CandidateDashboardDto;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.dashboard.ChampionDashboardDto;
import za.ac.capaciti.capacitionlineregisterbackend.enums.TicketStatus;
import za.ac.capaciti.capacitionlineregisterbackend.enums.TicketType;
import za.ac.capaciti.capacitionlineregisterbackend.enums.WfhStatus;
import za.ac.capaciti.capacitionlineregisterbackend.enums.ArrivalStatus;
import za.ac.capaciti.capacitionlineregisterbackend.enums.PromptStatus;
import za.ac.capaciti.capacitionlineregisterbackend.enums.UserRole;
import za.ac.capaciti.capacitionlineregisterbackend.enums.WorkMode;
import za.ac.capaciti.capacitionlineregisterbackend.exception.ResourceNotFoundException;
import za.ac.capaciti.capacitionlineregisterbackend.mappers.AttendanceMapper;
import za.ac.capaciti.capacitionlineregisterbackend.mappers.PromptMapper;
import za.ac.capaciti.capacitionlineregisterbackend.mappers.WfhRequestMapper;
import za.ac.capaciti.capacitionlineregisterbackend.repository.AttendanceRecordRepository;
import za.ac.capaciti.capacitionlineregisterbackend.repository.DailyPromptRepository;
import za.ac.capaciti.capacitionlineregisterbackend.repository.SupportTicketRepository;
import za.ac.capaciti.capacitionlineregisterbackend.repository.UserRepository;
import za.ac.capaciti.capacitionlineregisterbackend.repository.WfhRequestRepository;
import za.ac.capaciti.capacitionlineregisterbackend.util.TimeUtil;

@Service
@Transactional(readOnly = true)
public class DashboardService implements IDashboardService {

    private final UserRepository userRepository;
    private final AttendanceRecordRepository attendanceRepository;
    private final WfhRequestRepository wfhRequestRepository;
    private final DailyPromptRepository dailyPromptRepository;
    private final SupportTicketRepository supportTicketRepository;
    private final AttendanceMapper attendanceMapper;
    private final WfhRequestMapper wfhRequestMapper;
    private final PromptMapper promptMapper;

    public DashboardService(
            UserRepository userRepository,
            AttendanceRecordRepository attendanceRepository,
            WfhRequestRepository wfhRequestRepository,
            DailyPromptRepository dailyPromptRepository,
            SupportTicketRepository supportTicketRepository,
            AttendanceMapper attendanceMapper,
            WfhRequestMapper wfhRequestMapper,
            PromptMapper promptMapper) {
        this.userRepository = userRepository;
        this.attendanceRepository = attendanceRepository;
        this.wfhRequestRepository = wfhRequestRepository;
        this.dailyPromptRepository = dailyPromptRepository;
        this.supportTicketRepository = supportTicketRepository;
        this.attendanceMapper = attendanceMapper;
        this.wfhRequestMapper = wfhRequestMapper;
        this.promptMapper = promptMapper;
    }

    @Override
    public CandidateDashboardDto candidate(String email) {
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResourceNotFoundException("User account was not found."));
        LocalDate today = TimeUtil.today();
        Pageable recent = PageRequest.of(0, 5);
        AttendanceRecord todayRecord = attendanceRepository.findByUserAndAttendanceDate(user, today).orElse(null);
        List<WfhRequest> currentWfh = wfhRequestRepository.findApprovedCoveringForUser(user, today);
        List<DailyPrompt> prompts = dailyPromptRepository.findByUserAndPromptDateOrderByScheduledAtAsc(user, today);

        return new CandidateDashboardDto(
                TimeUtil.now().toInstant(),
                attendanceMapper.toDto(todayRecord),
                attendanceRepository.findByUserOrderByAttendanceDateDesc(user, recent)
                        .map(attendanceMapper::toDto).getContent(),
                currentWfh.isEmpty() ? null : wfhRequestMapper.toDto(currentWfh.get(0)),
                wfhRequestRepository.findByUserOrderByCreatedAtDesc(user, recent)
                        .map(wfhRequestMapper::toDto).getContent(),
                prompts.stream().map(promptMapper::toDto).toList(),
                supportTicketRepository.countByUserAndStatus(user, TicketStatus.OPEN),
                supportTicketRepository.countByUserAndTypeAndStatusAndProlongedTrue(
                        user, TicketType.BLOCKER, TicketStatus.OPEN));
    }

    @Override
    public ChampionDashboardDto champion() {
        LocalDate today = TimeUtil.today();
        List<User> candidates = userRepository.findByRoleAndActive(UserRole.CANDIDATE.name(), true);
        Set<UUID> candidateIds = candidates.stream().map(User::getId).collect(Collectors.toSet());
        List<AttendanceRecord> records = attendanceRepository.findByAttendanceDate(today).stream()
                .filter(record -> candidateIds.contains(record.getUser().getId()))
                .toList();
        Map<UUID, AttendanceRecord> recordsByUser = records.stream()
                .collect(Collectors.toMap(record -> record.getUser().getId(), Function.identity(), (first, ignored) -> first));
        long clockedIn = records.stream().filter(record -> record.getClockInAt() != null).count();
        long onTime = records.stream().filter(record -> record.getClockInAt() != null
                && record.getArrivalStatus() == ArrivalStatus.ON_TIME).count();
        long late = records.stream().filter(record -> record.getArrivalStatus() == ArrivalStatus.LATE_UNEXCUSED
                || record.getArrivalStatus() == ArrivalStatus.LATE_EXCUSED).count();
        long absent = records.stream().filter(record -> record.getArrivalStatus() == ArrivalStatus.ABSENT_UNEXCUSED).count();
        long notYetClockedIn = candidates.stream()
                .filter(candidate -> !recordsByUser.containsKey(candidate.getId())
                        || recordsByUser.get(candidate.getId()).getClockInAt() == null)
                .count();
        long onSite = records.stream().filter(record -> record.getClockInAt() != null
                && record.getWorkMode() == WorkMode.ON_SITE).count();
        long wfh = records.stream().filter(record -> record.getClockInAt() != null
                && record.getWorkMode() == WorkMode.WFH).count();

        List<DailyPrompt> prompts = dailyPromptRepository.findByPromptDate(today);
        long promptsSubmitted = prompts.stream().filter(prompt -> prompt.getStatus() == PromptStatus.SUBMITTED).count();
        long promptsMissed = prompts.stream().filter(prompt -> prompt.getStatus() == PromptStatus.EXPIRED).count();
        long flagged = prompts.stream().filter(DailyPrompt::isAiQualityFlag).count();
        List<WfhRequest> approvedToday = wfhRequestRepository.findApprovedCovering(today);
        long pendingWfh = wfhRequestRepository.search(WfhStatus.PENDING, null, null, null, Pageable.unpaged())
                .getTotalElements();
        long openTickets = supportTicketRepository.search(
                TicketStatus.OPEN, null, null, null, Pageable.unpaged()).getTotalElements();
        long prolongedBlockers = supportTicketRepository.search(
                TicketStatus.OPEN, TicketType.BLOCKER, null, true, Pageable.unpaged()).getTotalElements();

        List<AttentionItemDto> attentionItems = new ArrayList<>();
        for (User candidate : candidates) {
            AttendanceRecord record = recordsByUser.get(candidate.getId());
            if (record == null) {
                attentionItems.add(new AttentionItemDto(candidate.getId(), candidate.getFullName(),
                        "No attendance record for today", null));
            } else if (record.getArrivalStatus() == ArrivalStatus.LATE_UNEXCUSED) {
                attentionItems.add(new AttentionItemDto(candidate.getId(), candidate.getFullName(),
                        "Late arrival requires review", record.getClockInAt()));
            }
        }

        return new ChampionDashboardDto(
                today,
                TimeUtil.now().toInstant(),
                candidates.size(),
                clockedIn,
                onTime,
                late,
                absent,
                notYetClockedIn,
                onSite,
                wfh,
                approvedToday.size(),
                pendingWfh,
                openTickets,
                prolongedBlockers,
                promptsSubmitted,
                promptsMissed,
                flagged,
                attentionItems);
    }
}
