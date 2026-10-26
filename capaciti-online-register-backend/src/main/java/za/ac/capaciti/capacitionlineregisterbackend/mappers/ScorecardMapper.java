package za.ac.capaciti.capacitionlineregisterbackend.mappers;

import java.util.List;
import org.springframework.stereotype.Component;
import za.ac.capaciti.capacitionlineregisterbackend.domain.Assessment;
import za.ac.capaciti.capacitionlineregisterbackend.domain.ScorecardEntry;
import za.ac.capaciti.capacitionlineregisterbackend.domain.User;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.scorecard.AssessmentDetailDto;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.scorecard.AssessmentSummaryDto;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.scorecard.AttendanceSuggestionDto;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.scorecard.EntryDto;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.scorecard.MyScorecardDto;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.scorecard.ScorecardScores;

@Component
public class ScorecardMapper {

    public AssessmentSummaryDto toSummaryDto(
            Assessment assessment, long entryCount, Double groupAveragePercent) {
        return new AssessmentSummaryDto(
                assessment.getId(),
                assessment.getTitle(),
                assessment.getType(),
                assessment.getStatus(),
                assessment.getAssessmentDate(),
                assessment.getPeriodStart(),
                assessment.getPeriodEnd(),
                entryCount,
                toRoundedPercent(groupAveragePercent),
                assessment.getSubmittedAt());
    }

    public EntryDto toEntryDto(ScorecardEntry entry) {
        User candidate = entry.getCandidate();
        return new EntryDto(
                candidate.getId(),
                candidate.getFullName(),
                toScores(entry),
                entry.getOverallPercent(),
                valueOrEmpty(entry.getFeedback()),
                valueOrEmpty(entry.getFeedbackStrengths()),
                valueOrEmpty(entry.getFeedbackImprovements()));
    }

    public AssessmentDetailDto toDetailDto(
            Assessment assessment,
            List<ScorecardEntry> entries,
            Double groupAveragePercent,
            List<AttendanceSuggestionDto> attendanceSuggestions) {
        AssessmentSummaryDto summary = toSummaryDto(assessment, entries.size(), groupAveragePercent);
        return new AssessmentDetailDto(
                summary.id(),
                summary.title(),
                summary.type(),
                summary.status(),
                summary.assessmentDate(),
                summary.periodStart(),
                summary.periodEnd(),
                summary.entryCount(),
                summary.groupAveragePercent(),
                summary.submittedAt(),
                valueOrEmpty(assessment.getGroupFeedback()),
                entries.stream().map(this::toEntryDto).toList(),
                attendanceSuggestions);
    }

    public MyScorecardDto toMyScorecardDto(ScorecardEntry entry) {
        Assessment assessment = entry.getAssessment();
        return new MyScorecardDto(
                assessment.getId(),
                assessment.getTitle(),
                assessment.getType(),
                assessment.getAssessmentDate(),
                toScores(entry),
                entry.getOverallPercent(),
                valueOrEmpty(entry.getFeedback()),
                valueOrEmpty(entry.getFeedbackStrengths()),
                valueOrEmpty(entry.getFeedbackImprovements()),
                valueOrEmpty(assessment.getGroupFeedback()));
    }

    private ScorecardScores toScores(ScorecardEntry entry) {
        return new ScorecardScores(
                entry.getAttendanceScore(),
                entry.getCommunicationScore(),
                entry.getAccountabilityScore(),
                entry.getCreativityScore(),
                entry.getDeliveryScore(),
                entry.getTechSkillsScore());
    }

    private Integer toRoundedPercent(Double percent) {
        return percent == null ? null : (int) Math.round(percent);
    }

    private String valueOrEmpty(String value) {
        return value == null ? "" : value;
    }
}
