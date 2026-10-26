package za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.scorecard;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import za.ac.capaciti.capacitionlineregisterbackend.enums.AssessmentType;

public record CreateAssessmentRequest(
        @NotBlank @Size(max = 120) String title,
        @NotNull AssessmentType type,
        @NotNull LocalDate assessmentDate,
        LocalDate periodStart,
        LocalDate periodEnd) {
}
