package za.ac.capaciti.capacitionlineregisterbackend.service;

import java.time.LocalDate;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.wfh.CreateWfhRequest;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.wfh.WfhActionResponse;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.wfh.WfhDecisionRequest;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.wfh.WfhRequestDto;
import za.ac.capaciti.capacitionlineregisterbackend.domain.enums.WfhStatus;

public interface IWfhRequestService {
    WfhActionResponse create(String email, CreateWfhRequest request);
    Page<WfhRequestDto> mine(String email, Pageable pageable);
    Page<WfhRequestDto> search(WfhStatus status, UUID userId, LocalDate from, LocalDate to, Pageable pageable);
    WfhRequestDto getById(UUID id);
    WfhRequestDto decide(UUID id, WfhDecisionRequest request, String actorEmail);
    WfhRequestDto cancel(UUID id, String email);
}
