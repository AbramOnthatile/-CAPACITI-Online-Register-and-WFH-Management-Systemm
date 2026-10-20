package za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.ticket;

import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.common.QualityResult;

public record TicketActionResponse(TicketDto ticket, QualityResult quality) {
}
