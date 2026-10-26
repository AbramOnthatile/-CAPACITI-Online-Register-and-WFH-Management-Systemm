package za.ac.capaciti.capacitionlineregisterbackend.service;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.scorecard.AssessmentDetailDto;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.scorecard.AssessmentSummaryDto;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.scorecard.CreateAssessmentRequest;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.scorecard.MyScorecardDto;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.scorecard.SaveEntriesRequest;
import za.ac.capaciti.capacitionlineregisterbackend.enums.AssessmentStatus;
import za.ac.capaciti.capacitionlineregisterbackend.enums.AssessmentType;

public interface IAssessmentService {

    AssessmentDetailDto create(String email, CreateAssessmentRequest request);

    AssessmentDetailDto saveEntries(UUID assessmentId, String email, SaveEntriesRequest request);

    AssessmentDetailDto submit(UUID assessmentId, String email);

    AssessmentDetailDto reopen(UUID assessmentId, String email);

    void delete(UUID assessmentId, String email);

    Page<AssessmentSummaryDto> list(
            String email,
            AssessmentType type,
            AssessmentStatus status,
            LocalDate from,
            LocalDate to,
            Pageable pageable);

    AssessmentDetailDto getById(UUID assessmentId, String email);

    List<MyScorecardDto> myScorecards(String email);

    MyScorecardDto myScorecard(UUID assessmentId, String email);
}
