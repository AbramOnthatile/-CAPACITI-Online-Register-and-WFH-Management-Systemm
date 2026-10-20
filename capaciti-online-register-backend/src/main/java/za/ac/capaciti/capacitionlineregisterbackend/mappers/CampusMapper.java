package za.ac.capaciti.capacitionlineregisterbackend.mappers;

import org.springframework.stereotype.Component;

import za.ac.capaciti.capacitionlineregisterbackend.domain.CampusHub;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.campus.CampusDto;

@Component
public class CampusMapper {

    public CampusDto toDto(CampusHub campusHub) {
        if (campusHub == null) {
            return null;
        }

        return new CampusDto(
                campusHub.getId(),
                campusHub.getName(),
                campusHub.getLatitude(),
                campusHub.getLongitude(),
                campusHub.getRadiusM(),
                campusHub.getWhitelistedCidrs());
    }
}