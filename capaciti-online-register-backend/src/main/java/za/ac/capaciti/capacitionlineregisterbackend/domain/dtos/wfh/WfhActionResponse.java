package za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.wfh;

import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.common.QualityResult;

public record WfhActionResponse(WfhRequestDto request, QualityResult quality) {
}
