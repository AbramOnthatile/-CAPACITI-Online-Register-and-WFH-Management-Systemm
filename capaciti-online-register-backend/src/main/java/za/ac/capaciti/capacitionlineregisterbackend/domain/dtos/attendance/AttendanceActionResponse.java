package za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.attendance;

import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.common.QualityResult;

public record AttendanceActionResponse(
        AttendanceDto attendance,
        boolean requiresReason,
        QualityResult quality) {
}
