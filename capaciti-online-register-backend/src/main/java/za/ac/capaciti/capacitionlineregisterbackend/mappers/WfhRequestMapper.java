package za.ac.capaciti.capacitionlineregisterbackend.mappers;

import java.util.Map;
import org.springframework.stereotype.Component;
import za.ac.capaciti.capacitionlineregisterbackend.domain.WfhRequest;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.wfh.ReadinessDto;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.wfh.WfhRequestDto;

@Component
public class WfhRequestMapper {

    public WfhRequestDto toDto(WfhRequest request) {
        if (request == null) {
            return null;
        }

        Map<String, Object> readinessMap = request.getReadiness();
        ReadinessDto readinessDto = null;
        if (readinessMap != null) {
            readinessDto = new ReadinessDto(
                    readinessMap.get("stableInternet") != null ? (Boolean) readinessMap.get("stableInternet") : null,
                    readinessMap.get("powerBackup") != null ? (Boolean) readinessMap.get("powerBackup") : null,
                    readinessMap.get("quietWorkspace") != null ? (Boolean) readinessMap.get("quietWorkspace") : null,
                    readinessMap.get("laptopReady") != null ? (Boolean) readinessMap.get("laptopReady") : null
            );
        }

        return new WfhRequestDto(
                request.getId(),
                request.getUser() != null ? request.getUser().getId() : null,
                request.getUser() != null ? request.getUser().getFullName() : null,
                request.getStartDate(),
                request.getEndDate(),
                request.getReason(),
                readinessDto,
                request.getStatus(),
                request.getReviewedBy() != null ? request.getReviewedBy().getFullName() : null,
                request.getReviewedAt(),
                request.getReviewComment(),
                request.isAiQualityFlag(),
                request.getCreatedAt()
        );
    }
}
