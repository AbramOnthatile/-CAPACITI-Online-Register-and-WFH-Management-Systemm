package za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.wfh;

import jakarta.validation.constraints.Size;

public record WfhDecisionRequest(boolean approved, @Size(max = 500) String comment) {
}
