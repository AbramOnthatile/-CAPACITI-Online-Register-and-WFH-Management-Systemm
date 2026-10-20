package za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.wfh;

import jakarta.validation.constraints.NotNull;

public record ReadinessDto(
        @NotNull Boolean stableInternet,
        @NotNull Boolean powerBackup,
        @NotNull Boolean quietWorkspace,
        @NotNull Boolean laptopReady
) {
}
