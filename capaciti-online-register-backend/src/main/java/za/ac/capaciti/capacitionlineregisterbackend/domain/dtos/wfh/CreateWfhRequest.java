package za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.wfh;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public record CreateWfhRequest(
        @NotBlank @Size(max = 64) String draftKey,
        @NotNull LocalDate startDate,
        @NotNull LocalDate endDate,
        @NotBlank @Size(max = 1000) String reason,
        @NotNull @Valid ReadinessDto readiness
) {
}
